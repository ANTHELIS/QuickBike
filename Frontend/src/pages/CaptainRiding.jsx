import React, { useState, useContext, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router'
import LiveTracking from '../components/LiveTracking'
import FinishRide from '../components/FinishRide'
import { SocketContext } from '../context/SocketContext'
import { CaptainDataContext } from '../context/CapatainContext'
import CaptainDesktopSidebar from '../components/CaptainDesktopSidebar'
import { useSiteConfig } from '../context/SiteConfigContext'

const CaptainRiding = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { getBanner } = useSiteConfig() // triggers CSS injection
  
  // Use state or local state
  const [ride, setRide] = useState(location.state?.ride || null)
  const [loadingInitial, setLoadingInitial] = useState(!location.state?.ride)
  const [finishRidePanel, setFinishRidePanel] = useState(false)
  const { socket } = useContext(SocketContext)
  const { captain } = useContext(CaptainDataContext)

  const [toast, setToast] = useState('')

  // If no ride in state, fetch current active ride (ongoing or accepted)
  useEffect(() => {
    if (ride) {
      setLoadingInitial(false)
      return
    }
    
    // Fetch active rides
    const fetchActiveRide = async () => {
      try {
        const token = localStorage.getItem('captain_token')
        // First check for ongoing rides
        const resOngoing = await axios.get(`${import.meta.env.VITE_BASE_URL}/rides/history?userType=captain&status=ongoing&limit=1`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        
        let activeData = Array.isArray(resOngoing.data) ? resOngoing.data : resOngoing.data?.data || []
        
        // If not ongoing, check for accepted (captain is on the way)
        if (activeData.length === 0) {
          const resAccepted = await axios.get(`${import.meta.env.VITE_BASE_URL}/rides/history?userType=captain&status=accepted&limit=1`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          activeData = Array.isArray(resAccepted.data) ? resAccepted.data : resAccepted.data?.data || []
        }

        if (activeData.length > 0) {
          setRide(activeData[0])
        } else {
          // You really don't have an active ride. Bounce back to dashboard.
          navigate('/captain-home', { replace: true })
        }
      } catch (err) {
        console.warn('Failed to fetch active ride:', err)
        navigate('/captain-home', { replace: true })
      } finally {
        setLoadingInitial(false)
      }
    }
    fetchActiveRide()
  }, [ride, navigate])

  // Keep sending location updates while riding and listen for cancellations
  useEffect(() => {
    if (!socket || !captain?._id || !ride) return

    const handleRideCancelled = (data) => {
      const reason = data?.reason || 'The passenger cancelled the ride.'
      setToast(reason)
      setTimeout(() => { navigate('/captain-home', { replace: true }) }, 2500)
    }
    socket.on('ride-cancelled', handleRideCancelled)

    const locationInterval = setInterval(() => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
          socket.emit('update-location-captain', {
            userId: captain._id,
            location: { ltd: pos.coords.latitude, lng: pos.coords.longitude }
          })
        })
      }
    }, 8000)

    return () => {
      clearInterval(locationInterval)
      socket.off('ride-cancelled', handleRideCancelled)
    }
  }, [socket, captain, navigate])

  const destination = ride?.destination || 'Destination'

  // Block rendering if we're restoring state from the backend
  if (loadingInitial) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F9F5F0]">
        <div className="w-6 h-6 border-2 border-orange-300 border-t-orange-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="bg-[#F9F5F0] dark:bg-[#0a0a0c] text-slate-900 dark:text-gray-100 min-h-screen font-['Inter'] flex flex-col md:flex-row overflow-hidden h-[100dvh] transition-colors">
      
      {/* ── Left Sidebar (Desktop Only) ── */}
      <CaptainDesktopSidebar />

      {/* ── Main Content Area ── */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top Header (Desktop) */}
        <header className="hidden md:flex h-20 bg-white dark:bg-[#161719] border-b border-slate-100 dark:border-[#2b2d31] shrink-0 items-center justify-between px-8 z-10 transition-colors">
          <div className="flex items-center gap-3">
             <span className="font-bold text-slate-800 dark:text-gray-100 transition-colors">Active Ride</span>
             <span className="text-slate-300 dark:text-slate-600 transition-colors">/</span>
             <span className="font-bold brand-text dark:text-orange-400 transition-colors">Trip #{ride?._id?.substring(0,6).toUpperCase() || '4829'}</span>
          </div>
          <div className="flex items-center gap-4">
             <button className="w-10 h-10 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"><i className="fa-solid fa-bell text-lg" /></button>
             <button className="w-10 h-10 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"><i className="fa-solid fa-circle-question text-lg" /></button>
             <button onClick={() => navigate('/captain/account')} className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 ml-2 overflow-hidden flex items-center justify-center text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"><i className="fa-solid fa-user-circle text-2xl" /></button>
          </div>
        </header>

        {/* Map & Ride Panel Split */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
          
          {/* Mobile Overlay Toast */}
          {toast && (
            <div className="absolute top-8 left-4 right-4 z-50 bg-red-600 text-white px-4 py-3 rounded-2xl shadow-lg text-sm font-bold text-center">
              {toast}
            </div>
          )}

          {/* Map Section */}
          <div className="relative flex-1 h-[65vh] md:h-auto z-0 overflow-hidden bg-slate-900 border-r border-slate-200">
             <LiveTracking pickup={ride?.pickup} destination={ride?.destination} liveRoute={true} />
             
             {/* Mobile Top Status Badge (hidden on desktop) */}
             <div className="md:hidden absolute top-0 left-0 right-0 z-10 flex items-center justify-center px-6 py-4 pt-12 pointer-events-none">
               <div className="flex bg-amber-500/90 backdrop-blur-md px-4 py-2 rounded-full shadow-md items-center gap-2 pointer-events-auto border-2 border-white/20">
                 <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                 <span className="font-extrabold text-sm text-white tracking-widest uppercase">Ride in Progress</span>
               </div>
             </div>
          </div>

          {/* Ride Details Panel - Desktop Right Sidebar / Mobile Bottom Sheet */}
          <div className={`
             absolute md:relative inset-x-0 bottom-0 md:inset-auto z-20 
             md:w-[450px] md:h-full bg-transparent md:bg-[#F3F4F6] text-black shrink-0 
             flex flex-col md:p-8 pt-0 transition-transform duration-300
             dark:md:bg-[#0a0a0c]
             ${finishRidePanel ? 'h-[65vh] md:h-full md:bg-[#F3F4F6] dark:md:bg-[#0a0a0c]' : 'h-[32vh] md:h-full'}
          `}>
             {!finishRidePanel ? (
               <div className="bg-white dark:bg-[#161719] rounded-t-[32px] md:rounded-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_-5px_30px_rgba(0,0,0,0.8)] md:shadow-xl w-full h-full overflow-y-auto flex flex-col flex-1 pb-6 md:pb-8 pt-6 md:p-8 animate-slide-up transition-colors border border-transparent dark:border-[#2b2d31]">
                 
                 {/* Mobile drag handle */}
                 <div 
                   className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6 md:hidden cursor-pointer" 
                   onClick={() => setFinishRidePanel(true)}
                 />

                 {/* Passenger Profile Strip */}
                 <div className="flex items-center justify-between mb-8 px-6 md:px-0 mt-2 md:mt-0">
                    <div className="flex items-center gap-4">
                       <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-[#1f2125] flex items-center justify-center relative shadow-sm border border-slate-50 dark:border-[#2b2d31] transition-colors">
                         <i className="fa-solid fa-user text-slate-400 dark:text-gray-500 text-xl" />
                         <div className="absolute -bottom-2 brand-bg text-white text-[9px] font-black px-1.5 py-0.5 rounded-md border-2 border-white dark:border-[#161719] transition-colors">
                            {ride?.user?.ratings?.average || '4.9'} ★
                         </div>
                       </div>
                       <div>
                         <h2 className="text-xl font-bold font-['Manrope'] text-slate-800 dark:text-gray-100 line-clamp-1 transition-colors">
                           {ride?.user?.fullname?.firstname || 'Passenger'} {ride?.user?.fullname?.lastname || ''}
                         </h2>
                         <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5 transition-colors">Premium+ Passenger</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <button className="w-10 h-10 bg-slate-50 dark:bg-[#1f2125] hover:bg-slate-100 dark:hover:bg-[#2b2d31] rounded-xl flex items-center justify-center text-slate-500 dark:text-gray-400 transition-colors">
                         <i className="fa-solid fa-comment" />
                       </button>
                       <button className="w-10 h-10 bg-slate-50 dark:bg-[#1f2125] hover:bg-slate-100 dark:hover:bg-[#2b2d31] rounded-xl flex items-center justify-center text-slate-500 dark:text-gray-400 transition-colors">
                         <i className="fa-solid fa-phone" />
                       </button>
                    </div>
                 </div>

                 {/* Route Nodes - desktop visible, or part of expanding panel */}
                 <div className="relative mb-8 px-6 md:px-0 flex-1">
                    <div className="absolute left-8 md:left-2 top-3 bottom-5 w-px border-l-2 border-dashed border-slate-200 dark:border-[#2b2d31] transition-colors" />
                    
                    <div className="flex items-start gap-4 mb-6 relative">
                       <div className="w-4 h-4 rounded-full brand-bg flex items-center justify-center shadow-[0_0_0_4px_white] dark:shadow-[0_0_0_4px_#161719] z-10 mt-1 shrink-0 transition-colors">
                         <div className="w-1.5 h-1.5 bg-white rounded-full" />
                       </div>
                       <div>
                         <p className="text-[10px] font-black tracking-widest text-slate-400 dark:text-gray-500 uppercase mb-1 transition-colors">Pickup Point</p>
                         <h3 className="text-base font-bold text-slate-800 dark:text-gray-100 leading-tight transition-colors">
                           {ride?.pickup?.split(',')[0]}
                         </h3>
                         <p className="text-xs font-semibold text-slate-500 dark:text-gray-400 mt-0.5 max-w-[200px] truncate transition-colors">
                           {ride?.pickup || 'Pickup location'}
                         </p>
                       </div>
                    </div>

                    <div className="flex items-start gap-4 relative">
                       <div className="w-4 h-4 rounded-full bg-slate-800 dark:bg-slate-200 flex items-center justify-center shadow-[0_0_0_4px_white] dark:shadow-[0_0_0_4px_#161719] z-10 mt-1 shrink-0 transition-colors">
                         <i className="fa-solid fa-flag-checkered text-[8px] text-white dark:text-[#1a1c1e]" />
                       </div>
                       <div>
                         <p className="text-[10px] font-black tracking-widest text-slate-400 dark:text-gray-500 uppercase mb-1 transition-colors">Dropoff Point</p>
                         <h3 className="text-base font-bold text-slate-800 dark:text-gray-100 leading-tight transition-colors">
                           {destination.split(',')[0]}
                         </h3>
                         <p className="text-xs font-semibold text-slate-500 dark:text-gray-400 mt-0.5 max-w-[200px] truncate transition-colors">
                           {destination}
                         </p>
                       </div>
                    </div>
                 </div>

                 {/* Estimates Row */}
                 <div className="hidden md:flex gap-4 mb-8">
                    <div className="flex-1 bg-slate-50/50 dark:bg-[#1f2125] border border-slate-100 dark:border-[#2b2d31] rounded-2xl p-4 flex flex-col justify-center transition-colors">
                       <p className="text-[9px] font-black tracking-widest text-slate-400 dark:text-gray-500 uppercase mb-1 transition-colors">Est. Distance</p>
                       <p className="text-xl font-bold font-['Manrope'] text-slate-800 dark:text-gray-100 transition-colors">{ride?.distance || '4.2'} <span className="text-sm font-semibold text-slate-500 dark:text-gray-400">km</span></p>
                    </div>
                    <div className="flex-1 bg-slate-50/50 dark:bg-[#1f2125] border border-slate-100 dark:border-[#2b2d31] rounded-2xl p-4 flex flex-col justify-center transition-colors">
                       <p className="text-[9px] font-black tracking-widest text-slate-400 dark:text-gray-500 uppercase mb-1 transition-colors">Est. Time</p>
                       <p className="text-xl font-bold font-['Manrope'] text-slate-800 dark:text-gray-100 transition-colors">{ride?.duration || '14'} <span className="text-sm font-semibold text-slate-500 dark:text-gray-400">mins</span></p>
                    </div>
                 </div>

                 {/* Fare & CTA */}
                 <div className="mt-auto px-6 md:px-0 text-black dark:text-gray-100">
                    <div className="hidden md:flex items-end justify-between mb-6">
                       <div>
                         <p className="text-[10px] font-black tracking-widest text-slate-400 dark:text-gray-500 uppercase mb-1 transition-colors">Estimated Fare</p>
                         <h2 className="text-3xl font-black font-['Manrope'] text-slate-900 dark:text-gray-100 tracking-tight transition-colors">₹{ride?.fare}</h2>
                       </div>
                       <div className="brand-surface brand-text px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors">
                         {ride?.payment?.method === 'wallet' ? 'Wallet payment' : 'Cash payment'}
                       </div>
                    </div>

                    <button
                      className="relative w-full bg-slate-900 hover:bg-black py-4 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-xl shadow-slate-900/20 active:scale-95 transition-all overflow-hidden"
                      onClick={() => setFinishRidePanel(true)}
                    >
                      <div className="absolute left-2 top-2 bottom-2 w-12 brand-bg rounded-xl flex items-center justify-center hidden md:flex">
                         <i className="fa-solid fa-chevron-right text-white" />
                      </div>
                      <span className="md:ml-[40px]">Complete Ride</span>
                    </button>

                    <p className="hidden md:block text-center mt-6 text-[10px] font-black tracking-widest text-slate-300 uppercase cursor-pointer hover:text-slate-400 transition-colors">
                      Emergency & Support
                    </p>
                 </div>

               </div>
             ) : (
                <div className="w-full h-full rounded-t-[32px] md:rounded-[32px] overflow-hidden md:shadow-2xl z-50">
                   <FinishRide ride={ride} setFinishRidePanel={setFinishRidePanel} />
                </div>
             )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CaptainRiding