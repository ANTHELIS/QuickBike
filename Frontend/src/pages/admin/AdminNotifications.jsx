import React, { useState, useEffect } from 'react';
import axios from 'axios';

const adminHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem('admin_token')}`,
});

const AUDIENCE_OPTIONS = [
  { value: 'all',      label: 'All Users & Captains', icon: 'fa-globe',      color: 'text-blue-400' },
  { value: 'users',    label: 'Riders Only',           icon: 'fa-user',       color: 'text-green-400' },
  { value: 'captains', label: 'Captains Only',         icon: 'fa-motorcycle', color: 'text-orange-400' },
];

const TYPE_OPTIONS = [
  { value: 'system',  label: 'System',    icon: 'fa-gear' },
  { value: 'promo',   label: 'Promotion', icon: 'fa-tag' },
  { value: 'safety',  label: 'Safety',    icon: 'fa-shield-halved' },
  { value: 'payment', label: 'Payment',   icon: 'fa-credit-card' },
];

const AdminNotifications = () => {
  const [form, setForm] = useState({
    title: '',
    body: '',
    type: 'system',
    audience: 'all',
  });
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadHistory = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/api/admin/notifications/history`,
        { headers: adminHeader() }
      );
      setHistory(res.data.data || []);
    } catch {
      // silent fail for history
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => { loadHistory(); }, []);

  const handleSend = async e => {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) return;
    setSending(true);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/api/admin/notifications/broadcast`,
        form,
        { headers: adminHeader() }
      );
      showToast(`✓ Sent to ${res.data.counts?.users ?? 0} users + ${res.data.counts?.captains ?? 0} captains`);
      setForm({ title: '', body: '', type: 'system', audience: 'all' });
      loadHistory();
    } catch (err) {
      showToast(err.response?.data?.message || 'Broadcast failed', 'error');
    } finally {
      setSending(false);
    }
  };

  const charCount = form.body.length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl text-sm font-semibold transition-all ${toast.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'} text-white`}>
          <i className={`fa-solid ${toast.type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-check'}`} />
          {toast.msg}
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-2xl font-black text-white">Push Notifications</h1>
        <p className="text-slate-400 text-sm mt-1">Broadcast in-app notifications to users, captains, or everyone at once.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── COMPOSE FORM ── */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-white font-bold text-base mb-5 flex items-center gap-2">
            <i className="fa-solid fa-paper-plane text-orange-400" /> Compose Notification
          </h2>
          <form onSubmit={handleSend} className="space-y-5">

            {/* Title */}
            <div>
              <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500 block mb-2">Title</label>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-500 transition placeholder-slate-600"
                placeholder="e.g. 🎉 Weekend offer just for you!"
                maxLength={100}
                required
              />
              <p className="text-right text-[10px] text-slate-600 mt-1">{form.title.length}/100</p>
            </div>

            {/* Body */}
            <div>
              <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500 block mb-2">Message</label>
              <textarea
                value={form.body}
                onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-500 transition placeholder-slate-600 resize-none"
                placeholder="Write your full message here..."
                rows={4}
                maxLength={500}
                required
              />
              <p className={`text-right text-[10px] mt-1 ${charCount > 450 ? 'text-orange-400' : 'text-slate-600'}`}>{charCount}/500</p>
            </div>

            {/* Type */}
            <div>
              <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500 block mb-2">Notification Type</label>
              <div className="grid grid-cols-2 gap-2">
                {TYPE_OPTIONS.map(t => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, type: t.value }))}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                      form.type === t.value
                        ? 'bg-orange-500/10 border-orange-500/40 text-orange-400'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <i className={`fa-solid ${t.icon} text-xs`} /> {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Audience */}
            <div>
              <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500 block mb-2">Send To</label>
              <div className="space-y-2">
                {AUDIENCE_OPTIONS.map(a => (
                  <button
                    key={a.value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, audience: a.value }))}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold border transition-all ${
                      form.audience === a.value
                        ? 'bg-orange-500/10 border-orange-500/40 text-white'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <i className={`fa-solid ${a.icon} ${form.audience === a.value ? a.color : ''}`} />
                    {a.label}
                    {form.audience === a.value && (
                      <i className="fa-solid fa-circle-check ml-auto text-orange-400 text-xs" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview card */}
            {(form.title || form.body) && (
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-3">Preview</p>
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center shrink-0">
                    <i className="fa-solid fa-bolt text-orange-400" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-bold">{form.title || 'Notification title'}</p>
                    <p className="text-slate-400 text-xs mt-1 leading-relaxed">{form.body || 'Your message will appear here...'}</p>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={sending || !form.title.trim() || !form.body.trim()}
              className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 disabled:opacity-40 text-white font-black py-3.5 rounded-xl text-sm tracking-wide transition-all"
            >
              {sending ? (
                <><i className="fa-solid fa-spinner animate-spin" /> Sending...</>
              ) : (
                <><i className="fa-solid fa-paper-plane" /> Broadcast Notification</>
              )}
            </button>
          </form>
        </div>

        {/* ── HISTORY ── */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-white font-bold text-base mb-5 flex items-center gap-2">
            <i className="fa-solid fa-clock-rotate-left text-slate-400" /> Sent History
          </h2>
          {historyLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="bg-slate-800 h-16 rounded-xl animate-pulse" />)}
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12">
              <i className="fa-solid fa-bell-slash text-slate-700 text-3xl mb-3 block" />
              <p className="text-slate-500 text-sm">No broadcasts sent yet.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
              {history.map((n, i) => (
                <div key={i} className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-white text-sm font-bold truncate">{n.title}</p>
                    <span className="text-[10px] bg-slate-700 text-slate-400 px-2 py-0.5 rounded-full shrink-0 font-mono">{n.type}</span>
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed line-clamp-2">{n.body}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-slate-600">{n.sentAt ? new Date(n.sentAt).toLocaleString() : '—'}</span>
                    <span className="text-[10px] text-orange-400 font-semibold">{n.recipientCount} recipients</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminNotifications;
