import React from 'react';
import SidebarDesktop from './SidebarDesktop';
import HeaderDesktop from './HeaderDesktop';

const QUICK_AMOUNTS = [100, 200, 500, 1000, 2000];
const METHOD_ICONS = { upi: 'fa-money-bill-transfer', card: 'fa-credit-card' };

const fmtDate = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  }).toUpperCase();
};

const methodLabel = (m) => {
  if (!m) return 'Cash';
  const icons = { cash: 'fa-money-bill', upi: 'fa-money-bill-transfer', card: 'fa-credit-card', wallet: 'fa-wallet', online: 'fa-globe', netbanking: 'fa-building-columns' };
  return <span className="flex items-center gap-1.5"><i className={`fa-solid ${icons[m] || 'fa-money-bill'} text-[11px]`}></i>{m.charAt(0).toUpperCase() + m.slice(1)}</span>;
};

const UserPaymentDesktop = ({
  user, navigate, wallet, walletLoading,
  paymentMethods, paymentHistory, historyLoading,
  topUpOpen, setTopUpOpen, topUpAmount, setTopUpAmount, topUpLoading, topUpMsg, handleTopUp,
  upiOpen, setUpiOpen, newUpiId, setNewUpiId, newUpiLabel, setNewUpiLabel,
  upiLoading, upiMsg, handleAddUpi,
  handleDeleteMethod, handleSetDefault,
  historyFilter, setHistoryFilter,
}) => {
  const upiMethods = paymentMethods.filter(m => m.type === 'upi');

  return (
    <div className="flex h-screen bg-[#fcfcfc] dark:bg-[#111111] text-gray-900 dark:text-white font-sans overflow-hidden transition-colors duration-300">

      {/* ── SIDEBAR ── */}
      <SidebarDesktop user={user} navigate={navigate} />

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto no-scrollbar relative w-full pt-8 px-6 lg:px-12 bg-[#fafafa] dark:bg-[#111]">

        <HeaderDesktop
          showSearch={false}
          title="Payment & Wallet"
          subtitle="Manage your wallet balance, UPI IDs, and view transaction history."
          user={user}
        />

        <div className="w-full max-w-[1200px] mx-auto pb-16 flex flex-col mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-10 items-start">

            {/* ── LEFT COLUMN ── */}
            <div className="flex flex-col gap-8">

              {/* WALLET CARD */}
              <div className="bg-gradient-to-br from-[#c76500] via-[#e07f22] to-[#f5a623] rounded-[20px] p-8 relative overflow-hidden shadow-[0_20px_60px_rgba(199,101,0,0.35)]">
                {/* decorative circles */}
                <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full blur-3xl"></div>

                <div className="flex items-center gap-2 mb-6 relative">
                  <div className="w-6 h-6 bg-white/20 rounded-md flex items-center justify-center">
                    <i className="fa-solid fa-wallet text-white text-[10px]"></i>
                  </div>
                  <span className="text-[11px] font-bold text-white/80 uppercase tracking-widest">QuickBike Wallet</span>
                </div>

                <div className="relative">
                  {walletLoading ? (
                    <div className="h-12 w-40 bg-white/20 rounded-lg animate-pulse mb-2"></div>
                  ) : (
                    <h2 className="text-[52px] font-black font-['Manrope'] tracking-tighter text-white mb-1 leading-none">
                      ₹{(wallet?.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h2>
                  )}
                  <p className="text-white/60 text-[12px] font-medium">Available Balance · INR</p>
                </div>

                <div className="flex gap-3 mt-8 relative">
                  <button
                    onClick={() => setTopUpOpen(true)}
                    className="flex-1 bg-white text-[#c76500] font-bold text-[13px] py-3.5 rounded-[10px] tracking-wide hover:bg-white/90 transition-all shadow-md"
                  >
                    <i className="fa-solid fa-plus mr-2"></i>Top Up
                  </button>
                  <button
                    onClick={() => navigate('/user/rides')}
                    className="flex-1 bg-white/20 hover:bg-white/30 border border-white/30 text-white font-bold text-[13px] py-3.5 rounded-[10px] tracking-wide transition-all"
                  >
                    <i className="fa-solid fa-clock-rotate-left mr-2"></i>History
                  </button>
                </div>
              </div>

              {/* UPI METHODS */}
              <div className="bg-white dark:bg-[#161618] rounded-[20px] p-7 border border-gray-100 dark:border-[#222] shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-[18px] font-bold text-gray-900 dark:text-white tracking-tight">UPI Methods</h3>
                  <button
                    onClick={() => setUpiOpen(true)}
                    className="flex items-center gap-1.5 text-[#c76500] dark:text-[#f09f58] text-[12px] font-bold hover:text-[#a85500] dark:hover:text-[#d88f4f] transition-colors"
                  >
                    <i className="fa-solid fa-plus text-[10px]"></i> Add UPI ID
                  </button>
                </div>

                {walletLoading ? (
                  <div className="space-y-3">
                    {[0,1].map(i => <div key={i} className="h-14 rounded-[10px] bg-gray-100 dark:bg-[#222] animate-pulse"></div>)}
                  </div>
                ) : upiMethods.length === 0 ? (
                  <div className="text-center py-6">
                    <i className="fa-solid fa-money-bill-transfer text-3xl text-gray-200 dark:text-[#333] mb-3"></i>
                    <p className="text-gray-400 text-[13px]">No UPI IDs saved.</p>
                    <button onClick={() => setUpiOpen(true)} className="text-[#c76500] dark:text-[#f09f58] text-[12px] font-bold mt-2 hover:underline">
                      Link your UPI ID
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upiMethods.map(m => (
                      <div key={m._id} className={`flex items-center justify-between p-4 rounded-[12px] border transition-colors cursor-pointer group ${m.isDefault ? 'bg-orange-50 dark:bg-[#201a0e] border-[#e07f22]/40 dark:border-[#e07f22]/30' : 'bg-gray-50 dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] hover:border-gray-300 dark:hover:border-[#444]'}`}
                        onClick={() => !m.isDefault && handleSetDefault(m._id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-white dark:bg-black/40 rounded-lg flex items-center justify-center border border-gray-200 dark:border-white/10 shadow-sm">
                            <i className="fa-solid fa-money-bill-transfer text-[#e07f22] text-sm"></i>
                          </div>
                          <div>
                            <p className="text-[14px] font-bold text-gray-900 dark:text-white">{m.value}</p>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">{m.label !== m.value ? m.label : (m.isDefault ? 'Primary' : 'Tap to set as default')}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {m.isDefault ? (
                            <div className="w-5 h-5 bg-[#e07f22] rounded-full flex items-center justify-center">
                              <i className="fa-solid fa-check text-white text-[9px]"></i>
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-[#444]"></div>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteMethod(m._id); }}
                            className="w-7 h-7 rounded-full bg-red-50 dark:bg-red-900/20 text-red-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100"
                          >
                            <i className="fa-solid fa-trash text-[10px]"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* CASH ALWAYS AVAILABLE BANNER */}
              <div className="bg-gray-50 dark:bg-[#18181a] rounded-[16px] p-5 border border-gray-100 dark:border-[#222] flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-green-50 dark:bg-green-900/20 text-green-500 flex items-center justify-center shrink-0">
                  <i className="fa-solid fa-money-bill text-sm"></i>
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white text-[14px]">Cash</p>
                  <p className="text-[12px] text-gray-500 dark:text-gray-400">Always accepted — pay your captain directly after the ride.</p>
                </div>
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center ml-auto shrink-0">
                  <i className="fa-solid fa-check text-white text-[9px]"></i>
                </div>
              </div>
            </div>

            {/* ── RIGHT COLUMN: Transaction History ── */}
            <div className="bg-white dark:bg-[#18181A] rounded-[20px] border border-gray-100 dark:border-[#222] shadow-[0_4px_20px_rgb(0,0,0,0.03)] overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-7 border-b border-gray-100 dark:border-[#222]">
                <h3 className="text-[20px] font-bold text-gray-900 dark:text-white tracking-tight">Transaction History</h3>
                <div className="flex bg-gray-50 dark:bg-[#111] p-1 rounded-full border border-gray-200 dark:border-[#2a2a2a]">
                  {['all', 'rides', 'wallet'].map(f => (
                    <button
                      key={f}
                      onClick={() => setHistoryFilter(f)}
                      className={`px-4 py-1.5 rounded-full text-[11px] font-bold capitalize transition-all ${historyFilter === f ? 'bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                    >
                      {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[520px]">
                  <thead>
                    <tr className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest border-b border-gray-100 dark:border-[#2a2a2a]">
                      <th className="pb-4 pt-5 px-7 font-bold">Date</th>
                      <th className="pb-4 pt-5 font-bold">Description</th>
                      <th className="pb-4 pt-5 font-bold">Method</th>
                      <th className="pb-4 pt-5 pr-7 font-bold text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-[#222]">
                    {historyLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td className="py-4 px-7"><div className="h-3 w-20 bg-gray-100 dark:bg-[#222] rounded"></div></td>
                          <td className="py-4"><div className="h-3 w-36 bg-gray-100 dark:bg-[#222] rounded mb-1.5"></div><div className="h-2 w-24 bg-gray-100 dark:bg-[#222] rounded"></div></td>
                          <td className="py-4"><div className="h-3 w-16 bg-gray-100 dark:bg-[#222] rounded"></div></td>
                          <td className="py-4 pr-7 text-right"><div className="h-3 w-14 bg-gray-100 dark:bg-[#222] rounded ml-auto"></div></td>
                        </tr>
                      ))
                    ) : paymentHistory.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-16 text-gray-400 dark:text-gray-500">
                          <i className="fa-solid fa-receipt text-3xl mb-3 block"></i>
                          No transactions found.
                        </td>
                      </tr>
                    ) : (
                      paymentHistory.map((p, i) => (
                        <tr key={i} className="hover:bg-gray-50 dark:hover:bg-[#1f1f21] transition-colors">
                          <td className="py-5 px-7 text-[12px] text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">
                            {fmtDate(p.createdAt)}
                          </td>
                          <td className="py-5 pr-4">
                            <p className="text-[13px] font-bold text-gray-900 dark:text-white mb-0.5">
                              {p.ride?.destination
                                ? (p.ride.destination.length > 30 ? p.ride.destination.slice(0, 30) + '…' : p.ride.destination)
                                : 'Ride Payment'}
                            </p>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400">
                              {p.status === 'captured' ? 'Completed' : p.status === 'refunded' ? 'Refunded' : p.status?.charAt(0).toUpperCase() + p.status?.slice(1)}
                              {p.ride?.vehicleType ? ` · ${p.ride.vehicleType === 'moto' ? 'QuickRide' : 'LuxuryBike'}` : ''}
                            </p>
                          </td>
                          <td className="py-5 text-[12px] text-gray-500 dark:text-gray-400">
                            {methodLabel(p.method)}
                          </td>
                          <td className="py-5 pr-7 text-right">
                            <span className={`text-[13px] font-bold font-['Manrope'] tracking-wide ${p.status === 'refunded' ? 'text-cyan-500' : 'text-gray-900 dark:text-white'}`}>
                              {p.status === 'refunded' ? '+' : '-'}₹{(p.amount || 0).toFixed(0)}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {paymentHistory.length > 0 && (
                <div className="p-5 border-t border-gray-100 dark:border-[#222] text-center">
                  <button
                    onClick={() => navigate('/user/rides')}
                    className="text-[12px] font-bold text-[#e07f22] hover:text-orange-600 transition-colors flex items-center justify-center gap-2 mx-auto"
                  >
                    View Full Ride History <i className="fa-solid fa-arrow-right text-[10px]"></i>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* ── TOP UP MODAL ── */}
      {topUpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setTopUpOpen(false)}>
          <div className="bg-white dark:bg-[#1a1a1a] rounded-[28px] p-8 w-full max-w-[420px] shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-[22px] font-black font-['Manrope'] text-gray-900 dark:text-white">Top Up Wallet</h2>
              <button onClick={() => setTopUpOpen(false)} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-[#2a2a2a] flex items-center justify-center">
                <i className="fa-solid fa-xmark text-gray-600 dark:text-gray-300 text-sm"></i>
              </button>
            </div>

            <div className="bg-orange-50 dark:bg-[#1e1208] rounded-[14px] p-4 mb-6 text-center">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Current Balance</p>
              <p className="text-[32px] font-black text-[#e07f22] font-['Manrope']">₹{(wallet?.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
            </div>

            {/* Quick amounts */}
            <div className="flex gap-2 flex-wrap mb-5">
              {QUICK_AMOUNTS.map(a => (
                <button
                  key={a}
                  onClick={() => setTopUpAmount(String(a))}
                  className={`px-4 py-2 rounded-full text-[12px] font-bold border transition-all ${String(a) === topUpAmount ? 'bg-[#e07f22] border-[#e07f22] text-white' : 'border-gray-200 dark:border-[#333] text-gray-700 dark:text-gray-300 hover:border-[#e07f22]/60'}`}
                >
                  ₹{a}
                </button>
              ))}
            </div>

            <form onSubmit={handleTopUp} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Custom Amount (₹)</label>
                <input
                  type="number"
                  min="1" max="50000"
                  placeholder="Enter amount..."
                  value={topUpAmount}
                  onChange={e => setTopUpAmount(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#333] rounded-[12px] py-3.5 px-4 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#e07f22]/40 font-bold text-[18px] transition-colors"
                />
              </div>
              {topUpMsg && (
                <p className={`text-sm font-bold text-center py-2 rounded-lg ${topUpMsg.startsWith('✓') ? 'bg-green-50 dark:bg-green-900/20 text-green-600' : 'bg-red-50 dark:bg-red-900/20 text-red-500'}`}>
                  {topUpMsg}
                </p>
              )}
              <button
                type="submit"
                disabled={topUpLoading || !topUpAmount}
                className="w-full bg-gradient-to-r from-[#c76500] to-[#e07f22] text-white font-bold py-4 rounded-[14px] shadow-[0_4px_15px_rgba(224,127,34,0.3)] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {topUpLoading ? <><i className="fa-solid fa-circle-notch fa-spin"></i> Processing...</> : `Add ₹${topUpAmount || '0'} to Wallet`}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── ADD UPI MODAL ── */}
      {upiOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setUpiOpen(false)}>
          <div className="bg-white dark:bg-[#1a1a1a] rounded-[28px] p-8 w-full max-w-[420px] shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-[22px] font-black font-['Manrope'] text-gray-900 dark:text-white">Link UPI ID</h2>
              <button onClick={() => setUpiOpen(false)} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-[#2a2a2a] flex items-center justify-center">
                <i className="fa-solid fa-xmark text-gray-600 dark:text-gray-300 text-sm"></i>
              </button>
            </div>
            <form onSubmit={handleAddUpi} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">UPI ID</label>
                <input
                  type="text"
                  placeholder="example@okaxis"
                  value={newUpiId}
                  onChange={e => setNewUpiId(e.target.value)}
                  required
                  className="w-full bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#333] rounded-[12px] py-3.5 px-4 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#e07f22]/40 font-medium text-[14px] transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Label (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Personal, Savings..."
                  value={newUpiLabel}
                  onChange={e => setNewUpiLabel(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#333] rounded-[12px] py-3.5 px-4 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#e07f22]/40 font-medium text-[14px] transition-colors"
                />
              </div>
              {upiMsg && (
                <p className={`text-sm font-bold text-center py-2 rounded-lg ${upiMsg.startsWith('✓') ? 'bg-green-50 dark:bg-green-900/20 text-green-600' : 'bg-red-50 dark:bg-red-900/20 text-red-500'}`}>
                  {upiMsg}
                </p>
              )}
              <button
                type="submit"
                disabled={upiLoading || !newUpiId.trim()}
                className="w-full bg-gradient-to-r from-[#c76500] to-[#e07f22] text-white font-bold py-4 rounded-[14px] shadow-[0_4px_15px_rgba(224,127,34,0.3)] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {upiLoading ? <><i className="fa-solid fa-circle-notch fa-spin"></i> Linking...</> : <><i className="fa-solid fa-link text-[12px]"></i> Link UPI ID</>}
              </button>
              <p className="text-center text-[11px] text-gray-400 dark:text-gray-500">Format: username@bankname (e.g. john@okhdfc)</p>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default UserPaymentDesktop;
