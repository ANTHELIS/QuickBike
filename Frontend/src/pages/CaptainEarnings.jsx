import React, { useContext, useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { CaptainDataContext } from '../context/CapatainContext'
import CaptainDesktopSidebar from '../components/CaptainDesktopSidebar'
import { useTranslation } from 'react-i18next'
import { useSiteConfig } from '../context/SiteConfigContext'

const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('captain_token')}` })

const PERIOD_TABS = ['Today', 'Week', 'Month', 'All Time']

const CaptainEarnings = () => {
  const { captain } = useContext(CaptainDataContext)
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { getBanner } = useSiteConfig() // triggers CSS injection

  const [stats, setStats] = useState(null)
  const [allRides, setAllRides] = useState([])
  const [activeTab, setActiveTab] = useState('Week')
  const [mobileTab, setMobileTab] = useState('Week')
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, ridesRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_BASE_URL}/rides/stats`, {
          params: { userType: 'captain' }, headers: authHeader()
        }),
        axios.get(`${import.meta.env.VITE_BASE_URL}/rides/history`, {
          params: { userType: 'captain', limit: 100 }, headers: authHeader()
        })
      ])
      setStats(statsRes.data?.data || statsRes.data)
      const rawRides = ridesRes.data
      setAllRides(Array.isArray(rawRides) ? rawRides : rawRides?.data || rawRides?.rides || [])
    } catch (err) {
      console.warn('Stats fetch failed:', err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const filteredRides = (() => {
    const now = new Date()
    return allRides.filter((r) => {
      const d = new Date(r.createdAt)
      if (activeTab === 'Today') return d.toDateString() === now.toDateString()
      if (activeTab === 'Week') {
        const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7)
        return d >= weekAgo
      }
      if (activeTab === 'Month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      return true
    })
  })()

  const periodEarnings = filteredRides
    .filter(r => r.status === 'completed')
    .reduce((sum, r) => sum + (r.fare || 0), 0)

  const periodRides = filteredRides.filter(r => r.status === 'completed').length

  const offeredRides = allRides.length
  const acceptedRides = allRides.filter(r => r.status !== 'cancelled').length
  const acceptanceRate = offeredRides > 0 ? Math.round((acceptedRides / offeredRides) * 100) : 100

  if (!captain || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f2f2f4]">
        <div className="w-6 h-6 border-2 border-orange-300 border-t-orange-600 rounded-full animate-spin" />
      </div>
    )
  }

  // Pre-calculate distance if available, otherwise just mock a random string for design
  const getSubtext = (r) => {
    let dateStr = new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    let timeStr = new Date(r.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    let distStr = r.distance ? `${r.distance} km` : ''
    return distStr ? `${dateStr} • ${timeStr} • ${distStr}` : `${dateStr} • ${timeStr}`
  }

  return (
    <div className="text-slate-900 font-['Inter'] relative w-full max-w-full" style={{overflowX:'hidden'}}>

      {/* â”€â”€ DESKTOP LAYOUT â”€â”€ */}
      <div className="hidden md:flex bg-[#f2f2f4] dark:bg-[#0a0a0c] h-[100dvh] overflow-hidden flex-row transition-colors">
        <CaptainDesktopSidebar />
        <main className="flex-1 h-[100dvh] flex flex-col overflow-y-auto relative px-12 py-10">
          <div className="w-full max-w-6xl mx-auto flex flex-col hide-scrollbar relative">
            
            <header className="mb-8 pt-8 md:pt-0 px-6 md:px-0 relative">
              <h3 className="text-xs font-bold brand-text uppercase tracking-widest mb-1 z-10 relative">Performance Analytics</h3>
              <h1 className="text-4xl lg:text-5xl font-extrabold text-[#1a1c1e] dark:text-gray-100 font-['Manrope'] tracking-tight z-10 relative transition-colors">Earnings &amp; Growth</h1>
              <button className="absolute right-0 top-0 bg-[#e2e2e5] dark:bg-[#2b2d31] hover:bg-[#dadadc] dark:hover:bg-[#3f4147] text-[#1a1c1e] dark:text-gray-100 text-sm font-bold px-6 py-2.5 rounded-xl transition-all hidden sm:block z-10">
                Download Report
              </button>
            </header>

            <section className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8 px-6 md:px-0">
              <div className="bg-white dark:bg-[#161719] rounded-[32px] p-8 shadow-sm border border-transparent dark:border-[#2b2d31] flex flex-col justify-center md:col-span-6 lg:col-span-6 relative overflow-hidden group transition-colors">
                <div className="absolute right-0 top-0 w-64 h-64 bg-orange-50 dark:bg-orange-500/5 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-orange-100 dark:group-hover:bg-orange-500/10 transition-colors pointer-events-none" />
                <p className="text-sm font-bold text-gray-500 mb-2 relative z-10">Lifetime Earnings</p>
                <p className="text-5xl md:text-[64px] font-black text-[#904d00] dark:text-[#f8b671] tracking-tight relative z-10 leading-none transition-colors">
                  ₹{stats?.totalSpent?.toLocaleString() || 0}
                </p>
              </div>
              <div className="bg-white dark:bg-[#161719] rounded-[32px] p-8 shadow-sm border border-transparent dark:border-[#2b2d31] flex flex-col justify-center md:col-span-3 lg:col-span-3 relative group transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-sm font-bold text-gray-500">Total Trips</p>
                </div>
                <div className="absolute top-6 right-6 w-10 h-10 bg-orange-50 dark:bg-orange-500/20 rounded-full flex items-center justify-center text-[#e67e00] dark:text-orange-400 group-hover:scale-110 transition-all">
                   <i className="fa-solid fa-person-biking text-lg" />
                </div>
                <p className="text-4xl md:text-5xl font-black text-[#1a1c1e] dark:text-gray-100 mt-2 mb-1 transition-colors">{stats?.completedRides?.toLocaleString() || 0}</p>
              </div>
              <div className="brand-btn rounded-[32px] p-8 shadow-lg flex flex-col justify-center md:col-span-3 lg:col-span-3 relative overflow-hidden hover:shadow-orange-600/30 transition-shadow">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
                <div className="flex items-center justify-between mb-2 relative z-10">
                  <p className="text-sm font-bold text-[#4e2700]">Acceptance Rate</p>
                   <i className="fa-solid fa-certificate text-[#4e2700] text-xl absolute top-0 right-0" />
                </div>
                <p className="text-4xl md:text-5xl font-black text-[#1a1c1e] mt-4 mb-1 relative z-10">{acceptanceRate}%</p>
              </div>
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12 px-6 md:px-0">
              <div className="bg-white dark:bg-[#161719] border border-transparent dark:border-[#2b2d31] rounded-[32px] p-6 md:p-8 shadow-sm lg:col-span-2 flex flex-col h-[400px] transition-colors">
                 <div className="flex flex-col sm:flex-row sm:items-center justify-between xl:mr-2 mb-8 gap-4 sm:gap-0">
                    <h2 className="text-2xl font-bold text-[#1a1c1e] dark:text-gray-100 font-['Manrope'] transition-colors">Earnings Velocity</h2>
                    <div className="flex bg-[#f3f3f6] dark:bg-[#1f2125] rounded-xl p-1 w-full sm:w-auto transition-colors">
                       <button className="flex-1 sm:flex-none px-5 py-1.5 rounded-lg text-xs font-bold text-gray-500">Day</button>
                       <button className="flex-1 sm:flex-none px-5 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-[#2b2d31] text-[#904d00] dark:text-orange-400 shadow-sm transition-colors">Week</button>
                       <button className="flex-1 sm:flex-none px-5 py-1.5 rounded-lg text-xs font-bold text-gray-500">Month</button>
                    </div>
                 </div>
                 {(() => {
                    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
                    const today = new Date()
                    const weekBars = Array.from({ length: 7 }, (_, i) => {
                      const d = new Date(today); d.setDate(today.getDate() - (6 - i))
                      const isToday = d.toDateString() === today.toDateString()
                      const earned = allRides.filter(r => r.status === 'completed' && new Date(r.createdAt).toDateString() === d.toDateString()).reduce((s, r) => s + (r.fare || 0), 0)
                      return { label: days[d.getDay()], earned, isToday }
                    })
                    const maxEarned = Math.max(...weekBars.map(b => b.earned), 1)
                    return (
                      <div className="flex-1 flex items-end justify-between gap-2 sm:gap-4 md:gap-6 xl:gap-8 border-b-2 border-gray-50 dark:border-[#2b2d31] pb-4 relative mt-4 transition-colors">
                        <div className="absolute top-[30%] w-full border-b border-gray-100 dark:border-[#2b2d31] border-dashed transition-colors" />
                        {weekBars.map(({ label, earned, isToday }) => {
                          const pct = Math.max((earned / maxEarned) * 90, earned > 0 ? 12 : 5)
                          return (
                            <div key={label} className="flex flex-col items-center flex-1 h-full justify-end relative z-10 group cursor-pointer" title={`₹${earned.toFixed(0)}`}>
                              <div className="w-full flex-1 flex flex-col justify-end relative z-10">
                                <div 
                                  className={`w-full rounded-t-xl transition-all ${isToday ? 'bg-[#e67e00] shadow-xl shadow-orange-200/50 dark:shadow-orange-900/50' : (earned > 0 ? 'bg-[#dcc2af] dark:bg-[#522e0e]' : 'bg-[#f0f0f3] dark:bg-[#1f2125]')}`}
                                  style={{ height: `${pct}%` }} 
                                />
                              </div>
                              <p className={`text-[10px] sm:text-xs font-bold mt-3 uppercase transition-colors ${isToday ? 'text-[#904d00] dark:text-[#f8b671]' : 'text-gray-500'}`}>{label}</p>
                            </div>
                          )
                        })}
                      </div>
                    )
                 })()}
              </div>
              <div className="bg-[#e8e8ea] dark:bg-[#1a1c1e] border border-transparent dark:border-[#2b2d31] rounded-[32px] p-2 lg:col-span-1 flex flex-col h-[400px] gap-2 transition-colors">
                <div className="bg-white/70 dark:bg-[#1f2125]/80 rounded-[28px] p-5 md:p-6 flex flex-col flex-1 backdrop-blur shadow-sm border border-transparent dark:border-[#333] transition-colors">
                    <h2 className="text-xl font-bold text-[#1a1c1e] dark:text-gray-100 font-['Manrope'] mb-3 transition-colors">Earnings Ledger</h2>
                    <div className="flex bg-[#f3f3f6] dark:bg-[#161719] border border-transparent dark:border-[#2b2d31] rounded-[10px] p-1 mb-3 transition-colors">
                       {PERIOD_TABS.map((tab) => (
                          <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-1.5 rounded-[8px] text-[10px] font-bold transition-all ${activeTab === tab ? 'brand-btn text-white shadow-md' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-[#2b2d31]'}`}>{tab}</button>
                       ))}
                    </div>
                    <div className="bg-white dark:bg-[#161719] rounded-[20px] p-5 shadow-sm border border-transparent dark:border-[#2b2d31] flex-1 flex flex-col justify-center relative transition-colors">
                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Period Total</p>
                       <p className="text-3xl font-black text-[#1a1c1e] dark:text-gray-100 tracking-tight transition-colors">₹{periodEarnings?.toLocaleString() || 0}</p>
                       <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-50 dark:border-[#2b2d31] transition-colors">
                          <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 transition-colors">Rides Completed</p>
                          <p className="text-sm font-black text-[#1a1c1e] dark:text-gray-100 transition-colors">{periodRides}</p>
                       </div>
                    </div>
                </div>
                  <div className="h-[35%] bg-[#1a1c1e] dark:bg-[#121214] border border-transparent dark:border-[#2b2d31] rounded-[28px] flex items-center justify-center p-5 transition-colors">
                      <p className="text-sm font-bold text-gray-500 text-center">Map tracking is offline</p>
                  </div>
              </div>
            </section>

            <section className="px-6 md:px-0">
              <h2 className="text-2xl font-bold text-[#1a1c1e] dark:text-gray-100 font-['Manrope'] mb-6 transition-colors">Trip Breakdown</h2>
              <div className="space-y-4 max-w-4xl">
                {filteredRides.length === 0 && (
                  <div className="text-center py-10 bg-white/50 dark:bg-black/20 border border-transparent dark:border-[#2b2d31] rounded-3xl opacity-60 transition-colors"><p className="text-sm font-bold text-gray-500">No trips found for this period.</p></div>
                )}
                {filteredRides.map((r, i) => {
                   let rawName = r.pickup.split(',')[0].substring(0, 15)
                   rawName = rawName.charAt(0).toUpperCase() + rawName.slice(1)
                   let isCancel = r.status === 'cancelled'
                   return (
                    <div key={r._id || i} className="bg-transparent border border-transparent hover:bg-white dark:hover:bg-[#161719] hover:border-gray-100 dark:hover:border-[#2b2d31] rounded-[24px] p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between transition-colors duration-300 cursor-pointer group hover:shadow-sm">
                      <div className="flex items-center gap-4 md:gap-5">
                        <div className={`w-12 h-12 md:w-14 md:h-14 bg-white dark:bg-[#1f2125] group-hover:bg-gray-50 dark:group-hover:bg-[#2b2d31] border border-transparent dark:border-[#2b2d31] shadow-sm rounded-2xl flex items-center justify-center text-xl transition-colors ${isCancel ? 'text-gray-400 dark:text-gray-600' : 'text-[#904d00] dark:text-orange-400'}`}>
                          <i className={`fa-solid ${r.vehicleType === 'moto' ? 'fa-motorcycle' : r.vehicleType === 'auto' ? 'fa-van-shuttle' : 'fa-car-side'}`} />
                        </div>
                        <div>
                          <p className="text-base font-bold text-[#1a1c1e] dark:text-gray-100 tracking-tight truncate max-w-[200px] md:max-w-md transition-colors">{rawName || 'Ride'}</p>
                          <p className="text-[11px] md:text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium transition-colors">{getSubtext(r)}</p>
                        </div>
                      </div>
                      <div className="text-left pt-3 sm:pt-0 sm:text-right flex sm:block justify-between items-end border-t border-gray-200 dark:border-[#2b2d31] mt-3 sm:border-0 sm:mt-0 transition-colors">
                        <p className={`text-lg font-black transition-colors ${isCancel ? 'text-gray-400 dark:text-gray-600 line-through' : 'text-[#1a1c1e] dark:text-gray-100'}`}>₹{r.fare?.toFixed(2)}</p>
                        {r.status !== 'completed' && (
                          <p className="text-[10px] md:text-xs font-bold text-red-500 mt-0.5 sm:mt-1 capitalize">{r.status}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="h-16 w-full"></div>
            </section>

          </div>
        </main>
      </div>

      {/* â”€â”€ MOBILE LAYOUT â”€â”€ */}
      <main className="md:hidden w-full h-[100dvh] overflow-y-auto overflow-x-hidden bg-[#f5f5f7] dark:bg-[#0a0a0c] pb-24 hide-scrollbar transition-colors">

        {/* Mobile Header */}
        <header className="flex items-center justify-between px-5 pt-6 pb-3 sticky top-0 bg-[#f5f5f7]/90 dark:bg-[#0a0a0c]/90 backdrop-blur-md z-40 transition-colors">
          <div>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Overview</p>
            <h1 className="text-lg font-bold text-[#1a1c1e] dark:text-gray-100 font-['Manrope'] tracking-tight transition-colors">Earnings</h1>
          </div>
          <div className="brand-btn w-9 h-9 rounded-xl flex items-center justify-center shadow-sm">
            <i className="fa-solid fa-wallet text-white text-sm" />
          </div>
        </header>

        {/* Total Revenue Hero */}
        <div className="px-4 mb-4">
          <div className="bg-white dark:bg-[#161719] rounded-[24px] p-5 relative overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.04)] dark:shadow-none border border-transparent dark:border-[#2b2d31] transition-colors">
            <div className="absolute top-0 right-0 w-28 h-28 bg-orange-50 dark:bg-orange-500/10 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none transition-colors" />
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1 relative z-10">Total Revenue</p>
            <h2 className="text-4xl font-black text-[#904d00] tracking-tight relative z-10 leading-none mb-3">
              ₹{stats?.totalSpent?.toLocaleString() || 0}
            </h2>
            <div className="flex items-center justify-between relative z-10">
              <div className="bg-[#f5f5f7] dark:bg-[#1e1e1e] rounded-[14px] px-4 py-2.5 flex-1 mr-3 transition-colors">
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Total Trips</p>
                <p className="text-xl font-black text-[#1a1c1e] dark:text-gray-100 transition-colors">{stats?.completedRides?.toLocaleString() || 0}</p>
              </div>
              <div className="brand-btn w-12 h-12 rounded-full flex items-center justify-center shadow-md shrink-0">
                <i className="fa-solid fa-arrow-trend-up text-white text-base" />
              </div>
            </div>
          </div>
        </div>

        {/* Velocity Chart */}
        <div className="px-4 mb-4">
          <div className="bg-white dark:bg-[#161719] border border-transparent dark:border-[#2b2d31] transition-colors rounded-[24px] p-5 shadow-[0_2px_16px_rgba(0,0,0,0.04)] dark:shadow-none">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[#1a1c1e] dark:text-gray-100 font-['Manrope'] transition-colors">Velocity</h3>
              <div className="flex bg-[#f5f5f7] dark:bg-[#0a0a0c] rounded-lg p-0.5 transition-colors">
                {['Day','Week','Month'].map(t => (
                  <button key={t} onClick={() => setMobileTab(t)} className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${t === mobileTab ? 'bg-white dark:bg-[#1c1d21] brand-text shadow-sm' : 'text-gray-400 dark:text-gray-500'}`}>{t}</button>
                ))}
              </div>
            </div>

            {/* SVG-like area chart simulation */}
            {(() => {
              const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
              const today = new Date()
              const weekBars = Array.from({ length: 7 }, (_, i) => {
                const d = new Date(today); d.setDate(today.getDate() - (6 - i))
                const isToday = d.toDateString() === today.toDateString()
                let earned = 0
                if (mobileTab === 'Day') {
                  earned = allRides.filter(r => r.status === 'completed' && new Date(r.createdAt).toDateString() === today.toDateString()).reduce((s, r) => s + (r.fare || 0), 0)
                } else {
                  earned = allRides.filter(r => r.status === 'completed' && new Date(r.createdAt).toDateString() === d.toDateString()).reduce((s, r) => s + (r.fare || 0), 0)
                }
                return { label: days[d.getDay()], earned, isToday }
              })
              const maxEarned = Math.max(...weekBars.map(b => b.earned), 1)
              const peakDay = weekBars.reduce((a, b) => b.earned > a.earned ? b : a, weekBars[0])
              return (
                <div>
                  {peakDay.earned > 0 && (
                    <div className="inline-flex items-center gap-2 bg-white rounded-xl px-3 py-1.5 shadow-[0_2px_10px_rgba(0,0,0,0.08)] mb-3">
                      <div className="w-1.5 h-1.5 bg-[#e67e00] rounded-full" />
                      <div>
                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest leading-none">Peak Earnings</p>
                        <p className="text-[11px] font-black text-[#1a1c1e] leading-none mt-0.5">₹{peakDay.earned.toFixed(0)} <span className="text-gray-400 font-medium">{peakDay.label}</span></p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-end gap-1.5 h-24 border-b border-gray-100 pb-2">
                    {weekBars.map(({ label, earned, isToday }) => {
                      const pct = Math.max((earned / maxEarned) * 100, earned > 0 ? 15 : 6)
                      return (
                        <div key={label} className="flex flex-col items-center flex-1 h-full justify-end">
                          <div className="w-full flex-1 flex flex-col justify-end">
                            <div className="w-full rounded-t-lg transition-all" style={{ height: `${pct}%`, background: isToday ? '#e67e00' : earned > 0 ? '#fddcb5' : '#f0f0f3' }} />
                          </div>
                          <p className={`text-[8px] font-bold mt-1.5 ${isToday ? 'text-[#e67e00]' : 'text-gray-400'}`}>{label}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })()}
          </div>
        </div>

        {/* Recent Ledger */}
        <div className="px-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-[#1a1c1e] dark:text-gray-100 font-['Manrope'] transition-colors">Recent Ledger</h3>
            <button className="text-[#e67e00] text-xs font-bold">View All</button>
          </div>
          <div className="space-y-2.5">
            {(() => {
              const now = new Date()
              let mobileFilteredRides = allRides
              if (mobileTab === 'Day') {
                mobileFilteredRides = allRides.filter(r => new Date(r.createdAt).toDateString() === now.toDateString())
              } else if (mobileTab === 'Week') {
                const wa = new Date(now); wa.setDate(now.getDate() - 7)
                mobileFilteredRides = allRides.filter(r => new Date(r.createdAt) >= wa)
              } else if (mobileTab === 'Month') {
                mobileFilteredRides = allRides.filter(r => new Date(r.createdAt).getMonth() === now.getMonth())
              }
              return mobileFilteredRides.slice(0, 5).map((r, i) => {
              const isCancel = r.status === 'cancelled'
              let rawName = r.pickup.split(',')[0].substring(0, 16)
              rawName = rawName.charAt(0).toUpperCase() + rawName.slice(1)
              const timeStr = new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              const dateStr = new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              return (
                <div key={r._id || i} className="bg-white dark:bg-[#121214] border border-transparent dark:border-[#2b2d31] rounded-[18px] p-4 flex items-center gap-3 shadow-[0_1px_8px_rgba(0,0,0,0.03)] dark:shadow-none transition-colors">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${isCancel ? 'bg-gray-50 dark:bg-gray-800' : 'bg-orange-50 dark:bg-orange-500/10'} transition-colors`}>
                    <i className={`fa-solid ${r.vehicleType === 'moto' ? 'fa-motorcycle' : r.vehicleType === 'auto' ? 'fa-van-shuttle' : 'fa-car-side'} ${isCancel ? 'text-gray-400 dark:text-gray-500' : 'text-[#e67e00]'} transition-colors`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-[#1a1c1e] dark:text-gray-100 truncate transition-colors">{rawName || 'Local'} {i % 2 === 0 ? 'Express' : 'Drop'}</p>
                    <p className="text-[10px] text-gray-400 font-medium mt-0.5">{dateStr} • {timeStr}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-[15px] font-black ${isCancel ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-[#1a1c1e] dark:text-gray-100'} transition-colors`}>₹{r.fare?.toFixed(2)}</p>
                    <p className={`text-[8px] font-bold flex items-center justify-end gap-0.5 mt-0.5 ${isCancel ? 'text-red-500 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: isCancel ? '#ef4444' : '#10b981' }} />
                      {isCancel ? 'CANCELLED' : 'SETTLED'}
                    </p>
                  </div>
                </div>
              )
            })
            })()}
            {allRides.length === 0 && (
              <div className="text-center py-8 bg-white rounded-[18px]">
                <p className="text-xs font-bold text-gray-400">No trips for this period</p>
              </div>
            )}
          </div>
        </div>

        {/* Promo Banner */}
        <div className="px-4 mb-4">
          <div className="bg-[#1a1c1e] rounded-[20px] p-5 relative overflow-hidden cursor-pointer">
            <img src="https://images.unsplash.com/photo-1558981806-ec527fa84c39?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60" alt="Promo" className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-luminosity" />
            <div className="relative z-10">
              <p className="text-white text-lg font-black font-['Manrope'] leading-snug mb-3">Maximize your<br/>velocity this weekend.</p>
              <button className="flex items-center gap-2 brand-text text-xs font-bold uppercase tracking-widest">
                Learn More <i className="fa-solid fa-arrow-right text-[10px]" />
              </button>
            </div>
          </div>
        </div>

      </main>

      {/* â”€â”€ MOBILE BOTTOM NAV â”€â”€ */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-white dark:bg-[#161719] flex justify-around items-center pt-3 pb-5 z-[60] rounded-t-[20px] shadow-[0_-4px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.6)] border-t border-gray-50 dark:border-[#2b2d31] transition-colors">
        <div onClick={() => navigate('/captain-home')} className="flex flex-col items-center gap-1 cursor-pointer w-16 group">
          <i className="fa-solid fa-table-cells-large text-gray-400 group-active:text-[#e67e00] transition-colors text-lg" />
          <p className="text-[9px] font-bold text-gray-400 group-active:text-[#e67e00] transition-colors max-sm:text-[8px]">{t('account.navHome', 'Home')}</p>
        </div>
        <div onClick={() => navigate('/captain/history')} className="flex flex-col items-center gap-1 cursor-pointer w-16 group">
          <i className="fa-solid fa-clock-rotate-left text-gray-400 group-active:text-[#e67e00] transition-colors text-lg" />
          <p className="text-[9px] font-bold text-gray-400 group-active:text-[#e67e00] transition-colors max-sm:text-[8px]">{t('account.navHistory', 'History')}</p>
        </div>
        <div onClick={() => navigate('/captain/earnings')} className="flex flex-col items-center gap-1 cursor-pointer w-20">
          <div className="brand-btn px-4 py-1.5 rounded-full flex flex-col items-center justify-center transition-colors">
            <i className="fa-solid fa-wallet brand-text text-lg" />
          </div>
          <p className="text-[9px] font-bold brand-text max-sm:text-[8px] mt-0.5">{t('account.navEarnings', 'Earnings')}</p>
        </div>
        <div onClick={() => navigate('/captain/account')} className="flex flex-col items-center gap-1 cursor-pointer w-16 group">
          <i className="fa-solid fa-user text-gray-400 group-active:text-[#e67e00] transition-colors text-lg" />
          <p className="text-[9px] font-bold text-gray-400 group-active:text-[#e67e00] transition-colors max-sm:text-[8px]">{t('account.navAccount', 'Account')}</p>
        </div>
      </div>

    </div>
  )
}

export default CaptainEarnings


