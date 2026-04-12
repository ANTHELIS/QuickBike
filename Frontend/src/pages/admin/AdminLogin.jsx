import React, { useState } from 'react'
import { useNavigate } from 'react-router'
import axios from 'axios'

const AdminLogin = () => {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPw, setShowPw] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await axios.post(`${import.meta.env.VITE_BASE_URL}/api/admin/login`, form)
      const { token } = res.data.data || res.data
      localStorage.setItem('admin_token', token)
      navigate('/admin')
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check credentials.')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#1a0a00] to-slate-900 flex items-center justify-center px-5 font-['Inter']">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500 rounded-2xl shadow-2xl shadow-orange-500/30 mb-4">
            <i className="fa-solid fa-bolt text-white text-2xl" />
          </div>
          <h1 className="text-3xl font-black text-white">QuickBike</h1>
          <p className="text-slate-400 text-sm mt-1 font-medium">Admin Control Panel</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-7 shadow-xl">
          <h2 className="text-white font-bold text-lg mb-1">Welcome back</h2>
          <p className="text-slate-400 text-sm mb-6">Sign in with your admin credentials</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Email</label>
              <div className="relative">
                <i className="fa-solid fa-envelope absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm" />
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="admin@admin.com"
                  required
                  className="w-full bg-white/10 border border-white/10 text-white placeholder-slate-500 rounded-xl pl-10 pr-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Password</label>
              <div className="relative">
                <i className="fa-solid fa-lock absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••"
                  required
                  className="w-full bg-white/10 border border-white/10 text-white placeholder-slate-500 rounded-xl pl-10 pr-12 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                  <i className={`fa-solid ${showPw ? 'fa-eye-slash' : 'fa-eye'} text-sm`} />
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5">
                <i className="fa-solid fa-circle-exclamation text-red-400 text-sm" />
                <p className="text-red-400 text-xs font-semibold">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-600 to-orange-400 text-white font-extrabold py-4 rounded-xl shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 active:scale-95 transition-transform mt-2 disabled:opacity-60"
            >
              {loading ? <><i className="fa-solid fa-circle-notch fa-spin" /> Signing in...</> : <>Sign In <i className="fa-solid fa-arrow-right" /></>}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">QuickBike Admin Panel v1.0 · Restricted Access</p>
      </div>
    </div>
  )
}

export default AdminLogin
