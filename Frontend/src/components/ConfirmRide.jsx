import React from 'react'
import './ConfirmRide.css'

const vehicleNames = { moto: 'Bike Taxi', auto: 'Quick Auto', car: 'Mini Cab' }
const vehicleIcons = { moto: '🏍️', auto: '🛺', car: '🚗' }

const ConfirmRide = ({ pickup, destination, fare, vehicleType, createRide, setConfirmRidePanel, setVehicleFound }) => {
  return (
    <div className="confirm-ride">
      <div className="panel-handle" onClick={() => setConfirmRidePanel(false)}>
        <div className="handle-bar" />
      </div>
      <div className="cr-content">
        <h2 className="headline-md cr-title">Confirm your ride</h2>

        <div className="cr-vehicle-badge">
          <span className="cr-vehicle-icon">{vehicleIcons[vehicleType] || '🚗'}</span>
          <span className="headline-sm">{vehicleNames[vehicleType] || 'Ride'}</span>
        </div>

        {/* Route */}
        <div className="cr-route">
          <div className="cr-route-item">
            <div className="cr-route-dot dot-orange" />
            <div className="cr-route-text">
              <span className="label-md">PICK-UP</span>
              <p className="body-md">{pickup}</p>
            </div>
          </div>
          <div className="cr-route-line" />
          <div className="cr-route-item">
            <div className="cr-route-dot dot-dark" />
            <div className="cr-route-text">
              <span className="label-md">DROP-OFF</span>
              <p className="body-md">{destination}</p>
            </div>
          </div>
        </div>

        {/* Fare */}
        <div className="cr-fare card-surface">
          <div className="cr-fare-row">
            <span className="body-md" style={{ color: 'var(--on-surface-variant)' }}>Estimated fare</span>
            <span className="headline-md" style={{ color: 'var(--primary)' }}>₹{fare[vehicleType] || '—'}</span>
          </div>
          <div className="cr-fare-row">
            <span className="body-sm" style={{ color: 'var(--on-surface-variant)' }}>Payment</span>
            <span className="label-md">Cash</span>
          </div>
        </div>

        <button className="btn btn-primary btn-full cr-confirm" onClick={() => {
          setVehicleFound(true)
          setConfirmRidePanel(false)
          createRide()
        }}>
          Confirm Ride
        </button>
      </div>
    </div>
  )
}

export default ConfirmRide