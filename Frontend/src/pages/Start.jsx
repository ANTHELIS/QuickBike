import React, { useEffect, useState } from 'react'
import { Link } from 'react-router'

/* animated floating bike dots for background texture */
const Dot = ({ style }) => (
  <div className="absolute w-2 h-2 rounded-full bg-orange-400/30 animate-pulse" style={style} />
)

const Start = () => {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  return (
    <div className="bg-[#1a0e05] min-h-screen flex justify-center font-['Inter']">
      <main className="w-full max-w-[390px] min-h-[100dvh] relative overflow-hidden flex flex-col">

        {/* ── Decorative background ── */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#2d1503] via-[#1a0e05] to-black pointer-events-none" />

        {/* Ambient glow blobs */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-orange-600/20 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute top-40 -right-16 w-56 h-56 bg-orange-500/15 rounded-full blur-[60px] pointer-events-none" />
        <div className="absolute bottom-32 left-8 w-40 h-40 bg-amber-600/10 rounded-full blur-[50px] pointer-events-none" />

        {/* Floating dots texture */}
        {[
          { top: '12%', left: '10%', animationDelay: '0s' },
          { top: '20%', right: '15%', animationDelay: '0.6s' },
          { top: '38%', left: '25%', animationDelay: '1.2s' },
          { top: '55%', right: '20%', animationDelay: '0.3s' },
          { top: '70%', left: '12%', animationDelay: '0.9s' },
        ].map((s, i) => <Dot key={i} style={s} />)}

        {/* ── Header ── */}
        <header className="relative z-10 flex items-center gap-2 px-6 pt-14 pb-4">
          <div className="w-8 h-8 bg-gradient-to-tr from-[#A85300] to-[#F5820D] rounded-xl flex items-center justify-center shadow-lg">
            <svg width="18" height="18" viewBox="0 0 36 36" fill="none">
              <path d="M18 3L30 12V27L18 33L6 27V12L18 3Z" fill="white" fillOpacity="0.3" />
              <path d="M18 10L24 14V22L18 26L12 22V14L18 10Z" fill="white" />
            </svg>
          </div>
          <span className="text-white font-extrabold text-lg tracking-tight">QuickBike</span>
        </header>

        {/* ── Hero illustration area ── */}
        <div className="relative z-10 flex-grow flex flex-col justify-between px-6 pb-10">

          {/* Big hero text */}
          <div className={`pt-12 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <span className="inline-flex items-center gap-2 bg-orange-500/20 border border-orange-500/30 text-orange-400 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse"></span>
              Available Now in Your City
            </span>

            <h1 className="text-[3.2rem] font-black text-white leading-[1.05] font-['Manrope'] mb-5">
              Your ride,<br />
              <span className="bg-gradient-to-r from-[#F5820D] to-[#ffb347] bg-clip-text text-transparent">
                in seconds.
              </span>
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed max-w-[280px]">
              Fastest bike taxis & rides in your city. Safe, affordable, and always on time.
            </p>
          </div>

          {/* Stats row */}
          <div className={`flex gap-0 my-10 transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {[
              { value: '2 Min', label: 'Avg Pickup' },
              { value: '50K+', label: 'Daily Rides' },
              { value: '4.9★', label: 'Rating' },
            ].map((s, i) => (
              <div key={i} className={`flex-1 text-center ${i < 2 ? 'border-r border-white/10' : ''}`}>
                <p className="text-white font-black text-xl">{s.value}</p>
                <p className="text-slate-500 text-[10px] font-semibold uppercase tracking-widest mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Big bike emoji / illustration */}
          <div className="text-[5rem] text-center my-4 leading-none select-none">🏍️</div>

          {/* CTA Buttons */}
          <div className={`flex flex-col gap-3 mt-auto transition-all duration-700 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <Link
              to="/login"
              className="w-full bg-gradient-to-r from-[#A85300] to-[#F5820D] py-4 rounded-full text-white font-extrabold text-base flex items-center justify-center gap-2 shadow-xl shadow-orange-900/50 active:scale-95 transition-transform"
            >
              Get Started — It's Free
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>

            <Link
              to="/captain-login"
              className="w-full bg-white/10 border border-white/20 py-4 rounded-full text-white font-bold text-base flex items-center justify-center gap-2 active:scale-95 transition-transform hover:bg-white/15 backdrop-blur-sm"
            >
              <i className="fa-solid fa-motorcycle text-orange-400"></i>
              Drive with QuickBike
            </Link>

            <p className="text-center text-slate-600 text-xs font-medium mt-2">
              Already have an account?{' '}
              <Link to="/login" className="text-orange-400 font-bold hover:underline">Sign in</Link>
            </p>
          </div>
        </div>

      </main>
    </div>
  )
}

export default Start