import React from 'react'

const LookingForDriver = (props) => {
  return (
    <div style={{ textAlign: 'center' }}>
      {/* Close handle */}
      <div onClick={() => props.setVehicleFound(false)} style={{ display: 'flex', justifyContent: 'center', paddingBottom: '16px', cursor: 'pointer' }}>
        <div style={{ width: '40px', height: '4px', borderRadius: '2px', background: 'var(--outline-variant)' }}></div>
      </div>

      <h3 className="headline-md" style={{ marginBottom: '8px' }}>
        Finding your captain<span style={{ color: 'var(--primary-container)' }}>...</span>
      </h3>
      <p className="body-md" style={{ color: 'var(--on-surface-variant)', marginBottom: '24px' }}>
        Hold tight — connecting you with the nearest rider
      </p>

      {/* Animated Loader */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '32px' }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{
            width: '12px', height: '12px', borderRadius: '50%',
            background: 'var(--primary-container)',
            animation: `pulse 1.4s ${i * 0.2}s infinite ease-in-out`
          }}></div>
        ))}
      </div>

      {/* Route info compact */}
      <div style={{ display: 'flex', gap: '12px', textAlign: 'left', padding: '16px', background: 'var(--surface-container-low)', borderRadius: 'var(--radius-lg)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', paddingTop: '2px' }}>
          <div className="location-dot pickup"></div>
          <div style={{ width: '2px', flex: 1, background: 'var(--outline-variant)' }}></div>
          <div className="location-dot dropoff"></div>
        </div>
        <div style={{ flex: 1 }}>
          <div className="body-sm" style={{ marginBottom: '12px', color: 'var(--on-surface)' }}>{props.pickup}</div>
          <div className="body-sm" style={{ color: 'var(--on-surface)' }}>{props.destination}</div>
        </div>
        <div style={{ alignSelf: 'center' }}>
          <div className="headline-sm" style={{ color: 'var(--primary)' }}>₹{props.fare[props.vehicleType] || '--'}</div>
        </div>
      </div>
    </div>
  )
}

export default LookingForDriver