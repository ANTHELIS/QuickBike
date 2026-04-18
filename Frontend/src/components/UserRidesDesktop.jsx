import React, { useState } from 'react';
import SidebarDesktop from './SidebarDesktop';
import HeaderDesktop from './HeaderDesktop';

const UserRidesDesktop = ({ navigate, user }) => {
  const [selectedRide, setSelectedRide] = useState(0);

  const recentRides = [
    { 
       id: 0,
       date: 'Oct 24, 2023', time: '08:45 AM',
       pickup: 'The Ritz-Carlton, Central Park',
       dropoff: 'Chelsea Market, 9th Ave',
       fare: '₹18.50',
       route: 'Central Park Route',
       distance: '4.2 km', duration: '18 min',
       captain: 'Marcus Vane', rating: '4.9',
       card: '4242'
    },
    { 
       id: 1,
       date: 'Oct 22, 2023', time: '06:12 PM',
       pickup: 'Madison Square Garden',
       dropoff: 'Grand Central Terminal',
       fare: '₹12.20',
       route: 'Midtown Transfer',
       distance: '2.1 km', duration: '8 min',
       captain: 'Elias Thorne', rating: '4.8',
       card: '4242'
    },
    { 
       id: 2,
       date: 'Oct 20, 2023', time: '11:30 AM',
       pickup: 'SoHo Grand Hotel',
       dropoff: 'Williamsburg Bridge',
       fare: '₹24.00',
       route: 'East River Crossing',
       distance: '5.8 km', duration: '22 min',
       captain: 'David Silva', rating: '5.0',
       card: '4242'
    },
  ];

  const activeRideData = recentRides[selectedRide];

  return (
    <div className="flex h-screen bg-[#f5f5f5] dark:bg-[#111111] text-gray-900 dark:text-white font-sans overflow-hidden transition-colors duration-300">
      
      {/* ── SIDEBAR ── */}
      <SidebarDesktop user={user} navigate={navigate} />

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto no-scrollbar relative w-full pt-8 px-6 lg:px-12">
        
        <HeaderDesktop showSearch={true} title="" subtitle="" />

        <div className="w-full max-w-[1100px] mx-auto pb-16 flex flex-col mt-4">
          
          <div className="mb-10">
            <h4 className="text-[#a44c10] dark:text-[#ea7a0f] text-[12px] font-bold tracking-[0.25em] uppercase mb-3">Archive</h4>
            <h1 className="text-[40px] lg:text-[46px] font-black text-gray-900 dark:text-white tracking-tight font-['Manrope'] leading-none">Your Journeys</h1>
            <div className="w-16 h-1 bg-[#e85d04] mt-6 rounded-full"></div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 xl:gap-14 items-start">
             
             {/* LEFT COLUMN: History List */}
             <div className="flex-1 flex flex-col w-full">
                
                <div className="flex justify-between items-center mb-6">
                   <h3 className="text-gray-500 dark:text-[#888] font-medium text-[14px]">Recent Activity (12)</h3>
                   <button className="flex items-center gap-2 bg-white dark:bg-[#18181A] px-4 py-2 rounded-[8px] shadow-sm border border-gray-100 dark:border-[#333] hover:bg-gray-50 dark:hover:bg-[#222] transition-colors">
                      <i className="fa-solid fa-bars-staggered text-gray-700 dark:text-gray-300 text-[12px]"></i>
                      <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest">Filter</span>
                   </button>
                </div>

                <div className="flex flex-col gap-5">
                   {recentRides.map((ride, index) => {
                      const isSelected = selectedRide === ride.id;
                      return (
                         <div 
                            key={ride.id}
                            onClick={() => setSelectedRide(ride.id)}
                            className={`flex justify-between relative p-6 rounded-[4px] cursor-pointer transition-all ${
                               isSelected 
                                 ? 'bg-white dark:bg-[#18181A] shadow-[0_8px_30px_rgb(0,0,0,0.06)] scale-[1.01] border border-transparent dark:border-[#333]' 
                                 : 'bg-[#eeeeee] dark:bg-transparent dark:border dark:border-[#333] hover:bg-[#e8e8e8] dark:hover:bg-[#1a1a1a]'
                            }`}
                         >
                            {isSelected && (
                               <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-[#e85d04] rounded-l-[4px]"></div>
                            )}

                            <div className="flex gap-10">
                               <div className="flex flex-col">
                                  <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 tracking-[0.15em] uppercase mb-2">Date & Time</p>
                                  <p className="text-[14px] font-bold text-gray-900 dark:text-white mb-0.5">{ride.date}</p>
                                  <p className="text-[12px] text-gray-500 font-medium">{ride.time}</p>
                               </div>

                               <div className="flex flex-col relative">
                                  <div className="flex items-center gap-3 mb-4">
                                     <div className={`w-[6px] h-[6px] rounded-full border-[1.5px] ${isSelected ? 'border-[#e85d04]' : 'border-gray-400 dark:border-gray-500'}`}></div>
                                     <p className="text-[13px] font-medium text-gray-900 dark:text-gray-200">{ride.pickup}</p>
                                  </div>
                                  
                                  {/* Line connector */}
                                  <div className={`absolute left-[2.5px] top-[10px] bottom-[14px] w-[1px] border-l-[1.5px] border-dashed ${isSelected ? 'border-[#f2a679] dark:border-[#ea7a0f]' : 'border-gray-300 dark:border-[#555]'}`}></div>
                                  
                                  <div className="flex items-center gap-3 mt-auto">
                                     <div className={`w-[6px] h-[6px] rounded-full ${isSelected ? 'bg-[#e85d04]' : 'bg-gray-400 dark:bg-gray-500'}`}></div>
                                     <p className="text-[13px] font-medium text-gray-500">{ride.dropoff}</p>
                                  </div>
                               </div>
                            </div>
                            
                            <div className="flex flex-col items-end pl-4 shrink-0">
                               <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 tracking-[0.15em] uppercase mb-2">Fare</p>
                               <p className="text-[22px] font-bold text-gray-900 dark:text-white leading-none">{ride.fare}</p>
                            </div>
                         </div>
                      );
                   })}
                </div>
             </div>

             {/* RIGHT COLUMN: Interactive Ticket Detail */}
             <div className="w-full lg:w-[350px] shrink-0 top-8 sticky">
                
                <div className="bg-white dark:bg-[#18181A] rounded-[16px] overflow-hidden shadow-[0_15px_40px_rgb(0,0,0,0.06)] dark:shadow-none border border-gray-100 dark:border-[#333] flex flex-col transition-colors duration-300">
                   
                   {/* Top Map Graphic Banner */}
                   <div className="h-[220px] w-full bg-gradient-to-br from-[#df8a5e] to-[#ab653e] dark:from-[#cf6a3e] dark:to-[#8b451e] relative flex items-end p-6 transition-colors duration-300">
                      {/* Decorative grid pattern mimicking map */}
                      <div className="absolute inset-0 opacity-[0.15] mix-blend-overlay" style={{
                          backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
                          backgroundSize: '20px 20px',
                          transform: 'perspective(500px) rotateX(45deg) scale(2)'
                      }}></div>

                      <div className="relative z-10 w-full">
                         <div className="inline-block bg-[#e57700] text-white text-[9px] font-bold tracking-[0.15em] uppercase px-3 py-1 rounded-full mb-2">
                            Completed
                         </div>
                         <h2 className="text-[20px] font-bold text-white tracking-tight leading-tight">{activeRideData.route}</h2>
                      </div>
                   </div>

                   {/* Rider Details */}
                   <div className="p-8 pb-6 flex flex-col">
                      <div className="flex justify-between items-center mb-6">
                         <div>
                            <p className="text-[10px] font-bold text-gray-400 tracking-[0.15em] uppercase mb-2">Your Captain</p>
                            <h3 className="text-[16px] font-bold text-gray-900 dark:text-white">{activeRideData.captain}</h3>
                            <div className="flex items-center gap-1 mt-1">
                               {[...Array(5)].map((_, i) => (
                                 <i key={i} className="fa-solid fa-star text-[#e85d04] text-[10px]"></i>
                               ))}
                               <span className="text-[11px] font-medium text-gray-600 dark:text-[#999] ml-1">{activeRideData.rating}</span>
                            </div>
                         </div>
                         <div className="w-12 h-12 rounded-[10px] overflow-hidden border border-gray-200 dark:border-[#333] shadow-sm shrink-0">
                            <img src={`https://i.pravatar.cc/150?u=${activeRideData.captain}`} alt="Captain" className="w-full h-full object-cover" />
                         </div>
                      </div>

                      <div className="w-full h-[1px] bg-gray-100 dark:bg-[#333] my-2 transition-colors"></div>

                      <div className="space-y-5 mt-6">
                         <div className="flex justify-between items-center">
                            <span className="text-[12px] text-gray-400 font-medium">Ride Distance</span>
                            <span className="text-[12px] font-bold text-gray-900 dark:text-white">{activeRideData.distance}</span>
                         </div>
                         <div className="flex justify-between items-center">
                            <span className="text-[12px] text-gray-400 font-medium">Duration</span>
                            <span className="text-[12px] font-bold text-gray-900 dark:text-white">{activeRideData.duration}</span>
                         </div>
                         <div className="flex justify-between items-center">
                            <span className="text-[12px] text-gray-400 font-medium">Payment Method</span>
                            <div className="flex items-center gap-2">
                               <i className="fa-solid fa-credit-card text-[10px] text-gray-900 dark:text-white"></i>
                               <span className="text-[12px] font-bold text-gray-900 dark:text-white">**** {activeRideData.card}</span>
                            </div>
                         </div>
                      </div>

                      <button className="w-full mt-8 bg-transparent hover:bg-gray-50 dark:hover:bg-[#222] border border-gray-900 dark:border-gray-500 text-gray-900 dark:text-white font-bold py-3.5 rounded-[4px] tracking-[0.1em] text-[11px] uppercase transition-colors flex items-center justify-center gap-2">
                         <i className="fa-solid fa-download text-[12px]"></i>
                         Download Receipt
                      </button>

                      <button className="w-full mt-5 text-[10px] font-bold text-gray-400 hover:text-gray-600 dark:hover:text-white uppercase tracking-[0.15em] transition-colors">
                         Report an Issue
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

export default UserRidesDesktop;
