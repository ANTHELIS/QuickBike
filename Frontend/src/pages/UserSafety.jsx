import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import UserSafetyDesktop from '../components/UserSafetyDesktop';

const UserSafety = () => {
  const navigate = useNavigate();
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
  
  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  if (isDesktop) {
    return <UserSafetyDesktop navigate={navigate} />;
  }
  
  // Basic Mobile Fallback
  return (
    <div className="bg-slate-100 min-h-screen flex justify-center font-['Inter']">
      <main className="w-full max-w-[390px] min-h-[100dvh] bg-[#f4f4f5] dark:bg-[#1A1A1A] text-gray-900 dark:text-white shadow-xl flex flex-col relative overflow-hidden">
        <header className="flex items-center gap-4 px-6 pt-12 pb-4 bg-[#f4f4f5] dark:bg-[#111111] sticky top-0 z-10 shadow-md">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-white/10 -ml-2 transition-colors">
            <svg className="h-6 w-6 text-gray-900 dark:text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-xl font-black font-['Manrope']">Safety Center</h1>
        </header>
        
        <div className="p-6 overflow-y-auto no-scrollbar space-y-6 pb-20">
          <div className="bg-[#f4f4f5] dark:bg-[#1F1F21] rounded-3xl p-6 border border-black/5 dark:border-white/5 relative overflow-hidden shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
              <span className="text-[10px] font-black tracking-[0.2em] uppercase text-[#f57b0f]">Critical Action</span>
            </div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white font-['Manrope'] mb-2">Emergency Response</h2>
            <p className="text-gray-600 dark:text-gray-400 text-xs leading-relaxed mb-6">Activating SOS will immediately share your location with emergency services.</p>
            <button className="w-full bg-[#f4f4f5] dark:bg-[#d05c10] text-gray-900 dark:text-white font-black py-4 rounded-xl mb-3 tracking-widest text-[11px] uppercase shadow-lg shadow-[#d05c10]/20 flex justify-center items-center gap-3 active:scale-95 transition-transform">
              <i className="fa-solid fa-asterisk text-base"></i> Trigger SOS
            </button>
            <button className="w-full bg-[#f4f4f5] dark:bg-[#2C2C2E] text-gray-900 dark:text-white font-bold py-4 rounded-xl text-[11px] uppercase tracking-widest active:scale-95 transition-transform">
              Call Local Police
            </button>
          </div>
          
          <div className="bg-[#f4f4f5] dark:bg-[#1F1F21] rounded-3xl p-6 border border-black/5 dark:border-white/5 relative overflow-hidden shadow-xl">
            <div className="bg-[#f4f4f5] dark:bg-[#0EA5E9] text-gray-900 dark:text-white text-[10px] font-black px-3 py-1 rounded inline-block uppercase tracking-widest mb-4">Live Tracking</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 font-['Manrope']">Active Journey</h3>
            <p className="text-gray-600 dark:text-gray-400 text-xs mb-6">Sharing status with 3 contacts.</p>
            <button className="w-full bg-[#f4f4f5] dark:bg-[#2C2C2E] text-gray-900 dark:text-white font-bold py-3.5 rounded-xl border border-black/5 dark:border-white/5 text-xs flex justify-center items-center gap-2 active:scale-95">
              <i className="fa-solid fa-share-nodes"></i> Share Link
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserSafety;
