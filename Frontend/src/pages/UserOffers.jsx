import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router';
import { UserDataContext } from '../context/UserContext';
import UserOffersDesktop from '../components/UserOffersDesktop';
import { useSiteConfig } from '../context/SiteConfigContext';

const UserOffers = () => {
  const navigate = useNavigate();
  const { user } = useContext(UserDataContext);
  const { getBanner } = useSiteConfig(); // triggers CSS injection
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
  
  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  if (isDesktop) {
    return <UserOffersDesktop navigate={navigate} user={user} />;
  }
  
  // Basic Mobile Fallback Component
  return (
    <div className="brand-page-bg min-h-screen flex justify-center font-['Inter']">
      <main className="w-full max-w-[390px] min-h-[100dvh] brand-page-bg shadow-xl flex flex-col relative overflow-hidden">
        <header className="flex items-center gap-4 px-6 pt-12 pb-4 brand-surface sticky top-0 z-10 shadow-md border-b border-black/5">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:opacity-70 -ml-2 transition-colors">
            <svg className="h-6 w-6 brand-text-primary" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-xl font-black font-['Manrope'] tracking-wide brand-text-primary">Offers & Promos</h1>
        </header>
        
        <div className="p-6 overflow-y-auto no-scrollbar space-y-6 pb-20">
          {/* Summer Pass Banner Mobile */}
          <div className="w-full rounded-2xl bg-gradient-to-r from-[#172033] to-[#0d121c] p-6 relative overflow-hidden border border-black/10 shadow-lg">
            <p className="brand-text text-[9px] font-black tracking-[0.2em] uppercase mb-2">Limited Edition</p>
            <h2 className="text-2xl font-black text-white font-['Manrope'] leading-tight mb-2">The Summer Velocity Pass</h2>
            <p className="text-gray-400 text-xs leading-relaxed mb-6">Unlock unlimited rides across the city throughout the season.</p>
            <button className="brand-btn w-full py-3 rounded-xl text-white font-black text-xs tracking-widest uppercase">Explore Pass</button>
          </div>
          
          {/* Simple Mobile Card */}
          <div className="brand-surface rounded-2xl p-6 border border-black/5 shadow-xl">
            <div className="brand-btn w-10 h-10 rounded-xl flex items-center justify-center mb-4">
              <i className="fa-solid fa-user-plus text-white"></i>
            </div>
            <h3 className="text-lg font-bold brand-text-primary mb-2 font-['Manrope']">Referral Reward</h3>
            <p className="brand-text-muted text-xs leading-relaxed mb-4">Invite your network and get credited for every successful sign-up.</p>
            <button className="brand-surface w-full py-3 rounded-xl border brand-border font-bold text-[10px] tracking-widest uppercase shadow-sm brand-text">Apply Code: FRIENDS20</button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserOffers;
