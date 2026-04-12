import React, { useEffect, useState, useContext, useCallback } from 'react'
import { useNavigate } from 'react-router'
import axios from 'axios'
import { SocketContext } from '../context/SocketContext'
import { CaptainDataContext } from '../context/CapatainContext'
import LiveTracking from '../components/LiveTracking'
import RidePopUp from '../components/RidePopUp'
import ConfirmRidePopUp from '../components/ConfirmRidePopUp'

const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('captain_token')}` })

const CaptainHome = () => {
  const [ridePopupPanel, setRidePopupPanel] = useState(false)
  const [confirmRidePopupPanel, setConfirmRidePopupPanel] = useState(false)
  const [ride, setRide] = useState(null)
  const [isOnline, setIsOnline] = useState(false)
  const [stats, setStats] = useState({ todayEarnings: 0, todayRides: 0, completedRides: 0 })
  const [statsLoading, setStatsLoading] = useState(false)

  const { socket } = useContext(SocketContext)
  const { captain } = useContext(CaptainDataContext)
  const navigate = useNavigate()

  // KYC Gate: redirect if not verified
  useEffect(() => {
    if (!captain) return
    const kycStatus = captain.kycStatus || 'none'
    if (kycStatus === 'none' || kycStatus === 'rejected') {
      navigate('/captain/kyc', { replace: true })
    } else if (kycStatus === 'pending') {
      navigate('/captain/kyc/pending', { replace: true })
    }
    // kycStatus === 'approved' → stay on CaptainHome
  }, [captain, navigate])

  // Helper: get GPS and emit to server immediately
  const emitCurrentLocation = useCallback(() => {
    if (!captain?._id || !socket || !navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        socket.emit('update-location-captain', {
          userId: captain._id,
          location: { ltd: pos.coords.latitude, lng: pos.coords.longitude }
        })
      },
      () => {},
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }, [captain, socket])

  useEffect(() => {
    if (captain?._id && socket) {
      const token = localStorage.getItem('captain_token');
      if (token && socket.auth?.token !== token) {
        socket.auth = { token };
        socket.disconnect().connect();
      } else if (!socket.connected) {
        socket.connect();
      }
    }
  }, [captain, socket])

  // Join socket room — emit on mount AND when socket (re)connects
  useEffect(() => {
    if (!captain?._id || !socket) return

    const doJoin = () => {
      socket.emit('join', { userType: 'captain', userId: captain._id })
      console.log('[CaptainHome] Joined socket room as captain:', captain._id)
      // Push GPS immediately so DB has fresh coordinates for dispatch
      emitCurrentLocation()
    }

    if (socket.connected) doJoin()
    socket.on('connect', doJoin)
    return () => socket.off('connect', doJoin)
  }, [captain, socket, emitCurrentLocation])

  // Send location updates every 10 seconds when online
  useEffect(() => {
    if (!isOnline) return
    const locationInterval = setInterval(emitCurrentLocation, 10000)
    return () => clearInterval(locationInterval)
  }, [isOnline, emitCurrentLocation])

  // Heartbeat: keep captain presence alive (30s interval)
  useEffect(() => {
    if (!isOnline || !socket) return
    const heartbeatInterval = setInterval(() => {
      socket.emit('heartbeat', { timestamp: Date.now() })
    }, 30000)
    return () => clearInterval(heartbeatInterval)
  }, [isOnline, socket])

  // Listen for new rides + cancellations + ride-state-sync
  useEffect(() => {
    if (!socket) return
    const handleNewRide = (data) => {
      if (isOnline) {
        setRide(data)
        setRidePopupPanel(true)
      }
    }
    const handleRideCancelled = () => {
      setRidePopupPanel(false)
      setConfirmRidePopupPanel(false)
      setRide(null)
    }

    // Ride state sync on reconnect — restore captain's active ride UI
    const handleRideStateSync = (data) => {
      if (!data) return
      setRide(data)
      if (data.status === 'accepted') {
        setRidePopupPanel(false)
        setConfirmRidePopupPanel(true)
      } else if (data.status === 'ongoing') {
        navigate('/captain/riding', { state: { ride: data } })
      }
    }

    socket.on('new-ride', handleNewRide)
    socket.on('ride-cancelled', handleRideCancelled)
    socket.on('ride-state-sync', handleRideStateSync)
    return () => {
      socket.off('new-ride', handleNewRide)
      socket.off('ride-cancelled', handleRideCancelled)
      socket.off('ride-state-sync', handleRideStateSync)
    }
  }, [socket, isOnline, navigate])

  // Load today's stats
  const fetchStats = useCallback(async () => {
    if (!captain?._id) return
    setStatsLoading(true)
    try {
      const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/rides/stats`, {
        params: { userType: 'captain' },
        headers: authHeader()
      })
      // Handle both old format (direct) and new envelope format ({ data: {...} })
      const statsData = res.data?.data || res.data
      setStats(statsData)
    } catch {
      // stats failed silently
    } finally {
      setStatsLoading(false)
    }
  }, [captain])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  // Toggle online / offline
  const toggleOnlineStatus = useCallback(() => {
    if (!captain?._id || !socket) return
    const newStatus = isOnline ? 'inactive' : 'active'
    socket.emit('update-status-captain', { userId: captain._id, status: newStatus })
    setIsOnline(!isOnline)

    // Push GPS immediately when going online so dispatch finds this captain now
    if (newStatus === 'active') emitCurrentLocation()
  }, [captain, socket, isOnline, emitCurrentLocation])

  const confirmRide = async () => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/rides/confirm`, {
        rideId: ride._id,
        captainId: captain._id,
      }, { headers: authHeader() })
      if (response.status === 200) {
        setRidePopupPanel(false)
        setConfirmRidePopupPanel(true)
      }
    } catch (err) {
      console.error('Error confirming ride:', err)
    }
  }

  return (
    <div className="bg-black text-slate-900 flex justify-center items-center min-h-screen font-['Inter']">
      <main className="relative w-full max-w-[390px] h-[100dvh] bg-slate-100 overflow-hidden shadow-2xl flex flex-col">
        
        {/* Map Background */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <LiveTracking />
        </div>
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/10 to-black/40 pointer-events-none" />

        {/* Top Navbar */}
        <header className="relative z-10 flex items-center justify-between px-6 py-4 pt-12">
          <button
            onClick={() => navigate('/captain/account')}
            className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-md active:scale-95 transition-transform"
          >
            <i className="fa-solid fa-user text-slate-800 text-sm" />
          </button>
          
          {/* Online / Offline toggle pill */}
          <button
            onClick={toggleOnlineStatus}
            className={`flex px-4 py-2 rounded-full shadow-md items-center gap-2 transition-all active:scale-95 backdrop-blur-md ${
              isOnline
                ? 'bg-green-500/90 border border-green-400'
                : 'bg-white/90 border border-gray-200'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-white animate-pulse' : 'bg-gray-400'}`} />
            <span className={`font-bold text-sm ${isOnline ? 'text-white' : 'text-gray-700'}`}>
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </button>

          <button
            className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-md active:scale-95 transition-transform"
            onClick={() => navigate('/captain/logout')}
          >
            <i className="fa-solid fa-power-off text-orange-600" />
          </button>
        </header>

        {/* Status badge & metrics */}
        {!ridePopupPanel && !confirmRidePopupPanel && (
          <div className="absolute bottom-6 left-4 right-4 z-20 animate-slide-up">
            <div className="bg-white rounded-[32px] p-6 shadow-xl border border-gray-100 flex flex-col items-center">
              {isOnline ? (
                <>
                  <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex justify-center items-center mb-3 relative">
                    <div className="absolute inset-0 border-4 border-green-500/20 rounded-full animate-ping" />
                    <i className="fa-solid fa-location-arrow text-2xl" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 font-['Manrope']">Looking for rides</h3>
                  <p className="text-sm font-medium text-gray-500 mt-1">Waiting for nearby requests...</p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex justify-center items-center mb-3">
                    <i className="fa-solid fa-moon text-2xl" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 font-['Manrope']">You're offline</h3>
                  <p className="text-sm font-medium text-gray-500 mt-1">Tap the button above to go online</p>
                </>
              )}

              <div className="flex w-full mt-5 bg-slate-50 p-4 rounded-2xl border border-slate-100 gap-px">
                <div className="flex-1 text-center border-r border-slate-200 pr-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Today</p>
                  <p className="text-lg font-black text-gray-800">
                    ₹{statsLoading ? '—' : (stats.todayEarnings || 0)}
                  </p>
                </div>
                <div className="flex-1 text-center border-r border-slate-200 px-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Rides</p>
                  <p className="text-lg font-black text-gray-800">
                    {statsLoading ? '—' : (stats.todayRides || 0)}
                  </p>
                </div>
                <div className="flex-1 text-center pl-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total</p>
                  <p className="text-lg font-black text-gray-800">
                    {statsLoading ? '—' : (stats.completedRides || 0)}
                  </p>
                </div>
              </div>

              {/* Captain info strip */}
              <div className="w-full mt-4 flex items-center gap-3 pt-4 border-t border-gray-100">
                <div className="w-10 h-10 rounded-full bg-slate-200 flex justify-center items-center">
                  <i className="fa-solid fa-user text-slate-500 text-sm" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-bold text-gray-800 text-sm">
                    {captain?.fullname?.firstname} {captain?.fullname?.lastname}
                  </p>
                  <p className="text-xs text-gray-500">
                    {captain?.vehicle?.color} {captain?.vehicle?.vehicleType?.toUpperCase()} · {captain?.vehicle?.plate}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-lg">
                    {captain?.ratings?.average ? `${captain.ratings.average.toFixed(1)} ★` : '— ★'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Ride popup */}
        {ridePopupPanel && (
          <div className="absolute inset-x-0 bottom-0 z-50">
            <RidePopUp
              ride={ride}
              setRidePopupPanel={setRidePopupPanel}
              confirmRide={confirmRide}
            />
          </div>
        )}

        {/* Confirm ride popup */}
        {confirmRidePopupPanel && (
          <div className="absolute inset-x-0 bottom-0 z-[60]">
            <ConfirmRidePopUp
              ride={ride}
              setConfirmRidePopupPanel={setConfirmRidePopupPanel}
              setRidePopupPanel={setRidePopupPanel}
            />
          </div>
        )}
      </main>
    </div>
  )
}

export default CaptainHome