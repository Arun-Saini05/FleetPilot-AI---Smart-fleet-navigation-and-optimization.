import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

/**
 * Logs in a user and returns { access_token, token_type }.
 * The backend uses OAuth2PasswordRequestForm (form-encoded), not JSON.
 */
export async function login(email, password) {
  try {
    // FastAPI's OAuth2PasswordRequestForm expects application/x-www-form-urlencoded
    const params = new URLSearchParams()
    params.append('username', email) // FastAPI uses 'username' field
    params.append('password', password)

    const response = await axios.post(`${API_BASE}/api/login`, params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })

    return response.data // { access_token, token_type }
  } catch (err) {
    if (err.response?.status === 401) {
      throw new Error('Invalid email or password.')
    }
    if (err.response?.data?.detail) {
      throw new Error(err.response.data.detail)
    }
    throw new Error('Unable to reach the server. Please try again later.')
  }
}

/**
 * Returns the stored Bearer token or null.
 */
export function getToken() {
  return localStorage.getItem('access_token')
}

/**
 * Clears stored auth data (logout).
 */
export function logout() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('token_type')
}

/**
 * Returns an axios instance pre-configured with the JWT token in the
 * Authorization header — ready to use for protected endpoints.
 */
export function authClient() {
  const token = getToken()
  return axios.create({
    baseURL: API_BASE,
    headers: {
      Authorization: token ? `Bearer ${token}` : undefined,
    },
  })
}
