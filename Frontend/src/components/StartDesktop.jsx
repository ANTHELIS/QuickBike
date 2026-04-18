import React from 'react';

const StartDesktop = ({ navigate }) => {
  return (
    <div className="flex h-screen bg-[#Fcfcfc] text-gray-900 font-sans overflow-hidden">
      
      {/* ── LEFT SIDE (SPLIT SCREEN) ── */}
      <div className="hidden lg:flex flex-1 relative bg-gradient-to-br from-[#101010] to-[#1a1a1a] items-center justify-center overflow-hidden">
        
        {/* Dynamic Typography & Branding Background */}
        <div className="absolute inset-0 z-0">
           {/* Abstract orange shape 1 */}
           <div className="absolute -top-[10%] -left-[10%] w-[500px] h-[500px] bg-[#e85d04] rounded-full mix-blend-screen filter blur-[120px] opacity-20"></div>
           {/* Abstract orange shape 2 */}
           <div className="absolute bottom-[20%] -right-[10%] w-[400px] h-[400px] bg-[#dc2f02] rounded-full mix-blend-screen filter blur-[100px] opacity-20"></div>
           
           <div className="absolute inset-0 opacity-[0.03] flex items-center justify-center select-none pointer-events-none">
              <span className="text-[280px] font-black font-['Manrope'] tracking-tighter text-white whitespace-nowrap rotate-[-5deg]">QUICK</span>
           </div>
        </div>

        {/* Foreground Content */}
        <div className="relative z-10 max-w-2xl px-16 text-white text-left">
           <div className="w-16 h-1 bg-[#e85d04] mb-8"></div>
           <h1 className="text-6xl xl:text-7xl font-black font-['Manrope'] mb-6 leading-[1.05] tracking-tight">
             Urban Mobility.<br />
             <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#e85d04] to-[#ffba08]">Redefined.</span>
           </h1>
           <p className="text-xl text-gray-400 font-medium mb-12 max-w-lg leading-relaxed">
             Experience the city's fastest, safest, and most intelligent motorcycle dispatch system.
           </p>

           <div className="flex gap-4">
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 flex-1 hover:bg-white/10 transition-colors">
                 <i className="fa-solid fa-bolt text-[#e85d04] text-3xl mb-4"></i>
                 <h3 className="font-bold text-lg text-white mb-2">Lightning Fast</h3>
                 <p className="text-sm text-gray-500">Average ETA under 4 minutes across the metropolitan area.</p>
              </div>
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 flex-1 hover:bg-white/10 transition-colors">
                 <i className="fa-solid fa-shield-halved text-[#e85d04] text-3xl mb-4"></i>
                 <h3 className="font-bold text-lg text-white mb-2">Verified Pilots</h3>
                 <p className="text-sm text-gray-500">Every captain is strictly background-checked and rated.</p>
              </div>
           </div>
        </div>
      </div>

      {/* ── RIGHT SIDE (ACTION PANEL) ── */}
      <div className="flex-1 lg:max-w-[600px] w-full flex flex-col bg-white shadow-[-20px_0_40px_rgba(0,0,0,0.05)] z-20 relative">
        
        {/* Mobile Logo Header */}
        <div className="lg:hidden p-8 pb-0 flex items-center justify-center">
            <h1 className="text-3xl font-black text-gray-900 font-['Manrope'] tracking-tight">
              Quick<span className="text-[#e85d04]">Bike</span>
            </h1>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 lg:px-16 items-center lg:items-start text-center lg:text-left">
           
           <div className="w-24 h-24 bg-[#fff4eb] rounded-[24px] rotate-3 flex items-center justify-center mb-10 shadow-inner">
              <div className="-rotate-3">
                 <i className="fa-solid fa-motorcycle text-[#e85d04] text-5xl"></i>
              </div>
           </div>

           <h2 className="text-4xl lg:text-5xl font-black text-gray-900 font-['Manrope'] mb-4 tracking-tight">
              Get Started
           </h2>
           <p className="text-gray-500 text-lg mb-12 max-w-sm">
              Connect with your next ride or join our fleet of professional captains.
           </p>

           <div className="w-full space-y-4 max-w-md">
              {/* Login Button */}
              <button 
                onClick={() => navigate('/login')} 
                className="w-full bg-[#101010] hover:bg-black text-white font-bold py-4 px-6 rounded-2xl flex justify-between items-center group transition-all shadow-[0_8px_20px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.15)] hover:-translate-y-0.5"
              >
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                        <i className="fa-solid fa-user text-white"></i>
                     </div>
                     <span className="text-lg">Continue as Rider</span>
                  </div>
                  <i className="fa-solid fa-arrow-right text-gray-400 group-hover:text-white transition-colors group-hover:translate-x-1"></i>
              </button>

              {/* Captain Button */}
              <button 
                onClick={() => navigate('/captain-login')} 
                className="w-full bg-white hover:bg-gray-50 text-gray-900 font-bold py-4 px-6 rounded-2xl border-2 border-gray-100 border-b-4 hover:border-gray-200 flex justify-between items-center group transition-all"
              >
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 bg-[#fff4eb] text-[#e85d04] rounded-xl flex items-center justify-center">
                        <i className="fa-solid fa-helmet-safety"></i>
                     </div>
                     <span className="text-lg">Login as Captain</span>
                  </div>
                  <i className="fa-solid fa-arrow-right text-gray-400 group-hover:text-gray-900 transition-colors group-hover:translate-x-1"></i>
              </button>
           </div>
           
           <div className="mt-16 w-full max-w-md">
             <div className="flex items-center gap-4 mb-6">
                <div className="h-px bg-gray-200 flex-1"></div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">New Here?</span>
                <div className="h-px bg-gray-200 flex-1"></div>
             </div>
             <button 
               onClick={() => navigate('/signup')} 
               className="w-full bg-transparent hover:bg-gray-50 text-[#e85d04] font-bold py-4 rounded-xl border-2 border-[#e85d04]/20 hover:border-[#e85d04] transition-all flex items-center justify-center gap-3"
             >
                Create an Account <i className="fa-solid fa-arrow-up-right-from-square text-sm"></i>
             </button>
           </div>

        </div>

      </div>

    </div>
  );
};

export default StartDesktop;
