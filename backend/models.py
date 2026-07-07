from fastapi.openapi import models
from database import Base
from sqlalchemy import Column, Integer, String, ForeignKey, Float, Boolean
from sqlalchemy.orm import relationship
from database import Base, engine  # Make sure 'engine' is imported from your database configuration file

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