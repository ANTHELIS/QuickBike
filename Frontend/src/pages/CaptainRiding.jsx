import React, { useState, useContext, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router'
import LiveTracking from '../components/LiveTracking'
import FinishRide from '../components/FinishRide'
import { SocketContext } from '../context/SocketContext'
import { CaptainDataContext } from '../context/CapatainContext'

const CaptainRiding = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const ride = location.state?.ride
  const [finishRidePanel, setFinishRidePanel] = useState(false)
  const { socket } = useContext(SocketContext)
  const { captain } = useContext(CaptainDataContext)

  // Keep sending location updates while riding and listen for cancellations
  useEffect(() => {
    if (!socket || !captain?._id) return

    const handleRideCancelled = () => {
      alert('The passenger cancelled the ride.')
      navigate('/captain-home')
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

  return (
    <div className="bg-black text-slate-900 flex justify-center items-center min-h-screen font-['Inter']">
      <main className="relative w-full max-w-[390px] h-[100dvh] bg-slate-100 overflow-hidden shadow-2xl flex flex-col">
        
        {/* Map Background */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <LiveTracking pickup={ride?.pickup} destination={ride?.destination} />
        </div>
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />

        {/* Top Status Badge */}
        <header className="relative z-10 flex items-center justify-center px-6 py-4 pt-12 pointer-events-none">
          <div className="flex bg-amber-500/90 backdrop-blur-md px-4 py-2 rounded-full shadow-md items-center gap-2 pointer-events-auto border-2 border-white/20">
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span className="font-extrabold text-sm text-white tracking-widest uppercase">Ride in Progress</span>
          </div>
        </header>

        {/* Passenger info floating card */}
        <div className="absolute top-28 left-4 right-4 z-20">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-lg border border-white/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-200 flex justify-center items-center">
                <i className="fa-solid fa-user text-slate-500 text-sm" />
              </div>
              <div>
                <p className="font-bold text-gray-800 text-sm">
                  {ride?.user?.fullname?.firstname} {ride?.user?.fullname?.lastname}
                </p>
                <p className="text-xs text-gray-500">Passenger</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-black text-[#A85507]">₹{ride?.fare}</div>
              <p className="text-[10px] text-gray-400 uppercase font-bold">Cash</p>
            </div>
          </div>
        </div>

        {/* Bottom panel */}
        {!finishRidePanel ? (
          <div className="absolute bottom-0 w-full z-30 pointer-events-auto h-[32vh]">
            <div className="bg-white rounded-[32px] p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.15)] rounded-b-none h-full flex flex-col pt-8 animate-slide-up">
              
              <div
                className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-5 cursor-pointer"
                onClick={() => setFinishRidePanel(true)}
              />

              <div className="flex justify-between items-end mb-4 border-b border-gray-100 pb-4">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Drop-off Point</p>
                  <h3 className="text-lg font-bold text-gray-900 line-clamp-1">{destination}</h3>
                </div>
              </div>

              <button
                className="w-full bg-slate-900 hover:bg-black py-4 rounded-2xl flex items-center justify-center gap-3 text-white font-bold text-lg shadow-lg active:scale-95 transition-all mt-auto"
                onClick={() => setFinishRidePanel(true)}
              >
                Complete Ride
                <i className="fa-solid fa-flag-checkered text-amber-400" />
              </button>
            </div>
          </div>
        ) : (
          <div className="absolute inset-x-0 bottom-0 z-50 h-[65vh]">
            <FinishRide ride={ride} setFinishRidePanel={setFinishRidePanel} />
          </div>
        )}
      </main>
    </div>
  )
}

export default CaptainRiding