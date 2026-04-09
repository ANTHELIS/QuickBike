import React from 'react'

const ConfirmRide = (props) => {
  return (
    <div>
      {/* Close handle */}
      <div onClick={() => props.setConfirmRidePanel(false)} style={{ display: 'flex', justifyContent: 'center', paddingBottom: '16px', cursor: 'pointer' }}>
        <div style={{ width: '40px', height: '4px', borderRadius: '2px', background: 'var(--outline-variant)' }}></div>
      </div>

      <h3 className="headline-md" style={{ marginBottom: '20px' }}>
        Confirm your ride<span style={{ color: 'var(--primary-container)' }}>.</span>
      </h3>

      {/* Route summary */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', paddingTop: '4px' }}>
          <div className="location-dot pickup"></div>
          <div style={{ width: '2px', flex: 1, background: 'var(--outline-variant)' }}></div>
          <div className="location-dot dropoff"></div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: '16px' }}>
            <div className="label-md" style={{ color: 'var(--outline)', marginBottom: '2px' }}>Pickup</div>
            <div className="title-md" style={{ color: 'var(--on-surface)' }}>{props.pickup}</div>
          </div>
          <div>
            <div className="label-md" style={{ color: 'var(--outline)', marginBottom: '2px' }}>Destination</div>
            <div className="title-md" style={{ color: 'var(--on-surface)' }}>{props.destination}</div>
          </div>
        </div>
      </div>

      {/* Fare */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--surface-container-low)', borderRadius: 'var(--radius-lg)', marginBottom: '20px' }}>
        <div>
          <div className="label-md" style={{ color: 'var(--outline)' }}>Total Fare</div>
          <div className="headline-md" style={{ color: 'var(--primary)' }}>₹{props.fare[props.vehicleType] || '--'}</div>
        </div>
        <div className="chip chip-surface">
          <i className="ri-bank-card-line" style={{ fontSize: '0.9rem' }}></i>
          Cash
        </div>
      </div>

      <button
        onClick={() => {
          props.setVehicleFound(true)
          props.setConfirmRidePanel(false)
          props.createRide()
        }}
        className="btn btn-primary btn-lg"
      >
        Confirm Ride
      </button>
    </div>
  )
}

export default ConfirmRide