import React, { useState } from 'react';
import axios from 'axios';
import SidebarDesktop from './SidebarDesktop';
import HeaderDesktop from './HeaderDesktop';

const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('user_token')}` });

const FAQS = [
  { q: 'How do I book a ride?', a: 'Open the Home page, enter your pickup and destination, select your preferred vehicle (Moto, Auto, or Car), and tap Book Ride. A captain will be assigned within seconds.', icon: 'fa-calendar-check', color: 'bg-orange-100 dark:bg-[#e26900]/20 text-[#ec7100]' },
  { q: 'Which payment methods are accepted?', a: 'QuickBike accepts Cash (pay the captain directly), UPI, and QuickBike Wallet. You can manage your payment methods from the Payment tab.', icon: 'fa-money-bill', color: 'bg-green-50 dark:bg-green-900/20 text-green-600' },
  { q: 'What safety measures are in place?', a: 'All captains undergo background verification. Your live location is shared during rides, and SOS can be triggered from the Safety Center at any time.', icon: 'fa-shield-halved', color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-500' },
  { q: 'How do I cancel a ride?', a: 'You can cancel a ride before the captain arrives from the active ride screen. Cancellations after the captain arrives may incur a small cancellation fee.', icon: 'fa-circle-xmark', color: 'bg-red-50 dark:bg-red-900/20 text-red-500' },
  { q: 'How do promos and offers work?', a: 'Visit the Offers tab to browse active promo codes. Codes are applied during ride booking. One promo per ride is allowed. Referral credits land directly in your wallet.', icon: 'fa-tag', color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-500' },
  { q: 'Can I schedule a ride in advance?', a: 'Currently QuickBike supports instant bookings only to ensure ultra-fast dispatch. Scheduled rides are coming soon — stay tuned!', icon: 'fa-clock', color: 'bg-gray-100 dark:bg-[#333]/30 text-gray-500' },
];

const CATEGORIES = ['Ride Issue', 'Payment', 'Account', 'Safety', 'Other'];

const UserHelpDesktop = ({ navigate, user }) => {
  const [activeFaq, setActiveFaq] = useState(null);

  // Contact form
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('Ride Issue');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null); // { success, text }

  const handleSend = async (e) => {
    e.preventDefault();
    if (message.trim().length < 10) {
      setSendResult({ success: false, text: 'Message too short — please describe your issue.' });
      return;
    }
    setSending(true);
    setSendResult(null);
    try {
      const r = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/support/message`,
        { subject: subject || category, message, category },
        { headers: authHeader() }
      );
      setSendResult({ success: true, text: r.data.message });
      setMessage('');
      setSubject('');
    } catch (err) {
      setSendResult({ success: false, text: err.response?.data?.message || 'Failed to send. Please try again.' });
    } finally { setSending(false); }
  };

  return (
    <div className="flex h-screen bg-[#fcfcfc] dark:bg-[#111111] text-gray-900 dark:text-white font-sans overflow-hidden transition-colors duration-300">
      <SidebarDesktop user={user} navigate={navigate} />

      <main className="flex-1 flex flex-col h-screen overflow-y-auto no-scrollbar bg-[#fafafa] dark:bg-[#111] relative pt-8 px-6 lg:px-12">

        <HeaderDesktop title="Help & Support" subtitle="Browse our knowledge base or send a message — we reply in under 15 minutes." showSearch={false} user={user} />

        <div className="w-full max-w-[1200px] mx-auto pb-16 flex flex-col mt-6">
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-10 xl:gap-12 items-start">

            {/* ── LEFT: FAQ ── */}
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-6 h-[2px] bg-[#e07f22] rounded-full"></div>
                <h2 className="text-[20px] font-bold text-gray-900 dark:text-white tracking-tight">Frequently Asked Questions</h2>
              </div>

              {FAQS.map((faq, idx) => {
                const isActive = activeFaq === idx;
                return (
                  <div key={idx} onClick={() => setActiveFaq(isActive ? null : idx)}
                    className={`rounded-[16px] cursor-pointer border transition-all ${isActive ? 'bg-white dark:bg-[#18181A] border-gray-100 dark:border-[#333] shadow-[0_6px_30px_rgb(0,0,0,0.04)] p-6' : 'bg-[#f4f4f4] dark:bg-[#18181A] border-transparent hover:bg-gray-100 dark:hover:bg-[#222] p-6'}`}>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-9 h-9 rounded-[8px] flex items-center justify-center shrink-0 ${faq.color}`}>
                          <i className={`fa-solid ${faq.icon} text-[13px]`}></i>
                        </div>
                        <h3 className="font-bold text-[14px] text-gray-900 dark:text-[#eee]">{faq.q}</h3>
                      </div>
                      <i className={`fa-solid fa-${isActive ? 'chevron-up' : 'plus'} text-gray-400 dark:text-[#555] text-[12px] shrink-0 transition-transform`}></i>
                    </div>
                    {isActive && (
                      <div className="mt-4 pl-13 text-gray-500 dark:text-gray-400 text-[13px] leading-relaxed ml-[52px]">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Corporate CTA */}
              <div className="bg-[#1e1e1e] dark:bg-[#1e1c1a] rounded-[20px] p-8 mt-4 relative overflow-hidden shadow-xl">
                <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-white/5 rotate-12 rounded-[40px]"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#e07f22]/10 rounded-full blur-3xl"></div>
                <div className="relative z-10">
                  <i className="fa-solid fa-building text-[#e07f22] text-2xl mb-4 block"></i>
                  <h2 className="text-[20px] font-bold text-white mb-2">Corporate Accounts</h2>
                  <p className="text-gray-400 text-[13px] leading-relaxed mb-6">Priority dispatch, bespoke billing, and a dedicated account manager for your team.</p>
                  <button className="bg-[#e07f22] hover:bg-[#c76500] text-white font-bold text-[12px] px-6 py-3 rounded-full transition-colors">
                    Contact Sales
                  </button>
                </div>
              </div>
            </div>

            {/* ── RIGHT: Contact Form ── */}
            <div className="sticky top-4">
              <div className="bg-white dark:bg-[#18181A] border border-gray-100 dark:border-[#222] rounded-[24px] p-8 shadow-[0_10px_40px_rgb(0,0,0,0.05)] dark:shadow-none">
                <div className="mb-6">
                  <h2 className="text-[22px] font-black font-['Manrope'] text-gray-900 dark:text-white mb-1">Send a Message</h2>
                  <p className="text-gray-400 text-[12px]">Avg. response time: &lt; 15 minutes</p>
                </div>

                {sendResult?.success ? (
                  <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/30 rounded-[16px] p-6 text-center">
                    <i className="fa-solid fa-circle-check text-3xl text-green-500 mb-3 block"></i>
                    <p className="text-green-700 dark:text-green-400 font-bold text-[14px] mb-1">Message Received!</p>
                    <p className="text-green-600 dark:text-green-500 text-[12px] leading-relaxed">{sendResult.text}</p>
                    <button onClick={() => setSendResult(null)} className="mt-4 text-[12px] font-bold text-green-600 hover:underline">Send another message</button>
                  </div>
                ) : (
                  <form onSubmit={handleSend} className="space-y-4">
                    {/* Pre-fill name from user */}
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Your Name</label>
                      <input
                        type="text"
                        value={name || `${user?.fullname?.firstname || ''} ${user?.fullname?.lastname || ''}`.trim()}
                        onChange={e => setName(e.target.value)}
                        readOnly={!!user}
                        className="w-full bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#333] rounded-[10px] py-3 px-4 text-gray-800 dark:text-gray-200 text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-[#e07f22]/40 transition-colors read-only:opacity-70"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Category</label>
                      <select value={category} onChange={e => setCategory(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#333] rounded-[10px] py-3 px-4 text-gray-800 dark:text-gray-200 text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-[#e07f22]/40 transition-colors">
                        {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Subject</label>
                      <input type="text" placeholder="Brief description..." value={subject} onChange={e => setSubject(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#333] rounded-[10px] py-3 px-4 text-gray-800 dark:text-gray-200 text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-[#e07f22]/40 placeholder-gray-300 dark:placeholder-gray-600 transition-colors" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Message</label>
                      <textarea placeholder="Describe your issue in detail..." rows={4} value={message} onChange={e => setMessage(e.target.value)} required minLength={10}
                        className="w-full bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#333] rounded-[10px] py-3 px-4 text-gray-800 dark:text-gray-200 text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-[#e07f22]/40 placeholder-gray-300 dark:placeholder-gray-600 resize-none transition-colors"></textarea>
                      <p className="text-[10px] text-gray-400 mt-1 text-right">{message.length}/500</p>
                    </div>

                    {sendResult && !sendResult.success && (
                      <p className="text-red-500 text-[12px] font-bold">{sendResult.text}</p>
                    )}

                    <button type="submit" disabled={sending || message.trim().length < 10}
                      className="w-full bg-[#e07f22] hover:bg-[#c76500] text-white font-bold text-[13px] py-4 rounded-[12px] transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(224,127,34,0.3)]">
                      {sending ? <><i className="fa-solid fa-circle-notch fa-spin"></i> Sending...</> : <><i className="fa-solid fa-paper-plane"></i> Send Message</>}
                    </button>
                  </form>
                )}

                <div className="flex justify-center gap-8 mt-6 pt-5 border-t border-gray-100 dark:border-[#222]">
                  <div className="flex flex-col items-center gap-1 cursor-pointer group">
                    <i className="fa-solid fa-phone text-gray-300 dark:text-[#444] group-hover:text-[#e07f22] text-lg transition-colors"></i>
                    <span className="text-[10px] font-bold text-gray-400 group-hover:text-[#e07f22] transition-colors">Call</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 cursor-pointer group">
                    <i className="fa-brands fa-whatsapp text-gray-300 dark:text-[#444] group-hover:text-green-500 text-lg transition-colors"></i>
                    <span className="text-[10px] font-bold text-gray-400 group-hover:text-green-500 transition-colors">WhatsApp</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 cursor-pointer group">
                    <i className="fa-solid fa-at text-gray-300 dark:text-[#444] group-hover:text-[#e07f22] text-lg transition-colors"></i>
                    <span className="text-[10px] font-bold text-gray-400 group-hover:text-[#e07f22] transition-colors">Email</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default UserHelpDesktop;
