import React, { useState, useContext } from 'react'
import { Link, useNavigate } from 'react-router'
import axios from 'axios'
import { CaptainDataContext } from '../context/CapatainContext'

const CaptainLogin = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { setCaptain } = useContext(CaptainDataContext)
  const navigate = useNavigate()

  const submitHandler = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/captains/login`, { email, password })
      if (response.status === 200) {
        const data = response.data
        setCaptain(data.captain)
        localStorage.setItem('token', data.token)
        navigate('/captain-home')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="screen" style={{ display: 'flex', flexDirection: 'column', background: 'var(--surface)' }}>
      <div style={{ padding: '48px 24px 0' }}>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: 'var(--on-surface-variant)', marginBottom: '40px' }}>
          <i className="ri-arrow-left-line" style={{ fontSize: '1.25rem' }}></i>
          <span className="body-md">Back</span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <div style={{ padding: '6px 12px', background: 'var(--primary-fixed)', borderRadius: 'var(--radius-full)' }}>
            <span className="label-lg" style={{ color: 'var(--primary)', fontSize: '0.75rem' }}>
              <i className="ri-steering-2-fill"></i> CAPTAIN
            </span>
          </div>
        </div>

        <h1 className="headline-lg" style={{ marginBottom: '8px' }}>
          Welcome back<span style={{ color: 'var(--primary-container)' }}>,</span>
          <br />Captain<span style={{ color: 'var(--primary-container)' }}>.</span>
        </h1>
        <p className="body-md" style={{ color: 'var(--on-surface-variant)' }}>
          Sign in to start earning
        </p>
      </div>

      <form onSubmit={submitHandler} style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '40px 24px 0' }}>
        {error && (
          <div className="animate-fade-in" style={{ padding: '12px 16px', background: 'var(--error-container)', borderRadius: 'var(--radius-md)', marginBottom: '20px', fontSize: '0.875rem', color: 'var(--error)' }}>
            {error}
          </div>
        )}

        <div className="input-group">
          <label>Email</label>
          <input className="input-field" type="email" required placeholder="captain@quickbike.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="input-group">
          <label>Password</label>
          <input className="input-field" type="password" required placeholder="Your password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ paddingBottom: '32px' }}>
          <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Signing in...' : 'Sign In as Captain'}
          </button>
          <p className="body-md" style={{ textAlign: 'center', marginTop: '20px', color: 'var(--on-surface-variant)' }}>
            New captain? <Link to="/captain-signup" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>Register here</Link>
          </p>
        </div>
      </form>
    </div>
  )
}

export default CaptainLogin