import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Nav() {
  const navigate = useNavigate()
  const { user, setUser } = useAuth()

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    navigate('/login')
  }

  const firstName = user && user.name ? user.name.split(' ')[0] : null

  return (
    <nav style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #ddd', display: 'flex', alignItems: 'center' }}>
      <div style={{ flex: 1 }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', minWidth: 240 }}>
  <Link to="/" className="nav-btn">Home</Link>
  {user && <Link to="/posts/new" className="nav-btn">Create Post</Link>}
        {firstName && <div style={{ fontWeight: 600 }}>Hi {firstName}</div>}
        {!user ? (
          <>
            <Link to="/login" style={{ marginLeft: 8 }}>Login</Link>
            <Link to="/register" style={{ marginLeft: 8 }}>Register</Link>
          </>
        ) : (
          <>
            <button onClick={handleLogout}>Logout</button>
          </>
        )}
      </div>
    </nav>
  )
}
