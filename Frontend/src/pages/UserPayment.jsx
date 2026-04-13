import React, { useContext } from 'react'
import { useNavigate } from 'react-router'
import { UserDataContext } from '../context/UserContext'

const UserPayment = () => {
  const navigate = useNavigate()
  const { user } = useContext(UserDataContext)

  return (
    <div className="bg-slate-100 min-h-screen flex justify-center font-['Inter']">
      <main className="w-full max-w-[390px] min-h-[100dvh] bg-slate-50 shadow-xl flex flex-col relative">

        {/* ── Header ── */}
        <header className="flex items-center gap-4 px-6 pt-12 pb-4 bg-white sticky top-0 z-10 shadow-sm">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-orange-50 -ml-2 transition-colors">
            <svg className="h-6 w-6 text-slate-800" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-xl font-black font-['Manrope'] text-slate-900">Payment Methods</h1>
        </header>

        {/* ── Body ── */}
        <div className="px-6 py-6 space-y-4">
          <button className="w-full flex items-center gap-4 bg-white border-2 border-orange-500 rounded-2xl p-4 text-left transition-all relative overflow-hidden shadow-sm">
            <div className="w-10 h-10 rounded-full bg-green-50 text-green-500 flex items-center justify-center shrink-0">
              <i className="fa-solid fa-money-bill-wave text-sm"></i>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-800 text-sm">Cash on Ride</p>
              <p className="text-xs text-slate-400 font-semibold truncate">Pay directly to the captain</p>
            </div>
            <div className="w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center">
              <i className="fa-solid fa-check text-[10px]"></i>
            </div>
          </button>

          <button className="w-full flex items-center gap-4 bg-white border-2 border-transparent hover:border-slate-200 rounded-2xl p-4 text-left transition-all shadow-sm">
            <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center shrink-0">
              <i className="fa-brands fa-google-pay text-sm"></i>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-800 text-sm">UPI Payments</p>
              <p className="text-xs text-slate-400 font-semibold truncate">GPay, PhonePe, Paytm</p>
            </div>
            <i className="fa-solid fa-lock text-slate-300 text-sm" title="Coming soon"></i>
          </button>

          <button className="w-full flex items-center gap-4 bg-white border-2 border-transparent hover:border-slate-200 rounded-2xl p-4 text-left transition-all shadow-sm">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
              <i className="fa-regular fa-credit-card text-sm"></i>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-800 text-sm">Credit / Debit Card</p>
              <p className="text-xs text-slate-400 font-semibold truncate">Visa, Mastercard, RuPay</p>
            </div>
            <i className="fa-solid fa-lock text-slate-300 text-sm" title="Coming soon"></i>
          </button>

          <button className="w-full flex items-center gap-4 bg-white border-2 border-transparent hover:border-slate-200 rounded-2xl p-4 text-left transition-all shadow-sm relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 z-10">
              <i className="fa-solid fa-wallet text-sm"></i>
            </div>
            <div className="flex-1 min-w-0 z-10">
              <p className="font-bold text-slate-800 text-sm">QuickBike Wallet</p>
              <p className="text-xs text-slate-400 font-semibold truncate">Available: ₹{user?.wallet?.balance || 0}</p>
            </div>
            <div className="z-10 bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-xs font-bold border border-orange-200">
              ACTIVE
            </div>
          </button>

          <div className="mt-8 bg-blue-50 rounded-2xl p-4 border border-blue-100 flex gap-3 text-blue-800 relative z-0">
            <i className="fa-solid fa-circle-info mt-0.5"></i>
            <p className="text-xs font-medium leading-relaxed">
              <strong>QuickBike Wallet</strong> is now active! You can select it as your payment method when booking a ride. If your balance is low, you can still select Cash.
            </p>
          </div>
        </div>

      </main>
    </div>
  )
}

export default UserPayment
