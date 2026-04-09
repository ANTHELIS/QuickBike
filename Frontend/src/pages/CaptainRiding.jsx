import React, { useRef, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import FinishRide from '../components/FinishRide'
import LiveTracking from '../components/LiveTracking'

const CaptainRiding = () => {
  const location = useLocation()
  const rideData = location.state?.ride
  const [finishRidePanel, setFinishRidePanel] = useState(false)
  const finishRidePanelRef = useRef(null)

  useGSAP(() => {
    gsap.to(finishRidePanelRef.current, {
      y: finishRidePanel ? 0 : '100%',
      duration: 0.4, ease: 'power3.out'
    })
  }, [finishRidePanel])

  return (
    <div className="screen">
      {/* Map */}
      <div style={{ height: '100vh', width: '100%' }}>
        <LiveTracking />
      </div>

      {/* Floating Header */}
      <div className="floating-header glass-nav" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '0 0 16px 16px' }}>
        <Link to="/captain-home" className="logo-text" style={{ textDecoration: 'none', color: 'var(--on-surface)' }}>
          Quick<span>Bike</span>
        </Link>
      </div>

      {/* Bottom Panel */}
      <div className="glass-panel" onClick={() => setFinishRidePanel(true)} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '24px', zIndex: 10, cursor: 'pointer' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 className="headline-md" style={{ color: 'var(--primary-container)' }}>4 KM away</h3>
            <p className="body-sm" style={{ color: 'var(--on-surface-variant)' }}>Tap to finish ride</p>
          </div>
          <div style={{ padding: '12px', background: 'var(--primary-fixed)', borderRadius: 'var(--radius-lg)' }}>
            <span className="headline-sm" style={{ color: 'var(--primary)' }}>₹{rideData?.fare || '--'}</span>
          </div>
        </div>
      </div>

      {/* Finish Ride Panel */}
      <div ref={finishRidePanelRef} className="glass-panel" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 20, transform: 'translateY(100%)', padding: '24px' }}>
        <FinishRide
          ride={rideData}
          setFinishRidePanel={setFinishRidePanel}
        />
      </div>
    </div>
  )
}

export default CaptainRiding