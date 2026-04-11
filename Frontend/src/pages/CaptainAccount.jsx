import React, { useContext, useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router'
import axios from 'axios'
import { CaptainDataContext } from '../context/CapatainContext'

const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('captain_token')}` })

const vehicleLabel = (type) => {
  if (type === 'moto') return 'Motorcycle (Bike Taxi)'
  if (type === 'auto') return 'Auto Rickshaw'
  if (type === 'car') return 'Car (Mini Cab)'
  return type || 'Unknown'
}
const vehicleIcon = (type) => {
  if (type === 'moto') return 'fa-motorcycle'
  if (type === 'auto') return 'fa-van-shuttle'
  return 'fa-car-side'
}

const PERIOD_TABS = ['Today', 'Week', 'Month', 'All Time']

const CaptainAccount = () => {
  const navigate = useNavigate()
  const { captain } = useContext(CaptainDataContext)

  const [stats, setStats] = useState(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [allRides, setAllRides] = useState([])
  const [ridesLoading, setRidesLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('Today')

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, ridesRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_BASE_URL}/rides/stats`, {
          params: { userType: 'captain' }, headers: authHeader()
        }),
        axios.get(`${import.meta.env.VITE_BASE_URL}/rides/history`, {
          params: { userType: 'captain', limit: 50 }, headers: authHeader()
        })
      ])
      setStats(statsRes.data)
      setAllRides(ridesRes.data.rides || [])
    } catch (err) {
      console.warn('Stats fetch failed:', err.message)
    } finally {
      setStatsLoading(false)
      setRidesLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // Filter rides by period tab
  const filteredRides = (() => {
    const now = new Date()
    return allRides.filter((r) => {
      const d = new Date(r.createdAt)
      if (activeTab === 'Today') {
        return d.toDateString() === now.toDateString()
      } else if (activeTab === 'Week') {
        const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7)
        return d >= weekAgo
      } else if (activeTab === 'Month') {
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      }
      return true
    })
  })()

  const periodEarnings = filteredRides
    .filter(r => r.status === 'completed')
    .reduce((sum, r) => sum + (r.fare || 0), 0)

  const periodRides = filteredRides.filter(r => r.status === 'completed').length

  // Acceptance rate (rides offered vs accepted)
  const offeredRides = allRides.length
  const acceptedRides = allRides.filter(r => r.status !== 'cancelled').length
  const acceptanceRate = offeredRides > 0 ? Math.round((acceptedRides / offeredRides) * 100) : 100

  if (!captain) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#fff8f5]">
        <div className="w-6 h-6 border-2 border-orange-300 border-t-orange-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="bg-gray-100 min-h-screen flex justify-center font-['Inter']">
      <main className="w-full max-w-[390px] min-h-[100dvh] bg-[#fff8f5] flex flex-col overflow-y-auto">

        {/* ── Header ── */}
        <header className="relative bg-gradient-to-br from-[#1a0e05] to-[#3d1f00] px-6 pt-14 pb-8 flex-shrink-0 overflow-hidden">
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-orange-600/20 rounded-full blur-3xl pointer-events-none" />

          <button
            onClick={() => navigate(-1)}
            className="mb-5 w-10 h-10 bg-white/10 border border-white/20 rounded-full flex items-center justify-center text-white active:scale-90 transition-transform relative z-10"
          >
            <i className="fa-solid fa-arrow-left" />
          </button>

          <div className="flex items-center gap-4 relative z-10">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-xl text-white text-3xl">
              <i className="fa-solid fa-user" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-extrabold text-white font-['Manrope'] leading-tight">
                {captain.fullname?.firstname} {captain.fullname?.lastname}
              </h1>
              <p className="text-orange-200 text-sm mt-0.5">{captain.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="bg-orange-500/20 border border-orange-400/30 text-orange-300 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest">
                  Captain
                </span>
                <span className="text-orange-300 text-xs font-bold">
                  ★ {stats?.rating ? stats.rating : '—'}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* ── Quick KPI strip ── */}
        <section className="px-6 py-5">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 text-center">
              <p className="text-2xl font-black text-[#A85507]">{stats?.completedRides || 0}</p>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Total Trips</p>
            </div>
            <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 text-center">
              <p className="text-2xl font-black text-green-600">₹{stats?.totalSpent || 0}</p>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Lifetime</p>
            </div>
            <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 text-center">
              <p className="text-2xl font-black text-blue-600">{acceptanceRate}%</p>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Acceptance</p>
            </div>
          </div>
        </section>

        {/* ── Period Tabs + Earnings Ledger ── */}
        <section className="px-6 pb-6">
          <h2 className="text-lg font-bold text-gray-800 font-['Manrope'] mb-3">Earnings Ledger</h2>

          {/* Tab selector */}
          <div className="flex bg-gray-100 rounded-2xl p-1 mb-4">
            {PERIOD_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === tab
                    ? 'bg-white text-orange-600 shadow-sm'
                    : 'text-gray-500'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Period summary */}
          <div className="flex gap-3 mb-4">
            <div className="flex-1 bg-orange-50 border border-orange-100 rounded-2xl p-4 text-center">
              <p className="text-2xl font-black text-[#A85507]">₹{periodEarnings}</p>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Earned</p>
            </div>
            <div className="flex-1 bg-blue-50 border border-blue-100 rounded-2xl p-4 text-center">
              <p className="text-2xl font-black text-blue-600">{periodRides}</p>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Rides</p>
            </div>
          </div>

          {/* Per-trip ledger */}
          {ridesLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : filteredRides.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-gray-400">
              <i className="fa-regular fa-folder-open text-3xl mb-3" />
              <p className="text-sm font-semibold">No rides in this period</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRides.slice(0, 20).map((ride) => (
                <div key={ride._id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 pr-3">
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">
                        {ride.pickup?.split(',')[0]}
                      </p>
                      <p className="text-sm font-bold text-gray-800 line-clamp-1">{ride.destination}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-lg font-black ${ride.status === 'completed' ? 'text-green-600' : 'text-red-400'}`}>
                        {ride.status === 'completed' ? '+' : ''}₹{ride.fare}
                      </p>
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        ride.status === 'completed' ? 'bg-green-100 text-green-700' :
                        ride.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {ride.status}
                      </span>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400">
                    {new Date(ride.createdAt).toLocaleString('en-IN', {
                      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                    })}
                    {ride.captainRating && <span className="ml-2">· Rated: {ride.captainRating}★</span>}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Vehicle Details ── */}
        <section className="px-6 pb-6">
          <h2 className="text-lg font-bold text-gray-800 font-['Manrope'] mb-4">Your Vehicle</h2>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center">
                <i className={`fa-solid ${vehicleIcon(captain.vehicle?.vehicleType)} text-2xl text-orange-500`} />
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-base">{vehicleLabel(captain.vehicle?.vehicleType)}</h3>
                <p className="text-sm text-gray-500 capitalize">{captain.vehicle?.color}</p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-between">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">License Plate</p>
              <p className="text-base font-black text-gray-800 tracking-widest">{captain.vehicle?.plate?.toUpperCase()}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-between mt-2">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Capacity</p>
              <p className="text-base font-black text-gray-800">{captain.vehicle?.capacity} passenger{captain.vehicle?.capacity !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </section>

        {/* ── Actions ── */}
        <section className="px-6 pb-10 mt-auto">
          <button
            onClick={() => navigate('/captain-home')}
            className="w-full bg-gradient-to-r from-[#A85300] to-[#F5820D] py-4 rounded-2xl text-white font-bold text-base shadow-lg shadow-orange-100 active:scale-95 transition-all mb-3 flex items-center justify-center gap-3"
          >
            <i className="fa-solid fa-location-arrow" /> Back to Dashboard
          </button>
          <button
            onClick={() => navigate('/captain/logout')}
            className="w-full bg-red-50 border border-red-200 py-4 rounded-2xl text-red-600 font-bold text-base active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            <i className="fa-solid fa-right-from-bracket" /> Sign Out
          </button>
        </section>
      </main>
    </div>
  )
}

export default CaptainAccount
