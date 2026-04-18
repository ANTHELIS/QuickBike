import React, { useState } from 'react';
import SidebarDesktop from './SidebarDesktop';
import HeaderDesktop from './HeaderDesktop';

const UserHelpDesktop = ({ navigate, user }) => {
  const [activeFaq, setActiveFaq] = useState(0);

  const faqs = [
    { 
       q: 'How do I book a premium concierge ride?', 
       a: 'Select your pickup location and choose from our curated fleet of high-performance bikes. Confirm your rider details, and your concierge will be dispatched immediately to your location.', 
       iconBg: 'bg-[#fddfb8] dark:bg-[#e26900]/20', 
       iconColor: 'text-[#ec7100]', 
       icon: 'fa-calendar-check' 
    },
    { 
       q: 'Which payment methods are accepted?', 
       a: 'We accept all major credit cards, UPI, and the integrated QuickBike wallet. You can also pay by cash directly to your captain.', 
       iconBg: 'bg-[#fbcf9e] dark:bg-[#e26900]/20', 
       iconColor: 'text-[#e26900]', 
       icon: 'fa-money-bill' 
    },
    { 
       q: 'What safety measures are in place?', 
       a: 'All riders undergo background checks. Your live location is trackable, and we have a zero-tolerance policy for safety violations.', 
       iconBg: 'bg-[#0aa5f8] dark:bg-[#0aa5f8]/20', 
       iconColor: 'text-white dark:text-[#0aa5f8]', 
       icon: 'fa-shield-halved' 
    },
    { 
       q: 'Can I schedule a trip in advance?', 
       a: 'Currently, QuickBike supports instant bookings only to ensure ultra-fast precision dispatching.', 
       iconBg: 'bg-[#7a7a7a] dark:bg-[#555]/30', 
       iconColor: 'text-white', 
       icon: 'fa-info' 
    },
  ];

  return (
    <div className="flex h-screen bg-[#fcfcfc] dark:bg-[#111111] text-gray-900 dark:text-white font-sans overflow-hidden transition-colors duration-300">
      
      {/* ── SIDEBAR ── */}
      <SidebarDesktop user={user} navigate={navigate} />

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto no-scrollbar bg-[#fafafa] dark:bg-[#111] relative pt-8 px-6 lg:px-12">
        
        <HeaderDesktop title="Help & Support" subtitle="How can we assist your journey today? Browse our curated knowledge base or reach out to our concierge team." showSearch={true} />

        <div className="w-full max-w-[1200px] mx-auto pb-16 flex flex-col mt-4">

          <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-10 xl:gap-14 items-start pb-10">
             
             {/* LEFT COLUMN: FAQ */}
             <div className="flex flex-col gap-6">
                
                <div className="flex items-center gap-4 mb-4">
                   <div className="w-6 h-[2px] bg-[#c35c02] rounded-full shrink-0"></div>
                   <h2 className="text-[22px] font-bold text-gray-900 dark:text-white font-['Manrope'] tracking-tight">Frequently Asked Questions</h2>
                </div>

                <div className="space-y-4">
                   {faqs.map((faq, idx) => {
                      const isActive = activeFaq === idx;
                      return (
                         <div 
                           key={idx} 
                           onClick={() => setActiveFaq(isActive ? -1 : idx)}
                           className={`rounded-[16px] cursor-pointer transition-all border ${
                               isActive 
                                 ? 'bg-white dark:bg-[#18181A] border-gray-100 dark:border-[#333] shadow-[0_10px_40px_rgb(0,0,0,0.04)] p-6 lg:p-6' 
                                 : 'bg-[#f4f4f4] dark:bg-[#18181A] border-transparent hover:bg-gray-100 dark:hover:bg-[#222] p-6'
                             } flex flex-col`}
                         >
                            <div className="flex items-center justify-between">
                               <div className="flex items-center gap-5">
                                  <div className={`w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0 ${faq.iconBg}`}>
                                     <i className={`fa-solid ${faq.icon} text-[15px] ${faq.iconColor}`}></i>
                                  </div>
                                  <h3 className="font-bold text-[14px] text-[#111] dark:text-[#eee]">{faq.q}</h3>
                               </div>
                               <i className={`fa-solid fa-${isActive ? 'chevron-up' : 'plus'} text-[#888] dark:text-[#555] text-[13px] shrink-0 ml-4`}></i>
                            </div>
                            
                            {isActive && (
                               <div className="mt-4 pl-14 text-[#555] dark:text-[#999] text-[13px] leading-relaxed pr-6 animate-fade-in">
                                  {faq.a}
                               </div>
                            )}
                         </div>
                       );
                   })}
                </div>

                {/* Need a Tailored Solution Card */}
                <div className="bg-[#313131] dark:bg-[#1e1c1a] rounded-[24px] p-8 lg:p-10 mt-8 relative overflow-hidden flex flex-col shadow-xl">
                   <div className="absolute -bottom-16 -right-16 w-60 h-60 bg-white/5 rotate-12 rounded-[40px] pointer-events-none"></div>
                   
                   <div className="relative z-10 max-w-sm">
                      <h2 className="text-[22px] font-bold text-white mb-3">Need a tailored solution?</h2>
                      <p className="text-[#a0a0a0] text-[14px] leading-relaxed mb-0">
                         Our corporate partners enjoy priority dispatch and bespoke billing options.
                      </p>
                   </div>
                </div>

             </div>

             {/* RIGHT COLUMN: Contact Form */}
             <div className="flex flex-col relative w-full xl:mt-2">
                <div className="bg-white dark:bg-[#18181A] dark:border dark:border-[#222] rounded-[32px] p-8 lg:p-10 shadow-[0_15px_60px_rgb(0,0,0,0.06)] dark:shadow-none flex flex-col items-center relative z-10 transition-colors duration-300">
                   
                   <div className="w-full text-left mb-8">
                      <h2 className="text-[26px] font-black text-gray-900 dark:text-white font-['Manrope'] mb-2 tracking-tight">Send a Message</h2>
                      <p className="text-[#666] dark:text-[#888] text-[12px] font-medium">Average response time: &lt; 15 minutes</p>
                   </div>

                   <form className="w-full space-y-6" onSubmit={e => e.preventDefault()}>
                      <div>
                         <label className="text-[10px] font-bold text-[#a0a0a0] dark:text-[#666] uppercase tracking-widest block mb-2.5">Full Name</label>
                         <input type="text" placeholder="Julian Vane" className="w-full bg-[#f6f6f8] dark:bg-[#111] border border-transparent rounded-[12px] py-3 px-4 text-gray-800 dark:text-gray-200 flex-1 focus:outline-none focus:bg-white dark:focus:bg-[#111] focus:border-[#ec7b16] dark:focus:border-[#ec7b16] transition-all font-medium text-[13px] placeholder-[#ccc] dark:placeholder-[#555]" />
                      </div>
                      <div>
                         <label className="text-[10px] font-bold text-[#a0a0a0] dark:text-[#666] uppercase tracking-widest block mb-2.5">Email Address</label>
                         <input type="email" placeholder="julian@example.com" className="w-full bg-[#f6f6f8] dark:bg-[#111] border border-transparent rounded-[12px] py-3 px-4 text-gray-800 dark:text-gray-200 focus:outline-none focus:bg-white dark:focus:bg-[#111] focus:border-[#ec7b16] dark:focus:border-[#ec7b16] transition-all font-medium text-[13px] placeholder-[#ccc] dark:placeholder-[#555]" />
                      </div>
                      <div>
                         <label className="text-[10px] font-bold text-[#a0a0a0] dark:text-[#666] uppercase tracking-widest block mb-2.5">Your Message</label>
                         <textarea placeholder="How can we help you?" rows="4" className="w-full bg-[#f6f6f8] dark:bg-[#111] border border-transparent rounded-[12px] py-4 px-4 text-gray-800 dark:text-gray-200 focus:outline-none focus:bg-white dark:focus:bg-[#111] focus:border-[#ec7b16] dark:focus:border-[#ec7b16] transition-all font-medium text-[13px] resize-none placeholder-[#ccc] dark:placeholder-[#555]"></textarea>
                      </div>

                      <button className="w-full mt-2 bg-[#ea7a0f] hover:bg-[#d86f0d] text-white font-bold text-[13px] py-4 rounded-[12px] shadow-lg transition-transform hover:scale-[1.02] flex items-center justify-center gap-3 active:scale-95">
                         <i className="fa-solid fa-paper-plane text-[13px] opacity-90"></i> Send Inquiry
                      </button>
                   </form>

                   {/* Footer Icons */}
                   <div className="flex items-center justify-center gap-10 mt-10 w-full">
                      <i className="fa-solid fa-at text-[#bcbcbc] hover:text-[#ec7b16] cursor-pointer text-[18px] transition-colors"></i>
                      <i className="fa-solid fa-phone text-[#bcbcbc] hover:text-[#ec7b16] cursor-pointer text-[16px] transition-colors"></i>
                      <i className="fa-solid fa-location-dot text-[#bcbcbc] hover:text-[#ec7b16] cursor-pointer text-[16px] transition-colors"></i>
                   </div>
                </div>

                {/* Floating Chat Button (Bottom right overlap design) */}
                <div className="absolute -bottom-5 -right-0 xl:-right-5 w-[60px] h-[60px] bg-[#a95213] rounded-[14px] flex items-center justify-center shadow-2xl cursor-pointer hover:bg-[#8f430c] transition-colors z-50 group shadow-[0_10px_30px_rgba(169,82,19,0.4)]">
                   <div className="absolute -top-[5px] -right-[5px] w-[14px] h-[14px] bg-[#d32626] rounded-full border-[2px] border-white dark:border-[#111] shadow-sm z-10"></div>
                   <i className="fa-solid fa-message text-[#fff] text-[22px] group-hover:scale-110 transition-transform"></i>
                </div>
             </div>

          </div>

        </div>
      </main>

    </div>
  );
};

export default UserHelpDesktop;
