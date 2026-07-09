from database import Base
from sqlalchemy import Column, Integer, String, ForeignKey, Float, Boolean, DateTime
from sqlalchemy.orm import relationship
from database import Base, engine
import datetime

Base.metadata.create_all(bind=engine)

class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)

    # Establish a relationship to the User model
    users = relationship("User", back_populates="company")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="user")
    
    # The crucial multi-tenant foreign key
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)

    # Establish a relationship back to the Company model
    company = relationship("Company", back_populates="users")

    # --- DAY 2 LOGISTICS ADDITIONS ---

class Vehicle(Base):
    __tablename__ = "vehicles"
    id = Column(Integer, primary_key=True, index=True)
    make = Column(String, nullable=False)
    model = Column(String, nullable=False)
    plate_number = Column(String, unique=True, index=True, nullable=False)
    truck_type = Column(String, nullable=False)
    weight_tons = Column(Float, nullable=False)
    height_meters = Column(Float, nullable=False)
    width_meters = Column(Float, nullable=False)
    axle_count = Column(Integer, nullable=False)
    has_hazardous_cargo = Column(Boolean, default=False, nullable=False)
    fuel_tank_capacity_liters = Column(Float, nullable=False)
    average_mileage_kpl = Column(Float, nullable=False)
    current_odometer = Column(Float, nullable=False)
    
    # Visual and data contract isolation key
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)

class Driver(Base):
    __tablename__ = "drivers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    license_number = Column(String, unique=True, index=True, nullable=False)
    phone = Column(String, nullable=False)
    
    # Visual and data contract isolation key
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)

class Shipment(Base):
    __tablename__ = "shipments"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)               # e.g., "Industrial Steel Pipes"
    origin = Column(String, nullable=False)              # e.g., "Mumbai, MH"
    destination = Column(String, nullable=False)         # e.g., "Delhi, NCR"
    status = Column(String, default="Pending")          # Pending, In Transit, Delivered, Cancelled
    freight_value = Column(Float, nullable=False)
    
    # Isolation & Assignment Keys
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=True) # Optional assignment
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=True)   # Optional assignment

class GeocodeCache(Base):
    __tablename__ = "geocode_cache"
    id = Column(Integer, primary_key=True, index=True)
    address_key = Column(String, unique=True, index=True, nullable=False) # Stores lowercase search query
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)

class LoadPost(Base):
    __tablename__ = "load_posts"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)  # The shipper who posted the load
    title = Column(String, nullable=False)
    cargo_description = Column(String)
    weight_tons = Column(Float, nullable=False)
    origin_hub = Column(String, nullable=False)
    destination_hub = Column(String, nullable=False)
    target_price = Column(Float, nullable=False)  # Shipper's baseline price offer
    status = Column(String, default="OPEN")  # OPEN, COMPLETED, CANCELLED
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    bids = relationship("Bid", back_populates="load_post", cascade="all, delete-orphan")

class Bid(Base):
    __tablename__ = "bids"

    id = Column(Integer, primary_key=True, index=True)
    load_post_id = Column(Integer, ForeignKey("load_posts.id"), nullable=False)
    carrier_company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)  # The bidder tenant
    bid_amount = Column(Float, nullable=False)  # Price offered by the carrier
    estimated_delivery_hours = Column(Integer, nullable=False)
    status = Column(String, default="PENDING")  # PENDING, ACCEPTED, REJECTED
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    load_post = relationship("LoadPost", back_populates="bids")