import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router'
import axios from 'axios'

const KycStep1 = () => {
  const navigate = useNavigate()
  const [files, setFiles] = useState({ front: null, back: null })
  const [previews, setPreviews] = useState({ front: null, back: null })
  const [licenseNumber, setLicenseNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const frontRef = useRef()
  const backRef = useRef()

  const handleFile = (side, file) => {
    if (!file) return
    setFiles(f => ({ ...f, [side]: file }))
    const url = URL.createObjectURL(file)
    setPreviews(p => ({ ...p, [side]: url }))
  }

  const canContinue = files.front && files.back

  const handleSubmit = async () => {
    if (!canContinue) return
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('captain_token')
      const fd = new FormData()
      fd.append('drivingLicenseFront', files.front)
      fd.append('drivingLicenseBack', files.back)
      fd.append('licenseNumber', licenseNumber)
      await axios.post(`${import.meta.env.VITE_BASE_URL}/kyc/step/1`, fd, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      })
      navigate('/captain/kyc/step/2')
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const UploadBox = ({ side, label, hint, inputRef }) => (
    <div
      onClick={() => inputRef.current?.click()}
      className={`relative rounded-2xl border-2 border-dashed cursor-pointer transition-all overflow-hidden ${
        previews[side] ? 'border-orange-400 bg-orange-50' : 'border-slate-200 bg-white'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => handleFile(side, e.target.files[0])}
      />
      {previews[side] ? (
        <div className="relative h-40">
          <img src={previews[side]} alt={label} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
            <span className="text-white text-xs font-bold bg-black/50 px-3 py-1.5 rounded-full">
              <i className="fa-solid fa-check mr-1" />Uploaded · Tap to change
            </span>
          </div>
        </div>
      ) : (
        <div className="py-8 flex flex-col items-center gap-3">
          <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center">
            <i className="fa-solid fa-camera text-orange-400 text-2xl" />
          </div>
          <div className="text-center">
            <p className="font-bold text-slate-700 text-sm">{label}</p>
            <p className="text-slate-400 text-xs mt-0.5">{hint}</p>
          </div>
          <span className="text-orange-500 text-xs font-bold flex items-center gap-1">
            <i className="fa-solid fa-arrow-up-from-bracket" /> TAP TO UPLOAD
          </span>
        </div>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F5F5F0] font-['Inter'] flex flex-col">
      <header className="flex items-center justify-between px-5 pt-12 pb-4">
        <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center">
          <i className="fa-solid fa-arrow-left text-slate-700" />
        </button>
        <span className="text-orange-500 font-extrabold text-base">QuickBike Driver</span>
        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-xs font-black">UB</div>
      </header>

      <div className="flex-1 overflow-y-auto px-5 pb-6">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-orange-500 uppercase tracking-widest">Step 1 of 4</span>
          </div>
          <div className="flex gap-1">
            {[1,2,3,4].map(i => (
              <div key={i} className={`h-1 flex-1 rounded-full ${i === 1 ? 'bg-[#C85A00]' : 'bg-slate-200'}`} />
            ))}
          </div>
        </div>

        <h1 className="text-2xl font-black text-slate-900 mb-2">Upload Driving License</h1>
        <p className="text-slate-500 text-sm mb-6">Please upload a clear photo of your valid DL (Front &amp; Back)</p>

        <div className="space-y-3 mb-5">
          <UploadBox side="front" label="Front Side" hint="Ensure the photo is readable and not blurred" inputRef={frontRef} />
          <UploadBox side="back" label="Back Side" hint="Make sure the expiry date is clearly visible" inputRef={backRef} />
        </div>

        {/* License number (optional) */}
        <div className="mb-5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">License Number (Optional)</label>
          <input
            value={licenseNumber}
            onChange={e => setLicenseNumber(e.target.value)}
            placeholder="e.g. WB1920224321"
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
        </div>

        {/* Guidelines */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
          <div className="flex items-center gap-2 mb-3">
            <i className="fa-solid fa-lightbulb text-orange-400" />
            <span className="text-sm font-bold text-slate-700">Quick Guidelines</span>
          </div>
          {['Avoid glares from camera flash', 'Place ID on a flat, neutral surface', 'Capture all four corners of the document'].map(tip => (
            <div key={tip} className="flex items-start gap-2 mb-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
              <span className="text-xs text-slate-500">{tip}</span>
            </div>
          ))}
        </div>

        {error && <p className="text-red-500 text-xs font-semibold mt-3 flex items-center gap-1.5"><i className="fa-solid fa-circle-exclamation" />{error}</p>}
      </div>

      <div className="px-5 pb-10 pt-2 bg-[#F5F5F0]">
        <button
          onClick={handleSubmit}
          disabled={!canContinue || loading}
          className={`w-full py-4 rounded-2xl font-extrabold text-base flex items-center justify-center gap-2 transition-all active:scale-95 ${
            canContinue ? 'bg-gradient-to-r from-[#904d00] to-[#E67E00] text-white shadow-lg shadow-orange-200' : 'bg-slate-200 text-slate-400'
          }`}
        >
          {loading ? <><i className="fa-solid fa-circle-notch fa-spin" /> Uploading...</> : <>Continue <i className="fa-solid fa-arrow-right" /></>}
        </button>
      </div>

      <nav className="bg-white border-t border-slate-100 flex">
        {[
          { icon: 'fa-id-card', label: 'Registration', active: true },
          { icon: 'fa-graduation-cap', label: 'Training', active: false },
          { icon: 'fa-headset', label: 'Support', active: false },
        ].map(n => (
          <button key={n.label} className={`flex-1 py-3 flex flex-col items-center gap-1 text-[10px] font-bold ${n.active ? 'text-orange-500' : 'text-slate-400'}`}>
            <i className={`fa-solid ${n.icon} text-base`} />
            {n.label}
          </button>
        ))}
      </nav>
    </div>
  )
}

export default KycStep1
