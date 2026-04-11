import React, { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router'

const ConfirmRidePopUp = ({ ride, setConfirmRidePopupPanel, setRidePopupPanel }) => {
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const submitHandler = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/rides/start-ride`, {
        params: { rideId: ride._id, otp },
        headers: { Authorization: `Bearer ${localStorage.getItem('captain_token')}` }
      })
      if (response.status === 200) {
        setConfirmRidePopupPanel(false)
        setRidePopupPanel(false)
        // Navigate with the fresh response data (captain + user populated)
        navigate('/captain-riding', { state: { ride: response.data } })
      }
    } catch (err) {
      console.error('Start ride failed:', err.response?.data)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-t-[32px] p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.15)] font-['Inter'] animate-slide-up border-t border-gray-100 flex flex-col h-[65vh]">
      
      <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-6 cursor-pointer" onClick={() => { setConfirmRidePopupPanel(false); setRidePopupPanel(false) }} />

      <h2 className="text-3xl font-bold font-['Manrope'] text-[#E67E00] mb-6 text-center">Confirm & Start</h2>

      <div className="bg-slate-50 rounded-2xl p-4 mb-2 border border-slate-100">
        <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-200">
          <div className="w-12 h-12 rounded-full bg-slate-200 flex justify-center items-center font-bold text-slate-500 text-xl border-2 border-white shadow-sm overflow-hidden">
            <i className="fa-solid fa-user"></i>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">{ride?.user?.fullname?.firstname}</h3>
            <span className="text-[10px] font-bold tracking-widest uppercase text-gray-400">Passenger Match</span>
          </div>
          <div className="ml-auto text-right">
            <div className="text-xl font-black text-[#A85507]">₹{ride?.fare}</div>
            <span className="text-[10px] font-bold tracking-widest uppercase text-gray-400">Fixed Fare</span>
          </div>
        </div>

        <div className="flex items-start gap-4 pb-2">
          <div className="flex flex-col items-center mt-1">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <div className="w-[2px] h-6 bg-gray-300"></div>
            <div className="w-4 h-4 flex items-center justify-center text-gray-800">
              <svg fill="none" height="14" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="14"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            </div>
          </div>
          <div className="flex-1">
            <div className="mb-2 text-left">
              <p className="text-sm font-bold text-gray-800 line-clamp-1">{ride?.pickup}</p>
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-gray-800 line-clamp-1">{ride?.destination}</p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={submitHandler} className="mt-auto pb-4">
        <div className="mb-6">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2 px-1 text-center">Passenger OTP Needed</label>
          <input
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            type="text"
            required
            className="w-full bg-gray-100 border-none rounded-2xl py-4 px-4 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#F5820D] text-center tracking-[0.4em] font-black text-2xl shadow-inner transition-all outline-none"
            placeholder="XXXXXX"
            maxLength={6}
          />
        </div>

        <div className="flex gap-3">
          <button 
            type="button" 
            className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 font-bold py-4 rounded-2xl transition-colors active:scale-95" 
            onClick={() => { setConfirmRidePopupPanel(false); setRidePopupPanel(false) }}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={loading || otp.length < 6}
            className="flex-[2] bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-emerald-200 active:scale-95 transition-all text-lg disabled:opacity-50" 
          >
            {loading ? <i className="fa-solid fa-circle-notch fa-spin"></i> : 'Start Ride'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ConfirmRidePopUp