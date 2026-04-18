import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import UserOffersDesktop from '../components/UserOffersDesktop';

const UserOffers = () => {
  const navigate = useNavigate();
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
  
  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  if (isDesktop) {
    return <UserOffersDesktop navigate={navigate} />;
  }
  
  // Basic Mobile Fallback Component
  return (
    <div className="bg-[#f4f4f5] dark:bg-[#111112] min-h-screen flex justify-center font-['Inter']">
      <main className="w-full max-w-[390px] min-h-[100dvh] bg-[#f4f4f5] dark:bg-[#1c1c1c] text-gray-900 dark:text-white shadow-xl flex flex-col relative overflow-hidden">
        <header className="flex items-center gap-4 px-6 pt-12 pb-4 bg-[#f4f4f5] dark:bg-[#141415] sticky top-0 z-10 shadow-md border-b border-black/5 dark:border-white/5">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-white/10 -ml-2 transition-colors">
            <svg className="h-6 w-6 text-gray-900 dark:text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-xl font-black font-['Manrope'] tracking-wide">Offers & Promos</h1>
        </header>
        
        <div className="p-6 overflow-y-auto no-scrollbar space-y-6 pb-20">
          {/* Summer Pass Banner Mobile */}
          <div className="w-full rounded-2xl bg-gradient-to-r from-[#172033] to-[#0d121c] p-6 relative overflow-hidden border border-black/10 dark:border-white/10 shadow-lg">
            <p className="text-[#e85d04] text-[9px] font-black tracking-[0.2em] uppercase mb-2">Limited Edition</p>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white font-['Manrope'] leading-tight mb-2">The Summer Velocity Pass</h2>
            <p className="text-gray-600 dark:text-gray-400 text-xs leading-relaxed mb-6">Unlock unlimited rides across the city throughout the season.</p>
            <button className="w-full bg-gradient-to-r from-[#fc8e65] to-[#e85d04] py-3 rounded-xl text-gray-900 dark:text-gray-100 font-black text-xs tracking-widest uppercase">Explore Pass</button>
          </div>
          
          {/* Simple Mobile Card */}
          <div className="bg-[#f4f4f5] dark:bg-[#242426] rounded-2xl p-6 border border-black/5 dark:border-white/5 shadow-xl">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#fc8e65] to-[#e85d04] flex items-center justify-center mb-4">
              <i className="fa-solid fa-user-plus text-gray-900 dark:text-gray-100"></i>
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 font-['Manrope']">Referral Reward</h3>
            <p className="text-gray-600 dark:text-gray-400 text-xs leading-relaxed mb-4">Invite your network and get credited for every successful sign-up.</p>
            <button className="w-full py-3 rounded-xl bg-[#f4f4f5] dark:bg-[#2A2A2A] text-gray-900 dark:text-white border border-[#e85d04]/30 font-bold text-[10px] tracking-widest uppercase shadow-sm">Apply Code: FRIENDS20</button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserOffers;
