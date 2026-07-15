"""
FleetPilot - Database Reset & Seed Script
Clears all tables and inserts realistic test data for end-to-end verification.

Run: venv\Scripts\python.exe seed.py
"""

from database import engine, SessionLocal, Base
import models
import security
import datetime
import random

# ── 1. DROP & RECREATE ALL TABLES ─────────────────────────────────
print("Dropping all tables...")
Base.metadata.drop_all(bind=engine)
print("Recreating schema...")
Base.metadata.create_all(bind=engine)
print("Schema ready.\n")

db = SessionLocal()

try:
    # ── 2. COMPANIES ──────────────────────────────────────────────
    org_company = models.Company(name="Global Manufacturing Corp (Org)")
    carrier_names = [
        "Tata Logistics Pvt. Ltd.",
        "Reliance Freight Solutions",
        "VRL Logistics",
        "Gati Express",
        "Blue Dart Transport",
        "Delhivery Heavy",
        "SafeExpress Fleet",
        "Mahindra Logistics"
    ]
    carriers = [models.Company(name=n) for n in carrier_names]
    
    db.add(org_company)
    db.add_all(carriers)
    db.flush()
    print(f"Companies: 1 Organization, {len(carriers)} Carriers")

    # ── 3. USERS ─────────────────────
    users = []
    # Organization Admin
    users.append(models.User(
        email="admin@globalcorp.com",
        hashed_password=security.get_password_hash("password123"),
        company_id=org_company.id,
        role="dispatcher"
    ))
    
    # Carrier Admins
    for c in carriers:
        email_prefix = c.name.split()[0].lower()
        users.append(models.User(
            email=f"dispatch@{email_prefix}.com",
            hashed_password=security.get_password_hash("password123"),
            company_id=c.id,
            role="dispatcher"
        ))

    db.add_all(users)
    db.flush()
    print(f"Users: 1 Org User, {len(carriers)} Carrier Users")

    # ── 4. VEHICLES & 5. DRIVERS ───────────────────────────────────────────────
    vehicles = []
    drivers = []
    
    for c in carriers:
        num_v = random.randint(3, 10)
        for i in range(num_v):
            vehicles.append(
                models.Vehicle(
                    make="BharatBenz", model="Signa", plate_number=f"MH-{c.id}-{1000+i}",
                    truck_type="tractor_semitrailer", weight_tons=28.0,
                    height_meters=4.1, width_meters=2.5, axle_count=6,
                    has_hazardous_cargo=False,
                    fuel_tank_capacity_liters=400, average_mileage_kpl=4.2,
                    current_odometer=random.randint(10000, 90000), company_id=c.id
                )
            )
            drivers.append(
                models.Driver(name=f"Driver {c.id}-{i}", license_number=f"DL-{c.id}-{i}", phone="9812340001", company_id=c.id)
            )
            
    db.add_all(vehicles)
    db.add_all(drivers)
    db.flush()
    print(f"Vehicles & Drivers created for carriers")

    # ── 6. MARKETPLACE LOAD POSTS ──
    load_posts = [
        models.LoadPost(company_id=org_company.id, title='Mumbai to Delhi - Steel Plates', cargo_description='Industrial Steel Plates', weight_tons=18.0, origin='Mumbai', destination='New Delhi', target_price=0.0, status='OPEN', created_at=datetime.datetime.utcnow() - datetime.timedelta(hours=3)),
        models.LoadPost(company_id=org_company.id, title='Chennai to Bengaluru - Cold Chain', cargo_description='Perishable Food Items', weight_tons=9.5, origin='Chennai', destination='Bengaluru', target_price=0.0, status='OPEN', created_at=datetime.datetime.utcnow() - datetime.timedelta(hours=7)),
        models.LoadPost(company_id=org_company.id, title='Pune to Hyderabad - Heavy Machinery', cargo_description='Industrial Equipment', weight_tons=22.0, origin='Pune', destination='Hyderabad', target_price=0.0, status='OPEN', created_at=datetime.datetime.utcnow() - datetime.timedelta(days=1)),
    ]
    db.add_all(load_posts)
    db.flush()
    print(f"Load Posts: {len(load_posts)} created on marketplace")

    # ── 7. BIDS ──
    bids = []
    for lp in load_posts:
        # 3 random carriers bid on each load post
        bidding_carriers = random.sample(carriers, 3)
        base_bid = random.randint(40000, 70000)
        for bc in bidding_carriers:
            bids.append(
                models.Bid(
                    load_post_id=lp.id,
                    carrier_company_id=bc.id,
                    bid_amount=base_bid + random.randint(-5000, 5000),
                    estimated_delivery_hours=random.choice([24, 36, 48]),
                    status="PENDING",
                    created_at=datetime.datetime.utcnow() - datetime.timedelta(hours=random.randint(1, 10))
                )
            )
            
    db.add_all(bids)
    db.flush()
    print(f"Bids: {len(bids)} submitted on marketplace loads")

    db.commit()
    print("\n" + "="*55)
    print("SEED COMPLETE - Database populated successfully!")
    print("="*55)
    print("\nTEST LOGIN CREDENTIALS:")
    print("   Organization → admin@globalcorp.com / password123")
    for c in carriers:
        email_prefix = c.name.split()[0].lower()
        print(f"   Carrier → dispatch@{email_prefix}.com / password123 (For: {c.name})")

except Exception as e:
    db.rollback()
    print(f"\nSEED FAILED: {e}")
    import traceback
    traceback.print_exc()
finally:
    db.close()
