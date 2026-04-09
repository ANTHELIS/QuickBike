import React, { useEffect, useRef, useState, useContext, useCallback } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import axios from 'axios'
import 'remixicon/fonts/remixicon.css'
import VehiclePanel from '../components/VehiclePanel'
import ConfirmRide from '../components/ConfirmRide'
import LookingForDriver from '../components/LookingForDriver'
import WaitingForDriver from '../components/WaitingForDriver'
import { SocketContext } from '../context/SocketContext'
import { UserDataContext } from '../context/UserContext'
import { useNavigate } from 'react-router'
import LiveTracking from '../components/LiveTracking'

const Home = () => {
  const [pickup, setPickup] = useState('')
  const [destination, setDestination] = useState('')
  const [panelOpen, setPanelOpen] = useState(false)
  const [vehiclePanel, setVehiclePanel] = useState(false)
  const [confirmRidePanel, setConfirmRidePanel] = useState(false)
  const [vehicleFound, setVehicleFound] = useState(false)
  const [waitingForDriver, setWaitingForDriver] = useState(false)
  const [pickupSuggestions, setPickupSuggestions] = useState([])
  const [destinationSuggestions, setDestinationSuggestions] = useState([])
  const [activeField, setActiveField] = useState(null)
  const [fare, setFare] = useState({})
  const [vehicleType, setVehicleType] = useState(null)
  const [ride, setRide] = useState(null)

  const vehiclePanelRef = useRef(null)
  const confirmRidePanelRef = useRef(null)
  const vehicleFoundRef = useRef(null)
  const waitingForDriverRef = useRef(null)
  const panelRef = useRef(null)
  const panelCloseRef = useRef(null)

  const navigate = useNavigate()
  const { socket } = useContext(SocketContext)
  const { user } = useContext(UserDataContext)

  useEffect(() => {
    socket.emit("join", { userType: "user", userId: user._id })
  }, [user])

  // Auto-detect location
  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        try {
          const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/maps/reverse-geocode`, {
            params: { lat: latitude, lng: longitude },
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          })
          if (response.data?.address) setPickup(response.data.address)
        } catch (err) { /* user can type manually */ }
      },
      () => {},
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
    )
  }, [])

  socket.on('ride-confirmed', ride => {
    setVehicleFound(false)
    setWaitingForDriver(true)
    setRide(ride)
  })

  socket.on('ride-started', ride => {
    setWaitingForDriver(false)
    navigate('/riding', { state: { ride } })
  })

  const handlePickupChange = useCallback(async (e) => {
    setPickup(e.target.value)
    if (e.target.value.length < 3) return setPickupSuggestions([])
    try {
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/maps/get-suggestions`, {
        params: { input: e.target.value },
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      setPickupSuggestions(response.data)
    } catch { setPickupSuggestions([]) }
  }, [])

  const handleDestinationChange = useCallback(async (e) => {
    setDestination(e.target.value)
    if (e.target.value.length < 3) return setDestinationSuggestions([])
    try {
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/maps/get-suggestions`, {
        params: { input: e.target.value },
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      setDestinationSuggestions(response.data)
    } catch { setDestinationSuggestions([]) }
  }, [])

  async function findTrip() {
    if (!pickup || !destination) return
    setVehiclePanel(true)
    setPanelOpen(false)
    try {
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/rides/get-fare`, {
        params: { pickup, destination },
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      setFare(response.data)
    } catch (err) { console.error('Fare error:', err) }
  }

  async function createRide() {
    const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/rides/create`, {
      pickup, destination, vehicleType
    }, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
    setRide(response.data)
  }

  // GSAP Animations
  useGSAP(() => {
    gsap.to(panelRef.current, {
      height: panelOpen ? '70%' : '0%',
      duration: 0.4, ease: 'power3.out'
    })
    if (panelCloseRef.current) {
      gsap.to(panelCloseRef.current, {
        opacity: panelOpen ? 1 : 0,
        duration: 0.2
      })
    }
  }, [panelOpen])

  useGSAP(() => {
    gsap.to(vehiclePanelRef.current, {
      y: vehiclePanel ? 0 : '100%',
      duration: 0.4, ease: 'power3.out'
    })
  }, [vehiclePanel])

  useGSAP(() => {
    gsap.to(confirmRidePanelRef.current, {
      y: confirmRidePanel ? 0 : '100%',
      duration: 0.4, ease: 'power3.out'
    })
  }, [confirmRidePanel])

  useGSAP(() => {
    gsap.to(vehicleFoundRef.current, {
      y: vehicleFound ? 0 : '100%',
      duration: 0.4, ease: 'power3.out'
    })
  }, [vehicleFound])

  useGSAP(() => {
    gsap.to(waitingForDriverRef.current, {
      y: waitingForDriver ? 0 : '100%',
      duration: 0.4, ease: 'power3.out'
    })
  }, [waitingForDriver])

  const suggestions = activeField === 'pickup' ? pickupSuggestions : destinationSuggestions

  return (
    <div className="screen" style={{ background: 'var(--surface)' }}>
      {/* Map */}
      <div style={{ height: '100vh', width: '100%' }}>
        <LiveTracking />
      </div>

      {/* Floating Header */}
      <div className="floating-header glass-nav" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '0 0 16px 16px' }}>
        <div className="logo-text">Quick<span>Bike</span></div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => navigate('/home')} style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--surface-container)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="ri-notification-3-line" style={{ fontSize: '1.1rem', color: 'var(--on-surface-variant)' }}></i>
          </button>
        </div>
      </div>

      {/* Bottom Search Panel */}
      <div className="glass-panel" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 24px', zIndex: 10 }}>
        {/* "Where to?" Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 className="headline-md">Where to<span style={{ color: 'var(--primary-container)' }}>?</span></h2>
          {panelOpen && (
            <button ref={panelCloseRef} onClick={() => setPanelOpen(false)} style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--surface-container)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="ri-close-line" style={{ fontSize: '1.2rem' }}></i>
            </button>
          )}
        </div>

        {/* Route inputs */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
          {/* Route dots */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', paddingTop: '16px' }}>
            <div className="location-dot pickup"></div>
            <div style={{ width: '2px', height: '28px', background: 'var(--outline-variant)' }}></div>
            <div className="location-dot dropoff"></div>
          </div>
          {/* Inputs */}
          <div style={{ flex: 1 }}>
            <input
              className="input-field"
              onClick={() => { setPanelOpen(true); setActiveField('pickup') }}
              value={pickup}
              onChange={handlePickupChange}
              placeholder="Pick-up point"
              style={{ marginBottom: '8px', borderRadius: 'var(--radius-md)', fontSize: '0.95rem' }}
            />
            <input
              className="input-field"
              onClick={() => { setPanelOpen(true); setActiveField('destination') }}
              value={destination}
              onChange={handleDestinationChange}
              placeholder="Where are you going?"
              style={{ borderRadius: 'var(--radius-md)', fontSize: '0.95rem' }}
            />
          </div>
        </div>

        {/* Find Trip Button */}
        {!panelOpen && (
          <button onClick={findTrip} className="btn btn-primary btn-lg" style={{ marginTop: '4px' }}>
            <i className="ri-search-line"></i>
            Find Trip
          </button>
        )}

        {/* Suggestions Panel */}
        <div ref={panelRef} style={{ height: '0%', overflow: 'hidden' }}>
          {suggestions.length > 0 ? (
            <div style={{ paddingTop: '8px' }}>
              {suggestions.map((s, i) => (
                <div
                  key={i}
                  className="suggestion-item"
                  onClick={() => {
                    if (activeField === 'pickup') {
                      setPickup(s)
                      setPickupSuggestions([])
                    } else {
                      setDestination(s)
                      setDestinationSuggestions([])
                    }
                  }}
                >
                  <div className="suggestion-icon">
                    <i className="ri-map-pin-line"></i>
                  </div>
                  <span className="body-md" style={{ color: 'var(--on-surface)' }}>{s}</span>
                </div>
              ))}
            </div>
          ) : (
            /* Recents placeholder */
            <div style={{ paddingTop: '16px' }}>
              <h4 className="label-md" style={{ marginBottom: '12px', color: 'var(--outline)' }}>Recents</h4>
              <div className="recent-item">
                <div className="recent-icon"><i className="ri-time-line"></i></div>
                <div className="recent-info">
                  <div className="recent-name">Search for a location</div>
                  <div className="recent-address">Type at least 3 characters</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* QuickBike Pro badge */}
        {!panelOpen && !vehiclePanel && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', padding: '10px 14px', background: 'var(--surface-container-low)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4CAF50' }}></div>
            <span className="body-sm" style={{ color: 'var(--on-surface-variant)' }}>
              <strong style={{ color: 'var(--on-surface)' }}>QuickBike Pro</strong> — Available nearby • 3 min away
            </span>
          </div>
        )}
      </div>

      {/* Vehicle Panel */}
      <div ref={vehiclePanelRef} className="glass-panel" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 20, transform: 'translateY(100%)', padding: '24px' }}>
        <VehiclePanel
          selectVehicle={setVehicleType}
          fare={fare}
          setConfirmRidePanel={setConfirmRidePanel}
          setVehiclePanel={setVehiclePanel}
        />
      </div>

      {/* Confirm Ride Panel */}
      <div ref={confirmRidePanelRef} className="glass-panel" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 25, transform: 'translateY(100%)', padding: '24px' }}>
        <ConfirmRide
          createRide={createRide}
          pickup={pickup}
          destination={destination}
          fare={fare}
          vehicleType={vehicleType}
          setConfirmRidePanel={setConfirmRidePanel}
          setVehicleFound={setVehicleFound}
        />
      </div>

      {/* Looking for Driver */}
      <div ref={vehicleFoundRef} className="glass-panel" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 30, transform: 'translateY(100%)', padding: '24px' }}>
        <LookingForDriver
          createRide={createRide}
          pickup={pickup}
          destination={destination}
          fare={fare}
          vehicleType={vehicleType}
          setVehicleFound={setVehicleFound}
        />
      </div>

      {/* Waiting for Driver */}
      <div ref={waitingForDriverRef} className="glass-panel" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 35, transform: 'translateY(100%)', padding: '24px' }}>
        <WaitingForDriver
          ride={ride}
          setVehicleFound={setVehicleFound}
          setWaitingForDriver={setWaitingForDriver}
          waitingForDriver={waitingForDriver}
        />
      </div>
    </div>
  )
}

export default Home