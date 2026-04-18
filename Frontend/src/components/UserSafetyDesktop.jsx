import React from 'react';
import SidebarDesktop from './SidebarDesktop';
import HeaderDesktop from './HeaderDesktop';

const UserSafetyDesktop = ({ navigate, user }) => {
  const trustedContacts = [
    {
      id: 1,
      name: 'Marcus Chen',
      phone: '+1 (555) 092-4822',
      badge: 'ALWAYS ACTIVE',
      badgeClass: 'text-[#f46300] bg-[#f46300]/10 border border-[#f46300]/20',
      avatarBg: 'bg-[#e0eff5] dark:bg-[#1a3845]',
      avatarBorder: 'border-[#c1e0eb] dark:border-[#2a5966]',
      avatarIcon: 'fa-user-tie text-[#327a8f]',
    },
    {
      id: 2,
      name: 'Sarah Williams',
      phone: '+1 (555) 837-1104',
      badge: 'ONLY NIGHTS',
      badgeClass: 'text-gray-500 dark:text-[#999] bg-gray-100 dark:bg-[#444] border border-gray-200 dark:border-[#555]',
      avatarBg: 'bg-[#e0f5ed] dark:bg-[#1a4538]',
      avatarBorder: 'border-[#c1ebdd] dark:border-[#2a6650]',
      avatarIcon: 'fa-user-nurse text-[#328f6c]',
    }
  ];

  return (
    <div className="flex h-screen bg-[#fcfcfc] dark:bg-[#131313] text-gray-900 dark:text-white font-sans overflow-hidden transition-colors duration-300">
      
      {/* ── SIDEBAR ── */}
      <SidebarDesktop user={user} navigate={navigate} />

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto no-scrollbar relative w-full pt-8 px-6 lg:px-12 bg-[#fafafa] dark:bg-[#111]">
        
        <HeaderDesktop title="Safety Center" subtitle="Your digital concierge for every journey. Manage your emergency settings, track your live status, and stay informed on rider safety." />

        <div className="w-full max-w-[1200px] mx-auto pb-16 flex flex-col mt-8">

          <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-8">
             
             {/* LEFT COLUMN: Emergency & Contacts */}
             <div className="flex flex-col gap-6">
                
                {/* Emergency Response Card */}
                <div className="bg-white dark:bg-[#222222] rounded-[16px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-xl flex flex-col lg:flex-row justify-between items-start lg:items-center border border-gray-100 dark:border-transparent transition-colors duration-300">
                   
                   <div className="flex-1 lg:max-w-md">
                      <div className="flex items-center gap-3 mb-6">
                         <div className="w-2 h-2 rounded-full bg-[#f46300] shadow-[0_0_10px_#f46300]"></div>
                         <span className="text-[#f46300] dark:text-[#fcbfa4] text-[10px] font-bold uppercase tracking-[0.15em]">Critical Action</span>
                      </div>
                      
                      <h2 className="text-[28px] lg:text-[32px] font-bold text-gray-900 dark:text-white leading-tight mb-4 tracking-tight">Emergency<br/>Response</h2>
                      <p className="text-gray-500 dark:text-[#a0a0a0] text-[14px] leading-relaxed mb-8 pr-4">
                         Activating SOS will immediately share your location with emergency services and your trusted contacts. Our concierge will remain on the line until help arrives.
                      </p>
                      
                      <div className="flex flex-col sm:flex-row gap-4 w-full">
                         <button className="flex-1 bg-[#ff6f1a] hover:bg-[#eb6110] text-white dark:text-[#111] font-bold py-3.5 rounded-[6px] shadow-lg flex items-center justify-center gap-3 transition-colors">
                            <i className="fa-solid fa-asterisk text-[12px] font-black"></i> TRIGGER SOS
                         </button>
                         <button className="flex-1 bg-gray-50 dark:bg-[#333333] hover:bg-gray-100 dark:hover:bg-[#404040] text-gray-900 dark:text-white font-bold py-3.5 rounded-[6px] border border-gray-200 dark:border-[#404040] transition-colors">
                            Call Local Police
                         </button>
                      </div>
                   </div>
                   
                   <div className="mt-8 lg:mt-0 w-[180px] h-[220px] lg:w-[240px] lg:h-[260px] bg-red-50 dark:bg-[#4a3e36] rounded-[16px] flex items-center justify-center shrink-0 shadow-inner overflow-hidden border border-red-100 dark:border-[#52443a] self-center transition-colors duration-300">
                      <div className="w-[100px] h-[100px] lg:w-[120px] lg:h-[120px] bg-red-100 dark:bg-[#2d3032] rounded-[20px] flex items-center justify-center shadow-[0_15px_40px_rgba(255,0,0,0.1)] dark:shadow-[0_15px_40px_rgba(0,0,0,0.6)] border border-red-200 dark:border-[#3b3e40] animate-pulse cursor-pointer hover:scale-105 transition-transform duration-300">
                         <i className="fa-solid fa-broadcast-tower text-red-500 dark:text-[#fa9a69] text-4xl"></i>
                      </div>
                   </div>

                </div>

                {/* Trusted Contacts Card */}
                <div className="bg-white dark:bg-[#222222] rounded-[16px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-xl mt-2 border border-gray-100 dark:border-transparent transition-colors duration-300">
                   <div className="flex justify-between items-start mb-8">
                      <div>
                         <h2 className="text-[24px] font-bold text-gray-900 dark:text-white tracking-tight mb-1">Trusted Contacts</h2>
                         <p className="text-gray-500 dark:text-[#a0a0a0] text-[14px]">These people will be alerted if SOS is triggered.</p>
                      </div>
                      <button className="w-12 h-10 bg-gray-50 dark:bg-[#333333] rounded-[8px] flex items-center justify-center border border-gray-200 dark:border-[#444] hover:bg-gray-100 dark:hover:bg-[#404040] transition-colors shadow-sm">
                         <i className="fa-solid fa-user-plus text-gray-400 dark:text-[#a0a0a0] text-[16px]"></i>
                      </button>
                   </div>
                   
                   <div className="space-y-4">
                      {trustedContacts.map(contact => (
                         <div key={contact.id} className="bg-gray-50 dark:bg-[#111111] rounded-[12px] p-5 flex flex-col sm:flex-row sm:items-center justify-between border border-gray-100 dark:border-[#262626] hover:border-gray-200 dark:hover:border-[#3a3a3a] transition-colors gap-4 sm:gap-0">
                            
                            <div className="flex items-center gap-4">
                               <div className={`w-14 h-14 ${contact.avatarBg} rounded-[10px] flex items-center justify-center overflow-hidden ${contact.avatarBorder} border shadow-inner`}>
                                  <i className={`fa-solid ${contact.avatarIcon} text-xl opacity-80`}></i>
                               </div>
                               <div>
                                  <p className="text-gray-900 dark:text-white font-bold text-[16px] tracking-tight">{contact.name}</p>
                                  <p className="text-gray-500 dark:text-[#888] text-[13px] mt-0.5">{contact.phone}</p>
                               </div>
                            </div>
                            
                            <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-auto w-full">
                               <span className={`${contact.badgeClass} text-[9px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-full`}>
                                  {contact.badge}
                               </span>
                               <i className="fa-solid fa-ellipsis-vertical text-gray-400 dark:text-[#666] hover:text-gray-900 dark:hover:text-white cursor-pointer px-2 text-xl transition-colors"></i>
                            </div>

                         </div>
                      ))}
                   </div>
                </div>

             </div>

             {/* RIGHT COLUMN: Journey Tracking & Smart Modules */}
             <div className="flex flex-col gap-6">
                
                {/* Active Journey Map Card */}
                <div className="bg-white dark:bg-[#222222] rounded-[16px] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-xl flex flex-col relative h-[420px] lg:h-[450px] border border-gray-100 dark:border-transparent transition-colors duration-300">
                   {/* Background Map Gradient Overlay */}
                   <div className="absolute inset-0 bg-[#e6eff5] dark:bg-[#16212b] transition-colors duration-300">
                      {/* Using CSS grid as abstract map representation since we lack original graphic */}
                      <div className="absolute inset-0 opacity-[0.4] dark:opacity-[0.25] mix-blend-overlay" style={{
                          backgroundImage: 'linear-gradient(rgba(0,0,0,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.2) 1px, transparent 1px)',
                          backgroundSize: '30px 30px',
                          transform: 'perspective(1000px) rotateX(60deg) scale(2) translateY(-20%)'
                      }}></div>
                   </div>
                   <div className="absolute inset-x-0 bottom-0 top-[30%] bg-gradient-to-t from-white dark:from-[#222222] to-transparent z-10 block transition-colors duration-300"></div>
                   
                   <div className="relative z-20 flex justify-between p-6">
                      <h3 className="font-['Brush_Script_MT',cursive] text-gray-900 dark:text-white/50 text-[32px] select-none italic tracking-wider leading-none">Dynamic map</h3>
                      <span className="bg-[#00aaff] text-white dark:text-[#111] text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-full shadow-[0_0_20px_rgba(0,170,255,0.6)] h-max flex items-center justify-center shrink-0">Live Tracking</span>
                   </div>
                   
                   <div className="relative z-20 mt-auto p-8 border-t border-gray-100 dark:border-[#333] bg-white dark:bg-[#222] transition-colors duration-300">
                      <h3 className="text-[20px] font-bold text-gray-900 dark:text-white tracking-tight mb-2">Active Journey</h3>
                      <p className="text-gray-500 dark:text-[#a0a0a0] text-[14px] mb-8">Sharing status with 3 contacts.</p>
                      <button className="w-full bg-transparent border border-gray-300 dark:border-[#4a4a4a] text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-[#2a2a2a] hover:border-gray-400 dark:hover:border-[#666] font-bold py-3.5 rounded-[8px] transition-all flex items-center justify-center gap-3 text-[13px]">
                         <i className="fa-solid fa-share-nodes text-[15px]"></i> Share Journey Link
                      </button>
                   </div>
                </div>

                {/* Smart Helmet Sync */}
                <div className="bg-white dark:bg-[#282828] border border-gray-100 dark:border-transparent rounded-[16px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-xl relative overflow-hidden group transition-colors duration-300">
                   <div className="absolute -right-6 -bottom-6 opacity-[0.05] dark:opacity-30 text-gray-900 dark:text-[#444] group-hover:rotate-[30deg] transition-transform duration-700 ease-in-out">
                     <i className="fa-solid fa-arrows-rotate text-[180px]"></i>
                   </div>
                   <div className="relative z-10 w-4/5 pt-2">
                      <div className="w-10 h-10 rounded-full bg-orange-50 dark:bg-[#3d2c25] flex items-center justify-center mb-6 shadow-inner border border-orange-100 dark:border-transparent">
                         <i className="fa-solid fa-lightbulb text-[#fa9a69] text-xl opacity-90 text-[shadow:0_0_20px_#fa9a69]"></i>
                      </div>
                      <h3 className="text-[22px] font-bold text-gray-900 dark:text-white tracking-tight mb-3">Smart Helmet Sync</h3>
                      <p className="text-gray-500 dark:text-[#a0a0a0] text-[14px] leading-relaxed mb-6 pr-4">Sync your Aegis helmet to enable automatic crash detection and brake light synchronization.</p>
                      <button className="text-gray-900 dark:text-white hover:text-gray-600 dark:hover:text-[#dcdcdc] font-bold text-[11px] uppercase tracking-widest transition-colors flex items-center gap-2 group/btn pb-1 w-max">
                         SETUP NOW <i className="fa-solid fa-arrow-right text-[10px] group-hover/btn:translate-x-1 transition-transform"></i>
                      </button>
                   </div>
                </div>

                {/* The Night Guide */}
                <div className="bg-white dark:bg-[#282828] border border-gray-100 dark:border-transparent rounded-[16px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-xl relative overflow-hidden group transition-colors duration-300">
                   <div className="absolute -right-10 -bottom-10 opacity-[0.05] dark:opacity-30 text-gray-900 dark:text-[#444] group-hover:scale-110 transition-transform duration-700 ease-in-out">
                     <i className="fa-solid fa-moon text-[180px] -rotate-12"></i>
                   </div>
                   <div className="relative z-10 w-4/5 pt-2">
                      <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-[#1c2c3d] flex items-center justify-center mb-6 shadow-inner border border-blue-100 dark:border-transparent">
                         <i className="fa-solid fa-shield-check text-[#4e9dfc] text-xl opacity-90 text-[shadow:0_0_20px_#4e9dfc]"></i>
                      </div>
                      <h3 className="text-[22px] font-bold text-gray-900 dark:text-white tracking-tight mb-3">The Night Guide</h3>
                      <p className="text-gray-500 dark:text-[#a0a0a0] text-[14px] leading-relaxed mb-6 pr-4">Our AI suggests high-visibility routes and alerts contacts during evening rides automatically.</p>
                      <button className="text-gray-900 dark:text-white hover:text-gray-600 dark:hover:text-[#dcdcdc] font-bold text-[11px] uppercase tracking-widest transition-colors flex items-center gap-2 group/btn pb-1 w-max">
                         READ GUIDE <i className="fa-solid fa-arrow-right text-[10px] group-hover/btn:translate-x-1 transition-transform"></i>
                      </button>
                   </div>
                </div>

             </div>

          </div>

        </div>
      </main>

    </div>
  );
};

export default UserSafetyDesktop;
