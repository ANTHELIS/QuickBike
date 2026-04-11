import React, { useContext, useEffect, useState } from 'react'
import { SocketContext } from '../context/SocketContext'
import axios from 'axios'

const vehicleLabel = (type) => {
  if (type === 'moto') return 'Bike Taxi'
  if (type === 'auto') return 'Auto'
  if (type === 'car') return 'Mini Cab'
  return type || 'Vehicle'
}

const WaitingForDriver = ({ ride, setWaitingForDriver }) => {
  const captain = ride?.captain
  const otp = ride?.otp
  const { socket } = useContext(SocketContext)
  const [cancelling, setCancelling] = useState(false)

  // Listen for captain location updates (optional: for ETA or main map updates)
  useEffect(() => {
    if (!socket) return
    const handleCaptainLocation = (data) => {
    }
    socket.on('captain-location-update', handleCaptainLocation)
    return () => socket.off('captain-location-update', handleCaptainLocation)
  }, [socket])

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this ride?')) return
    setCancelling(true)
    try {
      await axios.post(`${import.meta.env.VITE_BASE_URL}/rides/${ride._id}/cancel`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('user_token')}` }
      })
      window.location.reload() // Cleanly reset whole flow
    } catch (err) {
      console.error(err)
      setCancelling(false)
    }
  }

  return (
    <div className="absolute inset-x-0 bottom-0 z-50 pointer-events-auto">
      <div className="bg-white rounded-t-[32px] px-6 pt-4 pb-6 shadow-[0_-10px_40px_rgba(0,0,0,0.15)] font-['Inter'] animate-slide-up border-t border-gray-100">
        
        {/* Grab Handle */}
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6 cursor-pointer" onClick={() => setWaitingForDriver(false)} />
        
        {/* Header & PIN */}
        <div className="flex justify-between items-center mb-6">
            <div>
                <h2 className="text-2xl font-extrabold text-gray-900 leading-tight">Arriving soon</h2>
                <p className="text-sm font-medium text-gray-500 mt-0.5">Meet your driver at the pickup point</p>
            </div>
            <div className="bg-orange-50 border border-orange-100 rounded-2xl px-4 py-2 text-center shadow-sm">
                <span className="block text-[10px] font-black tracking-widest text-[#E67E00] uppercase mb-0.5">Your PIN</span>
                <span className="block text-2xl font-black text-orange-600 tracking-[0.1em]">{otp || '---'}</span>
            </div>
        </div>

        {/* Driver Profile Row */}
        {captain ? (
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mb-6 relative overflow-hidden">
                <div className="flex items-center gap-4">
                    <div className="relative shrink-0">
                        <div className="w-14 h-14 rounded-full overflow-hidden bg-white border border-gray-200 shadow-sm flex justify-center items-center">
                            <i className="fa-solid fa-user text-2xl text-slate-400" />
                        </div>
                        <div className="absolute -bottom-1 -right-2 bg-gray-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1 border-2 border-white shadow-sm">
                            4.8 <i className="fa-solid fa-star text-[8px] text-yellow-400"></i>
                        </div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-gray-900 leading-none mb-1 truncate">
                            {captain?.fullname?.firstname} {captain?.fullname?.lastname}
                        </h3>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide truncate">
                            {captain?.vehicle?.color} {vehicleLabel(captain?.vehicle?.vehicleType)}
                        </p>
                    </div>
                    <div className="text-right shrink-0">
                        <div className="bg-white border-2 border-gray-200 rounded-lg px-2.5 py-1.5 shadow-sm">
                            <span className="block text-sm font-black text-gray-800 tracking-wider">
                                {captain?.vehicle?.plate}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        ) : (
            <div className="flex items-center justify-center py-6 bg-slate-50 rounded-2xl mb-6 border border-slate-100 shadow-inner">
                <div className="flex items-center gap-3 text-gray-500">
                <div className="w-5 h-5 border-2 border-orange-300 border-t-orange-500 rounded-full animate-spin" />
                <span className="text-sm font-semibold">Connecting to driver...</span>
                </div>
            </div>
        )}

        {/* Communication Actions */}
        <div className="flex gap-3 mb-4">
            <a href={`tel:${captain?.phone || ''}`} className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 font-bold py-3.5 rounded-2xl transition-colors flex items-center justify-center gap-2 active:scale-95 border border-green-100">
                <i className="fa-solid fa-phone" /> Call
            </a>
            <button className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 rounded-2xl transition-colors flex items-center justify-center gap-2 active:scale-95 border border-slate-200">
                <i className="fa-solid fa-message" /> Message
            </button>
        </div>

        {/* Safety & Cancel */}
        <div className="flex gap-3">
            <button className="flex-[2] bg-red-50 hover:bg-red-100 text-red-600 font-bold py-4 rounded-2xl transition-colors shrink-0 flex items-center justify-center gap-2 active:scale-95 border border-red-100">
                <i className="fa-solid fa-shield-halved" /> Safety Center
            </button>
            <button 
              className="flex-[1.2] bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-4 rounded-2xl transition-colors active:scale-95 text-sm uppercase tracking-wider border border-gray-200 disabled:opacity-50"
              onClick={handleCancel}
              disabled={cancelling}
            >
                {cancelling ? '...' : 'Cancel'}
            </button>
        </div>
      </div>
    </div>
  )
}

export default WaitingForDriver