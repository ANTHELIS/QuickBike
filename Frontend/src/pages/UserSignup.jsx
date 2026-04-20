import React, { useState, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { UserDataContext } from '../context/UserContext'
import { useSiteConfig } from '../context/SiteConfigContext'

const UserSignup = () => {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { setUser } = useContext(UserDataContext)
  const navigate = useNavigate()
  const { getBanner } = useSiteConfig()

  const submitHandler = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/users/register`, {
        fullname: { firstname: firstName, lastname: lastName },
        email, password, phone
      })
      if (response.status === 201) {
        const data = response.data
        setUser(data.user)
        localStorage.setItem('user_token', data.token)
        navigate('/home')
      }
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Signup failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex font-['Inter'] relative overflow-hidden bg-[#FAFAFA] text-[#1a1a1a] brand-page-bg">
      
      {/* ── DYNAMIC MESH GRADIENT BACKGROUND ── */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#FFE4C4] rounded-full mix-blend-multiply filter blur-[120px] opacity-70 animate-pulse pointer-events-none z-0"></div>
      <div className="absolute top-[20%] right-[20%] w-[30%] h-[30%] bg-[#FFDAB9] rounded-full mix-blend-multiply filter blur-[80px] opacity-50 animate-pulse pointer-events-none z-0" style={{animationDelay: '4s'}}></div>

      {/* ── DESKTOP LEFT DYNAMIC IMAGE BANNER ── */}
      <div className="hidden lg:flex lg:w-5/12 relative overflow-hidden p-6 z-10 perspective-1000 pointer-events-none">
        <div className="relative w-full h-full rounded-[40px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.1)] group pointer-events-auto">
          <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-black/5 to-transparent z-10 pointer-events-none" />
          
          <img 
            src={getBanner('signup')} 
            alt="Commuter" 
            className="absolute inset-0 w-full h-full object-cover object-[70%_center] scale-105 group-hover:scale-110 transition-transform duration-[10s] ease-out opacity-90 pointer-events-none"
          />
          
          {/* Floating Glassmorphic Card */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 bg-white/30 backdrop-blur-3xl border border-white/50 rounded-[32px] p-8 w-[85%] shadow-[0_30px_60px_rgba(0,0,0,0.15)] opacity-0 group-hover:opacity-100 group-hover:translate-y-[calc(-50%-10px)] transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]">
            <div className="w-14 h-14 rounded-full bg-white/80 flex items-center justify-center shadow-lg border border-white/60 mb-6 mx-auto">
               <i className="fa-solid fa-rocket text-[#F5820D] text-xl" />
            </div>
            <h3 className="text-gray-900 font-extrabold text-2xl text-center mb-3">Smart Mobility</h3>
            <p className="text-gray-800 font-medium leading-relaxed text-center text-[15px]">
              Join thousands skipping the traffic. Your smarter, faster commute starts here.
            </p>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL (Auth Form & Nav) ── */}
      <div className="w-full lg:w-7/12 flex flex-col relative px-6 md:px-12 xl:px-24 z-20 bg-transparent min-h-[100dvh]">
        
        {/* Desktop Navbar */}
        <nav className="hidden lg:flex items-center justify-between py-10 z-20 w-full">
          <Link to="/" className="flex items-center gap-3 group cursor-pointer">
            <img src="/logo.png" alt="QuickBike" className="h-16 w-auto object-contain drop-shadow-sm group-hover:scale-105 transition-all duration-300" />
            <span className="text-gray-900 font-extrabold text-xl tracking-tighter italic">QuickBike</span>
          </Link>
          <div className="flex items-center gap-6 ml-auto">
            <span className="text-[12px] font-medium text-gray-500">Already a member?</span>
            <Link to="/login" className="brand-nav-link text-[12px] font-extrabold transition-colors uppercase tracking-widest px-5 py-2.5 rounded-lg">
              Sign In
            </Link>
          </div>
        </nav>

        {/* Mobile Header (Only visible below lg) */}
        <header className="lg:hidden flex items-center justify-between py-6">
          <Link to="/" className="text-2xl font-black italic text-[#F5820D] tracking-tighter">
            QuickBike
          </Link>
          <Link to="/login" className="text-[11px] uppercase tracking-widest font-black text-gray-700 bg-gray-100 px-4 py-2 rounded-lg">
            Sign In
          </Link>
        </header>

        {/* Form Container */}
        <div className="flex-grow flex flex-col justify-center max-w-[440px] w-full mx-auto lg:mx-0 xl:ml-12 2xl:ml-24 pb-12 lg:pb-0 z-10 pt-4 lg:pt-0">
          
          <div className="animate-[fade-in_0.8s_ease-out]">
            <h1 className="brand-heading text-4xl md:text-[54px] font-black font-['Manrope'] mb-4 tracking-tight leading-[1.1] drop-shadow-sm">Create account</h1>
            <p className="brand-text-muted text-[16px] font-medium mb-10">Join QuickBike and start riding today.</p>
          </div>

          {error && (
            <div className="bg-red-50/80 backdrop-blur-md border border-red-200 p-4 mb-8 rounded-2xl flex items-center gap-4 animate-[slide-down_0.3s_ease-out] shadow-sm">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                <i className="fa-solid fa-circle-exclamation text-red-500 text-lg"></i>
              </div>
              <span className="text-sm font-semibold text-red-800">{error}</span>
            </div>
          )}

          <form onSubmit={submitHandler} className="space-y-5 animate-[fade-in_1s_ease-out]">
            
            <div className="flex gap-4">
              <div className="flex-1 group">
                <label className="text-[11px] font-black text-gray-400 group-focus-within:text-[#F5820D] uppercase tracking-[0.2em] block mb-2 px-1 transition-colors">First Name</label>
                <div className="bg-white border-2 border-transparent outline outline-1 outline-gray-200 rounded-2xl overflow-hidden focus-within:outline-none focus-within:border-[#F5820D] focus-within:shadow-[0_8px_30px_rgba(245,130,13,0.15)] transition-all duration-300">
                  <input
                    type="text"
                    className="w-full bg-transparent py-3.5 px-4 text-gray-900 font-medium placeholder-gray-400 outline-none text-[15px]"
                    placeholder="John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required minLength={3}
                  />
                </div>
              </div>
              <div className="flex-1 group">
                <label className="text-[11px] font-black text-gray-400 group-focus-within:text-[#F5820D] uppercase tracking-[0.2em] block mb-2 px-1 transition-colors">Last Name</label>
                <div className="bg-white border-2 border-transparent outline outline-1 outline-gray-200 rounded-2xl overflow-hidden focus-within:outline-none focus-within:border-[#F5820D] focus-within:shadow-[0_8px_30px_rgba(245,130,13,0.15)] transition-all duration-300">
                  <input
                    type="text"
                    className="w-full bg-transparent py-3.5 px-4 text-gray-900 font-medium placeholder-gray-400 outline-none text-[15px]"
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="group">
              <label className="text-[11px] font-black text-gray-400 group-focus-within:text-[#F5820D] uppercase tracking-[0.2em] block mb-2 px-1 transition-colors">Email Address (Optional)</label>
              <div className="bg-white border-2 border-transparent outline outline-1 outline-gray-200 rounded-2xl overflow-hidden focus-within:outline-none focus-within:border-[#F5820D] focus-within:shadow-[0_8px_30px_rgba(245,130,13,0.15)] transition-all duration-300">
                <input
                  type="email"
                  className="w-full bg-transparent py-3.5 px-4 text-gray-900 font-medium placeholder-gray-400 outline-none text-[15px]"
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="group">
              <label className="text-[11px] font-black text-gray-400 group-focus-within:text-[#F5820D] uppercase tracking-[0.2em] block mb-2 px-1 transition-colors">Password</label>
              <div className="bg-white border-2 border-transparent outline outline-1 outline-gray-200 rounded-2xl overflow-hidden focus-within:outline-none focus-within:border-[#F5820D] focus-within:shadow-[0_8px_30px_rgba(245,130,13,0.15)] transition-all duration-300">
                <input
                  type="password"
                  className="w-full bg-transparent py-3.5 px-4 text-gray-900 font-black placeholder-gray-300 outline-none text-[18px] tracking-widest"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
            </div>

            <div className="group">
              <label className="text-[11px] font-black text-gray-400 group-focus-within:text-[#F5820D] uppercase tracking-[0.2em] block mb-2 px-1 transition-colors">Phone Number</label>
              <div className="brand-surface border-2 border-transparent outline outline-1 outline-gray-200 rounded-2xl overflow-hidden brand-focus transition-all duration-300 relative group-focus-within:border-[#F5820D]">
                <div className="bg-gray-50/50 absolute left-0 top-0 bottom-0 px-4 border-r border-gray-200 flex items-center justify-center select-none z-10">
                  <span className="text-[13px] font-black text-gray-600">+91</span>
                </div>
                <input
                  type="tel"
                  className="w-full bg-transparent py-3.5 pl-[68px] pr-4 text-gray-900 font-black placeholder-gray-400 outline-none text-[16px] tracking-wider relative z-0"
                  placeholder="Mobile number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  pattern="[0-9]{10}"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="brand-btn w-full relative group overflow-hidden py-4 md:py-5 rounded-2xl text-white font-extrabold text-[15px] tracking-[0.1em] flex items-center justify-center gap-3 transition-all duration-300 mt-6 hover:-translate-y-1"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-tr from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
              {loading ? (
                <div className="w-6 h-6 border-[3px] border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>CREATE ACCOUNT</span>
                  <i className="fa-solid fa-arrow-right group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

        </div>

      </div>

      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        @keyframes fade-in {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-down {
          0% { opacity: 0; transform: translateY(-10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

export default UserSignup