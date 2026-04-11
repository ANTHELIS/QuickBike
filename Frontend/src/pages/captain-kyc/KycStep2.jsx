import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router'
import axios from 'axios'

const KycStep2 = () => {
  const navigate = useNavigate()
  const [files, setFiles] = useState({ front: null, back: null })
  const [previews, setPreviews] = useState({ front: null, back: null })
  const [idType, setIdType] = useState('aadhaar')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const frontRef = useRef()
  const backRef = useRef()

  const handleFile = (side, file) => {
    if (!file) return
    setFiles(f => ({ ...f, [side]: file }))
    setPreviews(p => ({ ...p, [side]: URL.createObjectURL(file) }))
  }

  const canContinue = files.front && files.back

  const handleSubmit = async () => {
    if (!canContinue) return
    setLoading(true); setError('')
    try {
      const fd = new FormData()
      fd.append('idCardFront', files.front)
      fd.append('idCardBack', files.back)
      fd.append('idType', idType)
      await axios.post(`${import.meta.env.VITE_BASE_URL}/kyc/step/2`, fd, {
        headers: { Authorization: `Bearer ${localStorage.getItem('captain_token')}`, 'Content-Type': 'multipart/form-data' },
      })
      navigate('/captain/kyc/step/3')
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed.')
    } finally { setLoading(false) }
  }

  const UploadBox = ({ side, label, hint, inputRef }) => (
    <div onClick={() => inputRef.current?.click()} className={`relative rounded-2xl border-2 border-dashed cursor-pointer transition-all overflow-hidden ${previews[side] ? 'border-orange-400 bg-orange-50' : 'border-slate-200 bg-white'}`}>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => handleFile(side, e.target.files[0])} />
      {previews[side] ? (
        <div className="relative h-40">
          <img src={previews[side]} alt={label} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
            <span className="text-white text-xs font-bold bg-black/50 px-3 py-1.5 rounded-full"><i className="fa-solid fa-check mr-1" />Uploaded · Tap to change</span>
          </div>
        </div>
      ) : (
        <div className="py-8 flex flex-col items-center gap-3">
          <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center">
            <i className="fa-solid fa-camera-retro text-orange-400 text-2xl" />
          </div>
          <div className="text-center">
            <p className="font-bold text-slate-700 text-sm">{label}</p>
            <p className="text-slate-400 text-xs mt-0.5">{hint}</p>
          </div>
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
        <div className="text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Identity Verification</p>
          <p className="text-orange-500 font-extrabold text-sm">QuickBike Driver</p>
        </div>
        <div className="w-9" />
      </header>

      <div className="flex-1 overflow-y-auto px-5 pb-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-orange-500 uppercase tracking-widest">Step 2 of 4</span>
            <span className="text-xs text-slate-400 font-semibold">50% Complete</span>
          </div>
          <div className="flex gap-1">
            {[1,2,3,4].map(i => <div key={i} className={`h-1 flex-1 rounded-full ${i <= 2 ? 'bg-[#C85A00]' : 'bg-slate-200'}`} />)}
          </div>
        </div>

        <h1 className="text-2xl font-black text-slate-900 mb-2">Upload your ID card</h1>
        <p className="text-slate-500 text-sm mb-5">To verify your identity, please upload a clear photo of your Aadhaar or Voter ID card.</p>

        {/* ID Type selector */}
        <div className="flex gap-2 mb-5">
          {[['aadhaar', 'Aadhaar'], ['voter_id', 'Voter ID'], ['passport', 'Passport']].map(([val, label]) => (
            <button key={val} onClick={() => setIdType(val)} className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${idType === val ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-slate-500 border-slate-200'}`}>{label}</button>
          ))}
        </div>

        <div className="space-y-3 mb-5">
          <UploadBox side="front" label="ID Front" hint="Ensure all text is readable and the photo is clear" inputRef={frontRef} />
          <UploadBox side="back" label="ID Back" hint="Capture the address and barcode clearly" inputRef={backRef} />
        </div>

        {/* Tips */}
        <div className="bg-orange-50 rounded-2xl p-4 border border-orange-100">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 bg-orange-100 rounded-full flex items-center justify-center">
              <i className="fa-solid fa-lightbulb text-orange-500 text-xs" />
            </div>
            <span className="text-sm font-bold text-slate-700">Quick Tips for Approval</span>
          </div>
          {['Use a flat surface and natural lighting.', 'Avoid camera flash or overhead glare.', 'Place the card within the frame guide.'].map(t => (
            <div key={t} className="flex items-start gap-2 mb-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 shrink-0" />
              <span className="text-xs text-slate-600">{t}</span>
            </div>
          ))}
        </div>

        {error && <p className="text-red-500 text-xs font-semibold mt-3"><i className="fa-solid fa-circle-exclamation mr-1" />{error}</p>}
      </div>

      <div className="px-5 pb-10 pt-2">
        <button onClick={handleSubmit} disabled={!canContinue || loading} className={`w-full py-4 rounded-2xl font-extrabold text-base flex items-center justify-center gap-2 transition-all active:scale-95 ${canContinue ? 'bg-gradient-to-r from-[#904d00] to-[#E67E00] text-white shadow-lg shadow-orange-200' : 'bg-slate-200 text-slate-400'}`}>
          {loading ? <><i className="fa-solid fa-circle-notch fa-spin" /> Uploading...</> : <>Continue <i className="fa-solid fa-arrow-right" /></>}
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

export default KycStep2
