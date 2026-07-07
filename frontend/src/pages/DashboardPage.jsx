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
          <button 
            className="bidding-platform-btn"
            onClick={() => setActiveTab('marketplace')}
            style={{
              backgroundColor: activeTab === 'marketplace' ? '#f0a85d' : '#5c401b',
              color: '#fff',
              border: '1px solid #e9dfd3',
              padding: '0.6rem 1.2rem',
              borderRadius: '6px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
          >
            📢 Freight Bidding Platform
          </button>
          <span className="tenant-badge">Corporate Dispatcher</span>
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