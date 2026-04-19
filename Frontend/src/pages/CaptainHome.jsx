import React, { useEffect, useState, useContext, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router'
import axios from 'axios'
import { SocketContext } from '../context/SocketContext'
import { CaptainDataContext } from '../context/CapatainContext'
import LiveTracking from '../components/LiveTracking'
import RidePopUp from '../components/RidePopUp'
import ConfirmRidePopUp from '../components/ConfirmRidePopUp'
import CaptainDesktopSidebar from '../components/CaptainDesktopSidebar'

const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('captain_token')}` })

const CaptainHome = () => {
  const [ridePopupPanel, setRidePopupPanel] = useState(false)
  const [confirmRidePopupPanel, setConfirmRidePopupPanel] = useState(false)
  const [ride, setRide] = useState(null)
  const [isOnline, setIsOnline] = useState(false)
  const [stats, setStats] = useState({ todayEarnings: 0, todayRides: 0, completedRides: 0 })
  const [onlineHours, setOnlineHours] = useState('0.0')
  const [recentRides, setRecentRides] = useState([])
  const [statsLoading, setStatsLoading] = useState(false)
  const [panelExpanded, setPanelExpanded] = useState(true)

  const touchStartY = useRef(0)

  const { socket } = useContext(SocketContext)
  const { captain } = useContext(CaptainDataContext)
  const navigate = useNavigate()

  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY
  }

  const handleTouchEnd = (e) => {
    const touchEndY = e.changedTouches[0].clientY
    const deltaY = touchEndY - touchStartY.current

    if (deltaY > 40) {
      // Swiped down
      setPanelExpanded(false)
    } else if (deltaY < -40) {
      // Swiped up
      setPanelExpanded(true)
    }
  }

  // Derive KYC state — used to gate going online
  const kycStatus = captain?.kycStatus || 'none'
  const kycApproved = kycStatus === 'approved'
  const kycPending  = kycStatus === 'pending'
  const kycRejected = kycStatus === 'rejected' || kycStatus === 'none'

  // KYC gate: if no KYC at all, redirect to start the flow
  useEffect(() => {
    if (!captain) return
    if (kycStatus === 'none') {
      navigate('/captain/kyc', { replace: true })
    }
    // 'pending' and 'rejected' → stay on home, show banner
    // 'approved' → full access
  }, [captain, kycStatus, navigate])

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

  // Load today's stats and recent rides
  const fetchStats = useCallback(async () => {
    if (!captain?._id) return
    setStatsLoading(true)
    try {
      const [statsRes, historyRes, onlineRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_BASE_URL}/rides/stats`, {
          params: { userType: 'captain' },
          headers: authHeader()
        }),
        axios.get(`${import.meta.env.VITE_BASE_URL}/rides/history`, {
          params: { userType: 'captain', limit: 5 },
          headers: authHeader()
        }),
        axios.get(`${import.meta.env.VITE_BASE_URL}/rides/online-stats`, {
          headers: authHeader()
        }).catch(() => ({ data: { data: { totalOnlineHours: '0.0' } } }))
      ])
      
      const statsData = statsRes.data?.data || statsRes.data
      setStats(statsData)
      setOnlineHours(onlineRes.data?.data?.totalOnlineHours || '0.0')

      const rawRides = historyRes.data
      const historyData = Array.isArray(rawRides) ? rawRides : rawRides?.data || rawRides?.rides || []
      setRecentRides(historyData.slice(0, 5))
    } catch {
      // stats failed silently
    } finally {
      setStatsLoading(false)
    }
  }, [captain])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  // Toggle online / offline — only allowed when KYC is approved
  const toggleOnlineStatus = useCallback(() => {
    if (!kycApproved) return          // silently blocked; UI shows lock
    if (!captain?._id || !socket) return
    const newStatus = isOnline ? 'inactive' : 'active'
    socket.emit('update-status-captain', { userId: captain._id, status: newStatus })
    setIsOnline(!isOnline)
    if (newStatus === 'active') emitCurrentLocation()
  }, [captain, socket, isOnline, emitCurrentLocation, kycApproved])

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
    <div className="bg-[#F9F5F0] dark:bg-[#0a0a0c] text-slate-900 dark:text-gray-100 min-h-screen font-['Inter'] flex flex-col md:flex-row overflow-hidden h-[100dvh]">
      
      {/* ── Left Sidebar (Desktop Only) ── */}
      <CaptainDesktopSidebar />

      {/* ── Middle: Map & Mobile Main ── */}
      <main className="relative flex-1 h-[100dvh] bg-slate-300 dark:bg-[#161719] overflow-hidden flex flex-col transition-colors">
        {/* Map Background */}
        <div className="absolute inset-0 z-0">
          <LiveTracking />
        </div>
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/10 to-transparent pointer-events-none" />

        {/* Top Navbar */}
        <header className="relative z-10 flex items-center justify-between px-4 py-4 md:px-6 md:py-6 lg:justify-end">
          {/* Mobile only left controls */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => navigate('/captain/account')}
              className="w-10 h-10 bg-white/90 dark:bg-[#1a1c1e]/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-md active:scale-95 transition-transform"
            >
              <i className="fa-solid fa-user text-slate-800 dark:text-gray-200 text-sm" />
            </button>
            <div className="h-10 bg-white/90 dark:bg-[#1a1c1e]/90 backdrop-blur-md rounded-full flex items-center shadow-md px-3 border border-orange-100 dark:border-[#333] cursor-pointer">
              <i className="fa-solid fa-wallet text-orange-500 mr-2" />
              <span className="font-bold text-sm text-slate-700 dark:text-gray-200">₹{captain?.wallet?.balance || 0}</span>
            </div>
          </div>

          {/* Desktop Right Controls / Mobile Right Controls */}
          <div className="flex flex-1 md:flex-initial items-center justify-end gap-3 w-full md:w-auto">
            {/* Go Online Pill */}
            <button
              onClick={toggleOnlineStatus}
              title={!kycApproved ? 'Go online is locked until your KYC is verified' : ''}
              className={`flex px-6 py-2.5 rounded-xl shadow-md items-center justify-center gap-2 transition-all backdrop-blur-md font-bold text-sm min-w-[120px] ${
                !kycApproved
                  ? 'bg-white/80 dark:bg-[#1a1c1e]/90 border border-gray-200 dark:border-[#333] cursor-not-allowed text-gray-500'
                  : isOnline
                  ? 'bg-green-600 hover:bg-green-700 active:scale-95 text-white shadow-green-600/30'
                  : 'bg-[#E57E01] hover:bg-orange-600 active:scale-95 text-white shadow-orange-500/30'
              }`}
            >
              {!kycApproved ? (
                <>
                  <i className="fa-solid fa-lock text-xs" />
                  Locked
                </>
              ) : (
                <>
                  <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-white animate-pulse' : 'bg-orange-200'}`} />
                  {isOnline ? 'Go Offline' : 'Go Online'}
                </>
              )}
            </button>
            
            {/* Desktop only Notification & user icons */}
            <div className="hidden md:flex items-center gap-3">
              <button className="w-10 h-10 rounded-full flex items-center justify-center text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-gray-200 transition-colors"><i className="fa-solid fa-bell text-lg" /></button>
              <button onClick={() => navigate('/captain/account')} className="w-10 h-10 rounded-full flex items-center justify-center text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-gray-200 transition-colors"><i className="fa-solid fa-user-circle text-2xl" /></button>
            </div>

            {/* Mobile only power off */}
            <button
              className="md:hidden w-10 h-10 bg-white/90 dark:bg-[#1a1c1e]/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-md active:scale-95 transition-transform"
              onClick={() => navigate('/captain/logout')}
            >
              <i className="fa-solid fa-power-off text-orange-600" />
            </button>
          </div>
        </header>

        {/* KYC compact notification strip */}
        {!kycApproved && (
          <div className={`relative z-10 mx-4 md:mx-auto md:w-max md:max-w-md mt-1 rounded-2xl px-4 py-2.5 flex items-center gap-2.5 shadow-lg ${
            kycPending
              ? 'bg-amber-500 border border-amber-600'
              : 'bg-red-500 border border-red-600'
          }`}>
            <i className={`fa-solid ${kycPending ? 'fa-hourglass-half' : 'fa-circle-exclamation'} text-white text-xs shrink-0`} />
            <p className="text-white text-xs font-semibold flex-1 leading-snug">
              {kycPending
                ? 'KYC under review — you cannot go online yet'
                : 'KYC rejected — re-submit to take rides'}
            </p>
            {kycRejected && (
              <button
                onClick={() => navigate('/captain/kyc/step/1')}
                className="text-white text-[10px] font-black bg-white/25 px-2.5 py-1 rounded-lg shrink-0 active:scale-95 transition-transform"
              >
                Fix →
              </button>
            )}
          </div>
        )}

        {/* Status badge & metrics - Mobile Only */}
        <div className="md:hidden">
        {!ridePopupPanel && !confirmRidePopupPanel && (
          <div 
            className={`absolute bottom-0 left-0 right-0 z-20 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${panelExpanded ? 'translate-y-0' : 'translate-y-[calc(100%-3.5rem)]'}`}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div className="bg-white dark:bg-[#161719] rounded-t-[32px] p-6 pb-8 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] dark:shadow-none border-t border-gray-100 dark:border-[#222] flex flex-col items-center">
              
              {/* Drag Handle / Toggle */}
              <div 
                className="absolute top-0 left-0 w-full h-10 flex items-center justify-center cursor-pointer opacity-70 hover:opacity-100 transition-opacity"
                onClick={() => setPanelExpanded(!panelExpanded)}
              >
                <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
              </div>

              <div className="mt-4 flex flex-col items-center w-full transition-opacity duration-300">
                {!kycApproved ? (
                  <>
                    <div className="w-16 h-16 bg-amber-100 dark:bg-amber-500/10 text-amber-500 rounded-full flex justify-center items-center mb-3">
                      <i className="fa-solid fa-hourglass-half text-2xl" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 font-['Manrope']">
                      {kycPending ? 'Verification in Progress' : 'Account Not Verified'}
                    </h3>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1 text-center px-4">
                      {kycPending
                        ? 'Your documents are being reviewed. Once approved, you can start taking rides!'
                        : 'Submit your KYC documents to start accepting rides.'}
                    </p>
                  </>
                ) : isOnline ? (
                  <>
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-500/10 text-green-500 rounded-full flex justify-center items-center mb-3 relative">
                      <div className="absolute inset-0 border-4 border-green-500/20 dark:border-green-500/30 rounded-full animate-ping" />
                      <i className="fa-solid fa-location-arrow text-2xl" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 font-['Manrope']">Looking for rides</h3>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">Waiting for nearby requests...</p>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-gray-100 dark:bg-[#1f2125] text-gray-400 rounded-full flex justify-center items-center mb-3">
                      <i className="fa-solid fa-moon text-2xl" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 font-['Manrope']">You're offline</h3>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">Tap the button above to go online</p>
                  </>
                )}
              </div>

              {/* Stats Bottom Area (Hides when collapsed!) */}
              <div className={`w-full overflow-hidden transition-all duration-300 ${panelExpanded ? 'max-h-[200px] opacity-100 mt-5' : 'max-h-0 opacity-0 mt-0 pointer-events-none'}`}>
                <div className="flex w-full bg-slate-50 dark:bg-[#1f2125] p-4 rounded-2xl border border-slate-100 dark:border-[#2b2d31] gap-px">
                  <div className="flex-1 text-center border-r border-slate-200 dark:border-[#2b2d31] pr-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Today</p>
                    <p className="text-lg font-black text-gray-800 dark:text-gray-100">
                      ₹{statsLoading ? '—' : (stats.todayEarnings || 0)}
                    </p>
                  </div>
                  <div className="flex-1 text-center border-r border-slate-200 dark:border-[#2b2d31] px-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Rides</p>
                    <p className="text-lg font-black text-gray-800 dark:text-gray-100">
                      {statsLoading ? '—' : (stats.todayRides || 0)}
                    </p>
                  </div>
                  <div className="flex-1 text-center pl-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total</p>
                    <p className="text-lg font-black text-gray-800 dark:text-gray-100">
                      {statsLoading ? '—' : (stats.completedRides || 0)}
                    </p>
                  </div>
                </div>

                {/* Captain info strip */}
                <div className="w-full mt-4 flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-[#2b2d31]">
                  <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-[#2b2d31] flex justify-center items-center">
                    <i className="fa-solid fa-user text-slate-500 dark:text-slate-400 text-sm" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-bold text-gray-800 dark:text-gray-100 text-sm">
                      {captain?.fullname?.firstname} {captain?.fullname?.lastname}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
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
          </div>
        )}
        </div>

        {/* Ride popup */}
        {ridePopupPanel && (
          <div className="absolute inset-x-0 bottom-0 md:inset-auto md:top-[50%] md:left-[50%] md:translate-x-[-50%] md:translate-y-[-50%] md:w-[400px] z-[50]">
            <RidePopUp
              ride={ride}
              setRidePopupPanel={setRidePopupPanel}
              confirmRide={confirmRide}
            />
          </div>
        )}

        {/* Confirm ride popup */}
        {confirmRidePopupPanel && (
          <div className="absolute inset-x-0 bottom-0 md:inset-auto md:top-[50%] md:left-[50%] md:translate-x-[-50%] md:translate-y-[-50%] md:w-[400px] z-[60]">
            <ConfirmRidePopUp
              ride={ride}
              setConfirmRidePopupPanel={setConfirmRidePopupPanel}
              setRidePopupPanel={setRidePopupPanel}
            />
          </div>
        )}
      </main>

      {/* ── Right Sidebar (Desktop Only) ── */}
      {/* ── Right Sidebar (Desktop Only) ── */}
      <aside className="hidden lg:flex w-[400px] bg-white dark:bg-[#121214] border-l border-slate-100 dark:border-[#2b2d31] flex-col h-full z-10 overflow-y-auto shrink-0 transition-colors">
        <div className="p-8 pb-4">
          <p className="text-[10px] font-black text-orange-500 tracking-widest uppercase mb-2">The Daily Forecast</p>
          <h2 className="text-3xl font-extrabold font-['Manrope'] text-slate-900 dark:text-gray-100 leading-tight transition-colors">Today's Earnings</h2>
          <div className="flex items-baseline gap-3 mt-1">
             <span className="text-5xl font-black text-slate-900 dark:text-gray-100 tracking-tight transition-colors">₹{stats.todayEarnings || 0}</span>
             <span className="text-sm font-bold text-blue-600 dark:text-blue-400 transition-colors">+12% vs yest.</span>
          </div>
        </div>
        <div className="px-8 py-4 flex gap-6 border-b border-slate-50 dark:border-[#2b2d31] transition-colors">
           <div className="flex-1 bg-slate-50 dark:bg-[#1f2125] rounded-2xl p-4 transition-colors">
             <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1">Total Rides</p>
             <p className="text-2xl font-black text-slate-800 dark:text-gray-100 transition-colors">{stats.todayRides || 0}</p>
           </div>
           <div className="flex-1 bg-slate-50 dark:bg-[#1f2125] rounded-2xl p-4 transition-colors">
             <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1">Active Hours</p>
             <p className="text-2xl font-black text-slate-800 dark:text-gray-100 transition-colors">{onlineHours}h</p>
           </div>
        </div>
        
        <div className="p-8 flex-1">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold font-['Manrope'] text-slate-800 dark:text-gray-100">Recent Activity</h3>
            <button 
              onClick={() => navigate('/captain/history')}
              className="text-xs font-bold text-orange-600 hover:underline active:scale-95 transition-transform"
            >
              View All
            </button>
          </div>
          
          <div className="space-y-4">
            {recentRides.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6">
                <div className="w-12 h-12 bg-slate-100 dark:bg-[#2b2d31] rounded-full flex items-center justify-center text-slate-400 mb-3 transition-colors">
                  <i className="fa-solid fa-folder-open" />
                </div>
                <p className="text-sm font-bold text-slate-500 dark:text-gray-400">No recent rides</p>
              </div>
            ) : (
              recentRides.map((r, i) => {
                 // pick alternating icons/colors based on index for variety
                 const colors = [
                   { bg: 'bg-orange-100 dark:bg-orange-500/10', text: 'text-orange-500', icon: 'fa-location-arrow' },
                   { bg: 'bg-blue-100 dark:bg-blue-500/10', text: 'text-blue-500', icon: 'fa-location-dot' },
                   { bg: 'bg-green-100 dark:bg-green-500/10', text: 'text-green-500', icon: 'fa-map-pin' },
                   { bg: 'bg-purple-100 dark:bg-purple-500/10', text: 'text-purple-500', icon: 'fa-route' }
                 ];
                 const c = colors[i % colors.length];

                 return (
                   <div key={r._id} className="flex items-center gap-4 bg-white dark:bg-[#121214] transition-colors">
                     <div className={`w-10 h-10 rounded-xl ${c.bg} ${c.text} flex items-center justify-center shrink-0`}>
                       <i className={`fa-solid ${c.icon}`} />
                     </div>
                     <div className="flex-1 overflow-hidden pr-2">
                       <p className="text-sm font-bold text-slate-800 dark:text-gray-100 line-clamp-1">{r.destination}</p>
                       <p className="text-[10px] font-semibold text-slate-400">
                         {new Date(r.createdAt).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })} • {r.distance ? `${r.distance} km` : `${r.status}`}
                       </p>
                     </div>
                     <div className="text-right shrink-0">
                       <p className={`text-sm font-black ${r.status === 'completed' ? 'text-slate-900 dark:text-gray-100' : 'text-slate-400 dark:text-gray-500'}`}>
                         {r.status === 'completed' ? `₹${r.fare}` : '—'}
                       </p>
                       <p className="text-[10px] font-bold text-orange-500">
                         {r.captainRating ? `★ ${r.captainRating}` : ''}
                       </p>
                     </div>
                   </div>
                 )
              })
            )}
          </div>
        </div>
        <div className="p-6 mt-auto border-t border-slate-50 dark:border-[#2b2d31] transition-colors">
          <button className="w-full bg-[#2B2B2B] dark:bg-white dark:text-black text-white font-bold py-4 rounded-xl flex items-center justify-between px-6 hover:bg-black dark:hover:bg-gray-200 active:scale-95 transition-all">
             Weekly Payout Detail
             <i className="fa-solid fa-chevron-right text-slate-400 dark:text-gray-500" />
          </button>
        </div>
      </aside>

    </div>
  )
}

export default CaptainHome