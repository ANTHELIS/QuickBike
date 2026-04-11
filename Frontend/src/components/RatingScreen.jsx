import React, { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import axios from 'axios'
import { SocketContext } from '../context/SocketContext'

const EMOJIS = ['😊', '😃', '🌟', '✨', '🔥']

const RatingScreen = ({ ride, onDone }) => {
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const captain = ride?.captain

  const submitRating = async () => {
    if (!rating || submitting) return
    setSubmitting(true)
    try {
      await axios.post(
        `${import.meta.env.VITE_BASE_URL}/rides/${ride._id}/rate`,
        { rating, feedback },
        { headers: { Authorization: `Bearer ${localStorage.getItem('user_token')}` } }
      )
      setSubmitted(true)
      setTimeout(() => onDone(), 1500)
    } catch (err) {
      console.warn('Rating failed:', err.message)
      onDone() // still navigate away
    } finally {
      setSubmitting(false)
    }
  }

  const skipRating = () => onDone()

  const ratingLabels = ['', 'Terrible', 'Poor', 'Okay', 'Good', 'Excellent']

  return (
    <div className="fixed inset-0 z-[9999] bg-white flex flex-col justify-center items-center px-6 font-['Inter']">
      {submitted ? (
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-4xl">🎉</div>
          <h2 className="text-2xl font-extrabold text-gray-800 font-['Manrope']">Thanks!</h2>
          <p className="text-gray-500 text-sm">Your feedback helps improve the ride experience.</p>
        </div>
      ) : (
        <>
          {/* Captain info */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center text-4xl shadow-md mb-4">
              <i className="fa-solid fa-user text-3xl text-slate-400" />
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900 font-['Manrope']">
              {captain?.fullname?.firstname || 'Your Captain'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {captain?.vehicle?.color} {captain?.vehicle?.vehicleType?.toUpperCase()} · {captain?.vehicle?.plate}
            </p>
          </div>

          <h3 className="text-lg font-bold text-gray-700 mb-2">How was your ride?</h3>
          <p className="text-sm text-gray-400 mb-6">Rate your experience with {captain?.fullname?.firstname}</p>

          {/* Star selector */}
          <div className="flex gap-3 mb-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                className={`text-4xl transition-transform active:scale-90 ${
                  (hovered || rating) >= star ? 'scale-110' : 'opacity-30'
                }`}
                onMouseEnter={() => setHovered(star)}
                onMouseLeave={() => setHovered(0)}
                onTouchStart={() => setHovered(star)}
                onTouchEnd={() => setHovered(0)}
                onClick={() => setRating(star)}
              >
                ⭐
              </button>
            ))}
          </div>
          {(hovered || rating) > 0 && (
            <p className="text-base font-bold text-orange-500 mb-5 transition-all">
              {ratingLabels[hovered || rating]}
            </p>
          )}

          {/* Quick feedback chips */}
          {rating >= 4 && (
            <div className="flex flex-wrap gap-2 mb-4 justify-center">
              {['Great driving', 'Very punctual', 'Clean vehicle', 'Friendly'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => setFeedback(tag === feedback ? '' : tag)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                    feedback === tag
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'bg-white text-gray-600 border-gray-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
          {rating > 0 && rating < 4 && (
            <textarea
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm text-gray-700 resize-none mb-4 focus:ring-2 focus:ring-orange-300 outline-none"
              rows={2}
              placeholder="What went wrong? (optional)"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
          )}

          <button
            onClick={submitRating}
            disabled={!rating || submitting}
            className="w-full bg-gradient-to-r from-[#A85300] to-[#F5820D] py-4 rounded-2xl text-white font-bold text-base shadow-lg disabled:opacity-50 active:scale-95 transition-all mt-2 mb-3"
          >
            {submitting ? <i className="fa-solid fa-circle-notch fa-spin" /> : 'Submit Rating'}
          </button>
          <button onClick={skipRating} className="text-sm text-gray-400 hover:text-gray-600 font-medium">
            Skip for now
          </button>
        </>
      )}
    </div>
  )
}

export default RatingScreen
