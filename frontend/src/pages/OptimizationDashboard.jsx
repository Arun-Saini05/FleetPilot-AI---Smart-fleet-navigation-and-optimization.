import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import { fetchAddressSuggestions } from '../api/geocoding';
import RouteMiniMap from '../components/RouteMiniMap';

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

  // Autocomplete suggestion states
  const [originSuggestions, setOriginSuggestions] = useState([]);
  const [destSuggestions, setDestSuggestions] = useState([]);
  const [showOriginDropdown, setShowOriginDropdown] = useState(false);
  const [showDestDropdown, setShowDestDropdown] = useState(false);

  useEffect(() => {
    API.get('/api/vehicles')
      .then(res => setVehicles(res.data))
      .catch(err => console.error("Error loading vehicles:", err));
  }, []);

  // DEBOUNCE: Origin suggestions
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (form.origin.length >= 3) {
        const results = await fetchAddressSuggestions(form.origin);
        setOriginSuggestions(results);
      } else {
        setOriginSuggestions([]);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [form.origin]);

  // DEBOUNCE: Destination suggestions
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (form.destination.length >= 3) {
        const results = await fetchAddressSuggestions(form.destination);
        setDestSuggestions(results);
      } else {
        setDestSuggestions([]);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [form.destination]);

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

  // Shared dropdown style
  const dropdownStyle = {
    position: 'absolute', top: '100%', left: 0, right: 0,
    background: 'white', border: '1px solid #d4c5b5',
    borderRadius: '6px', zIndex: 1000, margin: 0, padding: 0,
    listStyle: 'none', boxShadow: '0 6px 16px rgba(92,64,27,0.12)',
    maxHeight: '200px', overflowY: 'auto'
  };
  const suggestionItemStyle = {
    padding: '9px 12px', cursor: 'pointer',
    borderBottom: '1px solid #f5efe8', fontSize: '0.82rem', color: '#3d2b1a'
  };
  const inputStyle = {
    width: '100%', padding: '0.65rem 0.75rem',
    borderRadius: '6px', border: '1px solid #d4c5b5',
    boxSizing: 'border-box', fontSize: '0.9rem', outline: 'none'
  };

  return (
    <div style={{ padding: '2rem', display: 'flex', gap: '2rem', fontFamily: 'sans-serif', background: '#fcfaf7' }}>

      {/* ── FORM PANEL ── */}
      <div style={{ width: '35%', background: '#fff', padding: '1.5rem', borderRadius: '10px', border: '1px solid #e9dfd3', boxShadow: '0 2px 8px rgba(92,64,27,0.06)' }}>
        <h3 style={{ margin: '0 0 1.2rem 0', color: '#3d2b1a', fontSize: '1.1rem' }}>Intelligent Dispatch Blueprint</h3>
        <form onSubmit={handleOptimizationSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>

          {/* ── ORIGIN AUTOCOMPLETE ── */}
          <div style={{ position: 'relative' }}>
            <label style={{ fontSize: '0.75rem', color: '#8a6a4a', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Origin Hub</label>
            <input
              type="text"
              placeholder="e.g. Mumbai, Maharashtra"
              value={form.origin}
              onChange={e => { setForm({ ...form, origin: e.target.value }); setShowOriginDropdown(true); }}
              onFocus={() => setShowOriginDropdown(true)}
              onBlur={() => setTimeout(() => setShowOriginDropdown(false), 200)}
              required
              style={{ ...inputStyle, marginTop: '4px', borderColor: showOriginDropdown && originSuggestions.length ? '#5c401b' : '#d4c5b5' }}
            />
            {showOriginDropdown && originSuggestions.length > 0 && (
              <ul style={dropdownStyle}>
                {originSuggestions.map((place) => (
                  <li
                    key={place.place_id}
                    onMouseDown={() => { setForm({ ...form, origin: place.display_name }); setShowOriginDropdown(false); setOriginSuggestions([]); }}
                    style={suggestionItemStyle}
                    onMouseEnter={e => e.currentTarget.style.background = '#f5efe8'}
                    onMouseLeave={e => e.currentTarget.style.background = 'white'}
                  >
                    📍 {place.display_name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* ── DESTINATION AUTOCOMPLETE ── */}
          <div style={{ position: 'relative' }}>
            <label style={{ fontSize: '0.75rem', color: '#8a6a4a', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Destination Hub</label>
            <input
              type="text"
              placeholder="e.g. New Delhi, NCR"
              value={form.destination}
              onChange={e => { setForm({ ...form, destination: e.target.value }); setShowDestDropdown(true); }}
              onFocus={() => setShowDestDropdown(true)}
              onBlur={() => setTimeout(() => setShowDestDropdown(false), 200)}
              required
              style={{ ...inputStyle, marginTop: '4px', borderColor: showDestDropdown && destSuggestions.length ? '#5c401b' : '#d4c5b5' }}
            />
            {showDestDropdown && destSuggestions.length > 0 && (
              <ul style={dropdownStyle}>
                {destSuggestions.map((place) => (
                  <li
                    key={place.place_id}
                    onMouseDown={() => { setForm({ ...form, destination: place.display_name }); setShowDestDropdown(false); setDestSuggestions([]); }}
                    style={suggestionItemStyle}
                    onMouseEnter={e => e.currentTarget.style.background = '#f5efe8'}
                    onMouseLeave={e => e.currentTarget.style.background = 'white'}
                  >
                    📍 {place.display_name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* ── REST OF FORM ── */}
          <div>
            <label style={{ fontSize: '0.75rem', color: '#8a6a4a', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Vehicle</label>
            <select value={form.vehicle_id} onChange={e => setForm({ ...form, vehicle_id: e.target.value })} required style={{ ...inputStyle, marginTop: '4px' }}>
              <option value="">-- Choose Profile-Isolated Asset --</option>
              {vehicles.map(v => <option key={v.id} value={v.id}>{v.make} {v.model} [{v.plate_number}]</option>)}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', color: '#8a6a4a', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Fuel Level (Liters)</label>
            <input type="number" placeholder="e.g. 250" value={form.current_fuel_level} onChange={e => setForm({ ...form, current_fuel_level: e.target.value })} required style={{ ...inputStyle, marginTop: '4px' }} />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', color: '#8a6a4a', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Cargo Type</label>
            <input type="text" placeholder="e.g. Steel Coils, Perishables" value={form.cargo_type} onChange={e => setForm({ ...form, cargo_type: e.target.value })} required style={{ ...inputStyle, marginTop: '4px' }} />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#5c4033', cursor: 'pointer' }}>
            <input type="checkbox" checked={form.avoid_tolls} onChange={e => setForm({ ...form, avoid_tolls: e.target.checked })} />
            Avoid Toll Infrastructure Routes
          </label>

          <button type="submit" disabled={loading} style={{ background: loading ? '#a08060' : '#5c401b', color: 'white', border: 'none', padding: '0.85rem', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 'bold', borderRadius: '8px', fontSize: '0.9rem', transition: 'background 0.2s' }}>
            {loading ? "⏳ Processing Telemetry Matrix..." : "⚡ Optimize Route Pipeline"}
          </button>
        </form>
      </div>

      {/* ── RESULTS PANEL ── */}
      <div style={{ width: '65%', flex: '1' }}>
        {pipelineData ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            <div style={{ background: '#eef9f0', border: '1px solid #c3e6cb', padding: '1.2rem', borderRadius: '8px' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#155724' }}>⛽ Fuel Optimizer Strategy</h4>
              <p style={{ margin: '0', fontSize: '0.95rem' }}>{pipelineData.fuel_optimization.narrative_recommendation}</p>
              <h5 style={{ margin: '0.5rem 0 0 0', color: '#155724' }}>Financial Margin Realized: ₹{pipelineData.fuel_optimization.financial_savings_estimate.toFixed(2)}</h5>
            </div>

            <div style={{ background: '#fff', padding: '1rem', border: '1px solid #e9dfd3', borderRadius: '8px' }}>
              <h5 style={{ margin: '0 0 0.5rem 0' }}>🗺️ Live Telemetry Path & Vector Routing</h5>
              <RouteMiniMap routingGeometry={pipelineData.routing_geometry} />
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ background: '#fff', padding: '1rem', flex: '1', border: '1px solid #e9dfd3', borderRadius: '8px' }}>
                <small style={{ color: '#888' }}>CORRIDOR DISTANCE</small>
                <h4 style={{ margin: '0.4rem 0 0 0' }}>{(pipelineData.routing_geometry.distance_meters / 1000).toFixed(2)} km</h4>
              </div>
              <div style={{ background: '#fff', padding: '1rem', flex: '1', border: '1px solid #e9dfd3', borderRadius: '8px' }}>
                <small style={{ color: '#888' }}>ML TRIP EFFICIENCY</small>
                <h4 style={{ margin: '0.4rem 0 0 0', color: '#007bff' }}>{pipelineData.predictive_analytics.trip_efficiency_score}%</h4>
              </div>
              <div style={{ background: '#fff', padding: '1rem', flex: '1', border: '1px solid #e9dfd3', borderRadius: '8px' }}>
                <small style={{ color: '#888' }}>TOLL COST</small>
                <h4 style={{ margin: '0.4rem 0 0 0' }}>₹{pipelineData.commercial_tolls.toll_cost || '0.00'}</h4>
              </div>
            </div>

            {/* ── FUEL STRATEGY STORY BLOCK ── */}
            <div style={{ background: '#fffdf5', border: '1px solid #fce8b2', padding: '1.2rem', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <h5 style={{ margin: '0 0 0.5rem 0', color: '#b06000', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                📖 Logistics Dispatch Story & Refueling Guide
              </h5>
              <p style={{ margin: '0', fontSize: '0.95rem', color: '#5f3f10', lineHeight: '1.6' }}>
                {(() => {
                  const currentFuel = parseFloat(form.current_fuel_level) || 0;
                  const predictedFuel = pipelineData.predictive_analytics.predicted_fuel_consumption_liters || 0;
                  const shortfall = predictedFuel - currentFuel;
                  const origin = form.origin.split(',')[0] || "Origin";
                  const destination = form.destination.split(',')[0] || "Destination";
                  
                  if (shortfall <= 0) {
                    return `Your truck departs from ${origin} with a healthy ${currentFuel}L of diesel. The ML model predicts a total consumption of ${predictedFuel.toFixed(1)}L for this ${ (pipelineData.routing_geometry.distance_meters / 1000).toFixed(0) }km corridor. Since your fuel level is sufficient, you can complete the journey directly to ${destination} without stopping for refuel.`;
                  } else {
                    const mileage = predictedFuel > 0 ? ((pipelineData.routing_geometry.distance_meters / 1000) / predictedFuel) : 4.0;
                    const maxRange = currentFuel * mileage;
                    
                    const isDestCheaper = pipelineData.fuel_optimization.narrative_recommendation.toLowerCase().includes('destination') && 
                                          pipelineData.fuel_optimization.narrative_recommendation.toLowerCase().includes('cheaper');
                    
                    if (isDestCheaper) {
                      return `Your truck starts at ${origin} with ${currentFuel}L, but needs ${predictedFuel.toFixed(1)}L to reach ${destination} (shortfall: ${shortfall.toFixed(1)}L). With your current fuel, you will run dry after ~${maxRange.toFixed(0)}km. Because fuel is cheaper at ${destination}, do NOT fill the entire shortfall in expensive ${origin}. Instead, purchase just enough fuel (approx ${(shortfall + 20).toFixed(0)}L) en-route at a cheaper highway stop to reach ${destination} safely, and then perform a full refuel at the destination terminal to maximize savings!`;
                    } else {
                      return `Your truck starts at ${origin} with ${currentFuel}L, needing a total of ${predictedFuel.toFixed(1)}L. You have a shortfall of ${shortfall.toFixed(1)}L. Since pricing is stable along the corridor, it is highly recommended to fill the remaining ${shortfall.toFixed(1)}L at the origin terminal before departure to ensure maximum up-time.`;
                    }
                  }
                })()}
              </p>
            </div>

            {/* Drop this inside your result dashboard panels to display the comprehensive OpenWeather telemetry report */}
            <div className="weather-detailed-report-card" style={{ background: '#fdfdfd', border: '1px solid #e8e3dd', borderRadius: '10px', padding: '15px', marginTop: '15px' }}>
              <h4 style={{ margin: '0 0 0.5rem 0' }}>🌤️ Live OpenWeather Terminal Telemetry</h4>
              <p style={{ fontSize: '0.9rem', margin: '5px 0' }}><strong>Route Status:</strong> {pipelineData.meteorological_conditions.condition}</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginTop: '10px', textAlign: 'center' }}>
                <div style={{ background: '#fcfbfa', padding: '8px', borderRadius: '6px' }}>
                  <small style={{ color: '#8c7e7c', display: 'block' }}>TEMPERATURE</small>
                  <strong>{pipelineData.meteorological_conditions.destination_temp}°C</strong>
                </div>
                <div style={{ background: '#fcfbfa', padding: '8px', borderRadius: '6px' }}>
                  <small style={{ color: '#8c7e7c', display: 'block' }}>HUMIDITY</small>
                  <strong>{pipelineData.meteorological_conditions.humidity_pct || 52}%</strong>
                </div>
                <div style={{ background: '#fcfbfa', padding: '8px', borderRadius: '6px' }}>
                  <small style={{ color: '#8c7e7c', display: 'block' }}>WIND VELOCITY</small>
                  <strong>{pipelineData.meteorological_conditions.wind_speed_ms || 3.4} m/s</strong>
                </div>
              </div>
            </div>

            <div style={{ background: '#fff', padding: '1rem', border: '1px solid #e9dfd3', borderRadius: '8px' }}>
              <h5 style={{ margin: '0 0 0.5rem 0' }}>🧠 ML Inference Predictions</h5>
              <p style={{ margin: '0 0 0.3rem 0', fontSize: '0.9rem' }}>Delay probability: <strong>{(pipelineData.predictive_analytics.probability_of_delay * 100).toFixed(1)}%</strong></p>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>Projected fuel consumption: <strong>{pipelineData.predictive_analytics.predicted_fuel_consumption_liters} L</strong></p>
              {pipelineData.ml_predictive_insights?.ml_service_active && (
                <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.85rem', color: '#5c401b' }}>
                  Driver score: <strong>{pipelineData.ml_predictive_insights.driver_performance_score}%</strong> &nbsp;|&nbsp;
                  Route efficiency: <strong>{pipelineData.ml_predictive_insights.route_efficiency_score}%</strong> &nbsp;|&nbsp;
                  ML confidence: <strong>{(pipelineData.ml_predictive_insights.confidence_scores?.route_models * 100).toFixed(0)}%</strong>
                </p>
              )}
            </div>


          </div>
        ) : (
          <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', border: '1px dashed #d4c5b5', borderRadius: '10px' }}>
            <p style={{ color: '#b8a898', fontSize: '0.95rem', textAlign: 'center', lineHeight: '1.6' }}>
              Type an origin and destination above — live suggestions will appear.<br />
              <span style={{ fontSize: '0.82rem', color: '#ccc' }}>Powered by LocationIQ Autocomplete</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OptimizationDashboard;