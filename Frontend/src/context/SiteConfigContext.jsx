import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

/**
 * SiteConfigContext
 *
 * Fetches the public site config (banners + colors) once on app mount.
 * - Provides `getBanner(key)` to get the imageUrl for a specific banner slot.
 * - Injects brand colors as CSS custom properties on <html> so any component
 *   can reference them as `var(--color-primary)` etc.
 * - GLOBALLY overrides all Tailwind orange/amber utility classes so every
 *   component across the entire app responds to admin color changes.
 */

const DEFAULT_BANNERS = {
  hero:   'https://images.unsplash.com/photo-1519003722824-194d4455a60c?q=80&w=2075&auto=format&fit=crop',
  login:  'https://images.unsplash.com/photo-1519003722824-194d4455a60c?q=80&w=2075&auto=format&fit=crop',
  signup: 'https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?q=80&w=2070&auto=format&fit=crop',
};

const DEFAULT_COLORS = {
  primary:    '#F5820D',
  secondary:  '#FF9B31',
  background: '#FAFAFA',
  surface:    '#FFFFFF',
  text:       '#1A1A1A',
  muted:      '#6B7280',
};

const SiteConfigContext = createContext(null);

/* ── Helper: hex → "r, g, b" for rgba() usage ── */
function hexToRgb(hex) {
  const c = hex.replace('#', '');
  return [
    parseInt(c.slice(0, 2), 16),
    parseInt(c.slice(2, 4), 16),
    parseInt(c.slice(4, 6), 16),
  ].join(', ');
}

/* ── Helper: escape CSS selector special chars ── */
function esc(cls) {
  return cls.replace(/([[\]#/:.])/g, function(m) { return '\\' + m; });
}

/* ─────────────────────────────────────────────────
   Build the full override stylesheet from 6 color
   tokens. Returns a CSS string.
   ───────────────────────────────────────────────── */
function buildBrandCSS(primary, secondary, background, surface, text, muted) {
  const pRgb = hexToRgb(primary);
  const sRgb = hexToRgb(secondary);

  const rules = [];
  const r = (sel, decls) => rules.push(sel + '{' + decls + '}');
  const imp = (v) => v + ' !important';

  /* ── 1. CSS Custom Properties ── */
  r(':root', [
    `--color-primary:${primary}`,
    `--color-secondary:${secondary}`,
    `--color-background:${background}`,
    `--color-surface:${surface}`,
    `--color-text:${text}`,
    `--color-muted:${muted}`,
    `--primary:${primary}`,
    `--primary-container:${secondary}`,
  ].join(';'));

  /* ── 2. Brand Utility Classes ── */
  r('.brand-page-bg', `background-color:${imp(background)};color:${imp(text)}`);
  r('.brand-btn', `background:${imp(`linear-gradient(135deg,${primary} 0%,${secondary} 100%)`)}`);
  r('.brand-btn:hover', `box-shadow:${imp(`0 15px 40px rgba(${pRgb},0.4)`)}`);
  r('.brand-btn:disabled', `opacity:${imp('0.5')}`);
  r('.brand-text', `color:${imp(primary)}`);
  r('.brand-bg', `background-color:${imp(primary)}`);
  r('.brand-border', `border-color:${imp(primary)}`);
  r('.brand-icon', `color:${imp(primary)};fill:${imp(primary)}`);
  r('.brand-text-hover:hover', `color:${imp(primary)}`);
  r('.brand-focus:focus-within', `border-color:${imp(primary)};box-shadow:${imp(`0 8px 30px rgba(${pRgb},0.15)`)};outline:${imp('none')}`);
  r('.brand-nav-link', `color:${imp(primary)}`);
  r('.brand-nav-link:hover', `color:${imp(secondary)};background-color:${imp(`rgba(${pRgb},0.07)`)}`);
  r('.brand-text-secondary', `color:${imp(secondary)}`);
  r('.brand-bg-secondary', `background-color:${imp(secondary)}`);
  r('.brand-surface', `background-color:${imp(surface)}`);
  r('.brand-input', `background-color:${imp(surface)}`);
  r('.brand-text-primary', `color:${imp(text)}`);
  r('.brand-text-muted', `color:${imp(muted)}`);
  r('.brand-heading', `background:${imp(`linear-gradient(to bottom,${text},${muted})`)};-webkit-background-clip:${imp('text')};background-clip:${imp('text')};color:${imp('transparent')}`);

  /* ── 3. Text Color Overrides ── */
  r('.text-orange-400', `color:${imp(secondary)}`);
  r('.text-orange-500', `color:${imp(primary)}`);
  r('.text-orange-600', `color:${imp(primary)}`);
  r('.text-orange-900', `color:${imp(primary)}`);
  r('.text-amber-500', `color:${imp(secondary)}`);
  r('.text-amber-600', `color:${imp(primary)}`);
  for (const hex of ['#F5820D','#f5820d','#E67E00','#e67e00','#904d00','#A85300','#A85507']) {
    r('.' + esc('text-[' + hex + ']'), `color:${imp(primary)}`);
  }

  /* ── 4. Background Color Overrides ── */
  r('.bg-orange-50', `background-color:${imp(`rgba(${pRgb},0.06)`)}`);
  r('.bg-orange-100', `background-color:${imp(`rgba(${pRgb},0.12)`)}`);
  r('.bg-orange-200', `background-color:${imp(`rgba(${pRgb},0.20)`)}`);
  r('.bg-orange-400', `background-color:${imp(secondary)}`);
  r('.bg-orange-500', `background-color:${imp(primary)}`);
  r('.bg-orange-600', `background-color:${imp(primary)}`);
  r('.bg-orange-800', `background-color:${imp(primary)}`);
  r('.bg-orange-900', `background-color:${imp(primary)}`);
  r('.bg-amber-50', `background-color:${imp(`rgba(${sRgb},0.06)`)}`);
  r('.bg-amber-500', `background-color:${imp(secondary)}`);
  for (const hex of ['#F5820D','#f5820d','#E67E00','#e67e00','#E57E01']) {
    r('.' + esc('bg-[' + hex + ']'), `background-color:${imp(primary)}`);
  }

  /* ── 5. Border Color Overrides ── */
  r('.border-orange-100', `border-color:${imp(`rgba(${pRgb},0.15)`)}`);
  r('.border-orange-200', `border-color:${imp(`rgba(${pRgb},0.25)`)}`);
  r('.border-orange-300', `border-color:${imp(`rgba(${pRgb},0.35)`)}`);
  r('.border-orange-400', `border-color:${imp(secondary)}`);
  r('.border-orange-500', `border-color:${imp(primary)}`);
  r('.border-orange-900', `border-color:${imp(primary)}`);
  r('.border-amber-500', `border-color:${imp(secondary)}`);
  for (const hex of ['#F5820D','#e67e00','#E67E00']) {
    r('.' + esc('border-[' + hex + ']'), `border-color:${imp(primary)}`);
  }

  /* ── 6. Ring Overrides ── */
  r('.ring-orange-100', `--tw-ring-color:${imp(`rgba(${pRgb},0.15)`)}`);
  r('.ring-orange-200', `--tw-ring-color:${imp(`rgba(${pRgb},0.25)`)}`);
  r('.ring-orange-300', `--tw-ring-color:${imp(`rgba(${pRgb},0.35)`)}`);
  r('.ring-orange-400', `--tw-ring-color:${imp(secondary)}`);
  r('.ring-orange-500', `--tw-ring-color:${imp(primary)}`);

  /* ── 7. Shadow Overrides ── */
  for (const n of [200, 400, 500, 600, 900]) {
    r('.shadow-orange-' + n, `--tw-shadow-color:${imp(`rgba(${pRgb},${n <= 200 ? 0.2 : 0.4})`)}`);
  }

  /* ── 8. Gradient Overrides ── */
  r('.from-orange-100', `--tw-gradient-from:${imp(`rgba(${pRgb},0.12)`)}`);
  r('.from-orange-400', `--tw-gradient-from:${imp(secondary)}`);
  r('.from-orange-500', `--tw-gradient-from:${imp(primary)}`);
  r('.from-orange-600', `--tw-gradient-from:${imp(primary)}`);
  for (const hex of ['#904d00','#A85300','#b35f00']) {
    r('.' + esc('from-[' + hex + ']'), `--tw-gradient-from:${imp(primary)}`);
  }
  r('.to-orange-200', `--tw-gradient-to:${imp(`rgba(${pRgb},0.20)`)}`);
  r('.to-orange-400', `--tw-gradient-to:${imp(secondary)}`);
  r('.to-orange-600', `--tw-gradient-to:${imp(primary)}`);
  r('.to-orange-700', `--tw-gradient-to:${imp(primary)}`);
  for (const hex of ['#E67E00','#eb8300']) {
    r('.' + esc('to-[' + hex + ']'), `--tw-gradient-to:${imp(secondary)}`);
  }
  r('.' + esc('to-[#F5820D]'), `--tw-gradient-to:${imp(primary)}`);

  /* ── 9. Hover State Overrides ── */
  r('.' + esc('hover:bg-orange-50') + ':hover', `background-color:${imp(`rgba(${pRgb},0.06)`)}`);
  r('.' + esc('hover:bg-orange-100') + ':hover', `background-color:${imp(`rgba(${pRgb},0.12)`)}`);
  r('.' + esc('hover:bg-orange-600') + ':hover', `background-color:${imp(primary)}`);
  r('.' + esc('hover:bg-[#e67e00]') + ':hover', `background-color:${imp(primary)}`);
  r('.' + esc('hover:bg-[#E56A00]') + ':hover', `background-color:${imp(primary)}`);
  r('.' + esc('hover:text-orange-500') + ':hover', `color:${imp(primary)}`);
  r('.' + esc('hover:text-orange-600') + ':hover', `color:${imp(primary)}`);
  r('.' + esc('hover:border-orange-200') + ':hover', `border-color:${imp(`rgba(${pRgb},0.25)`)}`);
  r('.' + esc('hover:border-orange-300') + ':hover', `border-color:${imp(`rgba(${pRgb},0.35)`)}`);

  /* ── 10. Focus State Overrides ── */
  r('.' + esc('focus:ring-orange-400') + ':focus', `--tw-ring-color:${imp(secondary)}`);
  r('.' + esc('focus:ring-orange-500') + ':focus', `--tw-ring-color:${imp(primary)}`);
  r('.' + esc('focus:ring-[#F5820D]') + ':focus', `--tw-ring-color:${imp(primary)}`);
  r('.' + esc('focus:border-orange-500') + ':focus', `border-color:${imp(primary)}`);
  r('.' + esc('focus:border-[#e67e00]') + ':focus', `border-color:${imp(primary)}`);
  r('.' + esc('focus-within:border-[#F5820D]') + ':focus-within', `border-color:${imp(primary)}`);
  r('.' + esc('focus-within:border-[#e67e00]') + ':focus-within', `border-color:${imp(primary)}`);

  /* ── 11. Active State Overrides ── */
  r('.' + esc('active:bg-orange-50') + ':active', `background-color:${imp(`rgba(${pRgb},0.06)`)}`);
  r('.' + esc('active:bg-orange-100') + ':active', `background-color:${imp(`rgba(${pRgb},0.12)`)}`);

  /* ── 12. Dark Mode Overrides ── */
  r('.dark .dark\\:text-orange-400', `color:${imp(secondary)}`);
  r('.dark .dark\\:text-orange-500', `color:${imp(primary)}`);
  r('.dark .dark\\:bg-orange-500\\/10', `background-color:${imp(`rgba(${pRgb},0.1)`)}`);
  r('.dark .dark\\:bg-orange-500\\/20', `background-color:${imp(`rgba(${pRgb},0.2)`)}`);
  r('.dark .dark\\:border-orange-500', `border-color:${imp(primary)}`);

  /* ── 13. Design Token Bridge ── */
  r('.input-field:focus', `border-bottom-color:${imp(primary)}`);
  r('.btn-primary', `background:${imp(`linear-gradient(135deg,${primary} 0%,${secondary} 100%)`)}`);
  r('.dot-orange', `background:${imp(secondary)}`);

  return rules.join('\n');
}

export const SiteConfigProvider = ({ children }) => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/site-config`);
        const data = res.data?.data;
        if (data) {
          setConfig(data);

          // ── Build a color map for easy access ──
          const colorMap = {};
          (data.colors || []).forEach(c => { colorMap[c.key] = c.value; });

          const primary    = colorMap.primary    || '#F5820D';
          const secondary  = colorMap.secondary  || '#FF9B31';
          const background = colorMap.background || '#FAFAFA';
          const surface    = colorMap.surface    || '#FFFFFF';
          const text       = colorMap.text       || '#1A1A1A';
          const muted      = colorMap.muted      || '#6B7280';

          // ── Inject CSS custom properties on :root ──
          const root = document.documentElement;
          root.style.setProperty('--color-primary',     primary);
          root.style.setProperty('--color-secondary',   secondary);
          root.style.setProperty('--color-background',  background);
          root.style.setProperty('--color-surface',     surface);
          root.style.setProperty('--color-text',        text);
          root.style.setProperty('--color-muted',       muted);

          // ── Inject/replace global brand override stylesheet ──
          let styleEl = document.getElementById('brand-dynamic-styles');
          if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = 'brand-dynamic-styles';
            document.head.appendChild(styleEl);
          }
          styleEl.textContent = buildBrandCSS(primary, secondary, background, surface, text, muted);
        }
      } catch {
        // Silently fall back to defaults on network error
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  /**
   * Returns the imageUrl for a banner slot.
   * Falls back to the hardcoded default if the admin hasn't set one yet.
   */
  const getBanner = (key) => {
    if (!config?.banners) return DEFAULT_BANNERS[key] || '';
    const banner = config.banners.find(b => b.key === key);
    if (!banner || !banner.enabled || !banner.imageUrl) {
      return DEFAULT_BANNERS[key] || '';
    }
    return banner.imageUrl;
  };

  /**
   * Returns the value of a color token, falling back to the default palette.
   */
  const getColor = (key) => {
    if (!config?.colors) return DEFAULT_COLORS[key] || '';
    const token = config.colors.find(c => c.key === key);
    return token?.value || DEFAULT_COLORS[key] || '';
  };

  return (
    <SiteConfigContext.Provider value={{ config, loading, getBanner, getColor }}>
      {children}
    </SiteConfigContext.Provider>
  );
};

export const useSiteConfig = () => {
  const ctx = useContext(SiteConfigContext);
  if (!ctx) throw new Error('useSiteConfig must be used inside <SiteConfigProvider>');
  return ctx;
};
