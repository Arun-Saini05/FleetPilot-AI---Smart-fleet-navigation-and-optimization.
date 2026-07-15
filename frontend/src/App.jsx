import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import FreightMarketplace from './pages/FreightMarketplace'
import OrganizationMarketplace from './pages/OrganizationMarketplace'
import { getToken } from './services/authService'

/** Guard: redirect to /login when no token exists */
function PrivateRoute({ children }) {
  return getToken() ? children : <Navigate to="/login" replace />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <DashboardPage />
            </PrivateRoute>
          }
        />

        {/* Freight Marketplace */}
        <Route
          path="/marketplace"
          element={
            <PrivateRoute>
              <FreightMarketplace />
            </PrivateRoute>
          }
        />

        {/* Organization Marketplace */}
        <Route
          path="/organization-marketplace"
          element={
            <PrivateRoute>
              <OrganizationMarketplace />
            </PrivateRoute>
          }
        />

        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
