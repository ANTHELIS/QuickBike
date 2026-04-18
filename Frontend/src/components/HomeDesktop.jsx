import React, { useState } from 'react';
import LiveTracking from './LiveTracking';
import SidebarDesktop from './SidebarDesktop';
import HeaderDesktop from './HeaderDesktop';

const HomeDesktop = ({
  pickup, destination, setPickup, setDestination, handleInputChange,
  pickupCoords, destCoords, user, navigate, findTrip, createRide,
  vehiclePanel, setVehiclePanel, vehicleFound, waitingForDriver, ride,
  fare, fareLoading, vehicleType, setVehicleType, suggestions,
  selectSuggestion, activeField, setActiveField, setMapPickerField, isCurrentLocation
}) => {
  return (
    <div className="flex h-screen bg-[#fcfcfc] dark:bg-[#0E0E0E] text-gray-900 dark:text-white font-sans overflow-hidden transition-colors duration-300">
      
      {/* ── SIDEBAR ── */}
      <SidebarDesktop user={user} navigate={navigate} />

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto no-scrollbar bg-[#fafafa] dark:bg-[#0C0C0C] relative">
        <div className="w-full max-w-[1400px] mx-auto flex flex-col p-6 lg:p-10 lg:pt-8 gap-8 lg:gap-8">
          
          <HeaderDesktop title="Dashboard" subtitle="Book your next ride and view your recent activity." />

          {/* Map Area */}
          <div className="relative w-full h-[600px] lg:h-[650px] rounded-xl overflow-hidden border border-gray-100 dark:border-[#1e1e1e] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.4)] isolation-auto shrink-0 transition-colors duration-300">
             
             {/* Built-in Dark Map Background / Component */}
             <div className="absolute inset-0 z-0 bg-[#e0e0e0] dark:bg-[#121212] transition-colors duration-300">
                <LiveTracking pickup={pickupCoords || pickup} destination={destCoords || destination} />
                <div className="absolute inset-0 pointer-events-none bg-white/20 dark:bg-black/40 mix-blend-multiply rounded-xl transition-colors duration-300"></div>
             </div>

             {/* Right side map controls */}
             <div className="absolute right-6 top-6 flex flex-col gap-2 z-10 hidden md:flex">
               <div className="bg-white/90 dark:bg-[#1e1e1e]/90 backdrop-blur-sm border border-gray-200 dark:border-[#2a2a2a] rounded overflow-hidden flex flex-col shrink-0 transition-colors duration-300">
                  <button className="w-10 h-10 flex items-center justify-center text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-[#2a2a2a] border-b border-gray-200 dark:border-[#2a2a2a] transition focus:outline-none">
                    <i className="fa-solid fa-plus text-sm"></i>
                  </button>
                  <button className="w-10 h-10 flex items-center justify-center text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition focus:outline-none">
                    <i className="fa-solid fa-minus text-sm"></i>
                  </button>
               </div>
               <button className="w-10 h-10 bg-white/90 dark:bg-[#1e1e1e]/90 backdrop-blur-sm border border-gray-200 dark:border-[#2a2a2a] rounded text-[#ea7a0f] dark:text-[#f57b0f] hover:bg-gray-100 dark:hover:bg-[#2a2a2a] flex items-center justify-center transition focus:outline-none shrink-0 transition-colors duration-300">
                 <i className="fa-solid fa-crosshairs text-sm"></i>
               </button>
             </div>

             {/* Floating Booking Panel */}
             <div className="absolute left-6 top-6 bottom-6 w-[360px] bg-white/95 dark:bg-[#222222]/95 backdrop-blur-xl rounded-xl border border-gray-100 dark:border-white/5 flex flex-col overflow-hidden shadow-2xl z-10 transition-colors duration-300">
                <div className="p-8 overflow-y-auto no-scrollbar flex-1 flex flex-col h-full relative">
                  
                  {waitingForDriver ? (
                    <div className="flex-1 flex flex-col justify-center items-center text-center py-10">
                       <i className="fa-solid fa-spinner fa-spin text-4xl text-[#ea7a0f] dark:text-[#f57b0f] mb-6"></i>
                       <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Connecting...</h2>
                       <p className="text-sm text-gray-500 dark:text-gray-400">Waiting for {vehicleType} captain to accept your trip.</p>
                    </div>
                  ) : ride && vehicleFound && !waitingForDriver ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                      <div className="w-16 h-16 bg-green-50 dark:bg-green-500/20 rounded-full flex items-center justify-center mb-6 border border-green-200 dark:border-green-500/30">
                        <i className="fa-solid fa-check text-green-500 text-2xl"></i>
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Driver Arriving!</h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 max-w-[250px]">Your captain is en route. Watch the map carefully.</p>
                      <button onClick={() => navigate('/riding', { state: { ride } })} className="w-full font-bold bg-[#ea7a0f] dark:bg-[#f57b0f] py-4 rounded-md text-white dark:text-[#111]">See Ride Details</button>
                    </div>
                  ) : (
                    <>
                      <h2 className="text-[#ea7a0f] dark:text-[#f18b3d] text-[18px] font-black font-['Manrope'] mb-8 tracking-wide">BOOK YOUR RIDE</h2>
                      
                      {/* Pick Up */}
                      <div className="mb-6 relative">
                        <p className="text-[9px] font-bold tracking-[0.15em] text-gray-500 dark:text-gray-400 mb-2 uppercase">Pick Up</p>
                        <div className="relative">
                          <i className="fa-solid fa-location-dot absolute left-4 top-1/2 -translate-y-1/2 text-[#ea7a0f] dark:text-[#f57b0f] text-sm"></i>
                          <input
                            type="text"
                            value={isCurrentLocation ? 'Current Location' : pickup}
                            onChange={(e) => handleInputChange(e.target.value, 'pickup')}
                            onFocus={() => setActiveField('pickup')}
                            placeholder="Enter pickup..."
                            className="w-full bg-gray-50 dark:bg-[#111111] border border-gray-200 dark:border-[#222] rounded-[4px] py-3.5 pl-10 pr-4 text-gray-900 dark:text-white text-sm font-medium outline-none focus:border-[#ea7a0f]/50 dark:focus:border-[#f57b0f]/50 transition transition-colors"
                          />
                        </div>
                      </div>

                      {/* Drop Off */}
                      <div className="mb-8 relative">
                        <p className="text-[9px] font-bold tracking-[0.15em] text-gray-500 dark:text-gray-400 mb-2 uppercase">Drop Off</p>
                        <div className="relative">
                          <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-[#ea7a0f] dark:text-[#f57b0f] text-sm"></i>
                          <input
                            type="text"
                            value={destination}
                            onChange={(e) => handleInputChange(e.target.value, 'destination')}
                            onFocus={() => setActiveField('destination')}
                            placeholder="Enter destination..."
                            className="w-full bg-gray-50 dark:bg-[#111111] border border-gray-200 dark:border-[#222] rounded-[4px] py-3.5 pl-10 pr-4 text-gray-900 dark:text-white text-sm font-medium outline-none focus:border-[#ea7a0f]/50 dark:focus:border-[#f57b0f]/50 transition placeholder-gray-400 dark:placeholder-gray-500 italic transition-colors"
                          />
                        </div>

                        {/* Suggestions Box */}
                        {suggestions.length > 0 && typeof activeField === 'string' && (
                          <div className="absolute top-[80px] left-0 w-full bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-[#333] rounded-md z-50 p-2 shadow-2xl max-h-48 overflow-y-auto">
                            {suggestions.map((s, i) => (
                              <div key={i} onClick={() => selectSuggestion(s)} className="p-3 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] rounded cursor-pointer text-sm font-medium border-b border-gray-100 dark:border-[#2a2a2a] last:border-0 text-gray-700 dark:text-white transition-colors">
                                {s}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Vehicle Types (If fare is loaded) */}
                      {fare && Object.keys(fare).length > 0 && pickup && destination ? (
                        <div className="flex gap-4 mb-8">
                           <div 
                             onClick={() => setVehicleType('moto')} 
                             className={`flex-1 rounded-md p-4 border transition-all cursor-pointer relative ${vehicleType === 'moto' ? 'bg-orange-50 dark:bg-[#252322] border-[#ea7a0f] dark:border-[#f57b0f]' : 'bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] hover:border-gray-300 dark:hover:border-gray-500'}`}
                           >
                             <span className={`absolute top-3 right-3 text-[8px] tracking-widest font-bold uppercase ${vehicleType === 'moto' ? 'text-[#ea7a0f] dark:text-[#f57b0f]' : 'text-gray-400 dark:text-gray-500'}`}>FAST</span>
                             <i className={`fa-solid fa-motorcycle text-xl mb-4 ${vehicleType === 'moto' ? 'text-[#ea7a0f] dark:text-[#f57b0f]' : 'text-gray-400'}`}></i>
                             <h4 className="text-gray-900 dark:text-white text-[13px] font-bold tracking-wide mb-1">QuickRide</h4>
                             <p className="text-[10px] text-gray-500 dark:text-gray-400">4 min away • ₹{Math.round(fare?.moto || 0)}</p>
                           </div>
                           <div 
                             onClick={() => setVehicleType('car')} 
                             className={`flex-1 rounded-md p-4 border transition-all cursor-pointer relative ${vehicleType === 'car' ? 'bg-orange-50 dark:bg-[#252322] border-[#ea7a0f] dark:border-[#f57b0f]' : 'bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] hover:border-gray-300 dark:hover:border-gray-500'}`}
                           >
                             <span className={`absolute top-3 right-3 text-[8px] tracking-widest font-bold uppercase ${vehicleType === 'car' ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400 dark:text-gray-500'}`}>PRO</span>
                             <i className={`fa-solid fa-motorcycle text-xl mb-4 ${vehicleType === 'car' ? 'text-[#ea7a0f] dark:text-[#f57b0f]' : 'text-gray-400'}`}></i>
                             <h4 className="text-gray-900 dark:text-white text-[13px] font-bold tracking-wide mb-1">LuxuryBike</h4>
                             <p className="text-[10px] text-gray-500">9 min away • ₹{Math.round(fare?.car || 0)}</p>
                           </div>
                        </div>
                      ) : (
                         <div className="mb-8 flex-1 flex flex-col justify-end">
                            <p className="text-xs text-gray-400 dark:text-gray-500 italic text-center">Fill addresses to see rides</p>
                         </div>
                      )}

                      <div className="mt-auto pt-4">
                        <button 
                          onClick={() => {
                            if (fare && Object.keys(fare).length > 0) {
                               createRide(null, 'cash');
                            } else {
                               findTrip();
                            }
                          }}
                          disabled={!pickup || !destination || fareLoading}
                          className="w-full bg-gradient-to-r from-[#ea7a0f] to-[#d66a06] hover:from-[#e0750d] hover:to-[#cc6205] dark:from-[#f79d46] dark:to-[#e47614] dark:hover:from-[#f58d28] dark:hover:to-[#cd6609] text-white dark:text-black font-bold text-[13px] tracking-wide py-4.5 min-h-[50px] rounded border-none cursor-pointer disabled:opacity-50 transition-all shadow-[0_5px_20px_rgba(234,122,15,0.2)] dark:shadow-[0_5px_20px_rgba(245,123,15,0.2)]"
                        >
                          {fareLoading ? 'CALCULATING...' : (fare && Object.keys(fare).length > 0 ? 'CONFIRM BOOKING' : 'FIND TRIP')}
                        </button>
                      </div>
                    </>
                  )}
                </div>
             </div>
          </div>

          {/* Recent Activity */}
          <div className="mt-2">
            <div className="flex justify-between items-end mb-6">
              <h3 className="text-gray-900 dark:text-white font-bold font-['Manrope'] tracking-[0.02em] text-[15px]">RECENT ACTIVITY</h3>
              <button className="text-[#ea7a0f] dark:text-[#f57b0f] text-[10px] font-bold tracking-[0.1em] uppercase hover:text-[#d66a06] dark:hover:text-orange-400 transition" onClick={() => navigate('/user/rides')}>
                VIEW ALL HISTORY
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {[
                 { title: 'Chelsea Arts District', type: 'QuickRide', dist: '4.2 miles', cost: '₹18.50', date: 'OCT 24, 2023', active: true },
                 { title: 'Financial District', type: 'LuxuryBike', dist: '12.8 miles', cost: '₹42.00', date: 'OCT 22, 2023', active: true },
                 { title: 'Brooklyn Heights', type: 'QuickRide', dist: '2.5 miles', cost: '₹12.25', date: 'OCT 20, 2023', active: true },
               ].map((item, idx) => (
                 <div key={idx} className="bg-white dark:bg-[#18181a] rounded-[8px] p-6 border border-gray-100 dark:border-[#222] flex flex-col hover:border-gray-200 dark:hover:border-[#333] transition-colors cursor-pointer group shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-sm">
                   <div className="flex justify-between items-center mb-8">
                     <div className={`w-8 h-8 rounded shrink-0 flex items-center justify-center bg-gray-50 dark:bg-[#252528] border border-gray-100 dark:border-[#333]`}>
                        <i className={`fa-solid fa-circle-check text-xs text-[#ea7a0f] dark:text-[#d3702a]`}></i>
                     </div>
                     <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 tracking-wider font-['Inter']">{item.date}</span>
                   </div>
                   <h4 className="text-gray-900 dark:text-white font-bold text-[15px] mb-1.5 transition-colors tracking-tight">{item.title}</h4>
                   <p className="text-gray-500 dark:text-gray-400 text-[11px] font-medium mb-8">{item.type} • {item.dist}</p>
                   <div className="mt-auto flex justify-between items-end border-t border-gray-100 dark:border-[#2a2a2a] pt-4">
                     <span className="text-[11px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest pt-1">TOTAL</span>
                     <span className="text-[#ea7a0f] dark:text-[#e28330] font-black text-xl font-['Manrope']">{item.cost}</span>
                   </div>
                 </div>
               ))}
            </div>
          </div>

          {/* Boost Mode Active */}
          <div className="bg-blue-50 dark:bg-[#0f1922] outline outline-1 outline-blue-200 dark:outline-blue-900/60 rounded-[4px] p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-0 mt-4 shadow-sm dark:shadow-lg shrink-0 transition-colors duration-300">
             <div className="flex items-center gap-5">
                <div className="w-10 h-10 bg-[#0ea5e9] rounded-[4px] flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(14,165,233,0.3)]">
                   <i className="fa-solid fa-bolt text-white text-sm"></i>
                </div>
                <div>
                   <h4 className="text-[#0284c7] dark:text-[#89c8f9] font-bold text-[11px] tracking-widest uppercase mb-1">BOOST MODE ACTIVE</h4>
                   <p className="text-blue-900/60 dark:text-blue-100/60 text-[12px] font-medium">QuickRide wait times are currently 50% lower in your area.</p>
                </div>
             </div>
             <button className="w-full md:w-auto bg-[#0ea5e9] hover:bg-[#0284c7] text-white dark:text-[#000] font-bold text-[10px] tracking-widest uppercase px-8 py-3 rounded-[4px] shrink-0 transition-all border-none">
                CLAIM DEAL
             </button>
          </div>

        </div>
      </main>

    </div>
  );
};

export default HomeDesktop;
