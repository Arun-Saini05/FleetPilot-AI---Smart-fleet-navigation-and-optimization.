import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { logout } from '../services/authService'
import Vehicles from './Vehicles'
import Drivers from './Drivers'
import Shipments from './Shipments'
import OptimizationDashboard from './OptimizationDashboard'
import './DashboardPage.css'

export default function DashboardPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('dashboard')

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const getUserRole = () => {
    try {
      const token = localStorage.getItem('token');
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.company_id === 1 ? 'SHIPPER_ORG' : 'CARRIER_LOGISTICS';
    } catch (e) {
      return 'CARRIER_LOGISTICS';
    }
  };
  const userRole = getUserRole();

  return (
    <div className="dashboard-root">
      {/* UNIFIED HEADER BAR */}
      <header className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="header-left">
          <div className="login-logo" style={{ marginBottom: 0 }}>
            <div className="login-logo-icon">🚛</div>
            <div className="login-logo-text" style={{ color: '#fff' }}>
              FleetPilot
              <small style={{ color: 'rgba(255,255,255,0.6)' }}>Control Center</small>
            </div>
          </div>
          <h1 className="header-title">
            {activeTab === 'dashboard' && 'Operations Hub'}
            {activeTab === 'fleet' && 'Fleet Management'}
            {activeTab === 'drivers' && 'Driver Profiles'}
            {activeTab === 'shipments' && 'Cargo & Shipments'}
            {activeTab === 'marketplace' && 'Freight Bidding Marketplace'}
          </h1>
        </div>

        {/* TOP RIGHT NAVIGATION ACTIONS SECTION */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          
          {userRole === 'SHIPPER_ORG' && (
            <button 
              className="bidding-platform-btn org"
              onClick={() => navigate('/organization-marketplace')}
              style={{
                backgroundColor: '#1d4ed8',
                color: '#fff',
                border: 'none',
                padding: '0.65rem 1.2rem',
                borderRadius: '999px',
                fontWeight: '600',
                fontSize: '0.75rem',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 2px 8px rgba(29, 78, 216, 0.35)',
                transition: 'background 0.2s, transform 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              ORGANIZATION MARKET <span style={{ fontSize: '1rem' }}>→</span>
            </button>
          )}
          
          {userRole === 'CARRIER_LOGISTICS' && (
            <button 
              className="bidding-platform-btn carrier"
              onClick={() => navigate('/marketplace')}
              style={{
                backgroundColor: '#5c401b',
                color: '#e8dfd3',
                border: 'none',
                padding: '0.65rem 1.2rem',
                borderRadius: '999px',
                fontWeight: '600',
                fontSize: '0.75rem',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
                transition: 'background 0.2s, transform 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              CARRIER BOARD <span style={{ fontSize: '1rem' }}>→</span>
            </button>
          )}
          
          <span className="tenant-badge">{userRole === 'SHIPPER_ORG' ? 'Shipper Hub' : 'Carrier Hub'}</span>
        </div>
      </header>

      {/* DASHBOARD WORKSPACE CONTAINER */}
      <div className="dashboard-container">
        {/* SIDEBAR NAVIGATION */}
        <aside className="dashboard-sidebar">
          <ul className="sidebar-menu">
            <li
              className={`sidebar-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              📊 Dashboard
            </li>
            <li
              className={`sidebar-item ${activeTab === 'fleet' ? 'active' : ''}`}
              onClick={() => setActiveTab('fleet')}
            >
              🚛 Fleet (Vehicles)
            </li>
            <li
              className={`sidebar-item ${activeTab === 'drivers' ? 'active' : ''}`}
              onClick={() => setActiveTab('drivers')}
            >
              👥 Drivers
            </li>
            <li
              className={`sidebar-item ${activeTab === 'shipments' ? 'active' : ''}`}
              onClick={() => setActiveTab('shipments')}
            >
              📦 Shipments
            </li>
          </ul>

          <div className="sidebar-footer">
            <button className="logout-btn" onClick={handleLogout}>
              🚪 Sign Out
            </button>
          </div>
        </aside>

        {/* MAIN VIEW CONTROLLER */}
        <main className="dashboard-main">
          <div className="dashboard-body">
            {activeTab === 'dashboard' && <OptimizationDashboard />}

            {activeTab === 'fleet' && <Vehicles />}

            {activeTab === 'drivers' && <Drivers />}

            {activeTab === 'shipments' && <Shipments />}

            {activeTab === 'marketplace' && (
              <div style={{ padding: '2rem', background: '#fff', borderRadius: '8px', border: '1px solid #e9dfd3' }}>
                <h3>Freight Marketplace Board</h3>
                <p style={{ color: '#666' }}>
                  Independent bidding module container. Third-party open load boards and carrier bid evaluations will be mounted here during Day 15 setup.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}