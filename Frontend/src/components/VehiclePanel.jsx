import React from 'react'

const VehiclePanel = (props) => {
  return (
    <div>
      {/* Close handle */}
      <div onClick={() => props.setVehiclePanel(false)} style={{ display: 'flex', justifyContent: 'center', paddingBottom: '16px', cursor: 'pointer' }}>
        <div style={{ width: '40px', height: '4px', borderRadius: '2px', background: 'var(--outline-variant)' }}></div>
      </div>

      <h3 className="headline-md" style={{ marginBottom: '4px' }}>
        Choose your ride<span style={{ color: 'var(--primary-container)' }}>.</span>
      </h3>
      <p className="body-sm" style={{ color: 'var(--on-surface-variant)', marginBottom: '20px' }}>
        Select the best option for you
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* Bike Taxi */}
        <div
          className="vehicle-card"
          onClick={() => {
            props.setConfirmRidePanel(true)
            props.selectVehicle('moto')
          }}
        >
          <img className="vehicle-icon" src="https://www.uber-assets.com/image/upload/f_auto,q_auto:eco,c_fill,h_638,w_956/v1649231091/assets/2c/7fa194-c954-49b2-9c6d-a3b8601370f5/original/Uber_Moto_Orange_312x208_pixels_Mobile.png" alt="Bike" />
          <div className="vehicle-info">
            <div className="vehicle-name">Bike Taxi</div>
            <div className="vehicle-meta">
              <i className="ri-flashlight-line" style={{ fontSize: '0.75rem' }}></i> Fastest in traffic • 2 mins away
            </div>
          </div>
          <div className="vehicle-price">₹{props.fare.moto || '--'}</div>
        </div>

        {/* Quick Auto */}
        <div
          className="vehicle-card"
          onClick={() => {
            props.setConfirmRidePanel(true)
            props.selectVehicle('auto')
          }}
        >
          <img className="vehicle-icon" src="https://www.uber-assets.com/image/upload/f_auto,q_auto:eco,c_fill,h_368,w_552/v1648431773/assets/1d/db8c56-0204-4ce4-81ce-56a11a07fe98/original/Uber_Auto_558x372_pixels_Desktop.png" alt="Auto" />
          <div className="vehicle-info">
            <div className="vehicle-name">Quick Auto</div>
            <div className="vehicle-meta">
              <i className="ri-group-line" style={{ fontSize: '0.75rem' }}></i> Best for 2 people • 5 mins away
            </div>
          </div>
          <div className="vehicle-price">₹{props.fare.auto || '--'}</div>
        </div>

        {/* Mini Cab */}
        <div
          className="vehicle-card"
          onClick={() => {
            props.setConfirmRidePanel(true)
            props.selectVehicle('car')
          }}
        >
          <img className="vehicle-icon" src="https://swyft.pl/wp-content/uploads/2023/05/how-many-people-can-a-uberx-take.jpg" alt="Car" style={{ borderRadius: '8px' }} />
          <div className="vehicle-info">
            <div className="vehicle-name">Mini Cab</div>
            <div className="vehicle-meta">
              <i className="ri-snowflake-line" style={{ fontSize: '0.75rem' }}></i> Comfort & A/C • 8 mins away
            </div>
          </div>
          <div className="vehicle-price">₹{props.fare.car || '--'}</div>
        </div>
      </div>

      {/* Pricing note */}
      <div style={{ marginTop: '16px', padding: '12px 16px', background: 'var(--surface-container-low)', borderRadius: 'var(--radius-md)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <i className="ri-information-line" style={{ color: 'var(--primary)', fontSize: '1rem' }}></i>
          <span className="label-lg" style={{ color: 'var(--on-surface)', fontSize: '0.8rem' }}>Kinetic Precision Pricing</span>
        </div>
        <p className="body-sm" style={{ color: 'var(--on-surface-variant)' }}>
          Fares are calculated based on distance and current demand.
        </p>
      </div>
    </div>
  )
}

export default VehiclePanel