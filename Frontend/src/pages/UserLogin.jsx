import React, { useState, useContext } from 'react'
import { Link, useNavigate } from 'react-router'
import axios from 'axios'
import { UserDataContext } from '../context/UserContext'

const UserLogin = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { setUser } = useContext(UserDataContext)
  const navigate = useNavigate()

  const submitHandler = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/users/login`, { email, password })
      if (response.status === 200) {
        const data = response.data
        setUser(data.user)
        localStorage.setItem('token', data.token)
        navigate('/home')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="screen" style={{ display: 'flex', flexDirection: 'column', background: 'var(--surface)' }}>
      {/* Header */}
      <div style={{ padding: '48px 24px 0' }}>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: 'var(--on-surface-variant)', marginBottom: '40px' }}>
          <i className="ri-arrow-left-line" style={{ fontSize: '1.25rem' }}></i>
          <span className="body-md">Back</span>
        </Link>

        <h1 className="headline-lg" style={{ marginBottom: '8px' }}>
          Welcome back<span style={{ color: 'var(--primary-container)' }}>.</span>
        </h1>
        <p className="body-md" style={{ color: 'var(--on-surface-variant)' }}>
          Sign in to continue your journey
        </p>
      </div>

      {/* Form */}
      <form onSubmit={submitHandler} style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '40px 24px 0' }}>
        {error && (
          <div className="animate-fade-in" style={{ padding: '12px 16px', background: 'var(--error-container)', borderRadius: 'var(--radius-md)', marginBottom: '20px', fontSize: '0.875rem', color: 'var(--error)' }}>
            {error}
          </div>
        )}

        <div className="input-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            className="input-field"
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="input-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            className="input-field"
            type="password"
            required
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ paddingBottom: '32px' }}>
          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={loading}
            style={{ opacity: loading ? 0.7 : 1 }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="ri-loader-4-line" style={{ animation: 'spin 1s linear infinite' }}></i>
                Signing in...
              </span>
            ) : 'Sign In'}
          </button>

          <p className="body-md" style={{ textAlign: 'center', marginTop: '20px', color: 'var(--on-surface-variant)' }}>
            New to QuickBike? <Link to="/signup" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>Create account</Link>
          </p>
        </div>
      </form>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

export default UserLogin