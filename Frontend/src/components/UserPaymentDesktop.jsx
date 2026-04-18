import React, { useState } from 'react';
import SidebarDesktop from './SidebarDesktop';
import HeaderDesktop from './HeaderDesktop';

const UserPaymentDesktop = ({ user, navigate }) => {
  const recentActivity = [
    { date: 'Oct 24, 2023', title: 'Downtown Ride #8812', sub: '12.4 km trip', method: '**** 4290', amount: '-₹14.50', isPositive: false },
    { date: 'Oct 22, 2023', title: 'Wallet Top Up', sub: 'Axis Bank UPI', method: 'UPI alex@okaxis', amount: '+₹500.00', isPositive: true },
    { date: 'Oct 20, 2023', title: 'Park Access Pass', sub: 'One-day permit', method: 'Wallet Balance', amount: '-₹5.00', isPositive: false },
    { date: 'Oct 19, 2023', title: 'Weekend Group Ride', sub: '4 bikes rented', method: '**** 8812', amount: '-₹84.20', isPositive: false },
  ];

  return (
    <div className="flex h-screen bg-[#fcfcfc] dark:bg-[#111111] text-gray-900 dark:text-white font-sans overflow-hidden transition-colors duration-300">
      
      {/* ── SIDEBAR ── */}
      <SidebarDesktop user={user} navigate={navigate} />

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto no-scrollbar relative w-full pt-8 px-6 lg:px-12 bg-[#fafafa] dark:bg-[#111]">
        
        <HeaderDesktop showSearch={true} title="Payment Methods" subtitle="Manage your precision mobility subscriptions and credits." />

        <div className="w-full max-w-[1200px] mx-auto pb-16 flex flex-col mt-8">

          {/* MAIN GRID LAYOUT */}
          <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-x-10 gap-y-10 items-start">
             
             {/* LEFT COLUMN: Wallet & UPI */}
             <div className="flex flex-col gap-10">
                
                {/* QUICKBIKE WALLET CARD */}
                <div className="bg-white dark:bg-[#1e1c1a] rounded-[16px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-2xl relative border border-gray-100 dark:border-[#2a2624] transition-colors duration-300">
                   <div className="flex items-center gap-3 mb-8">
                      <div className="w-6 h-6 bg-[#f57b0f]/10 dark:bg-[#f57b0f]/20 rounded-md flex items-center justify-center border border-[#f57b0f]/20 dark:border-[#f57b0f]/30">
                         <i className="fa-solid fa-wallet text-[#f57b0f] text-[10px]"></i>
                      </div>
                      <span className="text-[10px] font-bold text-gray-600 dark:text-white/80 uppercase tracking-widest">QuickBike Wallet</span>
                   </div>

                   <h2 className="text-[48px] font-black font-['Manrope'] tracking-tighter text-gray-900 dark:text-white mb-2 leading-none">₹1,240.50</h2>
                   <div className="flex items-center gap-2 mb-10">
                      <i className="fa-solid fa-arrow-trend-up text-[#06b6d4] text-[12px]"></i>
                      <span className="text-[13px] font-bold text-[#06b6d4]">+12% from last month</span>
                   </div>

                   <div className="flex gap-4">
                      <button className="flex-1 bg-gradient-to-r from-[#fc9b65] to-[#f4701f] text-[#111] font-bold text-[13px] py-3.5 rounded-[6px] tracking-wide shadow-lg hover:brightness-110 transition-all">
                         Top Up
                      </button>
                      <button className="flex-1 bg-transparent border border-gray-300 dark:border-[#333] text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-[#222] font-bold text-[13px] py-3.5 rounded-[6px] tracking-wide transition-colors">
                         Details
                      </button>
                   </div>
                </div>

                {/* UPI OPTIONS */}
                <div className="bg-white dark:bg-[#161618] rounded-[16px] p-8 border border-gray-100 dark:border-[#222] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none transition-colors duration-300">
                   <h3 className="text-[20px] font-bold text-gray-900 dark:text-white mb-6 font-['Manrope'] tracking-tight">UPI Options</h3>
                   
                   <div className="space-y-4 mb-6">
                      {/* Active UPI */}
                      <div className="bg-gray-50 dark:bg-[#202022] rounded-[8px] p-5 border border-gray-200 dark:border-[#333] flex items-center justify-between cursor-pointer shadow-sm">
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white dark:bg-black/40 rounded-md flex items-center justify-center border border-gray-200 dark:border-white/5 shadow-sm dark:shadow-none">
                               <i className="fa-solid fa-money-bill-transfer text-[#f57b0f] text-sm"></i>
                            </div>
                            <div>
                               <p className="text-[14px] font-bold text-gray-900 dark:text-white">alex@okaxis</p>
                               <p className="text-[11px] text-gray-500 font-medium mt-0.5">Linked to Primary</p>
                            </div>
                         </div>
                         <div className="w-5 h-5 bg-[#f57b0f] rounded-full flex items-center justify-center">
                            <i className="fa-solid fa-check text-white text-[10px]"></i>
                         </div>
                      </div>

                      {/* Inactive UPI */}
                      <div className="bg-transparent border border-transparent rounded-[8px] p-5 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-[#222] transition-colors">
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white dark:bg-black/40 rounded-md flex items-center justify-center border border-gray-200 dark:border-white/5 shadow-sm dark:shadow-none">
                               <i className="fa-solid fa-building-columns text-[#f57b0f] text-sm"></i>
                            </div>
                            <div>
                               <p className="text-[14px] font-bold text-gray-600 dark:text-gray-300">9876543210@paytm</p>
                               <p className="text-[11px] text-gray-500 dark:text-gray-600 font-medium mt-0.5">Secondary ID</p>
                            </div>
                         </div>
                         <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-[#333]"></div>
                      </div>
                   </div>

                   <button className="w-full rounded-[8px] border-2 border-dashed border-gray-300 dark:border-[#333] hover:border-gray-400 dark:hover:border-gray-500 text-gray-600 dark:hover:text-white transition-colors dark:text-gray-400 py-3.5 text-[12px] font-bold tracking-wide">
                      + Link New UPI ID
                   </button>
                </div>
             </div>

             {/* RIGHT COLUMN: Saved Cards & Recent Activity */}
             <div className="flex flex-col gap-10">
                
                {/* SAVED CARDS */}
                <div>
                   <div className="flex justify-between items-end mb-6">
                      <h3 className="text-[20px] font-bold text-gray-900 dark:text-white font-['Manrope'] tracking-tight">Saved Cards</h3>
                      <button className="text-[#ea7a0f] text-[12px] font-bold hover:text-orange-600 dark:hover:text-orange-400 transition-colors">Add New Card</button>
                   </div>
                   
                   <div className="flex items-center gap-5 overflow-x-auto no-scrollbar pb-2">
                      {/* Dark Visa Card - always dark in both modes for realism */}
                      <div className="bg-[#161616] border border-[#2a2a2a] w-[280px] h-[170px] shrink-0 rounded-[12px] p-6 flex flex-col justify-between shadow-[0_8px_30px_rgb(0,0,0,0.12)] xl:shadow-xl relative overflow-hidden group hover:border-[#3a3a3a] transition-colors">
                         <div className="flex justify-between items-start w-full">
                            <div className="w-8 h-6 bg-[#2a2a2a] rounded flex items-center justify-center">
                               <i className="fa-solid fa-wifi text-[10px] text-gray-300 rotate-90"></i>
                            </div>
                            <div className="w-10 h-6 bg-[#000] border border-[#222] rounded flex items-center justify-center italic font-black text-white text-[9px]">VISA</div>
                         </div>
                         <div className="w-full">
                            <p className="text-[14px] text-gray-400 tracking-[0.3em] font-medium flex gap-4">
                               <span>****</span><span>****</span><span>****</span>
                            </p>
                            <p className="text-[16px] text-white tracking-[0.3em] font-medium mt-1">4290</p>
                         </div>
                         <div className="flex justify-between w-full mt-2">
                            <div>
                               <p className="text-[7px] text-[#555] uppercase tracking-[0.1em] mb-0.5">Card Holder</p>
                               <p className="text-[10px] font-bold tracking-widest text-[#ddd]">ALEX STEVENS</p>
                            </div>
                            <div>
                               <p className="text-[7px] text-[#555] uppercase tracking-[0.1em] mb-0.5 text-right">Expires</p>
                               <p className="text-[10px] font-bold tracking-widest text-[#ddd] text-right">09/26</p>
                            </div>
                         </div>
                      </div>

                      {/* Generic Card */}
                      <div className="bg-[#222222] border border-[#333] w-[280px] h-[170px] shrink-0 rounded-[12px] p-6 flex flex-col justify-between shadow-[0_8px_30px_rgb(0,0,0,0.12)] xl:shadow-xl relative overflow-hidden group hover:border-[#444] transition-colors">
                         <div className="flex justify-between items-start w-full">
                            <div className="w-8 h-6 bg-[#333] rounded flex items-center justify-center">
                               <i className="fa-solid fa-wifi text-[10px] text-gray-300 rotate-90"></i>
                            </div>
                         </div>
                         <div className="w-full">
                            <p className="text-[14px] text-gray-400 tracking-[0.3em] font-medium flex gap-4">
                               <span>****</span><span>****</span><span>****</span>
                            </p>
                            <p className="text-[16px] text-white tracking-[0.2em] font-medium mt-1">8812</p>
                         </div>
                         <div className="flex justify-between w-full mt-2">
                            <div>
                               <p className="text-[7px] text-[#555] uppercase tracking-[0.1em] mb-0.5">Card Holder</p>
                               <p className="text-[10px] font-bold tracking-widest text-[#ddd]">ALEX STEVENS</p>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>

                {/* RECENT ACTIVITY */}
                <div className="bg-white dark:bg-[#18181A] rounded-[16px] p-8 border border-gray-100 dark:border-[#222] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none transition-colors duration-300">
                   <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                      <h3 className="text-[20px] font-bold text-gray-900 dark:text-white font-['Manrope'] tracking-tight">Recent Activity</h3>
                      <div className="flex bg-gray-50 dark:bg-[#111111] p-1 rounded-full border border-gray-200 dark:border-[#2a2a2a]">
                         <button className="px-5 py-1.5 rounded-full bg-white dark:bg-[#2a2a2a] text-[11px] font-bold text-gray-900 dark:text-white shadow-sm transition-all">All</button>
                         <button className="px-5 py-1.5 rounded-full text-[11px] font-bold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all">Rides</button>
                         <button className="px-5 py-1.5 rounded-full text-[11px] font-bold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all">Wallet</button>
                      </div>
                   </div>

                   <div className="w-full overflow-x-auto">
                      <table className="w-full text-left min-w-[500px]">
                         <thead>
                            <tr className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest border-b border-gray-100 dark:border-[#2a2a2a]">
                               <th className="pb-4 font-bold w-[20%]">Date</th>
                               <th className="pb-4 font-bold w-[35%]">Description</th>
                               <th className="pb-4 font-bold w-[25%]">Method</th>
                               <th className="pb-4 font-bold w-[20%] text-right">Amount</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-gray-100 dark:divide-[#2a2a2a]">
                            {recentActivity.map((act, i) => (
                               <tr key={i} className="group hover:bg-gray-50 dark:hover:bg-[#1f1f21] transition-colors">
                                  <td className="py-5 text-[12px] text-gray-500 dark:text-gray-400 font-medium">
                                     {act.date}
                                  </td>
                                  <td className="py-5">
                                     <p className="text-[13px] font-bold text-gray-900 dark:text-white mb-0.5">{act.title}</p>
                                     <p className="text-[11px] text-gray-500">{act.sub}</p>
                                  </td>
                                  <td className="py-5 text-[12px] text-gray-500 dark:text-gray-400">
                                     {act.method}
                                  </td>
                                  <td className="py-5 text-right">
                                     <span className={`text-[13px] font-bold font-['Manrope'] tracking-wide ${act.isPositive ? 'text-[#06b6d4]' : 'text-gray-900 dark:text-white'}`}>
                                        {act.amount}
                                     </span>
                                  </td>
                               </tr>
                            ))}
                         </tbody>
                      </table>
                   </div>
                   
                   <div className="mt-8 text-center pt-2">
                       <button className="text-[12px] font-bold text-[#ea7a0f] hover:text-orange-600 transition-colors flex items-center justify-center gap-2 mx-auto">
                           View All History <i className="fa-solid fa-arrow-right text-[10px]"></i>
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

export default UserPaymentDesktop;
