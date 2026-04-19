import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import SidebarDesktop from './SidebarDesktop';
import HeaderDesktop from './HeaderDesktop';

const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('user_token')}` });

const PROMO_COLORS = ['#e07f22', '#3b82f6', '#10b981', '#a855f7', '#ef4444', '#f59e0b'];
const PROMO_ICONS = { flat: 'fa-tag', percent: 'fa-percent', free_ride: 'fa-gift' };

const UserOffersDesktop = ({ navigate, user }) => {
  const [promos, setPromos] = useState([]);
  const [totalSaved, setTotalSaved] = useState(0);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(null);

  // Promo validate
  const [validateCode, setValidateCode] = useState('');
  const [validateFare, setValidateFare] = useState('');
  const [validating, setValidating] = useState(false);
  const [validateResult, setValidateResult] = useState(null);

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_BASE_URL}/promos`, { headers: authHeader() })
      .then(r => {
        setPromos(r.data.promos || []);
        setTotalSaved(r.data.totalSaved || 0);
      })
      .catch(() => setPromos([]))
      .finally(() => setLoading(false));
  }, []);

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    });
  };

  const handleValidate = async (e) => {
    e.preventDefault();
    if (!validateCode.trim()) return;
    setValidating(true);
    setValidateResult(null);
    try {
      const r = await axios.post(`${import.meta.env.VITE_BASE_URL}/promos/validate`,
        { code: validateCode.trim(), fare: parseFloat(validateFare) || 100, vehicleType: 'moto' },
        { headers: authHeader() });
      setValidateResult({ success: true, ...r.data });
    } catch (err) {
      setValidateResult({ success: false, message: err.response?.data?.reason || err.response?.data?.message || 'Invalid promo code.' });
    } finally { setValidating(false); }
  };

  const daysLeft = (validUntil) => {
    const diff = Math.ceil((new Date(validUntil) - Date.now()) / (1000 * 60 * 60 * 24));
    if (diff <= 0) return 'Expired';
    if (diff === 1) return 'Last day!';
    return `${diff} days left`;
  };

  const discountLabel = (promo) => {
    if (promo.type === 'flat') return `₹${promo.value} off`;
    if (promo.type === 'percent') return `${promo.value}% off${promo.maxDiscount ? ` (upto ₹${promo.maxDiscount})` : ''}`;
    if (promo.type === 'free_ride') return 'Free Ride!';
    return '';
  };

  return (
    <div className="flex h-screen bg-[#fcfcfc] dark:bg-[#181615] text-gray-900 dark:text-white font-sans overflow-hidden transition-colors duration-300">
      <SidebarDesktop user={user} navigate={navigate} />

      <main className="flex-1 flex flex-col h-screen overflow-y-auto no-scrollbar relative w-full pt-8 px-6 lg:px-12 bg-[#fafafa] dark:bg-[#131110]">
        <HeaderDesktop title="Offers & Promos" subtitle="Exclusive rewards for QuickBike members." showSearch={false} user={user} />

        <div className="w-full max-w-[1300px] mx-auto pb-16 flex flex-col mt-4">

          {/* HERO BANNER */}
          <div className="w-full bg-gradient-to-r from-gray-900 to-[#2a2725] dark:from-[#2a2725] dark:to-[#2a2725] rounded-[20px] overflow-hidden shadow-2xl relative mb-10 flex items-center h-[240px] lg:h-[280px]">
            <div className="absolute right-0 inset-y-0 w-1/2 flex items-center justify-end pr-12 overflow-hidden">
              <i className="fa-solid fa-motorcycle text-white/10 text-[320px] absolute -right-16 -bottom-16"></i>
            </div>
            <div className="relative z-10 w-full lg:w-2/3 p-10 lg:p-14">
              <p className="text-[#f09f58] text-[10px] font-bold uppercase tracking-[0.25em] mb-3">Limited Season Offer</p>
              <h2 className="text-[36px] lg:text-[44px] font-bold text-white leading-tight tracking-tight mb-3 font-['Manrope']">The Monsoon Velocity Pass</h2>
              <p className="text-gray-400 text-[14px] leading-relaxed mb-8 max-w-md">Unlimited rides at a fixed monthly rate. All-weather rides with priority dispatch and helmet included.</p>
              <div className="flex gap-3">
                <button className="bg-[#f09f58] hover:bg-[#d98b4b] text-[#111] font-bold text-[12px] uppercase tracking-widest px-7 py-3.5 rounded-[8px] transition-colors shadow-lg">Explore Pass</button>
                <button className="bg-transparent hover:bg-white/10 text-white border border-white/20 font-bold text-[12px] uppercase tracking-widest px-7 py-3.5 rounded-[8px] transition-colors">Learn More</button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10 items-start">

            {/* ── LEFT: Promo Cards ── */}
            <div>
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {[0,1,2,3].map(i => (
                    <div key={i} className="animate-pulse bg-white dark:bg-[#1a1a1a] rounded-[16px] p-8 h-[260px] border border-gray-100 dark:border-[#222]">
                      <div className="w-12 h-12 rounded-[10px] bg-gray-100 dark:bg-[#333] mb-6"></div>
                      <div className="h-4 w-3/4 bg-gray-100 dark:bg-[#333] rounded mb-3"></div>
                      <div className="h-3 w-full bg-gray-100 dark:bg-[#333] rounded mb-2"></div>
                      <div className="h-3 w-2/3 bg-gray-100 dark:bg-[#333] rounded"></div>
                    </div>
                  ))}
                </div>
              ) : promos.length === 0 ? (
                <div className="text-center py-20 col-span-2">
                  <i className="fa-solid fa-tag text-5xl text-gray-200 dark:text-[#333] mb-4 block"></i>
                  <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">No active offers right now.</p>
                  <p className="text-gray-400 dark:text-gray-600 text-sm mt-1">Check back soon for new deals!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {promos.map((promo, idx) => {
                    const color = PROMO_COLORS[idx % PROMO_COLORS.length];
                    const icon = PROMO_ICONS[promo.type] || 'fa-tag';
                    const dl = daysLeft(promo.validUntil);
                    const isExpiring = dl === 'Last day!';
                    return (
                      <div key={promo._id || idx} className="bg-white dark:bg-[#1e1d1b] rounded-[16px] p-7 border border-gray-100 dark:border-[#2d2a27] shadow-[0_4px_20px_rgb(0,0,0,0.03)] dark:shadow-xl hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden flex flex-col">
                        {/* Glow */}
                        <div className="absolute inset-x-0 top-0 h-28 blur-2xl opacity-[0.06] dark:opacity-[0.12] pointer-events-none" style={{ backgroundColor: color }}></div>

                        <div className="relative z-10 flex flex-col h-full">
                          <div className="flex justify-between items-start mb-5">
                            <div className="w-11 h-11 rounded-[10px] flex items-center justify-center shadow-md" style={{ backgroundColor: color }}>
                              <i className={`fa-solid ${icon} text-white text-[16px]`}></i>
                            </div>
                            <span className={`text-[9px] font-bold uppercase tracking-widest px-2.5 py-1.5 rounded-full ${isExpiring ? 'bg-red-50 dark:bg-red-900/20 text-red-500' : 'bg-gray-100 dark:bg-[#2a2a2a] text-gray-400 dark:text-gray-500'}`}>
                              {dl}
                            </span>
                          </div>

                          <div className="mb-1">
                            <span className="text-[22px] font-black text-gray-900 dark:text-white font-['Manrope']" style={{ color }}>{discountLabel(promo)}</span>
                          </div>
                          <h3 className="text-[16px] font-bold text-gray-900 dark:text-white mb-2 tracking-tight">{promo.code}</h3>
                          <p className="text-gray-500 dark:text-gray-400 text-[12px] leading-relaxed mb-6 flex-1">
                            {promo.description || `Use code ${promo.code} to get ${discountLabel(promo)} on your next ride.`}
                            {promo.minFare > 0 && <span className="block mt-1 text-[11px] text-gray-400 dark:text-gray-500">Min. fare: ₹{promo.minFare}</span>}
                          </p>

                          <div className="mt-auto space-y-2.5">
                            <div className="w-full bg-gray-50 dark:bg-[#111] rounded-[8px] p-3 flex justify-between items-center border border-gray-100 dark:border-[#1a1a1a]">
                              <span className="font-mono text-[12px] font-bold tracking-widest" style={{ color }}>{promo.code}</span>
                              <button onClick={() => handleCopy(promo.code)} className="text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors">
                                <i className={`fa-${copiedCode === promo.code ? 'solid fa-check text-green-500' : 'regular fa-copy'} text-sm`}></i>
                              </button>
                            </div>
                            <button onClick={() => { setValidateCode(promo.code); }} className="w-full font-bold text-[12px] tracking-widest py-3 rounded-[8px] text-white uppercase transition-transform hover:scale-[1.01] active:scale-[0.99] shadow-sm" style={{ backgroundColor: color }}>
                              Check Eligibility
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── RIGHT COLUMN ── */}
            <div className="flex flex-col gap-6">

              {/* Savings Card */}
              <div className="bg-white dark:bg-[#1e1d1b] rounded-[16px] p-7 border border-gray-100 dark:border-[#2d2a27] shadow-[0_4px_20px_rgb(0,0,0,0.03)] dark:shadow-xl relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-40 h-40 bg-[#f09f58] rounded-full blur-[60px] opacity-[0.04] dark:opacity-[0.07]"></div>
                </div>
                <div className="relative z-10 text-center">
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 mb-3">Total Saved All-Time</p>
                  <h2 className="text-[48px] font-black tracking-tighter text-[#f09f58] font-['Manrope'] leading-none mb-1">
                    ₹{totalSaved.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </h2>
                  <p className="text-gray-400 dark:text-gray-500 text-[11px] mb-6">via promo codes on completed rides</p>
                  <div className="w-full h-[1px] bg-gray-100 dark:bg-[#333] mb-5"></div>
                  <button onClick={() => navigate('/user/payment')} className="text-[#f09f58] text-[12px] font-bold hover:text-[#d98b4b] transition-colors">
                    View Payment History →
                  </button>
                </div>
              </div>

              {/* Promo Validator */}
              <div className="bg-white dark:bg-[#1e1d1b] rounded-[16px] p-7 border border-gray-100 dark:border-[#2d2a27] shadow-[0_4px_20px_rgb(0,0,0,0.03)] dark:shadow-xl">
                <h3 className="text-[17px] font-bold text-gray-900 dark:text-white mb-2">Check a Code</h3>
                <p className="text-gray-400 dark:text-gray-500 text-[12px] mb-5">Verify if a promo code works for your next fare.</p>
                <form onSubmit={handleValidate} className="space-y-3">
                  <input
                    type="text"
                    placeholder="Enter promo code…"
                    value={validateCode}
                    onChange={e => { setValidateCode(e.target.value.toUpperCase()); setValidateResult(null); }}
                    className="w-full bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#333] rounded-[10px] py-3 px-4 font-mono font-bold text-[13px] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#e07f22]/40 placeholder-gray-300 dark:placeholder-gray-600 uppercase transition-colors"
                  />
                  <input
                    type="number"
                    placeholder="Estimated fare (₹)…"
                    value={validateFare}
                    onChange={e => { setValidateFare(e.target.value); setValidateResult(null); }}
                    className="w-full bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#333] rounded-[10px] py-3 px-4 text-[13px] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#e07f22]/40 placeholder-gray-300 dark:placeholder-gray-600 transition-colors"
                  />

                  {validateResult && (
                    <div className={`rounded-[10px] p-4 text-[12px] font-bold ${validateResult.success ? 'bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/20 text-green-600 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/20 text-red-500 dark:text-red-400'}`}>
                      {validateResult.success ? (
                        <>
                          <i className="fa-solid fa-circle-check mr-2"></i>
                          Valid! You save ₹{validateResult.discount} → Final fare: ₹{validateResult.finalFare}
                        </>
                      ) : (
                        <><i className="fa-solid fa-circle-xmark mr-2"></i>{validateResult.message}</>
                      )}
                    </div>
                  )}

                  <button type="submit" disabled={validating || !validateCode.trim()}
                    className="w-full bg-[#e07f22] hover:bg-[#c76500] text-white font-bold py-3 rounded-[10px] text-[12px] disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
                    {validating ? <><i className="fa-solid fa-circle-notch fa-spin"></i> Checking...</> : <><i className="fa-solid fa-magnifying-glass"></i> Check Code</>}
                  </button>
                </form>
              </div>

              {/* How it Works */}
              <div className="bg-white dark:bg-[#1e1d1b] rounded-[16px] p-7 border border-gray-100 dark:border-[#2d2a27] shadow-[0_4px_20px_rgb(0,0,0,0.03)] dark:shadow-xl">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-7 h-7 bg-[#f09f58]/20 rounded-full flex items-center justify-center">
                    <i className="fa-solid fa-info text-[#f09f58] text-sm"></i>
                  </div>
                  <h3 className="text-[16px] font-bold text-gray-900 dark:text-white">How It Works</h3>
                </div>
                <ul className="space-y-3 text-[12px] text-gray-500 dark:text-gray-400">
                  {['One promo code per ride only.', 'Applied automatically at checkout — no manual entry needed.', 'Referral credits land in your QuickBike Wallet instantly.', 'Expired codes are automatically removed from this list.'].map((tip, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="w-4 h-4 bg-gray-100 dark:bg-[#333] rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[9px] font-bold text-gray-500">{i + 1}</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserOffersDesktop;
