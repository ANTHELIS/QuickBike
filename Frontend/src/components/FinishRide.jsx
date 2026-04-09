import React from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router'

const FinishRide = (props) => {
  const navigate = useNavigate()

  async function endRide() {
    try {
      const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/rides/end-ride`, {
        rideId: props.ride._id
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      if (response.status === 200) navigate('/captain-home')
    } catch (err) {
      console.error('End ride error:', err)
    }
  }

  return (
    <div>
      {/* Close handle */}
      <div onClick={() => props.setFinishRidePanel(false)} style={{ display: 'flex', justifyContent: 'center', paddingBottom: '16px', cursor: 'pointer' }}>
        <div style={{ width: '40px', height: '4px', borderRadius: '2px', background: 'var(--outline-variant)' }}></div>
      </div>

      <h3 className="headline-md" style={{ marginBottom: '16px' }}>
        Finish this ride<span style={{ color: 'var(--primary-container)' }}>.</span>
      </h3>

      {/* Rider info */}
      <div className="driver-card" style={{ marginBottom: '16px' }}>
        <img className="driver-avatar" src="https://i.pinimg.com/236x/af/26/28/af26280b0ca305be47df0b799ed1b12b.jpg" alt="Rider" />
        <div className="driver-info">
          <div className="driver-name">{props.ride?.user?.fullname?.firstname || 'Rider'}</div>
          <div className="driver-vehicle">Rider</div>
        </div>
      </div>

      {/* Route */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', paddingTop: '4px' }}>
          <div className="location-dot pickup"></div>
          <div style={{ width: '2px', flex: 1, background: 'var(--outline-variant)' }}></div>
          <div className="location-dot dropoff"></div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: '14px' }}>
            <div className="label-md" style={{ color: 'var(--outline)', marginBottom: '2px' }}>Pickup</div>
            <div className="body-md">{props.ride?.pickup}</div>
          </div>
          <div>
            <div className="label-md" style={{ color: 'var(--outline)', marginBottom: '2px' }}>Destination</div>
            <div className="body-md">{props.ride?.destination}</div>
          </div>
        </div>
      </div>

      {/* Fare */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--surface-container-low)', borderRadius: 'var(--radius-lg)', marginBottom: '24px' }}>
        <span className="body-md" style={{ color: 'var(--on-surface-variant)' }}>Total Fare</span>
        <span className="headline-sm" style={{ color: 'var(--primary)' }}>₹{props.ride?.fare}</span>
      </div>

      <button onClick={endRide} className="btn btn-primary btn-lg">
        <i className="ri-check-double-line"></i>
        Complete Ride
      </button>
    </div>
  )
}

export default FinishRide