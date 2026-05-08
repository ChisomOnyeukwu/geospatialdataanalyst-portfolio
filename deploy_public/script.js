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
    btn.classList.add('theme-just-applied');
    window.setTimeout(() => btn.classList.remove('theme-just-applied'), 850);
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

if ('IntersectionObserver' in window) {
  const sectionObserver = new IntersectionObserver(entries => {
    const visible = entries
      .filter(entry => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (visible) setActiveSection(visible.target.id);
  }, { rootMargin: '-35% 0px -50% 0px', threshold: [0.15, 0.3, 0.55] });

  sectionTargets.forEach(section => sectionObserver.observe(section));
}

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
  document.body.appendChild(panel);
  return panel;
}

burger?.addEventListener('click', () => {
  const isOpen = navPanel.classList.toggle('open');
  burger.setAttribute('aria-expanded', isOpen);
});

// Close mobile nav on link click
navPanel.addEventListener('click', e => {
  if (e.target.classList.contains('nav-link')) {
    navPanel.classList.remove('open');
    burger?.setAttribute('aria-expanded', 'false');
  }
});

// Close on outside click
document.addEventListener('click', e => {
  if (!navBar?.contains(e.target) && !navPanel.contains(e.target)) {
    navPanel.classList.remove('open');
    burger?.setAttribute('aria-expanded', 'false');
  }
});

// Smooth scroll for all nav links
document.addEventListener('click', e => {
  const link = e.target.closest('a[href^="#"]');
  if (!link) return;
  const target = qs(link.getAttribute('href'));
  if (target) {
    e.preventDefault();
    const offset = 60;
    const top = target.getBoundingClientRect().top + window.scrollY - offset;
    setActiveSection(target.id);
    window.scrollTo({ top, behavior: 'smooth' });
  }
});

// ─── SCROLL REVEAL ───────────────────────────────────
let revealObserver = null;
if ('IntersectionObserver' in window) {
  revealObserver = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); revealObserver.unobserve(e.target); } });
  }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

  document.documentElement.classList.add('js-reveal');
  qsa('.reveal').forEach(el => revealObserver.observe(el));
} else {
  document.documentElement.classList.remove('js-reveal');
  qsa('.reveal').forEach(el => el.classList.add('in'));
}

// ─── PROJECT CARDS ───────────────────────────────────
const grid = qs('#cardsGrid');

function renderCards(filter) {
  const list = (window.PROJECTS || []).filter(p =>
    filter === 'all' || p.tags.includes(filter)
  );

  grid.innerHTML = list.map(p => `
    <article class="project-card" data-id="${p.id}" tabindex="0" role="button" aria-label="Open ${p.title}">
      <img class="card-img" src="${p.thumb}" alt="${p.title}" loading="lazy"
           onerror="this.src='assets/visuals/behance_preview_card.png'"/>
      <div class="card-body">
        <span class="card-cat">${p.cat}</span>
        <h3 class="card-title">${p.title}</h3>
        <p class="card-sub">${p.subtitle}</p>
        <div class="card-tools">${(p.tools || []).slice(0, 3).map(t => `<span>${t}</span>`).join('')}</div>
      </div>
      <span class="card-arrow" aria-hidden="true">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
      </span>
    </article>
  `).join('');

  // Observe new cards for reveal
  qsa('.project-card', grid).forEach(card => {
    card.classList.add('reveal');
    if (revealObserver) revealObserver.observe(card);
    else card.classList.add('in');
    card.addEventListener('click', () => openModal(card.dataset.id));
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(card.dataset.id); } });
  });
}

renderCards('all');

qsa('.chip').forEach(chip => {
  chip.addEventListener('click', () => {
    qsa('.chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    renderCards(chip.dataset.filter);
  });
});

// ─── MODAL ───────────────────────────────────────────
const modalOverlay = qs('#modalOverlay');
const modalBox     = qs('#modalBox');
const modalContent = qs('#modalContent');
const modalClose   = qs('#modalCloseBtn');

function openModal(id) {
  const p = (window.PROJECTS || []).find(x => x.id === id);
  if (!p) return;

  // Build report button
  let reportHTML = '';
  if (p.report) {
    reportHTML = `<a href="${p.report}" target="_blank" rel="noreferrer" class="btn btn-primary btn-sm">
      Open Full Report
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
    </a>`;
  }

  // Report note (for RDP / single-page reports)
  let noteHTML = '';
  if (p.reportNote) {
    noteHTML = `<div class="m-note"><strong>Note:</strong> ${p.reportNote}</div>`;
  }

  // Gallery (all visuals after the first)
  const galleryImgs = p.visuals.length > 1
    ? p.visuals.map((v, i) => `<img class="m-grid-img" src="${v}" alt="${p.title} visual ${i+1}" data-idx="${i}" loading="lazy" onerror="this.style.display='none'"/>`).join('')
    : '';

  modalContent.innerHTML = `
    <div class="m-hero">
      <span class="m-cat">${p.cat}</span>
      <h2 class="m-title">${p.title}</h2>
      <p class="m-subtitle">${p.subtitle}</p>
    </div>

    <div class="m-body">
      <div class="m-info">
        <p>${p.desc}</p>
        ${noteHTML}
        <div class="m-tools">${(p.tools || []).map(t => `<span class="m-tool">${t}</span>`).join('')}</div>
        <h5>Highlights</h5>
        <ul class="m-highlights">${(p.highlights || []).map(h => `<li>${h}</li>`).join('')}</ul>
      </div>
      <div class="m-visual">
        <img class="m-hero-img" src="${p.visuals[0]}" alt="${p.title}" loading="lazy" onerror="this.style.display='none'"/>
      </div>
    </div>

    ${reportHTML ? `<div class="m-actions">${reportHTML}</div>` : ''}

    ${p.visuals.length > 1 ? `
      <div class="m-gallery">
        <span class="m-gallery-label">All visuals — tap to expand</span>
        <div class="m-grid">${galleryImgs}</div>
      </div>
    ` : ''}
  `;

  // Bind gallery image clicks → lightbox
  qsa('.m-grid-img', modalContent).forEach(img => {
    img.addEventListener('click', () => {
      openLightbox(p.visuals, parseInt(img.dataset.idx));
    });
  });

  // Also clicking the hero image in modal opens lightbox
  const heroImg = qs('.m-hero-img', modalContent);
  if (heroImg) {
    heroImg.style.cursor = 'zoom-in';
    heroImg.addEventListener('click', () => openLightbox(p.visuals, 0));
  }

  modalOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
  modalContent.scrollTop = 0;

  // Focus trap
  setTimeout(() => modalClose?.focus(), 50);
}

function closeModal() {
  modalOverlay.classList.remove('open');
  document.body.style.overflow = '';
}

modalClose?.addEventListener('click', closeModal);
modalOverlay?.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (lb?.classList.contains('open')) closeLb();
    else if (modalOverlay?.classList.contains('open')) closeModal();
  }
});

// ─── GALLERY VIEWER ──────────────────────────────────
let galleryKey   = 'slides';
let galleryIndex = 0;

const viewerImg   = qs('#viewerImg');
const viewerCount = qs('#viewerCount');
const viewerStrip = qs('#viewerStrip');

function getGallery() { return (window.GALLERIES || {})[galleryKey] || []; }

function showGalleryImage(idx) {
  const arr = getGallery();
  if (!arr.length) return;
  galleryIndex = ((idx % arr.length) + arr.length) % arr.length;

  // Fade transition
  if (viewerImg) {
    viewerImg.style.opacity = '0';
    viewerImg.style.transform = 'translateY(6px) scale(.992)';
    setTimeout(() => {
      viewerImg.src = arr[galleryIndex];
      viewerImg.style.opacity = '1';
      viewerImg.style.transform = 'translateY(0) scale(1)';
    }, 120);
  }

  if (viewerCount) viewerCount.textContent = `${galleryIndex + 1} / ${arr.length}`;

  // Update strip — use class toggle instead of re-rendering
  if (viewerStrip) viewerStrip.innerHTML = '';
}

function buildStrip() {
  if (!viewerStrip) return;
  viewerStrip.innerHTML = '';
}

// Init
buildStrip();
showGalleryImage(0);

// Tab switching
qsa('.g-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    qsa('.g-tab').forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
    tab.classList.add('active');
    tab.setAttribute('aria-selected', 'true');
    galleryKey   = tab.dataset.gallery;
    galleryIndex = 0;
    buildStrip();
    showGalleryImage(0);
  });
});

qs('#viewPrev')?.addEventListener('click', () => showGalleryImage(galleryIndex - 1));
qs('#viewNext')?.addEventListener('click', () => showGalleryImage(galleryIndex + 1));

qs('#viewerStage')?.addEventListener('click', e => {
  if (e.target.closest('button')) return;
  openLightbox(getGallery(), galleryIndex);
});

// Viewer → lightbox on zoom click or double-tap
qs('#viewerZoom')?.addEventListener('click', () => openLightbox(getGallery(), galleryIndex));
viewerImg?.addEventListener('dblclick', () => openLightbox(getGallery(), galleryIndex));

// Swipe on viewer stage
let vTouchX = null;
const vStage = qs('#viewerStage');
vStage?.addEventListener('touchstart', e => { vTouchX = e.touches[0].clientX; }, { passive: true });
vStage?.addEventListener('touchend', e => {
  if (vTouchX === null) return;
  const dx = e.changedTouches[0].clientX - vTouchX;
  if (Math.abs(dx) > 40) showGalleryImage(galleryIndex + (dx < 0 ? 1 : -1));
  vTouchX = null;
}, { passive: true });

// ─── LIGHTBOX ────────────────────────────────────────
const lb        = qs('#lb');
const lbBackdrop = qs('#lbBackdrop');
const lbClose   = qs('#lbClose');
const lbPrev    = qs('#lbPrev');
const lbNext    = qs('#lbNext');
const lbImg     = qs('#lbImg');
const lbCounter = qs('#lbCounter');

let lbImages = [];
let lbIndex  = 0;

function openLightbox(images, start = 0) {
  lbImages = images.filter(Boolean);
  lbIndex  = Math.max(0, Math.min(start, lbImages.length - 1));
  setLbSlide();
  lb.classList.add('open');
  document.body.style.overflow = 'hidden';
  lbClose?.focus();
}

function closeLb() {
  lb.classList.remove('open');
  // Only restore overflow if modal is also closed
  if (!modalOverlay?.classList.contains('open')) {
    document.body.style.overflow = '';
  }
}

function setLbSlide() {
  if (!lbImg || !lbImages.length) return;
  lbImg.style.opacity = '0';
  const src = lbImages[lbIndex];
  const tmp = new Image();
  tmp.onload = () => { lbImg.src = src; lbImg.style.opacity = '1'; };
  tmp.onerror = () => { lbImg.src = src; lbImg.style.opacity = '1'; };
  tmp.src = src;
  if (lbCounter) lbCounter.textContent = `${lbIndex + 1} / ${lbImages.length}`;
  // Hide nav if only one image
  const showNav = lbImages.length > 1;
  if (lbPrev) lbPrev.style.display = showNav ? '' : 'none';
  if (lbNext) lbNext.style.display = showNav ? '' : 'none';
}

lbClose?.addEventListener('click', closeLb);
lbBackdrop?.addEventListener('click', closeLb);
lbPrev?.addEventListener('click', () => { lbIndex = (lbIndex - 1 + lbImages.length) % lbImages.length; setLbSlide(); });
lbNext?.addEventListener('click', () => { lbIndex = (lbIndex + 1) % lbImages.length; setLbSlide(); });

document.addEventListener('keydown', e => {
  if (!lb?.classList.contains('open')) return;
  if (e.key === 'ArrowLeft')  { lbIndex = (lbIndex - 1 + lbImages.length) % lbImages.length; setLbSlide(); }
  if (e.key === 'ArrowRight') { lbIndex = (lbIndex + 1) % lbImages.length; setLbSlide(); }
});

// Swipe on lightbox
let lbTouchX = null;
lb?.addEventListener('touchstart', e => { lbTouchX = e.touches[0].clientX; }, { passive: true });
lb?.addEventListener('touchend', e => {
  if (lbTouchX === null) return;
  const dx = e.changedTouches[0].clientX - lbTouchX;
  if (Math.abs(dx) > 45) {
    lbIndex = dx < 0
      ? (lbIndex + 1) % lbImages.length
      : (lbIndex - 1 + lbImages.length) % lbImages.length;
    setLbSlide();
  }
  lbTouchX = null;
}, { passive: true });


/* AI workflow note */
window.CV_AI_WORKFLOW = {
  title: "AI-Assisted Workflow Systems",
  skills: [
    "Prompt engineering",
    "AI-assisted research",
    "AI-supported debugging",
    "AI-assisted design ideation",
    "Technical writing refinement",
    "Geospatial documentation support"
  ]
};
