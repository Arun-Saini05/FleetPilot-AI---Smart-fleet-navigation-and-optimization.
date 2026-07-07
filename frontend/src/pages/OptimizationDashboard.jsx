import React, { useState, useEffect } from 'react';
import API from '../api/axios';

const OptimizationDashboard = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pipelineData, setPipelineData] = useState(null);
  const [form, setForm] = useState({
    origin: '', 
    destination: '', 
    vehicle_id: '', 
    current_fuel_level: '', 
    cargo_type: '', 
    avoid_tolls: false
  });

  useEffect(() => {
    API.get('/api/vehicles')
      .then(res => setVehicles(res.data))
      .catch(err => console.error("Error loading vehicles:", err));
  }, []);

  const handleOptimizationSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const payload = {
      origin: form.origin,
      destination: form.destination,
      vehicle_id: parseInt(form.vehicle_id),
      current_fuel_level: parseFloat(form.current_fuel_level),
      cargo_type: form.cargo_type,
      preferences: { avoid_tolls: form.avoid_tolls }
    };

    try {
      const res = await API.post('/api/routes/optimize', payload);
      setPipelineData(res.data); 
    } catch (err) {
      alert(err.response?.data?.detail || "Pipeline processing execution failure.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', display: 'flex', gap: '2rem', fontFamily: 'sans-serif', background: '#fcfaf7' }}>
      {/* FORM INPUT TERMINAL CONTROLS */}
      <div style={{ width: '35%', background: '#fff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e9dfd3' }}>
        <h3>Intelligent Dispatch Blueprint</h3>
        <form onSubmit={handleOptimizationSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input type="text" placeholder="Origin Address / Hub Terminal" value={form.origin} onChange={e => setForm({...form, origin: e.target.value})} required style={{ padding: '0.6rem' }} />
          <input type="text" placeholder="Destination Target Delivery Hub" value={form.destination} onChange={e => setForm({...form, destination: e.target.value})} required style={{ padding: '0.6rem' }} />
          <select value={form.vehicle_id} onChange={e => setForm({...form, vehicle_id: e.target.value})} required style={{ padding: '0.6rem' }}>
            <option value="">-- Choose Profile-Isolated Asset --</option>
            {vehicles.map(v => <option key={v.id} value={v.id}>{v.make} {v.model} [{v.plate_number}]</option>)}
          </select>
          <input type="number" placeholder="Current Fuel Gauge Level (Liters)" value={form.current_fuel_level} onChange={e => setForm({...form, current_fuel_level: e.target.value})} required style={{ padding: '0.6rem' }} />
          <input type="text" placeholder="Cargo Classification" value={form.cargo_type} onChange={e => setForm({...form, cargo_type: e.target.value})} required style={{ padding: '0.6rem' }} />
          <label><input type="checkbox" checked={form.avoid_tolls} onChange={e => setForm({...form, avoid_tolls: e.target.checked})} /> Avoid Toll Infrastructure Routes</label>
          <button type="submit" disabled={loading} style={{ background: '#5c401b', color: 'white', border: 'none', padding: '0.8rem', cursor: 'pointer', fontWeight: 'bold' }}>
            {loading ? "Processing Telemetry Matrix..." : "Optimize Route Pipeline"}
          </button>
        </form>
      </div>

      {/* DYNAMIC PIPELINE ANALYTICS METRICS RENDER SCREEN LAYER */}
      <div style={{ width: '65%', flex: '1' }}>
        {pipelineData ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* SAVINGS ENGINE INSIGHT CARD */}
            <div style={{ background: '#eef9f0', border: '1px solid #c3e6cb', padding: '1.2rem', borderRadius: '6px' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#155724' }}>⛽ Local Business Logic Fuel Optimizer Strategy Result</h4>
              <p style={{ margin: '0', fontSize: '0.95rem' }}>{pipelineData.fuel_optimization.narrative_recommendation}</p>
              <h5 style={{ margin: '0.5rem 0 0 0', color: '#155724' }}>Financial Margin Realized: ${pipelineData.fuel_optimization.financial_savings_estimate.toFixed(2)}</h5>
            </div>

            {/* PIPELINE TELEMETRY DETAILS SUMMARY CARD GRID */}
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ background: '#fff', padding: '1rem', flex: '1', border: '1px solid #e9dfd3', borderRadius: '6px' }}>
                <small style={{ color: '#888' }}>CORRIDOR DISTANCE</small>
                <h4>{(pipelineData.routing_geometry.distance_meters / 1000).toFixed(2)} Kilometers</h4>
              </div>
              <div style={{ background: '#fff', padding: '1rem', flex: '1', border: '1px solid #e9dfd3', borderRadius: '6px' }}>
                <small style={{ color: '#888' }}>PREDICTIVE ML TRIP EFFICIENCY</small>
                <h4 style={{ color: '#007bff' }}>{pipelineData.predictive_analytics.trip_efficiency_score}% Score</h4>
              </div>
              <div style={{ background: '#fff', padding: '1rem', flex: '1', border: '1px solid #e9dfd3', borderRadius: '6px' }}>
                <small style={{ color: '#888' }}>INFRASTRUCTURE TOLLS</small>
                <h4>${pipelineData.commercial_tolls.toll_cost || '0.00'}</h4>
              </div>
            </div>

            {/* WEATHER ALERT METEOROLOGY BLOCK */}
            <div style={{ background: '#fff', padding: '1rem', border: '1px solid #e9dfd3', borderRadius: '6px' }}>
              <h5>🌦️ Corridor Atmospheric Baseline Analysis</h5>
              <p style={{ margin: '0', fontSize: '0.9rem' }}>Destination Temperature Node registered at <strong>{pipelineData.meteorological_conditions.destination_temp}°C</strong> under <strong>{pipelineData.meteorological_conditions.condition}</strong> conditions.</p>
            </div>

            {/* MACHINE LEARNING LIVE TRACKING PREDICTION BLOCK */}
            <div style={{ background: '#fff', padding: '1rem', border: '1px solid #e9dfd3', borderRadius: '6px' }}>
              <h5>🧠 Machine Learning Inference Calculations</h5>
              <p style={{ margin: '0', fontSize: '0.9rem' }}>Probability of Corridor Delay Event: <strong>{(pipelineData.predictive_analytics.probability_of_delay * 100).toFixed(1)}%</strong></p>
              <p style={{ margin: '0', fontSize: '0.9rem' }}>Projected Diesel Consumption Matrix Level: <strong>{pipelineData.predictive_analytics.predicted_fuel_consumption_liters} Liters</strong></p>
            </div>
          </div>
        ) : (
          <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', border: '1px dashed #ccc', borderRadius: '8px' }}>
            <p style={{ color: '#aaa' }}>Await terminal form data payload insertion parameters for full structural pipeline optimization.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OptimizationDashboard;