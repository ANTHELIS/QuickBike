import React, { useEffect, useRef, useState } from 'react'

const ACCEPT_TIMEOUT = 30 // seconds

const RidePopUp = ({ ride, setRidePopupPanel, confirmRide }) => {
  const [secondsLeft, setSecondsLeft] = useState(ACCEPT_TIMEOUT)
  const [accepting, setAccepting] = useState(false)
  const timerRef = useRef(null)

  // 30-second countdown — auto-dismiss if captain doesn't respond
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          setRidePopupPanel(false) // auto-dismiss → ride goes back to pool
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [])

  const handleAccept = async () => {
    clearInterval(timerRef.current)
    setAccepting(true)
    await confirmRide()
    // confirmRide sets confirmRidePopupPanel — no need to navigate here
  }

  const pct = ((ACCEPT_TIMEOUT - secondsLeft) / ACCEPT_TIMEOUT) * 100
  const isUrgent = secondsLeft <= 10

  return (
    <div className="bg-white rounded-t-[32px] p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.15)] font-['Inter'] animate-slide-up border-t border-gray-100 relative overflow-hidden">

      {/* Decorative pulse background */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-4 cursor-pointer" onClick={() => setRidePopupPanel(false)} />

      {/* Timer bar */}
      <div className="mb-5">
        <div className="flex justify-between items-center mb-1.5">
          <h2 className="text-xl font-bold font-['Manrope'] text-gray-900 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
            New Ride!
          </h2>
          <span className={`text-sm font-black tabular-nums ${isUrgent ? 'text-red-500' : 'text-gray-500'}`}>
            {secondsLeft}s
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${isUrgent ? 'bg-red-500' : 'bg-orange-400'}`}
            style={{ width: `${100 - pct}%` }}
          />
        </div>
      </div>

      {/* Rider info + fare */}
      <div className="bg-slate-50 rounded-2xl p-4 mb-5 border border-slate-100 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-slate-200 flex justify-center items-center font-bold text-slate-500 text-lg border-2 border-white shadow-sm">
            <i className="fa-solid fa-user" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-800">{ride?.user?.fullname?.firstname}</h3>
            <span className="text-[10px] font-bold tracking-widest uppercase text-gray-400">Passenger</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black text-[#A85507]">₹{ride?.fare}</div>
          {ride?.surgeMultiplier > 1 && (
            <span className="text-[9px] font-bold text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded-full">
              {ride.surgeMultiplier}x Surge
            </span>
          )}
        </div>
      </div>

      {/* Route */}
      <div className="w-full space-y-1 mb-6">
        <div className="flex items-start gap-3">
          <div className="flex flex-col items-center mt-1.5 shrink-0">
            <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
            <div className="w-[2px] h-9 bg-gray-200" />
            <svg fill="none" height="12" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="12">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>
          <div className="flex-1">
            <div className="mb-3">
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Pick-up</p>
              <p className="text-sm font-bold text-gray-800 leading-tight line-clamp-1">{ride?.pickup}</p>
            </div>
            <div>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Drop-off</p>
              <p className="text-sm font-bold text-gray-800 leading-tight line-clamp-1">{ride?.destination}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-4 rounded-2xl transition-colors active:scale-95"
          onClick={() => { clearInterval(timerRef.current); setRidePopupPanel(false) }}
        >
          Decline
        </button>
        <button
          className="flex-[2] bg-gradient-to-r from-[#b35f00] to-[#eb8300] text-white font-bold py-4 rounded-2xl shadow-lg shadow-orange-200 active:scale-95 transition-all text-lg flex items-center justify-center gap-2 disabled:opacity-70"
          onClick={handleAccept}
          disabled={accepting}
        >
          {accepting ? <i className="fa-solid fa-circle-notch fa-spin" /> : <>Accept <i className="fa-solid fa-arrow-right" /></>}
        </button>
      </div>
    </div>
  )
}

export default RidePopUp