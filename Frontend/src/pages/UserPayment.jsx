import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router';
import axios from 'axios';
import { UserDataContext } from '../context/UserContext';
import UserPaymentDesktop from '../components/UserPaymentDesktop';
import { useSiteConfig } from '../context/SiteConfigContext';

const UserPayment = () => {
  const navigate = useNavigate();
  const { user } = useContext(UserDataContext);
  const { getBanner } = useSiteConfig(); // triggers CSS injection
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('user_token')}` });

  // ── State ──
  const [wallet, setWallet] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [walletLoading, setWalletLoading] = useState(true);

  // Top-up modal
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [topUpMsg, setTopUpMsg] = useState('');

  // Add UPI modal
  const [upiOpen, setUpiOpen] = useState(false);
  const [newUpiId, setNewUpiId] = useState('');
  const [newUpiLabel, setNewUpiLabel] = useState('');
  const [upiLoading, setUpiLoading] = useState(false);
  const [upiMsg, setUpiMsg] = useState('');

  // History filter
  const [historyFilter, setHistoryFilter] = useState('all');

  // ── Load data ──
  useEffect(() => {
    const headers = authHeader();

    axios.get(`${import.meta.env.VITE_BASE_URL}/users/wallet`, { headers })
      .then(r => {
        setWallet(r.data.wallet);
        setPaymentMethods(r.data.paymentMethods || []);
      })
      .catch(() => {})
      .finally(() => setWalletLoading(false));

    axios.get(`${import.meta.env.VITE_BASE_URL}/users/payment-history`, { headers, params: { limit: 20 } })
      .then(r => setPaymentHistory(r.data.data || []))
      .catch(() => setPaymentHistory([]))
      .finally(() => setHistoryLoading(false));
  }, []);

  // ── handlers ──
  const handleTopUp = async (e) => {
    e.preventDefault();
    const amt = parseFloat(topUpAmount);
    if (!amt || amt <= 0) return;
    setTopUpLoading(true);
    setTopUpMsg('');
    try {
      const r = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/users/wallet/topup`,
        { amount: amt },
        { headers: authHeader() }
      );
      setWallet(r.data.wallet);
      setTopUpMsg(`✓ ₹${amt} added successfully!`);
      setTopUpAmount('');
      setTimeout(() => { setTopUpMsg(''); setTopUpOpen(false); }, 1500);
    } catch (err) {
      setTopUpMsg(err.response?.data?.message || 'Top-up failed. Try again.');
    } finally {
      setTopUpLoading(false);
    }
  };

  const handleAddUpi = async (e) => {
    e.preventDefault();
    if (!newUpiId.trim()) return;
    setUpiLoading(true);
    setUpiMsg('');
    try {
      const r = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/users/payment-methods`,
        { type: 'upi', value: newUpiId.trim(), label: newUpiLabel.trim() || newUpiId.trim() },
        { headers: authHeader() }
      );
      setPaymentMethods(r.data.paymentMethods);
      setNewUpiId('');
      setNewUpiLabel('');
      setUpiMsg('✓ UPI ID added!');
      setTimeout(() => { setUpiMsg(''); setUpiOpen(false); }, 1200);
    } catch (err) {
      setUpiMsg(err.response?.data?.message || 'Failed to add UPI ID.');
    } finally {
      setUpiLoading(false);
    }
  };

  const handleDeleteMethod = async (methodId) => {
    try {
      const r = await axios.delete(
        `${import.meta.env.VITE_BASE_URL}/users/payment-methods/${methodId}`,
        { headers: authHeader() }
      );
      setPaymentMethods(r.data.paymentMethods);
    } catch {}
  };

  const handleSetDefault = async (methodId) => {
    try {
      const r = await axios.patch(
        `${import.meta.env.VITE_BASE_URL}/users/payment-methods/${methodId}/default`,
        {},
        { headers: authHeader() }
      );
      setPaymentMethods(r.data.paymentMethods);
    } catch {}
  };

  const filteredHistory = paymentHistory.filter(p => {
    if (historyFilter === 'rides') return p.method !== 'wallet';
    if (historyFilter === 'wallet') return p.method === 'wallet';
    return true;
  });

  const props = {
    user, navigate, wallet, walletLoading,
    paymentMethods, paymentHistory: filteredHistory, historyLoading,
    topUpOpen, setTopUpOpen, topUpAmount, setTopUpAmount, topUpLoading, topUpMsg, handleTopUp,
    upiOpen, setUpiOpen, newUpiId, setNewUpiId, newUpiLabel, setNewUpiLabel,
    upiLoading, upiMsg, handleAddUpi,
    handleDeleteMethod, handleSetDefault,
    historyFilter, setHistoryFilter,
  };

  if (isDesktop) return <UserPaymentDesktop {...props} />;

  // ── Mobile View ──
  return (
    <div className="brand-page-bg min-h-screen flex justify-center font-['Inter']">
      <main className="w-full max-w-[390px] min-h-[100dvh] brand-surface shadow-xl flex flex-col">
        <header className="flex items-center gap-4 px-6 pt-12 pb-4 brand-surface sticky top-0 z-10 shadow-sm">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:opacity-70 -ml-2"><i className="fa-solid fa-arrow-left brand-text-primary" /></button>
          <h1 className="text-xl font-black font-['Manrope'] brand-text-primary">Payment &amp; Wallet</h1>
        </header>

        <div className="p-5 space-y-4 pb-12">

          {/* ── Wallet Card ── */}
          <div className="bg-gradient-to-br from-[#c76500] via-[#e07f22] to-[#f5a623] rounded-2xl p-6 text-white relative overflow-hidden shadow-lg">
            <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            <div className="flex items-center gap-2 mb-4 relative">
              <div className="w-5 h-5 bg-white/20 rounded-md flex items-center justify-center">
                <i className="fa-solid fa-wallet text-white text-[9px]" />
              </div>
              <p className="text-xs font-bold uppercase tracking-widest opacity-80">QuickBike Wallet</p>
            </div>
            {walletLoading
              ? <div className="h-10 w-36 bg-white/20 rounded-lg animate-pulse mb-1 relative" />
              : <p className="text-4xl font-black font-['Manrope'] relative">₹{(wallet?.balance || 0).toFixed(2)}</p>
            }
            <p className="text-white/60 text-xs mt-1 mb-4 relative">Available Balance · INR</p>
            <div className="flex gap-3 relative">
              <button onClick={() => setTopUpOpen(true)} className="flex-1 bg-white text-[#c76500] font-bold text-sm py-2.5 rounded-full hover:bg-white/90 transition flex items-center justify-center gap-2">
                <i className="fa-solid fa-plus text-xs" /> Top Up
              </button>
              <button onClick={() => navigate('/user/rides')} className="flex-1 bg-white/20 hover:bg-white/30 border border-white/30 text-white font-bold text-sm py-2.5 rounded-full transition flex items-center justify-center gap-2">
                <i className="fa-solid fa-clock-rotate-left text-xs" /> History
              </button>
            </div>
          </div>

          {/* ── UPI Methods ── */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-black brand-text-primary">UPI Methods</h2>
              <button onClick={() => setUpiOpen(true)} className="flex items-center gap-1 brand-text text-sm font-bold">
                <i className="fa-solid fa-plus text-[10px]" /> Add
              </button>
            </div>
            {walletLoading ? (
              <div className="space-y-3">{[0, 1].map(i => <div key={i} className="h-12 rounded-xl bg-gray-100 animate-pulse" />)}</div>
            ) : paymentMethods.filter(m => m.type === 'upi').length === 0 ? (
              <div className="text-center py-4">
                <i className="fa-solid fa-money-bill-transfer text-2xl text-gray-200 mb-2 block" />
                <p className="brand-text-muted text-sm mb-2">No UPI IDs saved.</p>
                <button onClick={() => setUpiOpen(true)} className="brand-text text-sm font-bold hover:underline">Link your UPI ID</button>
              </div>
            ) : paymentMethods.filter(m => m.type === 'upi').map(m => (
              <div key={m._id}
                onClick={() => !m.isDefault && handleSetDefault(m._id)}
                className={`flex items-center justify-between p-3 rounded-xl mb-2 border transition-colors cursor-pointer ${m.isDefault ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-100 active:bg-gray-100'}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center border border-gray-200 shadow-sm shrink-0">
                    <i className="fa-solid fa-money-bill-transfer text-[#e07f22] text-sm" />
                  </div>
                  <div>
                    <p className="font-bold brand-text-primary text-sm">{m.value}</p>
                    <p className="text-[11px] text-gray-400">{m.label !== m.value ? m.label : (m.isDefault ? 'Primary' : 'Tap to set as default')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {m.isDefault
                    ? <div className="w-5 h-5 bg-[#e07f22] rounded-full flex items-center justify-center shrink-0"><i className="fa-solid fa-check text-white text-[9px]" /></div>
                    : <div className="w-5 h-5 rounded-full border-2 border-gray-300 shrink-0" />
                  }
                  <button onClick={e => { e.stopPropagation(); handleDeleteMethod(m._id); }}
                    className="w-8 h-8 rounded-full bg-red-50 text-red-400 flex items-center justify-center active:scale-90 active:bg-red-100 shrink-0">
                    <i className="fa-solid fa-trash text-[10px]" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* ── Cash Banner ── */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center shrink-0">
              <i className="fa-solid fa-money-bill text-green-500" />
            </div>
            <div className="flex-1">
              <p className="font-bold brand-text-primary text-sm">Cash</p>
              <p className="text-[12px] brand-text-muted">Always accepted — pay captain after ride.</p>
            </div>
            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shrink-0">
              <i className="fa-solid fa-check text-white text-[9px]" />
            </div>
          </div>

          {/* ── Transaction History ── */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
            <div className="px-5 pt-5 pb-3 border-b border-gray-100">
              <h2 className="font-black brand-text-primary mb-3">Transaction History</h2>
              <div className="flex bg-gray-100 p-1 rounded-full w-fit gap-1">
                {['all', 'rides', 'wallet'].map(f => (
                  <button key={f} onClick={() => setHistoryFilter(f)}
                    className={`px-3 py-1 rounded-full text-[11px] font-bold capitalize transition-all ${historyFilter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
                    {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              {historyLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-4 animate-pulse">
                    <div className="w-9 h-9 rounded-xl bg-gray-100 shrink-0" />
                    <div className="flex-1"><div className="h-3 w-3/4 bg-gray-100 rounded mb-2" /><div className="h-2 w-1/2 bg-gray-100 rounded" /></div>
                    <div className="h-4 w-14 bg-gray-100 rounded" />
                  </div>
                ))
              ) : filteredHistory.length === 0 ? (
                <div className="text-center py-10">
                  <i className="fa-solid fa-receipt text-3xl text-gray-200 mb-3 block" />
                  <p className="brand-text-muted text-sm">No transactions yet.</p>
                </div>
              ) : filteredHistory.map((p, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-4">
                  <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0">
                    <i className={`fa-solid text-[#e07f22] text-sm ${p.method === 'wallet' ? 'fa-wallet' : p.method === 'upi' ? 'fa-money-bill-transfer' : 'fa-money-bill'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold brand-text-primary text-sm truncate">
                      {p.ride?.destination ? (p.ride.destination.length > 26 ? p.ride.destination.slice(0, 26) + '…' : p.ride.destination) : 'Ride Payment'}
                    </p>
                    <p className="text-[11px] brand-text-muted">
                      {p.status === 'captured' ? 'Completed' : p.status?.charAt(0).toUpperCase() + p.status?.slice(1)}
                      {' · '}{new Date(p.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </p>
                  </div>
                  <span className={`text-sm font-black font-['Manrope'] shrink-0 ${p.status === 'refunded' ? 'text-cyan-500' : 'brand-text-primary'}`}>
                    {p.status === 'refunded' ? '+' : '-'}₹{(p.amount || 0).toFixed(0)}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>

      {/* ── TOP UP MODAL (bottom sheet) ── */}
      {topUpOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm" onClick={() => setTopUpOpen(false)}>
          <div className="bg-white rounded-t-[28px] p-7 w-full max-w-[430px] shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-6" />
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-black font-['Manrope'] text-gray-900">Top Up Wallet</h2>
              <button onClick={() => setTopUpOpen(false)} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
                <i className="fa-solid fa-xmark text-gray-600 text-sm" />
              </button>
            </div>
            <div className="bg-orange-50 rounded-2xl p-4 mb-5 text-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Current Balance</p>
              <p className="text-3xl font-black text-[#e07f22] font-['Manrope']">₹{(wallet?.balance || 0).toFixed(2)}</p>
            </div>
            <div className="flex gap-2 flex-wrap mb-5">
              {[100, 200, 500, 1000, 2000].map(a => (
                <button key={a} onClick={() => setTopUpAmount(String(a))}
                  className={`px-4 py-2 rounded-full text-[12px] font-bold border transition-all ${String(a) === topUpAmount ? 'bg-[#e07f22] border-[#e07f22] text-white' : 'border-gray-200 text-gray-700'}`}>
                  ₹{a}
                </button>
              ))}
            </div>
            <form onSubmit={handleTopUp} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Custom Amount (₹)</label>
                <input type="number" min="1" max="50000" placeholder="Enter amount..."
                  value={topUpAmount} onChange={e => setTopUpAmount(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3.5 px-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#e07f22]/40 font-bold text-xl" />
              </div>
              {topUpMsg && (
                <p className={`text-sm font-bold text-center py-2 rounded-lg ${topUpMsg.startsWith('✓') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>{topUpMsg}</p>
              )}
              <button type="submit" disabled={topUpLoading || !topUpAmount}
                className="w-full bg-gradient-to-r from-[#c76500] to-[#e07f22] text-white font-bold py-4 rounded-2xl shadow-[0_4px_15px_rgba(224,127,34,0.3)] disabled:opacity-60 flex items-center justify-center gap-2">
                {topUpLoading ? <><i className="fa-solid fa-circle-notch fa-spin" /> Processing...</> : `Add ₹${topUpAmount || '0'} to Wallet`}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── ADD UPI MODAL (bottom sheet) ── */}
      {upiOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm" onClick={() => setUpiOpen(false)}>
          <div className="bg-white rounded-t-[28px] p-7 w-full max-w-[430px] shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-6" />
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-black font-['Manrope'] text-gray-900">Link UPI ID</h2>
              <button onClick={() => setUpiOpen(false)} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
                <i className="fa-solid fa-xmark text-gray-600 text-sm" />
              </button>
            </div>
            <form onSubmit={handleAddUpi} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">UPI ID</label>
                <input type="text" placeholder="example@okaxis"
                  value={newUpiId} onChange={e => setNewUpiId(e.target.value)} required
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3.5 px-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#e07f22]/40 font-medium text-sm" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Label (Optional)</label>
                <input type="text" placeholder="e.g. Personal, Savings..."
                  value={newUpiLabel} onChange={e => setNewUpiLabel(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3.5 px-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#e07f22]/40 font-medium text-sm" />
              </div>
              {upiMsg && (
                <p className={`text-sm font-bold text-center py-2 rounded-lg ${upiMsg.startsWith('✓') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>{upiMsg}</p>
              )}
              <button type="submit" disabled={upiLoading || !newUpiId.trim()}
                className="w-full bg-gradient-to-r from-[#c76500] to-[#e07f22] text-white font-bold py-4 rounded-2xl shadow-[0_4px_15px_rgba(224,127,34,0.3)] disabled:opacity-60 flex items-center justify-center gap-2">
                {upiLoading ? <><i className="fa-solid fa-circle-notch fa-spin" /> Linking...</> : <><i className="fa-solid fa-link text-[12px]" /> Link UPI ID</>}
              </button>
              <p className="text-center text-[11px] text-gray-400">Format: username@bankname (e.g. john@okhdfc)</p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserPayment;
