import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router'
import axios from 'axios'

const adminHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('admin_token')}` })

const AdminUsers = () => {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const limit = 15

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/admin/users`, {
        params: { page, limit },
        headers: adminHeader(),
      })
      setUsers(res.data.users || [])
      setTotal(res.data.total || 0)
    } catch (err) {
      if (err.response?.status === 401) navigate('/admin/login')
    } finally { setLoading(false) }
  }, [page, navigate])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const filtered = users.filter(u => {
    if (!search) return true
    const q = search.toLowerCase()
    const name = `${u.fullname?.firstname || ''} ${u.fullname?.lastname || ''}`.toLowerCase()
    return name.includes(q) || u.email?.toLowerCase().includes(q)
  })

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="p-8 font-['Inter']">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">Users</h1>
          <p className="text-slate-400 text-sm mt-1">{total} registered passengers</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 w-56"
            />
          </div>
          <button onClick={fetchUsers} className="flex items-center gap-2 bg-slate-800 text-slate-400 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-700 transition-colors">
            <i className="fa-solid fa-rotate-right" /> Refresh
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { icon: 'fa-users', label: 'Total Users', value: total, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { icon: 'fa-user-check', label: 'This Page', value: filtered.length, color: 'text-green-400', bg: 'bg-green-500/10' },
          { icon: 'fa-calendar', label: 'Showing', value: `${page} of ${totalPages || 1} pages`, color: 'text-orange-400', bg: 'bg-orange-500/10' },
        ].map(s => (
          <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center`}>
              <i className={`fa-solid ${s.icon} ${s.color} text-sm`} />
            </div>
            <div>
              <p className="text-white font-bold text-sm">{s.value}</p>
              <p className="text-slate-500 text-xs">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-widest">User</th>
              <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-widest">Email</th>
              <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-widest">Phone</th>
              <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-widest">Saved Places</th>
              <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-widest">Joined</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" className="text-center py-16">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                  <p className="text-slate-500 text-sm">Loading users...</p>
                </div>
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan="5" className="text-center py-16">
                <i className="fa-solid fa-users text-slate-700 text-4xl mb-3 block" />
                <p className="text-slate-500 text-sm">No users found</p>
              </td></tr>
            ) : filtered.map(u => {
              const name = `${u.fullname?.firstname || ''} ${u.fullname?.lastname || ''}`.trim() || '—'
              const joined = u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'
              const savedPlaces = u.savedPlaces?.length || 0
              // Avatar color based on first letter
              const colors = ['from-blue-500 to-blue-700', 'from-purple-500 to-purple-700', 'from-green-500 to-green-700', 'from-pink-500 to-pink-700', 'from-teal-500 to-teal-700']
              const colorIdx = (u.fullname?.firstname?.charCodeAt(0) || 0) % colors.length
              return (
                <tr key={u._id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 bg-gradient-to-br ${colors[colorIdx]} rounded-full flex items-center justify-center text-white text-xs font-black shrink-0`}>
                        {(u.fullname?.firstname?.[0] || '?').toUpperCase()}
                      </div>
                      <p className="text-white font-semibold text-sm">{name}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-300 text-sm">{u.email || '—'}</td>
                  <td className="px-5 py-4 text-slate-300 text-sm">{u.phone || '—'}</td>
                  <td className="px-5 py-4">
                    {savedPlaces > 0 ? (
                      <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full">
                        {savedPlaces} place{savedPlaces > 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className="text-slate-600 text-xs">None</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-slate-400 text-sm">{joined}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-slate-400 text-sm">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="px-4 py-2 bg-slate-800 text-slate-400 text-sm rounded-xl disabled:opacity-40 hover:bg-slate-700 transition-colors"
            >← Prev</button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 bg-slate-800 text-slate-400 text-sm rounded-xl disabled:opacity-40 hover:bg-slate-700 transition-colors"
            >Next →</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminUsers
