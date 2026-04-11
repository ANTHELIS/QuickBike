import React, { useState, useContext } from 'react'
import { Link, useNavigate } from 'react-router'
import axios from 'axios'
import { CaptainDataContext } from '../context/CapatainContext'

const CaptainSignup = () => {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [vehicleColor, setVehicleColor] = useState('')
  const [vehiclePlate, setVehiclePlate] = useState('')
  const [vehicleCapacity, setVehicleCapacity] = useState('')
  const [vehicleType, setVehicleType] = useState('moto')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { setCaptain } = useContext(CaptainDataContext)
  const navigate = useNavigate()

  const submitHandler = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/captains/register`, {
        fullname: { firstname: firstName, lastname: lastName },
        email: email || undefined,
        phone,
        password,
        vehicle: { color: vehicleColor, plate: vehiclePlate, capacity: parseInt(vehicleCapacity), vehicleType }
      })
      if (response.status === 201) {
        setCaptain(response.data.captain)
        localStorage.setItem('captain_token', response.data.token)
        navigate('/captain/kyc')  // Go directly to KYC — phone + email collected, now verify identity
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
        <header className="flex items-center gap-4 px-6 py-4 bg-transparent pt-8 shrink-0">
          <Link to="/captain-login" className="text-orange-600 hover:bg-orange-50 p-2 rounded-full transition-colors -ml-2">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
        </header>

        {/* Main Content */}
        <section className="px-6 flex-grow flex flex-col justify-start pb-12 overflow-y-auto">
          
          <div className="mb-8 text-left mt-2">
            <h1 className="text-3xl font-extrabold text-[#F5820D] font-['Manrope'] mb-2">Become a Captain</h1>
            <p className="text-sm text-gray-500">Register to start earning with QuickBike</p>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg flex items-center gap-3 animate-fade-in shrink-0">
              <i className="fa-solid fa-circle-exclamation text-red-500"></i>
              <span className="text-sm font-semibold text-red-800">{error}</span>
            </div>
          )}

          <form onSubmit={submitHandler} className="space-y-4 shrink-0 pb-10">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1.5 px-1">First Name</label>
                <input
                  type="text"
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl py-3 px-4 text-gray-800 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-[#F5820D] focus:border-transparent transition-all shadow-sm"
                  placeholder="Budi"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required minLength={3}
                />
              </div>
              <div className="flex-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1.5 px-1">Last Name</label>
                <input
                  type="text"
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl py-3 px-4 text-gray-800 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-[#F5820D] focus:border-transparent transition-all shadow-sm"
                  placeholder="Santoso"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1.5 px-1">Mobile Number <span className="text-red-500">*</span></label>
              <input
                type="tel"
                className="w-full bg-slate-50 border border-gray-200 rounded-xl py-3 px-4 text-gray-800 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-[#F5820D] focus:border-transparent transition-all shadow-sm"
                placeholder="10-digit mobile number"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                required
                pattern="[0-9]{10}"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1.5 px-1">Email Address <span className="text-gray-400 text-[9px]">(Optional)</span></label>
              <input
                type="email"
                className="w-full bg-slate-50 border border-gray-200 rounded-xl py-3 px-4 text-gray-800 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-[#F5820D] focus:border-transparent transition-all shadow-sm"
                placeholder="captain@quickbike.com (optional)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1.5 px-1">Password</label>
              <input
                type="password"
                className="w-full bg-slate-50 border border-gray-200 rounded-xl py-3 px-4 text-gray-800 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-[#F5820D] focus:border-transparent transition-all shadow-sm"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <div className="pt-4 pb-2 border-b border-gray-200">
              <h3 className="font-bold text-gray-800 font-['Manrope']">Vehicle Details</h3>
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1.5 px-1">Vehicle Type</label>
              <select 
                className="w-full bg-slate-50 border border-gray-200 rounded-xl py-4 px-4 text-gray-800 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-[#F5820D] focus:border-transparent transition-all shadow-sm cursor-pointer" 
                value={vehicleType} 
                onChange={(e) => setVehicleType(e.target.value)}
              >
                <option value="moto">Motorcycle (Bike Taxi)</option>
                <option value="auto">Auto Rickshaw</option>
                <option value="car">Car (Mini Cab)</option>
              </select>
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1.5 px-1">Color</label>
                <input
                  type="text"
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl py-3 px-4 text-gray-800 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-[#F5820D] focus:border-transparent transition-all shadow-sm"
                  placeholder="Black"
                  value={vehicleColor}
                  onChange={(e) => setVehicleColor(e.target.value)}
                  required minLength={3}
                />
              </div>
              <div className="flex-[0.5]">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1.5 px-1">Seats</label>
                <input
                  type="number"
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl py-3 px-4 text-gray-800 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-[#F5820D] focus:border-transparent transition-all shadow-sm"
                  placeholder="1"
                  value={vehicleCapacity}
                  onChange={(e) => setVehicleCapacity(e.target.value)}
                  required min={1}
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1.5 px-1">License Plate</label>
              <input
                type="text"
                className="w-full bg-slate-50 border border-gray-200 rounded-xl py-3 px-4 text-gray-800 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-[#F5820D] focus:border-transparent transition-all shadow-sm uppercase uppercase"
                placeholder="B 4932 KLP"
                style={{textTransform:'uppercase'}}
                value={vehiclePlate}
                onChange={(e) => setVehiclePlate(e.target.value)}
                required minLength={3}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#A85300] to-[#F5820D] py-4 rounded-full text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-orange-200 active:scale-95 transition-all mt-6 mb-4 disabled:opacity-70"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Register as Captain'
              )}
            </button>
            <div className="text-center pb-8">
              <p className="text-xs text-gray-600 font-medium">
                Already registered?{' '}
                <Link to="/captain-login" className="text-[#A85300] font-bold hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        </section>
      </main>
    </div>
  )
}

export default CaptainSignup