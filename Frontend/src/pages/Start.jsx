import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSiteConfig } from '../context/SiteConfigContext'

const Start = () => {
  const [mounted, setMounted] = useState(false)
  const { getBanner } = useSiteConfig()
  useEffect(() => { setMounted(true) }, [])

  return (
    <div className="min-h-screen w-full flex font-['Inter'] relative overflow-hidden bg-[#FAFAFA] text-[#1a1a1a] brand-page-bg">
      
      {/* ── DYNAMIC MESH GRADIENT BACKGROUND ── */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#FFE4C4] rounded-full mix-blend-multiply filter blur-[120px] opacity-70 animate-pulse pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#E0F2FE] rounded-full mix-blend-multiply filter blur-[100px] opacity-60 animate-pulse pointer-events-none z-0" style={{animationDelay: '2s'}}></div>
      <div className="absolute top-[20%] right-[20%] w-[30%] h-[30%] bg-[#FFDAB9] rounded-full mix-blend-multiply filter blur-[80px] opacity-50 animate-pulse pointer-events-none z-0" style={{animationDelay: '4s'}}></div>

      {/* ── DESKTOP LEFT DYNAMIC IMAGE BANNER ── */}
      <div className="hidden md:flex md:w-1/2 relative overflow-hidden p-6 z-10 perspective-1000 pointer-events-none">
        <div className="relative w-full h-full rounded-[40px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.1)] group pointer-events-auto">
          <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-transparent to-black/60 z-10 pointer-events-none" />
          
          <img 
            src={getBanner('hero')} 
            alt="City Commute" 
            className="absolute inset-0 w-full h-full object-cover object-center scale-105 group-hover:scale-110 transition-transform duration-[10s] ease-out pointer-events-none"
          />
          
          {/* Floating Glassmorphic Stat Card */}
          <div className={`absolute bottom-12 left-12 right-12 z-20 bg-white/40 backdrop-blur-2xl border border-white/60 rounded-3xl p-8 shadow-[0_30px_60px_rgba(0,0,0,0.12)] transition-all duration-1000 ease-[cubic-bezier(0.25,1,0.5,1)] ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'}`}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="brand-btn w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30">
                  <i className="fa-solid fa-bolt text-white text-xl" />
                </div>
                <div>
                  <h3 className="text-gray-900 font-extrabold text-lg">Hyper-Fast Arrival</h3>
                  <p className="text-gray-700 font-medium text-sm">Beating city traffic instantly.</p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="brand-surface backdrop-blur-md rounded-2xl p-4 flex-1 border border-white/50 text-center hover:-translate-y-1 transition-transform duration-300">
                <span className="block text-2xl font-black brand-text-primary">2<span className="brand-text-secondary text-lg">m</span></span>
                <span className="brand-text-muted text-[10px] uppercase font-bold tracking-widest block mt-1">Pickup Time</span>
              </div>
              <div className="brand-surface backdrop-blur-md rounded-2xl p-4 flex-1 border border-white/50 text-center hover:-translate-y-1 transition-transform duration-300">
                <span className="block text-2xl font-black brand-text-primary">48<span className="brand-text-secondary text-lg">K+</span></span>
                <span className="brand-text-muted text-[10px] uppercase font-bold tracking-widest block mt-1">Daily Trips</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL (Hero Content) ── */}
      <div className="w-full md:w-1/2 flex flex-col relative px-6 md:px-12 xl:px-24 z-20 min-h-[100dvh]">
        
        {/* Header - Ensure relative z-50 to stay above the hero margin overlap */}
        <header className="flex items-center justify-between py-8 w-full relative z-50">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 group-hover:shadow-[0_8px_30px_rgba(245,130,13,0.15)] transition-all duration-300">
              <svg width="24" height="24" viewBox="0 0 36 36" fill="none">
                <path d="M18 3L30 12V27L18 33L6 27V12L18 3Z" fill="#F5820D" fillOpacity="0.2" />
                <path d="M18 10L24 14V22L18 26L12 22V14L18 10Z" fill="#F5820D" />
              </svg>
            </div>
            <span className="text-gray-900 font-extrabold text-2xl tracking-tighter italic">QuickBike</span>
          </div>
          
          <div className="hidden md:flex items-center gap-6">
            <Link to="/login" className="px-6 py-2.5 rounded-xl font-bold text-[13px] text-gray-600 hover:text-gray-900 hover:bg-white border border-transparent hover:border-gray-200 transition-all shadow-sm">
              Sign In
            </Link>
            <Link to="/signup" className="px-6 py-2.5 rounded-xl font-bold text-[13px] text-white bg-gray-900 hover:bg-black transition-all shadow-[0_4px_14px_rgba(0,0,0,0.2)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.25)] hover:-translate-y-0.5">
              Sign Up
            </Link>
          </div>
        </header>

        {/* Hero Content */}
        <div className="flex-grow flex flex-col justify-center max-w-[500px] w-full mx-auto md:mx-0 xl:ml-8 2xl:ml-12 pb-12 lg:pb-0 pt-4 md:pt-0 mt-0 md:-mt-16 lg:-mt-24 z-10 relative">
          
          <div className={`transition-all duration-1000 ease-[cubic-bezier(0.25,1,0.5,1)] ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'}`}>
            <div className="inline-flex items-center gap-3 bg-white/60 backdrop-blur-xl border border-white shadow-sm px-4 py-2 rounded-full mb-6 md:mb-8">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#fdf3e8]">
                <span className="brand-bg w-2.5 h-2.5 rounded-full animate-ping absolute"></span>
                <span className="brand-bg w-2.5 h-2.5 rounded-full relative"></span>
              </span>
              <span className="text-[10px] md:text-[11px] font-bold text-gray-700 uppercase tracking-widest">Available in your city</span>
            </div>

            <h1 className="brand-heading text-[46px] md:text-[72px] font-black leading-[1.05] font-['Manrope'] mb-4 md:mb-6 tracking-tight drop-shadow-sm">
              Your ride,<br />
              <span className="brand-text filter drop-shadow-lg">
                in seconds.
              </span>
            </h1>
            <p className="brand-text-muted text-[15px] md:text-[18px] font-medium leading-relaxed max-w-[380px] mb-10 md:mb-12">
              Transform your daily commute. Experience the fastest, safest, and most intelligent bike taxis on the planet.
            </p>
          </div>

          {/* CTA Buttons - Premium Glass effect & Gradients */}
          <div className={`flex flex-col sm:flex-row gap-5 transition-all duration-1000 delay-200 ease-[cubic-bezier(0.25,1,0.5,1)] ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
            <Link
              to="/signup"
              className="brand-btn group relative flex-1 flex items-center justify-center gap-3 px-8 py-5 rounded-[20px] text-white font-extrabold text-[15px] tracking-wide transition-all duration-300 shadow-[0_10px_30px_rgba(245,130,13,0.3)] hover:-translate-y-1 overflow-hidden"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-tr from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
              <span>GET STARTED</span>
              <i className="fa-solid fa-arrow-right group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              to="/captain-login"
              className="flex-1 flex items-center justify-center gap-3 px-8 py-5 rounded-[20px] bg-white/50 backdrop-blur-xl border border-white/80 text-gray-800 font-extrabold text-[15px] tracking-wide transition-all duration-300 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:bg-white hover:shadow-[0_15px_35px_rgb(0,0,0,0.08)] hover:-translate-y-1"
            >
              <i className="brand-text fa-solid fa-motorcycle text-lg"></i>
              DRIVE WITH US
            </Link>
          </div>
          
          <div className={`mt-10 md:hidden text-center transition-all duration-1000 delay-400 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
            <p className="text-[14px] text-gray-500 font-medium">
              Already have an account?{' '}
              <Link to="/login" className="brand-text brand-text-hover font-black transition-colors underline underline-offset-4">
                Sign in
              </Link>
            </p>
          </div>

        </div>

      </div>
      
      {/* Custom Keyframes for shimmers */}
      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  )
}

export default Start