
from pydantic import BaseModel, EmailStr

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    company_name: str

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    company_id: int
    role: str

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

# This represents the decoded payload shape used inside the middleware
class TokenData(BaseModel):
    user_id: str
    company_id: int
    role: str

from typing import Optional

# --- Day 2 Vehicle Schemas ---

class VehicleCreate(BaseModel):
    make: str
    model: str
    plate_number: str
    truck_type: str
    weight_tons: float
    height_meters: float
    width_meters: float
    axle_count: int
    has_hazardous_cargo: bool
    fuel_tank_capacity_liters: float
    average_mileage_kpl: float
    current_odometer: float

class VehicleResponse(VehicleCreate):
    id: int
    company_id: int
    
    class Config:
        from_attributes = True

# --- Day 2 Driver Schemas ---

class DriverCreate(BaseModel):
    name: str
    license_number: str  # Must be unique per company
    phone: str

class DriverResponse(BaseModel):
    id: int
    name: str
    license_number: str
    phone: str
    company_id: int
    
class Config:
    from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: str
    company_id: int
    role: str    

class ShipmentCreate(BaseModel):
    title: str
    origin: str
    destination: str
    freight_value: float
    vehicle_id: Optional[int] = None
    driver_id: Optional[int] = None

class ShipmentResponse(ShipmentCreate):
    id: int
    status: str
    company_id: int

    class Config:
        from_attributes = True

# --- Day 6/8 Route Optimization Schemas ---

class FuelOptimization(BaseModel):
    narrative_recommendation: str
    financial_savings_estimate: float

class RoutingGeometry(BaseModel):
    distance_meters: float

class PredictiveAnalytics(BaseModel):
    trip_efficiency_score: int
    probability_of_delay: float
    predicted_fuel_consumption_liters: float

class CommercialTolls(BaseModel):
    toll_cost: float

class MeteorologicalConditions(BaseModel):
    destination_temp: float
    condition: str

class RouteOptimizeResponse(BaseModel):
    fuel_optimization: FuelOptimization
    routing_geometry: RoutingGeometry
    predictive_analytics: PredictiveAnalytics
    commercial_tolls: CommercialTolls
    meteorological_conditions: MeteorologicalConditions

class RouteOptimizeRequest(BaseModel):
    origin: str
    destination: str
    vehicle_id: int
    current_fuel_level: float
    cargo_type: str
    preferences: Optional[dict] = None

# Alias used by Day 8 endpoint spec
RouteOptimizationRequest = RouteOptimizeRequest