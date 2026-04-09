import React, { useState, useContext } from 'react'
import { Link, useNavigate } from 'react-router'
import axios from 'axios'
import { UserDataContext } from '../context/UserContext'

const UserSignup = () => {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
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
      const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/users/register`, {
        fullname: { firstname: firstName, lastname: lastName },
        email,
        password,
      })

      if (response.status === 201) {
        const data = response.data
        setUser(data.user)
        localStorage.setItem('token', data.token)
        navigate('/home')
      }
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="screen" style={{ display: 'flex', flexDirection: 'column', background: 'var(--surface)' }}>
      {/* Header */}
      <div style={{ padding: '48px 24px 0' }}>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: 'var(--on-surface-variant)', marginBottom: '32px' }}>
          <i className="ri-arrow-left-line" style={{ fontSize: '1.25rem' }}></i>
          <span className="body-md">Back</span>
        </Link>

        <h1 className="headline-lg" style={{ marginBottom: '8px' }}>
          Create your
          <br />
          account<span style={{ color: 'var(--primary-container)' }}>.</span>
        </h1>
        <p className="body-md" style={{ color: 'var(--on-surface-variant)' }}>
          Join thousands of riders in your city
        </p>
      </div>

      {/* Form */}
      <form onSubmit={submitHandler} style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '32px 24px 0' }}>
        {error && (
          <div className="animate-fade-in" style={{ padding: '12px 16px', background: 'var(--error-container)', borderRadius: 'var(--radius-md)', marginBottom: '16px', fontSize: '0.875rem', color: 'var(--error)' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px' }}>
          <div className="input-group" style={{ flex: 1 }}>
            <label htmlFor="firstName">First Name</label>
            <input
              id="firstName"
              className="input-field"
              type="text"
              required
              placeholder="John"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div className="input-group" style={{ flex: 1 }}>
            <label htmlFor="lastName">Last Name</label>
            <input
              id="lastName"
              className="input-field"
              type="text"
              placeholder="Doe"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
        </div>

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
            placeholder="Min 6 characters"
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
            {loading ? 'Creating account...' : 'Create Account'}
          </button>

          <p className="body-md" style={{ textAlign: 'center', marginTop: '20px', color: 'var(--on-surface-variant)' }}>
            Already have an account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>Sign In</Link>
          </p>
        </div>
      </form>
    </div>
  )
}

export default UserSignup