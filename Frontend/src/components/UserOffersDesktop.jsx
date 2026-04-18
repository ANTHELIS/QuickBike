import React from 'react';
import SidebarDesktop from './SidebarDesktop';
import HeaderDesktop from './HeaderDesktop';

const UserOffersDesktop = ({ navigate, user }) => {
  const promos = [
    {
      title: 'Referral Reward',
      desc: 'Invite your network and get credited for every successful sign-up.',
      code: 'FRIENDS20',
      color: '#f09f58', // Orange
      icon: 'fa-user-group'
    },
    {
      title: 'New Rider Discount',
      desc: 'Experience the thrill with 50% off your first 3 premium rides.',
      code: 'FIRST50',
      color: '#4db6ff', // Blue
      icon: 'fa-bolt'
    },
    {
      title: 'Weekend Warrior',
      desc: 'Escape the routine with 20% off all rides from Friday to Sunday.',
      code: 'ESCAPE20',
      color: '#1ebb74', // Green
      icon: 'fa-tree'
    },
    {
      title: 'VIP Access',
      desc: 'Be the first to ride the next-gen fleet with exclusive early bookings.',
      code: 'PRESTIGE',
      color: '#a035ed', // Purple
      icon: 'fa-diamond'
    }
  ];

  return (
    <div className="flex h-screen bg-[#fcfcfc] dark:bg-[#181615] text-gray-900 dark:text-white font-sans overflow-hidden transition-colors duration-300">
      
      {/* ── SIDEBAR ── */}
      <SidebarDesktop user={user} navigate={navigate} />

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto no-scrollbar relative w-full pt-8 px-6 lg:px-12 bg-[#fafafa] dark:bg-[#131110]">
        
        <HeaderDesktop title="Offers & Promos" subtitle="Exclusive rewards for our premium community" showSearch={true} />

        <div className="w-full max-w-[1300px] mx-auto pb-16 flex flex-col mt-4">
          
          {/* BANNER */}
          <div className="w-full bg-gradient-to-r from-gray-900 to-[#2a2725] dark:from-[#2a2725] dark:to-[#2a2725] rounded-[16px] overflow-hidden shadow-2xl relative mb-8 flex items-center h-[280px]">
             {/* Gradient Graphic to mimic bike image abstraction via CSS */}
             <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-black/60 to-transparent flex items-center justify-end pr-8 overflow-hidden mix-blend-multiply opacity-50">
                <i className="fa-solid fa-motorcycle text-[#111] text-[400px] absolute -right-20 -bottom-20 opacity-20"></i>
             </div>

             <div className="relative z-10 w-full lg:w-2/3 p-10 lg:p-12">
                <p className="text-[#f09f58] text-[10px] font-bold uppercase tracking-[0.2em] mb-4">Limited Edition</p>
                <h2 className="text-[40px] lg:text-[48px] font-bold text-white leading-tight tracking-tight mb-4 font-['Manrope']">The Summer Velocity Pass</h2>
                <p className="text-[#a0a0a0] text-[15px] leading-relaxed mb-8 max-w-lg">Unlock unlimited rides across the city throughout the season. Premium access to all electric models included.</p>
                
                <div className="flex gap-4">
                   <button className="bg-[#f09f58] hover:bg-[#d98b4b] text-[#111] font-bold text-[12px] uppercase tracking-widest px-8 py-3.5 rounded-[6px] transition-colors shadow-lg">
                      Explore Pass
                   </button>
                   <button className="bg-[#1a1817] hover:bg-[#111] text-white border border-[#333] font-bold text-[12px] uppercase tracking-widest px-8 py-3.5 rounded-[6px] transition-colors relative z-10">
                      Learn More
                   </button>
                </div>
             </div>
          </div>

          {/* OFFERS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
             {promos.map((promo, idx) => (
                <div key={idx} className="bg-white dark:bg-[#242221] rounded-[12px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-xl border border-gray-100 dark:border-[#2d2a29] flex flex-col hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden">
                   
                   {/* Promo Top Inner Glow */}
                   <div className="absolute inset-x-0 top-0 h-32 opacity-5 dark:opacity-10 blur-2xl pointer-events-none" style={{ backgroundColor: promo.color }}></div>

                   <div className="relative z-10 h-full flex flex-col">
                      <div className="w-12 h-12 rounded-[8px] flex items-center justify-center mb-6 shadow-md" style={{ backgroundColor: promo.color }}>
                         <i className={`fa-solid ${promo.icon} text-[18px] text-white dark:text-[#111]`}></i>
                      </div>

                      <h3 className="text-[22px] font-bold text-gray-900 dark:text-white mb-3 tracking-tight font-['Manrope']">{promo.title}</h3>
                      <p className="text-gray-500 dark:text-[#a0a0a0] text-[13px] leading-relaxed mb-8">{promo.desc}</p>
                      
                      <div className="mt-auto">
                         <div className="w-full bg-[#f6f6f8] dark:bg-[#111] rounded-[6px] p-3.5 flex justify-between items-center mb-4 border border-gray-100 dark:border-[#1a1a1a]">
                            <span className="font-mono text-[13px] font-bold tracking-widest" style={{ color: promo.color }}>{promo.code}</span>
                            <i className="fa-regular fa-copy text-gray-400 dark:text-[#555] hover:text-gray-800 dark:hover:text-white cursor-pointer transition-colors text-sm"></i>
                         </div>

                         <button className="w-full font-bold text-[12px] tracking-widest py-3.5 flex items-center justify-center rounded-[6px] transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-md uppercase text-white dark:text-[#111]" style={{ backgroundColor: promo.color }}>
                            Apply
                         </button>
                      </div>
                   </div>
                </div>
             ))}
          </div>

          {/* BOTTOM SECTION */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
             
             {/* How it works */}
             <div className="bg-white dark:bg-[#242221] rounded-[12px] p-8 border border-gray-100 dark:border-[#2d2a29] flex flex-col md:flex-row md:items-center justify-between gap-8 h-full shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-xl transition-colors duration-300">
                <div>
                   <h3 className="text-[18px] font-bold text-gray-900 dark:text-white tracking-tight mb-4 font-['Manrope']">How it works</h3>
                   <p className="text-gray-500 dark:text-[#a0a0a0] text-[14px] leading-relaxed max-w-2xl">Promotions are automatically applied during checkout if selected. One promo per ride. Referral credits are added to your wallet immediately after your friend's first ride.</p>
                </div>
                <div className="w-16 h-16 bg-gray-50 dark:bg-[#1a1817] rounded-[14px] flex items-center justify-center shrink-0 border border-gray-200 dark:border-[#222]">
                   <div className="w-7 h-7 rounded-full bg-[#f09f58] flex items-center justify-center">
                      <i className="fa-solid fa-info text-white dark:text-[#111] text-[14px] font-bold"></i>
                   </div>
                </div>
             </div>

             {/* Savings Card */}
             <div className="bg-white dark:bg-[#242221] rounded-[12px] p-8 border border-gray-100 dark:border-[#2d2a29] flex flex-col items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-xl h-full relative overflow-hidden transition-colors duration-300">
                {/* Abstract light glow behind amount */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] dark:opacity-[0.05]">
                   <div className="w-40 h-40 bg-[#f09f58] rounded-full blur-[40px]"></div>
                </div>

                <div className="relative z-10 text-center w-full">
                   <h2 className="text-[42px] font-black tracking-tighter text-[#f09f58] font-['Manrope'] mb-1">₹142.00</h2>
                   <p className="text-gray-400 dark:text-[#888] text-[9px] uppercase tracking-[0.2em] font-bold mb-6">Saved this month</p>
                   <div className="w-full h-[1px] bg-gray-100 dark:bg-[#333] mb-6"></div>
                   <button className="text-[#f09f58] text-[12px] font-bold hover:text-[#d98b4b] transition-colors">
                      View History
                   </button>
                </div>
             </div>
             
          </div>

        </div>
      </main>

    </div>
  );
};

export default UserOffersDesktop;
