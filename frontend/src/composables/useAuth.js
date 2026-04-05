import { ref, computed } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

// Shared state
const token = ref(localStorage.getItem('token') || null)
const role = ref(localStorage.getItem('role') || null)
const customRoleId = ref(localStorage.getItem('custom_role_id') || null)
const username = ref(localStorage.getItem('username') || null)

// Create an Axios instance with base URL
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:3000'
})

// Request interceptor to add token
api.interceptors.request.use(config => {
  if (token.value) {
    config.headers.Authorization = `Bearer ${token.value}`
  }
  return config
})

export function useAuth() {
  const router = useRouter()

  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => role.value === 'admin')

  const login = async (loginData) => {
    try {
      const { data } = await api.post('/api/auth/login', loginData)
      setSession(data.token, data.role, data.custom_role_id, loginData.username)
      return true
    } catch (err) {
      throw err.response?.data?.error || err.response?.data?.detail || 'Login failed'
    }
  }

  const register = async (registerData) => {
    try {
      await api.post('/api/auth/register', registerData)
      return true
    } catch (err) {
      throw err.response?.data?.error || err.response?.data?.detail || 'Registration failed'
    }
  }

  const logout = () => {
    token.value = null
    role.value = null
    customRoleId.value = null
    username.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    localStorage.removeItem('custom_role_id')
    localStorage.removeItem('username')
    
    if (router) {
      router.push('/login')
    }
  }

  const setSession = (t, r, crId, u) => {
    token.value = t
    role.value = r
    customRoleId.value = crId
    username.value = u
    localStorage.setItem('token', t)
    localStorage.setItem('role', r)
    if (crId) localStorage.setItem('custom_role_id', crId)
    localStorage.setItem('username', u)
  }

  return {
    api,
    token,
    role,
    customRoleId,
    username,
    isAuthenticated,
    isAdmin,
    login,
    register,
    logout
  }
}
