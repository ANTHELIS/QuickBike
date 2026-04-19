import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router';
import { UserDataContext } from '../context/UserContext';
import UserSafetyDesktop from '../components/UserSafetyDesktop';
import { useSiteConfig } from '../context/SiteConfigContext';

const UserSafety = () => {
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
    return <UserSafetyDesktop navigate={navigate} user={user} />;
  }
  
  // Basic Mobile Fallback
  return (
    <div className="brand-page-bg min-h-screen flex justify-center font-['Inter']">
      <main className="w-full max-w-[390px] min-h-[100dvh] brand-page-bg shadow-xl flex flex-col relative overflow-hidden">
        <header className="flex items-center gap-4 px-6 pt-12 pb-4 brand-surface sticky top-0 z-10 shadow-md">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:opacity-70 -ml-2 transition-colors">
            <svg className="h-6 w-6 brand-text-primary" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-xl font-black font-['Manrope'] brand-text-primary">Safety Center</h1>
        </header>
        
        <div className="p-6 overflow-y-auto no-scrollbar space-y-6 pb-20">
          <div className="brand-surface rounded-3xl p-6 border border-black/5 relative overflow-hidden shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
              <span className="text-[10px] font-black tracking-[0.2em] uppercase brand-text">Critical Action</span>
            </div>
            <h2 className="text-2xl font-black brand-text-primary font-['Manrope'] mb-2">Emergency Response</h2>
            <p className="brand-text-muted text-xs leading-relaxed mb-6">Activating SOS will immediately share your location with emergency services.</p>
            <button className="brand-btn w-full text-white font-black py-4 rounded-xl mb-3 tracking-widest text-[11px] uppercase flex justify-center items-center gap-3 active:scale-95 transition-transform">
              <i className="fa-solid fa-asterisk text-base"></i> Trigger SOS
            </button>
            <button className="brand-surface w-full font-bold py-4 rounded-xl text-[11px] uppercase tracking-widest active:scale-95 transition-transform border border-gray-200 brand-text-primary">
              Call Local Police
            </button>
          </div>
          
          <div className="brand-surface rounded-3xl p-6 border border-black/5 relative overflow-hidden shadow-xl">
            <div className="brand-btn text-white text-[10px] font-black px-3 py-1 rounded inline-block uppercase tracking-widest mb-4">Live Tracking</div>
            <h3 className="text-xl font-bold brand-text-primary mb-2 font-['Manrope']">Active Journey</h3>
            <p className="brand-text-muted text-xs mb-6">Sharing status with 3 contacts.</p>
            <button className="brand-surface w-full font-bold py-3.5 rounded-xl border border-gray-100 text-xs flex justify-center items-center gap-2 active:scale-95 brand-text-primary">
              <i className="fa-solid fa-share-nodes"></i> Share Link
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserSafety;
