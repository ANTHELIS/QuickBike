import React, { useState } from 'react';
import SidebarDesktop from './SidebarDesktop';
import HeaderDesktop from './HeaderDesktop';

const ICON_MAP = { Home: 'fa-house', Work: 'fa-briefcase', Gym: 'fa-dumbbell', Other: 'fa-location-dot' };
const iconFor = (label) => ICON_MAP[label] || 'fa-location-dot';

/* ── Reusable Toggle ── */
const Toggle = ({ active, onToggle }) => (
  <div
    onClick={onToggle}
    className={`w-[52px] h-7 rounded-full relative cursor-pointer shadow-inner shrink-0 transition-colors duration-300 ${active ? 'bg-[#d97c23]' : 'bg-[#e2e4e8] dark:bg-[#333]'}`}
  >
    <div className={`absolute top-[3px] w-[22px] h-[22px] bg-white rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.2)] transition-all duration-300 ${active ? 'right-[3px]' : 'left-[3px]'}`} />
  </div>
);

const UserAccountDesktop = ({
  user, navigate, stats,
  // profile edit
  editOpen, setEditOpen,
  firstName, setFirstName,
  lastName, setLastName,
  phone, setPhone,
  saving, saveMsg, saveProfile,
  // profile picture
  uploadingPic, handleProfilePicUpload,
  // saved places
  placesOpen, setPlacesOpen,
  places, newLabel, setNewLabel,
  newAddress, setNewAddress,
  placeLoading, upsertPlace, deletePlace,
}) => {
  const [notifRides, setNotifRides] = useState(true);
  const [notifPromos, setNotifPromos] = useState(false);

  return (
    <div className="flex h-screen bg-[#f7f8f9] dark:bg-[#111111] text-gray-900 dark:text-white font-sans overflow-hidden transition-colors duration-300">

      {/* ── SIDEBAR ── */}
      <SidebarDesktop user={user} navigate={navigate} />

      {/* ── MAIN CONTENT AREA ── */}
      <main className="flex-1 flex flex-col items-center overflow-y-auto no-scrollbar p-6 lg:p-12 relative w-full pt-8">

        <HeaderDesktop
          title="Account Settings"
          subtitle="Manage your personal profile and application experience."
          showSearch={false}
          user={user}
        />

        <div className="w-full max-w-[1100px] flex flex-col mt-4">
          <div className="flex flex-col lg:flex-row gap-8">

            {/* ── LEFT COLUMN ── */}
            <div className="flex-1 flex flex-col gap-8">

              {/* Personal Information Card */}
              <div className="bg-white dark:bg-[#18181A] rounded-[24px] p-8 lg:p-10 shadow-[0_4px_30px_rgb(0,0,0,0.02)] border border-gray-100 dark:border-[#222] flex flex-col transition-colors duration-300">
                <div className="flex justify-between items-center mb-10">
                  <h2 className="text-[22px] font-bold text-gray-900 dark:text-white tracking-tight">Personal Information</h2>
                  <button
                    onClick={() => setEditOpen(true)}
                    className="text-[#c76500] dark:text-[#f09f58] text-[13px] font-bold hover:text-[#a85500] dark:hover:text-[#d88f4f] transition-colors"
                  >
                    Edit Profile
                  </button>
                </div>

                <div className="flex flex-col lg:flex-row items-center lg:items-start gap-10">
                  {/* Avatar with upload */}
                  <div className="relative shrink-0">
                    <div className="w-[120px] h-[120px] lg:w-[130px] lg:h-[130px] rounded-[32px] bg-gradient-to-br from-orange-100 to-orange-200 dark:from-[#2a1a0a] dark:to-[#1a1008] flex items-center justify-center overflow-hidden border border-gray-100 dark:border-[#333] shadow-sm">
                      {user?.profilePicture?.url ? (
                        <img src={user.profilePicture.url} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[44px] font-black text-[#e07f22] dark:text-[#f09f58] uppercase select-none">
                          {(user?.fullname?.firstname?.[0] || '') + (user?.fullname?.lastname?.[0] || '')}
                        </span>
                      )}
                      {uploadingPic && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-[32px]">
                          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        </div>
                      )}
                    </div>
                    <label
                      className="absolute -bottom-2 -right-2 w-10 h-10 bg-[#e07f22] rounded-[10px] border-[3px] border-white dark:border-[#18181A] flex items-center justify-center shadow-sm cursor-pointer hover:bg-[#bd691a] transition-colors"
                    >
                      {uploadingPic ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <i className="fa-solid fa-camera text-white text-[12px]"></i>
                      )}
                      <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleProfilePicUpload} disabled={uploadingPic} />
                    </label>
                  </div>

                  {/* Details grid */}
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-6 w-full">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">Full Name</p>
                      <p className="text-gray-900 dark:text-white font-medium text-[15px] border-b border-gray-100 dark:border-[#333] pb-2.5">
                        {user?.fullname?.firstname || '—'} {user?.fullname?.lastname || ''}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">Email Address</p>
                      <p className="text-gray-900 dark:text-white font-medium text-[15px] border-b border-gray-100 dark:border-[#333] pb-2.5 truncate">
                        {user?.email || '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">Phone Number</p>
                      <p className="text-gray-900 dark:text-white font-medium text-[15px] border-b border-gray-100 dark:border-[#333] pb-2.5">
                        {user?.phone || <span className="text-gray-400 italic text-[13px]">Not set — click Edit Profile</span>}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">Rider Rating</p>
                      <div className="flex items-center gap-2 border-b border-gray-100 dark:border-[#333] pb-2.5">
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map(n => (
                            <i
                              key={n}
                              className={`text-xs ${Math.round(stats?.rating || 0) >= n ? 'fa-solid fa-star text-yellow-400' : 'fa-regular fa-star text-gray-300'}`}
                            ></i>
                          ))}
                        </div>
                        <span className="text-[15px] font-bold text-gray-900 dark:text-white">
                          {stats?.rating ? stats.rating.toFixed(1) : '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats row */}
                {stats && (
                  <div className="mt-10 grid grid-cols-3 gap-4">
                    {[
                      { label: 'Total Rides', value: stats.totalRides ?? 0, icon: 'fa-motorcycle' },
                      { label: 'Completed', value: stats.completedRides ?? 0, icon: 'fa-circle-check' },
                      { label: 'Total Spent', value: `₹${Math.round(stats.totalSpent ?? 0)}`, icon: 'fa-indian-rupee-sign' },
                    ].map((s, i) => (
                      <div key={i} className="bg-gray-50 dark:bg-[#111] rounded-[16px] p-5 border border-gray-100 dark:border-[#222] flex flex-col gap-2">
                        <i className={`fa-solid ${s.icon} text-[#e07f22] text-[18px]`}></i>
                        <p className="text-[22px] font-black text-gray-900 dark:text-white font-['Manrope']">{s.value}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{s.label}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Saved Places Card */}
              <div className="bg-white dark:bg-[#18181A] rounded-[24px] p-8 lg:p-10 shadow-[0_4px_30px_rgb(0,0,0,0.02)] border border-gray-100 dark:border-[#222] transition-colors duration-300">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-[22px] font-bold text-gray-900 dark:text-white tracking-tight">Saved Places</h2>
                  <button
                    onClick={() => setPlacesOpen(true)}
                    className="flex items-center gap-2 bg-orange-50 dark:bg-[#2a1a0a] text-[#c76500] dark:text-[#f09f58] text-[12px] font-bold px-4 py-2 rounded-full hover:bg-orange-100 dark:hover:bg-[#331e08] transition-colors"
                  >
                    <i className="fa-solid fa-plus text-[11px]"></i> Add Place
                  </button>
                </div>

                {places.length === 0 ? (
                  <div className="text-center py-8 flex flex-col items-center gap-3">
                    <i className="fa-solid fa-bookmark text-3xl text-gray-200 dark:text-[#333]"></i>
                    <p className="text-gray-400 dark:text-gray-500 text-[13px] font-medium">No saved places yet.</p>
                    <button
                      onClick={() => setPlacesOpen(true)}
                      className="text-[#c76500] dark:text-[#f09f58] text-[12px] font-bold hover:underline"
                    >
                      Add your Home or Work address
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {places.map((p, i) => (
                      <div key={i} className="flex items-center gap-4 bg-gray-50 dark:bg-[#111] rounded-[16px] p-4 border border-gray-100 dark:border-[#222] group">
                        <div className="w-11 h-11 rounded-full bg-orange-50 dark:bg-[#2a1a0a] text-[#e07f22] flex items-center justify-center shrink-0">
                          <i className={`fa-solid ${iconFor(p.label)} text-sm`}></i>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900 dark:text-white text-[14px]">{p.label}</p>
                          <p className="text-[12px] text-gray-500 dark:text-gray-400 font-medium truncate">{p.address}</p>
                        </div>
                        <button
                          onClick={() => deletePlace(p.label)}
                          className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-900/20 text-red-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 dark:hover:bg-red-900/40"
                        >
                          <i className="fa-solid fa-trash text-[11px]"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Notifications Card */}
              <div className="bg-white dark:bg-[#18181A] rounded-[24px] p-8 lg:p-10 shadow-[0_4px_30px_rgb(0,0,0,0.02)] border border-gray-100 dark:border-[#222] transition-colors duration-300">
                <h2 className="text-[22px] font-bold text-gray-900 dark:text-white mb-8 tracking-tight">Notifications</h2>
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white text-[15px] mb-1">Ride Status Updates</p>
                      <p className="text-[13px] text-gray-500 dark:text-gray-400">Get notified when your captain is nearby or ride status changes.</p>
                    </div>
                    <Toggle active={notifRides} onToggle={() => setNotifRides(v => !v)} />
                  </div>
                  <div className="border-t border-gray-100 dark:border-[#222] pt-6 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white text-[15px] mb-1">Promotions & Offers</p>
                      <p className="text-[13px] text-gray-500 dark:text-gray-400">Receive special discounts and weekly ride summaries.</p>
                    </div>
                    <Toggle active={notifPromos} onToggle={() => setNotifPromos(v => !v)} />
                  </div>
                </div>
              </div>
            </div>

            {/* ── RIGHT COLUMN ── */}
            <div className="lg:w-[350px] flex flex-col gap-8 w-full shrink-0">

              {/* Theme Access card */}
              <div className="bg-white dark:bg-[#18181A] rounded-[24px] p-8 shadow-[0_4px_30px_rgb(0,0,0,0.02)] border border-gray-100 dark:border-[#222] transition-colors duration-300">
                <h2 className="text-[20px] font-bold text-gray-900 dark:text-white mb-4 tracking-tight">Theme Preference</h2>
                <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed">
                  Use the <i className="fa-solid fa-sun text-yellow-500"></i> / <i className="fa-solid fa-moon text-indigo-500"></i> icon in the top-right header to instantly switch between light and dark mode across all pages.
                </p>
              </div>

              {/* Quick Links */}
              <div className="bg-white dark:bg-[#18181A] rounded-[24px] p-8 shadow-[0_4px_30px_rgb(0,0,0,0.02)] border border-gray-100 dark:border-[#222] transition-colors duration-300">
                <h2 className="text-[20px] font-bold text-gray-900 dark:text-white mb-6 tracking-tight">Quick Links</h2>
                <div className="space-y-2">
                  {[
                    { icon: 'fa-motorcycle', label: 'My Rides', sub: 'View full ride history', action: () => navigate('/user/rides'), color: 'bg-orange-50 dark:bg-[#2a1a0a] text-[#e07f22]' },
                    { icon: 'fa-wallet', label: 'Payment', sub: 'Manage wallets & cards', action: () => navigate('/user/payment'), color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-500' },
                    { icon: 'fa-shield-halved', label: 'Safety', sub: 'Emergency contacts & SOS', action: () => navigate('/safety'), color: 'bg-green-50 dark:bg-green-900/20 text-green-500' },
                    { icon: 'fa-headset', label: 'Help & Support', sub: 'Chat, call or browse FAQs', action: () => navigate('/user/help'), color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-500' },
                  ].map((item) => (
                    <button
                      key={item.label}
                      onClick={item.action}
                      className="w-full flex items-center gap-4 p-3 rounded-[14px] hover:bg-gray-50 dark:hover:bg-[#111] transition-colors text-left group"
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${item.color}`}>
                        <i className={`fa-solid ${item.icon} text-sm`}></i>
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-gray-900 dark:text-white text-[14px]">{item.label}</p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">{item.sub}</p>
                      </div>
                      <i className="fa-solid fa-chevron-right text-gray-300 dark:text-gray-600 text-[11px] group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-colors"></i>
                    </button>
                  ))}
                </div>
              </div>

              {/* Logout */}
              <button
                onClick={() => navigate('/user/logout')}
                className="w-full flex items-center justify-center gap-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 text-red-500 font-bold text-[14px] py-4 rounded-[16px] hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
              >
                <i className="fa-solid fa-power-off"></i>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* ── Edit Profile Modal ── */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setEditOpen(false)}>
          <div className="bg-white dark:bg-[#1a1a1a] rounded-[28px] p-8 w-full max-w-[480px] shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-[24px] font-black font-['Manrope'] text-gray-900 dark:text-white">Edit Profile</h2>
              <button onClick={() => setEditOpen(false)} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-[#2a2a2a] flex items-center justify-center hover:bg-gray-200 dark:hover:bg-[#333] transition-colors">
                <i className="fa-solid fa-xmark text-gray-600 dark:text-gray-300 text-sm"></i>
              </button>
            </div>

            <form onSubmit={saveProfile} className="space-y-5">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">First Name</label>
                  <input
                    className="w-full bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#333] rounded-[12px] py-3 px-4 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#e07f22]/50 font-medium text-[14px] transition-colors"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    required minLength={3}
                    placeholder="First name"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Last Name</label>
                  <input
                    className="w-full bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#333] rounded-[12px] py-3 px-4 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#e07f22]/50 font-medium text-[14px] transition-colors"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    placeholder="Last name"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Phone Number</label>
                <input
                  type="tel"
                  className="w-full bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#333] rounded-[12px] py-3 px-4 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#e07f22]/50 font-medium text-[14px] transition-colors"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                />
              </div>

              {saveMsg && (
                <p className={`text-sm font-bold text-center py-2 rounded-lg ${saveMsg === 'Saved!' ? 'bg-green-50 dark:bg-green-900/20 text-green-600' : 'bg-red-50 dark:bg-red-900/20 text-red-500'}`}>
                  {saveMsg === 'Saved!' ? <><i className="fa-solid fa-check mr-2"></i>Changes saved successfully!</> : saveMsg}
                </p>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-gradient-to-r from-[#c76500] to-[#e07f22] hover:from-[#a85500] hover:to-[#c76500] text-white font-bold py-4 rounded-[14px] shadow-[0_4px_15px_rgba(224,127,34,0.3)] transition-all disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
              >
                {saving ? <><i className="fa-solid fa-circle-notch fa-spin"></i> Saving...</> : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Saved Places Modal ── */}
      {placesOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setPlacesOpen(false)}>
          <div className="bg-white dark:bg-[#1a1a1a] rounded-[28px] p-8 w-full max-w-[520px] shadow-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-[24px] font-black font-['Manrope'] text-gray-900 dark:text-white">Saved Places</h2>
              <button onClick={() => setPlacesOpen(false)} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-[#2a2a2a] flex items-center justify-center hover:bg-gray-200 dark:hover:bg-[#333] transition-colors">
                <i className="fa-solid fa-xmark text-gray-600 dark:text-gray-300 text-sm"></i>
              </button>
            </div>

            {/* Existing places */}
            <div className="space-y-3 mb-6">
              {places.length === 0 ? (
                <p className="text-center text-gray-400 dark:text-gray-500 text-[13px] font-medium py-4">No saved places yet.</p>
              ) : (
                places.map((p, i) => (
                  <div key={i} className="flex items-center gap-4 bg-gray-50 dark:bg-[#111] rounded-[16px] p-4 border border-gray-100 dark:border-[#222]">
                    <div className="w-10 h-10 rounded-full bg-orange-50 dark:bg-[#2a1a0a] text-[#e07f22] flex items-center justify-center shrink-0">
                      <i className={`fa-solid ${iconFor(p.label)} text-sm`}></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 dark:text-white text-[14px]">{p.label}</p>
                      <p className="text-[12px] text-gray-500 dark:text-gray-400 font-medium truncate">{p.address}</p>
                    </div>
                    <button
                      onClick={() => deletePlace(p.label)}
                      className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-900/20 text-red-400 flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                    >
                      <i className="fa-solid fa-trash text-[11px]"></i>
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Add new place */}
            <div className="bg-gray-50 dark:bg-[#111] rounded-[20px] p-5 border border-gray-200 dark:border-[#222] space-y-4">
              <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Add a Place</p>
              <div className="flex gap-3">
                <select
                  className="flex-1 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-[12px] py-3 px-4 text-gray-700 dark:text-gray-200 font-medium focus:outline-none focus:ring-2 focus:ring-[#e07f22]/50 text-[13px] transition-colors"
                  value={newLabel}
                  onChange={e => setNewLabel(e.target.value)}
                >
                  {['Home', 'Work', 'Gym', 'Other'].map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
              <input
                className="w-full bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-[12px] py-3 px-4 text-gray-900 dark:text-white placeholder-gray-400 font-medium focus:outline-none focus:ring-2 focus:ring-[#e07f22]/50 text-[13px] transition-colors"
                placeholder="Enter full address..."
                value={newAddress}
                onChange={e => setNewAddress(e.target.value)}
              />
              <button
                disabled={placeLoading || !newAddress.trim()}
                onClick={upsertPlace}
                className="w-full bg-gradient-to-r from-[#c76500] to-[#e07f22] text-white font-bold py-3.5 rounded-[12px] shadow-[0_4px_15px_rgba(224,127,34,0.2)] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {placeLoading ? <><i className="fa-solid fa-circle-notch fa-spin"></i> Saving...</> : <><i className="fa-solid fa-plus text-[12px]"></i> Save Place</>}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default UserAccountDesktop;
