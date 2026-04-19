import React, { useState, useEffect } from 'react';
import axios from 'axios';

const adminHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem('admin_token')}`,
});

const DEFAULT_COLORS = {
  primary:    '#F5820D',
  secondary:  '#FF9B31',
  background: '#FAFAFA',
  surface:    '#FFFFFF',
  text:       '#1A1A1A',
  muted:      '#6B7280',
};

// ── Color swatch input ────────────────────────────────────────────────────────
const ColorRow = ({ token, onChange, onReset }) => (
  <div className="flex items-center gap-4 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3">
    {/* Live color preview */}
    <div
      className="w-10 h-10 rounded-lg border border-slate-600 shrink-0 shadow-inner"
      style={{ backgroundColor: token.value }}
    />
    <div className="flex-1 min-w-0">
      <p className="text-white text-sm font-bold">{token.label}</p>
      <p className="text-slate-500 text-xs font-mono">{token.key}</p>
    </div>
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={token.value}
        onChange={e => onChange(token.key, e.target.value)}
        className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
        title="Pick color"
      />
      <input
        type="text"
        value={token.value}
        onChange={e => onChange(token.key, e.target.value)}
        className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-1.5 text-xs font-mono w-24 outline-none focus:border-orange-500 transition"
          maxLength={7}
          placeholder="#F5820D"
        />
        <button
          type="button"
          onClick={() => onReset(token.key)}
          className="p-1.5 ml-1 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md transition"
          title="Reset to default"
        >
          <i className="fa-solid fa-rotate-left"></i>
        </button>
      </div>
    </div>
  );

// ── Banner input row ──────────────────────────────────────────────────────────
const BannerRow = ({ banner, onChange }) => (
  <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
    <div className="flex items-center justify-between px-5 py-3 border-b border-slate-700">
      <div>
        <p className="text-white font-bold text-sm">{banner.label}</p>
        <p className="text-slate-500 text-xs font-mono">{banner.key}</p>
      </div>
      {/* Enabled toggle */}
      <button
        type="button"
        onClick={() => onChange(banner.key, 'enabled', !banner.enabled)}
        className={`relative w-11 h-6 rounded-full transition-colors ${banner.enabled ? 'bg-orange-500' : 'bg-slate-600'}`}
      >
        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${banner.enabled ? 'left-6' : 'left-1'}`} />
      </button>
    </div>
    <div className="px-5 py-4 space-y-3">
      {/* Image URL input */}
      <div>
        <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500 block mb-1.5">Image URL</label>
        <input
          type="url"
          value={banner.imageUrl}
          onChange={e => onChange(banner.key, 'imageUrl', e.target.value)}
          className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-orange-500 transition placeholder-slate-600"
          placeholder="https://example.com/image.jpg"
        />
      </div>
      {/* Alt text */}
      <div>
        <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500 block mb-1.5">Alt Text</label>
        <input
          type="text"
          value={banner.altText}
          onChange={e => onChange(banner.key, 'altText', e.target.value)}
          className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-orange-500 transition placeholder-slate-600"
          placeholder="Descriptive text for the image"
        />
      </div>
      {/* Preview */}
      {banner.imageUrl && (
        <div className="mt-2 relative rounded-xl overflow-hidden h-36 bg-slate-900 border border-slate-700">
          <img
            src={banner.imageUrl}
            alt={banner.altText}
            className="absolute inset-0 w-full h-full object-cover"
            onError={e => { e.target.style.display = 'none'; }}
          />
          <div className="absolute inset-0 flex items-end p-3">
            <span className="text-[10px] font-bold bg-black/50 text-white px-2 py-1 rounded-full backdrop-blur-sm">Preview</span>
          </div>
        </div>
      )}
    </div>
  </div>
);

// ── Main Page ─────────────────────────────────────────────────────────────────
const AdminSiteConfig = () => {
  const [banners, setBanners] = useState([]);
  const [colors, setColors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({ banners: false, colors: false });
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BASE_URL}/api/admin/site-config`,
          { headers: adminHeader() }
        );
        const d = res.data.data;
        setBanners(d.banners || []);
        setColors(d.colors || []);
      } catch {
        showToast('Failed to load site config', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleBannerChange = (key, field, value) => {
    setBanners(prev => prev.map(b => b.key === key ? { ...b, [field]: value } : b));
  };

  const handleColorChange = (key, value) => {
    setColors(prev => prev.map(c => c.key === key ? { ...c, value } : c));
  };

  const handleColorReset = (key) => {
    setColors(prev => prev.map(c => c.key === key ? { ...c, value: DEFAULT_COLORS[key] } : c));
  };

  const saveBanners = async () => {
    setSaving(s => ({ ...s, banners: true }));
    try {
      await axios.patch(
        `${import.meta.env.VITE_BASE_URL}/api/admin/site-config/banners`,
        { banners },
        { headers: adminHeader() }
      );
      showToast('Banners saved successfully!');
    } catch {
      showToast('Failed to save banners', 'error');
    } finally {
      setSaving(s => ({ ...s, banners: false }));
    }
  };

  const saveColors = async () => {
    setSaving(s => ({ ...s, colors: true }));
    try {
      await axios.patch(
        `${import.meta.env.VITE_BASE_URL}/api/admin/site-config/colors`,
        { colors },
        { headers: adminHeader() }
      );
      showToast('Color palette saved!');
    } catch {
      showToast('Failed to save colors', 'error');
    } finally {
      setSaving(s => ({ ...s, colors: false }));
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl text-sm font-semibold transition-all ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'}`}>
          <i className={`fa-solid ${toast.type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-check'}`} />
          {toast.msg}
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-2xl font-black text-white">Site Configuration</h1>
        <p className="text-slate-400 text-sm mt-1">Manage hero images, banners, and brand colors for all public pages.</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-slate-800 rounded-2xl h-40 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-10">

          {/* ── BANNERS SECTION ── */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-white">Page Banners & Hero Images</h2>
                <p className="text-slate-500 text-xs mt-0.5">Paste a publicly accessible image URL. Changes apply immediately after save.</p>
              </div>
              <button
                onClick={saveBanners}
                disabled={saving.banners}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all"
              >
                {saving.banners ? <i className="fa-solid fa-spinner animate-spin" /> : <i className="fa-solid fa-floppy-disk" />}
                Save Banners
              </button>
            </div>
            <div className="space-y-4">
              {banners.map(b => (
                <BannerRow key={b.key} banner={b} onChange={handleBannerChange} />
              ))}
            </div>
          </section>

          {/* ── COLORS SECTION ── */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-white">Brand Color Palette</h2>
                <p className="text-slate-500 text-xs mt-0.5">Use the color picker or type hex codes directly. Live preview updates immediately.</p>
              </div>
              <button
                onClick={saveColors}
                disabled={saving.colors}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all"
              >
                {saving.colors ? <i className="fa-solid fa-spinner animate-spin" /> : <i className="fa-solid fa-palette" />}
                Save Colors
              </button>
            </div>
            <div className="space-y-3">
              {colors.map(c => (
                <ColorRow key={c.key} token={c} onChange={handleColorChange} onReset={handleColorReset} />
              ))}
            </div>

            {/* Live palette preview */}
            <div className="mt-5 bg-slate-800 border border-slate-700 rounded-2xl p-5">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-3">Live Palette Preview</p>
              <div className="flex gap-3 flex-wrap">
                {colors.map(c => (
                  <div key={c.key} className="flex flex-col items-center gap-1.5">
                    <div className="w-10 h-10 rounded-xl shadow-md border border-white/10" style={{ backgroundColor: c.value }} />
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{c.key}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

        </div>
      )}
    </div>
  );
};

export default AdminSiteConfig;
