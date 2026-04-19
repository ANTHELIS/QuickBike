import React from 'react';

const SidebarDesktop = ({ user, navigate }) => {
  const menuItems = [
    { name: 'Home', icon: 'fa-house', path: '/home' },
    { name: 'Account', icon: 'fa-user', path: '/user/account' },
    { name: 'Payment', icon: 'fa-money-bill-1-wave', path: '/user/payment' },
    { name: 'Rides', icon: 'fa-motorcycle', path: '/user/rides' },
    { name: 'Safety', icon: 'fa-shield-halved', path: '/safety' },
    { name: 'Offers & Promos', icon: 'fa-tag', path: '/Offers' },
    { name: 'Help', icon: 'fa-circle-question', path: '/user/help' },
  ];

  return (
    <aside className="w-[80px] lg:w-[260px] flex flex-col bg-[#141414] border-r border-[#1e1e1e] shrink-0 z-50 transition-all duration-300">
      <div className="p-4 lg:p-8 mb-4 flex justify-center lg:justify-start cursor-pointer transition-transform hover:scale-105" onClick={() => navigate('/home')}>
        <h1 className="hidden lg:block text-2xl font-bold text-[#f57b0f] tracking-tight">Quick<span className="text-white">Bike</span></h1>
        <i className="fa-solid fa-motorcycle text-[#f57b0f] text-3xl lg:hidden mt-2"></i>
      </div>
      
      <nav className="flex-1 mt-2 space-y-1">
        {menuItems.map((item) => {
          const isActive = window.location.pathname.toLowerCase() === item.path.toLowerCase() || (window.location.pathname === '/' && item.path === '/home');
          return (
            <button
              key={item.name}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center justify-center lg:justify-start gap-0 lg:gap-5 px-0 lg:pl-10 lg:pr-6 py-4 transition-all relative ${
                isActive
                  ? 'text-[#f57b0f] bg-[#111]'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-[#1a1a1a]'
              }`}
            >
              <div className="w-6 flex justify-center">
                <i className={`fa-solid ${item.icon} text-lg lg:text-xl shrink-0`}></i>
              </div>
              <span className="hidden lg:inline font-bold text-sm tracking-wide">{item.name}</span>
              {isActive && (
                 <div className="absolute right-0 top-0 bottom-0 w-1 bg-[#f57b0f]"></div>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-6 border-t border-[#1e1e1e] flex items-center justify-center lg:justify-start gap-4 hover:bg-[#1a1a1a] transition-colors cursor-pointer" onClick={() => navigate('/user/account')}>
        <div className="w-10 h-10 rounded-md bg-[#2ea6a4] flex items-center justify-center overflow-hidden shrink-0 shadow-none relative">
          <img src="https://i.pravatar.cc/100?img=47" alt="Profile" className="w-full h-full object-cover opacity-90" />
        </div>
        <div className="hidden lg:block overflow-hidden flex-1 text-left">
          <p className="text-[13px] font-bold text-white truncate">
             {user?.fullname?.firstname || 'QuickBike'} {user?.fullname?.lastname || ''}
          </p>
          <p className="text-[11px] text-gray-500 font-medium">User</p>
        </div>
      </div>
    </aside>
  );
};

export default SidebarDesktop;
