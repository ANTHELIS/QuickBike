import React, { useContext } from 'react'
import { useNavigate } from 'react-router'
import { CaptainDataContext } from '../../context/CapatainContext'

const KycPending = () => {
  const navigate = useNavigate()
  const { captain } = useContext(CaptainDataContext)

  const steps = [
    { label: 'Application Submitted', done: true },
    { label: 'Document Verification', done: false, current: true },
    { label: 'Background Check', done: false },
    { label: 'Account Activation', done: false },
  ]

  return (
    <div className="min-h-screen bg-[#F5F5F0] font-['Inter'] flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        {/* Animated icon */}
        <div className="relative mb-8">
          <div className="w-28 h-28 rounded-full bg-orange-100 flex items-center justify-center mx-auto">
            <div className="w-20 h-20 rounded-full bg-orange-200 flex items-center justify-center">
              <i className="fa-solid fa-hourglass-half text-orange-500 text-4xl animate-pulse" />
            </div>
          </div>
          <div className="absolute top-0 right-0 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
            <i className="fa-solid fa-shield-halved text-white text-sm" />
          </div>
        </div>

        <h1 className="text-3xl font-black text-slate-900 mb-3">Application<br />Under Review</h1>
        <p className="text-slate-500 text-sm max-w-xs mx-auto mb-8">
          Hi <span className="font-bold text-slate-700">{captain?.fullname?.firstname || 'there'}</span>! We've received your application and our team is reviewing it. You'll be notified once approved.
        </p>

        {/* Timeline */}
        <div className="w-full max-w-xs bg-white rounded-2xl p-5 shadow-sm text-left mb-6">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Review Progress</p>
          {steps.map((step, i) => (
            <div key={step.label} className="flex items-start gap-3 mb-3 last:mb-0">
              <div className="flex flex-col items-center">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${step.done ? 'bg-green-500' : step.current ? 'bg-orange-500 animate-pulse' : 'bg-slate-200'}`}>
                  {step.done && <i className="fa-solid fa-check text-white text-[8px]" />}
                  {step.current && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
                {i < steps.length - 1 && <div className={`w-0.5 h-5 mt-1 ${step.done ? 'bg-green-300' : 'bg-slate-200'}`} />}
              </div>
              <div className={`pt-0.5 ${step.done ? 'text-slate-800' : step.current ? 'text-orange-600' : 'text-slate-400'}`}>
                <p className={`text-sm ${step.current ? 'font-bold' : 'font-medium'}`}>{step.label}</p>
                {step.current && <p className="text-[10px] text-orange-400 font-semibold mt-0.5">In progress — est. 24-48 hours</p>}
              </div>
            </div>
          ))}
        </div>

        {/* Expected */}
        <div className="bg-white rounded-2xl px-5 py-4 shadow-sm flex items-center gap-4 w-full max-w-xs mb-6">
          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
            <i className="fa-regular fa-calendar text-slate-500" />
          </div>
          <div className="text-left">
            <p className="text-xs text-slate-400 font-semibold">Estimated Approval</p>
            <p className="font-black text-slate-900">Within 48 hours</p>
          </div>
        </div>

        <p className="text-xs text-slate-400 mb-6">You'll receive a notification once your account is verified.</p>
      </div>

      <div className="px-5 pb-10">
        <button
          onClick={() => navigate('/captain-login')}
          className="w-full border-2 border-slate-200 py-4 rounded-2xl font-bold text-slate-700 bg-white active:scale-95 transition-transform"
        >
          Back to Login
        </button>
      </div>
    </div>
  )
}

export default KycPending
