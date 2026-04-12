import React, { useState, useEffect } from 'react'
import { useNavigate, NavLink, Outlet } from 'react-router'
import axios from 'axios'

const adminHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('admin_token')}` })

// ── Sidebar layout ──────────────────────────────────────────────

export const AdminLayout = ({ children }) => {
  const navigate = useNavigate()

  const logout = () => {
    localStorage.removeItem('admin_token')
    navigate('/admin/login')
  }

  const nav = [
    { icon: 'fa-gauge', label: 'Dashboard', to: '/admin' },
    { icon: 'fa-clipboard-check', label: 'KYC Review', to: '/admin/kyc' },
    { icon: 'fa-motorcycle', label: 'Captains', to: '/admin/captains' },
    { icon: 'fa-users', label: 'Users', to: '/admin/users' },
  ]

  return (
    <div className="min-h-screen bg-slate-950 font-['Inter'] flex">
      {/* Sidebar */}
      <aside className="w-56 bg-slate-900/80 border-r border-slate-800 flex flex-col shrink-0">
        <div className="flex items-center gap-3 px-5 py-6 border-b border-slate-800">
          <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center">
            <i className="fa-solid fa-bolt text-white text-base" />
          </div>
          <div>
            <p className="font-black text-white text-sm">QuickBike</p>
            <p className="text-slate-500 text-[10px] font-semibold">Admin Panel</p>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map(n => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === '/admin'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`
              }
            >
              <i className={`fa-solid ${n.icon} w-4`} />
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-3 pb-6">
          <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all">
            <i className="fa-solid fa-right-from-bracket w-4" />
            Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}

// ── Dashboard ───────────────────────────────────────────────────
const AdminDashboard = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('admin_token')
        if (!token) { navigate('/admin/login'); return }
        const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/admin/stats`, { headers: adminHeader() })
        const d = res.data.data || res.data
        // Flatten the nested response into the shape our cards expect
        setStats({
          totalUsers: d.users?.total ?? d.totalUsers ?? 0,
          totalCaptains: d.captains?.total ?? d.totalCaptains ?? 0,
          pendingKyc: d.kyc?.pending ?? d.pendingKyc ?? 0,
          approvedKyc: d.kyc?.approved ?? d.approvedKyc ?? 0,
          rejectedKyc: d.kyc?.rejected ?? d.rejectedKyc ?? 0,
          totalRides: d.rides?.total ?? d.totalRides ?? 0,
          activeRides: d.rides?.active ?? d.activeRides ?? 0,
          completedToday: d.rides?.completedToday ?? 0,
          todayRevenue: d.revenue?.today ?? 0,
        })
      } catch (err) {
        if (err.response?.status === 401) navigate('/admin/login')
      } finally { setLoading(false) }
    }
    fetchStats()
  }, [navigate])

  const cards = stats ? [
    { icon: 'fa-users', label: 'Total Users', value: stats.totalUsers, color: 'bg-blue-500', light: 'bg-blue-500/10 text-blue-400' },
    { icon: 'fa-motorcycle', label: 'Total Captains', value: stats.totalCaptains, color: 'bg-green-500', light: 'bg-green-500/10 text-green-400' },
    { icon: 'fa-clipboard-check', label: 'Pending KYC', value: stats.pendingKyc, color: 'bg-orange-500', light: 'bg-orange-500/10 text-orange-400', cta: () => navigate('/admin/kyc') },
    { icon: 'fa-route', label: 'Active Rides', value: stats.activeRides, color: 'bg-purple-500', light: 'bg-purple-500/10 text-purple-400' },
    { icon: 'fa-check-circle', label: 'Approved KYC', value: stats.approvedKyc, color: 'bg-emerald-500', light: 'bg-emerald-500/10 text-emerald-400' },
    { icon: 'fa-x-circle', label: 'Rejected KYC', value: stats.rejectedKyc, color: 'bg-red-500', light: 'bg-red-500/10 text-red-400' },
  ] : []

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Realtime overview of your platform</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="bg-slate-800 rounded-2xl h-28 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {cards.map(c => (
            <div key={c.label} onClick={c.cta} className={`bg-slate-900 border border-slate-800 rounded-2xl p-5 ${c.cta ? 'cursor-pointer hover:border-orange-500/50 transition-colors' : ''}`}>
              <div className="flex items-center justify-between mb-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm ${c.light}`}>
                  <i className={`fa-solid ${c.icon}`} />
                </div>
                {c.cta && <i className="fa-solid fa-arrow-right text-slate-600 text-xs" />}
              </div>
              <p className="text-3xl font-black text-white">{c.value}</p>
              <p className="text-slate-400 text-xs font-semibold mt-1">{c.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Quick actions */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <p className="text-white font-bold text-sm mb-3">Quick Actions</p>
        <div className="flex gap-3">
          <button onClick={() => navigate('/admin/kyc?status=pending')} className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-orange-500/20 transition-colors">
            <i className="fa-solid fa-clipboard-check" /> Review Pending KYC
          </button>
          <button onClick={() => navigate('/admin/captains')} className="flex items-center gap-2 bg-slate-800 text-slate-400 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-700 transition-colors">
            <i className="fa-solid fa-motorcycle" /> View Captains
          </button>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
