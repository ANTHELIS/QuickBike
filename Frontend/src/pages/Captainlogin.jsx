import React, { useState, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { CaptainDataContext } from '../context/CapatainContext'
import { useSiteConfig } from '../context/SiteConfigContext'

const Captainlogin = () => {
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { setCaptain } = useContext(CaptainDataContext)
  const navigate = useNavigate()
  const { getBanner } = useSiteConfig() // triggers CSS injection

  const submitHandler = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/captains/login`, { phone, password })
      if (response.status === 200) {
        setCaptain(response.data.captain)
        localStorage.setItem('captain_token', response.data.token)
        // Always go to captain-home; the home page handles KYC state (pending/rejected/approved)
        navigate('/captain-home')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex font-['Inter'] bg-[#121212] text-gray-100">
      
      {/* ── DESKTOP LEFT IMAGE BANNER ── */}
      <div className="hidden lg:flex lg:w-5/12 relative bg-[#121212] overflow-hidden pointer-events-none">
        {/* Gradients to seamlessly blend the image */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-[#121212] z-10" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#121212] via-[#121212]/50 to-transparent z-10" />
        
        {/* Background Image (Dark urban bike feel) */}
        <img 
          src="https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=2070&auto=format&fit=crop" 
          alt="Delivery Bike" 
          className="absolute inset-0 w-[120%] h-full object-cover object-[20%_bottom] select-none mix-blend-luminosity opacity-40 brightness-75 -ml-12"
        />
        
        {/* Floating Stat Card */}
        <div className="absolute bottom-16 left-12 z-20 bg-[#2a2a2a]/30 backdrop-blur-xl border border-white/5 rounded-2xl p-6 max-w-sm shadow-2xl">
          <div className="flex items-center gap-3 mb-3">
             <i className="fa-solid fa-bolt text-[#F5820D] text-lg" />
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-300">Performance Driven</span>
          </div>
          <p className="text-[15px] text-gray-300 font-medium leading-relaxed">
            Precision engineering meets urban mobility. The future of delivery is here.
          </p>
        </div>
      </div>

      {/* ── RIGHT PANEL (Auth Form & Nav) ── */}
      <div className="w-full lg:w-7/12 flex flex-col relative px-6 md:px-16 xl:px-24">
        
        {/* Desktop Navbar Overlay (Only visible on lg) */}
        <nav className="hidden lg:flex items-center justify-between py-10 z-20 absolute top-0 left-6 md:left-16 xl:left-24 right-6 md:right-16 xl:right-24 w-[calc(100%-3rem)] md:w-[calc(100%-8rem)] xl:w-[calc(100%-12rem)]">
          <Link to="/" className="text-2xl font-black italic brand-text tracking-tighter hover:opacity-80 transition-opacity">
            QuickBike
          </Link>
          <div className="flex items-center gap-8 ml-auto">
            <Link to="/login" className="text-[12px] font-bold text-gray-300 hover:text-white transition-colors uppercase tracking-widest">
              Sign In
            </Link>
            <Link to="/captain/kyc" className="text-[11px] font-black text-white uppercase tracking-widest brand-btn px-6 py-3 rounded-md transition-all">
              Get Started
            </Link>
          </div>
        </nav>

        {/* Mobile Header (Only visible below lg) */}
        <header className="lg:hidden flex items-center justify-between py-6">
          <Link to="/" className="text-2xl font-black italic brand-text tracking-tighter">
            QuickBike
          </Link>
          <Link to="/login" className="w-8 h-8 flex items-center justify-center bg-gray-800 rounded-full text-gray-400 hover:text-white transition-colors">
            <i className="fa-solid fa-user" />
          </Link>
        </header>

        {/* Form Container */}
        <div className="flex-grow flex flex-col justify-center max-w-[420px] w-full mx-auto lg:mx-0 xl:ml-12 2xl:ml-24 pb-12 lg:pb-0 z-10 pt-20 lg:pt-0">
          
          <h1 className="text-4xl md:text-[50px] font-black text-white font-['Manrope'] mb-8 tracking-tight leading-[1.1]">Drive with QuickBike</h1>
          
          {/* Feature Bullets mapped from design */}
          <div className="flex flex-col gap-4 mb-10">
            <div className="flex items-center gap-4 text-gray-300">
              <div className="w-6 h-6 flex items-center justify-center bg-[#87CEEB] text-[#121212] rounded-md shrink-0"><i className="fa-solid fa-wallet text-sm" /></div>
              <span className="text-[17px] font-medium text-gray-300">Earn up to ₹40,000/month</span>
            </div>
            <div className="flex items-center gap-4 text-gray-300">
              <div className="w-6 h-6 flex items-center justify-center bg-[#87CEEB] text-[#121212] rounded-md shrink-0"><i className="fa-solid fa-clock text-sm" /></div>
              <span className="text-[17px] font-medium text-gray-300">Flexible hours</span>
            </div>
            <div className="flex items-center gap-4 text-gray-300">
              <div className="w-6 h-6 flex items-center justify-center bg-[#87CEEB] text-[#121212] rounded-md shrink-0"><i className="fa-solid fa-bolt text-sm" /></div>
              <span className="text-[17px] font-medium text-gray-300">Instant payouts</span>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border-l-4 border-red-500 p-4 mb-8 rounded-r-lg flex items-center gap-3">
              <i className="fa-solid fa-circle-exclamation text-red-500 text-lg"></i>
              <span className="text-sm font-semibold text-red-400">{error}</span>
            </div>
          )}

          <form onSubmit={submitHandler} className="space-y-6">
            
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] block mb-2 px-1">Phone Number</label>
              <div className="flex bg-[#161616] border border-[#2a2a2a] rounded-md overflow-hidden brand-focus transition-colors relative">
                <div className="bg-[#1a1a1a] px-4 py-4 border-r border-[#2a2a2a] flex items-center gap-2 select-none">
                  <span className="text-sm font-medium text-gray-300">+91</span>
                  <i className="fa-solid fa-caret-down text-[10px] text-gray-500" />
                </div>
                <input
                  type="tel"
                  className="w-full bg-transparent py-4 px-4 text-gray-100 placeholder-gray-600 outline-none text-[15px] tracking-wide"
                  placeholder="Enter your mobile number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  required
                  pattern="[0-9]{10}"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] block mb-2 px-1">Password</label>
              <div className="bg-[#161616] border border-[#2a2a2a] rounded-md overflow-hidden brand-focus transition-colors relative">
                <input
                  type="password"
                  className="w-full bg-transparent py-4 px-4 text-gray-100 placeholder-gray-600 outline-none text-[15px] tracking-widest"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full brand-btn py-4 md:py-5 rounded-md text-white font-black text-[14px] tracking-[0.1em] flex items-center justify-center gap-2 transition-all mt-4 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                'GET STARTED'
              )}
            </button>
          </form>

          <div className="mt-8 text-center flex flex-col gap-6">
            <p className="text-[14px] text-gray-300 font-medium tracking-wide">
              Don't have an account?{' '}
              <Link to="/captain/kyc" className="brand-text font-bold hover:text-white transition-colors">
                Register as Captain
              </Link>
            </p>
          </div>

        </div>

        {/* Desktop Footer */}
        <footer className="hidden lg:flex items-center justify-between py-8 text-[10px] font-bold text-gray-600 uppercase tracking-widest border-t border-[#2a2a2a] absolute bottom-0 left-6 md:left-16 xl:left-24 right-6 md:right-16 xl:right-24 z-20">
          <p>© 2026 QUICKBIKE TECHNOLOGIES. VELOCITY IN EVERY MILE.</p>
          <div className="flex gap-8">
            <Link to="#" className="hover:text-gray-400 transition-colors">PRIVACY POLICY</Link>
            <Link to="#" className="hover:text-gray-400 transition-colors">TERMS OF SERVICE</Link>
            <Link to="#" className="hover:text-gray-400 transition-colors">DRIVER AGREEMENT</Link>
          </div>
        </footer>

      </div>
    </div>
  )
}

export default Captainlogin