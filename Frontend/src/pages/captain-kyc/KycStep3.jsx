import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router'
import axios from 'axios'

const currentYear = new Date().getFullYear()
const years = Array.from({ length: 15 }, (_, i) => currentYear - i)

const KycStep3 = () => {
  const navigate = useNavigate()
  const [form, setForm] = useState({ vehicleNumber: '', vehicleModel: '', vehicleYear: currentYear, vehicleColor: '' })
  const [rcFile, setRcFile] = useState(null)
  const [rcPreview, setRcPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const rcRef = useRef()

  const handleRc = (file) => {
    if (!file) return
    setRcFile(file)
    if (file.type === 'application/pdf') setRcPreview('pdf')
    else setRcPreview(URL.createObjectURL(file))
  }

  const canContinue = form.vehicleNumber && form.vehicleModel && rcFile

  const handleSubmit = async () => {
    if (!canContinue) return
    setLoading(true); setError('')
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      fd.append('rcDocument', rcFile)
      await axios.post(`${import.meta.env.VITE_BASE_URL}/kyc/step/3`, fd, {
        headers: { Authorization: `Bearer ${localStorage.getItem('captain_token')}`, 'Content-Type': 'multipart/form-data' },
      })
      navigate('/captain/kyc/step/4')
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed.')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-[#F5F5F0] font-['Inter'] flex flex-col">
      <header className="flex items-center justify-between px-5 pt-12 pb-4">
        <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center">
          <i className="fa-solid fa-arrow-left text-slate-700" />
        </button>
        <span className="font-extrabold text-slate-900 text-base">Registration</span>
        <span className="text-orange-500 font-extrabold text-xs">QuickBike Driver</span>
      </header>

      <div className="flex-1 overflow-y-auto pb-6">
        {/* Progress */}
        <div className="px-5 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-orange-500 uppercase tracking-widest">Step 3 of 4</span>
            <span className="text-xs font-bold text-slate-800">75%</span>
          </div>
          <div className="flex gap-1">
            {[1,2,3,4].map(i => <div key={i} className={`h-1 flex-1 rounded-full ${i <= 3 ? 'bg-[#C85A00]' : 'bg-slate-200'}`} />)}
          </div>
        </div>

        {/* Vehicle hero image */}
        <div className="relative h-44 mx-5 mb-5 rounded-2xl overflow-hidden bg-slate-700">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 to-transparent flex items-end p-5">
            <p className="text-white font-bold text-lg">Tell us about your ride</p>
          </div>
          <div className="absolute inset-0 flex items-center justify-end pr-4 opacity-70 text-6xl select-none">🛵</div>
        </div>

        <div className="px-5 space-y-4">
          <h1 className="text-2xl font-black text-slate-900">Vehicle Information</h1>

          {/* Vehicle Number */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Vehicle Number</label>
            <div className="relative">
              <input
                value={form.vehicleNumber}
                onChange={e => setForm(f => ({ ...f, vehicleNumber: e.target.value.toUpperCase() }))}
                placeholder="e.g. KA 01 AB 1234"
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 pr-12 text-sm font-bold text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
              <i className="fa-solid fa-motorcycle absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" />
            </div>
          </div>

          {/* Model */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Model</label>
            <input
              value={form.vehicleModel}
              onChange={e => setForm(f => ({ ...f, vehicleModel: e.target.value }))}
              placeholder="e.g. Honda Activa"
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-medium text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </div>

          {/* Color */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Color</label>
            <input
              value={form.vehicleColor}
              onChange={e => setForm(f => ({ ...f, vehicleColor: e.target.value }))}
              placeholder="e.g. Black"
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-medium text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </div>

          {/* Year */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Year</label>
            <select
              value={form.vehicleYear}
              onChange={e => setForm(f => ({ ...f, vehicleYear: e.target.value }))}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-300 appearance-none"
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          {/* RC Document */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">RC (Registration Certificate)</label>
            <div
              onClick={() => rcRef.current?.click()}
              className={`rounded-2xl border-2 border-dashed cursor-pointer transition-all overflow-hidden ${rcPreview ? 'border-orange-400 bg-orange-50' : 'border-slate-200 bg-white'}`}
            >
              <input ref={rcRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={e => handleRc(e.target.files[0])} />
              {rcPreview ? (
                rcPreview === 'pdf' ? (
                  <div className="py-6 flex flex-col items-center gap-2">
                    <i className="fa-solid fa-file-pdf text-orange-400 text-3xl" />
                    <p className="text-sm font-bold text-slate-700">PDF Uploaded</p>
                    <span className="text-xs text-orange-500 font-bold">Tap to change</span>
                  </div>
                ) : (
                  <div className="relative h-36">
                    <img src={rcPreview} className="w-full h-full object-cover" alt="RC" />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <span className="text-white text-xs font-bold bg-black/50 px-3 py-1.5 rounded-full">Tap to change</span>
                    </div>
                  </div>
                )
              ) : (
                <div className="py-8 flex flex-col items-center gap-3">
                  <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center">
                    <i className="fa-solid fa-cloud-arrow-up text-orange-400 text-xl" />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-slate-700 text-sm">Upload Image or PDF</p>
                    <p className="text-slate-400 text-xs">Max size 5MB (JPG, PNG, PDF)</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RC hint */}
          <div className="flex items-start gap-3 bg-orange-50 rounded-xl p-3 border border-orange-100">
            <i className="fa-solid fa-circle-info text-orange-400 mt-0.5 shrink-0" />
            <p className="text-xs text-slate-600">Ensure the vehicle number and owner name are clearly visible in the RC document. This speeds up our verification process.</p>
          </div>

          {error && <p className="text-red-500 text-xs font-semibold"><i className="fa-solid fa-circle-exclamation mr-1" />{error}</p>}
        </div>
      </div>

      <div className="px-5 pb-10 pt-2">
        <button onClick={handleSubmit} disabled={!canContinue || loading} className={`w-full py-4 rounded-2xl font-extrabold text-base flex items-center justify-center gap-2 transition-all active:scale-95 ${canContinue ? 'bg-gradient-to-r from-[#904d00] to-[#E67E00] text-white shadow-lg shadow-orange-200' : 'bg-slate-200 text-slate-400'}`}>
          {loading ? <><i className="fa-solid fa-circle-notch fa-spin" /> Uploading...</> : 'Continue to Final Step'}
        </button>
      </div>

      <nav className="bg-white border-t border-slate-100 flex">
        {[{ icon: 'fa-id-card', label: 'Registration', active: true }, { icon: 'fa-graduation-cap', label: 'Training' }, { icon: 'fa-headset', label: 'Support' }].map(n => (
          <button key={n.label} className={`flex-1 py-3 flex flex-col items-center gap-1 text-[10px] font-bold ${n.active ? 'text-orange-500' : 'text-slate-400'}`}>
            <i className={`fa-solid ${n.icon} text-base`} />{n.label}
          </button>
        ))}
      </nav>
    </div>
  )
}

export default KycStep3
