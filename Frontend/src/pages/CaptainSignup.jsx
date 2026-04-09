import React, { useState, useContext } from 'react'
import { Link, useNavigate } from 'react-router'
import axios from 'axios'
import { CaptainDataContext } from '../context/CapatainContext'

const CaptainSignup = () => {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [color, setColor] = useState('')
  const [plate, setPlate] = useState('')
  const [capacity, setCapacity] = useState('')
  const [vehicleType, setVehicleType] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { setCaptain } = useContext(CaptainDataContext)
  const navigate = useNavigate()

  const submitHandler = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/captains/register`, {
        fullname: { firstname: firstName, lastname: lastName },
        email,
        password,
        vehicle: { color, plate, capacity: Number(capacity), vehicleType }
      })

      if (response.status === 201) {
        const data = response.data
        setCaptain(data.captain)
        localStorage.setItem('token', data.token)
        navigate('/captain-home')
      }
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  const vehicleTypes = [
    { value: 'moto', label: 'Bike', icon: 'ri-motorbike-fill' },
    { value: 'auto', label: 'Auto', icon: 'ri-taxi-fill' },
    { value: 'car', label: 'Car', icon: 'ri-car-fill' },
  ]

  return (
    <div className="screen" style={{ display: 'flex', flexDirection: 'column', background: 'var(--surface)', overflowY: 'auto' }}>
      <div style={{ padding: '48px 24px 0' }}>
        <Link to="/captain-login" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: 'var(--on-surface-variant)', marginBottom: '24px' }}>
          <i className="ri-arrow-left-line" style={{ fontSize: '1.25rem' }}></i>
          <span className="body-md">Back</span>
        </Link>

        {/* Progress */}
        <div className="progress-bar" style={{ padding: 0, marginBottom: '24px' }}>
          <div className="progress-segment active"></div>
          <div className="progress-segment active"></div>
          <div className="progress-segment"></div>
        </div>

        <h1 className="headline-lg" style={{ marginBottom: '8px' }}>
          Become a<br />Captain<span style={{ color: 'var(--primary-container)' }}>.</span>
        </h1>
        <p className="body-md" style={{ color: 'var(--on-surface-variant)' }}>
          Start earning with QuickBike today
        </p>
      </div>

      <form onSubmit={submitHandler} style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px 24px 0' }}>
        {error && (
          <div className="animate-fade-in" style={{ padding: '12px 16px', background: 'var(--error-container)', borderRadius: 'var(--radius-md)', marginBottom: '16px', fontSize: '0.875rem', color: 'var(--error)' }}>
            {error}
          </div>
        )}

        {/* Personal details */}
        <div style={{ marginBottom: '8px' }}>
          <span className="label-md" style={{ color: 'var(--outline)' }}>Personal Details</span>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div className="input-group" style={{ flex: 1 }}>
            <input className="input-field" required placeholder="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </div>
          <div className="input-group" style={{ flex: 1 }}>
            <input className="input-field" placeholder="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
        </div>
        <div className="input-group">
          <input className="input-field" type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="input-group">
          <input className="input-field" type="password" required placeholder="Password (min 6 chars)" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>

        {/* Vehicle details */}
        <div style={{ marginBottom: '8px', marginTop: '8px' }}>
          <span className="label-md" style={{ color: 'var(--outline)' }}>Vehicle Details</span>
        </div>

        {/* Vehicle type selector */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          {vehicleTypes.map((vt) => (
            <button
              key={vt.value}
              type="button"
              onClick={() => setVehicleType(vt.value)}
              style={{
                flex: 1, padding: '12px', borderRadius: 'var(--radius-lg)',
                border: vehicleType === vt.value ? '2px solid var(--primary-container)' : '2px solid transparent',
                background: vehicleType === vt.value ? 'var(--primary-fixed)' : 'var(--surface-container-low)',
                cursor: 'pointer', textAlign: 'center',
                transition: 'all 0.2s ease'
              }}
            >
              <i className={vt.icon} style={{ fontSize: '1.5rem', color: vehicleType === vt.value ? 'var(--primary)' : 'var(--outline)', display: 'block', marginBottom: '4px' }}></i>
              <span style={{ fontSize: '0.8rem', fontWeight: 500, color: vehicleType === vt.value ? 'var(--primary)' : 'var(--on-surface-variant)' }}>{vt.label}</span>
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <div className="input-group" style={{ flex: 1 }}>
            <input className="input-field" required placeholder="Vehicle Color" value={color} onChange={(e) => setColor(e.target.value)} />
          </div>
          <div className="input-group" style={{ flex: 1 }}>
            <input className="input-field" required placeholder="Plate Number" value={plate} onChange={(e) => setPlate(e.target.value)} />
          </div>
        </div>
        <div className="input-group">
          <input className="input-field" type="number" required placeholder="Passenger Capacity" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
        </div>

        <div style={{ paddingBottom: '32px', paddingTop: '8px' }}>
          <button type="submit" className="btn btn-primary btn-lg" disabled={loading || !vehicleType} style={{ opacity: (loading || !vehicleType) ? 0.6 : 1 }}>
            {loading ? 'Creating account...' : 'Register as Captain'}
          </button>
          <p className="body-md" style={{ textAlign: 'center', marginTop: '16px', color: 'var(--on-surface-variant)' }}>
            Already a captain? <Link to="/captain-login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>Sign In</Link>
          </p>
        </div>
      </form>
    </div>
  )
}

export default CaptainSignup