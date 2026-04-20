import React, { useEffect, useState, useContext } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router'
import { SocketContext } from '../context/SocketContext'
import { UserDataContext } from '../context/UserContext'
import LiveTracking from '../components/LiveTracking'
import VehiclePanel from '../components/VehiclePanel'
import LookingForDriver from '../components/LookingForDriver'
import WaitingForDriver from '../components/WaitingForDriver'
import MapPicker from '../components/MapPicker'
import HomeDesktop from '../components/HomeDesktop'
import { useSiteConfig } from '../context/SiteConfigContext'

const Home = () => {
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768)
  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const [pickup, setPickup] = useState('')
  const [destination, setDestination] = useState('')
  const [pickupCoords, setPickupCoords] = useState(null)
  const [destCoords, setDestCoords] = useState(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [activeField, setActiveField] = useState(null)
  const [suggestions, setSuggestions] = useState([])
  const [vehiclePanel, setVehiclePanel] = useState(false)
  const [vehicleFound, setVehicleFound] = useState(false)
  const [waitingForDriver, setWaitingForDriver] = useState(false)
  const [fare, setFare] = useState({})
  const [vehicleType, setVehicleType] = useState('moto')
  const [ride, setRide] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [fareLoading, setFareLoading] = useState(false)
  const [fareError, setFareError] = useState('')
  const [geoLocating, setGeoLocating] = useState(false)
  const [geoError, setGeoError] = useState('')
  const [isCurrentLocation, setIsCurrentLocation] = useState(false)
  const [mapPickerField, setMapPickerField] = useState(null)
  const [savedPlaces, setSavedPlaces] = useState([])
  const [toast, setToast] = useState('')   // quick feedback message

  const navigate = useNavigate()
  const { socket } = useContext(SocketContext)
  const { user } = useContext(UserDataContext)
  const { getBanner } = useSiteConfig() // triggers CSS injection

  // Silent auto-fill on mount (fast, low-accuracy) — only if pickup is empty
  useEffect(() => {
    if (!navigator.geolocation) return
    setGeoLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/maps/reverse-geocode`, {
            params: { lat: pos.coords.latitude, lng: pos.coords.longitude },
            headers: { Authorization: `Bearer ${localStorage.getItem('user_token')}` }
          })
          if (res.data?.address) {
            setPickup(res.data.address)
            setPickupCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
            setIsCurrentLocation(true)
          }
        } catch { }
        finally { setGeoLocating(false) }
      },
      () => { setGeoLocating(false) },
      { enableHighAccuracy: false, timeout: 6000, maximumAge: 300000 }
    )
  }, [])

  useEffect(() => {
    if (user?._id && socket) {
      const token = localStorage.getItem('user_token');
      if (token && socket.auth?.token !== token) {
        socket.auth = { token };
        socket.disconnect().connect();
      } else if (!socket.connected) {
        socket.connect();
      }
    }
  }, [user, socket])

  useEffect(() => {
    if (!socket || !user?._id) return
    const joinRoom = () => {
      socket.emit('join', { userType: 'user', userId: user._id })
    }
    if (socket.connected) {
      joinRoom()
    }
    socket.on('connect', joinRoom)
    return () => socket.off('connect', joinRoom)
  }, [user, socket])

  // Fetch user's saved places (for Home/Work quick pills)
  useEffect(() => {
    axios.get(`${import.meta.env.VITE_BASE_URL}/users/saved-places`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('user_token')}` }
    })
      .then(r => setSavedPlaces(r.data.savedPlaces || []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    const handleConfirmed = (data) => {
      setVehicleFound(false)
      setWaitingForDriver(true)
      setRide(data)
    }

    const handleStarted = (data) => {
      setWaitingForDriver(false)
      navigate('/riding', { state: { ride: data } })
    }

    const handleCancelled = (data) => {
      setVehicleFound(false)
      setWaitingForDriver(false)
      setVehiclePanel(false)
      setRide(null)
      const reason = data?.reason || 'The ride was cancelled.'
      showToast(reason)
    }

    const handleStateSync = (data) => {
      if (!data) return
      setRide(data)
      if (data.status === 'pending') {
        setVehiclePanel(false)
        setVehicleFound(true)
        setWaitingForDriver(false)
      } else if (data.status === 'accepted') {
        setVehicleFound(false)
        setWaitingForDriver(true)
      } else if (data.status === 'ongoing') {
        navigate('/riding', { state: { ride: data } })
      }
    }

    socket.on('ride-confirmed', handleConfirmed)
    socket.on('ride-started', handleStarted)
    socket.on('ride-cancelled', handleCancelled)
    socket.on('ride-state-sync', handleStateSync)

    return () => {
      socket.off('ride-confirmed', handleConfirmed)
      socket.off('ride-started', handleStarted)
      socket.off('ride-cancelled', handleCancelled)
      socket.off('ride-state-sync', handleStateSync)
    }
  }, [socket, navigate])

  const searchTimeout = React.useRef(null)

  const handleInputChange = (value, field) => {
    if (field === 'pickup') {
      setPickup(value)
      setIsCurrentLocation(false) // user is manually typing — drop the GPS label
      setPickupCoords(null)
    } else {
      setDestination(value)
      setDestCoords(null)
    }

    if (value.length < 3) { setSuggestions([]); return }

    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    
    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/maps/get-suggestions`, {
          params: { input: value },
          headers: { Authorization: `Bearer ${localStorage.getItem('user_token')}` }
        })
        setSuggestions(res.data || [])
      } catch { setSuggestions([]) }
    }, 400)
  }

  const selectSuggestion = (s) => {
    if (activeField === 'pickup') {
      setPickup(s)
      setPickupCoords(null)
    } else {
      setDestination(s)
      setDestCoords(null)
    }
    setSuggestions([])
  }

  // ── Show a quick toast (auto-clears after 3s) ──
  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  // ── Quick-pill: tap Home/Work to auto-fill destination ──
  const useSavedPlace = (label) => {
    const place = savedPlaces.find(p => p.label.toLowerCase() === label.toLowerCase())
    if (place) {
      setDestination(place.address)
      setDestCoords(null)
      setSuggestions([])
      setPanelOpen(true)   // expand panel so user sees the filled field
    } else {
      showToast(`No "${label}" saved. Add it in Account → Saved Places.`)
    }
  }

  // ── Use current location (manual trigger or auto-fill) ──
  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.')
      return
    }
    setGeoLocating(true)
    setGeoError('')
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/maps/reverse-geocode`, {
            params: { lat: pos.coords.latitude, lng: pos.coords.longitude },
            headers: { Authorization: `Bearer ${localStorage.getItem('user_token')}` }
          })
          if (res.data?.address) {
            setPickup(res.data.address)
            setPickupCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
            setIsCurrentLocation(true)
            setSuggestions([])
            setActiveField('destination') // auto-advance focus to destination
          } else {
            setGeoError('Could not resolve your address.')
          }
        } catch {
          setGeoError('Location lookup failed. Try typing your address.')
        } finally {
          setGeoLocating(false)
        }
      },
      (err) => {
        setGeoLocating(false)
        if (err.code === 1) setGeoError('Location permission denied. Please enable it in browser settings.')
        else setGeoError('Could not get your location. Try again.')
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  const findTrip = async () => {
    if (!pickup || !destination) return
    setFareError('')
    setFareLoading(true)
    try {
      const payload = { pickup, destination }
      if (pickupCoords) { payload.pickupLat = pickupCoords.lat; payload.pickupLng = pickupCoords.lng }
      if (destCoords) { payload.destLat = destCoords.lat; payload.destLng = destCoords.lng }

      const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/rides/get-fare`, {
        params: payload,
        headers: { Authorization: `Bearer ${localStorage.getItem('user_token')}` }
      })
      setFare(res.data)
      setPanelOpen(false)
      setVehiclePanel(true)
    } catch (err) {
      setFareError(err.response?.data?.message || 'Could not get fare. Check your locations.')
    } finally {
      setFareLoading(false)
    }
  }

  const createRide = async (promoCode, paymentMethod = 'cash') => {
    try {
      const payload = { pickup, destination, vehicleType, paymentMethod, ...(promoCode && { promoCode }) }
      if (pickupCoords) { payload.pickupLat = pickupCoords.lat; payload.pickupLng = pickupCoords.lng }
      if (destCoords) { payload.destLat = destCoords.lat; payload.destLng = destCoords.lng }

      const res = await axios.post(`${import.meta.env.VITE_BASE_URL}/rides/create`,
        payload,
        { headers: { Authorization: `Bearer ${localStorage.getItem('user_token')}` } }
      )
      setRide(res.data)
      setVehiclePanel(false)
      setVehicleFound(true)
    } catch (err) { 
      showToast(err.response?.data?.message || 'Failed to create ride');
    }
  }

  const cancelRide = async () => {
    const rideId = ride?._id
    if (!rideId) {
      // No ride id yet — just reset UI
      setVehicleFound(false)
      setWaitingForDriver(false)
      setVehiclePanel(false)
      setRide(null)
      return
    }
    try {
      await axios.post(
        `${import.meta.env.VITE_BASE_URL}/rides/${rideId}/cancel`,
        { reason: 'Cancelled by user' },
        { headers: { Authorization: `Bearer ${localStorage.getItem('user_token')}` } }
      )
    } catch { /* ignore — backend may already have cancelled */ }
    setVehicleFound(false)
    setWaitingForDriver(false)
    setVehiclePanel(false)
    setRide(null)
    showToast('Ride cancelled.')
  }

  const isIdle = !vehiclePanel && !vehicleFound && !waitingForDriver

  if (isDesktop) {
    return <HomeDesktop 
      pickup={pickup} destination={destination} setPickup={setPickup} setDestination={setDestination}
      handleInputChange={handleInputChange} pickupCoords={pickupCoords} destCoords={destCoords}
      user={user} navigate={navigate} findTrip={findTrip} createRide={createRide} cancelRide={cancelRide}
      vehiclePanel={vehiclePanel} setVehiclePanel={setVehiclePanel} vehicleFound={vehicleFound}
      waitingForDriver={waitingForDriver} ride={ride} fare={fare} fareLoading={fareLoading}
      vehicleType={vehicleType} setVehicleType={setVehicleType} suggestions={suggestions}
      selectSuggestion={selectSuggestion} activeField={activeField} setActiveField={setActiveField}
      setMapPickerField={setMapPickerField} isCurrentLocation={isCurrentLocation}
    /> 
  }

  return (
    <div className="bg-black text-slate-900 flex justify-center items-center min-h-screen font-['Inter']">
      <main className="relative w-full max-w-[390px] h-[100dvh] bg-slate-100 overflow-hidden shadow-2xl flex flex-col">

        {/* Map Background */}
        <div className="absolute inset-0 z-0">
          <LiveTracking />
        </div>
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/20 via-transparent to-black/50 pointer-events-none" />

        {/* ── Top Navbar ── */}
        <header className="relative z-10 flex items-center justify-between px-5 pt-12 pb-4">
          <button
            className="w-11 h-11 bg-white/95 backdrop-blur-md rounded-full flex items-center justify-center shadow-md active:scale-90 transition-transform"
            onClick={() => setMenuOpen(true)}
          >
            <i className="fa-solid fa-bars text-slate-700 text-base"></i>
          </button>

          <div className="flex bg-white/95 backdrop-blur-md px-4 py-2 rounded-full shadow-md items-center gap-2">
            <img src="/logo.png" alt="QuickBike" className="h-10 w-auto object-contain" />
            <span className="font-bold text-sm text-slate-800">QuickBike</span>
          </div>

          <button
            className="w-11 h-11 bg-white/95 backdrop-blur-md rounded-full flex items-center justify-center shadow-md active:scale-90 transition-transform brand-border border-2"
            onClick={() => navigate('/user/account')}
          >
            <i className="fa-solid fa-user text-slate-600 text-base"></i>
          </button>
        </header>

        {/* ── Floating Bottom Search Panel (Idle only) ── */}
        {isIdle && (
          <div className="absolute bottom-0 w-full z-20">
            <div className={`bg-white rounded-t-[32px] px-6 pt-5 shadow-[0_-10px_30px_rgba(0,0,0,0.12)] transition-all duration-300 ${panelOpen ? 'pb-4' : 'pb-24'}`}>

              <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-5 cursor-pointer" onClick={() => setPanelOpen(!panelOpen)} />

              <h2 className="text-2xl font-extrabold font-['Manrope'] mb-5 text-slate-900">Where to?</h2>

              {/* Location Inputs */}
              <div className="space-y-3 relative mb-5">
                <div className="absolute left-[22px] top-[28px] bottom-[28px] w-[2px] bg-slate-200 z-10" />

                {/* Pickup */}
                <div className="relative">
                  <div className="absolute left-[17px] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-slate-800 ring-4 ring-slate-100 z-20" />
                  <input
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-14 pr-12 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-700 transition font-medium text-sm"
                    placeholder="Current location"
                    value={isCurrentLocation ? 'Your Current Location' : pickup}
                    onFocus={() => {
                      setActiveField('pickup')
                      setPanelOpen(true)
                      // When user taps into the GPS-filled field, clear it so they can type
                      if (isCurrentLocation) {
                        setPickup('')
                        setIsCurrentLocation(false)
                      }
                    }}
                    onChange={(e) => handleInputChange(e.target.value, 'pickup')}
                  />
                  {/* Pick on map button */}
                  <button
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl flex items-center justify-center transition-colors active:scale-90 z-20"
                    onClick={() => setMapPickerField('pickup')}
                    title="Pick pickup on map"
                    type="button"
                  >
                    <i className="fa-solid fa-map-location-dot text-slate-500 text-xs" />
                  </button>
                </div>

                {/* Destination */}
                <div className="relative">
                  <div className="absolute left-[17px] top-1/2 -translate-y-1/2 w-3 h-3 brand-bg rounded-sm z-20" />
                  <input
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-14 pr-12 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400 transition font-medium text-sm"
                    placeholder="Where are you going?"
                    value={destination}
                    onFocus={() => { setActiveField('destination'); setPanelOpen(true) }}
                    onChange={(e) => handleInputChange(e.target.value, 'destination')}
                  />
                  {/* Pick on map button */}
                  <button
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-xl flex items-center justify-center transition-colors active:scale-90 z-20"
                    onClick={() => setMapPickerField('destination')}
                    title="Pick drop-off on map"
                    type="button"
                  >
                    <i className="fa-solid fa-map-location-dot text-orange-500 text-xs" />
                  </button>
                </div>
              </div>

              {/* ── Use Current Location Button (shows when pickup is active or empty) ── */}
              {(activeField === 'pickup' || !pickup) && !vehiclePanel && (
                <div className="mb-4 space-y-2">
                  <button
                    onClick={useCurrentLocation}
                    disabled={geoLocating}
                    className="flex items-center gap-2.5 bg-slate-50 hover:bg-orange-50 active:bg-orange-100 border border-slate-200 hover:border-orange-200 px-4 py-2.5 rounded-full transition-all active:scale-95 disabled:opacity-60"
                  >
                    {geoLocating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-orange-300 border-t-orange-500 rounded-full animate-spin" />
                        <span className="text-sm font-semibold text-slate-600">Locating you...</span>
                      </>
                    ) : (
                      <>
                        <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                          <div className="w-2 h-2 rounded-full bg-white" />
                        </div>
                        <span className="text-sm font-semibold text-slate-700">Use my current location</span>
                      </>
                    )}
                  </button>
                  {geoError && (
                    <p className="text-xs text-red-500 font-medium pl-1 flex items-center gap-1.5">
                      <i className="fa-solid fa-circle-exclamation" />
                      {geoError}
                    </p>
                  )}
                </div>
              )}

              {panelOpen && suggestions.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-100 p-1 mb-4 max-h-[35vh] overflow-y-auto shadow-sm">
                  {suggestions.map((s, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors"
                      onClick={() => selectSuggestion(s)}
                    >
                      <div className="w-9 h-9 brand-surface rounded-full flex items-center justify-center brand-text shrink-0">
                        <i className="fa-solid fa-location-dot text-sm"></i>
                      </div>
                      <span className="font-medium text-slate-700 text-sm leading-tight">{s}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Fare error */}
              {fareError && (
                <div className="flex items-center gap-3 bg-red-50 border-l-4 border-red-500 rounded-r-xl p-3 mb-3 animate-fade-in">
                  <i className="fa-solid fa-circle-exclamation text-red-500 shrink-0"></i>
                  <p className="text-xs font-semibold text-red-700 flex-1">{fareError}</p>
                  <button onClick={() => setFareError('')} className="text-red-400"><i className="fa-solid fa-xmark"></i></button>
                </div>
              )}

              {/* Find Trip CTA */}
              {pickup && destination && (
                <button
                  className="w-full brand-btn text-white font-extrabold text-base py-4 rounded-full shadow-lg active:scale-95 transition-transform mb-2 disabled:opacity-60 flex items-center justify-center gap-2"
                  onClick={findTrip}
                  disabled={fareLoading}
                >
                  {fareLoading ? (
                    <><i className="fa-solid fa-circle-notch fa-spin"></i> Finding...</>  
                  ) : 'Find Trip'}
                </button>
              )}

              {/* ── Quick Pills (only when collapsed) ── */}
              {!panelOpen && (
                <div className="flex gap-2 mt-4 overflow-x-auto pb-1 no-scrollbar">
                  <button
                    onClick={() => useSavedPlace('Home')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-full border shrink-0 active:scale-95 transition-all ${
                      savedPlaces.find(p => p.label === 'Home')
                        ? 'bg-orange-50 border-orange-200 text-slate-800'
                        : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}
                  >
                    <i className="fa-solid fa-house text-orange-500 text-sm" />
                    <span className="font-semibold text-sm">Home</span>
                  </button>
                  <button
                    onClick={() => useSavedPlace('Work')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-full border shrink-0 active:scale-95 transition-all ${
                      savedPlaces.find(p => p.label === 'Work')
                        ? 'bg-orange-50 border-orange-200 text-slate-800'
                        : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}
                  >
                    <i className="fa-solid fa-briefcase text-orange-500 text-sm" />
                    <span className="font-semibold text-sm">Work</span>
                  </button>
                  <button
                    className="flex items-center gap-2 bg-slate-50 px-4 py-2.5 rounded-full border border-slate-200 shrink-0 active:scale-95 transition-transform"
                    onClick={() => navigate('/user/rides')}
                  >
                    <i className="fa-solid fa-clock-rotate-left text-orange-600 text-sm" />
                    <span className="font-semibold text-sm text-slate-700">Recent</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Full-screen Ride Panels (absolute overlays on main) ── */}
        {vehiclePanel && (
          <div className="absolute inset-0 z-30">
            <VehiclePanel
              pickup={pickup}
              destination={destination}
              fare={fare}
              vehicleType={vehicleType}
              selectVehicle={(t) => setVehicleType(t)}
              setVehiclePanel={setVehiclePanel}
              createRide={createRide}
              walletBalance={user?.wallet?.balance || 0}
            />
          </div>
        )}
        {vehicleFound && (
          <div className="absolute bottom-0 left-0 right-0 z-30">
            <LookingForDriver
              pickup={pickup}
              destination={destination}
              fare={fare}
              vehicleType={vehicleType}
              ride={ride}
              setRide={setRide}
              setVehicleFound={setVehicleFound}
            />
          </div>
        )}
        {waitingForDriver && (
          <div className="absolute inset-0 z-30">
            <WaitingForDriver
              ride={ride}
              setWaitingForDriver={setWaitingForDriver}
            />
          </div>
        )}

        {/* ── Map Picker Modal ── */}
        {mapPickerField && (
          <MapPicker
            fieldLabel={mapPickerField === 'pickup' ? 'Pickup' : 'Drop-off'}
            onConfirm={(addr) => {
              if (mapPickerField === 'pickup') setPickup(addr)
              else setDestination(addr)
            }}
            onClose={() => setMapPickerField(null)}
          />
        )}

        {/* ── Bottom Nav ── */}
        {isIdle && !panelOpen && (
          <nav className="absolute bottom-0 w-full bg-white/95 backdrop-blur-lg border-t border-slate-100 px-8 py-2.5 flex justify-between items-center z-30">
            <button className="flex flex-col items-center gap-1 brand-text">
              <i className="fa-solid fa-motorcycle text-xl"></i>
              <span className="text-[10px] font-bold">Ride</span>
            </button>
            <button className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600 transition-colors" onClick={() => navigate('/user/rides')}>
              <i className="fa-solid fa-clock-rotate-left text-xl"></i>
              <span className="text-[10px] font-semibold">Activity</span>
            </button>
            <button className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600 transition-colors" onClick={() => navigate('/user/account')}>
              <i className="fa-solid fa-user text-xl"></i>
              <span className="text-[10px] font-semibold">Account</span>
            </button>
          </nav>
        )}

        {/* ── Side Menu Drawer ── */}
        {menuOpen && (
          <>
            {/* Backdrop */}
            <div
              className="absolute inset-0 z-40 bg-black/50 backdrop-blur-sm"
              onClick={() => setMenuOpen(false)}
            />
            {/* Drawer */}
            <aside className="absolute left-0 top-0 bottom-0 z-50 w-[80%] max-w-[300px] bg-white flex flex-col shadow-2xl animate-slide-right">
              {/* Drawer Header */}
              <div className="brand-btn px-6 pt-14 pb-8">
                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-4 border-2 border-white/40">
                  <i className="fa-solid fa-user text-white text-2xl"></i>
                </div>
                <h2 className="text-white font-extrabold text-xl font-['Manrope']">
                  {user?.fullname?.firstname || 'Rider'} {user?.fullname?.lastname || ''}
                </h2>
                <p className="text-orange-200 text-sm font-medium mt-1">{user?.email}</p>
              </div>

              {/* Drawer Menu Items */}
              <nav className="flex-grow overflow-y-auto px-4 py-6 space-y-1">
                {[
                  { icon: 'fa-motorcycle', label: 'Book a Ride', action: () => setMenuOpen(false) },
                  { icon: 'fa-clock-rotate-left', label: 'Activity', action: () => { navigate('/user/rides'); setMenuOpen(false) } },
                  { icon: 'fa-bookmark', label: 'Saved Places', action: () => { navigate('/user/account'); setMenuOpen(false) } },
                  { icon: 'fa-wallet', label: 'Payment', action: () => setMenuOpen(false) },
                  { icon: 'fa-tag', label: 'Offers & Promos', action: () => setMenuOpen(false) },
                  { icon: 'fa-headset', label: 'Help & Support', action: () => setMenuOpen(false) },
                  { icon: 'fa-shield-halved', label: 'Safety', action: () => setMenuOpen(false) },
                  { icon: 'fa-gear', label: 'Settings', action: () => { navigate('/user/account'); setMenuOpen(false) } },
                ].map((item) => (
                  <button
                    key={item.label}
                    className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl hover:bg-orange-50 active:bg-orange-100 transition-colors text-left"
                    onClick={item.action}
                  >
                    <div className="w-9 h-9 rounded-full brand-surface flex items-center justify-center brand-text shrink-0">
                      <i className={`fa-solid ${item.icon} text-sm`}></i>
                    </div>
                    <span className="font-semibold text-slate-700">{item.label}</span>
                  </button>
                ))}
              </nav>

              {/* Drawer Footer */}
              <div className="px-4 pb-8 border-t border-slate-100 pt-4">
                <button
                  className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl hover:bg-red-50 transition-colors"
                  onClick={() => navigate('/user/logout')}
                >
                  <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center text-red-500 shrink-0">
                    <i className="fa-solid fa-power-off text-sm"></i>
                  </div>
                  <span className="font-semibold text-red-600">Logout</span>
                </button>
              </div>
            </aside>
          </>
        )}

        {/* ── Toast notification ── */}
        {toast && (
          <div className="absolute top-24 left-1/2 -translate-x-1/2 z-50 w-[88%] max-w-sm">
            <div className="bg-slate-800 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-fade-in">
              <i className="fa-solid fa-circle-info text-orange-400 shrink-0" />
              <span className="flex-1">{toast}</span>
              <button onClick={() => setToast('')} className="text-slate-400 hover:text-white shrink-0">
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
          </div>
        )}

        {/* ── Map Picker Modal ── */}
        {mapPickerField && (
          <MapPicker
            fieldLabel={mapPickerField === 'pickup' ? 'Pickup' : 'Drop-off'}
            onConfirm={(addr, coords) => {
              if (mapPickerField === 'pickup') { setPickup(addr); setPickupCoords(coords); setIsCurrentLocation(false) }
              else { setDestination(addr); setDestCoords(coords) }
            }}
            onClose={() => setMapPickerField(null)}
          />
        )}

      </main>
    </div>
  )
}

export default Home