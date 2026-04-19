import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router';
import { UserDataContext } from '../context/UserContext';
import UserHelpDesktop from '../components/UserHelpDesktop';
import { useSiteConfig } from '../context/SiteConfigContext';

const UserHelp = () => {
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
    return <UserHelpDesktop navigate={navigate} user={user} />;
  }

  return (
    <div className="brand-page-bg min-h-screen flex justify-center font-['Inter']">
      <main className="w-full max-w-[390px] min-h-[100dvh] brand-page-bg shadow-xl flex flex-col relative">

        {/* ── Header ── */}
        <header className="flex items-center gap-4 px-6 pt-12 pb-4 brand-surface sticky top-0 z-10 shadow-sm">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:opacity-70 -ml-2 transition-colors">
            <svg className="h-6 w-6 brand-text-primary" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-xl font-black font-['Manrope'] brand-text-primary">Help & Support</h1>
        </header>

        {/* ── Body ── */}
        <div className="px-6 py-6 pb-20 overflow-y-auto">
          <p className="text-sm font-semibold brand-text-muted mb-8">How can we help you today?</p>

          {/* Direct Action Contacts */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            <button className="brand-surface hover:opacity-90 transition-colors rounded-2xl p-4 flex flex-col items-center justify-center gap-2 border border-gray-100 shadow-sm active:scale-[0.98]">
              <div className="w-10 h-10 rounded-full brand-surface brand-text flex items-center justify-center shadow-sm">
                <i className="fa-solid fa-phone text-sm"></i>
              </div>
              <span className="text-sm font-bold brand-text-primary mt-1">Call Us</span>
            </button>
            <button className="brand-surface hover:opacity-80 transition-colors rounded-2xl p-4 flex flex-col items-center justify-center gap-2 border border-gray-200 shadow-sm active:scale-[0.98]">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shadow-sm">
                <i className="fa-solid fa-envelope text-sm"></i>
              </div>
              <span className="text-sm font-bold brand-text-primary mt-1">Email</span>
            </button>
          </div>

          {/* Safety Emergency Banner */}
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-8 flex items-center gap-4 active:scale-[0.98] transition-transform cursor-pointer" onClick={() => navigate('/safety')}>
            <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
              <i className="fa-solid fa-shield-halved text-sm"></i>
            </div>
            <div className="flex-1">
              <p className="font-bold text-red-700 text-sm">Safety Incident?</p>
              <p className="text-xs font-semibold text-red-500">Report an emergency immediately</p>
            </div>
            <i className="fa-solid fa-chevron-right text-red-300"></i>
          </div>

          {/* FAQ Section */}
          <h3 className="text-lg font-bold brand-text-primary mb-4 px-1">Top Questions</h3>
          <div className="space-y-3">
            {[
              { q: 'I left an item in the vehicle', icon: 'fa-box-open' },
              { q: 'Captain was rude or unprofessional', icon: 'fa-user-slash' },
              { q: 'My ride fare was surprisingly high', icon: 'fa-indian-rupee-sign' },
              { q: 'How do I apply a promo code?', icon: 'fa-ticket' },
              { q: 'Update my phone number', icon: 'fa-mobile-screen' }
            ].map((faq, i) => (
              <button key={i} className="w-full flex items-center gap-4 brand-surface rounded-2xl p-4 border border-gray-100 active:opacity-80 transition-colors text-left shadow-sm">
                <div className="w-8 h-8 rounded-full bg-gray-50 brand-text-muted flex items-center justify-center shrink-0">
                  <i className={`fa-solid ${faq.icon} text-xs`}></i>
                </div>
                <p className="flex-1 text-sm font-bold brand-text-primary truncate">{faq.q}</p>
                <i className="fa-solid fa-chevron-right text-gray-300 text-sm shrink-0"></i>
              </button>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
};

export default UserHelp;
