import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SidebarDesktop from './SidebarDesktop';
import HeaderDesktop from './HeaderDesktop';

const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('user_token')}` });
const REL_OPTIONS = ['Family', 'Friend', 'Colleague', 'Spouse', 'Other'];

const UserSafetyDesktop = ({ navigate, user }) => {
  const [contacts, setContacts] = useState([]);
  const [contactsLoading, setContactsLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRel, setNewRel] = useState('Family');
  const [addLoading, setAddLoading] = useState(false);
  const [addMsg, setAddMsg] = useState('');
  const [sosActive, setSosActive] = useState(false);
  const [sosCountdown, setSosCountdown] = useState(null);

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_BASE_URL}/support/trusted-contacts`, { headers: authHeader() })
      .then(r => setContacts(r.data.trustedContacts || []))
      .catch(() => {})
      .finally(() => setContactsLoading(false));
  }, []);

  // SOS countdown
  useEffect(() => {
    if (!sosActive) return;
    setSosCountdown(5);
    const interval = setInterval(() => {
      setSosCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setSosActive(false);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [sosActive]);

  const handleAddContact = async (e) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) return;
    setAddLoading(true);
    setAddMsg('');
    try {
      const r = await axios.post(`${import.meta.env.VITE_BASE_URL}/support/trusted-contacts`,
        { name: newName.trim(), phone: newPhone.trim(), relationship: newRel },
        { headers: authHeader() });
      setContacts(r.data.trustedContacts);
      setNewName(''); setNewPhone(''); setNewRel('Family');
      setAddMsg('✓ Contact added!');
      setTimeout(() => { setAddMsg(''); setAddOpen(false); }, 1200);
    } catch (err) {
      setAddMsg(err.response?.data?.message || 'Failed to add contact.');
    } finally { setAddLoading(false); }
  };

  const handleDeleteContact = async (id) => {
    try {
      const r = await axios.delete(`${import.meta.env.VITE_BASE_URL}/support/trusted-contacts/${id}`, { headers: authHeader() });
      setContacts(r.data.trustedContacts);
    } catch {}
  };

  const REL_COLORS = { Family: 'bg-orange-50 dark:bg-orange-900/20 text-orange-500', Friend: 'bg-blue-50 dark:bg-blue-900/20 text-blue-500', Colleague: 'bg-green-50 dark:bg-green-900/20 text-green-500', Spouse: 'bg-pink-50 dark:bg-pink-900/20 text-pink-500', Other: 'bg-gray-100 dark:bg-[#333] text-gray-500' };
  const relColor = (r) => REL_COLORS[r] || REL_COLORS.Other;

  return (
    <div className="flex h-screen bg-[#fcfcfc] dark:bg-[#131313] text-gray-900 dark:text-white font-sans overflow-hidden transition-colors duration-300">
      <SidebarDesktop user={user} navigate={navigate} />

      <main className="flex-1 flex flex-col h-screen overflow-y-auto no-scrollbar relative w-full pt-8 px-6 lg:px-12 bg-[#fafafa] dark:bg-[#111]">
        <HeaderDesktop title="Safety Center" subtitle="Manage emergency contacts, trigger SOS, and stay safe on every journey." user={user} />

        <div className="w-full max-w-[1200px] mx-auto pb-16 flex flex-col mt-6">
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_350px] gap-8">

            {/* ── LEFT COLUMN ── */}
            <div className="flex flex-col gap-6">

              {/* SOS Card */}
              <div className="bg-white dark:bg-[#1e1e1e] rounded-[20px] p-8 border border-gray-100 dark:border-transparent shadow-[0_4px_30px_rgb(0,0,0,0.04)] dark:shadow-xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
                <div className="flex-1 max-w-lg">
                  <div className="flex items-center gap-2 mb-5">
                    <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_#ff4444]"></div>
                    <span className="text-red-500 dark:text-red-400 text-[10px] font-bold uppercase tracking-widest">Critical Action</span>
                  </div>
                  <h2 className="text-[28px] font-bold text-gray-900 dark:text-white leading-tight mb-3 tracking-tight">Emergency<br/>Response</h2>
                  <p className="text-gray-500 dark:text-gray-400 text-[13px] leading-relaxed mb-7">
                    Activating SOS instantly shares your live location with emergency services and your {contacts.length} trusted contact{contacts.length !== 1 ? 's' : ''}. Our support team will stay online until help arrives.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 w-full">
                    <button
                      onClick={() => setSosActive(true)}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3.5 rounded-[10px] flex items-center justify-center gap-2 transition-colors shadow-[0_4px_20px_rgba(239,68,68,0.3)] active:scale-95"
                    >
                      <i className="fa-solid fa-tower-broadcast text-[13px]"></i>
                      {sosActive ? `SOS in ${sosCountdown}s…` : 'TRIGGER SOS'}
                    </button>
                    <a href="tel:100"
                      className="flex-1 bg-gray-50 dark:bg-[#2a2a2a] hover:bg-gray-100 dark:hover:bg-[#333] text-gray-900 dark:text-white font-bold py-3.5 rounded-[10px] border border-gray-200 dark:border-[#3a3a3a] flex items-center justify-center gap-2 transition-colors text-[13px]">
                      <i className="fa-solid fa-phone text-green-500"></i> Call Police
                    </a>
                  </div>
                  {sosActive && (
                    <div className="mt-4 flex items-center gap-2 text-red-500 dark:text-red-400">
                      <i className="fa-solid fa-circle-notch fa-spin text-sm"></i>
                      <span className="text-[12px] font-bold">Notifying your contacts and emergency services…</span>
                    </div>
                  )}
                </div>

                <div className="w-[160px] h-[180px] bg-red-50 dark:bg-[#2a1a1a] rounded-[16px] flex items-center justify-center shrink-0 self-center border border-red-100 dark:border-[#3a2020] overflow-hidden">
                  <div
                    onClick={() => setSosActive(true)}
                    className={`w-[110px] h-[110px] bg-red-100 dark:bg-[#1a0a0a] rounded-[20px] flex items-center justify-center cursor-pointer transition-all duration-300 border border-red-200 dark:border-[#3a1a1a] ${sosActive ? 'animate-pulse scale-105 shadow-[0_0_30px_rgba(239,68,68,0.5)]' : 'hover:scale-105 shadow-[0_10px_30px_rgba(239,68,68,0.15)]'}`}>
                    <i className="fa-solid fa-broadcast-tower text-red-500 dark:text-red-400 text-4xl"></i>
                  </div>
                </div>
              </div>

              {/* Trusted Contacts */}
              <div className="bg-white dark:bg-[#1e1e1e] rounded-[20px] p-8 border border-gray-100 dark:border-transparent shadow-[0_4px_30px_rgb(0,0,0,0.04)] dark:shadow-xl">
                <div className="flex justify-between items-start mb-7">
                  <div>
                    <h2 className="text-[22px] font-bold text-gray-900 dark:text-white tracking-tight mb-1">Trusted Contacts</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-[13px]">Alerted automatically when SOS is triggered ({contacts.length}/5)</p>
                  </div>
                  <button
                    onClick={() => setAddOpen(true)}
                    disabled={contacts.length >= 5}
                    className="flex items-center gap-2 bg-orange-50 dark:bg-[#2a1a08] text-[#e07f22] font-bold text-[12px] px-4 py-2.5 rounded-full hover:bg-orange-100 dark:hover:bg-[#3a2010] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <i className="fa-solid fa-user-plus text-[11px]"></i> Add Contact
                  </button>
                </div>

                {contactsLoading ? (
                  <div className="space-y-3">
                    {[0,1,2].map(i => <div key={i} className="h-16 rounded-[12px] bg-gray-100 dark:bg-[#222] animate-pulse"></div>)}
                  </div>
                ) : contacts.length === 0 ? (
                  <div className="text-center py-8">
                    <i className="fa-solid fa-user-group text-4xl text-gray-200 dark:text-[#333] mb-3 block"></i>
                    <p className="text-gray-400 dark:text-gray-500 text-[13px]">No trusted contacts added yet.</p>
                    <button onClick={() => setAddOpen(true)} className="text-[#e07f22] text-[12px] font-bold mt-2 hover:underline">Add your first contact</button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {contacts.map(c => (
                      <div key={c._id} className="flex items-center justify-between bg-gray-50 dark:bg-[#111] rounded-[14px] p-5 border border-gray-100 dark:border-[#2a2a2a] group hover:border-gray-200 dark:hover:border-[#3a3a3a] transition-colors">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-[10px] flex items-center justify-center font-black text-lg uppercase ${relColor(c.relationship)}`}>
                            {c.name?.[0] || '?'}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 dark:text-white text-[15px]">{c.name}</p>
                            <p className="text-gray-500 dark:text-gray-400 text-[12px] mt-0.5">{c.phone}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full ${relColor(c.relationship)}`}>
                            {c.relationship}
                          </span>
                          <button
                            onClick={() => handleDeleteContact(c._id)}
                            className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-900/20 text-red-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100"
                          >
                            <i className="fa-solid fa-trash text-[10px]"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Safety Tips */}
              <div className="bg-white dark:bg-[#1e1e1e] rounded-[20px] p-8 border border-gray-100 dark:border-transparent shadow-[0_4px_30px_rgb(0,0,0,0.04)] dark:shadow-xl">
                <h2 className="text-[20px] font-bold text-gray-900 dark:text-white tracking-tight mb-6">Safety Tips</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { icon: 'fa-helmet-safety', color: 'text-orange-500 bg-orange-50 dark:bg-orange-900/10', title: 'Always Wear a Helmet', desc: 'Your captain carries an extra helmet — always request it before the ride.' },
                    { icon: 'fa-star', color: 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/10', title: 'Rate Every Ride', desc: 'Your ratings help maintain quality and keep bad actors off the platform.' },
                    { icon: 'fa-eye', color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/10', title: 'Verify Captain Details', desc: 'Match the captain name, photo, and bike plate before boarding.' },
                    { icon: 'fa-location-dot', color: 'text-green-500 bg-green-50 dark:bg-green-900/10', title: 'Share Your Live Location', desc: 'Share your trip link with family before starting long rides.' },
                  ].map((tip, i) => (
                    <div key={i} className="flex gap-4 p-4 rounded-[12px] bg-gray-50 dark:bg-[#111] border border-gray-100 dark:border-[#222]">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${tip.color}`}>
                        <i className={`fa-solid ${tip.icon} text-sm`}></i>
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white text-[13px] mb-0.5">{tip.title}</p>
                        <p className="text-gray-500 dark:text-gray-400 text-[11px] leading-relaxed">{tip.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── RIGHT COLUMN ── */}
            <div className="flex flex-col gap-6">

              {/* Ride Status */}
              <div className="bg-white dark:bg-[#222] rounded-[20px] overflow-hidden border border-gray-100 dark:border-transparent shadow-[0_4px_30px_rgb(0,0,0,0.04)] dark:shadow-xl">
                <div className="h-[180px] bg-gradient-to-br from-[#e0eff5] to-[#c8dfe9] dark:from-[#16212b] dark:to-[#1a2a36] relative flex items-start p-5">
                  <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.2) 1px, transparent 1px)', backgroundSize: '24px 24px', transform: 'perspective(800px) rotateX(55deg) scale(2) translateY(-20%)' }}></div>
                  <div className="relative z-10 flex justify-between w-full items-start">
                    <span className="text-gray-600 dark:text-gray-400 italic text-lg font-medium">Live Tracking</span>
                    <span className="bg-blue-500 text-white text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]">Active</span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-[18px] font-bold text-gray-900 dark:text-white mb-1">Journey Tracking</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-[12px] mb-5">Your location is shared with {Math.max(contacts.length, 0)} contact{contacts.length !== 1 ? 's' : ''} during active rides.</p>
                  <button className="w-full border border-gray-200 dark:border-[#3a3a3a] text-gray-900 dark:text-white font-bold py-3 rounded-[10px] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors text-[12px] flex items-center justify-center gap-2">
                    <i className="fa-solid fa-share-nodes text-[13px]"></i> Share Journey Link
                  </button>
                </div>
              </div>

              {/* Emergency Numbers */}
              <div className="bg-white dark:bg-[#222] rounded-[20px] p-6 border border-gray-100 dark:border-transparent shadow-[0_4px_30px_rgb(0,0,0,0.04)] dark:shadow-xl">
                <h3 className="text-[18px] font-bold text-gray-900 dark:text-white mb-5">Emergency Numbers</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Police', number: '100', icon: 'fa-shield-halved', color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' },
                    { label: 'Ambulance', number: '108', icon: 'fa-truck-medical', color: 'text-red-500 bg-red-50 dark:bg-red-900/20' },
                    { label: 'Women Helpline', number: '181', icon: 'fa-phone-volume', color: 'text-pink-500 bg-pink-50 dark:bg-pink-900/20' },
                    { label: 'QuickBike SOS', number: '1800-QB-SOS', icon: 'fa-motorcycle', color: 'text-orange-500 bg-orange-50 dark:bg-orange-900/20' },
                  ].map(e => (
                    <a key={e.label} href={`tel:${e.number}`} className="flex items-center justify-between p-3.5 rounded-[12px] bg-gray-50 dark:bg-[#111] hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors border border-transparent hover:border-gray-200 dark:hover:border-[#333] group">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center ${e.color}`}>
                          <i className={`fa-solid ${e.icon} text-sm`}></i>
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white text-[13px]">{e.label}</p>
                          <p className="text-gray-500 dark:text-gray-400 text-[11px]">{e.number}</p>
                        </div>
                      </div>
                      <i className="fa-solid fa-phone text-gray-300 dark:text-[#444] group-hover:text-[#e07f22] text-sm transition-colors"></i>
                    </a>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>

      {/* Add Contact Modal */}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setAddOpen(false)}>
          <div className="bg-white dark:bg-[#1a1a1a] rounded-[24px] p-8 w-full max-w-[400px] shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-[20px] font-black font-['Manrope'] text-gray-900 dark:text-white">Add Trusted Contact</h2>
              <button onClick={() => setAddOpen(false)} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-[#2a2a2a] flex items-center justify-center">
                <i className="fa-solid fa-xmark text-gray-500 text-sm"></i>
              </button>
            </div>
            <form onSubmit={handleAddContact} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Full Name</label>
                <input value={newName} onChange={e => setNewName(e.target.value)} required placeholder="e.g. Priya Sharma"
                  className="w-full bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#333] rounded-[10px] py-3 px-4 text-gray-900 dark:text-white text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-[#e07f22]/40" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Phone Number</label>
                <input type="tel" value={newPhone} onChange={e => setNewPhone(e.target.value)} required placeholder="+91 98765 43210"
                  className="w-full bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#333] rounded-[10px] py-3 px-4 text-gray-900 dark:text-white text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-[#e07f22]/40" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Relationship</label>
                <select value={newRel} onChange={e => setNewRel(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#333] rounded-[10px] py-3 px-4 text-gray-800 dark:text-gray-200 text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-[#e07f22]/40">
                  {REL_OPTIONS.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              {addMsg && <p className={`text-sm font-bold ${addMsg.startsWith('✓') ? 'text-green-600' : 'text-red-500'}`}>{addMsg}</p>}
              <button type="submit" disabled={addLoading}
                className="w-full bg-gradient-to-r from-[#c76500] to-[#e07f22] text-white font-bold py-3.5 rounded-[12px] disabled:opacity-60 flex items-center justify-center gap-2">
                {addLoading ? <><i className="fa-solid fa-circle-notch fa-spin"></i> Adding...</> : <><i className="fa-solid fa-user-plus text-[12px]"></i> Add Contact</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserSafetyDesktop;
