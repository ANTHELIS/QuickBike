import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import LiveTracking from './LiveTracking';
import SidebarDesktop from './SidebarDesktop';
import HeaderDesktop from './HeaderDesktop';

// ── Countdown timer hook ──
function useCountdown(active, seconds) {
  const [remaining, setRemaining] = useState(seconds);
  const intervalRef = useRef(null);
  useEffect(() => {
    if (!active) { setRemaining(seconds); clearInterval(intervalRef.current); return; }
    setRemaining(seconds);
    intervalRef.current = setInterval(() => setRemaining(r => (r > 0 ? r - 1 : 0)), 1000);
    return () => clearInterval(intervalRef.current);
  }, [active]);
  const m = String(Math.floor(remaining / 60)).padStart(2, '0');
  const s = String(remaining % 60).padStart(2, '0');
  return { display: `${m}:${s}`, remaining };
}

const HomeDesktop = ({
  pickup, destination, setPickup, setDestination, handleInputChange,
  pickupCoords, destCoords, user, navigate, findTrip, createRide, cancelRide,
  vehiclePanel, setVehiclePanel, vehicleFound, waitingForDriver, ride,
  fare, fareLoading, vehicleType, setVehicleType, suggestions,
  selectSuggestion, activeField, setActiveField, setMapPickerField, isCurrentLocation
}) => {
  const [recentRides, setRecentRides] = useState([]);
  const [ridesLoading, setRidesLoading] = useState(true);
  const [userStats, setUserStats] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  // 3-min window for finding a driver; 5-min arrival countdown
  const searchTimer = useCountdown(vehicleFound && !waitingForDriver, 180);
  const arrivalTimer = useCountdown(waitingForDriver, 300);

  useEffect(() => {
    const token = localStorage.getItem('user_token');
    const headers = { Authorization: `Bearer ${token}` };
    axios.get(`${import.meta.env.VITE_BASE_URL}/rides/history`, {
      params: { limit: 3, userType: 'user' }, headers,
    }).then(r => setRecentRides(r.data?.data || [])).catch(() => setRecentRides([])).finally(() => setRidesLoading(false));
    axios.get(`${import.meta.env.VITE_BASE_URL}/rides/stats`, {
      params: { userType: 'user' }, headers,
    }).then(r => setUserStats(r.data?.data || null)).catch(() => {});
  }, []);

  const fmtDate = iso => !iso ? '' : new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
  const shortAddr = (addr = '', max = 28) => addr.length > max ? addr.slice(0, max) + '…' : addr;
  const vehicleLabel = t => t === 'moto' ? 'Bike Taxi' : t === 'auto' ? 'Quick Auto' : t === 'car' ? 'Mini Cab' : t || 'Ride';
  const vehicleIcon  = t => t === 'moto' ? 'fa-motorcycle' : t === 'auto' ? 'fa-truck-pickup' : 'fa-car';

  const handleCancel = async () => {
    setCancelling(true);
    try { await cancelRide(); } finally { setCancelling(false); }
  };

  /* ─────────────────────────────────────────────────
   * PANEL STATES
   * 1. vehicleFound && !waitingForDriver → Searching
   * 2. waitingForDriver                  → Captain On Way
   * 3. ride && !vehicleFound && !waiti…  → Driver Arrived (legacy)
   * 4. default                           → Booking form
   * ───────────────────────────────────────────────── */
  const renderPanel = () => {

    /* ── STATE 1: Searching ── */
    if (vehicleFound && !waitingForDriver) return (
      <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
        {/* Sonar rings */}
        <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
          <div className="absolute w-24 h-24 rounded-full border-2 border-[#ea7a0f]/20 animate-ping" />
          <div className="absolute w-16 h-16 rounded-full border-2 border-[#ea7a0f]/40 animate-ping" style={{ animationDelay: '0.35s' }} />
          <div className="w-12 h-12 bg-[#ea7a0f] rounded-full flex items-center justify-center shadow-[0_0_24px_rgba(234,122,15,0.45)] z-10">
            <i className="fa-solid fa-magnifying-glass text-white text-lg" />
          </div>
        </div>

        <h2 className="text-[21px] font-bold text-gray-900 dark:text-white mb-1 font-['Manrope']">Finding Captain…</h2>
        <p className="text-[12px] text-gray-500 dark:text-gray-400 mb-5 max-w-[210px] leading-relaxed">
          Matching you with the nearest {vehicleLabel(vehicleType)} captain.
        </p>

        {/* Countdown card */}
        <div className="w-full bg-gray-50 dark:bg-[#1a1a1a] rounded-[12px] p-4 mb-4 border border-gray-100 dark:border-[#2a2a2a]">
          <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Search Window</p>
          <p className={`text-[30px] font-black font-['Manrope'] tabular-nums ${searchTimer.remaining < 30 ? 'text-red-500' : 'text-[#ea7a0f] dark:text-[#f57b0f]'}`}>
            {searchTimer.display}
          </p>
          {searchTimer.remaining < 30 && (
            <p className="text-[10px] text-red-400 font-bold animate-pulse mt-0.5">Almost out of time…</p>
          )}
        </div>

        {/* Ride summary */}
        {ride && (
          <div className="w-full bg-gray-50 dark:bg-[#1a1a1a] rounded-[12px] p-4 mb-4 border border-gray-100 dark:border-[#2a2a2a] text-left space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-[#ea7a0f] shrink-0" />
              <p className="text-[11px] text-gray-600 dark:text-gray-300 font-medium truncate">{shortAddr(ride.pickup, 36)}</p>
            </div>
            <div className="w-px h-3 bg-gray-300 dark:bg-[#444] ml-[3px]" />
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-gray-900 dark:bg-white shrink-0" />
              <p className="text-[11px] text-gray-600 dark:text-gray-300 font-medium truncate">{shortAddr(ride.destination, 36)}</p>
            </div>
            <div className="border-t border-gray-100 dark:border-[#333] pt-2 flex justify-between items-center">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{vehicleLabel(vehicleType)}</span>
              <span className="text-[14px] font-black text-gray-900 dark:text-white">₹{Math.round(ride.fare || 0)}</span>
            </div>
          </div>
        )}

        <button onClick={handleCancel} disabled={cancelling}
          className="w-full border-2 border-red-200 dark:border-red-900/40 text-red-500 dark:text-red-400 font-bold text-[12px] py-3.5 rounded-[10px] hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
          {cancelling ? <><i className="fa-solid fa-circle-notch fa-spin" /> Cancelling…</> : <><i className="fa-solid fa-xmark" /> Cancel Ride</>}
        </button>
      </div>
    );

    /* ── STATE 2: Captain on the way ── */
    if (waitingForDriver) return (
      <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
        <div className="relative w-20 h-20 mb-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#ea7a0f] to-[#c76500] flex items-center justify-center shadow-[0_6px_28px_rgba(234,122,15,0.38)]">
            <i className="fa-solid fa-motorcycle text-white text-3xl" />
          </div>
          <span className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-2 border-white dark:border-[#222] rounded-full flex items-center justify-center">
            <i className="fa-solid fa-check text-white text-[9px]" />
          </span>
        </div>

        <div className="inline-flex items-center gap-1.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Captain Confirmed
        </div>

        <h2 className="text-[21px] font-bold text-gray-900 dark:text-white font-['Manrope'] mb-0.5">Captain On The Way!</h2>
        {ride?.captain && (
          <p className="text-[13px] text-gray-500 dark:text-gray-400 font-semibold mb-0.5">
            {ride.captain?.fullname?.firstname} {ride.captain?.fullname?.lastname || ''}
          </p>
        )}
        <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-4 max-w-[220px]">Head to your pickup point — watch the rider on the map.</p>

        {/* ETA */}
        <div className="w-full bg-gray-50 dark:bg-[#1a1a1a] rounded-[12px] p-4 mb-4 border border-gray-100 dark:border-[#2a2a2a]">
          <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Estimated Arrival</p>
          <p className="text-[30px] font-black font-['Manrope'] text-[#ea7a0f] dark:text-[#f57b0f] tabular-nums">{arrivalTimer.display}</p>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">Stay at your pickup location</p>
        </div>

        {/* OTP / PIN — Share this with your captain to start the ride */}
        {ride?.otp && (
          <div className="w-full bg-orange-50 dark:bg-[#2a1a08] border border-orange-200 dark:border-orange-900/50 rounded-[12px] p-4 mb-4 flex items-center justify-between">
            <div>
              <p className="text-[9px] font-black text-[#E67E00] dark:text-orange-400 uppercase tracking-widest mb-0.5">Your Ride PIN</p>
              <p className="text-[10px] text-orange-700/70 dark:text-orange-300/60">Share with captain to start ride</p>
            </div>
            <div className="bg-white dark:bg-[#1a1a1a] border-2 border-orange-300 dark:border-orange-700 rounded-xl px-5 py-2 text-center shadow-sm">
              <span className="text-[28px] font-black text-[#E67E00] dark:text-orange-400 tracking-[0.15em] font-['Manrope']">
                {ride.otp}
              </span>
            </div>
          </div>
        )}

        {/* Captain vehicle card */}
        {ride?.captain?.vehicle && (
          <div className="w-full bg-gray-50 dark:bg-[#1a1a1a] rounded-[12px] px-4 py-3 mb-4 border border-gray-100 dark:border-[#2a2a2a] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-orange-50 dark:bg-[#2a1a08] rounded-full flex items-center justify-center">
                <i className="fa-solid fa-motorcycle text-[#ea7a0f] text-sm" />
              </div>
              <div className="text-left">
                <p className="text-[12px] font-bold text-gray-900 dark:text-white capitalize">
                  {ride.captain.vehicle.color} {ride.captain.vehicle.vehicleType}
                </p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500">
                  {ride.captain.vehicle.plate?.toUpperCase() || 'N/A'}
                </p>
              </div>
            </div>
            {ride.captain.ratings?.average && (
              <div className="flex items-center gap-1">
                <i className="fa-solid fa-star text-[#ea7a0f] text-[10px]" />
                <span className="text-[12px] font-bold text-gray-700 dark:text-gray-300">{ride.captain.ratings.average.toFixed(1)}</span>
              </div>
            )}
          </div>
        )}

        <button onClick={() => navigate('/riding', { state: { ride } })}
          className="w-full bg-gradient-to-r from-[#ea7a0f] to-[#d66a06] text-white font-bold text-[13px] py-4 rounded-[10px] mb-3 shadow-[0_4px_15px_rgba(234,122,15,0.3)] hover:from-[#e0750d] hover:to-[#cc6205] transition-all">
          <i className="fa-solid fa-map-location-dot mr-2" /> See Live Tracking
        </button>

        <button onClick={handleCancel} disabled={cancelling}
          className="w-full border border-gray-200 dark:border-[#333] text-gray-500 dark:text-gray-400 font-bold text-[11px] py-3 rounded-[10px] hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
          {cancelling ? <><i className="fa-solid fa-circle-notch fa-spin" /> Cancelling…</> : <><i className="fa-solid fa-xmark" /> Cancel Ride</>}
        </button>
      </div>
    );

    /* ── STATE 3: Driver confirmed / arrived (legacy socket event) ── */
    if (ride && !vehicleFound && !waitingForDriver) return (
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-green-50 dark:bg-green-500/20 rounded-full flex items-center justify-center mb-6 border border-green-200 dark:border-green-500/30">
          <i className="fa-solid fa-check text-green-500 text-2xl" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Driver Arriving!</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 max-w-[250px]">Your captain is en route. Watch the map carefully.</p>
        <button onClick={() => navigate('/riding', { state: { ride } })}
          className="w-full font-bold bg-[#ea7a0f] dark:bg-[#f57b0f] py-4 rounded-md text-white dark:text-[#111]">
          See Ride Details
        </button>
      </div>
    );

    /* ── STATE 4: Idle booking form ── */
    return (
      <>
        <h2 className="text-[#ea7a0f] dark:text-[#f18b3d] text-[18px] font-black font-['Manrope'] mb-8 tracking-wide">BOOK YOUR RIDE</h2>

        {/* Pickup */}
        <div className="mb-6 relative">
          <p className="text-[9px] font-bold tracking-[0.15em] text-gray-500 dark:text-gray-400 mb-2 uppercase">Pick Up</p>
          <div className="relative">
            <i className="fa-solid fa-location-dot absolute left-4 top-1/2 -translate-y-1/2 text-[#ea7a0f] dark:text-[#f57b0f] text-sm" />
            <input type="text"
              value={isCurrentLocation ? 'Current Location' : pickup}
              onChange={e => handleInputChange(e.target.value, 'pickup')}
              onFocus={() => setActiveField('pickup')}
              placeholder="Enter pickup..."
              className="w-full bg-gray-50 dark:bg-[#111111] border border-gray-200 dark:border-[#222] rounded-[4px] py-3.5 pl-10 pr-4 text-gray-900 dark:text-white text-sm font-medium outline-none focus:border-[#ea7a0f]/50 dark:focus:border-[#f57b0f]/50 transition-colors"
            />
          </div>
        </div>

        {/* Destination */}
        <div className="mb-8 relative">
          <p className="text-[9px] font-bold tracking-[0.15em] text-gray-500 dark:text-gray-400 mb-2 uppercase">Drop Off</p>
          <div className="relative">
            <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-[#ea7a0f] dark:text-[#f57b0f] text-sm" />
            <input type="text"
              value={destination}
              onChange={e => handleInputChange(e.target.value, 'destination')}
              onFocus={() => setActiveField('destination')}
              placeholder="Enter destination..."
              className="w-full bg-gray-50 dark:bg-[#111111] border border-gray-200 dark:border-[#222] rounded-[4px] py-3.5 pl-10 pr-4 text-gray-900 dark:text-white text-sm font-medium outline-none focus:border-[#ea7a0f]/50 dark:focus:border-[#f57b0f]/50 transition-colors placeholder-gray-400 dark:placeholder-gray-500 italic"
            />
          </div>
          {/* Suggestions */}
          {suggestions.length > 0 && typeof activeField === 'string' && (
            <div className="absolute top-[80px] left-0 w-full bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-[#333] rounded-md z-50 p-2 shadow-2xl max-h-48 overflow-y-auto">
              {suggestions.map((s, i) => (
                <div key={i} onClick={() => selectSuggestion(s)}
                  className="p-3 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] rounded cursor-pointer text-sm font-medium border-b border-gray-100 dark:border-[#2a2a2a] last:border-0 text-gray-700 dark:text-white transition-colors">
                  {s}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Vehicle types */}
        {fare && Object.keys(fare).length > 0 && pickup && destination ? (
          <div className="flex flex-col gap-3 mb-6">
            {[
              {
                key: 'moto',
                label: 'Bike Taxi',
                subLabel: 'Fastest · 2-wheeled',
                badge: 'FASTEST',
                badgeColor: 'text-[#ea7a0f] dark:text-[#f57b0f]',
                icon: 'fa-motorcycle',
                fareKey: 'moto',
                eta: '3 min',
              },
              {
                key: 'auto',
                label: 'Quick Auto',
                subLabel: '3-wheeler · Pocket friendly',
                badge: 'POPULAR',
                badgeColor: 'text-emerald-500',
                icon: 'fa-truck-pickup',
                fareKey: 'auto',
                eta: '5 min',
              },
              {
                key: 'car',
                label: 'Mini Cab',
                subLabel: '4-seater · AC cabin',
                badge: 'COMFORT',
                badgeColor: 'text-blue-400',
                icon: 'fa-car',
                fareKey: 'car',
                eta: '8 min',
              },
            ].map(v => (
              <div key={v.key} onClick={() => setVehicleType(v.key)}
                className={`flex items-center gap-4 rounded-lg p-3.5 border transition-all cursor-pointer relative ${
                  vehicleType === v.key
                    ? 'bg-orange-50 dark:bg-[#252322] border-[#ea7a0f] dark:border-[#f57b0f]'
                    : 'bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] hover:border-gray-300 dark:hover:border-[#444]'
                }`}>
                {/* Icon */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${vehicleType === v.key ? 'bg-[#ea7a0f]/10 dark:bg-[#f57b0f]/10' : 'bg-gray-100 dark:bg-[#2a2a2a]'}`}>
                  <i className={`fa-solid ${v.icon} text-base ${vehicleType === v.key ? 'text-[#ea7a0f] dark:text-[#f57b0f]' : 'text-gray-400 dark:text-gray-500'}`} />
                </div>

                {/* Label + ETA */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-gray-900 dark:text-white text-[13px] font-bold">{v.label}</h4>
                    <span className={`text-[8px] font-black tracking-widest uppercase ${v.badgeColor}`}>{v.badge}</span>
                  </div>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500">{v.subLabel} · {v.eta} away</p>
                </div>

                {/* Fare */}
                <div className="text-right shrink-0">
                  <p className={`text-[16px] font-black font-['Manrope'] ${vehicleType === v.key ? 'text-[#ea7a0f] dark:text-[#f57b0f]' : 'text-gray-700 dark:text-gray-300'}`}>
                    ₹{Math.round(fare[v.fareKey] || 0)}
                  </p>
                </div>

                {/* Selected indicator */}
                {vehicleType === v.key && (
                  <div className="absolute right-3 top-3 w-4 h-4 rounded-full bg-[#ea7a0f] flex items-center justify-center">
                    <i className="fa-solid fa-check text-white text-[8px]" />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="mb-8 flex-1 flex flex-col justify-end">
            <p className="text-xs text-gray-400 dark:text-gray-500 italic text-center">Fill both addresses to see rides & fares</p>
          </div>
        )}

        <div className="mt-auto pt-4">
          <button
            onClick={() => fare && Object.keys(fare).length > 0 ? createRide(null, 'cash') : findTrip()}
            disabled={!pickup || !destination || fareLoading}
            className="w-full bg-gradient-to-r from-[#ea7a0f] to-[#d66a06] hover:from-[#e0750d] hover:to-[#cc6205] dark:from-[#f79d46] dark:to-[#e47614] text-white dark:text-black font-bold text-[13px] tracking-wide py-4 min-h-[50px] rounded border-none cursor-pointer disabled:opacity-50 transition-all shadow-[0_5px_20px_rgba(234,122,15,0.2)]">
            {fareLoading ? 'CALCULATING…' : fare && Object.keys(fare).length > 0 ? 'CONFIRM BOOKING' : 'FIND TRIP'}
          </button>
        </div>
      </>
    );
  };

  return (
    <div className="flex h-screen bg-[#fcfcfc] dark:bg-[#0E0E0E] text-gray-900 dark:text-white font-sans overflow-hidden transition-colors duration-300">
      <SidebarDesktop user={user} navigate={navigate} />

      <main className="flex-1 flex flex-col h-screen overflow-y-auto no-scrollbar bg-[#fafafa] dark:bg-[#0C0C0C] relative">
        <div className="w-full max-w-[1400px] mx-auto flex flex-col p-6 lg:p-10 lg:pt-8 gap-8">

          <HeaderDesktop
            user={user}
            title={`Welcome back, ${user?.fullname?.firstname || 'Rider'} 👋`}
            subtitle={userStats
              ? `${userStats.completedRides ?? 0} rides completed · ₹${(userStats.totalSpent ?? 0).toFixed(0)} spent lifetime`
              : 'Book your next ride and view your recent activity.'}
          />

          {/* ── Map + Floating Panel ── */}
          <div className="relative w-full h-[600px] lg:h-[650px] rounded-xl overflow-hidden border border-gray-100 dark:border-[#1e1e1e] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.4)] shrink-0 transition-colors duration-300">
            <div className="absolute inset-0 z-0 bg-[#e0e0e0] dark:bg-[#121212] transition-colors duration-300">
              <LiveTracking pickup={pickupCoords || pickup} destination={destCoords || destination} />
              <div className="absolute inset-0 pointer-events-none bg-white/20 dark:bg-black/40 mix-blend-multiply rounded-xl" />
            </div>

            {/* Zoom controls */}
            <div className="absolute right-6 top-6 flex flex-col gap-2 z-10 hidden md:flex">
              <div className="bg-white/90 dark:bg-[#1e1e1e]/90 backdrop-blur-sm border border-gray-200 dark:border-[#2a2a2a] rounded overflow-hidden flex flex-col">
                <button className="w-10 h-10 flex items-center justify-center text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-[#2a2a2a] border-b border-gray-200 dark:border-[#2a2a2a] transition focus:outline-none">
                  <i className="fa-solid fa-plus text-sm" />
                </button>
                <button className="w-10 h-10 flex items-center justify-center text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition focus:outline-none">
                  <i className="fa-solid fa-minus text-sm" />
                </button>
              </div>
              <button className="w-10 h-10 bg-white/90 dark:bg-[#1e1e1e]/90 backdrop-blur-sm border border-gray-200 dark:border-[#2a2a2a] rounded text-[#ea7a0f] dark:text-[#f57b0f] hover:bg-gray-100 dark:hover:bg-[#2a2a2a] flex items-center justify-center transition focus:outline-none">
                <i className="fa-solid fa-crosshairs text-sm" />
              </button>
            </div>

            {/* Floating booking / status panel */}
            <div className="absolute left-6 top-6 bottom-6 w-[360px] bg-white/95 dark:bg-[#222222]/95 backdrop-blur-xl rounded-xl border border-gray-100 dark:border-white/5 flex flex-col overflow-hidden shadow-2xl z-10 transition-colors duration-300">
              <div className="p-8 overflow-y-auto no-scrollbar flex-1 flex flex-col h-full">
                {renderPanel()}
              </div>
            </div>
          </div>

          {/* ── Active-ride status banner below map ── */}
          {(vehicleFound || waitingForDriver) && (
            <div className="bg-orange-50 dark:bg-[#1a1208] border border-orange-100 dark:border-orange-900/30 rounded-[10px] p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-[#ea7a0f] animate-pulse" />
                <p className="text-[13px] font-bold text-[#c26800] dark:text-[#f0a450]">
                  {waitingForDriver ? 'Captain is on the way — check the panel ↑' : 'Searching for a captain nearby…'}
                </p>
              </div>
              <button onClick={handleCancel} disabled={cancelling}
                className="text-red-500 text-[11px] font-bold hover:underline disabled:opacity-50">
                {cancelling ? 'Cancelling…' : 'Cancel'}
              </button>
            </div>
          )}

          {/* ── Recent activity (hidden during active search/ride) ── */}
          {!vehicleFound && !waitingForDriver && (
            <>
              <div>
                <div className="flex justify-between items-end mb-6">
                  <h3 className="text-gray-900 dark:text-white font-bold font-['Manrope'] tracking-[0.02em] text-[15px]">RECENT ACTIVITY</h3>
                  <button className="text-[#ea7a0f] dark:text-[#f57b0f] text-[10px] font-bold tracking-[0.1em] uppercase hover:text-[#d66a06] dark:hover:text-orange-400 transition"
                    onClick={() => navigate('/user/rides')}>
                    VIEW ALL HISTORY
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {ridesLoading ? (
                    [0, 1, 2].map(i => (
                      <div key={i} className="bg-white dark:bg-[#18181a] rounded-[8px] p-6 border border-gray-100 dark:border-[#222] flex flex-col shadow-[0_8px_30px_rgb(0,0,0,0.04)] animate-pulse">
                        <div className="flex justify-between mb-8">
                          <div className="w-8 h-8 rounded bg-gray-100 dark:bg-[#292929]" />
                          <div className="w-20 h-3 rounded bg-gray-100 dark:bg-[#292929]" />
                        </div>
                        <div className="h-4 w-3/4 rounded bg-gray-100 dark:bg-[#292929] mb-2" />
                        <div className="h-3 w-1/2 rounded bg-gray-100 dark:bg-[#292929] mb-8" />
                        <div className="mt-auto border-t border-gray-100 dark:border-[#2a2a2a] pt-4 flex justify-between">
                          <div className="h-3 w-10 rounded bg-gray-100 dark:bg-[#292929]" />
                          <div className="h-5 w-16 rounded bg-gray-100 dark:bg-[#292929]" />
                        </div>
                      </div>
                    ))
                  ) : recentRides.length === 0 ? (
                    <div className="col-span-3 flex flex-col items-center justify-center py-10 text-center">
                      <i className="fa-solid fa-motorcycle text-4xl text-gray-200 dark:text-[#333] mb-4" />
                      <p className="text-gray-400 dark:text-gray-500 font-medium text-[14px]">No rides yet. Book your first ride!</p>
                    </div>
                  ) : recentRides.map((r, idx) => (
                    <div key={r._id || idx} onClick={() => navigate('/user/rides')}
                      className="bg-white dark:bg-[#18181a] rounded-[8px] p-6 border border-gray-100 dark:border-[#222] flex flex-col hover:border-gray-200 dark:hover:border-[#333] transition-colors cursor-pointer shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                      <div className="flex justify-between items-center mb-8">
                        <div className="w-8 h-8 rounded shrink-0 flex items-center justify-center bg-gray-50 dark:bg-[#252528] border border-gray-100 dark:border-[#333]">
                          <i className={`fa-solid text-xs ${r.status === 'completed' ? 'fa-circle-check text-[#ea7a0f]' : r.status === 'cancelled' ? 'fa-circle-xmark text-red-400' : 'fa-circle-dot text-blue-400'}`} />
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 tracking-wider">{fmtDate(r.createdAt)}</span>
                      </div>
                      <h4 className="text-gray-900 dark:text-white font-bold text-[15px] mb-1.5 tracking-tight">{shortAddr(r.destination)}</h4>
                      <p className="text-gray-500 dark:text-gray-400 text-[11px] font-medium mb-8">
                        {vehicleLabel(r.vehicleType)}{r.distance ? ` · ${(r.distance / 1000).toFixed(1)} km` : ''}
                      </p>
                      <div className="mt-auto flex justify-between items-end border-t border-gray-100 dark:border-[#2a2a2a] pt-4">
                        <span className="text-[11px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest">{r.status === 'cancelled' ? 'CANCELLED' : 'TOTAL'}</span>
                        <span className="text-[#ea7a0f] dark:text-[#e28330] font-black text-xl font-['Manrope']">{r.status === 'cancelled' ? '—' : `₹${(r.fare || 0).toFixed(0)}`}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {userStats && (
                <div className="bg-orange-50 dark:bg-[#1a1208] outline outline-1 outline-orange-100 dark:outline-orange-900/30 rounded-[8px] p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0 transition-colors duration-300">
                  <div className="flex items-center gap-5">
                    <div className="w-10 h-10 bg-[#ea7a0f] rounded-[6px] flex items-center justify-center shrink-0">
                      <i className="fa-solid fa-chart-simple text-white text-sm" />
                    </div>
                    <div>
                      <h4 className="text-[#c26800] dark:text-[#f0a450] font-bold text-[11px] tracking-widest uppercase mb-1">YOUR RIDE SUMMARY</h4>
                      <p className="text-orange-900/70 dark:text-orange-100/60 text-[12px] font-medium">
                        {userStats.completedRides ?? 0} completed · {userStats.cancelledRides ?? 0} cancelled · ₹{(userStats.totalSpent ?? 0).toFixed(0)} total spent
                      </p>
                    </div>
                  </div>
                  <button onClick={() => navigate('/user/rides')}
                    className="w-full md:w-auto bg-[#ea7a0f] hover:bg-[#d66a06] text-white font-bold text-[10px] tracking-widest uppercase px-8 py-3 rounded-[6px] shrink-0 transition-all border-none">
                    VIEW HISTORY
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default HomeDesktop;
