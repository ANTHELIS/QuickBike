import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import axios from 'axios'

const adminHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('admin_token')}` })

const statusConfig = {
  pending:  { label: 'Pending',  bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
  approved: { label: 'Approved', bg: 'bg-green-500/10',  text: 'text-green-400',  border: 'border-green-500/20' },
  rejected: { label: 'Rejected', bg: 'bg-red-500/10',    text: 'text-red-400',    border: 'border-red-500/20' },
  draft:    { label: 'Draft',    bg: 'bg-slate-700',      text: 'text-slate-400',  border: 'border-slate-600' },
}

const KycList = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [kycs, setKycs] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState(searchParams.get('status') || 'all')
  const [search, setSearch] = useState('')

  const fetchKyc = useCallback(async () => {
    setLoading(true)
    try {
      const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/admin/kyc`, {
        params: { status: filter === 'all' ? undefined : filter, search },
        headers: adminHeader(),
      })
      setKycs(res.data.data || res.data.kycs || [])
      setTotal(res.data.pagination?.total || res.data.total || 0)
    } catch (err) {
      if (err.response?.status === 401) navigate('/admin/login')
    } finally { setLoading(false) }
  }, [filter, search, navigate])

  useEffect(() => { fetchKyc() }, [fetchKyc])

  const tabs = [
    { key: 'all',      label: 'All' },
    { key: 'pending',  label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
  ]

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">KYC Applications</h1>
          <p className="text-slate-400 text-sm mt-1">{total} total applications</p>
        </div>
        <button onClick={fetchKyc} className="flex items-center gap-2 bg-slate-800 text-slate-400 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-700 transition-colors">
          <i className="fa-solid fa-rotate-right" /> Refresh
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setFilter(t.key)} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filter === t.key ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'}`}>
            {t.label}
          </button>
        ))}
        <div className="ml-auto relative">
          <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name..."
            className="bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 w-52"
          />
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
              <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-widest">Submitted</th>
              <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
              <th className="px-5 py-3.5" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="text-center py-16">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
                  <p className="text-slate-500 text-sm">Loading applications...</p>
                </div>
              </td></tr>
            ) : kycs.length === 0 ? (
              <tr><td colSpan="6" className="text-center py-16">
                <i className="fa-solid fa-inbox text-slate-600 text-4xl mb-3" />
                <p className="text-slate-500 text-sm">No KYC applications found</p>
              </td></tr>
            ) : kycs.map(kyc => {
              const cfg = statusConfig[kyc.status] || statusConfig.draft
              const captain = kyc.captain
              const name = `${captain?.fullname?.firstname || ''} ${captain?.fullname?.lastname || ''}`.trim() || '—'
              const date = kyc.submittedAt ? new Date(kyc.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'
              return (
                <tr key={kyc._id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-white text-xs font-black">
                        {(captain?.fullname?.firstname?.[0] || '?').toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">{name}</p>
                        <p className="text-slate-500 text-xs">{captain?.email || '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-300 text-sm">{captain?.phone || '—'}</td>
                  <td className="px-5 py-4 text-slate-300 text-sm">{captain?.vehicle?.vehicleType || '—'}</td>
                  <td className="px-5 py-4 text-slate-400 text-sm">{date}</td>
                  <td className="px-5 py-4">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                      {cfg.label}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => navigate(`/admin/kyc/${kyc._id}`)}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Review →
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default KycList
