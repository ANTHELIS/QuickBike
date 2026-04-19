import React, { useContext, useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { CaptainDataContext } from '../context/CapatainContext'
import CaptainDesktopSidebar from '../components/CaptainDesktopSidebar'
import { useTranslation } from 'react-i18next'

const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('captain_token')}` })

const vehicleIcon = (type) => {
  if (type === 'moto') return 'fa-motorcycle'
  if (type === 'auto') return 'fa-van-shuttle'
  return 'fa-car-side'
}

const CaptainHistory = () => {
  const { captain } = useContext(CaptainDataContext)
  const navigate = useNavigate()
  const { t } = useTranslation()

  const [allRides, setAllRides] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const ridesRes = await axios.get(`${import.meta.env.VITE_BASE_URL}/rides/history`, {
        params: { userType: 'captain', limit: 100 }, headers: authHeader()
      })
      const rawRides = ridesRes.data
      setAllRides(Array.isArray(rawRides) ? rawRides : (rawRides?.data || rawRides?.rides || []))
    } catch (err) {
      console.warn('History fetch failed:', err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  if (!captain || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f2f2f4]">
        <div className="w-6 h-6 border-2 border-orange-300 border-t-orange-600 rounded-full animate-spin" />
      </div>
    )
  }

  const formatGroupHeader = (dateStr) => {
    const d = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)
    const options = { month: 'short', day: 'numeric', year: 'numeric' }
    const formatted = d.toLocaleDateString('en-US', options)
    if (d.toDateString() === today.toDateString()) return `TODAY • ${formatted.toUpperCase()}`
    if (d.toDateString() === yesterday.toDateString()) return `YESTERDAY • ${formatted.toUpperCase()}`
    return formatted.toUpperCase()
  }

  const groupedRides = allRides.reduce((groups, ride) => {
    const groupName = formatGroupHeader(ride.createdAt)
    if (!groups[groupName]) groups[groupName] = []
    groups[groupName].push(ride)
    return groups
  }, {})

  // ── Computed stats ──
  const now = new Date()
  const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7)
  const twoWeeksAgo = new Date(now); twoWeeksAgo.setDate(now.getDate() - 14)

  const thisWeekRides = allRides.filter(r => r.status === 'completed' && new Date(r.createdAt) >= weekAgo)
  const lastWeekRides = allRides.filter(r => r.status === 'completed' && new Date(r.createdAt) >= twoWeeksAgo && new Date(r.createdAt) < weekAgo)

  const thisWeekFare = thisWeekRides.reduce((s, r) => s + (r.fare || 0), 0)
  const lastWeekFare = lastWeekRides.reduce((s, r) => s + (r.fare || 0), 0)
  const weekPctChange = lastWeekFare > 0 ? Math.round(((thisWeekFare - lastWeekFare) / lastWeekFare) * 100) : null

  const totalFare = allRides.filter(r => r.status === 'completed').reduce((sum, r) => sum + (r.fare || 0), 0)

  return (
    <div className="text-slate-900 font-['Inter'] relative w-full max-w-full" style={{overflowX:'hidden'}}>
      {/* ── DESKTOP LAYOUT ── */}
      <div className="hidden md:flex bg-[#f2f2f4] dark:bg-[#0a0a0c] h-[100dvh] overflow-hidden flex-row transition-colors">
        <CaptainDesktopSidebar />
        <main className="flex-1 h-[100dvh] flex flex-col overflow-y-auto relative px-12 py-8 hide-scrollbar">
        <div className="w-full max-w-6xl mx-auto flex flex-col hide-scrollbar relative">
          
          <header className="mb-8 md:mb-12 flex justify-between items-center relative py-6 md:py-0 px-6 md:px-0">
             <h2 className="text-xl font-bold font-['Manrope'] hidden lg:block tracking-tight text-[#1a1c1e] dark:text-gray-100 transition-colors">Fleet History</h2>
             
             <div className="flex-1 max-w-md lg:mx-6 md:ml-0 md:mr-6 w-full mr-4 md:w-auto relative">
                <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-xs transition-colors" />
                <input type="text" placeholder="Search ride ID or date..." className="w-full bg-[#e8e8ea] dark:bg-[#161719] rounded-[10px] py-2.5 pl-9 pr-4 text-xs font-medium text-[#1a1c1e] dark:text-gray-100 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-orange-200 dark:focus:ring-orange-500/50 transition-colors" />
             </div>

             <div className="flex items-center gap-5 shrink-0">
                <div className="relative cursor-pointer hover:bg-gray-200 dark:hover:bg-[#2b2d31] p-2 rounded-full transition-colors hidden sm:block">
                  <i className="fa-solid fa-bell text-gray-600 dark:text-gray-400 text-lg transition-colors" />
                  <span className="absolute top-1 right-1.5 w-2.5 h-2.5 bg-[#e67e00] rounded-full border-2 border-[#f2f2f4] dark:border-[#0a0a0c] transition-colors" />
                </div>
                <div className="cursor-pointer hover:bg-gray-200 dark:hover:bg-[#2b2d31] p-2 rounded-full transition-colors hidden sm:block">
                  <i className="fa-solid fa-circle-question text-gray-600 dark:text-gray-400 text-lg transition-colors" />
                </div>
                
                <div 
                   onClick={() => navigate('/captain/account')} 
                   className="flex items-center gap-3 pl-2 sm:border-l border-gray-300 dark:border-[#2b2d31] cursor-pointer group hover:bg-gray-50 dark:hover:bg-[#161719] p-1.5 -my-1.5 rounded-xl transition-all"
                >
                   <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 border border-gray-200 dark:border-[#2b2d31] flex items-center justify-center shrink-0 group-hover:bg-slate-300 dark:group-hover:bg-slate-600 transition-colors">
                      <i className="fa-solid fa-user text-slate-500 dark:text-slate-400 transition-colors" />
                   </div>
                   <div className="hidden lg:block">
                      <p className="text-xs font-bold text-[#1a1c1e] dark:text-gray-100 transition-colors">{captain?.fullname?.firstname} {captain?.fullname?.lastname}</p>
                      <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 transition-colors">Captain</p>
                   </div>
                </div>
             </div>
          </header>

          <section className="flex flex-col lg:flex-row lg:items-end justify-between px-6 md:px-0 mb-10 gap-6">
             <div>
                <h1 className="text-5xl md:text-[56px] font-black text-[#1a1c1e] dark:text-gray-100 font-['Manrope'] tracking-tight mb-2 transition-colors">Ride Ledger</h1>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 transition-colors">Historical performance and transactional archive</p>
             </div>
             <div className="flex gap-4">
                <div className="bg-white dark:bg-[#161719] rounded-[24px] px-6 py-4 shadow-sm border border-white/50 dark:border-[#2b2d31] min-w-[120px] transition-colors">
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 transition-colors">Total Rides</p>
                   <p className="text-2xl font-black text-[#1a1c1e] dark:text-gray-100 transition-colors">{allRides.length.toLocaleString()}</p>
                </div>
                <div className="bg-white dark:bg-[#161719] rounded-[24px] px-6 py-4 shadow-sm border border-white/50 dark:border-[#2b2d31] min-w-[140px] transition-colors">
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 transition-colors">Lifetime Fare</p>
                   <p className="text-2xl font-black text-[#e67e00] transition-colors">₹{totalFare.toLocaleString()}</p>
                </div>
             </div>
          </section>

          <section className="px-6 md:px-0 mb-12">
            <div className="space-y-12">
               {Object.entries(groupedRides).map(([groupDate, rides]) => (
                 <div key={groupDate} className="space-y-4">
                    <div className="flex items-center gap-4 mb-2">
                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">{groupDate}</p>
                       <div className="h-[1px] w-full bg-gray-200" />
                    </div>

                    {rides.map((r, index) => {
                      const isCompleted = r.status === 'completed';
                      return (
                        <div key={r._id || index} className="bg-white dark:bg-[#161719] rounded-[32px] p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between shadow-sm border border-transparent dark:border-[#2b2d31] hover:shadow-md hover:border-gray-100 dark:hover:border-gray-700 transition-all gap-6 md:gap-0 group">
                           {/* Left Context: Avatar & ID */}
                           <div className="flex items-start gap-4 md:gap-5 w-full md:w-2/5 shrink-0">
                              <div className={`w-14 h-14 md:w-16 md:h-16 rounded-[16px] flex items-center justify-center relative shrink-0 transition-colors ${isCompleted ? 'bg-[#f3f3f6] dark:bg-[#1f2125] group-hover:bg-[#e8e8ea] dark:group-hover:bg-[#2b2d31]' : 'bg-gray-50 dark:bg-gray-800'}`}>
                                 <i className={`fa-solid ${vehicleIcon(r.vehicleType)} text-xl transition-colors ${isCompleted ? 'text-[#904d00]' : 'text-gray-400 dark:text-gray-600'}`} />
                                 <div className={`absolute -top-1.5 -right-1.5 w-4 h-4 text-white rounded-full flex items-center justify-center text-[8px] border-2 border-white dark:border-[#161719] transition-colors ${isCompleted ? 'bg-green-500' : 'bg-red-400'}`}>
                                    <i className={`fa-solid ${isCompleted ? 'fa-check' : 'fa-xmark'}`} />
                                 </div>
                              </div>
                              <div>
                                 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5 transition-colors">Time & ID</p>
                                 <p className="text-[15px] md:text-base font-bold text-[#1a1c1e] dark:text-gray-100 tracking-tight transition-colors">{new Date(r.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                 <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500 mt-0.5 uppercase transition-colors">#{r._id?.substring(0, 8)}</p>
                              </div>
                           </div>

                           {/* Middle Context: Route Planner */}
                           <div className="flex flex-col relative w-full md:w-2/5 md:px-8 border-l-[3px] border-transparent md:border-gray-50 dark:md:border-[#2b2d31] pl-4 md:pl-8 transition-colors">
                              <div className="absolute left-[-5px] md:left-[-7px] top-1.5 bottom-1.5 py-1 flex flex-col items-center z-10">
                                 <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600 transition-colors" />
                                 <div className="w-[2px] flex-1 bg-gray-100 dark:bg-gray-700 my-1 rounded-full transition-colors" />
                                 <div className={`w-2 h-2 rounded-full transition-colors ${isCompleted ? 'bg-[#e67e00]' : 'bg-gray-300 dark:bg-gray-600'}`} />
                              </div>
                              <div className="mb-4">
                                 <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5 transition-colors">Pickup</p>
                                 <p className="text-xs md:text-sm font-semibold text-[#1a1c1e] dark:text-gray-100 truncate transition-colors">{r.pickup || 'Location Not Provided'}</p>
                              </div>
                              <div>
                                 <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5 transition-colors">Dropoff</p>
                                 <p className="text-xs md:text-sm font-semibold text-[#1a1c1e] dark:text-gray-100 truncate transition-colors">{r.destination || 'Destination Drop'}</p>
                              </div>
                           </div>

                           {/* Right Context: Price */}
                           <div className="text-right w-full md:w-auto border-t border-gray-100 dark:border-[#2b2d31] md:border-0 pt-4 md:pt-0 flex md:block justify-between items-center shrink-0 transition-colors">
                              <p className={`text-2xl font-black md:mb-2 transition-colors ${isCompleted ? 'text-[#1a1c1e] dark:text-gray-100' : 'text-gray-400 dark:text-gray-600'}`}>₹{r.fare?.toFixed(2)}</p>
                              <div className={`${isCompleted ? 'bg-green-100/50 dark:bg-green-500/10 text-green-700 dark:text-green-500' : 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-500'} px-2.5 py-1 rounded-full text-[9px] font-bold flex items-center gap-1 w-max ml-auto shadow-sm uppercase tracking-wider transition-colors`}>
                                {isCompleted ? <><i className="fa-solid fa-check mr-0.5" /> COMPLETED</> : <><i className="fa-solid fa-xmark mr-0.5"/> CANCELLED</>}
                              </div>
                           </div>
                        </div>
                      )
                    })}
                 </div>
               ))}
            </div>
          </section>          {(() => {
             const offeredRides = allRides.length;
             const acceptedRides = allRides.filter(r => r.status !== 'cancelled').length;
             const completedRides = allRides.filter(r => r.status === 'completed').length;
             const acceptanceRate = offeredRides > 0 ? Math.round((acceptedRides / offeredRides) * 100) : 100;
             const avgRating = captain?.ratings?.average ? captain.ratings.average.toFixed(1) : '—';
             const accStatus = captain?.kycStatus === 'approved' ? 'Verified' : 'Pending';

             return (
               <section className="grid grid-cols-1 md:grid-cols-2 gap-6 px-6 md:px-0 mb-12">
                 <div className="bg-[#1a1c1e] rounded-[32px] overflow-hidden relative shadow-lg min-h-[300px] md:min-h-[360px] group cursor-pointer border border-gray-800 transition-colors">
                    <img src="https://images.unsplash.com/photo-1558981806-ec527fa84c39?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" alt="Motorcycle gauge" className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-luminosity group-hover:scale-105 transition-transform duration-1000 ease-out" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent p-8 md:p-10 flex flex-col justify-end">
                       <h2 className="text-[28px] md:text-4xl font-black text-white font-['Manrope'] tracking-tight mb-3 leading-tight transition-colors">Your QuickBike<br/>Milestone</h2>
                       <p className="text-xs md:text-sm text-gray-300 font-medium max-w-sm transition-colors">
                         You've successfully completed {completedRides} rides to date. Keep pushing forward to unlock elite fleet rewards!
                       </p>
                    </div>
                 </div>
                 <div className="bg-[#fce5d3] dark:bg-[#341b00] rounded-[32px] p-8 md:p-10 flex flex-col justify-end shadow-sm border border-[#fadbcb] dark:border-[#522e0e] transition-all relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/40 dark:bg-white/5 blur-3xl rounded-full -mr-20 -mt-20 pointer-events-none group-hover:bg-white/50 dark:group-hover:bg-white/10 transition-colors" />
                    <i className="fa-solid fa-wand-magic-sparkles text-3xl text-[#904d00] dark:text-[#f8b671] absolute top-8 left-8 transition-colors" />
                    <h2 className="text-[28px] md:text-4xl font-black text-[#4e2700] dark:text-[#f8b671] font-['Manrope'] tracking-tight mb-8 mt-16 leading-tight transition-colors">The Gallery of<br/>Performance</h2>
                    
                    <div className="space-y-4 relative z-10 w-full">
                       <div className="flex justify-between items-center border-b border-[#fbcba6] dark:border-[#522e0e] pb-2.5 transition-colors">
                          <p className="text-[10px] font-bold text-[#8c5020] dark:text-[#cf864c] uppercase tracking-widest transition-colors">Rating</p>
                          <p className="text-xl font-black text-[#4e2700] dark:text-[#f8b671] transition-colors">{avgRating}</p>
                       </div>
                       <div className="flex justify-between items-center border-b border-[#fbcba6] dark:border-[#522e0e] pb-2.5 transition-colors">
                          <p className="text-[10px] font-bold text-[#8c5020] dark:text-[#cf864c] uppercase tracking-widest transition-colors">Acceptance</p>
                          <p className="text-xl font-black text-[#4e2700] dark:text-[#f8b671] transition-colors">{acceptanceRate}%</p>
                       </div>
                       <div className="flex justify-between items-center pb-1">
                          <p className="text-[10px] font-bold text-[#8c5020] dark:text-[#cf864c] uppercase tracking-widest transition-colors">Acc Status</p>
                          <p className="text-xl font-black text-[#4e2700] dark:text-[#f8b671] transition-colors">{accStatus}</p>
                       </div>
                    </div>
                 </div>
               </section>
             );
          })()}

          <div className="flex justify-center pb-16">
             <button className="bg-transparent hover:bg-white dark:hover:bg-[#2b2d31] border border-gray-200 dark:border-[#2b2d31] text-gray-600 dark:text-gray-300 text-sm font-bold px-8 py-3 rounded-2xl transition-all shadow-sm hover:shadow-md flex items-center gap-3">
                Show Archive <i className="fa-solid fa-chevron-down text-[10px]" />
             </button>
          </div>

        </div>
        </main>
      </div>

      {/* ── MOBILE LAYOUT ── */}
      <main className="md:hidden flex-1 w-full h-[100dvh] overflow-y-auto overflow-x-hidden bg-[#f9f9fc] dark:bg-[#0a0a0c] pb-24 relative hide-scrollbar z-0 transition-colors">
        {/* Mobile Header */}
        <header className="flex items-center justify-between px-5 pt-6 pb-4 sticky top-0 bg-[#f9f9fc]/90 dark:bg-[#0a0a0c]/90 backdrop-blur-md z-40 transition-colors">
           <h1 className="text-xl font-bold text-[#1a1c1e] dark:text-gray-100 font-['Manrope'] tracking-tight transition-colors">Ride History</h1>
           <div onClick={() => navigate('/captain/account')} className="w-9 h-9 rounded-full overflow-hidden border-2 border-white dark:border-[#2b2d31] shadow-sm cursor-pointer shrink-0 transition-colors">
              {captain?.profilePicture?.url ? (
                  <img src={captain.profilePicture.url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                  <div className="w-full h-full bg-slate-200 flex items-center justify-center">
                     <i className="fa-solid fa-user text-slate-500 text-sm" />
                  </div>
              )}
           </div>
        </header>

        {/* Hero Summary Card */}
        <div className="bg-white dark:bg-[#161719] rounded-[24px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-none mx-4 mb-6 relative overflow-hidden shrink-0 border border-transparent dark:border-[#2b2d31] transition-colors">
           <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 dark:bg-orange-500/10 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none transition-colors" />
           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 relative z-10">This Week's Flow</p>
           <div className="flex justify-between items-center mb-5 relative z-10">
              <h2 className="text-4xl font-black text-[#1a1c1e] dark:text-gray-100 tracking-tight transition-colors">₹{thisWeekFare.toLocaleString()}</h2>
              {weekPctChange !== null && (
                <div className={`${weekPctChange >= 0 ? 'bg-[#e67e00]' : 'bg-red-500'} text-white text-[9px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm shrink-0`}>
                  <i className={`fa-solid ${weekPctChange >= 0 ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'}`} /> {weekPctChange >= 0 ? '+' : ''}{weekPctChange}%
                </div>
              )}
           </div>
           <div className="flex gap-8 relative z-10">
              <div>
                 <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Rides</p>
                 <p className="text-base font-black text-[#1a1c1e] dark:text-gray-100">{thisWeekRides.length}</p>
              </div>
              <div>
                 <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Rating</p>
                 <p className="text-base font-black text-[#1a1c1e] dark:text-gray-100 flex items-center gap-1">
                   {captain?.ratings?.average > 0 ? captain.ratings.average.toFixed(1) : '—'}
                   {captain?.ratings?.average > 0 && <i className="fa-solid fa-star text-[#e67e00] text-[10px]" />}
                 </p>
              </div>
              <div>
                 <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Total</p>
                 <p className="text-base font-black text-[#1a1c1e] dark:text-gray-100">₹{totalFare > 0 ? (totalFare/1000).toFixed(1)+'k' : '0'}</p>
              </div>
           </div>
        </div>

        {/* Recent Journeys */}
        <div className="px-4 space-y-3">
           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 pl-1">Recent Journeys</p>
           
           {allRides.slice(0, 50).map((r, index) => {
              const isCompleted = r.status === 'completed';
              const optionsDate = { month: 'short', day: 'numeric', year: 'numeric' };
              const optionsTime = { hour: '2-digit', minute:'2-digit' };
              const d = new Date(r.createdAt || new Date());
              const dateStr = d.toLocaleDateString('en-US', optionsDate);
              const timeStr = d.toLocaleTimeString([], optionsTime);
              
              const today = new Date();
              const yesterday = new Date(today);
              yesterday.setDate(today.getDate() - 1);
              
              let displayDate = dateStr;
              if (d.toDateString() === today.toDateString()) displayDate = 'Today';
              else if (d.toDateString() === yesterday.toDateString()) displayDate = 'Yesterday';

              return (
                 <div key={r._id || index} className="bg-white dark:bg-[#121214] rounded-[20px] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-transparent dark:border-[#2b2d31] relative overflow-hidden group transition-colors">
                    <i className={`fa-solid ${vehicleIcon(r.vehicleType)} absolute -right-3 -bottom-3 text-[56px] text-gray-50 dark:text-gray-800/10 opacity-50 rotate-[-15deg] pointer-events-none transition-colors`} />
                    
                    <div className="flex justify-between items-start mb-3 relative z-10 gap-3">
                       <div className="flex-1 min-w-0 pr-2">
                          <p className="text-[9px] font-bold text-gray-400 mb-1.5 leading-none">{displayDate} • {timeStr}</p>
                          <div className="flex items-center gap-2 mt-1">
                             <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isCompleted ? 'bg-[#e67e00]' : 'bg-gray-300 dark:bg-[#333]'}`} />
                             <p className="text-[13px] font-bold text-[#1a1c1e] dark:text-gray-100 truncate leading-tight flex-1 transition-colors">{r.pickup || 'Location Not Provided'}</p>
                          </div>
                       </div>
                       <div className="text-right shrink-0">
                          <p className="text-xl font-black text-[#1a1c1e] dark:text-gray-100 leading-none mb-1 transition-colors">₹{(r.fare || 0).toFixed(0)}</p>
                          <p className={`text-[8px] font-bold uppercase tracking-widest ${isCompleted ? 'text-[#00a0f8]' : 'text-[#ba1a1a] dark:text-red-400'}`}>{r.status}</p>
                       </div>
                    </div>
                    
                    <div className="flex items-start gap-2 relative z-10 pl-[3px]">
                       <div className="flex flex-col items-center">
                          <div className="h-3 w-[1px] border-l border-dashed border-gray-300 my-0.5"></div>
                       </div>
                    </div>
                    
                    <div className="flex items-center gap-2 relative z-10 mt-0.5 pl-[1px] pr-8">
                       <i className="fa-solid fa-location-dot text-[9px] text-gray-400 shrink-0" />
                       <p className="text-[11px] font-semibold text-gray-500 truncate leading-tight flex-1">{r.destination || 'Destination Drop'}</p>
                    </div>
                 </div>
              )
           })}
        </div>

        {/* Floating Action Button */}
        <div className="fixed bottom-[80px] right-5 w-11 h-11 bg-[#e67e00] rounded-full shadow-lg shadow-orange-500/30 flex items-center justify-center cursor-pointer z-50 hover:bg-[#c66a00] transition-colors">
           <i className="fa-solid fa-sliders text-white text-sm" />
        </div>
      </main>

      {/* MOBILE BOTTOM NAV */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-white dark:bg-[#161719] flex justify-around items-center pt-3 pb-5 z-[60] rounded-t-[20px] shadow-[0_-4px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.6)] border-t border-gray-50 dark:border-[#2b2d31] transition-colors">
        <div onClick={() => navigate('/captain-home')} className="flex flex-col items-center gap-1 cursor-pointer w-16 group">
          <i className="fa-solid fa-table-cells-large text-gray-400 group-active:text-[#e67e00] transition-colors text-lg" />
          <p className="text-[9px] font-bold text-gray-400 group-active:text-[#e67e00] transition-colors max-sm:text-[8px]">{t('account.navHome', 'Home')}</p>
        </div>
        <div onClick={() => navigate('/captain/history')} className="flex flex-col items-center gap-1 cursor-pointer w-20">
          <div className="bg-orange-50 dark:bg-orange-500/10 px-4 py-1.5 rounded-full flex flex-col items-center justify-center transition-colors">
             <i className="fa-solid fa-clock-rotate-left text-[#e67e00] text-lg" />
          </div>
          <p className="text-[9px] font-bold text-[#e67e00] max-sm:text-[8px] mt-0.5">{t('account.navHistory', 'History')}</p>
        </div>
        <div onClick={() => navigate('/captain/earnings')} className="flex flex-col items-center gap-1 cursor-pointer w-16 group">
          <i className="fa-solid fa-wallet text-gray-400 group-active:text-[#e67e00] transition-colors text-lg" />
          <p className="text-[9px] font-bold text-gray-400 group-active:text-[#e67e00] transition-colors max-sm:text-[8px]">{t('account.navEarnings', 'Earnings')}</p>
        </div>
        <div onClick={() => navigate('/captain/account')} className="flex flex-col items-center gap-1 cursor-pointer w-16 group">
          <i className="fa-solid fa-user text-gray-400 group-active:text-[#e67e00] transition-colors text-lg" />
          <p className="text-[9px] font-bold text-gray-400 group-active:text-[#e67e00] transition-colors max-sm:text-[8px]">{t('account.navAccount', 'Account')}</p>
        </div>
      </div>
    </div>
  )
}

export default CaptainHistory
