import React, { useState, useContext } from 'react'
import { Link, useNavigate } from 'react-router'
import axios from 'axios'
import { UserDataContext } from '../context/UserContext'

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
    <div className="bg-gray-100 min-h-screen flex justify-center font-['Inter']">
      <main className="w-full max-w-[390px] min-h-[100dvh] bg-white shadow-xl relative overflow-x-hidden flex flex-col bg-[linear-gradient(180deg,rgba(255,255,255,1)_0%,rgba(255,248,245,1)_100%)]">
        
        {/* Header */}
        <header className="flex items-center gap-4 px-6 py-4 bg-transparent pt-8">
          <Link to="/" className="text-orange-600 hover:bg-orange-50 p-2 rounded-full transition-colors -ml-2">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
        </header>

        {/* Main Content */}
        <section className="px-6 flex-grow flex flex-col justify-center pb-12">
          
          <div className="mb-8 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-gradient-to-tr from-[#A85300] to-[#F5820D] rounded-[20px] flex justify-center items-center shadow-lg shadow-orange-200 mb-6 rotate-3">
              <svg width="32" height="32" viewBox="0 0 36 36" fill="none">
                <path d="M18 3L30 12V27L18 33L6 27V12L18 3Z" fill="#E67E00" />
                <path d="M18 10L24 14V22L18 26L12 22V14L18 10Z" fill="white" />
              </svg>
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 font-['Manrope'] mb-2">Create account</h1>
            <p className="text-sm text-gray-500">Join QuickBike and start riding</p>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg flex items-center gap-3 animate-fade-in">
              <i className="fa-solid fa-circle-exclamation text-red-500"></i>
              <span className="text-sm font-semibold text-red-800">{error}</span>
            </div>
          )}

          <form onSubmit={submitHandler} className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1.5 px-1">First Name</label>
                <input
                  type="text"
                  className="w-full bg-white border border-gray-200 rounded-xl py-3.5 px-4 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-[#F5820D] focus:border-transparent transition-all shadow-sm"
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required minLength={3}
                />
              </div>
              <div className="flex-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1.5 px-1">Last Name</label>
                <input
                  type="text"
                  className="w-full bg-white border border-gray-200 rounded-xl py-3.5 px-4 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-[#F5820D] focus:border-transparent transition-all shadow-sm"
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1.5 px-1">Email Address</label>
              <input
                type="email"
                className="w-full bg-white border border-gray-200 rounded-xl py-3.5 px-4 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-[#F5820D] focus:border-transparent transition-all shadow-sm"
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1.5 px-1">Password</label>
              <input
                type="password"
                className="w-full bg-white border border-gray-200 rounded-xl py-3.5 px-4 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-[#F5820D] focus:border-transparent transition-all shadow-sm"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1.5 px-1">Phone (optional)</label>
              <input
                type="tel"
                className="w-full bg-white border border-gray-200 rounded-xl py-3.5 px-4 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-[#F5820D] focus:border-transparent transition-all shadow-sm"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#A85300] to-[#F5820D] py-4 rounded-full text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-orange-200 active:scale-95 transition-all mt-6 disabled:opacity-70"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600 font-medium">
              Already have an account?{' '}
              <Link to="/login" className="text-[#A85300] font-bold hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </section>

      </main>
    </div>
  )
}

export default UserSignup