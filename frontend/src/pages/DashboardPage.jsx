import { useNavigate } from 'react-router-dom'
import { logout } from '../services/authService'

export default function DashboardPage() {
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#1a1208',
      color: '#fff',
      fontFamily: 'Inter, system-ui, sans-serif',
      gap: '1.5rem',
    }}>
      <div style={{ fontSize: '3rem' }}>🚛</div>
      <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 800 }}>
        FleetPilot Dashboard
      </h1>
      <p style={{ color: '#9ca3af', margin: 0 }}>
        Day 1 complete — login &amp; JWT authentication working ✅
      </p>
      <button
        onClick={handleLogout}
        style={{
          marginTop: '1rem',
          background: '#d97706',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          padding: '10px 24px',
          fontSize: '0.9rem',
          fontWeight: 700,
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        Sign out
      </button>
    </div>
  )
}
