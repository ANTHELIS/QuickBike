import React, { useState } from 'react'
import axios from 'axios'

const vehicles = [
  {
    type: 'moto',
    name: 'Bike Taxi',
    desc: 'Fastest in traffic · 1 seat',
    capacity: 1,
    recommended: true,
    icon: (
      <svg fill="none" height="32" stroke="#f97316" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="32">
        <circle cx="5.5" cy="17.5" r="3.5" />
        <circle cx="18.5" cy="17.5" r="3.5" />
        <path d="M15 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm-1.2 1.3L12.8 12h-2.4l1.1-4.7c.3-1.3 1.5-2.2 2.8-2.2h1.7c.6 0 1.1.5 1.1 1.1v2.1" />
      </svg>
    ),
  },
  {
    type: 'auto',
    name: 'Quick Auto',
    desc: 'Comfortable · up to 3 passengers',
    capacity: 3,
    icon: (
      <svg fill="none" height="32" stroke="#6b7280" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="32">
        <rect height="11" rx="2" ry="2" width="18" x="3" y="10" />
        <path d="M7 10V7a5 5 0 0 1 10 0v3" />
        <path d="M12 14v3" />
      </svg>
    ),
  },
  {
    type: 'car',
    name: 'Mini Cab',
    desc: 'Comfort & A/C · up to 4 passengers',
    capacity: 4,
    icon: (
      <svg fill="none" height="32" stroke="#6b7280" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="32">
        <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A2 2 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
        <circle cx="7" cy="17" r="2" />
        <circle cx="17" cy="17" r="2" />
      </svg>
    ),
  },
]

const VehiclePanel = ({ pickup, destination, fare, vehicleType, selectVehicle, setVehiclePanel, createRide, walletBalance = 0 }) => {
  const [promoCode, setPromoCode] = useState('')
  const [promoResult, setPromoResult] = useState(null)
  const [promoLoading, setPromoLoading] = useState(false)
  const [promoError, setPromoError] = useState('')
  const [showPromo, setShowPromo] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('cash')

  const selectedFare = promoResult ? promoResult.finalFare : (fare[vehicleType] || 0)
  const isSurge = fare?.isSurge
  const surgeMultiplier = fare?.surgeMultiplier

  const applyPromo = async () => {
    if (!promoCode.trim()) return
    setPromoLoading(true)
    setPromoError('')
    setPromoResult(null)
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/rides/promo/${promoCode.trim()}?fare=${fare[vehicleType]}&vehicleType=${vehicleType}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('user_token')}` } }
      )
      // Handle both old format and new envelope format ({ data: {...} })
      const result = res.data?.data || res.data
      setPromoResult(result)
    } catch (err) {
      setPromoError(err.response?.data?.message || 'Invalid promo code')
    } finally {
      setPromoLoading(false)
    }
  }

  const removePromo = () => {
    setPromoResult(null)
    setPromoCode('')
    setPromoError('')
  }

  return (
    <div className="absolute inset-0 bg-gray-100 z-[100] flex flex-col font-['Inter'] h-[100dvh]">

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 pt-12 bg-white border-b border-gray-50 flex-shrink-0">
        <div className="flex items-center gap-4">
          <button aria-label="Back" className="p-1" onClick={() => setVehiclePanel(false)}>
            <svg fill="none" height="24" stroke="#f97316" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="24">
              <line x1="19" x2="5" y1="12" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
          <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">Select Ride</h1>
        </div>
        {/* Surge badge in header */}
        {isSurge && (
          <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-full">
            <span className="text-orange-500 text-xs">⚡</span>
            <span className="text-xs font-black text-orange-600">{surgeMultiplier}x Surge</span>
          </div>
        )}
      </header>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto pb-52">

        {/* Surge warning banner */}
        {isSurge && (
          <div className="mx-6 mt-4 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
            <span className="text-xl shrink-0">⚡</span>
            <div>
              <p className="text-sm font-bold text-amber-800">High Demand · {surgeMultiplier}x Surge</p>
              <p className="text-xs text-amber-600 mt-0.5">More captains are being brought online to reduce wait times. Wait a few minutes for normal pricing.</p>
            </div>
          </div>
        )}

        {/* Route Info */}
        <section className="px-6 py-5 bg-gray-50/50">
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <div className="w-[2px] h-10 bg-gray-300" />
              <div className="w-4 h-4 flex items-center justify-center text-gray-800">
                <svg fill="none" height="14" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="14">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <div className="mb-3 text-left">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pick-up</p>
                <p className="text-sm font-bold text-gray-800 line-clamp-1">{pickup}</p>
              </div>
              <div className="text-left">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Drop-off</p>
                <p className="text-sm font-bold text-gray-800 line-clamp-1">{destination}</p>
              </div>
            </div>
            {/* Distance / ETA from API */}
            {fare?.distanceText && (
              <div className="text-right shrink-0">
                <p className="text-xs font-bold text-gray-800">{fare.distanceText}</p>
                <p className="text-[10px] text-gray-400">{fare.durationText}</p>
              </div>
            )}
          </div>
        </section>

        {/* Ride Options */}
        <section className="px-6 py-4">
          <h2 className="text-xl font-bold font-['Manrope'] text-gray-900 mb-4 text-left">Choose your ride</h2>
          <div className="space-y-3">
            {vehicles.map((v) => {
              const isSelected = vehicleType === v.type
              const displayFare = isSurge ? fare[v.type] : fare[v.type]
              return (
                <div
                  key={v.type}
                  className={`bg-white rounded-2xl p-4 flex items-center gap-4 cursor-pointer transition-all ${
                    isSelected
                      ? 'shadow-[0_4px_14px_0_rgba(235,131,0,0.15)] border border-orange-100 border-l-[4px] border-l-orange-500'
                      : 'shadow-sm border border-gray-100 opacity-70 hover:opacity-100'
                  }`}
                  onClick={() => { selectVehicle(v.type); removePromo() }}
                >
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center ${isSelected ? 'bg-orange-100' : 'bg-gray-100'}`}>
                    {React.cloneElement(v.icon, { stroke: isSelected ? '#f97316' : '#6b7280' })}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-base text-gray-800 flex items-center gap-2">
                          {v.name}
                          {v.recommended && isSelected && (
                            <span className="text-[9px] bg-orange-500 text-white px-1.5 py-0.5 rounded font-black uppercase tracking-tight">Best</span>
                          )}
                        </h3>
                        <p className="text-xs text-gray-500">{v.desc}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-xl text-gray-900">₹{displayFare}</p>
                        {isSurge && isSelected && (
                          <span className="text-[9px] text-orange-400 font-bold">{surgeMultiplier}x surge</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Promo Code Section */}
          <div className="mt-5">
            {!showPromo ? (
              <button
                onClick={() => setShowPromo(true)}
                className="w-full flex items-center gap-2 text-left px-4 py-3 bg-white rounded-2xl border border-dashed border-orange-300 text-orange-600 font-semibold text-sm hover:bg-orange-50 transition-colors"
              >
                <i className="fa-solid fa-tag" />
                Have a promo code?
              </button>
            ) : promoResult ? (
              <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <i className="fa-solid fa-circle-check text-green-500" />
                  <div>
                    <p className="text-sm font-bold text-green-800">{promoResult.code} applied!</p>
                    <p className="text-xs text-green-600">You save ₹{promoResult.discount}</p>
                  </div>
                </div>
                <button onClick={removePromo} className="text-gray-400 hover:text-red-500 transition-colors">
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter promo code (e.g. FIRST50)"
                    className="flex-1 bg-white border border-gray-200 rounded-2xl px-4 py-3 text-sm font-bold uppercase tracking-widest outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
                    value={promoCode}
                    onChange={(e) => { setPromoCode(e.target.value); setPromoError('') }}
                    onKeyDown={(e) => e.key === 'Enter' && applyPromo()}
                  />
                  <button
                    onClick={applyPromo}
                    disabled={promoLoading}
                    className="bg-orange-500 text-white px-5 py-3 rounded-2xl font-bold text-sm active:scale-95 transition-transform disabled:opacity-60"
                  >
                    {promoLoading ? <i className="fa-solid fa-circle-notch fa-spin" /> : 'Apply'}
                  </button>
                </div>
                {promoError && <p className="text-xs text-red-500 font-semibold pl-2">{promoError}</p>}
                <p className="text-[10px] text-gray-400 pl-2">Try: FIRST50, QUICK20, RAPIDO30</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-0 left-0 right-0 bg-white p-6 border-t border-gray-100 rounded-t-3xl shadow-[0_-8px_30px_rgb(0,0,0,0.04)]">
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={() => setPaymentMethod(prev => prev === 'cash' ? 'wallet' : 'cash')}
            className="flex items-center gap-3 p-2 -ml-2 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${paymentMethod === 'wallet' ? 'bg-orange-100' : 'bg-gray-100'}`}>
              <i className={`fa-solid ${paymentMethod === 'wallet' ? 'fa-wallet text-orange-600' : 'fa-money-bill-wave text-gray-600'}`} />
            </div>
            <div className="text-left">
              <p className="text-[9px] font-bold text-gray-400 border-b border-dashed border-gray-300 pb-[1px] uppercase tracking-widest inline-flex items-center gap-1">
                Payment <i className="fa-solid fa-chevron-down text-[8px]" />
              </p>
              <p className="text-sm font-bold text-gray-800 capitalize">{paymentMethod === 'wallet' ? `Wallet (₹${walletBalance})` : 'Cash'}</p>
            </div>
          </button>
          
          <div className="text-right">
            <p className="text-[9px] font-bold text-gray-400 capitalize inline-block mr-2" style={{color: paymentMethod === 'wallet' && walletBalance < selectedFare ? 'red' : undefined}}>
              {paymentMethod === 'wallet' && walletBalance < selectedFare ? 'Insufficient wallet balance' : ''}
            </p>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">You Pay</p>
            <div className="flex items-baseline gap-1">
              {promoResult && (
                <span className="text-sm line-through text-gray-400">₹{fare[vehicleType]}</span>
              )}
              <span className="text-xl font-black text-gray-900">₹{selectedFare}</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => createRide(promoResult?.code, paymentMethod)}
          disabled={paymentMethod === 'wallet' && walletBalance < selectedFare}
          className="w-full bg-gradient-to-r from-[#b35f00] to-[#eb8300] py-4 rounded-2xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-[0_4px_14px_0_rgba(235,131,0,0.39)] disabled:opacity-50 disabled:active:scale-100"
        >
          <span className="text-white font-bold text-lg">Confirm {vehicles.find(v => v.type === vehicleType)?.name}</span>
          <svg fill="none" height="20" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="20">
            <line x1="5" x2="19" y1="12" y2="12" /><polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </footer>
    </div>
  )
}

export default VehiclePanel