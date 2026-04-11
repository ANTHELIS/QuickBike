import React, { useEffect, useRef, useState } from 'react'
import axios from 'axios'

const TIMEOUT_SECONDS = 90

const LookingForDriver = ({ pickup, destination, fare, vehicleType, ride, setVehicleFound, setRide }) => {
  const [secondsLeft, setSecondsLeft] = useState(TIMEOUT_SECONDS)
  const [cancelling, setCancelling] = useState(false)
  const intervalRef = useRef(null)

  // Countdown timer — auto-cancel after TIMEOUT_SECONDS
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current)
          handleCancel(true) // auto-cancel
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [])

  const handleCancel = async (isTimeout = false) => {
    if (cancelling) return
    setCancelling(true)
    clearInterval(intervalRef.current)

    try {
      if (ride?._id) {
        await axios.post(`${import.meta.env.VITE_BASE_URL}/rides/${ride._id}/cancel`, {}, {
          headers: { Authorization: `Bearer ${localStorage.getItem('user_token')}` }
        })
      }
    } catch { /* silent */ } finally {
      setRide && setRide(null)
      setVehicleFound(false)
    }
  }

  const pct = ((TIMEOUT_SECONDS - secondsLeft) / TIMEOUT_SECONDS) * 100

  return (
    <div className="absolute inset-x-0 bottom-0 z-50 pointer-events-auto bg-white rounded-t-[32px] p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.15)] font-['Inter'] animate-slide-up">
      
      <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-6" />
      
      <div className="flex flex-col items-center justify-center py-4">
        {/* Animated radar */}
        <div className="relative flex justify-center items-center w-24 h-24 mb-5">
          <div className="absolute inset-0 bg-orange-500 rounded-full opacity-20 animate-ping" style={{ animationDuration: '2s' }} />
          <div className="absolute inset-2 bg-orange-500 rounded-full opacity-30 animate-pulse" />
          <div className="relative z-10 w-16 h-16 bg-gradient-to-r from-[#b35f00] to-[#eb8300] rounded-full flex justify-center items-center shadow-lg text-white text-2xl">
            <i className="fa-solid fa-satellite-dish" />
          </div>
        </div>

        <h2 className="text-2xl font-bold font-['Manrope'] text-gray-900 mb-1">Finding your ride...</h2>
        <p className="text-sm text-gray-500 mb-5">Connecting with the nearest captain</p>

        {/* Countdown bar */}
        <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 font-medium mb-6">{secondsLeft}s remaining</p>

        {/* Route */}
        <div className="w-full space-y-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <div className="w-[2px] h-10 bg-gray-300" />
              <div className="w-4 h-4 flex items-center justify-center text-gray-800">
                <svg fill="none" height="14" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="14">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <div className="mb-4 text-left">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pick-up</p>
                <p className="text-sm font-bold text-gray-800 line-clamp-1">{pickup}</p>
              </div>
              <div className="text-left">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Drop-off</p>
                <p className="text-sm font-bold text-gray-800 line-clamp-1">{destination}</p>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => handleCancel(false)}
          disabled={cancelling}
          className="w-full bg-red-50 border border-red-200 text-red-600 font-bold py-4 rounded-2xl active:scale-95 transition-all disabled:opacity-50"
        >
          {cancelling ? 'Cancelling...' : 'Cancel Ride'}
        </button>
      </div>
    </div>
  )
}

export default LookingForDriver