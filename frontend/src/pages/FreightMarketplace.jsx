import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchMarketplaceLoads, placeCarrierBid, fetchIncomingBids, awardFreightContract } from '../api/marketplace';
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
  const [incomingBids, setIncomingBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [biddingId, setBiddingId] = useState(null);
  const [bidAmount, setBidAmount] = useState('');
  const [deliveryHours, setDeliveryHours] = useState('36');
  const [submitted, setSubmitted] = useState({});
  const [isLeaving, setIsLeaving] = useState(false);
  const [activeTab, setActiveTab] = useState('board'); // 'board' or 'proposals'

  // Query market indices and shipper bids on mount
  useEffect(() => {
    loadAllMarketData();
  }, []);

  const loadAllMarketData = async () => {
    try {
      const [loadsData, bidsData] = await Promise.all([
        fetchMarketplaceLoads(),
        fetchIncomingBids()
      ]);

      const formattedLoads = loadsData.map(load => ({
        id: load.id,
        route: load.title,
        weight: `${load.weight_tons} Tons`,
        type: load.cargo_description || 'General Freight',
        rate: `₹${load.target_price.toLocaleString()}`,
        poster: `Tenant Scope: #${load.company_id}`,
        posted: new Date(load.created_at).toLocaleDateString(),
        status: load.status.charAt(0).toUpperCase() + load.status.slice(1).toLowerCase()
      }));

      setListings(formattedLoads);
      setIncomingBids(bidsData);
      setLoading(false);
    } catch (err) {
      console.error("Failed to sync marketplace data layers:", err);
      setLoading(false);
    }
  };

  const handleBackToDashboard = () => {
    setIsLeaving(true);
    setTimeout(() => navigate('/dashboard'), 360);
  };

  const handleBid = async (id) => {
    if (!bidAmount) return;
    const parsingAmount = parseFloat(bidAmount.replace(/[^\d.]/g, ''));
    if (isNaN(parsingAmount)) return alert("Please specify a valid numerical value.");

    try {
      await placeCarrierBid(id, parsingAmount, parseInt(deliveryHours));
      setSubmitted(prev => ({ ...prev, [id]: `₹${parsingAmount.toLocaleString()}` }));
      setBidAmount('');
      setBiddingId(null);
      loadAllMarketData();
    } catch (err) {
      alert(`Bidding Blocked: ${err.response?.data?.detail || "Transaction anomaly."}`);
    }
  };

  // Handle awarding a contract to a specific carrier bid
  const handleAwardContract = async (bidId) => {
    try {
      const confirmation = window.confirm("Are you sure you want to accept this carrier bid and close the auction?");
      if (!confirmation) return;

      const result = await awardFreightContract(bidId);
      alert(result.message || "Contract successfully awarded!");
      loadAllMarketData(); // Refresh metrics instantly
    } catch (err) {
      alert(`Awarding Failed: ${err.response?.data?.detail || "Transaction error."}`);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#F4EFEA', color: '#4A3B32', fontWeight: 'bold' }}>
        Syncing Engine Registry Board Tenders...
      </div>
    );
  }

  return (
    <div className={`fm-slide-wrapper ${isLeaving ? 'fm-slide-out' : ''}`}>
      <div className="fm-page">
        {/* HEADER PANEL */}
        <div className="fm-header">
          <button className="fm-back-btn" onClick={handleBackToDashboard}>
            ← Back to Dashboard
          </button>
          <div className="fm-header-center">
            <h1 className="fm-title">🚚 Freight Bidding Marketplace</h1>
            <p className="fm-subtitle">Live open-load board — bid on available freight corridors</p>

            {/* View Switching Toggle Buttons */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '15px' }}>
              <button
                onClick={() => setActiveTab('board')}
                style={{ backgroundColor: activeTab === 'board' ? '#5c4033' : '#e8e3dd', color: activeTab === 'board' ? 'white' : '#5c4033', padding: '6px 16px', borderRadius: '15px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Browse Available Loads ({listings.length})
              </button>
              <button
                onClick={() => setActiveTab('proposals')}
                style={{ backgroundColor: activeTab === 'proposals' ? '#5c4033' : '#e8e3dd', color: activeTab === 'proposals' ? 'white' : '#5c4033', padding: '6px 16px', borderRadius: '15px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Received Proposals ({incomingBids.length})
              </button>
            </div>
          </div>
          <div className="fm-stats">
            <div className="fm-stat"><span>{listings.filter(l => l.status === 'Open').length}</span> Open</div>
            <div className="fm-stat"><span>{listings.filter(l => l.status === 'Bidding').length}</span> Bidding</div>
          </div>
        </div>

        {/* CONDITION-BASED VIEW TAB SWITCHING */}
        {activeTab === 'board' ? (
          /* LISTINGS GRID VIEW */
          <div className="fm-grid">
            {listings.map(listing => (
              <div key={listing.id} className="fm-card">
                <div className="fm-card-top">
                  <div className="fm-route">{listing.route}</div>
                  <span className="fm-status" style={statusColor[listing.status] || statusColor.Open}>
                    {listing.status}
                  </span>
                </div>

                <div className="fm-card-details">
                  <div className="fm-detail"><span>⚖️ Weight</span>{listing.weight}</div>
                  <div className="fm-detail"><span>🚛 Type</span>{listing.type}</div>
                  <div className="fm-detail"><span>🏢 Shipper</span>{listing.poster}</div>
                  <div className="fm-detail"><span>🕐 Posted</span>{listing.posted}</div>
                </div>

                <div className="fm-card-footer">
                  <div className="fm-rate">{listing.rate}</div>

                  {listing.status === 'Awarded' ? (
                    <div className="fm-awarded-tag">Awarded</div>
                  ) : submitted[listing.id] ? (
                    <div className="fm-bid-success">✅ Bid placed: {submitted[listing.id]}</div>
                  ) : biddingId === listing.id ? (
                    <div className="fm-bid-input-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      <input
                        type="text"
                        placeholder="Your bid (₹)"
                        value={bidAmount}
                        onChange={e => setBidAmount(e.target.value)}
                        className="fm-bid-input"
                        style={{ width: '100px' }}
                        autoFocus
                      />
                      <input
                        type="number"
                        placeholder="Hours"
                        value={deliveryHours}
                        onChange={e => setDeliveryHours(e.target.value)}
                        className="fm-bid-input"
                        style={{ width: '60px' }}
                      />
                      <button className="fm-submit-btn" onClick={() => handleBid(listing.id)}>Submit</button>
                      <button className="fm-cancel-btn" onClick={() => setBiddingId(null)}>✕</button>
                    </div>
                  ) : (
                    <button className="fm-bid-btn" onClick={() => setBiddingId(listing.id)}>
                      Place Bid →
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* PROPOSALS LIST VIEW */
          <div style={{ maxWidth: '900px', margin: '0 auto', background: 'white', borderRadius: '15px', padding: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
            <h2 style={{ fontSize: '1.5rem', color: '#2b2625', borderBottom: '2px solid #f4efea', paddingBottom: '10px' }}>Active Bid Offers on Your Freight Posts</h2>
            {incomingBids.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#8c7e7c', padding: '30px' }}>No carrier offers have been submitted on your shipments yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
                {incomingBids.map(bid => (
                  <div key={bid.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', border: '1px solid #e8e3dd', borderRadius: '10px', background: bid.status === 'ACCEPTED' ? '#f0fdf4' : 'white' }}>
                    <div>
                      <span style={{ fontSize: '0.8rem', background: '#e8e3dd', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>LOAD ID: #{bid.load_post_id}</span>
                      <div style={{ marginTop: '5px', fontSize: '1.1rem', fontWeight: 'bold', color: '#5c4033' }}>Carrier Submitting: Tenant #{bid.carrier_company_id}</div>
                      <div style={{ fontSize: '0.9rem', color: '#6b5e5c', marginTop: '3px' }}>⏱️ Commited Delivery Timeline: {bid.estimated_delivery_hours} Hours</div>
                    </div>
                    <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '20px' }}>
                      <div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#2b2625' }}>₹{bid.bid_amount.toLocaleString()}</div>
                        <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: bid.status === 'PENDING' ? '#92400e' : bid.status === 'ACCEPTED' ? '#2e7d32' : '#c41c00' }}>{bid.status}</span>
                      </div>

                      {bid.status === 'PENDING' && (
                        <button
                          onClick={() => handleAwardContract(bid.id)}
                          style={{ backgroundColor: '#2e7d32', color: 'white', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                          Award Contract ✓
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}