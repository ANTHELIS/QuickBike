import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import LiveTracking from '../components/LiveTracking'

const Riding = () => {
  const location = useLocation()
  const { ride } = location.state || {}
  const navigate = useNavigate()

  return (
    <div className="screen">
      {/* Map */}
      <div style={{ height: '100vh', width: '100%' }}>
        <LiveTracking />
      </div>

      {/* Floating Header */}
      <div className="floating-header glass-nav" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '0 0 16px 16px' }}>
        <Link to="/home" className="logo-text" style={{ textDecoration: 'none', color: 'var(--on-surface)' }}>
          Quick<span>Bike</span>
        </Link>
      </div>

      {/* Bottom Panel */}
      <div className="glass-panel animate-slide-up" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '24px', zIndex: 10 }}>
        {/* Arriving info */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h2 className="headline-lg">
            Arriving in <span style={{ color: 'var(--primary-container)' }}>4 mins</span>
          </h2>
          <p className="body-md" style={{ color: 'var(--on-surface-variant)', marginTop: '4px' }}>
            2.1 km to your destination
          </p>
        </div>

        {/* Driver info card */}
        <div className="driver-card" style={{ marginBottom: '20px' }}>
          <img className="driver-avatar" src="https://i.pinimg.com/236x/af/26/28/af26280b0ca305be47df0b799ed1b12b.jpg" alt="Captain" />
          <div className="driver-info">
            <div className="driver-name">{ride?.captain?.fullname?.firstname || 'Captain'}</div>
            <div className="driver-vehicle">
              {ride?.captain?.vehicle?.color} {ride?.captain?.vehicle?.vehicleType} • {ride?.captain?.vehicle?.plate}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'var(--primary-fixed)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="ri-phone-fill" style={{ color: 'var(--primary)', fontSize: '1.2rem' }}></i>
            </button>
          </div>
        </div>

        {/* Fare */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--surface-container-low)', borderRadius: 'var(--radius-lg)' }}>
          <span className="body-md" style={{ color: 'var(--on-surface-variant)' }}>Fare</span>
          <span className="headline-sm" style={{ color: 'var(--primary)' }}>₹{ride?.fare || '--'}</span>
        </div>
      </div>
    </div>
  )
}

export default Riding