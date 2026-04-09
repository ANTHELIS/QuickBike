import React, { useRef, useState, useEffect, useContext } from 'react'
import { Link } from 'react-router'
import CaptainDetails from '../components/CaptainDetails'
import RidePopUp from '../components/RidePopUp'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import ConfirmRidePopUp from '../components/ConfirmRidePopUp'
import { SocketContext } from '../context/SocketContext'
import { CaptainDataContext } from '../context/CapatainContext'
import LiveTracking from '../components/LiveTracking'
import axios from 'axios'

const CaptainHome = () => {
  const [ridePopupPanel, setRidePopupPanel] = useState(false)
  const [confirmRidePopupPanel, setConfirmRidePopupPanel] = useState(false)
  const ridePopupPanelRef = useRef(null)
  const confirmRidePopupPanelRef = useRef(null)
  const [ride, setRide] = useState(null)

  const { socket } = useContext(SocketContext)
  const { captain } = useContext(CaptainDataContext)

  useEffect(() => {
    socket.emit('join', { userId: captain._id, userType: 'captain' })

    const updateLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
          socket.emit('update-location-captain', {
            userId: captain._id,
            location: { ltd: position.coords.latitude, lng: position.coords.longitude }
          })
        })
      }
    }
    const locationInterval = setInterval(updateLocation, 10000)
    updateLocation()
    return () => clearInterval(locationInterval)
  }, [])

  socket.on('new-ride', (data) => {
    setRide(data)
    setRidePopupPanel(true)
  })

  async function confirmRide() {
    await axios.post(`${import.meta.env.VITE_BASE_URL}/rides/confirm`, {
      rideId: ride._id, captainId: captain._id,
    }, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
    setRidePopupPanel(false)
    setConfirmRidePopupPanel(true)
  }

  useGSAP(() => {
    gsap.to(ridePopupPanelRef.current, {
      y: ridePopupPanel ? 0 : '100%',
      duration: 0.4, ease: 'power3.out'
    })
  }, [ridePopupPanel])

  useGSAP(() => {
    gsap.to(confirmRidePopupPanelRef.current, {
      y: confirmRidePopupPanel ? 0 : '100%',
      duration: 0.4, ease: 'power3.out'
    })
  }, [confirmRidePopupPanel])

  return (
    <div className="screen">
      {/* Map */}
      <div style={{ height: '60vh', width: '100%' }}>
        <LiveTracking />
      </div>

      {/* Floating Header */}
      <div className="floating-header glass-nav" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '0 0 16px 16px' }}>
        <div className="logo-text">Quick<span>Bike</span></div>
        <Link to="/captain-logout" style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--surface-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
          <i className="ri-logout-box-r-line" style={{ fontSize: '1.1rem', color: 'var(--on-surface-variant)' }}></i>
        </Link>
      </div>

      {/* Captain Details */}
      <div style={{ padding: '24px', background: 'var(--surface)' }}>
        <CaptainDetails />
      </div>

      {/* Ride Popup */}
      <div ref={ridePopupPanelRef} className="glass-panel" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 20, transform: 'translateY(100%)', padding: '24px' }}>
        <RidePopUp
          ride={ride}
          setRidePopupPanel={setRidePopupPanel}
          setConfirmRidePopupPanel={setConfirmRidePopupPanel}
          confirmRide={confirmRide}
        />
      </div>

      {/* Confirm Ride Popup */}
      <div ref={confirmRidePopupPanelRef} className="glass-panel" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 25, transform: 'translateY(100%)', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
        <ConfirmRidePopUp
          ride={ride}
          setConfirmRidePopupPanel={setConfirmRidePopupPanel}
          setRidePopupPanel={setRidePopupPanel}
        />
      </div>
    </div>
  )
}

export default CaptainHome