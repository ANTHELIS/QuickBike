import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SidebarDesktop from './SidebarDesktop';
import HeaderDesktop from './HeaderDesktop';

const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('user_token')}` });

const STATUS_STYLES = {
  completed: { dot: 'bg-green-500', badge: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400', label: 'Completed' },
  cancelled: { dot: 'bg-red-400',   badge: 'bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400',     label: 'Cancelled'  },
  ongoing:   { dot: 'bg-blue-500',  badge: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',  label: 'Ongoing'    },
  accepted:  { dot: 'bg-yellow-400',badge: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400', label: 'Accepted' },
};
const fmtDate = (iso) => new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
const fmtTime = (iso) => new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
const shorten = (str, n = 32) => str?.length > n ? str.slice(0, n) + '…' : str || '—';

const FILTERS = ['all', 'completed', 'cancelled'];

const UserRidesDesktop = ({ navigate, user }) => {
  const [rides, setRides] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [ratingOpen, setRatingOpen] = useState(false);
  const [ratingVal, setRatingVal] = useState(0);
  const [ratingMsg, setRatingMsg] = useState('');
  const [ratingLoading, setRatingLoading] = useState(false);
  const LIMIT = 15;

  const fetchRides = async (pg, f) => {
    setLoading(true);
    try {
      const params = { userType: 'user', page: pg, limit: LIMIT };
      if (f && f !== 'all') params.status = f;
      const r = await axios.get(`${import.meta.env.VITE_BASE_URL}/rides/history`, { headers: authHeader(), params });
      setRides(r.data.data || []);
      setTotal(r.data.total || 0);
      setSelected((r.data.data || [])[0] || null);
    } catch {
      setRides([]);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchRides(page, filter); }, [page, filter]);

  const handleRateRide = async () => {
    if (!ratingVal || !selected) return;
    setRatingLoading(true);
    try {
      await axios.post(`${import.meta.env.VITE_BASE_URL}/rides/${selected._id}/rate`,
        { rating: ratingVal }, { headers: authHeader() });
      setRatingMsg('✓ Rating submitted!');
      setRides(prev => prev.map(r => r._id === selected._id ? { ...r, captainRating: ratingVal } : r));
      setSelected(prev => prev ? { ...prev, captainRating: ratingVal } : prev);
      setTimeout(() => { setRatingMsg(''); setRatingOpen(false); }, 1200);
    } catch (e) {
      setRatingMsg(e.response?.data?.message || 'Failed to submit rating.');
    } finally { setRatingLoading(false); }
  };

  const st = selected ? (STATUS_STYLES[selected.status] || STATUS_STYLES.completed) : STATUS_STYLES.completed;

  return (
    <div className="flex h-screen bg-[#f5f5f5] dark:bg-[#111111] text-gray-900 dark:text-white font-sans overflow-hidden transition-colors duration-300">
      <SidebarDesktop user={user} navigate={navigate} />

      <main className="flex-1 flex flex-col h-screen overflow-y-auto no-scrollbar relative w-full pt-8 px-6 lg:px-12">
        <HeaderDesktop showSearch={false} title="Your Journeys" subtitle="Full ride history and trip details." user={user} />

        <div className="w-full max-w-[1100px] mx-auto pb-16 flex flex-col mt-4">

          {/* Header + Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
            <div>
              <h4 className="text-[#a44c10] dark:text-[#ea7a0f] text-[11px] font-bold tracking-[0.25em] uppercase mb-1">Archive</h4>
              <h1 className="text-[36px] font-black text-gray-900 dark:text-white tracking-tight font-['Manrope'] leading-none">
                Your Journeys
                <span className="ml-3 text-[16px] font-bold text-gray-400 dark:text-gray-500">({total})</span>
              </h1>
            </div>
            <div className="flex gap-2 bg-white dark:bg-[#18181a] border border-gray-100 dark:border-[#222] rounded-full p-1 shadow-sm">
              {FILTERS.map(f => (
                <button key={f} onClick={() => { setFilter(f); setPage(1); }}
                  className={`px-4 py-1.5 rounded-full text-[11px] font-bold capitalize transition-all ${filter === f ? 'bg-[#e07f22] text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'}`}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 items-start">

            {/* LEFT — Ride List */}
            <div className="flex-1 flex flex-col w-full min-w-0">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="animate-pulse bg-white dark:bg-[#18181a] rounded-[8px] p-6 mb-4 border border-gray-100 dark:border-[#333]">
                    <div className="flex gap-8">
                      <div className="h-4 w-24 bg-gray-100 dark:bg-[#222] rounded mb-2"></div>
                      <div className="flex-1"><div className="h-3 w-40 bg-gray-100 dark:bg-[#222] rounded mb-3"></div><div className="h-3 w-32 bg-gray-100 dark:bg-[#222] rounded"></div></div>
                      <div className="h-6 w-16 bg-gray-100 dark:bg-[#222] rounded"></div>
                    </div>
                  </div>
                ))
              ) : rides.length === 0 ? (
                <div className="text-center py-20 flex flex-col items-center gap-4">
                  <i className="fa-solid fa-motorcycle text-5xl text-gray-200 dark:text-[#333]"></i>
                  <p className="text-gray-500 dark:text-gray-400 font-medium">No rides found.</p>
                  <button onClick={() => navigate('/home')} className="bg-[#e07f22] text-white font-bold px-6 py-3 rounded-full text-sm hover:bg-[#c76500] transition-colors">Book Your First Ride</button>
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-4">
                    {rides.map(ride => {
                      const s = STATUS_STYLES[ride.status] || STATUS_STYLES.completed;
                      const isSelected = selected?._id === ride._id;
                      return (
                        <div key={ride._id} onClick={() => setSelected(ride)}
                          className={`flex justify-between relative p-6 rounded-[8px] cursor-pointer transition-all border ${isSelected ? 'bg-white dark:bg-[#18181A] shadow-[0_8px_30px_rgb(0,0,0,0.06)] border-transparent dark:border-[#333]' : 'bg-[#eeeeee] dark:bg-transparent dark:border-[#333] hover:bg-[#e8e8e8] dark:hover:bg-[#1a1a1a] border-transparent'}`}>
                          {isSelected && <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-[#e85d04] rounded-l-[8px]"></div>}
                          <div className="flex gap-8 flex-1 min-w-0">
                            <div className="shrink-0">
                              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 tracking-widest uppercase mb-1.5">Date</p>
                              <p className="text-[13px] font-bold text-gray-900 dark:text-white">{fmtDate(ride.createdAt)}</p>
                              <p className="text-[11px] text-gray-500">{fmtTime(ride.createdAt)}</p>
                            </div>
                            <div className="flex flex-col relative min-w-0 flex-1">
                              <div className="flex items-center gap-3 mb-4">
                                <div className={`w-[6px] h-[6px] rounded-full border-[1.5px] shrink-0 ${isSelected ? 'border-[#e85d04]' : 'border-gray-400 dark:border-gray-500'}`}></div>
                                <p className="text-[12px] font-medium text-gray-900 dark:text-gray-200 truncate">{shorten(ride.pickup, 36)}</p>
                              </div>
                              <div className={`absolute left-[2.5px] top-[10px] bottom-[14px] w-[1px] border-l-[1.5px] border-dashed ${isSelected ? 'border-[#f2a679] dark:border-[#ea7a0f]' : 'border-gray-300 dark:border-[#555]'}`}></div>
                              <div className="flex items-center gap-3">
                                <div className={`w-[6px] h-[6px] rounded-full shrink-0 ${isSelected ? 'bg-[#e85d04]' : 'bg-gray-400 dark:bg-gray-500'}`}></div>
                                <p className="text-[12px] font-medium text-gray-500 truncate">{shorten(ride.destination, 36)}</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end pl-4 shrink-0 gap-2">
                            <p className="text-[20px] font-bold text-gray-900 dark:text-white leading-none">₹{Math.round(ride.fare || 0)}</p>
                            <span className={`text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${s.badge}`}>{s.label}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Pagination */}
                  {total > LIMIT && (
                    <div className="flex items-center justify-center gap-4 mt-8">
                      <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                        className="w-9 h-9 rounded-full bg-white dark:bg-[#18181a] border border-gray-200 dark:border-[#333] flex items-center justify-center disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-[#222] transition-colors">
                        <i className="fa-solid fa-chevron-left text-[11px]"></i>
                      </button>
                      <span className="text-[12px] font-bold text-gray-500 dark:text-gray-400">Page {page} of {Math.ceil(total / LIMIT)}</span>
                      <button disabled={page >= Math.ceil(total / LIMIT)} onClick={() => setPage(p => p + 1)}
                        className="w-9 h-9 rounded-full bg-white dark:bg-[#18181a] border border-gray-200 dark:border-[#333] flex items-center justify-center disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-[#222] transition-colors">
                        <i className="fa-solid fa-chevron-right text-[11px]"></i>
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* RIGHT — Ride Detail Panel */}
            {selected && (
              <div className="w-full lg:w-[340px] shrink-0 sticky top-4">
                <div className="bg-white dark:bg-[#18181A] rounded-[16px] overflow-hidden shadow-[0_15px_40px_rgb(0,0,0,0.06)] dark:shadow-none border border-gray-100 dark:border-[#333]">

                  {/* Banner */}
                  <div className="h-[180px] w-full bg-gradient-to-br from-[#df8a5e] to-[#ab653e] dark:from-[#cf6a3e] dark:to-[#8b451e] relative flex items-end p-6">
                    <div className="absolute inset-0 opacity-[0.12]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '20px 20px', transform: 'perspective(500px) rotateX(45deg) scale(2)' }}></div>
                    <div className="relative z-10 w-full">
                      <span className={`inline-block text-[9px] font-bold tracking-widest uppercase px-3 py-1 rounded-full mb-2 ${st.badge}`}>{st.label}</span>
                      <h2 className="text-[17px] font-bold text-white leading-snug truncate">{shorten(selected.destination, 28)}</h2>
                    </div>
                  </div>

                  <div className="p-7 flex flex-col gap-5">
                    {/* Captain */}
                    {selected.captain && (
                      <>
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-1.5">Captain</p>
                            <h3 className="text-[15px] font-bold text-gray-900 dark:text-white">
                              {selected.captain?.fullname?.firstname} {selected.captain?.fullname?.lastname || ''}
                            </h3>
                            {selected.captain?.ratings?.average && (
                              <div className="flex items-center gap-1 mt-0.5">
                                <i className="fa-solid fa-star text-[#e85d04] text-[10px]"></i>
                                <span className="text-[11px] text-gray-500">{selected.captain.ratings.average.toFixed(1)}</span>
                              </div>
                            )}
                          </div>
                          <div className="w-11 h-11 rounded-[10px] bg-gray-100 dark:bg-[#111] flex items-center justify-center font-bold text-gray-700 dark:text-gray-200 text-sm uppercase border border-gray-100 dark:border-[#333]">
                            {selected.captain?.fullname?.firstname?.[0] || '?'}
                          </div>
                        </div>
                        <div className="h-[1px] bg-gray-100 dark:bg-[#333]"></div>
                      </>
                    )}

                    {/* Details */}
                    <div className="space-y-4">
                      {[
                        { label: 'Date & Time', value: `${fmtDate(selected.createdAt)} · ${fmtTime(selected.createdAt)}` },
                        { label: 'Vehicle', value: selected.vehicleType === 'moto' ? 'QuickRide (Moto)' : selected.vehicleType === 'auto' ? 'Auto' : 'Car' },
                        { label: 'Payment', value: selected.payment?.method === 'cash' ? 'Cash' : selected.payment?.method === 'wallet' ? 'Wallet' : selected.payment?.method === 'upi' ? 'UPI' : selected.payment?.method || 'Cash' },
                        { label: 'Fare', value: `₹${Math.round(selected.fare || 0)}` },
                      ].map((item, i) => (
                        <div key={i} className="flex justify-between items-center">
                          <span className="text-[12px] text-gray-400 font-medium">{item.label}</span>
                          <span className="text-[12px] font-bold text-gray-900 dark:text-white">{item.value}</span>
                        </div>
                      ))}
                    </div>

                    {/* Rate Ride — show only if completed and not yet rated */}
                    {selected.status === 'completed' && !selected.captainRating && (
                      <button onClick={() => setRatingOpen(true)}
                        className="w-full mt-2 flex items-center justify-center gap-2 bg-orange-50 dark:bg-[#1e1208] border border-[#e07f22]/30 text-[#e07f22] font-bold text-[12px] py-3 rounded-[10px] hover:bg-orange-100 dark:hover:bg-[#271808] transition-colors">
                        <i className="fa-solid fa-star"></i> Rate this Ride
                      </button>
                    )}
                    {selected.captainRating && (
                      <div className="flex items-center justify-center gap-1 py-2">
                        {[1,2,3,4,5].map(n => (
                          <i key={n} className={`fa-solid fa-star text-sm ${n <= selected.captainRating ? 'text-[#e07f22]' : 'text-gray-200 dark:text-[#333]'}`}></i>
                        ))}
                        <span className="text-[11px] text-gray-400 ml-2">You rated {selected.captainRating}/5</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Rating Modal */}
      {ratingOpen && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setRatingOpen(false)}>
          <div className="bg-white dark:bg-[#1a1a1a] rounded-[24px] p-8 w-full max-w-[380px] shadow-2xl text-center" onClick={e => e.stopPropagation()}>
            <div className="w-14 h-14 bg-orange-50 dark:bg-[#271808] rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fa-solid fa-star text-[#e07f22] text-2xl"></i>
            </div>
            <h2 className="text-[20px] font-black font-['Manrope'] text-gray-900 dark:text-white mb-1">Rate Your Ride</h2>
            <p className="text-[12px] text-gray-400 mb-6">How was your trip to {shorten(selected.destination, 24)}?</p>
            <div className="flex justify-center gap-3 mb-6">
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={() => setRatingVal(n)}
                  className={`text-3xl transition-transform hover:scale-110 ${n <= ratingVal ? 'text-[#e07f22]' : 'text-gray-200 dark:text-[#333]'}`}>
                  <i className="fa-solid fa-star"></i>
                </button>
              ))}
            </div>
            {ratingMsg && <p className={`text-sm font-bold mb-4 ${ratingMsg.startsWith('✓') ? 'text-green-600' : 'text-red-500'}`}>{ratingMsg}</p>}
            <button onClick={handleRateRide} disabled={!ratingVal || ratingLoading}
              className="w-full bg-gradient-to-r from-[#c76500] to-[#e07f22] text-white font-bold py-3.5 rounded-[12px] disabled:opacity-50 flex items-center justify-center gap-2">
              {ratingLoading ? <><i className="fa-solid fa-circle-notch fa-spin"></i> Submitting...</> : 'Submit Rating'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserRidesDesktop;
