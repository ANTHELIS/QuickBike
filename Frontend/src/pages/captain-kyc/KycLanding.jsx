import React, { useState, useContext } from 'react'
import { useNavigate, Link } from 'react-router'
import axios from 'axios'
import { CaptainDataContext } from '../../context/CapatainContext'

const KycLanding = () => {
  const navigate = useNavigate()
  const { setCaptain } = useContext(CaptainDataContext)

  const [form, setForm] = useState({
    firstname: '', lastname: '', phone: '', password: '',
    vehicleColor: '', vehiclePlate: '', vehicleCapacity: '', vehicleType: 'moto',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await axios.post(`${import.meta.env.VITE_BASE_URL}/captains/register`, {
        fullname: { firstname: form.firstname, lastname: form.lastname },
        phone:    form.phone,
        password: form.password,
        vehicle: {
          color:       form.vehicleColor,
          plate:       form.vehiclePlate,
          capacity:    Number(form.vehicleCapacity),
          vehicleType: form.vehicleType,
        },
      })
      setCaptain(res.data.captain)
      localStorage.setItem('captain_token', res.data.token)
      navigate('/captain/kyc/step/1')
    } catch (err) {
      const msg = err.response?.data?.message
        || err.response?.data?.errors?.[0]?.msg
        || 'Registration failed. Please try again.'
      setError(msg)
    } finally { setLoading(false) }
  }

  const inputClass = 'w-full bg-white border border-slate-200 rounded-2xl py-3.5 px-4 text-slate-800 text-sm placeholder-slate-400 focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none transition-all'
  const labelClass = 'text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5 px-1'

  return (
    <div className="min-h-screen bg-[#F9F5F0] font-['Inter'] flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-10 pb-4">
        <Link to="/captain-login" className="w-9 h-9 flex items-center justify-center rounded-full bg-white shadow-sm">
          <i className="fa-solid fa-arrow-left text-slate-700 text-sm" />
        </Link>
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="QuickBike" className="h-10 w-auto object-contain" />
          <span className="text-orange-500 font-extrabold text-sm">QuickBike</span>
        </div>
        <div className="w-9" />
      </header>

      <div className="flex-1 overflow-y-auto px-5 pb-10">
        {/* Hero */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-200 text-orange-600 text-[10px] font-bold px-3 py-1.5 rounded-full mb-4">
            <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            OPEN FOR REGISTRATION
          </div>
          <h1 className="text-3xl font-black text-slate-900 leading-tight flex items-center gap-2 flex-wrap">
            Become a <img src="/logo.png" alt="QuickBike" className="h-14 w-auto object-contain" /> <span className="text-[#C85A00]">QuickBike</span> Rider
          </h1>
          <p className="text-slate-500 text-sm mt-2 leading-relaxed">
            Fill in your details to get started. Document verification happens next.
          </p>
        </div>

        {/* Progress hint */}
        <div className="flex items-center gap-2 mb-6">
          {['Account', 'Documents', 'Review'].map((s, i) => (
            <React.Fragment key={s}>
              <div className={`flex items-center gap-1.5 text-xs font-bold ${i === 0 ? 'text-orange-500' : 'text-slate-400'}`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${i === 0 ? 'bg-orange-500 text-white' : 'bg-slate-200 text-slate-500'}`}>{i + 1}</div>
                {s}
              </div>
              {i < 2 && <div className="flex-1 h-px bg-slate-200" />}
            </React.Fragment>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-semibold px-4 py-3 rounded-2xl mb-5 flex items-center gap-2">
            <i className="fa-solid fa-circle-exclamation text-red-500" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Personal Info */}
          <div className="bg-white rounded-3xl p-5 shadow-sm space-y-4">
            <p className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <i className="fa-solid fa-user text-orange-500" /> Personal Info
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>First Name *</label>
                <input value={form.firstname} onChange={set('firstname')} required minLength={3} placeholder="Rahul" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Last Name</label>
                <input value={form.lastname} onChange={set('lastname')} placeholder="Das" className={inputClass} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Mobile Number *</label>
              <input
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                required pattern="[0-9]{10}"
                placeholder="10-digit number"
                type="tel"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Password *</label>
              <input value={form.password} onChange={set('password')} required minLength={6} type="password" placeholder="Min. 6 characters" className={inputClass} />
            </div>
          </div>

          {/* Vehicle Info */}
          <div className="bg-white rounded-3xl p-5 shadow-sm space-y-4">
            <p className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <i className="fa-solid fa-motorcycle text-orange-500" /> Vehicle Info
            </p>
            <div>
              <label className={labelClass}>Vehicle Type *</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { v: 'moto', icon: 'fa-motorcycle', label: 'Moto' },
                  { v: 'auto', icon: 'fa-car-side',   label: 'Auto' },
                  { v: 'car',  icon: 'fa-car',         label: 'Car' },
                ].map(t => (
                  <button
                    key={t.v} type="button"
                    onClick={() => setForm(f => ({ ...f, vehicleType: t.v }))}
                    className={`py-3 rounded-2xl border-2 flex flex-col items-center gap-1 transition-all ${form.vehicleType === t.v ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-slate-200 text-slate-500'}`}
                  >
                    <i className={`fa-solid ${t.icon} text-base`} />
                    <span className="text-[11px] font-bold">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Color *</label>
                <input value={form.vehicleColor} onChange={set('vehicleColor')} required minLength={3} placeholder="Black" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Capacity *</label>
                <input value={form.vehicleCapacity} onChange={set('vehicleCapacity')} required type="number" min={1} max={8} placeholder="2" className={inputClass} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Number Plate *</label>
              <input value={form.vehiclePlate} onChange={e => setForm(f => ({ ...f, vehiclePlate: e.target.value.toUpperCase() }))} required minLength={3} placeholder="WB 01 AB 1234" className={`${inputClass} uppercase tracking-widest`} />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#904d00] to-[#E67E00] text-white font-extrabold py-4 rounded-2xl shadow-lg shadow-orange-200 flex items-center justify-center gap-3 active:scale-95 transition-transform disabled:opacity-70"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <><span>Continue to Verification</span><i className="fa-solid fa-arrow-right" /></>
            )}
          </button>

          <p className="text-center text-sm text-slate-500">
            Already registered?{' '}
            <Link to="/captain-login" className="text-orange-600 font-bold hover:underline">Sign In</Link>
          </p>
        </form>
      </div>
    </div>
  )
}

export default KycLanding
