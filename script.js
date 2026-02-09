/* ==============================================
   CINEMATIC SCROLL ENGINE
   GSAP + ScrollTrigger · 4-phase pinned hero
   BG1 → BG2 match-cut → BG3 + Logo reveal
   ============================================== */

;(function () {
  'use strict';

  /* ================================================
     CONFIG — Swap these to rebrand for any client
     ================================================ */
  var CONFIG = {
    /* Asset paths */
    bg1Url:     'images/bg1.png',
    bg2Url:     'images/bg2.png',
    bg3Url:     'images/bg3.png',
    logoUrl:    'images/logo.png',
    fgLeftUrl:  'images/fg-left.png',   // placeholder — replace per client
    fgRightUrl: 'images/fg-right.png',  // placeholder — replace per client

    /* Scroll */
    scrollLength: 3200,       // total pin distance (px)
    scrubSmoothing: 1.2,      // seconds of inertial lag

    /* Split (subjects separate) */
    splitDistanceDesktop: 300, // px at ≥1024
    splitDistanceMobile:  140, // px at ≤768

    /* Zoom strengths (scale values) */
    bg1ZoomA: 1.08,           // end of Phase A
    bg1ZoomB: 1.16,           // end of Phase B
    bg2Start: 1.20,           // BG2 initial scale (over-zoom)
    bg2End:   1.00,           // BG2 settle scale
    bg3Start: 1.15,           // BG3 initial scale (over-zoom)
    bg3End:   1.00,           // BG3 settle scale

    /* Foreground initial overlap (xPercent from left:50%) */
    fgLeftXPercent:  -78,
    fgRightXPercent: -22
  };

  /* ================================================
     DOM
     ================================================ */
  var loader  = document.getElementById('loader');
  var fill    = document.getElementById('loaderFill');
  var bg1     = document.getElementById('bg1');
  var bg2     = document.getElementById('bg2');
  var bg3     = document.getElementById('bg3');
  var fgLeft  = document.getElementById('fgLeft');
  var fgRight = document.getElementById('fgRight');
  var text1   = document.getElementById('text1');
  var text2   = document.getElementById('text2');
  var logo    = document.getElementById('logo');
  var tagline = document.getElementById('tagline');
  var cta     = document.getElementById('cta');
  var grain   = document.getElementById('grain');
  var hint    = document.getElementById('hint');

  /* ================================================
     1. PRELOADER
     ================================================ */
  function preload(urls) {
    var n = 0;
    return Promise.all(urls.map(function (u) {
      return new Promise(function (res) {
        var img = new Image();
        img.onload = img.onerror = function () {
          n++;
          if (fill) fill.style.width = ((n / urls.length) * 100) + '%';
          res();
        };
        img.src = u;
      });
    }));
  }

  /* ================================================
     2. FILM GRAIN (canvas tile 256px)
     ================================================ */
  function makeGrain() {
    if (!grain) return;
    var s = 256, c = document.createElement('canvas');
    c.width = s; c.height = s;
    var x = c.getContext('2d'), d = x.createImageData(s, s);
    for (var i = 0; i < d.data.length; i += 4) {
      var v = Math.random() * 255;
      d.data[i] = v; d.data[i+1] = v; d.data[i+2] = v; d.data[i+3] = 28;
    }
    x.putImageData(d, 0, 0);
    grain.style.backgroundImage = 'url(' + c.toDataURL() + ')';
  }

  /* ================================================
     3. RESPONSIVE SPLIT
     ================================================ */
  function getSplit() {
    var vw = window.innerWidth;
    if (vw <= 480)  return CONFIG.splitDistanceMobile * 0.65;
    if (vw <= 768)  return CONFIG.splitDistanceMobile;
    if (vw <= 1024) return CONFIG.splitDistanceDesktop * 0.82;
    return Math.min(CONFIG.splitDistanceDesktop, vw * 0.18);
  }

  /* ================================================
     4. ANIMATION — 4 cinematic phases
     ================================================ */
  function initAnimation() {
    gsap.registerPlugin(ScrollTrigger);

    /* Reduced motion → static fallback */
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.set([bg1, bg2], { opacity: 0 });
      gsap.set(bg3, { opacity: 1, scale: 1 });
      gsap.set([fgLeft, fgRight], { opacity: 0 });
      gsap.set([text1, text2], { opacity: 0 });
      gsap.set(logo, { opacity: 1, y: 0, filter: 'blur(0px)' });
      gsap.set(tagline, { opacity: 1, y: 0 });
      gsap.set(cta, { opacity: 1, y: 0 });
      return;
    }

    /* ---- Initial states (prevent FOUC) ---- */
    gsap.set(bg1, { scale: 1, y: 0, transformOrigin: 'center center' });
    gsap.set(bg2, { opacity: 0, scale: CONFIG.bg2Start, transformOrigin: 'center center' });
    gsap.set(bg3, { opacity: 0, scale: CONFIG.bg3Start, transformOrigin: 'center center' });

    gsap.set(text1, { opacity: 0, filter: 'blur(4px)' });
    gsap.set(text2, { opacity: 0, y: 10, filter: 'blur(6px)' });

    gsap.set(logo, { opacity: 0, y: 12, filter: 'blur(8px)' });
    gsap.set(tagline, { opacity: 0, y: 12 });
    gsap.set(cta, { opacity: 0, y: 12 });

    gsap.set(fgLeft, {
      xPercent: CONFIG.fgLeftXPercent,
      x: 0, y: 0, scale: 1, opacity: 1,
      filter: 'blur(0px)',
      transformOrigin: 'center bottom'
    });
    gsap.set(fgRight, {
      xPercent: CONFIG.fgRightXPercent,
      x: 0, y: 0, scale: 1, opacity: 1,
      filter: 'blur(0px)',
      transformOrigin: 'center bottom'
    });

    /* ---- Master timeline ---- */
    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: '.hero-scroll',
        start: 'top top',
        end: '+=' + CONFIG.scrollLength,
        pin: true,
        scrub: CONFIG.scrubSmoothing,
        anticipatePin: 1,
        invalidateOnRefresh: true
      }
    });

    /* ==========================================
       PHASE A · 0 → 30%
       Subjects separate · Camera push begins
       ========================================== */

    tl.to(fgLeft, {
      x: function () { return -getSplit(); },
      ease: 'power4.out',
      duration: 0.30
    }, 0);

    tl.to(fgRight, {
      x: function () { return getSplit(); },
      ease: 'power4.out',
      duration: 0.30
    }, 0);

    tl.to(bg1, {
      scale: CONFIG.bg1ZoomA,
      y: -25,
      ease: 'power2.out',
      duration: 0.30
    }, 0);

    // Hint fades immediately
    tl.to(hint, { opacity: 0, ease: 'none', duration: 0.05 }, 0);

    /* -- TEXT 1 · "A Mediterranean Experience" -- */
    tl.to(text1, {
      opacity: 0.65,
      filter: 'blur(0px)',
      ease: 'power3.out',
      duration: 0.10
    }, 0.05);

    tl.to(text1, {
      opacity: 0,
      ease: 'power1.in',
      duration: 0.08
    }, 0.20);

    /* ==========================================
       PHASE B · 30% → 50%
       Subjects sink into depth · Camera continues
       ========================================== */

    tl.to(fgLeft, {
      scale: 0.72,
      y: 60,
      opacity: 0,
      filter: 'blur(6px)',
      ease: 'power2.inOut',
      duration: 0.20
    }, 0.30);

    tl.to(fgRight, {
      scale: 0.72,
      y: 60,
      opacity: 0,
      filter: 'blur(6px)',
      ease: 'power2.inOut',
      duration: 0.20
    }, 0.30);

    tl.to(bg1, {
      scale: CONFIG.bg1ZoomB,
      ease: 'none',
      duration: 0.20
    }, 0.30);

    /* -- TEXT 2 · "Step into the moment" -- */
    tl.to(text2, {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      ease: 'power3.out',
      duration: 0.10
    }, 0.35);

    tl.to(text2, {
      opacity: 0,
      ease: 'power1.in',
      duration: 0.12
    }, 0.58);

    /* ==========================================
       PHASE C · 50% → 72%
       Match-cut: BG2 settles in from over-zoom
       ========================================== */

    tl.to(bg2, {
      opacity: 1,
      scale: CONFIG.bg2End,
      ease: 'power2.inOut',
      duration: 0.22
    }, 0.50);

    tl.to(bg1, {
      opacity: 0,
      ease: 'power1.in',
      duration: 0.18
    }, 0.53);

    /* ==========================================
       PHASE D · 72% → 100%
       BG3 reveal + Logo / Signature / CTA cascade
       ========================================== */

    tl.to(bg3, {
      opacity: 1,
      scale: CONFIG.bg3End,
      ease: 'power2.inOut',
      duration: 0.28
    }, 0.72);

    tl.to(bg2, {
      opacity: 0,
      ease: 'power1.in',
      duration: 0.20
    }, 0.76);

    /* -- TEXT 3 · Logo → Signature → CTA -- */
    tl.to(logo, {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      ease: 'power3.out',
      duration: 0.14
    }, 0.80);

    tl.to(tagline, {
      opacity: 1,
      y: 0,
      ease: 'power3.out',
      duration: 0.12
    }, 0.87);

    tl.to(cta, {
      opacity: 1,
      y: 0,
      ease: 'power3.out',
      duration: 0.10
    }, 0.93);
  }

  /* ================================================
     5. BOOT
     ================================================ */
  function boot() {
    makeGrain();

    preload([
      CONFIG.bg1Url,
      CONFIG.bg2Url,
      CONFIG.bg3Url,
      CONFIG.logoUrl,
      CONFIG.fgLeftUrl,
      CONFIG.fgRightUrl
    ]).then(function () {
      setTimeout(function () {
        if (loader) loader.classList.add('loader--hidden');
        initAnimation();
      }, 350);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
