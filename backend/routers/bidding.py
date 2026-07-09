from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import models, schemas
from database import get_db
from middleware import get_current_tenant

router = APIRouter(
    prefix="/api/marketplace",
    tags=["Freight Bidding Marketplace"]
)

@router.get("/loads", response_model=List[schemas.LoadPostResponse])
def get_marketplace_board(
    db: Session = Depends(get_db),
    current_tenant: schemas.TokenData = Depends(get_current_tenant)
):
    """
    Fetches active listings available for public carrier bidding.
    Excludes loads cancelled or fully completed to keep the live board fresh.
    """
    loads = db.query(models.LoadPost).filter(
        models.LoadPost.status.in_(["OPEN", "BIDDING"])
    ).order_by(models.LoadPost.created_at.desc()).all()
    
    return loads


@router.post("/loads/{load_id}/bid", response_model=schemas.BidResponse)
def submit_carrier_bid(
    load_id: int,
    bid_data: schemas.BidCreate,
    db: Session = Depends(get_db),
    current_tenant: schemas.TokenData = Depends(get_current_tenant)
):
    """
    Submits a competitive carrier bid on a listed load posting.
    Ensures shippers cannot place self-bids on their own postings.
    """
    # 1. Target load post presence verification
    target_load = db.query(models.LoadPost).filter(models.LoadPost.id == load_id).first()
    if not target_load:
        raise HTTPException(status_code=404, detail="Requested shipment posting not found.")

    # 2. Prevent anti-competitive loop: Companies cannot place bids on their own posted freight
    if target_load.company_id == current_tenant.company_id:
        raise HTTPException(
            status_code=400, 
            detail="Operation rejected. Shippers are disallowed from bidding on their own listings."
        )

    # 3. Prevent duplicate bidding from the same carrier company
    existing_bid = db.query(models.Bid).filter(
        models.Bid.load_post_id == load_id,
        models.Bid.carrier_company_id == current_tenant.company_id
    ).first()
    
    if existing_bid:
        raise HTTPException(
            status_code=400, 
            detail="An active carrier offer has already been recorded for this freight corridor."
        )

    # 4. Commit fresh carrier proposal
    new_bid = models.Bid(
        load_post_id=load_id,
        carrier_company_id=current_tenant.company_id,
        bid_amount=bid_data.bid_amount,
        estimated_delivery_hours=bid_data.estimated_delivery_hours,
        status="PENDING"
    )
    
    # 5. Dynamically pivot target load status index if first bid placed
    if target_load.status == "OPEN":
        target_load.status = "BIDDING"

    db.add(new_bid)
    db.commit()
    db.refresh(new_bid)
    
    return new_bid

@router.post("/loads", response_model=schemas.LoadPostResponse)
def create_new_load(
    load_data: schemas.LoadPostCreate,
    db: Session = Depends(get_db),
    current_tenant: schemas.TokenData = Depends(get_current_tenant)
):
    """
    Allows a Shipper company to post a new load to the marketplace board.
    """
    new_load = models.LoadPost(
        company_id=current_tenant.company_id,
        title=load_data.title,
        cargo_description=load_data.cargo_description,
        weight_tons=load_data.weight_tons,
        origin_hub=load_data.origin_hub,
        destination_hub=load_data.destination_hub,
        target_price=load_data.target_price,
        status="OPEN"
    )
    db.add(new_load)
    db.commit()
    db.refresh(new_load)
    return new_load

@router.get("/my-loads/bids", response_model=List[schemas.BidResponse])
def get_bids_on_my_loads(
    db: Session = Depends(get_db),
    current_tenant: schemas.TokenData = Depends(get_current_tenant)
):
    """
    Allows a Shipper company to view all competitive bids submitted 
    by carriers on any freight postings they originally created.
    """
    # Find all load IDs belonging to the logged-in shipper tenant
    my_load_ids = db.query(models.LoadPost.id).filter(
        models.LoadPost.company_id == current_tenant.company_id
    ).subquery()

    # Fetch all carrier bids linked to those specific load postings
    bids = db.query(models.Bid).filter(models.Bid.load_post_id.in_(my_load_ids)).all()
    return bids


@router.post("/bids/{bid_id}/accept")
def accept_carrier_bid(
    bid_id: int,
    db: Session = Depends(get_db),
    current_tenant: schemas.TokenData = Depends(get_current_tenant)
):
    """
    Awards the contract to a specific carrier bid. 
    Closes the auction by changing the load status to 'AWARDED'.
    """
    # 1. Verify target bid presence
    selected_bid = db.query(models.Bid).filter(models.Bid.id == bid_id).first()
    if not selected_bid:
        raise HTTPException(status_code=404, detail="Selected carrier bid not found.")

    # 2. Security Check: Verify that the company accepting the bid is the actual owner of the load
    target_load = db.query(models.LoadPost).filter(models.LoadPost.id == selected_bid.load_post_id).first()
    if target_load.company_id != current_tenant.company_id:
        raise HTTPException(
            status_code=403, 
            detail="Access Denied. You cannot manage auctions for listings owned by other tenants."
        )

    # 3. Accept the winning bid and reject all other competing offers
    selected_bid.status = "ACCEPTED"
    
    competing_bids = db.query(models.Bid).filter(
        models.Bid.load_post_id == target_load.id,
        models.Bid.id != bid_id
    ).all()
    for bid in competing_bids:
        bid.status = "REJECTED"

    # 4. Finalize the load post status indicator to match your 'Awarded' frontend state
    target_load.status = "AWARDED"
    
    db.commit()
    return {"message": f"Contract successfully awarded to Carrier Tenant #{selected_bid.carrier_company_id}!"}