import React, { useContext } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { CaptainDataContext } from '../context/CapatainContext';

const CaptainDesktopSidebar = () => {
  const { captain } = useContext(CaptainDataContext);
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { label: 'Dashboard', path: '/captain-home', icon: 'fa-border-all' },
    { label: 'Active Rides', path: '/captain-riding', icon: 'fa-car' },
    { label: 'Fleet History', path: '/captain/history', icon: 'fa-clock-rotate-left' },
    { label: 'Earnings', path: '/captain/earnings', icon: 'fa-money-bill-wave' },
    { label: 'Settings', path: '/captain/account', icon: 'fa-gear' },
  ];

  return (
    <aside className="hidden md:flex lg:w-80 md:w-20 bg-white dark:bg-[#161719] border-r border-slate-100 dark:border-[#2b2d31] flex-col h-full z-10 shrink-0 transition-colors duration-300">
      <div className="p-6 border-b border-slate-50 dark:border-[#2b2d31] flex items-center justify-center lg:justify-start gap-4 transition-colors">
        <img src="/logo.png" alt="QuickBike" className="h-12 w-auto object-contain drop-shadow-sm" />
        <h1 className="text-xl font-bold font-['Manrope'] tracking-tight text-[#1a1c1e] dark:text-gray-100 hidden lg:block transition-colors">QuickBike</h1>
      </div>
      
      <nav className="flex-1 px-2 py-6 space-y-2 lg:px-4 lg:space-y-1">
        {navItems.map((item, index) => {
          const isActive = location.pathname === item.path;

          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center justify-center lg:justify-start lg:gap-4 p-3 lg:px-4 lg:py-3 rounded-xl font-bold text-sm transition-colors group ${
                isActive 
                  ? 'bg-orange-50 dark:bg-orange-500/10 text-[#e67e00]' 
                  : 'text-slate-500 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-[#2b2d31] relative'
              }`}
            >
              <i className={`fa-solid ${item.icon} text-xl lg:text-lg w-6 lg:w-5 text-center`} />
              <span className="hidden lg:block">{item.label}</span>
              
              {/* Tooltip for Tablet View */}
              <div className="absolute left-full ml-4 px-3 py-1.5 bg-black dark:bg-[#2b2d31] text-white text-xs rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 hidden md:block lg:hidden whitespace-nowrap">
                {item.label}
              </div>
            </button>
          );
        })}
      </nav>

      <div className="p-4 lg:p-6 border-t border-slate-50 dark:border-[#2b2d31] transition-colors">
        <div className="flex flex-col lg:flex-row items-center gap-4 mb-4">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 shrink-0 select-none flex items-center justify-center transition-colors">
            {captain?.profilePicture?.url ? (
              <img src={captain.profilePicture.url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <i className="fa-solid fa-user text-slate-500 dark:text-slate-400 transition-colors" />
            )}
          </div>
          <div className="hidden lg:block">
            <h2 className="text-sm font-bold text-slate-800 dark:text-gray-100 line-clamp-1 transition-colors">
              {captain?.fullname?.firstname} {captain?.fullname?.lastname}
            </h2>
            <p className="text-xs text-slate-400 dark:text-gray-500 font-medium tracking-wide transition-colors">
              Captain
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/captain/logout')}
          className="w-full flex items-center justify-center gap-2 p-3 lg:py-3.5 border border-slate-200 dark:border-[#2b2d31] rounded-2xl text-slate-700 dark:text-gray-300 font-bold hover:bg-slate-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-500 active:scale-95 transition-all mt-4 group"
        >
          <i className="fa-solid fa-power-off text-lg lg:text-base transition-colors" />
          <span className="hidden lg:block">End Shift</span>
        </button>
      </div>
    </aside>
  );
};

export default CaptainDesktopSidebar;
