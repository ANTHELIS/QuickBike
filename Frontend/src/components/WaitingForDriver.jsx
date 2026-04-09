import React from 'react'

const WaitingForDriver = (props) => {
  return (
    <div>
      {/* Close handle */}
      <div onClick={() => props.setWaitingForDriver(false)} style={{ display: 'flex', justifyContent: 'center', paddingBottom: '16px', cursor: 'pointer' }}>
        <div style={{ width: '40px', height: '4px', borderRadius: '2px', background: 'var(--outline-variant)' }}></div>
      </div>

      {/* Driver card */}
      <div className="driver-card" style={{ marginBottom: '20px' }}>
        <img className="driver-avatar" src="https://i.pinimg.com/236x/af/26/28/af26280b0ca305be47df0b799ed1b12b.jpg" alt="Captain" />
        <div className="driver-info">
          <div className="driver-name">{props.ride?.captain?.fullname?.firstname || 'Captain'}</div>
          <div className="driver-vehicle">
            {props.ride?.captain?.vehicle?.color} {props.ride?.captain?.vehicle?.vehicleType} • {props.ride?.captain?.vehicle?.plate}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div className="headline-sm" style={{ color: 'var(--primary)' }}>
            {props.ride?.otp || '****'}
          </div>
          <div className="body-sm" style={{ color: 'var(--outline)' }}>OTP</div>
        </div>
      </div>

      {/* Arriving info */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h3 className="headline-md">
          Arriving in <span style={{ color: 'var(--primary-container)' }}>4 mins</span>
        </h3>
        <p className="body-sm" style={{ color: 'var(--on-surface-variant)' }}>
          Your captain is on the way to pick you up
        </p>
      </div>

      {/* Route */}
      <div style={{ display: 'flex', gap: '12px', padding: '16px', background: 'var(--surface-container-low)', borderRadius: 'var(--radius-lg)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', paddingTop: '2px' }}>
          <div className="location-dot pickup"></div>
          <div style={{ width: '2px', flex: 1, background: 'var(--outline-variant)' }}></div>
          <div className="location-dot dropoff"></div>
        </div>
        <div style={{ flex: 1 }}>
          <div className="body-sm" style={{ marginBottom: '14px' }}>{props.ride?.pickup}</div>
          <div className="body-sm">{props.ride?.destination}</div>
        </div>
        <div style={{ alignSelf: 'center' }}>
          <span className="headline-sm" style={{ color: 'var(--primary)' }}>₹{props.ride?.fare}</span>
        </div>
      </div>
    </div>
  )
}

export default WaitingForDriver