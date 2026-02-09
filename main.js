/* ==============================================
   CINEMATIC SCROLL ENGINE
   Pure vanilla JS — no dependencies
   ============================================== */

;(function () {
  'use strict';

  /* ------------------------------------------
     CONFIG — Easy to tweak per client
     ------------------------------------------ */
  const CONFIG = {
    images: [
      'images/scene-01.jpg',
      'images/scene-02.jpg',
      'images/scene-03.jpg',
    ],
    // Ken Burns: zoom range and pan amplitude (ratio of image size)
    zoomStart:  1.05,
    zoomEnd:    1.18,
    panAmount:  0.03,   // max pan as fraction of dimension
    // Placeholder colors when images are missing
    placeholderColors: ['#1a1410', '#0f1a14', '#14101a'],
  };

  /* ------------------------------------------
     DOM REFS
     ------------------------------------------ */
  const scene    = document.getElementById('scene');
  const canvas   = document.getElementById('c');
  const fallback = document.getElementById('fallback-bg');
  const ctx      = canvas ? canvas.getContext('2d') : null;

  /* ------------------------------------------
     STATE
     ------------------------------------------ */
  const images       = [];       // Loaded Image objects (or null for failed loads)
  let   placeholders = [];       // Canvas-generated placeholder bitmaps
  let   canvasW = 0;
  let   canvasH = 0;
  let   dpr     = 1;
  let   progress = 0;
  let   ticking  = false;
  let   reducedMotion = false;

  /* ------------------------------------------
     PREFERS REDUCED MOTION
     ------------------------------------------ */
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  reducedMotion = motionQuery.matches;
  motionQuery.addEventListener('change', function (e) {
    reducedMotion = e.matches;
    if (reducedMotion) showStaticFallback();
    else hideStaticFallback();
  });

  /* ------------------------------------------
     IMAGE PRELOADING
     ------------------------------------------ */

  /**
   * Load a single image, resolve with Image or null on error.
   */
  function loadImage(src) {
    return new Promise(function (resolve) {
      const img = new Image();
      img.onload  = function () { resolve(img); };
      img.onerror = function () {
        console.warn(
          '%c[cinematic-scroll]%c Image introuvable: ' + src +
          '\n  → Placez vos images dans le dossier images/' +
          '\n  → Noms attendus: scene-01.jpg, scene-02.jpg, scene-03.jpg',
          'color:#c9a96e;font-weight:bold', 'color:inherit'
        );
        resolve(null);
      };
      img.src = src;
    });
  }

  /**
   * Generate an off-screen placeholder canvas with gradient + text.
   */
  function createPlaceholder(color, index) {
    var w = 1920, h = 1080;
    var offscreen = document.createElement('canvas');
    offscreen.width  = w;
    offscreen.height = h;
    var c = offscreen.getContext('2d');

    // Dark gradient
    var grad = c.createRadialGradient(w / 2, h / 2, 100, w / 2, h / 2, w * 0.7);
    grad.addColorStop(0, color);
    grad.addColorStop(1, '#000');
    c.fillStyle = grad;
    c.fillRect(0, 0, w, h);

    // Subtle accent line
    c.strokeStyle = 'rgba(201,169,110,0.3)';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(w * 0.3, h * 0.55);
    c.lineTo(w * 0.7, h * 0.55);
    c.stroke();

    // Label text
    c.fillStyle = 'rgba(201,169,110,0.6)';
    c.font = '600 24px system-ui, sans-serif';
    c.textAlign = 'center';
    c.fillText('scene-0' + (index + 1) + '.jpg', w / 2, h * 0.5);
    c.font = '16px system-ui, sans-serif';
    c.fillStyle = 'rgba(255,255,255,0.3)';
    c.fillText('Placez votre image ici (1920×1080 recommandé)', w / 2, h * 0.6);

    return offscreen;
  }

  /**
   * Load all images, generate placeholders for missing ones.
   */
  function preloadAll() {
    var promises = CONFIG.images.map(loadImage);
    return Promise.all(promises).then(function (results) {
      results.forEach(function (img, i) {
        images[i] = img;
        if (!img) {
          placeholders[i] = createPlaceholder(CONFIG.placeholderColors[i], i);
        }
      });
    });
  }

  /* ------------------------------------------
     CANVAS RESIZE
     ------------------------------------------ */
  function resizeCanvas() {
    if (!canvas || !ctx) return;
    dpr = window.devicePixelRatio || 1;
    canvasW = window.innerWidth;
    canvasH = window.innerHeight;
    canvas.width  = canvasW * dpr;
    canvas.height = canvasH * dpr;
    canvas.style.width  = canvasW + 'px';
    canvas.style.height = canvasH + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /* ------------------------------------------
     SCROLL PROGRESS  (0 → 1)
     ------------------------------------------ */
  function getProgress() {
    if (!scene) return 0;
    var rect = scene.getBoundingClientRect();
    var sceneH = scene.offsetHeight - window.innerHeight;
    if (sceneH <= 0) return 0;
    var scrolled = -rect.top;
    return Math.max(0, Math.min(1, scrolled / sceneH));
  }

  /* ------------------------------------------
     EASING — smooth in-out cubic
     ------------------------------------------ */
  function easeInOut(t) {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  /* ------------------------------------------
     DRAW COVER — Mimics background-size: cover
     Draws `source` on canvas with zoom & pan.
     ------------------------------------------ */
  function drawCover(source, zoom, panX, panY, alpha) {
    if (!source || !ctx) return;

    var sw = source.width  || source.naturalWidth  || 1920;
    var sh = source.height || source.naturalHeight || 1080;
    var cw = canvasW;
    var ch = canvasH;

    // Compute "cover" scale
    var scale = Math.max(cw / sw, ch / sh) * zoom;
    var dw = sw * scale;
    var dh = sh * scale;

    // Center + pan offset
    var dx = (cw - dw) / 2 + panX * dw;
    var dy = (ch - dh) / 2 + panY * dh;

    ctx.globalAlpha = alpha;
    ctx.drawImage(source, 0, 0, sw, sh, dx, dy, dw, dh);
  }

  /* ------------------------------------------
     GET DRAWABLE SOURCE — image or placeholder
     ------------------------------------------ */
  function getSource(index) {
    return images[index] || placeholders[index] || null;
  }

  /* ------------------------------------------
     RENDER FRAME
     ------------------------------------------ */
  function render() {
    if (!ctx) return;
    if (reducedMotion) return;

    // Clear
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvasW, canvasH);

    var p = progress;

    /*
      Timeline mapping:
        Segment 1  [0.0 .. 0.5]  → image 0 crossfade → image 1
        Segment 2  [0.5 .. 1.0]  → image 1 crossfade → image 2

      Each segment:
        localT 0→1 within the segment
        Ken Burns: zoom ramps up, pan shifts
        Crossfade: previous image fades out, next fades in
    */

    var segCount  = 2;
    var segIndex  = Math.min(Math.floor(p * segCount), segCount - 1);
    var segStart  = segIndex / segCount;
    var localT    = Math.min((p - segStart) * segCount, 1);
    var easedT    = easeInOut(localT);

    var imgA = segIndex;       // outgoing image index
    var imgB = segIndex + 1;   // incoming image index

    var srcA = getSource(imgA);
    var srcB = getSource(imgB);

    // Ken Burns parameters — interpolate across the segment
    var zoomA = CONFIG.zoomStart + (CONFIG.zoomEnd - CONFIG.zoomStart) * easedT;
    var zoomB = CONFIG.zoomStart + (CONFIG.zoomEnd - CONFIG.zoomStart) * easedT * 0.5;

    // Pan direction alternates per image
    var panDirA = (imgA % 2 === 0) ? 1 : -1;
    var panDirB = (imgB % 2 === 0) ? 1 : -1;
    var panXA = CONFIG.panAmount * easedT * panDirA;
    var panYA = CONFIG.panAmount * easedT * 0.5 * -panDirA;
    var panXB = CONFIG.panAmount * easedT * 0.3 * panDirB;
    var panYB = CONFIG.panAmount * easedT * 0.2 * -panDirB;

    // Alpha crossfade
    var alphaA = 1 - easedT;
    var alphaB = easedT;

    // Draw outgoing image
    if (srcA) {
      drawCover(srcA, zoomA, panXA, panYA, alphaA);
    }

    // Draw incoming image
    if (srcB) {
      drawCover(srcB, zoomB, panXB, panYB, alphaB);
    }

    // Vignette overlay for cinematic feel
    drawVignette();
  }

  /* ------------------------------------------
     VIGNETTE — Subtle dark edges
     ------------------------------------------ */
  function drawVignette() {
    var cx = canvasW / 2;
    var cy = canvasH / 2;
    var radius = Math.max(canvasW, canvasH) * 0.75;
    var grad = ctx.createRadialGradient(cx, cy, radius * 0.3, cx, cy, radius);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.globalAlpha = 1;
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvasW, canvasH);
  }

  /* ------------------------------------------
     STATIC FALLBACK (reduced motion)
     ------------------------------------------ */
  function showStaticFallback() {
    if (!fallback) return;
    var src = images[0]
      ? CONFIG.images[0]
      : null;

    if (src) {
      fallback.style.backgroundImage = 'url(' + src + ')';
    } else {
      fallback.style.background = CONFIG.placeholderColors[0];
    }

    fallback.classList.add('fallback-bg--active');
    if (canvas) canvas.style.display = 'none';
  }

  function hideStaticFallback() {
    if (!fallback) return;
    fallback.classList.remove('fallback-bg--active');
    if (canvas) canvas.style.display = 'block';
    resizeCanvas();
    render();
  }

  /* ------------------------------------------
     SCROLL + RESIZE HANDLERS (optimised)
     ------------------------------------------ */
  function onScroll() {
    progress = getProgress();
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(function () {
        render();
        ticking = false;
      });
    }
  }

  var resizeTimer;
  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      resizeCanvas();
      progress = getProgress();
      render();
    }, 100);
  }

  /* ------------------------------------------
     CANVAS FALLBACK (no canvas support)
     ------------------------------------------ */
  function checkCanvasSupport() {
    if (!canvas || !ctx) {
      console.warn('[cinematic-scroll] Canvas non supporté — fallback image statique.');
      showStaticFallback();
      return false;
    }
    return true;
  }

  /* ------------------------------------------
     INIT
     ------------------------------------------ */
  function init() {
    // Check canvas support
    if (!checkCanvasSupport()) return;

    // Check reduced motion
    if (reducedMotion) {
      preloadAll().then(function () {
        showStaticFallback();
      });
      return;
    }

    // Normal init
    resizeCanvas();

    preloadAll().then(function () {
      // Initial render
      progress = getProgress();
      render();

      // Bind events
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onResize);

      console.log(
        '%c[cinematic-scroll]%c Prêt — ' + images.filter(Boolean).length + '/3 images chargées.',
        'color:#c9a96e;font-weight:bold', 'color:inherit'
      );
    });
  }

  /* ------------------------------------------
     LAUNCH
     ------------------------------------------ */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
