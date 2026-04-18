import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import UserPaymentDesktop from '../components/UserPaymentDesktop';

const UserPayment = () => {
  const navigate = useNavigate();
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
  
  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  if (isDesktop) {
    return <UserPaymentDesktop navigate={navigate} />;
  }
  
  // Basic Mobile Fallback
  return (
    <div className="bg-slate-100 min-h-screen flex justify-center font-['Inter']">
      <main className="w-full max-w-[390px] min-h-[100dvh] bg-[#f4f4f5] dark:bg-[#1A1A1A] text-gray-900 shadow-xl flex flex-col relative overflow-hidden">
        <header className="flex items-center gap-4 px-6 pt-12 pb-4 bg-[#f4f4f5] dark:bg-[#111111] sticky top-0 z-10 shadow-md">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-white/10 -ml-2 transition-colors">
             <i className="fa-solid fa-arrow-left"></i>
          </button>
          <h1 className="text-xl font-black font-['Manrope']">Wallet</h1>
        </header>
        
        <div className="p-6">
           <p className="text-gray-500">Mobile payment screen currently under construction.</p>
        </div>
      </main>
    </div>
  );
};

export default UserPayment;
