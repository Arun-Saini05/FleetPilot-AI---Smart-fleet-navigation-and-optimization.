from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
import models
import schemas
import security
from database import get_db, engine
from middleware import get_current_tenant
from services.geocoder import resolve_address_to_coords

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="FleetPilot API")

# ── CORS ──────────────────────────────────────────────────────────
# Allow the Vite dev server (port 5173) and any localhost variant
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Auth ──────────────────────────────────────────────────────────

# POST /api/login — Generates a signed JWT for the client

@app.post("/api/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    Accepts username (email) + password via OAuth2PasswordRequestForm.
    Returns a signed JWT access_token.

    NOTE: Currently simulates a successful login for any credentials
    while the real user DB / password verification is wired up.
    """
    access_token = security.create_access_token(
        data={
            "sub": form_data.username,
            "company_id": 1,
            "role": "fleet_admin",
        }
    )
    return {"access_token": access_token, "token_type": "bearer"}


# GET /api/test-gatekeeper — Validates the token and returns tenant info
@app.get("/api/test-gatekeeper")
def test_gatekeeper(
    current_tenant: schemas.TokenData = Depends(get_current_tenant),
):
    return {
        "status": "Token Verified Successfully!",
        "extracted_company_id": current_tenant.company_id,
        "extracted_role": current_tenant.role,
        "extracted_user": current_tenant.user_id,
    }

# --- SECURE VEHICLE FLEET MANAGEMENT ---

@app.post("/api/vehicles", response_model=schemas.VehicleResponse)
def create_vehicle(
    vehicle: schemas.VehicleCreate, 
    db: Session = Depends(get_db), 
    current_tenant: schemas.TokenData = Depends(get_current_tenant)
):
    # The **vehicle.model_dump() dynamically unpacks all 12 parameters cleanly
    new_vehicle = models.Vehicle(
        **vehicle.model_dump(), 
        company_id=current_tenant.company_id
    )
    db.add(new_vehicle)
    db.commit()
    db.refresh(new_vehicle)
    return new_vehicle

    # Auto-stamp the vehicle with the company_id extracted from the secure token payload
    new_vehicle = models.Vehicle(**vehicle.model_dump(), company_id=current_tenant.company_id)
    db.add(new_vehicle)
    db.commit()
    db.refresh(new_vehicle)
    return new_vehicle

@app.get("/api/vehicles", response_model=List[schemas.VehicleResponse])
def list_vehicles(
    db: Session = Depends(get_db), 
    current_tenant: schemas.TokenData = Depends(get_current_tenant)
):
    # Strict Isolation: Only retrieve items belonging to the current user's corporate account
    return db.query(models.Vehicle).filter(models.Vehicle.company_id == current_tenant.company_id).all()


# --- SECURE DRIVER PROFILE MANAGEMENT ---

@app.post("/api/drivers", response_model=schemas.DriverResponse, status_code=status.HTTP_201_CREATED)
def create_driver(
    driver: schemas.DriverCreate, 
    db: Session = Depends(get_db), 
    current_tenant: schemas.TokenData = Depends(get_current_tenant)
):
    # Check if a driver with the same license number already exists
    existing_driver = db.query(models.Driver).filter(models.Driver.license_number == driver.license_number).first()
    if existing_driver:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Driver with this license number already registered"
        )

    new_driver = models.Driver(**driver.model_dump(), company_id=current_tenant.company_id)
    db.add(new_driver)
    db.commit()
    db.refresh(new_driver)
    return new_driver

@app.get("/api/drivers", response_model=List[schemas.DriverResponse])
def list_drivers(
    db: Session = Depends(get_db), 
    current_tenant: schemas.TokenData = Depends(get_current_tenant)
):
    return db.query(models.Driver).filter(models.Driver.company_id == current_tenant.company_id).all()

@app.post("/api/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """
    Day 1/2 Multi-Tenant Registration Gateway.
    Creates a brand-new tenant company and its initial administrator account[cite: 2].
    """
    # 1. Check if the email is already in use
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # 2. Check if the company name already exists; if not, create it dynamically
    db_company = db.query(models.Company).filter(models.Company.name == user.company_name).first()
    if not db_company:
        db_company = models.Company(name=user.company_name)
        db.add(db_company)
        db.commit()
        db.refresh(db_company)

    # 3. Create the user profile bound strictly to the new company's ID[cite: 2]
    new_user = models.User(
        email=user.email,
        hashed_password=security.get_password_hash(user.password),
        company_id=db_company.id,
        role="admin"  # The initial creator defaults to corporate admin clearance
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

# --- SECURE SHIPMENT ROUTING & LOGISTICS ALLOCATION ---

@app.post("/api/shipments", response_model=schemas.ShipmentResponse, status_code=status.HTTP_201_CREATED)
def create_shipment(
    shipment: schemas.ShipmentCreate, 
    db: Session = Depends(get_db), 
    current_tenant: schemas.TokenData = Depends(get_current_tenant)
):
    # Cross-Tenant Validation: Ensure assigned vehicle belongs to this tenant
    if shipment.vehicle_id:
        v = db.query(models.Vehicle).filter(models.Vehicle.id == shipment.vehicle_id, models.Vehicle.company_id == current_tenant.company_id).first()
        if not v:
            raise HTTPException(status_code=400, detail="Assigned vehicle not found in your corporate fleet")

    # Cross-Tenant Validation: Ensure assigned driver belongs to this tenant
    if shipment.driver_id:
        d = db.query(models.Driver).filter(models.Driver.id == shipment.driver_id, models.Driver.company_id == current_tenant.company_id).first()
        if not d:
            raise HTTPException(status_code=400, detail="Assigned operator not found in your corporate directory")

    new_shipment = models.Shipment(**shipment.model_dump(), company_id=current_tenant.company_id)
    db.add(new_shipment)
    db.commit()
    db.refresh(new_shipment)
    return new_shipment

@app.get("/api/shipments", response_model=List[schemas.ShipmentResponse])
def list_shipments(
    db: Session = Depends(get_db), 
    current_tenant: schemas.TokenData = Depends(get_current_tenant)
):
    # Multi-tenant scoping: retrieve only the logged-in company's active orders
    return db.query(models.Shipment).filter(models.Shipment.company_id == current_tenant.company_id).all()
# --- SECURE ANALYTICS AGGREGATION ---

@app.get("/api/analytics/summary")
def get_dashboard_summary(
    db: Session = Depends(get_db), 
    current_tenant: schemas.TokenData = Depends(get_current_tenant)
):
    """
    Computes real-time, tenant-isolated operational operational metrics for the logged-in company.
    """
    # 1. Count Total Vehicles
    total_vehicles = db.query(models.Vehicle).filter(
        models.Vehicle.company_id == current_tenant.company_id
    ).count()

    # 2. Count Total Drivers
    total_drivers = db.query(models.Driver).filter(
        models.Driver.company_id == current_tenant.company_id
    ).count()

    # 3. Count Total Shipments
    total_shipments = db.query(models.Shipment).filter(
        models.Shipment.company_id == current_tenant.company_id
    ).count()

    # 4. Calculate Total Valuation of cargo currently handled
    total_valuation = db.query(func.sum(models.Shipment.freight_value)).filter(
        models.Shipment.company_id == current_tenant.company_id
    ).scalar() or 0.0

    # 5. Breakdown shipments by current lifecycle status
    status_counts = db.query(models.Shipment.status, func.count(models.Shipment.id)).filter(
        models.Shipment.company_id == current_tenant.company_id
    ).group_by(models.Shipment.status).all()

    # Format status counts into a readable dictionary: {"Pending": 3, "In Transit": 2}
    status_summary = {status: count for status, count in status_counts}

    return {
        "metrics": {
            "active_trucks": total_vehicles,
            "registered_drivers": total_drivers,
            "assigned_shipments": total_shipments,
            "total_fleet_valuation": total_valuation
        },
        "status_distribution": status_summary
    }


# --- DAY 8: SPATIAL RESOLUTION & GEOCODING OPTIMIZATION ENGINE ---

@app.post("/api/routes/optimize", response_model=schemas.RouteOptimizeResponse)
def optimize_route_pipeline(
    request: schemas.RouteOptimizationRequest,
    db: Session = Depends(get_db),
    current_tenant: schemas.TokenData = Depends(get_current_tenant)
):
    """
    Day 8: Resolves plain-text origin/destination addresses into real
    lat/lng coordinates via the cached geocoding engine, then returns
    full route telemetry placeholders ready for Day 9-14 enrichment.
    """
    # Step 1: Validate multi-tenant vehicle ownership
    vehicle = db.query(models.Vehicle).filter(
        models.Vehicle.id == request.vehicle_id,
        models.Vehicle.company_id == current_tenant.company_id
    ).first()

    if not vehicle:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found in your company asset profile."
        )

    # Step 2: Convert addresses using the Day 8 geocoding engine (cache-first)
    origin_lat, origin_lng = resolve_address_to_coords(request.origin, db)
    destination_lat, destination_lng = resolve_address_to_coords(request.destination, db)

    # Step 3: Return geocoded coordinates + placeholder telemetry for Day 9-14
    return {
        "fuel_optimization": {
            "narrative_recommendation": (
                f"Geocoding resolved. "
                f"Origin ({request.origin}) → ({origin_lat:.4f}, {origin_lng:.4f}). "
                f"Destination ({request.destination}) → ({destination_lat:.4f}, {destination_lng:.4f}). "
                f"Vehicle: {vehicle.make} {vehicle.model} ({vehicle.truck_type.replace('_', ' ').title()}). "
                f"Awaiting HERE Truck Routing integration on Day 9."
            ),
            "financial_savings_estimate": 0.0
        },
        "routing_geometry": {
            "distance_meters": 0.0
        },
        "predictive_analytics": {
            "trip_efficiency_score": 100,
            "probability_of_delay": 0.0,
            "predicted_fuel_consumption_liters": 0.0
        },
        "commercial_tolls": {
            "toll_cost": 0.0
        },
        "meteorological_conditions": {
            "destination_temp": 0.0,
            "condition": "Pending HERE Weather Integration"
        }
    }

