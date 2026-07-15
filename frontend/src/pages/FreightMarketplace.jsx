import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchMarketplaceLoads, placeCarrierBid, fetchMyBids } from '../api/marketplace';
import './FreightMarketplace.css';

const statusColor = {
  Open: { bg: '#d1fae5', color: '#065f46' },
  Bidding: { bg: '#fef3c7', color: '#92400e' },
  Awarded: { bg: '#e0e7ff', color: '#3730a3' },
};

export default function FreightMarketplace() {
  const navigate = useNavigate();

  // Dynamic State Control
  const [listings, setListings] = useState([]);
  const [myBids, setMyBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [biddingId, setBiddingId] = useState(null);
  const [bidAmount, setBidAmount] = useState('');
  const [deliveryHours, setDeliveryHours] = useState('36');
  const [submitted, setSubmitted] = useState({});
  const [isLeaving, setIsLeaving] = useState(false);
  
  // Navigation Tabs for Carrier: 'board' (open loads) or 'my_bids' (placed bids)
  const [activeTab, setActiveTab] = useState('board'); 

  useEffect(() => {
    loadAllMarketData();
  }, []);

  const loadAllMarketData = async () => {
    try {
      const [loadsData, myBidsData] = await Promise.all([
        fetchMarketplaceLoads(),
        fetchMyBids()
      ]);

      const formattedLoads = loadsData.map(load => ({
        id: load.id,
        route: load.title,
        weight: `${load.weight_tons} Tons`,
        type: load.cargo_description || 'General Freight',
        rate: load.target_price > 0 ? `₹${load.target_price?.toLocaleString()}` : 'Open for Quotation',
        poster: `Tenant Scope: #${load.company_id}`,
        posted: new Date(load.created_at).toLocaleDateString(),
        status: load.status.charAt(0).toUpperCase() + load.status.slice(1).toLowerCase()
      }));

      setListings(formattedLoads);
      setMyBids(myBidsData);
      setLoading(false);
    } catch (err) {
      console.error("Failed to sync marketplace data layers:", err);
      setLoading(false);
    }
  };

  const handleBid = async (id) => {
    if (!bidAmount) return;
    const parsingAmount = parseFloat(bidAmount.replace(/[^\d.]/g, ''));
    if (isNaN(parsingAmount)) return alert("Please specify a valid numerical value.");

    try {
      await placeCarrierBid(id, parsingAmount, parseInt(deliveryHours));
      setSubmitted(prev => ({ ...prev, [id]: `₹${parsingAmount?.toLocaleString()}` }));
      setBidAmount('');
      setBiddingId(null);
      alert("Bid placed successfully!");
      loadAllMarketData(); // Reload to update "My Bids"
    } catch (err) {
      alert(`Bidding Blocked: ${err.response?.data?.detail || "Transaction anomaly."}`);
    }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#F4EFEA', color: '#4A3B32', fontWeight: 'bold' }}>Syncing Open Freight Tenders...</div>;

  const inputStyle = { width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #7f9527', boxSizing: 'border-box' };

  return (
    <div className={`fm-slide-wrapper ${isLeaving ? 'fm-slide-out' : ''}`}>
      <div className="fm-page" style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* HEADER PANEL */}
        <div className="fm-header" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e8e3dd' }}>
          <button className="fm-back-btn" onClick={() => { setIsLeaving(true); setTimeout(() => navigate('/dashboard'), 360); }} style={{ padding: '8px 16px', background: '#f4efea', color: '#5c4033', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>← Back to Dashboard</button>
          <div style={{ textAlign: 'center' }}>
            <h1 className="fm-title" style={{ margin: '0 0 5px 0' }}>🚛 Carrier Logistics Board</h1>
            <p className="fm-subtitle" style={{ margin: 0, color: '#666' }}>Active Role: Logistics Provider (Carrier)</p>
          </div>
          <div className="fm-stats" style={{ display: 'flex', gap: '15px' }}>
            <div className="fm-stat" style={{ textAlign: 'center' }}><span style={{ display: 'block', fontSize: '1.5rem', fontWeight: 'bold', color: '#5c4033' }}>{listings.length}</span> Total Corridors</div>
            <div className="fm-stat" style={{ textAlign: 'center' }}><span style={{ display: 'block', fontSize: '1.5rem', fontWeight: 'bold', color: '#16a34a' }}>{myBids.length}</span> Active Bids</div>
          </div>
        </div>

        {/* TAB NAVIGATION */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '25px', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>
          <button 
            onClick={() => setActiveTab('board')}
            style={{ padding: '10px 20px', fontSize: '1.1rem', fontWeight: 'bold', border: 'none', background: 'none', cursor: 'pointer', color: activeTab === 'board' ? '#5c4033' : '#94a3b8', borderBottom: activeTab === 'board' ? '3px solid #5c4033' : '3px solid transparent', transition: 'all 0.2s' }}
          >
            📋 Open Market Board
          </button>
          <button 
            onClick={() => setActiveTab('my_bids')}
            style={{ padding: '10px 20px', fontSize: '1.1rem', fontWeight: 'bold', border: 'none', background: 'none', cursor: 'pointer', color: activeTab === 'my_bids' ? '#5c4033' : '#94a3b8', borderBottom: activeTab === 'my_bids' ? '3px solid #5c4033' : '3px solid transparent', transition: 'all 0.2s' }}
          >
            📦 My Active Bids
          </button>
        </div>

        {/* ── TAB 1: OPEN BOARD ── */}
        {activeTab === 'board' && (
          <div className="carrier-panel">
            <div className="fm-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
              {listings.length === 0 ? (
                <p>No open freight listings right now.</p>
              ) : listings.map(listing => (
                <div key={listing.id} className="fm-card" style={{ border: '1px solid #ccc', borderRadius: '12px', background: 'white', padding: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                    <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#333', paddingRight: '10px' }}>{listing.route}</h4>
                    <span style={{ whiteSpace: 'nowrap', padding: '4px 10px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 'bold', background: statusColor[listing.status]?.bg || '#fef3c7', color: statusColor[listing.status]?.color || '#92400e' }}>{listing.status}</span>
                  </div>
                  
                  <div style={{ fontSize: '0.95rem', color: '#555', marginBottom: '20px', background: '#f8fafc', padding: '15px', borderRadius: '8px' }}>
                    <p style={{ margin: '5px 0' }}><strong>Target Rate:</strong> <span style={{ color: '#16a34a', fontWeight: 'bold' }}>{listing.rate}</span></p>
                    <p style={{ margin: '5px 0' }}><strong>Cargo:</strong> {listing.type} ({listing.weight})</p>
                    <p style={{ margin: '5px 0' }}><strong>Organization:</strong> {listing.poster}</p>
                  </div>

                  {submitted[listing.id] ? (
                    <div style={{ background: '#eef9f0', color: '#28a745', padding: '12px', borderRadius: '8px', textAlign: 'center', fontWeight: 'bold' }}>
                      Bid Submitted: {submitted[listing.id]}
                    </div>
                  ) : listing.status !== 'Awarded' ? (
                    biddingId === listing.id ? (
                      <div style={{ background: '#fcfaf7', padding: '15px', borderRadius: '8px', border: '1px solid #e9dfd3' }}>
                        <input type="text" placeholder="Your Counter Bid (₹)" value={bidAmount} onChange={e => setBidAmount(e.target.value)} style={{...inputStyle, padding: '10px', marginBottom: '10px'}} />
                        <select value={deliveryHours} onChange={e => setDeliveryHours(e.target.value)} style={{...inputStyle, padding: '10px', marginBottom: '15px'}}>
                          <option value="24">24 Hours (Express)</option>
                          <option value="36">36 Hours (Standard)</option>
                          <option value="48">48 Hours (Economy)</option>
                        </select>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button onClick={() => handleBid(listing.id)} style={{ flex: 1, background: '#16a34a', color: 'white', padding: '10px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Submit →</button>
                          <button onClick={() => setBiddingId(null)} style={{ flex: 1, background: '#e2e8f0', color: '#334155', padding: '10px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setBiddingId(listing.id)} style={{ width: '100%', background: '#f4efea', color: '#5c4033', padding: '12px', border: '1px solid #d4c5b5', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', transition: '0.2s', fontSize: '1rem' }}>
                        Place Quotation
                      </button>
                    )
                  ) : (
                    <div style={{ background: '#f5f5f5', color: '#888', padding: '12px', borderRadius: '8px', textAlign: 'center', fontWeight: 'bold' }}>Auction Closed</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 2: MY BIDS ── */}
        {activeTab === 'my_bids' && (
          <div className="carrier-panel">
            <div style={{ display: 'grid', gap: '20px' }}>
              {myBids.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', background: 'white', borderRadius: '12px', border: '1px dashed #ccc', color: '#888' }}>
                  You haven't placed any bids yet. Head to the Open Market Board to start bidding!
                </div>
              ) : myBids.map(bid => {
                const isAwarded = bid.status === 'AWARDED' || bid.status === 'ACCEPTED'; // Handle both variations
                const isRejected = bid.status === 'REJECTED';
                
                let bidStatusColor = '#f59e0b'; // Pending
                if (isAwarded) bidStatusColor = '#16a34a'; // Green
                if (isRejected) bidStatusColor = '#dc2626'; // Red
                if (bid.load_status === 'AWARDED' && !isAwarded) bidStatusColor = '#64748b'; // Load closed, lost bid

                return (
                  <div key={bid.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                    <div>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: '1.15rem', color: '#1e293b' }}>{bid.load_title}</h4>
                      <p style={{ margin: '0 0 5px 0', color: '#64748b' }}><strong>Shipper:</strong> {bid.shipper_company_name}</p>
                      <p style={{ margin: 0, color: '#64748b' }}><strong>Route:</strong> {bid.load_origin} → {bid.load_destination} | <strong>Weight:</strong> {bid.load_weight_tons} Tons</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0f172a' }}>
                        ₹{bid.bid_amount?.toLocaleString()}
                      </div>
                      <div style={{ marginTop: '8px' }}>
                        <span style={{ padding: '6px 12px', background: `${bidStatusColor}20`, color: bidStatusColor, borderRadius: '6px', fontWeight: 'bold', fontSize: '0.85rem' }}>
                          BID STATUS: {bid.status}
                        </span>
                      </div>
                      <p style={{ margin: '8px 0 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>Est. Delivery: {bid.estimated_delivery_hours}h</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}