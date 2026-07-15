# ml_service/train.py
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
import xgboost as xgb
import joblib
import os

print("Generating synthetic dataset...")
np.random.seed(42)
N = 10000

# 1. Feature Generation
distance_meters = np.random.uniform(50000, 1500000, N)  # 50km to 1500km
base_speed_mps = np.random.uniform(10.0, 16.0, N)      # 36 km/h to 57 km/h
base_eta_seconds = distance_meters / base_speed_mps

vehicle_types = np.random.choice(['tractor_semitrailer', 'straight_truck'], N)
vehicle_type_encoded = np.where(vehicle_types == 'tractor_semitrailer', 1, 0)

gross_vehicle_weight_tons = np.random.uniform(10.0, 30.0, N)
cargo_weight_tons = np.random.uniform(2.0, 25.0, N)
average_mileage_kpl = np.random.uniform(3.0, 7.5, N)
current_fuel_level = np.random.uniform(50.0, 400.0, N)
driver_experience_years = np.random.uniform(1.0, 25.0, N)
weather_temp = np.random.uniform(5.0, 45.0, N)
has_precipitation = np.random.choice([0, 1], N, p=[0.75, 0.25])
base_toll_cost = np.random.uniform(0.0, 5000.0, N)

# Vendor metrics for embeddings
vendor_on_time_delivery_pct = np.random.uniform(50.0, 100.0, N)
vendor_historical_claims = np.random.randint(0, 6, N)

# 2. Target Generation (with realistic non-linear correlations & noise)
noise_factor = np.random.normal(1.0, 0.05, N)

# Target A: Fuel Consumption (Liters)
base_liters = (distance_meters / 1000.0) / average_mileage_kpl
weight_penalty = cargo_weight_tons * 0.2
weather_fuel_penalty = np.where(has_precipitation == 1, 1.15, 1.0)
target_fuel = (base_liters + weight_penalty) * weather_fuel_penalty * noise_factor

# Target B: ETA (Seconds)
weather_eta_penalty = np.where(has_precipitation == 1, 1.25, 1.0)
driver_eta_bonus = 1.0 - (driver_experience_years * 0.006)  # up to 15% faster
vendor_eta_penalty = 1.0 + ((100.0 - vendor_on_time_delivery_pct) * 0.005) # up to 25% delay
target_eta = base_eta_seconds * weather_eta_penalty * driver_eta_bonus * vendor_eta_penalty * noise_factor

# Target C: Fair Market Price (INR)
base_price = (distance_meters / 1000.0) * 55.0
weight_price = cargo_weight_tons * 300.0
weather_price_penalty = np.where(has_precipitation == 1, 1.20, 1.0)
target_price = (base_price + weight_price) * weather_price_penalty * noise_factor

# Create DataFrames
X_fuel = pd.DataFrame({
    'distance_meters': distance_meters,
    'cargo_weight_tons': cargo_weight_tons,
    'average_mileage_kpl': average_mileage_kpl,
    'has_precipitation': has_precipitation
})
y_fuel = target_fuel

X_eta = pd.DataFrame({
    'base_eta_seconds': base_eta_seconds,
    'has_precipitation': has_precipitation,
    'driver_experience_years': driver_experience_years,
    'vendor_on_time_delivery_pct': vendor_on_time_delivery_pct,
    'vendor_historical_claims': vendor_historical_claims
})
y_eta = target_eta

X_pricing = pd.DataFrame({
    'distance_meters': distance_meters,
    'cargo_weight_tons': cargo_weight_tons,
    'has_precipitation': has_precipitation,
    'vendor_on_time_delivery_pct': vendor_on_time_delivery_pct
})
y_pricing = target_price

# 3. Model Training
print("Training Fuel Consumption Model (Random Forest)...")
X_train_f, X_test_f, y_train_f, y_test_f = train_test_split(X_fuel, y_fuel, test_size=0.2, random_state=42)
fuel_model = RandomForestRegressor(n_estimators=50, max_depth=8, random_state=42)
fuel_model.fit(X_train_f, y_train_f)
print(f"Fuel Model R^2 Score: {fuel_model.score(X_test_f, y_test_f):.4f}")

print("Training ETA Adjustment Model (XGBoost)...")
X_train_e, X_test_e, y_train_e, y_test_e = train_test_split(X_eta, y_eta, test_size=0.2, random_state=42)
eta_model = xgb.XGBRegressor(n_estimators=100, max_depth=5, learning_rate=0.1, random_state=42)
eta_model.fit(X_train_e, y_train_e)
print(f"ETA Model R^2 Score: {eta_model.score(X_test_e, y_test_e):.4f}")

print("Training Fair Market Pricing Model (XGBoost)...")
X_train_p, X_test_p, y_train_p, y_test_p = train_test_split(X_pricing, y_pricing, test_size=0.2, random_state=42)
pricing_model = xgb.XGBRegressor(n_estimators=100, max_depth=5, learning_rate=0.1, random_state=42)
pricing_model.fit(X_train_p, y_train_p)
print(f"Pricing Model R^2 Score: {pricing_model.score(X_test_p, y_test_p):.4f}")

# 4. Save Models
print("Saving models to disk...")
joblib.dump(fuel_model, 'fuel_model.joblib')
joblib.dump(eta_model, 'eta_model.joblib')
joblib.dump(pricing_model, 'pricing_model.joblib')
print("Model training pipeline complete!")
