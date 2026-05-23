// ============================================================
// VOYAGER — Main JavaScript
// Handles: page rendering, vinyl animations, masonry, lightbox
// ============================================================

(function () {
  'use strict';

  // --- Utility: Get URL parameter ---
  function getParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  // --- Utility: Detect current page ---
  function isAlbumPage() {
    return window.location.pathname.includes('album.html');
  }

  // --- Placeholder image generator (for demo without real photos) ---
  function createPlaceholder(text, ratio) {
    const colors = [
      ['#1A1A2E', '#16213E'],
      ['#16213E', '#0F3460'],
      ['#0F3460', '#1A1A2E'],
      ['#1A1A2E', '#0D0D1A'],
    ];
    const pair = colors[Math.floor(Math.random() * colors.length)];
    const ratioStr = ratio || '1/1';
    return `<div class="placeholder-img" style="--ratio: ${ratioStr}; background: linear-gradient(${Math.random() * 360}deg, ${pair[0]}, ${pair[1]})">${text}</div>`;
  }

  // --- Generate random aspect ratios for masonry variety ---
  function getRandomRatio() {
    const ratios = ['3/4', '4/3', '1/1', '3/2', '2/3', '16/9', '4/5'];
    return ratios[Math.floor(Math.random() * ratios.length)];
  }

  // ============================================================
  // INDEX PAGE — Vinyl Wall
  // ============================================================
  function renderHomePage() {
    const grid = document.getElementById('albumGrid');
    if (!grid) return;

    // Update site title and tagline from config
    const titleEl = document.getElementById('siteTitle');
    const taglineEl = document.getElementById('siteTagline');
    if (titleEl && SITE_CONFIG) titleEl.textContent = SITE_CONFIG.title;
    if (taglineEl && SITE_CONFIG) taglineEl.textContent = SITE_CONFIG.tagline;

    // Update footer
    const footerText = document.getElementById('footerText');
    if (footerText && SITE_CONFIG) {
      footerText.innerHTML = `&copy; ${new Date().getFullYear()} ${SITE_CONFIG.title}`;
    }

    // Render social links
    const footerSocial = document.getElementById('footerSocial');
    if (footerSocial && SITE_CONFIG && SITE_CONFIG.social) {
      let socialHTML = '';
      for (const [key, value] of Object.entries(SITE_CONFIG.social)) {
        if (value) {
          if (key === 'email') {
            socialHTML += `<a href="mailto:${value}">${key}</a>`;
          } else {
            socialHTML += `<a href="${value}" target="_blank" rel="noopener">${key}</a>`;
          }
        }
      }
      footerSocial.innerHTML = socialHTML;
    }

    // Render album cards
    ALBUMS.forEach((album, index) => {
      const card = document.createElement('div');
      card.className = 'vinyl-card';
      card.style.animationDelay = `${index * 0.08}s`;

      card.innerHTML = `
        <div class="vinyl-card__sleeve">
          ${album.cover ? `<img class="vinyl-card__cover" src="${album.cover}" alt="${album.title}">` : createPlaceholder(album.title, '1/1')}
        </div>
        <div class="vinyl-card__info">
          <h2 class="vinyl-card__title">${album.title}</h2>
          <div class="vinyl-card__meta">
            <span class="vinyl-card__location">${album.date} &middot; ${album.location.split('/')[0].trim()}</span>
            <span class="vinyl-card__count">${album.photoCount} pics</span>
          </div>
        </div>
      `;

      card.addEventListener('click', () => {
        window.location.href = `album.html?id=${album.id}`;
      });

      grid.appendChild(card);
    });
  }

  // ============================================================
  // ALBUM PAGE — Masonry + Lightbox
  // ============================================================
  function renderAlbumPage() {
    const albumId = getParam('id');
    if (!albumId) {
      window.location.href = 'index.html';
      return;
    }

    const album = ALBUMS.find(a => a.id === albumId);
    if (!album) {
      window.location.href = 'index.html';
      return;
    }

    // Update page title
    document.title = `${album.title} — VOYAGER`;

    // Update header
    const titleEl = document.getElementById('albumTitle');
    const subtitleEl = document.getElementById('albumSubtitle');
    const dateEl = document.getElementById('albumDate');
    const locationEl = document.getElementById('albumLocation');

    if (titleEl) titleEl.textContent = album.title;
    if (subtitleEl) subtitleEl.textContent = album.subtitle;
    if (dateEl) dateEl.textContent = album.date;
    if (locationEl) locationEl.textContent = album.location;

    // Render masonry grid
    const grid = document.getElementById('masonryGrid');
    if (!grid) return;

    album.photos.forEach((photo, index) => {
      const item = document.createElement('div');
      item.className = 'masonry-item';
      item.style.animationDelay = `${index * 0.06}s`;
      item.dataset.index = index;

      const ratio = getRandomRatio();

      item.innerHTML = `
        ${photo.src ? `<img src="${photo.src}" alt="${photo.caption || ''}" loading="lazy">` : createPlaceholder(photo.caption || `Photo ${index + 1}`, ratio)}
        ${photo.caption ? `<div class="masonry-item__caption">${photo.caption}</div>` : ''}
      `;

      item.addEventListener('click', () => openLightbox(index));
      grid.appendChild(item);
    });

    // Setup lightbox
    setupLightbox(album.photos);
  }

  // ============================================================
  // LIGHTBOX
  // ============================================================
  let currentLightboxIndex = 0;
  let lightboxPhotos = [];

  function setupLightbox(photos) {
    lightboxPhotos = photos;

    const lightbox = document.getElementById('lightbox');
    const closeBtn = document.getElementById('lightboxClose');
    const prevBtn = document.getElementById('lightboxPrev');
    const nextBtn = document.getElementById('lightboxNext');

    if (!lightbox) return;

    closeBtn.addEventListener('click', closeLightbox);
    prevBtn.addEventListener('click', () => navigateLightbox(-1));
    nextBtn.addEventListener('click', () => navigateLightbox(1));

    // Close on background click
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (!lightbox.classList.contains('active')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') navigateLightbox(-1);
      if (e.key === 'ArrowRight') navigateLightbox(1);
    });
  }

  function openLightbox(index) {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox) return;

    currentLightboxIndex = index;
    updateLightboxContent();
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox) return;

    lightbox.classList.remove('active');
    document.body.style.overflow = '';
  }

  function navigateLightbox(direction) {
    currentLightboxIndex += direction;
    if (currentLightboxIndex < 0) currentLightboxIndex = lightboxPhotos.length - 1;
    if (currentLightboxIndex >= lightboxPhotos.length) currentLightboxIndex = 0;
    updateLightboxContent();
  }

  function updateLightboxContent() {
    const photo = lightboxPhotos[currentLightboxIndex];
    const img = document.getElementById('lightboxImg');
    const caption = document.getElementById('lightboxCaption');
    const counter = document.getElementById('lightboxCounter');

    if (img) {
      if (photo.src) {
        img.src = photo.src;
        img.style.display = 'block';
      } else {
        // For demo: show placeholder text
        img.src = '';
        img.style.display = 'none';
      }
    }
    if (caption) caption.textContent = photo.caption || '';
    if (counter) counter.textContent = `${currentLightboxIndex + 1} / ${lightboxPhotos.length}`;
  }

  // ============================================================
  // IMAGE PROTECTION
  // ============================================================
  function setupImageProtection() {
    // Disable right-click on images
    document.addEventListener('contextmenu', function (e) {
      if (e.target.tagName === 'IMG') {
        e.preventDefault();
      }
    });

    // Disable drag on images
    document.addEventListener('dragstart', function (e) {
      if (e.target.tagName === 'IMG') {
        e.preventDefault();
      }
    });

    // Disable long-press save on mobile
    document.addEventListener('touchstart', function (e) {
      if (e.target.tagName === 'IMG') {
        e.target.style.pointerEvents = 'none';
        setTimeout(() => { e.target.style.pointerEvents = 'auto'; }, 300);
      }
    });
  }

  // ============================================================
  // INIT
  // ============================================================
  function init() {
    setupImageProtection();
    if (isAlbumPage()) {
      renderAlbumPage();
    } else {
      renderHomePage();
    }
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
