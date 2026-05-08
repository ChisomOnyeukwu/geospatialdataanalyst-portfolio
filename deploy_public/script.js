/* ═══════════════════════════════════════════════════════
   CHISOM PORTFOLIO — script.js
   All interactive features, fully debugged
═══════════════════════════════════════════════════════ */

'use strict';

// ─── UTILS ───────────────────────────────────────────
const qs  = (sel, ctx = document) => ctx.querySelector(sel);
const qsa = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

// ─── THEME TOGGLE ────────────────────────────────────
(function initTheme() {
  const html    = document.documentElement;
  const btn     = qs('#themeBtn');
  const STORAGE = 'cv-theme';
  const media   = window.matchMedia('(prefers-color-scheme: dark)');

  function applyTheme(t, persist = true) {
    html.setAttribute('data-theme', t);
    if (persist) localStorage.setItem(STORAGE, t);
  }

  // On load: check saved preference, then system preference
  const saved  = localStorage.getItem(STORAGE);
  const systemTheme = () => media.matches ? 'dark' : 'light';
  let previewTheme = null;
  applyTheme(saved || systemTheme(), Boolean(saved));

  btn?.addEventListener('click', () => {
    const current = html.getAttribute('data-theme');
    applyTheme(previewTheme ? current : (current === 'dark' ? 'light' : 'dark'));
    previewTheme = null;
    btn.classList.remove('theme-previewing');
  });

  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    btn?.addEventListener('pointerenter', () => {
      if (previewTheme) return;
      previewTheme = html.getAttribute('data-theme');
      applyTheme(previewTheme === 'dark' ? 'light' : 'dark', false);
      btn.classList.add('theme-previewing');
    });
    btn?.addEventListener('pointerleave', () => {
      if (previewTheme) applyTheme(previewTheme, false);
      previewTheme = null;
      btn.classList.remove('theme-previewing');
    });
  }

  btn?.addEventListener('dblclick', () => {
    localStorage.removeItem(STORAGE);
    applyTheme(systemTheme(), false);
  });

  media.addEventListener?.('change', () => {
    if (!localStorage.getItem(STORAGE)) applyTheme(systemTheme(), false);
  });
})();

// ─── NAV SCROLL SHADOW ───────────────────────────────
const navBar = qs('#navBar');
window.addEventListener('scroll', () => {
  navBar?.classList.toggle('scrolled', window.scrollY > 10);
}, { passive: true });

// Active section markers for desktop nav and mobile dock
const sectionLinks = qsa('.nav-link[href^="#"], .mobile-dock a[href^="#"]');
const sectionTargets = sectionLinks
  .map(link => qs(link.getAttribute('href')))
  .filter(Boolean);

function setActiveSection(id) {
  sectionLinks.forEach(link => {
    link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
  });
}

const sectionObserver = new IntersectionObserver(entries => {
  const visible = entries
    .filter(entry => entry.isIntersecting)
    .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
  if (visible) setActiveSection(visible.target.id);
}, { rootMargin: '-35% 0px -50% 0px', threshold: [0.15, 0.3, 0.55] });

sectionTargets.forEach(section => sectionObserver.observe(section));

// ─── MOBILE NAV ──────────────────────────────────────
const burger   = qs('#burger');
const navPanel = qs('#navPanel') || createNavPanel();

function createNavPanel() {
  const panel = document.createElement('div');
  panel.className = 'nav-panel';
  panel.id = 'navPanel';
  const links = qsa('.nav-links .nav-link');
  links.forEach(a => {
    const clone = a.cloneNode(true);
    panel.appendChild(clone);
  });
