import React, { useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import axios from 'axios'
import { UserDataContext } from '../context/UserContext'

/* ── tiny helpers ── */
const ICON_MAP = { Home: 'fa-house', Work: 'fa-briefcase', Gym: 'fa-dumbbell', Other: 'fa-location-dot' }
const iconFor = (label) => ICON_MAP[label] || 'fa-location-dot'
const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('user_token')}` })

const UserAccount = () => {
  const navigate = useNavigate()
  const { user, setUser } = useContext(UserDataContext)

  /* ── state ── */
  const [editOpen, setEditOpen] = useState(false)
  const [placesOpen, setPlacesOpen] = useState(false)

  // profile edit form
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  // saved places
  const [places, setPlaces] = useState([])
  const [newLabel, setNewLabel] = useState('Home')
  const [newAddress, setNewAddress] = useState('')
  const [placeLoading, setPlaceLoading] = useState(false)

  // stats
  const [stats, setStats] = useState(null)

  /* ── load data on mount ── */
  useEffect(() => {
    if (user) {
      setFirstName(user.fullname?.firstname || '')
      setLastName(user.fullname?.lastname || '')
      setPhone(user.phone || '')
    }

    // fetch saved places
    axios.get(`${import.meta.env.VITE_BASE_URL}/users/saved-places`, { headers: authHeader() })
      .then(r => setPlaces(r.data.savedPlaces || []))
      .catch(() => {})

    // fetch ride stats
    axios.get(`${import.meta.env.VITE_BASE_URL}/rides/stats`, {
      headers: authHeader(),
      params: { userType: 'user' }
    })
      .then(r => setStats(r.data))
      .catch(() => {})
  }, [user])

  /* ── handlers ── */
  const saveProfile = async (e) => {
    e.preventDefault()
    setSaving(true)
    setSaveMsg('')
    try {
      const res = await axios.patch(`${import.meta.env.VITE_BASE_URL}/users/profile`,
        { firstname: firstName, lastname: lastName, phone },
        { headers: authHeader() }
      )
      setUser(res.data.user)
      setSaveMsg('Saved!')
      setTimeout(() => { setSaveMsg(''); setEditOpen(false) }, 1200)
    } catch {
      setSaveMsg('Failed to save.')
    } finally {
      setSaving(false)
    }
  }

  const upsertPlace = async () => {
    if (!newAddress.trim()) return
    setPlaceLoading(true)
    try {
      const res = await axios.post(`${import.meta.env.VITE_BASE_URL}/users/saved-places`,
        { label: newLabel, address: newAddress.trim(), icon: iconFor(newLabel) },
        { headers: authHeader() }
      )
      setPlaces(res.data.savedPlaces)
      setNewAddress('')
    } catch {} finally { setPlaceLoading(false) }
  }

  const deletePlace = async (label) => {
    try {
      const res = await axios.delete(
        `${import.meta.env.VITE_BASE_URL}/users/saved-places/${encodeURIComponent(label)}`,
        { headers: authHeader() }
      )
      setPlaces(res.data.savedPlaces)
    } catch {}
  }

  /* ── render ── */
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="w-8 h-8 border-2 border-orange-300 border-t-orange-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="bg-slate-100 min-h-screen flex justify-center font-['Inter']">
      <main className="w-full max-w-[390px] min-h-[100dvh] bg-slate-50 shadow-xl flex flex-col relative">

        {/* Header */}
        <header className="flex items-center gap-4 px-6 pt-12 pb-4 bg-white sticky top-0 z-10 shadow-sm">
          <button onClick={() => navigate('/home')} className="p-2 rounded-full hover:bg-orange-50 -ml-2 transition-colors">
            <svg className="h-6 w-6 text-slate-800" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-xl font-black font-['Manrope'] text-slate-900">Account</h1>
        </header>

        {/* Profile Hero */}
        <section className="bg-white px-6 pb-8 pt-5 mb-3 shadow-sm">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center shadow-inner shrink-0">
              <i className="fa-solid fa-user text-orange-500 text-3xl"></i>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-extrabold text-slate-900 truncate">
                {user?.fullname?.firstname} {user?.fullname?.lastname}
              </h2>
              <p className="text-sm text-slate-500 mt-0.5 truncate">{user?.email}</p>
              {user?.phone && <p className="text-sm text-slate-400 mt-0.5">{user.phone}</p>}

              {/* Rating pill */}
              <div className="flex items-center gap-1.5 mt-2">
                <div className="flex text-yellow-400 text-xs gap-0.5">
                  {[1,2,3,4,5].map(n => (
                    <i key={n} className={`fa-${Math.round(stats?.rating || 0) >= n ? 'solid' : 'regular'} fa-star`}></i>
                  ))}
                </div>
                <span className="text-xs font-bold text-slate-600">{stats?.rating ?? '—'}</span>
              </div>
            </div>
            <button
              className="w-10 h-10 rounded-full bg-orange-50 text-[#f5820d] flex items-center justify-center shrink-0 active:scale-90 transition-transform"
              onClick={() => setEditOpen(true)}
            >
              <i className="fa-solid fa-pen text-sm"></i>
            </button>
          </div>

          {/* Stats row */}
          {stats && (
            <div className="flex mt-6 bg-slate-50 rounded-2xl overflow-hidden border border-slate-100">
              {[
                { label: 'Total Rides', value: stats.totalRides },
                { label: 'Completed', value: stats.completedRides },
                { label: 'Total Spent', value: `₹${stats.totalSpent}` },
              ].map((s, i) => (
                <div key={i} className={`flex-1 text-center py-4 ${i < 2 ? 'border-r border-slate-200' : ''}`}>
                  <p className="text-lg font-black text-slate-800">{s.value}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Menu Items */}
        <section className="px-4 space-y-2 flex-grow pb-24">
          {/* Saved Places */}
          <button
            className="w-full bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm active:scale-[0.98] transition-transform"
            onClick={() => setPlacesOpen(true)}
          >
            <div className="w-11 h-11 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center"><i className="fa-solid fa-bookmark"></i></div>
            <div className="flex-1 text-left">
              <p className="font-bold text-slate-800">Saved Places</p>
              <p className="text-xs text-slate-400 font-semibold">{places.length} saved</p>
            </div>
            <i className="fa-solid fa-chevron-right text-slate-300"></i>
          </button>

          <button className="w-full bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm active:scale-[0.98] transition-transform">
            <div className="w-11 h-11 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center"><i className="fa-solid fa-wallet"></i></div>
            <div className="flex-1 text-left">
              <p className="font-bold text-slate-800">Payment Methods</p>
              <p className="text-xs text-slate-400 font-semibold">Cash • UPI • Cards</p>
            </div>
            <i className="fa-solid fa-chevron-right text-slate-300"></i>
          </button>

          <button className="w-full bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm active:scale-[0.98] transition-transform" onClick={() => navigate('/user/rides')}>
            <div className="w-11 h-11 rounded-full bg-teal-50 text-teal-500 flex items-center justify-center"><i className="fa-solid fa-clock-rotate-left"></i></div>
            <div className="flex-1 text-left">
              <p className="font-bold text-slate-800">Activity</p>
              <p className="text-xs text-slate-400 font-semibold">See all past rides</p>
            </div>
            <i className="fa-solid fa-chevron-right text-slate-300"></i>
          </button>

          <button className="w-full bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm active:scale-[0.98] transition-transform">
            <div className="w-11 h-11 rounded-full bg-green-50 text-green-500 flex items-center justify-center"><i className="fa-solid fa-headset"></i></div>
            <div className="flex-1 text-left">
              <p className="font-bold text-slate-800">Help & Support</p>
              <p className="text-xs text-slate-400 font-semibold">Chat, Call, FAQ</p>
            </div>
            <i className="fa-solid fa-chevron-right text-slate-300"></i>
          </button>

          <button
            className="w-full bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm active:scale-[0.98] transition-transform mt-6"
            onClick={() => navigate('/user/logout')}
          >
            <div className="w-11 h-11 rounded-full bg-red-50 text-red-500 flex items-center justify-center"><i className="fa-solid fa-power-off"></i></div>
            <div className="flex-1 text-left"><p className="font-bold text-red-600">Logout</p></div>
          </button>
        </section>

        {/* ── Profile Edit Modal ── */}
        {editOpen && (
          <div className="absolute inset-0 z-50 flex flex-col justify-end bg-black/40 backdrop-blur-sm" onClick={() => setEditOpen(false)}>
            <div className="bg-white rounded-t-[32px] p-6 pb-10 shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-6" />
              <h2 className="text-2xl font-black font-['Manrope'] text-slate-900 mb-6">Edit Profile</h2>

              <form onSubmit={saveProfile} className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">First Name</label>
                    <input
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-400 font-medium"
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      required minLength={3}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Last Name</label>
                    <input
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-400 font-medium"
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Phone Number</label>
                  <input
                    type="tel"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-400 font-medium"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                  />
                </div>

                {saveMsg && (
                  <p className={`text-sm font-bold text-center ${saveMsg === 'Saved!' ? 'text-green-600' : 'text-red-500'}`}>{saveMsg}</p>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-gradient-to-r from-[#904d00] to-[#E67E00] text-white font-bold py-4 rounded-full shadow-lg shadow-orange-200 active:scale-95 transition-all disabled:opacity-60"
                >
                  {saving ? <i className="fa-solid fa-circle-notch fa-spin"></i> : 'Save Changes'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ── Saved Places Modal ── */}
        {placesOpen && (
          <div className="absolute inset-0 z-50 flex flex-col justify-end bg-black/40 backdrop-blur-sm" onClick={() => setPlacesOpen(false)}>
            <div className="bg-white rounded-t-[32px] p-6 pb-10 shadow-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-6" />
              <h2 className="text-2xl font-black font-['Manrope'] text-slate-900 mb-6">Saved Places</h2>

              {/* Existing places */}
              <div className="space-y-3 mb-6">
                {places.length === 0 && (
                  <p className="text-sm text-slate-400 font-semibold text-center py-4">No saved places yet.</p>
                )}
                {places.map((p, i) => (
                  <div key={i} className="flex items-center gap-4 bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
                      <i className={`fa-solid ${iconFor(p.label)} text-sm`}></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 text-sm">{p.label}</p>
                      <p className="text-xs text-slate-400 font-semibold truncate">{p.address}</p>
                    </div>
                    <button
                      className="w-8 h-8 rounded-full bg-red-50 text-red-400 flex items-center justify-center shrink-0 active:scale-90 transition-transform"
                      onClick={() => deletePlace(p.label)}
                    >
                      <i className="fa-solid fa-trash text-xs"></i>
                    </button>
                  </div>
                ))}
              </div>

              {/* Add new place */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Add a Place</p>
                <select
                  className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-orange-400"
                  value={newLabel}
                  onChange={e => setNewLabel(e.target.value)}
                >
                  {['Home', 'Work', 'Gym', 'Other'].map(l => <option key={l}>{l}</option>)}
                </select>
                <input
                  className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-slate-800 placeholder-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="Enter full address..."
                  value={newAddress}
                  onChange={e => setNewAddress(e.target.value)}
                />
                <button
                  disabled={placeLoading || !newAddress.trim()}
                  className="w-full bg-gradient-to-r from-[#904d00] to-[#E67E00] text-white font-bold py-3.5 rounded-full shadow-md shadow-orange-200 active:scale-95 transition-all disabled:opacity-50"
                  onClick={upsertPlace}
                >
                  {placeLoading ? <i className="fa-solid fa-circle-notch fa-spin"></i> : 'Save Place'}
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}

export default UserAccount
