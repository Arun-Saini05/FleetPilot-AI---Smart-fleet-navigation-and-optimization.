from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import models, schemas
import httpx
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
        origin=load_data.origin,
        destination=load_data.destination,
        target_price=load_data.target_price,
        status="OPEN"
    )
    db.add(new_load)
    db.commit()
    db.refresh(new_load)
    return new_load

@router.get("/my-loads/bids")
def get_bids_on_my_loads_with_vendor_ml(
    db: Session = Depends(get_db),
    current_tenant: schemas.TokenData = Depends(get_current_tenant)
):
    """
    Returns all carrier bids on the tenant's loads, enriched with
    ML-powered vendor recommendation scores and fair market price estimates.
    """
    my_load_ids = db.query(models.LoadPost.id).filter(
        models.LoadPost.company_id == current_tenant.company_id
    ).subquery()

    bids = db.query(models.Bid).filter(models.Bid.load_post_id.in_(my_load_ids)).all()

    enriched_bids = []
    for bid in bids:
        load_details = db.query(models.LoadPost).filter(
            models.LoadPost.id == bid.load_post_id
        ).first()

        carrier_company = db.query(models.Company).filter(
            models.Company.id == bid.carrier_company_id
        ).first()
        carrier_name = carrier_company.name if carrier_company else "Unknown Carrier"
        
        # Pull Detailed Profile Info
        carrier_user = db.query(models.User).filter(models.User.company_id == bid.carrier_company_id).first()
        carrier_contact_email = carrier_user.email if carrier_user else "N/A"
        carrier_fleet_size = db.query(models.Vehicle).filter(models.Vehicle.company_id == bid.carrier_company_id).count()
        carrier_driver_count = db.query(models.Driver).filter(models.Driver.company_id == bid.carrier_company_id).count()

        ml_payload = {
            "origin_lat": 19.076, "origin_lng": 72.877,
            "destination_lat": 28.613, "destination_lng": 77.209,
            "distance_meters": float(load_details.weight_tons * 80000),
            "base_eta_seconds": 129600.0,
            "vehicle_type": "Heavy Commercial Carrier",
            "gross_vehicle_weight_tons": 16.0,
            "cargo_weight_tons": float(load_details.weight_tons),
            "average_mileage_kpl": 4.5,
            "current_fuel_level": 80.0,
            "driver_id": int(bid.carrier_company_id),
            "driver_experience_years": 6.0,
            "weather_temp": 27.0,
            "has_precipitation": False,
            "base_toll_cost": 0.0,
            "bidding_context": {
                "vendor_on_time_delivery_pct": 94.5 if bid.carrier_company_id == 1 else 82.0,
                "vendor_historical_claims": 0 if bid.carrier_company_id == 1 else 1
            }
        }

        try:
            with httpx.Client(timeout=2.0) as client:
                ml_res = client.post(
                    "http://127.0.0.1:8001/predict/route-insights",
                    json=ml_payload
                )
                ml_data = ml_res.json() if ml_res.status_code == 200 else {}
        except Exception:
            ml_data = {}

        enriched_bids.append({
            "id": bid.id,
            "load_post_id": bid.load_post_id,
            "carrier_company_id": bid.carrier_company_id,
            "carrier_company_name": carrier_name,
            "carrier_contact_email": carrier_contact_email,
            "carrier_fleet_size": carrier_fleet_size,
            "carrier_driver_count": carrier_driver_count,
            "bid_amount": bid.bid_amount,
            "estimated_delivery_hours": bid.estimated_delivery_hours,
            "status": bid.status,
            "ai_vendor_recommendation_score": ml_data.get("vendor_recommendation_score", 90.0),
            "ai_predicted_fair_market_price": ml_data.get("predicted_fair_market_price", bid.bid_amount),
            "ml_service_active": bool(ml_data)
        })

    return enriched_bids

@router.get("/my-bids", response_model=List[schemas.MyBidsResponse])
def get_my_bids(
    db: Session = Depends(get_db),
    current_tenant: schemas.TokenData = Depends(get_current_tenant)
):
    """
    Fetches all bids placed by the currently logged-in Carrier logistics company.
    """
    my_bids = db.query(models.Bid).filter(models.Bid.carrier_company_id == current_tenant.company_id).all()
    
    result = []
    for bid in my_bids:
        load = db.query(models.LoadPost).filter(models.LoadPost.id == bid.load_post_id).first()
        if not load:
            continue
            
        shipper_company = db.query(models.Company).filter(models.Company.id == load.company_id).first()
        shipper_name = shipper_company.name if shipper_company else "Unknown Shipper"
        
        result.append({
            "id": bid.id,
            "load_post_id": bid.load_post_id,
            "bid_amount": bid.bid_amount,
            "estimated_delivery_hours": bid.estimated_delivery_hours,
            "status": bid.status,
            "load_title": load.title,
            "load_origin": load.origin,
            "load_destination": load.destination,
            "load_weight_tons": load.weight_tons,
            "load_status": load.status,
            "shipper_company_name": shipper_name
        })
        
    return result

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