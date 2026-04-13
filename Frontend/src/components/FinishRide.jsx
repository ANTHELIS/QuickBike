import React, { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router'

// Captain rates the passenger (1-5 stars) after ending the ride
const CaptainRatingPrompt = ({ ride, onDone }) => {
  const [rating, setRating] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    if (!rating || submitting) return
    setSubmitting(true)
    try {
      await axios.post(
        `${import.meta.env.VITE_BASE_URL}/rides/${ride._id}/rate`,
        { rating },
        { headers: { Authorization: `Bearer ${localStorage.getItem('captain_token')}` } }
      )
    } catch { /* fail silently */ }
    onDone()
  }

  return (
    <div className="bg-white rounded-t-[32px] p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.15)] font-['Inter'] border-t border-gray-100">
      <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
      <h2 className="text-xl font-extrabold text-gray-800 text-center mb-1">Rate your Passenger</h2>
      <p className="text-sm text-gray-400 text-center mb-6">
        {ride?.user?.fullname?.firstname} — how was the experience?
      </p>
      <div className="flex justify-center gap-3 mb-6">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            className={`text-4xl transition-transform active:scale-90 ${rating >= star ? 'scale-110' : 'opacity-30'}`}
            onClick={() => setRating(star)}
          >⭐</button>
        ))}
      </div>
      <button
        onClick={submit}
        disabled={!rating || submitting}
        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 py-4 rounded-2xl text-white font-bold text-base shadow-md disabled:opacity-50 active:scale-95 transition-all mb-2"
      >
        {submitting ? <i className="fa-solid fa-circle-notch fa-spin" /> : 'Submit Rating'}
      </button>
      <button onClick={onDone} className="w-full text-center text-sm text-gray-400 py-2">Skip</button>
    </div>
  )
}

const FinishRide = ({ ride, setFinishRidePanel }) => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [showRating, setShowRating] = useState(false)

  const endRide = async () => {
    setLoading(true)
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/rides/end-ride`,
        { rideId: ride._id },
        { headers: { Authorization: `Bearer ${localStorage.getItem('captain_token')}` } }
      )
      if (response.status === 200) {
        setShowRating(true) // show rating prompt before navigating
      }
    } catch (err) {
      console.warn('End ride failed:', err.message)
      setLoading(false)
    }
  }

  if (showRating) {
    return <CaptainRatingPrompt ride={ride} onDone={() => navigate('/captain-home')} />
  }

  return (
    <div className="bg-white rounded-t-[32px] p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.15)] font-['Inter'] animate-slide-up border-t border-gray-100 flex flex-col h-full relative overflow-hidden">

      <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-6 cursor-pointer" onClick={() => setFinishRidePanel(false)} />

      <h2 className="text-3xl font-black font-['Manrope'] text-slate-800 mb-6 flex items-center justify-between">
        Finish Trip
        <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex justify-center items-center text-xl">
          <i className="fa-solid fa-flag-checkered" />
        </div>
      </h2>

      <div className="bg-slate-50 rounded-2xl p-4 mb-4 border border-slate-100">
        <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-200">
          <div className="w-12 h-12 rounded-full bg-slate-200 flex justify-center items-center font-bold text-slate-500 text-xl shadow-sm border-2 border-white">
            <i className="fa-solid fa-user" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">{ride?.user?.fullname?.firstname}</h3>
            <span className="text-[10px] font-bold tracking-widest uppercase text-gray-400">Passenger Completed</span>
          </div>
          <div className="ml-auto text-right">
            <div className="text-3xl font-black text-green-600">₹{ride?.fare}</div>
            <span className="text-[10px] font-bold tracking-widest uppercase text-gray-400">
              {ride?.payment?.method === 'wallet' ? 'Wallet Paid' : 'Collect Cash'}
            </span>
          </div>
        </div>

        <div className="flex items-start gap-4 pb-2">
          <div className="flex flex-col items-center mt-1 shrink-0">
            <div className="w-3 h-3 rounded-full bg-slate-400" />
            <div className="w-[2px] h-6 bg-gray-300" />
            <svg fill="none" height="14" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="14">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
            </svg>
          </div>
          <div className="flex-1 text-slate-400">
            <div className="mb-2"><p className="text-sm font-semibold line-clamp-1">{ride?.pickup}</p></div>
            <div className="text-gray-800"><p className="text-sm font-bold line-clamp-1">{ride?.destination}</p></div>
          </div>
        </div>
      </div>

      <div className="mt-auto pb-4 flex flex-col gap-3">
        <p className="text-center text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
          {ride?.payment?.method === 'wallet' ? 'Fare settled from user wallet' : 'Collect fare before completing'}
        </p>
        <button
          className="w-full bg-gradient-to-r from-green-500 to-emerald-600 py-5 rounded-2xl flex items-center justify-center gap-3 text-white font-black text-xl shadow-lg shadow-emerald-200 active:scale-95 transition-all disabled:opacity-60"
          onClick={endRide}
          disabled={loading}
        >
          {loading
            ? <><i className="fa-solid fa-circle-notch fa-spin" /> Finishing...</>
            : <><i className="fa-solid fa-check" /> Complete Ride</>
          }
        </button>
      </div>
    </div>
  )
}

export default FinishRide