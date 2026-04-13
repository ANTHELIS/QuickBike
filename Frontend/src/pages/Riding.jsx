import React, { useContext, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import LiveTracking from '../components/LiveTracking'
import RatingScreen from '../components/RatingScreen'
import { SocketContext } from '../context/SocketContext'

const Riding = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const ride = location.state?.ride
  const { socket } = useContext(SocketContext)
  const [showRating, setShowRating] = useState(false)

  // Listen for captain ending the ride → show rating screen
  // Also handle ride-cancelled during an active ride
  useEffect(() => {
    if (!socket) return
    const handleRideEnded = () => {
      setShowRating(true) // intercept: show rating instead of immediately going home
    }
    const handleRideCancelled = () => {
      navigate('/home')
    }
    socket.on('ride-ended', handleRideEnded)
    socket.on('ride-cancelled', handleRideCancelled)
    return () => {
      socket.off('ride-ended', handleRideEnded)
      socket.off('ride-cancelled', handleRideCancelled)
    }
  }, [socket, navigate])

  const handleRatingDone = () => navigate('/home')

  // Show rating screen full-screen
  if (showRating) {
    return <RatingScreen ride={ride} onDone={handleRatingDone} />
  }

  return (
    <div className="bg-black text-slate-900 flex justify-center items-center min-h-screen font-['Inter']">
      <main className="relative w-full max-w-[390px] h-[100dvh] bg-slate-100 overflow-hidden shadow-2xl flex flex-col">

        {/* Map Background */}
        <div className="absolute inset-0 z-0">
          <LiveTracking pickup={ride?.pickup} destination={ride?.destination} liveRoute={true} />
        </div>
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/20 to-black/60 pointer-events-none" />

        {/* Top badge */}
        <header className="relative z-10 flex items-center justify-center px-6 py-4 pt-12 pointer-events-none">
          <div className="flex bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-md items-center gap-2 pointer-events-auto">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <svg width="18" height="18" viewBox="0 0 36 36" fill="none">
              <path d="M18 3L30 12V27L18 33L6 27V12L18 3Z" fill="#E67E00" />
              <path d="M18 10L24 14V22L18 26L12 22V14L18 10Z" fill="white" />
            </svg>
            <span className="font-bold text-sm text-gray-800">Trip Active</span>
          </div>
        </header>

        {/* Top ETA card */}
        <div className="absolute top-28 left-4 right-4 z-20 pointer-events-none">
          <div className="bg-white/95 backdrop-blur-md rounded-3xl p-5 shadow-lg flex justify-between items-center border border-white/50">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Heading to destination</h2>
              <p className="text-sm text-gray-500">Enjoy your ride safely</p>
            </div>
            <div className="w-10 h-10 bg-orange-100 rounded-full flex justify-center items-center text-orange-500">
              <i className="fa-solid fa-location-arrow" />
            </div>
          </div>
        </div>

        {/* Bottom Panel */}
        <div className="absolute bottom-0 w-full z-30 pointer-events-auto">
          <div className="bg-white rounded-[32px] p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.15)] rounded-b-none flex flex-col pt-8">

            <div className="flex justify-between items-end mb-6 border-b border-gray-100 pb-6">
              <div className="flex-1 pr-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Destination</p>
                <h3 className="text-xl font-bold text-gray-900 font-['Manrope'] line-clamp-2">
                  {ride?.destination || 'Your Drop-off Location'}
                </h3>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Fare</p>
                <div className="text-2xl font-black text-[#A85507]">₹{ride?.fare || '0'}</div>
              </div>
            </div>

            {/* Fare Breakdown (if available from new API) */}
            {ride?.fareBreakdown && (
              <div className="mb-5 bg-gray-50 rounded-2xl p-4 space-y-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Fare Breakdown</p>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Base fare</span><span>₹{ride.fareBreakdown.base}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Distance charge</span><span>₹{ride.fareBreakdown.distance}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Time charge</span><span>₹{ride.fareBreakdown.time}</span>
                </div>
                {ride.fareBreakdown.nightCharge > 0 && (
                  <div className="flex justify-between text-xs text-amber-600">
                    <span>Night charge</span><span>₹{ride.fareBreakdown.nightCharge}</span>
                  </div>
                )}
                {ride.fareBreakdown.surge > 0 && (
                  <div className="flex justify-between text-xs text-orange-600">
                    <span>Surge ({ride?.surgeMultiplier}x)</span><span>₹{ride.fareBreakdown.surge}</span>
                  </div>
                )}
                {ride.fareBreakdown.discount > 0 && (
                  <div className="flex justify-between text-xs text-green-600 font-semibold">
                    <span>Discount</span><span>-₹{ride.fareBreakdown.discount}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-gray-900 pt-1 border-t border-gray-200 mt-1">
                  <span>Total</span><span>₹{ride.fareBreakdown.total}</span>
                </div>
              </div>
            )}

            {ride?.captain && (
              <div className="flex items-center justify-between mb-6">
                <div className="flex gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex justify-center items-center shadow-sm">
                    <i className="fa-solid fa-user text-xl text-slate-400" />
                  </div>
                  <div className="flex flex-col justify-center">
                    <h3 className="text-base font-bold text-gray-800">{ride?.captain?.fullname?.firstname}</h3>
                    <p className="text-xs font-semibold text-gray-500 mt-0.5">
                      {ride?.captain?.vehicle?.plate?.toUpperCase()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <a href={`tel:${ride?.captain?.phone || ''}`}
                    className="w-10 h-10 rounded-full bg-gray-100 flex justify-center items-center text-gray-700 hover:bg-gray-200 transition-colors">
                    <i className="fa-solid fa-phone text-sm" />
                  </a>
                  <button
                    className="w-10 h-10 rounded-full bg-blue-50 flex justify-center items-center text-blue-500 hover:bg-blue-100 transition-colors"
                    onClick={() => {
                      const msg = `I'm riding with ${ride.captain?.fullname?.firstname} (${ride.captain?.vehicle?.plate}) on QuickBike. Heading to: ${ride.destination}`;
                      if (navigator.share) {
                        navigator.share({ title: 'My QuickBike Trip', text: msg });
                      } else {
                        navigator.clipboard?.writeText(msg);
                        alert('Trip details copied to clipboard!');
                      }
                    }}
                    title="Share trip details"
                  >
                    <i className="fa-solid fa-share-nodes text-sm" />
                  </button>
                </div>
              </div>
            )}

            {/* Manual home fallback button (ride-ended socket event is the primary trigger) */}
            <button
              className="w-full bg-gradient-to-r from-[#b35f00] to-[#eb8300] py-4 rounded-2xl flex items-center justify-center gap-3 text-white font-bold text-lg shadow-[0_4px_14px_0_rgba(235,131,0,0.39)] active:scale-[0.98] transition-all"
              onClick={() => navigate('/home')}
            >
              I've Paid — Back to Home
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Riding