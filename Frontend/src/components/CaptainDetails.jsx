import React, { useContext } from 'react'
import { CaptainDataContext } from '../context/CapatainContext'

const CaptainDetails = () => {
  const { captain } = useContext(CaptainDataContext)

  return (
    <div>
      {/* Captain Info Card */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--primary-container))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.4rem', fontFamily: 'Manrope', fontWeight: 700 }}>
          {captain?.fullname?.firstname?.charAt(0) || 'C'}
        </div>
        <div style={{ flex: 1 }}>
          <div className="title-lg">
            {captain?.fullname?.firstname} {captain?.fullname?.lastname}
          </div>
          <div className="body-sm" style={{ color: 'var(--on-surface-variant)' }}>
            {captain?.vehicle?.color} {captain?.vehicle?.vehicleType} • {captain?.vehicle?.plate}
          </div>
        </div>
        <div style={{ textAlign: 'center', padding: '8px 12px', background: 'var(--primary-fixed)', borderRadius: 'var(--radius-lg)' }}>
          <div className="headline-sm" style={{ color: 'var(--primary)' }}>4.8</div>
          <div className="body-sm" style={{ color: 'var(--on-surface-variant)' }}>Rating</div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <div className="card" style={{ flex: 1, textAlign: 'center' }}>
          <i className="ri-timer-flash-line" style={{ fontSize: '1.5rem', color: 'var(--primary-container)', marginBottom: '4px', display: 'block' }}></i>
          <div className="headline-sm">10.2</div>
          <div className="body-sm" style={{ color: 'var(--on-surface-variant)' }}>Hours Online</div>
        </div>
        <div className="card" style={{ flex: 1, textAlign: 'center' }}>
          <i className="ri-speed-line" style={{ fontSize: '1.5rem', color: 'var(--primary-container)', marginBottom: '4px', display: 'block' }}></i>
          <div className="headline-sm">₹820</div>
          <div className="body-sm" style={{ color: 'var(--on-surface-variant)' }}>Today's Earnings</div>
        </div>
        <div className="card" style={{ flex: 1, textAlign: 'center' }}>
          <i className="ri-route-line" style={{ fontSize: '1.5rem', color: 'var(--primary-container)', marginBottom: '4px', display: 'block' }}></i>
          <div className="headline-sm">12</div>
          <div className="body-sm" style={{ color: 'var(--on-surface-variant)' }}>Trips</div>
        </div>
      </div>
    </div>
  )
}

export default CaptainDetails