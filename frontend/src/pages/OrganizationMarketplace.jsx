import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchIncomingBids, awardFreightContract, createMarketplaceLoad } from '../api/marketplace';
import { fetchAddressSuggestions } from '../api/geocoding';
import './FreightMarketplace.css';

export default function OrganizationMarketplace() {
  const navigate = useNavigate();

  // Dynamic State Control
  const [incomingBids, setIncomingBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);
  const [expandedVendor, setExpandedVendor] = useState({});

  // Shipper Form States
  const [formOrigin, setFormOrigin] = useState('');
  const [formDest, setFormDest] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formCargo, setFormCargo] = useState('');
  const [formWeight, setFormWeight] = useState('');
  const [originSuggestions, setOriginSuggestions] = useState([]);
  const [destSuggestions, setDestSuggestions] = useState([]);
  const [showOriginDropdown, setShowOriginDropdown] = useState(false);
  const [showDestDropdown, setShowDestDropdown] = useState(false);

  useEffect(() => {
    loadIncomingData();
  }, []);

  // Debounce Autocomplete
  useEffect(() => {
    const t = setTimeout(async () => {
      if (formOrigin.length >= 3) setOriginSuggestions(await fetchAddressSuggestions(formOrigin));
      else setOriginSuggestions([]);
    }, 400);
    return () => clearTimeout(t);
  }, [formOrigin]);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (formDest.length >= 3) setDestSuggestions(await fetchAddressSuggestions(formDest));
      else setDestSuggestions([]);
    }, 400);
    return () => clearTimeout(t);
  }, [formDest]);

  const loadIncomingData = async () => {
    try {
      const bidsData = await fetchIncomingBids();
      setIncomingBids(bidsData);
      setLoading(false);
    } catch (err) {
      console.error("Failed to sync marketplace data layers:", err);
      setLoading(false);
    }
  };

  const handleCreateLoad = async (e) => {
    e.preventDefault();
    try {
      await createMarketplaceLoad({
        title: formTitle || `${formOrigin.split(',')[0]} to ${formDest.split(',')[0]}`,
        cargo_description: formCargo,
        weight_tons: parseFloat(formWeight),
        origin: formOrigin,
        destination: formDest,
        target_price: 0.0 // Removed manual budget, defaults to 0 for Quotation Mode
      });
      alert('Freight Corridor successfully published to board for Quotation!');
      setFormOrigin(''); setFormDest(''); setFormTitle(''); setFormCargo(''); setFormWeight('');
    } catch (err) {
      alert(`Failed to publish: ${err.response?.data?.detail || err.message}`);
    }
  };

  const handleAwardContract = async (bidId) => {
    if (!window.confirm("Are you sure you want to accept this carrier bid and close the auction?")) return;
    try {
      const result = await awardFreightContract(bidId);
      alert(result.message || "Contract successfully awarded!");
      loadIncomingData();
    } catch (err) {
      alert(`Awarding Failed: ${err.response?.data?.detail || "Transaction error."}`);
    }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#F4EFEA', color: '#4A3B32', fontWeight: 'bold' }}>Syncing Engine Registry Board Tenders...</div>;

  const suggestionStyle = { padding: '9px 12px', cursor: 'pointer', borderBottom: '1px solid #f5efe8', fontSize: '0.85rem' };
  const dropdownStyle = { position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #ccc', borderRadius: '4px', zIndex: 1000, margin: 0, padding: 0, listStyle: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' };
  const inputStyle = { width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #7f9527', boxSizing: 'border-box' };

  // Calculate Analytical Report Metrics
  const totalQuotations = incomingBids.length;
  let avgSavings = 0;
  let topReliableCarrier = "N/A";
  let maxScore = -1;

  if (totalQuotations > 0) {
    let totalBidAmount = 0;
    let totalMLPrice = 0;
    incomingBids.forEach(bid => {
      totalBidAmount += bid.bid_amount;
      totalMLPrice += bid.ai_predicted_fair_market_price || bid.bid_amount; // Fallback
      if (bid.ai_vendor_recommendation_score > maxScore) {
        maxScore = bid.ai_vendor_recommendation_score;
        topReliableCarrier = bid.carrier_company_name || `Carrier #${bid.carrier_company_id}`;
      }
    });
    // Calculate percentage difference
    if (totalMLPrice > 0) {
      avgSavings = (((totalMLPrice - totalBidAmount) / totalMLPrice) * 100).toFixed(1);
    }
  }

  return (
    <div className={`fm-slide-wrapper ${isLeaving ? 'fm-slide-out' : ''}`}>
      <div className="fm-page" style={{ padding: '20px', fontFamily: 'sans-serif' }}>
        
        {/* HEADER PANEL */}
        <div className="fm-header" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button className="fm-back-btn" onClick={() => { setIsLeaving(true); setTimeout(() => navigate('/dashboard'), 360); }}>← Back to Dashboard</button>
          <div style={{ textAlign: 'center' }}>
            <h1 className="fm-title">🏢 Organization Dispatch Control</h1>
            <p className="fm-subtitle">Active Role: Shipper / Organization</p>
          </div>
          <div className="fm-stats" style={{ display: 'flex', gap: '15px' }}>
            <div className="fm-stat"><span>{totalQuotations}</span> Active Bids</div>
          </div>
        </div>

        {/* ── ANALYTICAL REPORTS REMOVED PER USER REQUEST ── */}

        <div style={{ display: 'flex', gap: '25px', alignItems: 'flex-start' }}>
          {/* Create Load Form */}
          <div className="shipper-panel" style={{ flex: '0 0 35%', background: 'white', padding: '25px', borderRadius: '12px', border: '1px solid #e8e3dd', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <h3 style={{ marginTop: 0, color: '#5c4033', fontSize: '1.3rem' }}>Initialize Freight Auction</h3>
            <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '20px' }}>Publish a new corridor to the open market for carriers to submit quotations.</p>
            <form onSubmit={handleCreateLoad} style={{ display: 'grid', gap: '15px' }}>
              <input type="text" placeholder="Title (e.g. Mumbai to Delhi - Steel)" value={formTitle} onChange={e => setFormTitle(e.target.value)} style={{...inputStyle, borderColor: '#ccc'}} required />
              <div style={{ position: 'relative' }}>
                <input type="text" placeholder="Origin Hub Location (Autocomplete Active)" value={formOrigin} onChange={e => { setFormOrigin(e.target.value); setShowOriginDropdown(true); }} onFocus={() => setShowOriginDropdown(true)} onBlur={() => setTimeout(() => setShowOriginDropdown(false), 200)} style={inputStyle} required />
                {showOriginDropdown && originSuggestions.length > 0 && (
                  <ul style={dropdownStyle}>
                    {originSuggestions.map(place => (
                      <li key={place.place_id} onMouseDown={() => { setFormOrigin(place.display_name); setShowOriginDropdown(false); }} style={suggestionStyle} onMouseEnter={e => e.target.style.background = '#f4efea'} onMouseLeave={e => e.target.style.background = 'white'}>📍 {place.display_name}</li>
                    ))}
                  </ul>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <input type="text" placeholder="Destination Target Hub" value={formDest} onChange={e => { setFormDest(e.target.value); setShowDestDropdown(true); }} onFocus={() => setShowDestDropdown(true)} onBlur={() => setTimeout(() => setShowDestDropdown(false), 200)} style={inputStyle} required />
                {showDestDropdown && destSuggestions.length > 0 && (
                  <ul style={dropdownStyle}>
                    {destSuggestions.map(place => (
                      <li key={place.place_id} onMouseDown={() => { setFormDest(place.display_name); setShowDestDropdown(false); }} style={suggestionStyle} onMouseEnter={e => e.target.style.background = '#f4efea'} onMouseLeave={e => e.target.style.background = 'white'}>📍 {place.display_name}</li>
                    ))}
                  </ul>
                )}
              </div>
              <input type="text" placeholder="Cargo Description" value={formCargo} onChange={e => setFormCargo(e.target.value)} style={{...inputStyle, borderColor: '#ccc'}} required />
              <input type="number" step="0.1" placeholder="Weight (Tons)" value={formWeight} onChange={e => setFormWeight(e.target.value)} style={{...inputStyle, borderColor: '#ccc'}} required />
              <button type="submit" style={{ background: '#5c4033', color: 'white', padding: '14px', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem', marginTop: '10px' }}>
                Publish Corridor to Bidding Board 🚀
              </button>
            </form>
          </div>

          {/* Received Bids Dashboard */}
          <div style={{ flex: '1' }}>
            <h3 style={{ marginTop: 0, color: '#5c4033', fontSize: '1.3rem' }}>📥 Incoming Carrier Proposals</h3>
            {incomingBids.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', background: 'white', borderRadius: '12px', border: '1px dashed #ccc', color: '#888' }}>
                No active proposals received yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {incomingBids.map(bid => {
                  let isRiskyPrice = false;
                  if (bid.ai_predicted_fair_market_price > 0) {
                    const diffPct = ((bid.bid_amount - bid.ai_predicted_fair_market_price) / bid.ai_predicted_fair_market_price) * 100;
                    isRiskyPrice = diffPct > 15;
                  }
                  
                  const mlActive = bid.ai_vendor_recommendation_score !== null;
                  const isExpanded = expandedVendor[bid.id];

                  return (
                    <div key={bid.id} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', background: 'white', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                      <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <h4 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', color: '#1e293b' }}>{bid.load_title}</h4>
                          <p style={{ margin: 0, fontSize: '0.95rem', color: '#475569' }}>
                            <strong>Vendor:</strong> {bid.carrier_company_name || `Carrier ID #${bid.carrier_company_id}`} <br/>
                            <strong>Proposed Delivery:</strong> {bid.estimated_delivery_hours}h
                          </p>
                          <button 
                            onClick={() => setExpandedVendor(prev => ({...prev, [bid.id]: !prev[bid.id]}))}
                            style={{ background: 'none', border: 'none', color: '#2563eb', padding: '5px 0', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold', marginTop: '5px', textDecoration: 'underline' }}
                          >
                            {isExpanded ? 'Hide Vendor Profile' : 'View Full Vendor Profile'}
                          </button>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: isRiskyPrice ? '#dc2626' : '#16a34a' }}>
                            ₹{bid.bid_amount?.toLocaleString()}
                          </div>
                          <small style={{ color: '#94a3b8', display: 'block', marginTop: '4px' }}>Target: Quotation Mode</small>
                        </div>
                      </div>

                      {/* Detailed Vendor Profile Dropdown */}
                      {isExpanded && (
                        <div style={{ background: '#f8fafc', padding: '15px 20px', borderTop: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                          <div>
                            <p style={{ margin: '0 0 5px 0', fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Corporate Profile</p>
                            <p style={{ margin: '3px 0', fontSize: '0.95rem', color: '#0f172a' }}><strong>Primary Contact:</strong> {bid.carrier_contact_email}</p>
                            <p style={{ margin: '3px 0', fontSize: '0.95rem', color: '#0f172a' }}><strong>Verified Carrier ID:</strong> #{bid.carrier_company_id}</p>
                          </div>
                          <div>
                            <p style={{ margin: '0 0 5px 0', fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Operational Capacity</p>
                            <p style={{ margin: '3px 0', fontSize: '0.95rem', color: '#0f172a' }}><strong>Active Fleet Size:</strong> {bid.carrier_fleet_size} Vehicles</p>
                            <p style={{ margin: '3px 0', fontSize: '0.95rem', color: '#0f172a' }}><strong>Registered Drivers:</strong> {bid.carrier_driver_count} Personnel</p>
                          </div>
                        </div>
                      )}

                      {/* ML Inference Card */}
                      {mlActive && (
                        <div style={{ background: isRiskyPrice ? '#fef2f2' : '#f0fdf4', padding: '15px 20px', borderTop: isRiskyPrice ? '1px solid #fecaca' : '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: '20px' }}>
                          <div style={{ fontSize: '2.5rem' }}>{isRiskyPrice ? '⚠️' : '🧠'}</div>
                          <div style={{ flex: '1' }}>
                            <h5 style={{ margin: '0 0 5px 0', color: isRiskyPrice ? '#b91c1c' : '#166534', fontSize: '1rem' }}>AI Vendor Intelligence Report</h5>
                            <p style={{ margin: 0, fontSize: '0.9rem', color: '#334155' }}>
                              ML Fair Market Rate: <strong>₹{bid.ai_predicted_fair_market_price?.toLocaleString() || 'N/A'}</strong><br/>
                              Vendor Reliability Score: <strong>{bid.ai_vendor_recommendation_score}/100</strong>
                            </p>
                          </div>
                          {bid.status === 'PENDING' ? (
                            <button onClick={() => handleAwardContract(bid.id)} style={{ background: '#5c4033', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.95rem', transition: 'background 0.2s' }}>
                              Award Contract
                            </button>
                          ) : (
                            <span style={{ padding: '8px 16px', background: '#e0e7ff', color: '#3730a3', borderRadius: '6px', fontWeight: 'bold' }}>{bid.status}</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
