import React, { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router'
import axios from 'axios'
import { CaptainDataContext } from '../../context/CapatainContext'

const KycStep4 = () => {
  const navigate = useNavigate()
  const { setCaptain } = useContext(CaptainDataContext)
  const [kyc, setKyc] = useState(null)
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/kyc/me`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('captain_token')}` }
        })
        setKyc(res.data.kyc)
      } catch { } finally { setFetchLoading(false) }
    }
    fetch()
  }, [])

  const handleSubmit = async () => {
    if (!agreed) return
    setLoading(true); setError('')
    try {
      await axios.post(`${import.meta.env.VITE_BASE_URL}/kyc/submit`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('captain_token')}` }
      })
      // Re-fetch profile so context has updated kycStatus:'pending'
      // before CaptainHome's gate runs
      try {
        const profileRes = await axios.get(`${import.meta.env.VITE_BASE_URL}/captains/profile`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('captain_token')}` }
        })
        setCaptain(profileRes.data.captain)
      } catch { /* non-fatal; home will re-fetch via CaptainProtectWrapper */ }
      navigate('/captain-home')   // home shows KYC-pending banner
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed.')
    } finally { setLoading(false) }
  }

  const steps = [
    {
      icon: 'fa-id-card',
      title: "Driver's License",
      done: kyc?.drivingLicense?.frontUrl && kyc?.drivingLicense?.backUrl,
      detail: kyc?.drivingLicense?.number ? `License # ending in ${kyc.drivingLicense.number.slice(-4)}` : 'Uploaded',
      editPath: '/captain/kyc/step/1',
    },
    {
      icon: 'fa-motorcycle',
      title: 'Vehicle Info',
      done: kyc?.vehicle?.number && kyc?.vehicle?.model,
      detail: kyc ? `${kyc.vehicle?.model || ''} (${kyc.vehicle?.color || 'N/A'})` : '',
      editPath: '/captain/kyc/step/3',
    },
    {
      icon: 'fa-person',
      title: 'National ID / Passport',
      done: kyc?.identity?.frontUrl && kyc?.identity?.backUrl,
      detail: 'Uploaded 2 files (Front & Back)',
      editPath: '/captain/kyc/step/2',
    },
  ]

  if (fetchLoading) return (
    <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-orange-300 border-t-orange-600 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F5F5F0] font-['Inter'] flex flex-col">
      <header className="flex items-center justify-between px-5 pt-12 pb-4">
        <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center">
          <i className="fa-solid fa-arrow-left text-slate-700" />
        </button>
        <span className="text-orange-500 font-extrabold text-base">QuickBike Driver</span>
        <div className="w-9" />
      </header>

      <div className="flex-1 overflow-y-auto px-5 pb-6">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex gap-1 mb-2">
            {[1,2,3,4].map(i => <div key={i} className="h-1 flex-1 rounded-full bg-[#C85A00]" />)}
          </div>
          <span className="text-xs font-bold text-orange-500 uppercase tracking-widest">Step 4 of 4</span>
        </div>

        <h1 className="text-2xl font-black text-slate-900 mb-1">Review &amp; Submit</h1>
        <p className="text-slate-500 text-sm mb-6">Please confirm your details before submitting your application for verification.</p>

        {/* Review cards */}
        <div className="space-y-3 mb-6">
          {steps.map((s) => (
            <div key={s.title} className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center shrink-0">
                    <i className={`fa-solid ${s.icon} text-orange-400`} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{s.title}</p>
                    {s.done && <p className="text-slate-500 text-xs mt-0.5">{s.detail}</p>}
                  </div>
                </div>
                {s.done ? (
                  <span className="flex items-center gap-1.5 text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded-lg">
                    <i className="fa-solid fa-circle-check" /> Completed
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-orange-600 text-xs font-bold bg-orange-50 px-2 py-1 rounded-lg">
                    <i className="fa-solid fa-circle-exclamation" /> Pending
                  </span>
                )}
              </div>
              {s.done && (
                <button onClick={() => navigate(s.editPath)} className="mt-2 text-orange-500 text-xs font-bold ml-13">
                  Edit details
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Agreement */}
        <div
          className={`bg-white rounded-2xl p-4 border-2 transition-colors cursor-pointer ${agreed ? 'border-orange-400' : 'border-slate-100'}`}
          onClick={() => setAgreed(!agreed)}
        >
          <div className="flex items-start gap-3">
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${agreed ? 'border-orange-500 bg-orange-500' : 'border-slate-300'}`}>
              {agreed && <i className="fa-solid fa-check text-white text-[8px]" />}
            </div>
            <div>
              <p className="font-bold text-slate-800 text-sm">I agree to the QuickBike Partner Agreement</p>
              <p className="text-slate-500 text-xs mt-1">I certify that all information provided is accurate and I understand that background checks will be conducted in accordance with local regulations.</p>
            </div>
          </div>
        </div>

        {error && <p className="mt-3 text-red-500 text-xs font-semibold"><i className="fa-solid fa-circle-exclamation mr-1" />{error}</p>}
      </div>

      <div className="px-5 pb-10 pt-2">
        <button onClick={handleSubmit} disabled={!agreed || loading || steps.some(s => !s.done)} className={`w-full py-4 rounded-2xl font-extrabold text-base flex items-center justify-center gap-2 transition-all active:scale-95 ${agreed && !steps.some(s => !s.done) ? 'bg-gradient-to-r from-[#904d00] to-[#E67E00] text-white shadow-lg shadow-orange-200' : 'bg-slate-200 text-slate-400'}`}>
          {loading ? <><i className="fa-solid fa-circle-notch fa-spin" /> Submitting...</> : 'Submit Application'}
        </button>
        <p className="text-center text-xs text-slate-400 font-medium mt-3">
          <i className="fa-regular fa-clock mr-1" /> Verification usually takes 24-48 hours.
        </p>
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

export default KycStep4
