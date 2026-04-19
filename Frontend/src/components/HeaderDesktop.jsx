import React, { useState, useEffect, useCallback } from 'react';
import NotificationDropdown from './NotificationDropdown';

const HeaderDesktop = ({ title = '', subtitle = '', showSearch = true, user }) => {
  // Derive icon state from the actual DOM class — no stale React state
  const [isDark, setIsDark] = useState(
    () => document.documentElement.classList.contains('dark')
  );

  // Keep icon in sync if theme changes from another component/tab
  useEffect(() => {
    const sync = () => setIsDark(document.documentElement.classList.contains('dark'));

    // Listen for our custom event dispatched by toggleTheme (same tab, other components)
    window.addEventListener('theme-changed', sync);
    // Also sync when storage changes in another tab
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('theme-changed', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const toggleTheme = useCallback(() => {
    const html = document.documentElement;
    const goingDark = !html.classList.contains('dark');

    // 1. Update the DOM class directly
    html.classList.toggle('dark', goingDark);

    // 2. Persist preference
    localStorage.setItem('theme', goingDark ? 'dark' : 'light');

    // 3. Update React icon state
    setIsDark(goingDark);

    // 4. Notify any other HeaderDesktop instances on the same page
    window.dispatchEvent(new Event('theme-changed'));
  }, []);

  return (
    <header className="flex flex-col lg:flex-row lg:items-end justify-between mb-8 w-full gap-6 shrink-0 z-10 relative">
      {/* Title Area (mostly used in Offers/Help, but we can pass it generically) */}
      {(title || subtitle) && (
        <div>
           <h1 className="text-[28px] lg:text-[32px] font-bold text-gray-900 dark:text-white tracking-tight font-['Manrope'] mb-1">{title}</h1>
           <p className="text-gray-500 dark:text-gray-400 font-medium text-[13px] lg:text-[14px]">{subtitle}</p>
        </div>
      )}

      {!title && !subtitle && showSearch && (
        <div className="relative flex-1 max-w-lg hidden md:block">
           <i className="fa-solid fa-magnifying-glass absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-sm"></i>
           <input
             type="text"
             placeholder="Search journeys, locations..."
             className="w-full bg-[#e8e8e8] dark:bg-[#18181b] border border-transparent rounded-[10px] py-[14px] pl-12 pr-4 text-gray-800 dark:text-white outline-none focus:ring-1 focus:ring-[#e85d04]/30 focus:border-[#e85d04]/30 text-[13px] font-medium placeholder-gray-500 transition-all font-sans"
           />
        </div>
      )}

      <div className="flex items-center gap-6 ml-auto shrink-0">
         {showSearch && (title || subtitle) && (
           <div className="relative max-w-sm hidden sm:block mr-2">
             <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-[13px]"></i>
             <input
                type="text"
                placeholder="Search..."
                className="w-full bg-[#f0f0f0] dark:bg-[#131110] border border-transparent rounded-[8px] py-2.5 pl-10 pr-4 text-[13px] text-gray-800 dark:text-gray-200 outline-none focus:ring-1 focus:border-[#444] transition-all"
             />
           </div>
         )}

         {/* Theme Changer Icon */}
         <button onClick={toggleTheme} className="group relative focus:outline-none">
            <i className={`fa-solid ${isDark ? 'fa-sun text-yellow-500 hover:text-yellow-400' : 'fa-moon text-indigo-500 hover:text-indigo-600'} text-[18px] transition-all duration-300 transform group-hover:scale-110`}></i>
         </button>

         <NotificationDropdown userType={user?.role || (window.location.pathname.includes('captain') ? 'captain' : 'user')} />
         
         <div className="flex items-center gap-3 cursor-pointer group">
            <div className="w-10 h-10 rounded-[10px] bg-slate-200 dark:bg-slate-800 border border-gray-300 dark:border-[#333] flex items-center justify-center overflow-hidden shadow-sm">
               {user?.profilePicture?.url ? (
                 <img src={user.profilePicture.url} alt="Profile" className="w-full h-full object-cover" />
               ) : user ? (
                 <span className="text-[15px] font-bold text-gray-700 dark:text-gray-200 uppercase">
                   {(user.fullname?.firstname?.[0] || '') + (user.fullname?.lastname?.[0] || '')}
                 </span>
               ) : (
                 <i className="fa-solid fa-user text-gray-400 text-sm"></i>
               )}
            </div>
            <div className="hidden lg:flex items-center gap-2">
               <span className="text-[14px] text-gray-800 dark:text-gray-200 font-medium">
                 {user ? `${user.fullname?.firstname || ''} ${user.fullname?.lastname || ''}`.trim() : 'Loading...'}
               </span>
            </div>
         </div>
      </div>
    </header>
  );
};

export default HeaderDesktop;

