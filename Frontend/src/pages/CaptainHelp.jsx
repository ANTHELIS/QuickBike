import React, { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CaptainDataContext } from '../context/CapatainContext'
import CaptainDesktopSidebar from '../components/CaptainDesktopSidebar'
import { useSiteConfig } from '../context/SiteConfigContext'

const FAQS = [
  { q: 'How is my weekly payout calculated?', a: 'Your weekly payout is calculated based on completed rides, minus QuickBike commission, plus any earned bonuses or tips. Payouts are processed every Monday.', icon: 'fa-indian-rupee-sign', color: 'bg-green-50 text-green-600' },
  { q: 'How do I update my vehicle?', a: 'Go to your Account screen and tap "Edit Profile" or contact support via this page to submit new RC and vehicle photos.', icon: 'fa-car', color: 'bg-orange-50 text-orange-500' },
  { q: 'What happens if a rider cancels?', a: 'If a rider cancels after you have arrived at the pickup location, a cancellation fee is automatically credited to your daily earnings ledger.', icon: 'fa-circle-xmark', color: 'bg-red-50 text-red-500' },
  { q: 'Can I go offline during a ride?', a: 'No, your status cannot be changed to Offline while you have an active ride assigned. Complete or cancel the ride first.', icon: 'fa-power-off', color: 'bg-gray-100 text-gray-500' },
  { q: 'How do I report a safety incident?', a: 'Use the SOS button on the active ride screen or select "Safety Incident" below to connect with our 24/7 incident response team.', icon: 'fa-shield-halved', color: 'bg-blue-50 text-blue-500' }
]

const CaptainHelp = () => {
  const navigate = useNavigate()
  const { captain } = useContext(CaptainDataContext)
  const [activeFaq, setActiveFaq] = useState(null)
  const { getBanner } = useSiteConfig() // triggers CSS injection

  return (
    <div className="text-slate-900 font-['Inter'] relative w-full max-w-full" style={{overflowX:'hidden'}}>

      {/* ── DESKTOP LAYOUT ── */}
      <div className="hidden md:flex bg-[#f2f2f4] dark:bg-[#0a0a0c] h-[100dvh] overflow-hidden flex-row transition-colors">
        <CaptainDesktopSidebar />
        <main className="flex-1 h-[100dvh] flex flex-col overflow-y-auto relative px-12 py-10">
          <div className="w-full max-w-4xl mx-auto flex flex-col hide-scrollbar relative">
            <header className="mb-8 pt-8 md:pt-0 relative">
              <h3 className="text-xs font-bold brand-text uppercase tracking-widest mb-1 z-10 relative">Captain Support</h3>
              <h1 className="text-4xl lg:text-5xl font-extrabold text-[#1a1c1e] dark:text-gray-100 font-['Manrope'] tracking-tight z-10 relative transition-colors">Help Center</h1>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8">
              
              {/* FAQ Section */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-[#1a1c1e] dark:text-gray-100 font-['Manrope'] mb-4 transition-colors">Frequently Asked Questions</h2>
                {FAQS.map((faq, idx) => {
                  const isActive = activeFaq === idx
                  return (
                    <div key={idx} onClick={() => setActiveFaq(isActive ? null : idx)}
                      className={`rounded-2xl cursor-pointer border transition-all ${isActive ? 'bg-white dark:bg-[#161719] shadow-sm border-gray-100 dark:border-[#2b2d31] p-6' : 'bg-white/50 dark:bg-[#161719]/50 border-transparent hover:bg-white dark:hover:bg-[#1f2125] p-6'}`}>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${faq.color} dark:brightness-90`}>
                            <i className={`fa-solid ${faq.icon} text-sm`}></i>
                          </div>
                          <h3 className="font-bold text-[15px] text-[#1a1c1e] dark:text-gray-100 transition-colors">{faq.q}</h3>
                        </div>
                        <i className={`fa-solid fa-${isActive ? 'chevron-up' : 'plus'} text-gray-400 dark:text-gray-500 text-sm shrink-0 transition-all`}></i>
                      </div>
                      {isActive && (
                        <div className="mt-4 text-gray-500 dark:text-gray-400 text-sm leading-relaxed ml-14 transition-colors">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Action Cards */}
              <div className="space-y-4 sticky top-4">
                <div className="bg-white dark:bg-[#161719] rounded-3xl p-6 shadow-sm border border-transparent dark:border-[#2b2d31] relative overflow-hidden group hover:shadow-md transition-all cursor-pointer">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 dark:bg-orange-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none group-hover:bg-orange-100 dark:group-hover:bg-orange-500/20 transition-colors" />
                  <div className="w-12 h-12 brand-surface brand-text rounded-2xl flex items-center justify-center mb-4 relative z-10 transition-colors">
                    <i className="fa-solid fa-phone text-xl" />
                  </div>
                  <h3 className="text-lg font-bold text-[#1a1c1e] dark:text-gray-100 mb-1 relative z-10 transition-colors">Call Support</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 relative z-10 transition-colors">Speak directly to an agent</p>
                </div>

                <div className="bg-[#1a1c1e] dark:bg-[#121214] rounded-3xl p-6 shadow-md border border-transparent dark:border-[#2b2d31] relative overflow-hidden group hover:shadow-lg transition-all cursor-pointer">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/20 dark:bg-red-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none transition-colors" />
                  <div className="w-12 h-12 bg-red-500/20 dark:bg-red-500/30 text-red-500 dark:text-red-400 rounded-2xl flex items-center justify-center mb-4 relative z-10 transition-colors">
                    <i className="fa-solid fa-triangle-exclamation text-xl" />
                  </div>
                  <h3 className="text-lg font-bold text-white dark:text-gray-100 mb-1 relative z-10 transition-colors">Safety Incident</h3>
                  <p className="text-xs text-gray-400 relative z-10 transition-colors">Report critical safety issues instantly</p>
                </div>

                <div className="bg-white dark:bg-[#161719] rounded-3xl p-6 shadow-sm border border-transparent dark:border-[#2b2d31] relative overflow-hidden group hover:shadow-md transition-all cursor-pointer">
                  <div className="w-12 h-12 bg-blue-50 dark:bg-blue-500/10 text-blue-500 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-4 relative z-10 transition-colors">
                    <i className="fa-solid fa-envelope text-xl" />
                  </div>
                  <h3 className="text-lg font-bold text-[#1a1c1e] dark:text-gray-100 mb-1 relative z-10 transition-colors">Email Us</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 relative z-10 transition-colors">Expect a reply in ~2 hours</p>
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>

      {/* ── MOBILE LAYOUT ── */}
      <main className="md:hidden w-full min-h-[100dvh] bg-[#f5f5f7] dark:bg-[#0a0a0c] flex flex-col relative hide-scrollbar pb-24 transition-colors">
        
        {/* Mobile Header */}
        <header className="flex items-center gap-4 px-5 pt-6 pb-4 bg-[#f5f5f7]/90 dark:bg-[#0a0a0c]/90 backdrop-blur-md sticky top-0 z-40 transition-colors">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-white dark:bg-[#161719] shadow-sm flex items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-[#2b2d31] active:scale-95 transition-all text-[#1a1c1e] dark:text-gray-100">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-sm font-black text-[#1a1c1e] dark:text-gray-100 font-['Manrope'] tracking-widest uppercase transition-colors">Help & Support</h1>
        </header>

        <div className="px-5 pt-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1 mb-4">Quick Actions</p>
          
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button className="bg-white dark:bg-[#161719] hover:bg-gray-50 dark:hover:bg-[#2b2d31] border border-transparent dark:border-[#2b2d31] transition-colors rounded-[24px] p-5 flex flex-col items-center justify-center gap-2 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-none active:scale-[0.98]">
              <div className="w-12 h-12 rounded-2xl brand-surface brand-text flex items-center justify-center transition-colors">
                <i className="fa-solid fa-phone text-lg"></i>
              </div>
              <span className="text-sm font-bold text-[#1a1c1e] dark:text-gray-100 mt-1 transition-colors">Call Hub</span>
            </button>
            <button className="bg-white dark:bg-[#161719] hover:bg-gray-50 dark:hover:bg-[#2b2d31] border border-transparent dark:border-[#2b2d31] transition-colors rounded-[24px] p-5 flex flex-col items-center justify-center gap-2 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-none active:scale-[0.98]">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-500 flex items-center justify-center transition-colors">
                <i className="fa-solid fa-envelope text-lg"></i>
              </div>
              <span className="text-sm font-bold text-[#1a1c1e] dark:text-gray-100 mt-1 transition-colors">Email Us</span>
            </button>
          </div>

          {/* Safety Emergency Banner */}
          <div className="bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-[20px] p-5 mb-8 flex items-center gap-4 active:scale-[0.98] transition-all cursor-pointer" onClick={() => navigate('/safety')}>
            <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-500 flex items-center justify-center shrink-0 transition-colors">
              <i className="fa-solid fa-triangle-exclamation text-lg"></i>
            </div>
            <div className="flex-1">
              <p className="font-bold text-red-700 dark:text-red-400 text-sm tracking-tight mb-0.5 transition-colors">Safety Incident?</p>
              <p className="text-[10px] font-semibold text-red-500 dark:text-red-500/70 transition-colors">Report emergencies instantly</p>
            </div>
            <i className="fa-solid fa-chevron-right text-red-300 dark:text-red-500/50"></i>
          </div>

          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1 mb-3">Top Questions</p>
          <div className="space-y-2">
            {FAQS.map((faq, i) => (
              <div key={i} className="bg-white dark:bg-[#161719] border border-transparent dark:border-[#2b2d31] rounded-[20px] overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.02)] dark:shadow-none transition-colors">
                <button onClick={() => setActiveFaq(activeFaq === i ? null : i)} className="w-full flex items-center gap-4 p-4 active:bg-slate-50 dark:active:bg-[#2b2d31] transition-colors text-left">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${faq.color.replace('bg-green-50', 'bg-green-50 dark:bg-green-500/10').replace('bg-orange-50', 'bg-orange-50 dark:bg-orange-500/10').replace('bg-red-50', 'bg-red-50 dark:bg-red-500/10').replace('bg-gray-100', 'bg-gray-100 dark:bg-gray-800').replace('bg-blue-50', 'bg-blue-50 dark:bg-blue-500/10')}`}>
                    <i className={`fa-solid ${faq.icon} text-sm`}></i>
                  </div>
                  <p className="flex-1 text-[13px] font-bold text-[#1a1c1e] dark:text-gray-100 truncate pr-2 transition-colors">{faq.q}</p>
                  <i className={`fa-solid fa-chevron-${activeFaq === i ? 'up' : 'down'} text-gray-300 dark:text-gray-500 text-[10px] shrink-0 transition-colors`}></i>
                </button>
                {activeFaq === i && (
                  <div className="px-5 pb-5 pt-1 text-[11px] font-medium text-gray-500 dark:text-gray-400 leading-relaxed border-t border-gray-50 dark:border-[#2b2d31] pt-3 transition-colors">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </main>
      
      {/* ── MOBILE BOTTOM NAV ── */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-white dark:bg-[#161719] flex justify-around items-center pt-3 pb-5 z-[60] rounded-t-[20px] shadow-[0_-4px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.6)] border-t border-gray-50 dark:border-[#2b2d31] transition-colors">
        <div onClick={() => navigate('/captain-home')} className="flex flex-col items-center gap-1 cursor-pointer w-16 group">
          <i className="fa-solid fa-table-cells-large text-gray-400 group-active:text-[#e67e00] transition-colors text-lg" />
          <p className="text-[9px] font-bold text-gray-400 group-active:text-[#e67e00] transition-colors max-sm:text-[8px]">Home</p>
        </div>
        <div onClick={() => navigate('/captain/history')} className="flex flex-col items-center gap-1 cursor-pointer w-16 group">
          <i className="fa-solid fa-clock-rotate-left text-gray-400 group-active:text-[#e67e00] transition-colors text-lg" />
          <p className="text-[9px] font-bold text-gray-400 group-active:text-[#e67e00] transition-colors max-sm:text-[8px]">History</p>
        </div>
        <div onClick={() => navigate('/captain/earnings')} className="flex flex-col items-center gap-1 cursor-pointer w-16 group">
          <i className="fa-solid fa-wallet text-gray-400 group-active:text-[#e67e00] transition-colors text-lg" />
          <p className="text-[9px] font-bold text-gray-400 group-active:text-[#e67e00] transition-colors max-sm:text-[8px]">Earnings</p>
        </div>
        <div onClick={() => navigate('/captain/account')} className="flex flex-col items-center gap-1 cursor-pointer w-16 group">
          <i className="fa-solid fa-user text-gray-400 group-active:text-[#e67e00] transition-colors text-lg" />
          <p className="text-[9px] font-bold text-gray-400 group-active:text-[#e67e00] transition-colors max-sm:text-[8px]">Account</p>
        </div>
      </div>

    </div>
  )
}

export default CaptainHelp
