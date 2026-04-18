import SidebarDesktop from './SidebarDesktop';
import HeaderDesktop from './HeaderDesktop';

const UserAccountDesktop = ({ user, navigate, setEditOpen, stats }) => {
  return (
    <div className="flex h-screen bg-[#f7f8f9] dark:bg-[#111111] text-gray-900 dark:text-white font-sans overflow-hidden transition-colors duration-300">
      
      {/* ── SIDEBAR ── */}
      <SidebarDesktop user={user} navigate={navigate} />

      {/* ── MAIN CONTENT AREA ── */}
        <main className="flex-1 flex flex-col items-center overflow-y-auto no-scrollbar p-6 lg:p-12 relative w-full pt-8">
          
          <HeaderDesktop title="Account Settings" subtitle="Manage your personal profile and application experience." showSearch={false} />

          <div className="w-full max-w-[1100px] flex flex-col mt-4">
            
            <div className="flex flex-col lg:flex-row gap-8">
               
               {/* LEFT COLUMN */}
               <div className="flex-1 flex flex-col gap-8">
                  
                  {/* Personal Information */}
                  <div className="bg-white dark:bg-[#18181A] rounded-[24px] p-8 lg:p-10 shadow-[0_4px_30px_rgb(0,0,0,0.02)] border border-gray-100 dark:border-[#222] flex flex-col transition-colors duration-300">
                     <div className="flex justify-between items-center mb-10">
                        <h2 className="text-[22px] font-bold text-gray-900 dark:text-white tracking-tight">Personal Information</h2>
                        <button onClick={() => setEditOpen(true)} className="text-[#c76500] dark:text-[#f09f58] text-[13px] font-bold hover:text-[#a85500] dark:hover:text-[#d88f4f] transition-colors">Edit Profile</button>
                     </div>
                     
                     <div className="flex flex-col lg:flex-row items-center lg:items-center gap-10">
                        {/* Avatar block */}
                        <div className="relative shrink-0">
                           <div className="w-[120px] h-[120px] lg:w-[130px] lg:h-[130px] rounded-[32px] bg-gray-50 dark:bg-black flex items-center justify-center overflow-hidden border border-gray-100 dark:border-[#333] shadow-sm">
                              {/* Using placeholder face resembling the 3D head */}
                              <img src="https://i.pravatar.cc/150?img=11" alt="Profile" className="w-full h-full object-cover" />
                           </div>
                           <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-[#e07f22] rounded-[10px] border-[3px] border-white dark:border-[#18181A] flex items-center justify-center shadow-sm cursor-pointer hover:bg-[#bd691a] transition-colors" onClick={() => setEditOpen(true)}>
                              <i className="fa-solid fa-pen text-white text-[12px]"></i>
                           </div>
                        </div>

                        {/* Details grid */}
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-y-10 gap-x-6 w-full lg:ml-4">
                           <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">Full Name</p>
                              <p className="text-gray-900 dark:text-white font-medium text-[15px] border-b border-gray-100 dark:border-[#333] pb-2.5 transition-colors">{user?.fullname?.firstname || 'Alex'} {user?.fullname?.lastname || 'Morgan'}</p>
                           </div>
                           <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">Email Address</p>
                              <p className="text-gray-900 dark:text-white font-medium text-[15px] border-b border-gray-100 dark:border-[#333] pb-2.5 transition-colors">{user?.email || 'alex.morgan@quickbike.com'}</p>
                           </div>
                           <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">Phone Number</p>
                              <p className="text-gray-900 dark:text-white font-medium text-[15px] border-b border-gray-100 dark:border-[#333] pb-2.5 transition-colors">{user?.phone || '+1 (555) 902-4412'}</p>
                           </div>
                           <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">Location</p>
                              <p className="text-gray-900 dark:text-white font-medium text-[15px] border-b border-gray-100 dark:border-[#333] pb-2.5 transition-colors">San Francisco, CA</p>
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Notifications */}
                  <div className="bg-white dark:bg-[#18181A] rounded-[24px] p-8 lg:p-10 shadow-[0_4px_30px_rgb(0,0,0,0.02)] border border-gray-100 dark:border-[#222] transition-colors duration-300">
                     <h2 className="text-[22px] font-bold text-gray-900 dark:text-white mb-8 tracking-tight">Notifications</h2>
                     
                     <div className="flex justify-between items-center mb-8">
                        <div>
                           <p className="font-bold text-gray-900 dark:text-white text-[15px] mb-1">Ride Status Updates</p>
                           <p className="text-[13px] text-gray-500 dark:text-gray-400">Get notified when your bike is nearby or parked.</p>
                        </div>
                        {/* Custom UI Toggle Active */}
                        <div className="w-[52px] h-7 bg-[#d97c23] dark:bg-[#e07f22] rounded-full relative cursor-pointer shadow-inner shrink-0 transition-colors">
                           <div className="absolute right-[3px] top-[3px] w-[22px] h-[22px] bg-white rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.2)] transition-all"></div>
                        </div>
                     </div>

                     <div className="flex justify-between items-center">
                        <div>
                           <p className="font-bold text-gray-900 dark:text-white text-[15px] mb-1">Promotions & Offers</p>
                           <p className="text-[13px] text-gray-500 dark:text-gray-400">Receive special discounts and weekly ride summaries.</p>
                        </div>
                        {/* Custom UI Toggle Inactive */}
                        <div className="w-[52px] h-7 bg-[#e2e4e8] dark:bg-[#333] rounded-full relative cursor-pointer shadow-inner shrink-0 transition-colors">
                           <div className="absolute left-[3px] top-[3px] w-[22px] h-[22px] bg-white rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.1)] transition-all"></div>
                        </div>
                     </div>
                  </div>
               </div>

               {/* RIGHT COLUMN */}
               <div className="lg:w-[360px] flex flex-col gap-8 w-full shrink-0">
                  
                  {/* Theme Preference Note: Kept for aesthetic layout but real control is in header! */}
                  <div className="bg-white dark:bg-[#18181A] rounded-[24px] p-8 shadow-[0_4px_30px_rgb(0,0,0,0.02)] border border-gray-100 dark:border-[#222] transition-colors duration-300">
                     <h2 className="text-[20px] font-bold text-gray-900 dark:text-white mb-6 tracking-tight">Theme Access</h2>
                     <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed mb-4">We've added a global theme switcher. Tap the Sun/Moon icon in the top right navbar to instantly toggle across the system.</p>
                  </div>

                  {/* Subscriptions */}
                  <div className="bg-[#b35d00] dark:bg-[#1e1c1a] dark:border dark:border-[#2a2624] rounded-[24px] p-8 shadow-[0_15px_30px_rgba(179,93,0,0.25)] dark:shadow-2xl text-white relative flex flex-col transition-colors duration-300">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl translate-x-1/2 -translate-y-1/2"></div>
                     
                     <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-white/80 mb-1">Current Plan</p>
                     <h2 className="text-3xl font-black font-['Manrope'] mb-8 tracking-tight dark:text-[#f09f58]">Elite Rider</h2>

                     <div className="space-y-4 mb-10">
                        <div className="flex items-center gap-3">
                           <div className="w-[18px] h-[18px] rounded-full bg-white dark:bg-[#f57b0f]/20 dark:border dark:border-[#f57b0f]/30 flex items-center justify-center shrink-0">
                              <i className="fa-solid fa-check text-[#b35d00] dark:text-[#f57b0f] text-[10px]"></i>
                           </div>
                           <span className="font-medium text-[14px]">Unlimited 15min rides</span>
                        </div>
                        <div className="flex items-center gap-3">
                           <div className="w-[18px] h-[18px] rounded-full bg-white dark:bg-[#f57b0f]/20 dark:border dark:border-[#f57b0f]/30 flex items-center justify-center shrink-0">
                              <i className="fa-solid fa-check text-[#b35d00] dark:text-[#f57b0f] text-[10px]"></i>
                           </div>
                           <span className="font-medium text-[14px]">Priority bike access</span>
                        </div>
                     </div>

                     <button className="w-full bg-white dark:bg-gradient-to-r dark:from-[#fc9b65] dark:to-[#f4701f] text-[#b35d00] dark:text-[#111] font-bold py-3.5 rounded-full mt-auto text-[14px] hover:bg-gray-50 dark:hover:brightness-110 transition-colors shadow-md">
                        Manage Subscription
                     </button>
                  </div>

               </div>

            </div>

          </div>
        </main>

    </div>
  );
};

export default UserAccountDesktop;
