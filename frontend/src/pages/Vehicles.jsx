import React, { useState, useEffect } from 'react';
import API from '../api/axios';

const Vehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    plate_number: '',
    truck_type: 'straight_truck',
    weight_tons: '',
    height_meters: '',
    width_meters: '',
    axle_count: '',
    has_hazardous_cargo: false,
    fuel_tank_capacity_liters: '',
    average_mileage_kpl: '',
    current_odometer: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchVehicles = async () => {
    try {
      const response = await API.get('/api/vehicles');
      setVehicles(response.data);
    } catch (err) {
      setError('Failed to load fleet configurations.');
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Ensure types match our strict backend float/int schema definitions
    const payload = {
      ...formData,
      weight_tons: parseFloat(formData.weight_tons),
      height_meters: parseFloat(formData.height_meters),
      width_meters: parseFloat(formData.width_meters),
      axle_count: parseInt(formData.axle_count),
      fuel_tank_capacity_liters: parseFloat(formData.fuel_tank_capacity_liters),
      average_mileage_kpl: parseFloat(formData.average_mileage_kpl),
      current_odometer: parseFloat(formData.current_odometer),
    };

    try {
      await API.post('/api/vehicles', payload);
      setSuccess('Advanced vehicle asset registered successfully!');
      setFormData({
        make: '', model: '', plate_number: '', truck_type: 'straight_truck',
        weight_tons: '', height_meters: '', width_meters: '', axle_count: '',
        has_hazardous_cargo: false, fuel_tank_capacity_liters: '', average_mileage_kpl: '', current_odometer: ''
      });
      fetchVehicles();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to register vehicle constraints.');
    }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h2>Fleet Configuration Registry</h2>
      <hr />

      {error && <div style={{ color: 'red', marginBottom: '1rem' }}>⚠️ {error}</div>}
      {success && <div style={{ color: 'green', marginBottom: '1rem' }}>✅ {success}</div>}

      <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e9dfd3', marginBottom: '2rem' }}>
        <h3>Onboard Advanced Industrial Truck</h3>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <input type="text" name="make" placeholder="Make (e.g., BharatBenz)" value={formData.make} onChange={handleChange} required style={{ padding: '0.6rem' }} />
          <input type="text" name="model" placeholder="Model (e.g., Signa)" value={formData.model} onChange={handleChange} required style={{ padding: '0.6rem' }} />
          <input type="text" name="plate_number" placeholder="License Plate Number" value={formData.plate_number} onChange={handleChange} required style={{ padding: '0.6rem' }} />
          
          <select name="truck_type" value={formData.truck_type} onChange={handleChange} style={{ padding: '0.6rem' }}>
            <option value="straight_truck">Straight Truck</option>
            <option value="tractor_semitrailer">Tractor Semitrailer</option>
          </select>

          <input type="number" step="0.1" name="weight_tons" placeholder="Gross Weight (Tons)" value={formData.weight_tons} onChange={handleChange} required style={{ padding: '0.6rem' }} />
          <input type="number" step="0.1" name="height_meters" placeholder="Height Limits (Meters)" value={formData.height_meters} onChange={handleChange} required style={{ padding: '0.6rem' }} />
          <input type="number" step="0.1" name="width_meters" placeholder="Width Limits (Meters)" value={formData.width_meters} onChange={handleChange} required style={{ padding: '0.6rem' }} />
          <input type="number" name="axle_count" placeholder="Axle Count" value={formData.axle_count} onChange={handleChange} required style={{ padding: '0.6rem' }} />
          <input type="number" step="0.1" name="fuel_tank_capacity_liters" placeholder="Fuel Tank Capacity (Liters)" value={formData.fuel_tank_capacity_liters} onChange={handleChange} required style={{ padding: '0.6rem' }} />
          <input type="number" step="0.1" name="average_mileage_kpl" placeholder="Average Mileage (KPL)" value={formData.average_mileage_kpl} onChange={handleChange} required style={{ padding: '0.6rem' }} />
          <input type="number" step="0.1" name="current_odometer" placeholder="Current Odometer Reading" value={formData.current_odometer} onChange={handleChange} required style={{ padding: '0.6rem' }} style={{ gridColumn: 'span 2', padding: '0.6rem' }} />
          
          <label style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input type="checkbox" name="has_hazardous_cargo" checked={formData.has_hazardous_cargo} onChange={handleChange} />
            Transporting Hazardous Cargo Material (Classified Route Requirement)
          </label>

          <button type="submit" style={{ gridColumn: 'span 2', background: '#5c401b', color: 'white', border: 'none', padding: '0.8rem', cursor: 'pointer', fontWeight: 'bold' }}>
            Save Technical Vehicle Profile
          </button>
        </form>
      </div>
    </div>
  );
};

export default Vehicles;