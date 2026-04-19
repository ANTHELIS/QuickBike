import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router';
import axios from 'axios';
import { UserDataContext } from '../context/UserContext';
import UserPaymentDesktop from '../components/UserPaymentDesktop';

const UserPayment = () => {
  const navigate = useNavigate();
  const { user } = useContext(UserDataContext);
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
    <div className="bg-slate-100 min-h-screen flex justify-center font-['Inter']">
      <main className="w-full max-w-[390px] min-h-[100dvh] bg-white shadow-xl flex flex-col">
        <header className="flex items-center gap-4 px-6 pt-12 pb-4 bg-white sticky top-0 z-10 shadow-sm">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-orange-50 -ml-2"><i className="fa-solid fa-arrow-left text-slate-700"></i></button>
          <h1 className="text-xl font-black font-['Manrope'] text-slate-900">Payment & Wallet</h1>
        </header>
        <div className="p-6 space-y-4">
          {/* Wallet Card */}
          <div className="bg-gradient-to-br from-[#e07f22] to-[#c76500] rounded-2xl p-6 text-white">
            <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">QuickBike Wallet</p>
            <p className="text-4xl font-black">₹{walletLoading ? '...' : (wallet?.balance?.toFixed(2) || '0.00')}</p>
            <button onClick={() => setTopUpOpen(true)} className="mt-4 bg-white/20 hover:bg-white/30 text-white font-bold text-sm px-5 py-2 rounded-full transition">Top Up</button>
          </div>
          {/* UPI Methods */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-black text-slate-800">UPI Methods</h2>
              <button onClick={() => setUpiOpen(true)} className="text-[#e07f22] text-sm font-bold">+ Add</button>
            </div>
            {paymentMethods.filter(m => m.type === 'upi').length === 0
              ? <p className="text-slate-400 text-sm">No UPI IDs saved.</p>
              : paymentMethods.filter(m => m.type === 'upi').map(m => (
                <div key={m._id} className="flex items-center justify-between py-2 border-t border-slate-100">
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{m.value}</p>
                    {m.isDefault && <span className="text-[10px] font-bold text-[#e07f22] uppercase">Default</span>}
                  </div>
                  <button onClick={() => handleDeleteMethod(m._id)} className="text-red-400 text-xs"><i className="fa-solid fa-trash"></i></button>
                </div>
              ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserPayment;
