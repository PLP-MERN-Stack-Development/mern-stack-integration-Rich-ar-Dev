import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services/apiClient'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { setUser } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await authService.login({ email, password })
      setLoading(false)
      // authService stores token in localStorage
      // Update context immediately so Nav updates
      try {
        const logged = res && res.data
        if (logged && logged.user) setUser(logged.user)
        else {
          const raw = localStorage.getItem('user')
          if (raw) setUser(JSON.parse(raw))
        }
      } catch (e) {
        // ignore
      }
      navigate('/')
    } catch (err) {
      setLoading(false)
      setError(err.response?.data?.error || err.message || 'Login failed')
    }
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto' }}>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        </div>
        <div>
          <label>Password</label>
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" disabled={loading}>{loading ? 'Logging...' : 'Login'}</button>
      </form>
    </div>
  )
}
