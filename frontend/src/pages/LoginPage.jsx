import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../services/authService'
import './LoginPage.css'

// Import images (Vite handles static asset imports)
import heroImg from '../assets/login/fleet_hero.png'
import routeImg from '../assets/login/fleet_route.png'
import trackImg from '../assets/login/fleet_track.png'
import analyticsImg from '../assets/login/fleet_analytics.png'
import warehouseImg from '../assets/login/fleet_warehouse.png'

const GREETING_MAP = {
  morning: 'Good Morning!',
  afternoon: 'Good Afternoon!',
  evening: 'Good Evening!',
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return GREETING_MAP.morning
  if (hour < 18) return GREETING_MAP.afternoon
  return GREETING_MAP.evening
}

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [greeting] = useState(getGreeting)

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (localStorage.getItem('access_token')) {
      navigate('/dashboard', { replace: true })
    }
  }, [navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Please fill in all fields.')
      return
    }

    setLoading(true)
    try {
      const data = await login(email, password)
      // Store JWT token
      localStorage.setItem('access_token', data.access_token)
      localStorage.setItem('token_type', data.token_type)
      // Redirect to dashboard
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-root">
      {/* ── LEFT PANEL ── */}
      <div className="login-left">
        {/* ── Centered inner column ── */}
        <div className="login-left-inner">

          {/* Logo */}
          <div className="login-logo">
            <div className="login-logo-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 3H15C15.6 3 16 3.4 16 4V16H1V3Z" fill="currentColor" opacity="0.9"/>
                <path d="M16 8H19L23 12V16H16V8Z" fill="currentColor" opacity="0.7"/>
                <circle cx="5.5" cy="18.5" r="2.5" fill="currentColor"/>
                <circle cx="18.5" cy="18.5" r="2.5" fill="currentColor"/>
              </svg>
            </div>
            <span className="login-logo-text">
              FLEETPILOT
              <small>FLEET ADMIN PORTAL</small>
            </span>
          </div>

          {/* Greeting */}
          <div className="login-greeting">
            <h1>{greeting}</h1>
            <p>Enter your credentials to access your fleet portal.</p>
          </div>

          {/* Form */}
          <form className="login-form" onSubmit={handleSubmit} noValidate>
            {error && (
              <div className="login-error" role="alert">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                </svg>
                {error}
              </div>
            )}

            <div className="login-field">
              <label htmlFor="login-email">EMAIL</label>
              <div className="login-input-wrap">
                <span className="login-input-icon">
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M2.5 6.5l7.5 5 7.5-5" strokeLinecap="round"/>
                    <rect x="1.5" y="4" width="17" height="13" rx="2" />
                  </svg>
                </span>
                <input
                  id="login-email"
                  type="email"
                  placeholder="you@fleet.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="login-field">
              <div className="login-field-header">
                <label htmlFor="login-password">PASSWORD</label>
                <button type="button" className="login-forgot" tabIndex={0}>
                  Forgot password?
                </button>
              </div>
              <div className="login-input-wrap">
                <span className="login-input-icon">
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="4" y="9" width="12" height="9" rx="1.5"/>
                    <path d="M7 9V6.5a3 3 0 016 0V9" strokeLinecap="round"/>
                  </svg>
                </span>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="login-eye"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((s) => !s)}
                >
                  {showPassword ? (
                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M3 10s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z"/>
                      <circle cx="10" cy="10" r="2"/>
                      <path d="M3 3l14 14" strokeLinecap="round"/>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M3 10s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z"/>
                      <circle cx="10" cy="10" r="2"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              id="login-submit"
              type="submit"
              className={`login-btn${loading ? ' loading' : ''}`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="login-spinner" />
                  Signing in…
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <p className="login-signup">
            Need an admin account?{' '}
            <a href="#" className="login-signup-link">
              Contact your administrator
            </a>
          </p>

          <footer className="login-footer">
            FLEET TRACKING · ROUTE OPTIMISATION · LIVE ANALYTICS
          </footer>

        </div>{/* /login-left-inner */}
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="login-right">
        {/* Right panel logo */}
        <div className="login-right-logo">
          <div className="login-logo-icon small">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 3H15C15.6 3 16 3.4 16 4V16H1V3Z" fill="currentColor" opacity="0.9"/>
              <path d="M16 8H19L23 12V16H16V8Z" fill="currentColor" opacity="0.7"/>
              <circle cx="5.5" cy="18.5" r="2.5" fill="currentColor"/>
              <circle cx="18.5" cy="18.5" r="2.5" fill="currentColor"/>
            </svg>
          </div>
          <span className="login-logo-text">
            FLEETPILOT
            <small>FLEET &amp; ADMIN PORTAL</small>
          </span>
        </div>

        {/* Hero headline */}
        <h2 className="login-right-headline">
          Smart navigation,<br />real-time intelligence.
        </h2>

        {/* Image grid */}
        <div className="login-grid">
          {/* Large top image */}
          <div className="login-grid-item span-2">
            <img src={heroImg} alt="Fleet depot at dusk" />
            <div className="login-grid-label">
              <small>OUR FLEET</small>
              <span>Modern vehicles, smart operations</span>
            </div>
          </div>

          {/* Bottom 2×2 grid — 4 cards, fully filled */}
          <div className="login-grid-item">
            <img src={routeImg} alt="Route optimisation" />
            <div className="login-grid-label">
              <small>ROUTE AI</small>
              <span>Optimised delivery paths</span>
            </div>
          </div>
          <div className="login-grid-item">
            <img src={trackImg} alt="Live tracking" />
            <div className="login-grid-label">
              <small>LIVE TRACKING</small>
              <span>Real-time GPS visibility</span>
            </div>
          </div>
          <div className="login-grid-item">
            <img src={analyticsImg} alt="Fleet analytics" />
            <div className="login-grid-label">
              <small>ANALYTICS</small>
              <span>Performance &amp; fuel insights</span>
            </div>
          </div>
          <div className="login-grid-item">
            <img src={warehouseImg} alt="Smart warehouse" />
            <div className="login-grid-label">
              <small>WAREHOUSE</small>
              <span>Smart depot operations</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
