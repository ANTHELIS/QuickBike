import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router'
import axios from 'axios'

const adminHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('admin_token')}` })

const statusConfig = {
  active:   { label: 'Online',  bg: 'bg-green-500/10',  text: 'text-green-400',  border: 'border-green-500/20' },
  inactive: { label: 'Offline', bg: 'bg-slate-700',      text: 'text-slate-400',  border: 'border-slate-600' },
}

const kycConfig = {
  approved: { label: 'Verified',  bg: 'bg-green-500/10',  text: 'text-green-400' },
  pending:  { label: 'Pending',   bg: 'bg-orange-500/10', text: 'text-orange-400' },
  rejected: { label: 'Rejected',  bg: 'bg-red-500/10',    text: 'text-red-400' },
  none:     { label: 'No KYC',    bg: 'bg-slate-700',     text: 'text-slate-400' },
}

const AdminCaptains = () => {
  const navigate = useNavigate()
  const [captains, setCaptains] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const limit = 15

  const fetchCaptains = useCallback(async () => {
    setLoading(true)
    try {
      const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/admin/captains`, {
        params: { page, limit },
        headers: adminHeader(),
      })
      setCaptains(res.data.data || res.data.captains || [])
      setTotal(res.data.pagination?.total || res.data.total || 0)
    } catch (err) {
      if (err.response?.status === 401) navigate('/admin/login')
    } finally { setLoading(false) }
  }, [page, navigate])

  useEffect(() => { fetchCaptains() }, [fetchCaptains])

  // Client-side search filter
  const filtered = captains.filter(c => {
    if (!search) return true
    const q = search.toLowerCase()
    const name = `${c.fullname?.firstname || ''} ${c.fullname?.lastname || ''}`.toLowerCase()
    return name.includes(q) || c.phone?.includes(q) || c.email?.toLowerCase().includes(q)
  })

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="p-8 font-['Inter']">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">Captains</h1>
          <p className="text-slate-400 text-sm mt-1">{total} registered riders</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, phone..."
              className="bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 w-56"
            />
          </div>
          <button onClick={fetchCaptains} className="flex items-center gap-2 bg-slate-800 text-slate-400 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-700 transition-colors">
            <i className="fa-solid fa-rotate-right" /> Refresh
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-widest">Captain</th>
              <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-widest">Phone</th>
              <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-widest">Vehicle</th>
              <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-widest">KYC</th>
              <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
              <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-widest">Joined</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="text-center py-16">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
                  <p className="text-slate-500 text-sm">Loading captains...</p>
                </div>
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan="6" className="text-center py-16">
                <i className="fa-solid fa-motorcycle text-slate-700 text-4xl mb-3 block" />
                <p className="text-slate-500 text-sm">No captains found</p>
              </td></tr>
            ) : filtered.map(c => {
              const name = `${c.fullname?.firstname || ''} ${c.fullname?.lastname || ''}`.trim() || '—'
              const kyc = kycConfig[c.kycStatus || 'none']
              const statusCfg = statusConfig[c.status || 'inactive']
              const joined = c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'
              return (
                <tr key={c._id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-orange-700 rounded-full flex items-center justify-center text-white text-xs font-black shrink-0">
                        {(c.fullname?.firstname?.[0] || '?').toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">{name}</p>
                        <p className="text-slate-500 text-xs">{c.email || 'No email'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-300 text-sm">{c.phone || '—'}</td>
                  <td className="px-5 py-4">
                    <div className="text-slate-300 text-sm">{c.vehicle?.vehicleType?.toUpperCase() || '—'}</div>
                    <div className="text-slate-500 text-xs">{c.vehicle?.plate || '—'}</div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${kyc.bg} ${kyc.text}`}>
                      {c.isVerified ? '✓ ' : ''}{kyc.label}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}>
                      {statusCfg.label}
                    </span>
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

export default AdminCaptains
