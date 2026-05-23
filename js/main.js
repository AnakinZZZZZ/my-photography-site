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
  // TRAVEL MAP
  // ============================================================

  function coordToSVG(lat, lng, width, height) {
    const x = (lng + 180) / 360 * width;
    const y = (90 - lat) / 180 * height;
    return { x, y };
  }

  function renderTravelMap() {
    const svg = document.getElementById('travelMapSVG');
    if (!svg) return;

    const width = 1000;
    const height = 500;

    // Grid lines removed for cleaner look

    // Try to load accurate map from CDN GeoJSON, fallback to local paths
    loadGeoJSONMap(svg, width, height).then(() => {
      addMapMarkers(svg, width, height);
    }).catch(() => {
      // Fallback: use local worldmap.js paths
      if (typeof WORLD_MAP_PATHS !== 'undefined' && WORLD_MAP_PATHS.length > 0) {
        WORLD_MAP_PATHS.forEach(pathData => {
          const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          path.setAttribute('d', pathData);
          path.setAttribute('class', 'travel-map__land');
          svg.appendChild(path);
        });
      }
      addMapMarkers(svg, width, height);
    });
  }

  function loadGeoJSONMap(svg, width, height) {
    const GEOJSON_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/land-10m.json';

    return fetch(GEOJSON_URL)
      .then(res => res.json())
      .then(topology => {
        // Convert TopoJSON to GeoJSON arcs then to SVG paths
        const land = topology.objects.land;
        const arcs = topology.arcs;
        const transform = topology.transform;

        function decodeArc(arcIndex) {
          const reverse = arcIndex < 0;
          const index = reverse ? ~arcIndex : arcIndex;
          const arc = arcs[index];
          const coords = [];
          let x = 0, y = 0;
          for (let i = 0; i < arc.length; i++) {
            x += arc[i][0];
            y += arc[i][1];
            const lng = x * transform.scale[0] + transform.translate[0];
            const lat = y * transform.scale[1] + transform.translate[1];
            coords.push([lng, lat]);
          }
          if (reverse) coords.reverse();
          return coords;
        }

        function arcsToCoords(arcRefs) {
          const coords = [];
          arcRefs.forEach(arcIndex => {
            const decoded = decodeArc(arcIndex);
            // Skip first point of subsequent arcs to avoid duplicates
            const start = coords.length > 0 ? 1 : 0;
            for (let i = start; i < decoded.length; i++) {
              coords.push(decoded[i]);
            }
          });
          return coords;
        }

        function coordsToSVGPaths(ring) {
          // Split ring at antimeridian crossings to avoid horizontal lines
          const segments = [];
          let current = [];

          for (let i = 0; i < ring.length; i++) {
            const lng = ring[i][0];
            const lat = ring[i][1];

            // Check if this point crosses the antimeridian from previous point
            if (i > 0) {
              const prevLng = ring[i - 1][0];
              if (Math.abs(lng - prevLng) > 180) {
                // Antimeridian crossing detected - split here
                if (current.length >= 3) {
                  segments.push(current);
                }
                current = [];
              }
            }

            const sx = ((lng + 180) / 360 * width).toFixed(2);
            const sy = ((90 - lat) / 180 * height).toFixed(2);
            current.push(`${sx},${sy}`);
          }

          if (current.length >= 3) {
            segments.push(current);
          }

          // Return array of SVG path strings
          return segments.map(pts => 'M ' + pts.join(' L ') + ' Z');
        }

        function addPath(d) {
          const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          path.setAttribute('d', d);
          path.setAttribute('class', 'travel-map__land');
          svg.appendChild(path);
        }

        function renderGeometry(geom) {
          if (geom.type === 'Polygon') {
            geom.arcs.forEach(ring => {
              const coords = arcsToCoords(ring);
              const paths = coordsToSVGPaths(coords);
              paths.forEach(addPath);
            });
          } else if (geom.type === 'MultiPolygon') {
            geom.arcs.forEach(polygon => {
              polygon.forEach(ring => {
                const coords = arcsToCoords(ring);
                const paths = coordsToSVGPaths(coords);
                paths.forEach(addPath);
              });
            });
          } else if (geom.type === 'GeometryCollection') {
            geom.geometries.forEach(g => renderGeometry(g));
          }
        }

        renderGeometry(land);
      });
  }

  function addGridLines(svg, width, height) {
    for (let i = 1; i < 5; i++) {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', '0');
      line.setAttribute('y1', String(i * (height / 5)));
      line.setAttribute('x2', String(width));
      line.setAttribute('y2', String(i * (height / 5)));
      line.setAttribute('stroke', 'rgba(212, 165, 116, 0.05)');
      line.setAttribute('stroke-width', '0.5');
      svg.appendChild(line);
    }
    for (let i = 1; i < 10; i++) {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', String(i * (width / 10)));
      line.setAttribute('y1', '0');
      line.setAttribute('x2', String(i * (width / 10)));
      line.setAttribute('y2', String(height));
      line.setAttribute('stroke', 'rgba(212, 165, 116, 0.05)');
      line.setAttribute('stroke-width', '0.5');
      svg.appendChild(line);
    }
  }

  function addMapMarkers(svg, width, height) {

    // Draw markers for each album with coords
    const tooltip = document.getElementById('mapTooltip');
    const tooltipImg = document.getElementById('tooltipImg');
    const tooltipTitle = document.getElementById('tooltipTitle');
    const tooltipDate = document.getElementById('tooltipDate');
    const container = document.querySelector('.travel-map__container');

    ALBUMS.forEach((album, index) => {
      if (!album.coords) return;

      const pos = coordToSVG(album.coords.lat, album.coords.lng, width, height);

      const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      group.setAttribute('class', 'travel-map__marker');
      group.style.animationDelay = `${index * 0.3}s`;

      // Pulse ring
      const pulse = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      pulse.setAttribute('cx', String(pos.x));
      pulse.setAttribute('cy', String(pos.y));
      pulse.setAttribute('r', '5');
      pulse.setAttribute('class', 'travel-map__marker-pulse');
      pulse.style.animationDelay = `${index * 0.8}s`;

      // Center dot
      const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      dot.setAttribute('cx', String(pos.x));
      dot.setAttribute('cy', String(pos.y));
      dot.setAttribute('r', '5');
      dot.setAttribute('class', 'travel-map__marker-dot');

      group.appendChild(pulse);
      group.appendChild(dot);
      svg.appendChild(group);

      // Hover: show tooltip
      group.addEventListener('mouseenter', (e) => {
        tooltipImg.innerHTML = album.cover
          ? `<img src="${album.cover}" alt="${album.title}">`
          : '';
        tooltipTitle.textContent = album.title;
        tooltipDate.textContent = `${album.date} · ${album.location}`;

        // Position tooltip near marker
        const rect = container.getBoundingClientRect();
        const svgRect = svg.getBoundingClientRect();
        const markerX = (pos.x / width) * svgRect.width;
        const markerY = (pos.y / height) * svgRect.height;

        let tooltipLeft = markerX + 15;
        let tooltipTop = markerY - 35;

        // Keep tooltip inside container
        if (tooltipLeft + 200 > rect.width) {
          tooltipLeft = markerX - 200;
        }
        if (tooltipTop < 0) {
          tooltipTop = markerY + 15;
        }

        tooltip.style.left = tooltipLeft + 'px';
        tooltip.style.top = tooltipTop + 'px';
        tooltip.classList.add('active');
      });

      group.addEventListener('mouseleave', () => {
        tooltip.classList.remove('active');
      });

      // Click: navigate to album
      group.addEventListener('click', () => {
        window.location.href = `album.html?id=${album.id}`;
      });

      // Mobile: tap to show, tap again to navigate
      let tapCount = 0;
      group.addEventListener('touchend', (e) => {
        e.preventDefault();
        tapCount++;
        if (tapCount === 1) {
          tooltipImg.innerHTML = album.cover
            ? `<img src="${album.cover}" alt="${album.title}">`
            : '';
          tooltipTitle.textContent = album.title;
          tooltipDate.textContent = `${album.date} · ${album.location}`;
          const rect = container.getBoundingClientRect();
          const svgRect = svg.getBoundingClientRect();
          const markerX = (pos.x / width) * svgRect.width;
          const markerY = (pos.y / height) * svgRect.height;
          tooltip.style.left = (markerX + 15) + 'px';
          tooltip.style.top = (markerY - 35) + 'px';
          tooltip.classList.add('active');
          setTimeout(() => { tapCount = 0; }, 2000);
        } else if (tapCount >= 2) {
          window.location.href = `album.html?id=${album.id}`;
        }
      });
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
      renderTravelMap();
    }
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
