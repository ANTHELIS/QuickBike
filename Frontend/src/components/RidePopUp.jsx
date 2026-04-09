import React from 'react'

const RidePopUp = (props) => {
  return (
    <div>
      {/* Close handle */}
      <div onClick={() => props.setRidePopupPanel(false)} style={{ display: 'flex', justifyContent: 'center', paddingBottom: '16px', cursor: 'pointer' }}>
        <div style={{ width: '40px', height: '4px', borderRadius: '2px', background: 'var(--outline-variant)' }}></div>
      </div>

      <h3 className="headline-md" style={{ marginBottom: '16px' }}>
        New ride available<span style={{ color: 'var(--primary-container)' }}>!</span>
      </h3>

      {/* Rider info */}
      <div className="driver-card" style={{ marginBottom: '16px', borderColor: 'var(--primary-container)' }}>
        <img className="driver-avatar" src="https://i.pinimg.com/236x/af/26/28/af26280b0ca305be47df0b799ed1b12b.jpg" alt="Rider" />
        <div className="driver-info">
          <div className="driver-name">
            {props.ride?.user?.fullname?.firstname} {props.ride?.user?.fullname?.lastname}
          </div>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--primary-fixed)', borderRadius: 'var(--radius-lg)', marginBottom: '20px' }}>
        <span className="title-md" style={{ color: 'var(--primary)' }}>Fare</span>
        <span className="headline-sm" style={{ color: 'var(--primary)' }}>₹{props.ride?.fare}</span>
      </div>

      {/* Buttons */}
      <button
        onClick={() => { props.setConfirmRidePopupPanel(true); props.confirmRide() }}
        className="btn btn-primary btn-lg"
        style={{ marginBottom: '8px' }}
      >
        Accept Ride
      </button>
      <button
        onClick={() => props.setRidePopupPanel(false)}
        className="btn btn-secondary btn-lg"
      >
        Ignore
      </button>
    </div>
  )
}

export default RidePopUp