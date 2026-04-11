import React, { useContext, useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router'
import axios from 'axios'
import { UserDataContext } from '../context/UserContext'

/* ── helpers ── */
const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('user_token')}` })

const fmtDate = (iso) => {
  if (!iso) return ''
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  })
}

const vehicleLabel = (type) => (
  type === 'moto' ? 'Bike' : type === 'auto' ? 'Auto' : type === 'car' ? 'Car' : type || '—'
)

const vehicleIcon = (type) => (
  type === 'moto' ? 'fa-motorcycle' : type === 'auto' ? 'fa-van-shuttle' : 'fa-car-side'
)

const STATUS = {
  completed: { dot: 'bg-green-500', label: 'Completed', badge: 'bg-green-50 text-green-700 border-green-100' },
  cancelled:  { dot: 'bg-red-400',   label: 'Cancelled',  badge: 'bg-red-50 text-red-600 border-red-100'    },
  ongoing:    { dot: 'bg-blue-500',  label: 'Ongoing',    badge: 'bg-blue-50 text-blue-700 border-blue-100'  },
  pending:    { dot: 'bg-amber-400', label: 'Pending',    badge: 'bg-amber-50 text-amber-700 border-amber-100'},
}

/* ── Inline star rating component ── */
const InlineRating = ({ ride, onRated }) => {
  const [rating, setRating] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const submit = async (star) => {
    setRating(star)
    setSubmitting(true)
    try {
      await axios.post(
        `${import.meta.env.VITE_BASE_URL}/rides/${ride._id}/rate`,
        { rating: star },
        { headers: authHeader() }
      )
      setDone(true)
      onRated && onRated(ride._id, star)
    } catch { /* fail silently */ } finally { setSubmitting(false) }
  }

  if (done) {
    return (
      <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-50">
        <span className="text-yellow-400 text-sm">{'⭐'.repeat(rating)}</span>
        <span className="text-xs text-slate-400 font-semibold">Thanks for rating!</span>
      </div>
    )
  }

  return (
    <div className="mt-3 pt-3 border-t border-slate-50">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Rate this ride</p>
      <div className="flex gap-2">
        {[1,2,3,4,5].map((s) => (
          <button
            key={s}
            disabled={submitting}
            onClick={() => submit(s)}
            className={`flex-1 py-1.5 rounded-xl text-base transition-all active:scale-90 ${
              rating >= s ? 'bg-yellow-50' : 'bg-slate-50 opacity-50'
            }`}
          >⭐</button>
        ))}
      </div>
    </div>
  )
}

/* ── Main Component ── */
const UserRides = () => {
  const navigate = useNavigate()
  const { user } = useContext(UserDataContext)

  const [rides, setRides]         = useState([])
  const [stats, setStats]         = useState(null)
  const [loading, setLoading]     = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [filter, setFilter]       = useState('all')
  const [page, setPage]           = useState(1)
  const [pagination, setPagination] = useState({})
  const [error, setError]         = useState('')

  /* fetch rides */
  const fetchRides = useCallback(async (status, pg) => {
    setLoading(true)
    setError('')
    try {
      const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/rides/history`, {
        params: { userType: 'user', status, page: pg, limit: 15 },
        headers: authHeader(),
      })
      setRides(res.data.rides || [])
      setPagination(res.data.pagination || {})
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load rides. Please try again.')
      setRides([])
    } finally { setLoading(false) }
  }, [])

  /* fetch stats */
  useEffect(() => {
    axios.get(`${import.meta.env.VITE_BASE_URL}/rides/stats`, {
      params: { userType: 'user' },
      headers: authHeader(),
    })
      .then(r => setStats(r.data))
      .catch(() => {})
      .finally(() => setStatsLoading(false))
  }, [])

  useEffect(() => { fetchRides(filter, page) }, [filter, page, fetchRides])

  /* when user rates inline, mark it locally so we don't show stars again */
  const handleRated = (rideId, star) => {
    setRides(prev => prev.map(r =>
      r._id === rideId ? { ...r, captainRating: star } : r
    ))
  }

  const TABS = [
    { key: 'all',       label: 'All' },
    { key: 'completed', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled' },
  ]

  return (
    <div className="bg-slate-100 min-h-screen flex justify-center font-['Inter']">
      <main className="w-full max-w-[390px] min-h-[100dvh] bg-white shadow-xl flex flex-col">

        {/* ── Sticky Header ── */}
        <header className="flex items-center gap-4 px-6 pt-12 pb-4 bg-white sticky top-0 z-10 border-b border-gray-100 shadow-sm">
          <button
            onClick={() => navigate('/home')}
            className="p-2 rounded-full hover:bg-orange-50 -ml-2 transition-colors active:scale-90"
          >
            <svg className="h-6 w-6 text-slate-800" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-black font-['Manrope'] text-slate-900">Activity</h1>
            {user && (
              <p className="text-xs text-slate-400 font-semibold mt-0.5">
                {user.fullname?.firstname} {user.fullname?.lastname}
              </p>
            )}
          </div>
        </header>

        {/* ── Stats Summary Strip ── */}
        <div className="bg-gradient-to-r from-[#1a0a00] to-[#3d1f00] px-6 py-5">
          {statsLoading ? (
            <div className="flex gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex-1 h-12 bg-white/10 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="flex gap-3">
              {[
                { label: 'Total Rides',  value: stats?.totalRides      ?? '—' },
                { label: 'Completed',    value: stats?.completedRides  ?? '—' },
                { label: 'Total Spent',  value: stats?.totalSpent != null ? `₹${stats.totalSpent}` : '—' },
              ].map((s, i) => (
                <div key={i} className="flex-1 bg-white/10 backdrop-blur rounded-2xl p-3 text-center border border-white/10">
                  <p className="text-lg font-black text-white">{s.value}</p>
                  <p className="text-[9px] font-bold text-orange-300 uppercase tracking-widest mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Rating if available */}
          {stats?.rating != null && (
            <div className="flex items-center gap-2 mt-3">
              <div className="flex text-yellow-400 text-xs gap-0.5">
                {[1,2,3,4,5].map(n => (
                  <i key={n} className={`fa-${Math.round(stats.rating) >= n ? 'solid' : 'regular'} fa-star`} />
                ))}
              </div>
              <span className="text-xs font-bold text-orange-200">{stats.rating} avg rating as passenger</span>
            </div>
          )}
        </div>

        {/* ── Filter Tabs ── */}
        <div className="flex gap-1.5 px-5 py-3 bg-white border-b border-gray-100 sticky top-[73px] z-10">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => { setFilter(t.key); setPage(1) }}
              className={`flex-1 py-2 rounded-full text-xs font-extrabold transition-all ${
                filter === t.key
                  ? 'bg-[#E67E00] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Ride List ── */}
        <section className="flex-grow overflow-y-auto bg-slate-50 px-5 py-4 pb-24">

          {/* Error */}
          {error && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-2xl p-4 mb-4">
              <i className="fa-solid fa-circle-exclamation text-red-400 shrink-0" />
              <p className="text-sm text-red-600 font-semibold flex-1">{error}</p>
              <button onClick={() => fetchRides(filter, page)} className="text-red-400 text-xs font-bold">Retry</button>
            </div>
          )}

          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <div className="h-4 bg-slate-100 rounded-full w-1/3 mb-4 animate-pulse" />
                  <div className="h-3 bg-slate-100 rounded-full w-full mb-2 animate-pulse" />
                  <div className="h-3 bg-slate-100 rounded-full w-2/3 animate-pulse" />
                </div>
              ))}
            </div>
          ) : rides.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
              <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center text-slate-300">
                <i className="fa-solid fa-motorcycle text-4xl" />
              </div>
              <div>
                <p className="font-bold text-slate-700 text-lg">No {filter !== 'all' ? filter : ''} rides yet</p>
                <p className="text-sm text-slate-400 mt-1">
                  {filter === 'all' ? 'Your ride history will appear here' : `No ${filter} rides found`}
                </p>
              </div>
              <button
                className="mt-2 bg-gradient-to-r from-[#904d00] to-[#E67E00] text-white font-bold px-6 py-3 rounded-full shadow-md active:scale-95 transition-all"
                onClick={() => navigate('/home')}
              >
                Book a Ride
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {rides.map((ride) => {
                const cfg = STATUS[ride.status] || STATUS.completed
                const canRate = ride.status === 'completed' && !ride.captainRating

                return (
                  <div key={ride._id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">

                    {/* ── Row 1: Date + Status + Fare ── */}
                    <div className="flex justify-between items-start mb-4 pb-3 border-b border-slate-50">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                          {fmtDate(ride.createdAt)}
                        </p>
                        <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${cfg.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </span>
                        {ride.surgeMultiplier > 1 && (
                          <span className="ml-1.5 text-[9px] font-bold text-orange-500 bg-orange-50 border border-orange-100 px-1.5 py-0.5 rounded-full">
                            ⚡ {ride.surgeMultiplier}x Surge
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-black text-[#A85507]">₹{ride.fare}</p>
                        <div className="flex items-center justify-end gap-1 mt-0.5">
                          <i className={`fa-solid ${vehicleIcon(ride.vehicleType)} text-slate-400 text-xs`} />
                          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                            {vehicleLabel(ride.vehicleType)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* ── Row 2: Route Timeline ── */}
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center mt-1.5 shrink-0">
                        <div className="w-2 h-2 rounded-full bg-orange-500" />
                        <div className="w-[1.5px] h-6 bg-slate-200 my-0.5" />
                        <div className="w-2 h-2 rounded-full bg-slate-700" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800 line-clamp-1 mb-2.5">{ride.pickup}</p>
                        <p className="text-sm font-bold text-slate-800 line-clamp-1">{ride.destination}</p>
                      </div>
                    </div>

                    {/* ── Row 3: Captain Info ── */}
                    {ride.captain?.fullname && (
                      <div className="mt-3 pt-3 border-t border-slate-50 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                          <i className="fa-solid fa-user text-xs" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-700 truncate">
                            {ride.captain.fullname.firstname} {ride.captain.fullname.lastname}
                          </p>
                          <p className="text-[10px] text-slate-400 font-semibold">
                            {ride.captain.vehicle?.plate?.toUpperCase()} · {vehicleLabel(ride.captain.vehicle?.vehicleType)}
                          </p>
                        </div>
                        {/* Show existing rating */}
                        {ride.captainRating && (
                          <div className="text-sm text-yellow-400 font-bold shrink-0">
                            {'⭐'.repeat(ride.captainRating)}
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── Row 4: Rating Prompt (only for completed, unrated) ── */}
                    {canRate && (
                      <InlineRating ride={ride} onRated={handleRated} />
                    )}

                    {/* Applied promo indicator */}
                    {ride.promoCode && (
                      <div className="mt-2 flex items-center gap-1.5">
                        <i className="fa-solid fa-tag text-green-500 text-xs" />
                        <span className="text-xs text-green-600 font-bold">
                          {ride.promoCode} — saved ₹{ride.discount}
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}

              {/* ── Pagination ── */}
              {pagination.pages > 1 && (
                <div className="flex justify-center items-center gap-4 pt-2 pb-4">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage(p => p - 1)}
                    className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 disabled:opacity-30 active:scale-90 transition-all shadow-sm"
                  >
                    <i className="fa-solid fa-chevron-left text-xs" />
                  </button>
                  <span className="text-sm font-bold text-slate-600">
                    Page {page} / {pagination.pages}
                  </span>
                  <button
                    disabled={page >= pagination.pages}
                    onClick={() => setPage(p => p + 1)}
                    className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 disabled:opacity-30 active:scale-90 transition-all shadow-sm"
                  >
                    <i className="fa-solid fa-chevron-right text-xs" />
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

        {/* ── Bottom Nav ── */}
        <nav className="sticky bottom-0 w-full bg-white/95 backdrop-blur-lg border-t border-slate-100 px-8 py-2.5 flex justify-between items-center z-10 shadow-[0_-1px_10px_rgba(0,0,0,0.04)]">
          <button
            className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600 transition-colors"
            onClick={() => navigate('/home')}
          >
            <i className="fa-solid fa-motorcycle text-xl" />
            <span className="text-[10px] font-semibold">Ride</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-[#E67E00]">
            <i className="fa-solid fa-clock-rotate-left text-xl" />
            <span className="text-[10px] font-bold">Activity</span>
          </button>
          <button
            className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600 transition-colors"
            onClick={() => navigate('/user/account')}
          >
            <i className="fa-solid fa-user text-xl" />
            <span className="text-[10px] font-semibold">Account</span>
          </button>
        </nav>

      </main>
    </div>
  )
}

export default UserRides
