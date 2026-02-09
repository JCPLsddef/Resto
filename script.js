/* ==============================================
   AEGEAN ELYSIUM — Cinematic Scroll Engine
   GSAP + ScrollTrigger pinned hero
   Immersive Gallery (drag + inertia + modal)
   Full landing page interactivity
   ============================================== */

;(function () {
  'use strict';

  /* ================================================
     CONFIG — Edit these values to rebrand / customize
     ================================================ */
  var CONFIG = {
    /* Asset paths (swap for any client) */
    bg1Url:     'images/bg1.png',
    bg2Url:     'images/bg2.png',
    bg3Url:     'images/bg3.png',
    logoUrl:    'images/logo.png',
    fgLeftUrl:  'images/fg-left.png',
    fgRightUrl: 'images/fg-right.png',

    /* Hero text (edit in HTML or override here) */
    text1: 'A Mediterranean Experience',
    text2: 'Step into the moment',
    text3: 'La table face \u00e0 la mer',

    /* Scroll tuning */
    scrollLength:    3600,   // total pin distance in px
    scrubSmoothing:  1.2,    // scrub inertia (seconds)

    /* Foreground split distance */
    splitDesktop: 300,       // px at >= 1024
    splitMobile:  140,       // px at <= 768

    /* Zoom scales — continuous push-in, NEVER resets backward */
    bg1Start:    1.00,
    bg1PhaseA:   1.08,       // end of phase A
    bg1PhaseB:   1.16,       // end of phase B
    bg1Fade:     1.24,       // BG1 still zooming during crossfade

    bg2Start:    1.08,       // visually matches BG1 at crossfade entry
    bg2End:      1.24,       // continuous push-in through its lifespan

    bg3Start:    1.04,       // initial scale
    bg3End:      1.10,       // final settle

    /* Foreground initial overlap (xPercent from left:50%) */
    fgLeftXPercent:  -78,
    fgRightXPercent: -22,

    /* Gallery */
    galleryDragFriction: 0.92,  // inertia decay (0–1, higher = more slide)
    gallerySnapThreshold: 3     // px/frame below which inertia stops
  };

  /* ================================================
     MASONRY SETTINGS — Reactbits-inspired grid
     ================================================ */
  var MASONRY_OPTIONS = {
    ease: 'power3.out',
    duration: 0.6,
    stagger: 0.05,
    animateFrom: 'bottom',
    scaleOnHover: true,
    hoverScale: 0.95,
    blurToFocus: true,
    colorShiftOnHover: false
  };

  var MASONRY_ITEMS = [
    {
      id: 'm1',
      img: 'https://static.wixstatic.com/media/62f926_e14dd9bb63ee4a618e30f4603a00d19c~mv2.jpg',
      height: 560,
      url: 'https://static.wixstatic.com/media/62f926_e14dd9bb63ee4a618e30f4603a00d19c~mv2.jpg'
    },
    {
      id: 'm2',
      img: 'https://static.wixstatic.com/media/62f926_447f39f41e794d738f036da60de6f55f~mv2.jpg',
      height: 480,
      url: 'https://static.wixstatic.com/media/62f926_447f39f41e794d738f036da60de6f55f~mv2.jpg'
    },
    {
      id: 'm3',
      img: 'https://static.wixstatic.com/media/62f926_e9cc9d5453ae4654a188b612f64eacd0~mv2.jpg',
      height: 520,
      url: 'https://static.wixstatic.com/media/62f926_e9cc9d5453ae4654a188b612f64eacd0~mv2.jpg'
    },
    {
      id: 'm4',
      img: 'https://static.wixstatic.com/media/62f926_29e64cffaa624e92aba2c732df8529e4~mv2.jpg',
      height: 460,
      url: 'https://static.wixstatic.com/media/62f926_29e64cffaa624e92aba2c732df8529e4~mv2.jpg'
    },
    {
      id: 'm5',
      img: 'https://static.wixstatic.com/media/62f926_38491fbd92b546d1933ac1467979801c~mv2.jpg',
      height: 540,
      url: 'https://static.wixstatic.com/media/62f926_38491fbd92b546d1933ac1467979801c~mv2.jpg'
    },
    {
      id: 'm6',
      img: 'https://static.wixstatic.com/media/62f926_df9d8e1ec10744bc9ba4ca4841a1a1f5~mv2.jpg',
      height: 500,
      url: 'https://static.wixstatic.com/media/62f926_df9d8e1ec10744bc9ba4ca4841a1a1f5~mv2.jpg'
    }
  ];

  /* ================================================
     DOM REFERENCES
     ================================================ */
  var $ = function (id) { return document.getElementById(id); };

  var loader      = $('loader');
  var fill        = $('loaderFill');
  var bg1         = $('bg1');
  var bg2         = $('bg2');
  var bg3         = $('bg3');
  var fgLeft      = $('fgLeft');
  var fgRight     = $('fgRight');
  var text1       = $('text1');
  var text2       = $('text2');
  var text3       = $('text3');
  var logo        = $('logo');
  var tagline     = $('tagline');
  var cta         = $('cta');
  var grain       = $('grain');
  var grainGlobal = $('grainGlobal');
  var hint        = $('hint');

  /* ================================================
     1. PRELOADER — loads all hero images with progress
     ================================================ */
  function preload(urls) {
    var loaded = 0;
    return Promise.all(urls.map(function (url) {
      return new Promise(function (resolve) {
        var img = new Image();
        img.onload = img.onerror = function () {
          loaded++;
          if (fill) fill.style.width = ((loaded / urls.length) * 100) + '%';
          resolve();
        };
        img.src = url;
      });
    }));
  }

  /* ================================================
     2. FILM GRAIN — canvas tile 256px, shared by both
     ================================================ */
  function makeGrain() {
    var size = 256;
    var canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    var ctx = canvas.getContext('2d');
    var imageData = ctx.createImageData(size, size);
    var data = imageData.data;
    for (var i = 0; i < data.length; i += 4) {
      var v = Math.random() * 255;
      data[i] = v;
      data[i + 1] = v;
      data[i + 2] = v;
      data[i + 3] = 28;
    }
    ctx.putImageData(imageData, 0, 0);
    var url = 'url(' + canvas.toDataURL() + ')';
    if (grain) grain.style.backgroundImage = url;
    if (grainGlobal) grainGlobal.style.backgroundImage = url;
  }

  /* ================================================
     3. RESPONSIVE SPLIT DISTANCE
     ================================================ */
  function getSplit() {
    var vw = window.innerWidth;
    if (vw <= 480)  return CONFIG.splitMobile * 0.65;
    if (vw <= 768)  return CONFIG.splitMobile;
    if (vw <= 1024) return CONFIG.splitDesktop * 0.82;
    return Math.min(CONFIG.splitDesktop, vw * 0.18);
  }

  /* ================================================
     4. HERO ANIMATION — 4 cinematic phases
     Story: FGs split → sink into depth →
            camera pushes into BG2 → BG3 reveal + brand
     ================================================ */
  function initHero() {
    gsap.registerPlugin(ScrollTrigger);

    /* Reduced-motion fallback: skip to final state */
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.set([bg1, bg2], { opacity: 0 });
      gsap.set(bg3, { opacity: 1, scale: CONFIG.bg3End });
      gsap.set([fgLeft, fgRight], { opacity: 0 });
      gsap.set(logo, { opacity: 1, y: 0, filter: 'blur(0px)' });
      gsap.set(tagline, { opacity: 1, y: 0 });
      gsap.set(cta, { opacity: 1, y: 0 });
      return;
    }

    /* ---- Initial states ---- */
    gsap.set(bg1, { scale: CONFIG.bg1Start, transformOrigin: 'center center' });
    gsap.set(bg2, { opacity: 0, scale: CONFIG.bg2Start, transformOrigin: 'center center' });
    gsap.set(bg3, { opacity: 0, scale: CONFIG.bg3Start, transformOrigin: 'center center' });

    gsap.set(text1, { opacity: 0 });
    gsap.set(text2, { opacity: 0, y: 12 });
    gsap.set(text3, { opacity: 0, y: 12 });

    gsap.set(logo, { opacity: 0, y: 16, filter: 'blur(8px)' });
    gsap.set(tagline, { opacity: 0, y: 14 });
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

    /* ---- Master timeline (pinned, scrubbed) ---- */
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
       PHASE A · 0 → 0.28
       FGs split apart · Gentle camera push · Text 1
       ========================================== */

    // FGs separate
    tl.to(fgLeft, {
      x: function () { return -getSplit(); },
      ease: 'power2.out',
      duration: 0.28
    }, 0);
    tl.to(fgRight, {
      x: function () { return getSplit(); },
      ease: 'power2.out',
      duration: 0.28
    }, 0);

    // BG1 gentle zoom
    tl.to(bg1, {
      scale: CONFIG.bg1PhaseA,
      ease: 'power1.out',
      duration: 0.28
    }, 0);

    // Scroll hint fades
    tl.to(hint, { opacity: 0, ease: 'none', duration: 0.06 }, 0);

    // TEXT 1 — "A Mediterranean Experience"
    tl.to(text1, { opacity: 1, ease: 'power2.out', duration: 0.10 }, 0.02);
    tl.to(text1, { opacity: 0, ease: 'power1.in', duration: 0.08 }, 0.18);

    /* ==========================================
       PHASE B · 0.26 → 0.50
       FGs sink into depth (scale DOWN + blur + fade)
       Camera continues pushing · Text 2
       ========================================== */

    // FGs recede: scale down, blur, fade
    tl.to(fgLeft, {
      scale: 0.82,
      filter: 'blur(6px)',
      opacity: 0,
      ease: 'power2.inOut',
      duration: 0.22
    }, 0.28);
    tl.to(fgRight, {
      scale: 0.82,
      filter: 'blur(6px)',
      opacity: 0,
      ease: 'power2.inOut',
      duration: 0.22
    }, 0.28);

    // BG1 continues pushing
    tl.to(bg1, {
      scale: CONFIG.bg1PhaseB,
      ease: 'none',
      duration: 0.22
    }, 0.28);

    // TEXT 2 — "Step into the moment"
    tl.to(text2, { opacity: 1, y: 0, ease: 'power2.out', duration: 0.10 }, 0.32);
    tl.to(text2, { opacity: 0, ease: 'power1.in', duration: 0.10 }, 0.50);

    /* ==========================================
       CROSSFADE BG1 → BG2 · 0.46 → 0.72
       Long dissolve · Both zooming simultaneously
       ========================================== */

    // BG1 keeps pushing during crossfade
    tl.to(bg1, {
      scale: CONFIG.bg1Fade,
      ease: 'none',
      duration: 0.22
    }, 0.48);

    // BG2 fades in — long gentle dissolve
    tl.to(bg2, {
      opacity: 1,
      ease: 'none',
      duration: 0.24
    }, 0.46);

    // BG2 continuous zoom across its lifespan
    tl.to(bg2, {
      scale: CONFIG.bg2End,
      ease: 'none',
      duration: 0.38
    }, 0.46);

    // BG1 fades out (starts after BG2 is partially visible)
    tl.to(bg1, {
      opacity: 0,
      ease: 'none',
      duration: 0.18
    }, 0.54);

    /* ==========================================
       CROSSFADE BG2 → BG3 · 0.76 → 0.94
       Same long dissolve technique
       ========================================== */

    // TEXT 3 — "La table face à la mer"
    tl.to(text3, { opacity: 1, y: 0, ease: 'power2.out', duration: 0.10 }, 0.70);
    tl.to(text3, { opacity: 0, ease: 'power1.in', duration: 0.08 }, 0.80);

    // BG3 fades in
    tl.to(bg3, {
      opacity: 1,
      ease: 'none',
      duration: 0.16
    }, 0.78);

    // BG3 zoom-in
    tl.to(bg3, {
      scale: CONFIG.bg3End,
      ease: 'none',
      duration: 0.22
    }, 0.78);

    // BG2 fades out
    tl.to(bg2, {
      opacity: 0,
      ease: 'none',
      duration: 0.14
    }, 0.82);

    /* ==========================================
       BRAND REVEAL · 0.86 → 1.00
       Logo → Tagline → CTA cascade
       ========================================== */

    tl.to(logo, {
      opacity: 1, y: 0, filter: 'blur(0px)',
      ease: 'power3.out',
      duration: 0.10
    }, 0.86);

    tl.to(tagline, {
      opacity: 1, y: 0,
      ease: 'power3.out',
      duration: 0.08
    }, 0.90);

    tl.to(cta, {
      opacity: 1, y: 0,
      ease: 'power3.out',
      duration: 0.08
    }, 0.94);
  }

  /* ================================================
     5. SCROLL REVEAL — lightweight IntersectionObserver
     ================================================ */
  function initReveals() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var revealEls = document.querySelectorAll(
      '.s-value, .s-why, .s-gallery, .s-reserve, .s-faq, .footer'
    );

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateSection(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach(function (el) { observer.observe(el); });
  }

  function animateSection(section) {
    var heading = section.querySelector('.section-heading');
    var sub = section.querySelector('.section-sub');
    var items = [];

    if (section.classList.contains('s-value')) items = section.querySelectorAll('.value-item');
    if (section.classList.contains('s-why')) items = section.querySelectorAll('.why-card');
    if (section.classList.contains('s-faq')) items = section.querySelectorAll('.faq-item');

    var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    if (heading) {
      tl.from(heading, { y: 40, opacity: 0, duration: 0.8 }, 0);
    }
    if (sub) {
      tl.from(sub, { y: 25, opacity: 0, duration: 0.7 }, 0.1);
    }

    if (items.length) {
      tl.from(items, { y: 30, opacity: 0, duration: 0.7, stagger: 0.08 }, 0.2);
    }

    /* Section-specific reveals */
    if (section.classList.contains('s-reserve')) {
      var formFields = section.querySelectorAll('.form-field');
      var btn = section.querySelector('.reserve-form__btn');
      if (formFields.length) tl.from(formFields, { y: 20, opacity: 0, duration: 0.6, stagger: 0.06 }, 0.2);
      if (btn) tl.from(btn, { y: 15, opacity: 0, duration: 0.6 }, 0.5);
    }

    if (section.classList.contains('s-gallery')) {
      var galleryItems = section.querySelectorAll('.gallery-item');
      if (galleryItems.length) tl.from(galleryItems, { y: 40, opacity: 0, duration: 0.7, stagger: 0.06 }, 0.2);
    }

    if (section.tagName === 'FOOTER') {
      var cols = section.querySelectorAll('.footer__col');
      if (cols.length) tl.from(cols, { y: 25, opacity: 0, duration: 0.6, stagger: 0.08 }, 0.1);
    }
  }

  /* ================================================
     6. MASONRY — Reactbits-style animated grid
     ================================================ */
  function initMasonry() {
    var container = document.getElementById('masonryList');
    if (!container) return;

    var items = MASONRY_ITEMS.slice();
    var elements = [];
    var imagesReady = false;
    var hasMounted = false;

    container.innerHTML = '';

    function preloadImages(urls) {
      return Promise.all(urls.map(function (src) {
        return new Promise(function (resolve) {
          var img = new Image();
          img.src = src;
          img.onload = img.onerror = function () { resolve(); };
        });
      }));
    }

    function getColumns(width) {
      if (width >= 1500) return 5;
      if (width >= 1000) return 4;
      if (width >= 600) return 3;
      if (width >= 400) return 2;
      return 1;
    }

    function getInitialPosition(item) {
      var containerRect = container.getBoundingClientRect();
      var direction = MASONRY_OPTIONS.animateFrom;

      if (direction === 'random') {
        var directions = ['top', 'bottom', 'left', 'right'];
        direction = directions[Math.floor(Math.random() * directions.length)];
      }

      switch (direction) {
        case 'top':
          return { x: item.x, y: -200 };
        case 'bottom':
          return { x: item.x, y: window.innerHeight + 200 };
        case 'left':
          return { x: -200, y: item.y };
        case 'right':
          return { x: window.innerWidth + 200, y: item.y };
        case 'center':
          return {
            x: containerRect.width / 2 - item.w / 2,
            y: containerRect.height / 2 - item.h / 2
          };
        default:
          return { x: item.x, y: item.y + 100 };
      }
    }

    function handleMouseEnter(e) {
      var element = e.currentTarget;
      if (MASONRY_OPTIONS.scaleOnHover) {
        gsap.to(element, {
          scale: MASONRY_OPTIONS.hoverScale,
          duration: 0.3,
          ease: 'power2.out'
        });
      }

      if (MASONRY_OPTIONS.colorShiftOnHover) {
        var overlay = element.querySelector('.color-overlay');
        if (overlay) {
          gsap.to(overlay, { opacity: 0.3, duration: 0.3 });
        }
      }
    }

    function handleMouseLeave(e) {
      var element = e.currentTarget;
      if (MASONRY_OPTIONS.scaleOnHover) {
        gsap.to(element, { scale: 1, duration: 0.3, ease: 'power2.out' });
      }

      if (MASONRY_OPTIONS.colorShiftOnHover) {
        var overlay = element.querySelector('.color-overlay');
        if (overlay) {
          gsap.to(overlay, { opacity: 0, duration: 0.3 });
        }
      }
    }

    items.forEach(function (item) {
      var wrapper = document.createElement('div');
      wrapper.className = 'item-wrapper';
      wrapper.dataset.key = item.id;
      wrapper.setAttribute('role', 'button');
      wrapper.setAttribute('tabindex', '0');
      wrapper.setAttribute('aria-label', 'Open image');

      var img = document.createElement('div');
      img.className = 'item-img';
      img.style.backgroundImage = "url('" + item.img + "')";

      if (MASONRY_OPTIONS.colorShiftOnHover) {
        var overlay = document.createElement('div');
        overlay.className = 'color-overlay';
        img.appendChild(overlay);
      }

      wrapper.appendChild(img);
      container.appendChild(wrapper);
      elements.push(wrapper);

      wrapper.addEventListener('click', function () {
        if (item.url) window.open(item.url, '_blank', 'noopener');
      });
      wrapper.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (item.url) window.open(item.url, '_blank', 'noopener');
        }
      });
      wrapper.addEventListener('mouseenter', handleMouseEnter);
      wrapper.addEventListener('mouseleave', handleMouseLeave);
    });

    function layout() {
      if (!imagesReady) return;
      var width = container.clientWidth;
      if (!width) return;

      var columns = getColumns(width);
      var colHeights = new Array(columns).fill(0);
      var columnWidth = width / columns;

      items.forEach(function (item, index) {
        var col = colHeights.indexOf(Math.min.apply(Math, colHeights));
        var x = columnWidth * col;
        var height = item.height / 2;
        var y = colHeights[col];

        colHeights[col] += height;

        var layoutItem = { x: x, y: y, w: columnWidth, h: height };
        var element = elements[index];
        var animationProps = {
          x: layoutItem.x,
          y: layoutItem.y,
          width: layoutItem.w,
          height: layoutItem.h
        };

        if (!hasMounted) {
          var initialPos = getInitialPosition(layoutItem);
          var initialState = {
            opacity: 0,
            x: initialPos.x,
            y: initialPos.y,
            width: layoutItem.w,
            height: layoutItem.h
          };

          if (MASONRY_OPTIONS.blurToFocus) {
            initialState.filter = 'blur(10px)';
          }

          gsap.fromTo(element, initialState, {
            opacity: 1,
            x: layoutItem.x,
            y: layoutItem.y,
            width: layoutItem.w,
            height: layoutItem.h,
            filter: MASONRY_OPTIONS.blurToFocus ? 'blur(0px)' : 'none',
            duration: 0.8,
            ease: 'power3.out',
            delay: index * MASONRY_OPTIONS.stagger
          });
        } else {
          gsap.to(element, {
            x: layoutItem.x,
            y: layoutItem.y,
            width: layoutItem.w,
            height: layoutItem.h,
            duration: MASONRY_OPTIONS.duration,
            ease: MASONRY_OPTIONS.ease,
            overwrite: 'auto'
          });
        }
      });

      container.style.height = Math.max.apply(Math, colHeights) + 'px';
      hasMounted = true;
    }

    preloadImages(items.map(function (i) { return i.img; }))
      .then(function () {
        imagesReady = true;
        layout();
      });

    var ro = new ResizeObserver(function () {
      layout();
    });
    ro.observe(container);
  }

  /* ================================================
     7. CINEMATIC MENU — cover reveal on scroll
     ================================================ */
  function initCinematicMenu() {
    var section = document.querySelector('.menu-cinematic');
    if (!section) return;

    var cover = section.querySelector('.menu-cinematic__cover-img');
  var coverWrap = section.querySelector('.menu-cinematic__cover');
    var panel = section.querySelector('.menu-cinematic__panel');
    var galaxy = section.querySelector('.menu-cinematic__galaxy');
    var content = section.querySelector('.menu-cinematic__content');
    var logo = section.querySelector('.menu-cinematic__logo');
    var categories = section.querySelectorAll('.menu-category');

    if (content) {
      gsap.set(content, { opacity: 0, y: 30 });
    }
    if (logo) {
      gsap.set(logo, { opacity: 0, y: 20 });
    }
    if (panel) {
      gsap.set(panel, { opacity: 0, scale: 0.98 });
    }
    if (galaxy) {
      gsap.set(galaxy, { opacity: 0.35 });
    }

    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: '+=260%',
        scrub: true,
        pin: true,
        anticipatePin: 1
      }
    });

    tl.to({}, { duration: 0.18 });

    if (cover) {
      tl.to(cover, { scale: 1.04, ease: 'none', duration: 0.35 }, 0.18);
      tl.to(cover, { opacity: 0, ease: 'none', duration: 0.35 }, 0.43);
    }
    if (coverWrap) {
      tl.to(coverWrap, { opacity: 0, ease: 'none', duration: 0.35 }, 0.43);
    }

    if (galaxy) {
      tl.to(galaxy, { opacity: 0.1, duration: 0.35, ease: 'power2.out' }, 0.43);
    }
    if (panel) {
      tl.to(panel, { opacity: 1, scale: 1, duration: 0.35, ease: 'power3.out' }, 0.53);
    }
    if (content) {
      tl.to(content, { opacity: 1, y: 0, duration: 0.35, ease: 'power3.out' }, 0.63);
    }
    if (logo) {
      tl.to(logo, { opacity: 1, y: 0, duration: 0.25, ease: 'power3.out' }, 0.73);
    }

    categories.forEach(function (category, index) {
      var title = category.querySelector('.menu-category__title');
      var items = category.querySelectorAll('.menu-item');
  var base = 0.78 + index * 0.15;

      tl.to(category, { opacity: 1, duration: 0.2, ease: 'power3.out' }, base);

      if (title) {
        tl.to(title, { opacity: 1, y: 0, duration: 0.25, ease: 'power3.out' }, base + 0.05);
      }

      if (items.length) {
        tl.to(items, { opacity: 1, y: 0, duration: 0.25, stagger: 0.08, ease: 'power3.out' }, base + 0.1);
      }
    });
  }

  /* ================================================
     8. MENU GALAXY — OGL shader background
     ================================================ */
  function initMenuGalaxy() {
    var container = document.getElementById('menuGalaxy');
    if (!container || !window.OGL) return;

    var OGL = window.OGL;
  var renderer = new OGL.Renderer({ alpha: true, premultipliedAlpha: false });
    var gl = renderer.gl;

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(0, 0, 0, 0);

    var vertex = [
      'attribute vec2 uv;',
      'attribute vec2 position;',
      'varying vec2 vUv;',
      'void main() {',
      '  vUv = uv;',
      '  gl_Position = vec4(position, 0, 1);',
      '}'
    ].join('\n');

    var fragment = [
      'precision highp float;',
      'uniform float uTime;',
      'uniform vec3 uResolution;',
      'uniform vec2 uFocal;',
      'uniform vec2 uRotation;',
      'uniform float uStarSpeed;',
      'uniform float uDensity;',
      'uniform float uHueShift;',
      'uniform float uSpeed;',
      'uniform vec2 uMouse;',
      'uniform float uGlowIntensity;',
      'uniform float uSaturation;',
      'uniform bool uMouseRepulsion;',
      'uniform float uTwinkleIntensity;',
      'uniform float uRotationSpeed;',
      'uniform float uRepulsionStrength;',
      'uniform float uMouseActiveFactor;',
      'uniform float uAutoCenterRepulsion;',
      'uniform bool uTransparent;',
      'varying vec2 vUv;',
      '#define NUM_LAYER 4.0',
      '#define STAR_COLOR_CUTOFF 0.2',
      '#define MAT45 mat2(0.7071, -0.7071, 0.7071, 0.7071)',
      '#define PERIOD 3.0',
      'float Hash21(vec2 p) {',
      '  p = fract(p * vec2(123.34, 456.21));',
      '  p += dot(p, p + 45.32);',
      '  return fract(p.x * p.y);',
      '}',
      'float tri(float x) { return abs(fract(x) * 2.0 - 1.0); }',
      'float tris(float x) {',
      '  float t = fract(x);',
      '  return 1.0 - smoothstep(0.0, 1.0, abs(2.0 * t - 1.0));',
      '}',
      'float trisn(float x) {',
      '  float t = fract(x);',
      '  return 2.0 * (1.0 - smoothstep(0.0, 1.0, abs(2.0 * t - 1.0))) - 1.0;',
      '}',
      'vec3 hsv2rgb(vec3 c) {',
      '  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);',
      '  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);',
      '  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);',
      '}',
      'float Star(vec2 uv, float flare) {',
      '  float d = length(uv);',
      '  float m = (0.05 * uGlowIntensity) / d;',
      '  float rays = smoothstep(0.0, 1.0, 1.0 - abs(uv.x * uv.y * 1000.0));',
      '  m += rays * flare * uGlowIntensity;',
      '  uv *= MAT45;',
      '  rays = smoothstep(0.0, 1.0, 1.0 - abs(uv.x * uv.y * 1000.0));',
      '  m += rays * 0.3 * flare * uGlowIntensity;',
      '  m *= smoothstep(1.0, 0.2, d);',
      '  return m;',
      '}',
      'vec3 StarLayer(vec2 uv) {',
      '  vec3 col = vec3(0.0);',
      '  vec2 gv = fract(uv) - 0.5;',
      '  vec2 id = floor(uv);',
      '  for (int y = -1; y <= 1; y++) {',
      '    for (int x = -1; x <= 1; x++) {',
      '      vec2 offset = vec2(float(x), float(y));',
      '      vec2 si = id + vec2(float(x), float(y));',
      '      float seed = Hash21(si);',
      '      float size = fract(seed * 345.32);',
      '      float glossLocal = tri(uStarSpeed / (PERIOD * seed + 1.0));',
      '      float flareSize = smoothstep(0.9, 1.0, size) * glossLocal;',
      '      float red = smoothstep(STAR_COLOR_CUTOFF, 1.0, Hash21(si + 1.0)) + STAR_COLOR_CUTOFF;',
      '      float blu = smoothstep(STAR_COLOR_CUTOFF, 1.0, Hash21(si + 3.0)) + STAR_COLOR_CUTOFF;',
      '      float grn = min(red, blu) * seed;',
      '      vec3 base = vec3(red, grn, blu);',
      '      float hue = atan(base.g - base.r, base.b - base.r) / (2.0 * 3.14159) + 0.5;',
      '      hue = fract(hue + uHueShift / 360.0);',
      '      float sat = length(base - vec3(dot(base, vec3(0.299, 0.587, 0.114)))) * uSaturation;',
      '      float val = max(max(base.r, base.g), base.b);',
      '      base = hsv2rgb(vec3(hue, sat, val));',
      '      vec2 pad = vec2(tris(seed * 34.0 + uTime * uSpeed / 10.0), tris(seed * 38.0 + uTime * uSpeed / 30.0)) - 0.5;',
      '      float star = Star(gv - offset - pad, flareSize);',
      '      vec3 color = base;',
      '      float twinkle = trisn(uTime * uSpeed + seed * 6.2831) * 0.5 + 1.0;',
      '      twinkle = mix(1.0, twinkle, uTwinkleIntensity);',
      '      star *= twinkle;',
      '      col += star * size * color;',
      '    }',
      '  }',
      '  return col;',
      '}',
      'void main() {',
      '  vec2 focalPx = uFocal * uResolution.xy;',
      '  vec2 uv = (vUv * uResolution.xy - focalPx) / uResolution.y;',
      '  vec2 mouseNorm = uMouse - vec2(0.5);',
      '  if (uAutoCenterRepulsion > 0.0) {',
      '    vec2 centerUV = vec2(0.0, 0.0);',
      '    float centerDist = length(uv - centerUV);',
      '    vec2 repulsion = normalize(uv - centerUV) * (uAutoCenterRepulsion / (centerDist + 0.1));',
      '    uv += repulsion * 0.05;',
      '  } else if (uMouseRepulsion) {',
      '    vec2 mousePosUV = (uMouse * uResolution.xy - focalPx) / uResolution.y;',
      '    float mouseDist = length(uv - mousePosUV);',
      '    vec2 repulsion = normalize(uv - mousePosUV) * (uRepulsionStrength / (mouseDist + 0.1));',
      '    uv += repulsion * 0.05 * uMouseActiveFactor;',
      '  } else {',
      '    vec2 mouseOffset = mouseNorm * 0.1 * uMouseActiveFactor;',
      '    uv += mouseOffset;',
      '  }',
      '  float autoRotAngle = uTime * uRotationSpeed;',
      '  mat2 autoRot = mat2(cos(autoRotAngle), -sin(autoRotAngle), sin(autoRotAngle), cos(autoRotAngle));',
      '  uv = autoRot * uv;',
      '  uv = mat2(uRotation.x, -uRotation.y, uRotation.y, uRotation.x) * uv;',
      '  vec3 col = vec3(0.0);',
      '  for (float i = 0.0; i < 1.0; i += 1.0 / NUM_LAYER) {',
      '    float depth = fract(i + uStarSpeed * uSpeed);',
      '    float scale = mix(20.0 * uDensity, 0.5 * uDensity, depth);',
      '    float fade = depth * smoothstep(1.0, 0.9, depth);',
      '    col += StarLayer(uv * scale + i * 453.32) * fade;',
      '  }',
      '  if (uTransparent) {',
      '    float alpha = length(col);',
      '    alpha = smoothstep(0.0, 0.3, alpha);',
      '    alpha = min(alpha, 1.0);',
      '    gl_FragColor = vec4(col, alpha);',
      '  } else {',
      '    gl_FragColor = vec4(col, 1.0);',
      '  }',
      '}'
    ].join('\n');

  var baseStarSpeed = 0.6;
  var baseSpeed = 1.0;

  var geometry = new OGL.Triangle(gl);
  var program = new OGL.Program(gl, {
      vertex: vertex,
      fragment: fragment,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new OGL.Color(1, 1, 1) },
        uFocal: { value: new Float32Array([0.5, 0.5]) },
        uRotation: { value: new Float32Array([1.0, 0.0]) },
  uStarSpeed: { value: baseStarSpeed },
  uDensity: { value: 1.2 },
  uHueShift: { value: 210 },
  uSpeed: { value: baseSpeed },
        uMouse: { value: new Float32Array([0.5, 0.5]) },
  uGlowIntensity: { value: 0.55 },
  uSaturation: { value: 0.25 },
        uMouseRepulsion: { value: true },
  uTwinkleIntensity: { value: 0.4 },
        uRotationSpeed: { value: 0.1 },
        uRepulsionStrength: { value: 2.0 },
        uMouseActiveFactor: { value: 0.0 },
        uAutoCenterRepulsion: { value: 0.0 },
  uTransparent: { value: false }
      }
    });

    var mesh = new OGL.Mesh(gl, { geometry: geometry, program: program });
    var rafId;
    var targetMouse = { x: 0.5, y: 0.5 };
    var smoothMouse = { x: 0.5, y: 0.5 };
    var targetActive = 0.0;
    var smoothActive = 0.0;

    function resize() {
      var scale = 1;
      renderer.setSize(container.offsetWidth * scale, container.offsetHeight * scale);
      program.uniforms.uResolution.value = new OGL.Color(
        gl.canvas.width,
        gl.canvas.height,
        gl.canvas.width / gl.canvas.height
      );
    }

    function update(t) {
      rafId = requestAnimationFrame(update);
  program.uniforms.uTime.value = t * 0.001;
  program.uniforms.uStarSpeed.value = (t * 0.001 * baseStarSpeed) / 10.0;

      smoothMouse.x += (targetMouse.x - smoothMouse.x) * 0.05;
      smoothMouse.y += (targetMouse.y - smoothMouse.y) * 0.05;
      smoothActive += (targetActive - smoothActive) * 0.05;

      program.uniforms.uMouse.value[0] = smoothMouse.x;
      program.uniforms.uMouse.value[1] = smoothMouse.y;
      program.uniforms.uMouseActiveFactor.value = smoothActive;

      renderer.render({ scene: mesh });
    }

    function handleMouseMove(e) {
      var rect = container.getBoundingClientRect();
      targetMouse.x = (e.clientX - rect.left) / rect.width;
      targetMouse.y = 1.0 - (e.clientY - rect.top) / rect.height;
      targetActive = 1.0;
    }

    function handleMouseLeave() {
      targetActive = 0.0;
    }

    window.addEventListener('resize', resize, false);
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);

    resize();
    container.appendChild(gl.canvas);
    rafId = requestAnimationFrame(update);
  }

  /* ================================================
    9. IMMERSIVE GALLERY — Drag + Inertia + Modal
     DomeGallery-inspired horizontal scroll
     ================================================ */
  function initGallery() {
    var viewport = document.getElementById('galleryViewport');
    var track = document.getElementById('galleryTrack');
    var modal = document.getElementById('galleryModal');
    var modalImg = document.getElementById('galleryModalImg');
    var modalClose = document.getElementById('galleryModalClose');
    var scrim = document.getElementById('galleryScrim');

    if (!viewport || !track) return;

    var isDragging = false;
    var startX = 0;
    var translateX = 0;
    var lastTranslateX = 0;
    var velocity = 0;
    var lastMoveX = 0;
    var lastMoveTime = 0;
    var animFrame = null;
    var dragMoved = false;

    function getMaxScroll() {
      return -(track.scrollWidth - viewport.offsetWidth);
    }

    function clampTranslate(val) {
      return Math.max(getMaxScroll(), Math.min(0, val));
    }

    function setTrackPosition(x) {
      translateX = x;
      track.style.transform = 'translateX(' + x + 'px)';
    }

    /* --- Drag start --- */
    function onDragStart(e) {
      isDragging = true;
      dragMoved = false;
      if (animFrame) cancelAnimationFrame(animFrame);

      var clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
      startX = clientX;
      lastMoveX = clientX;
      lastMoveTime = Date.now();
      lastTranslateX = translateX;
      velocity = 0;

      viewport.style.cursor = 'grabbing';
    }

    /* --- Drag move --- */
    function onDragMove(e) {
      if (!isDragging) return;

      var clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
      var delta = clientX - startX;

      // Prevent vertical scroll on touch during horizontal drag
      if (e.type.startsWith('touch') && Math.abs(delta) > 8) {
        e.preventDefault();
      }

      if (Math.abs(delta) > 4) dragMoved = true;

      // Track velocity
      var now = Date.now();
      var dt = now - lastMoveTime;
      if (dt > 0) {
        velocity = (clientX - lastMoveX) / dt * 16; // normalize to ~frame
      }
      lastMoveX = clientX;
      lastMoveTime = now;

      var newX = lastTranslateX + delta;

      // Rubber-band at edges
      if (newX > 0) {
        newX = newX * 0.3;
      } else if (newX < getMaxScroll()) {
        var over = newX - getMaxScroll();
        newX = getMaxScroll() + over * 0.3;
      }

      setTrackPosition(newX);
    }

    /* --- Drag end + inertia --- */
    function onDragEnd() {
      if (!isDragging) return;
      isDragging = false;
      viewport.style.cursor = 'grab';

      // Apply inertia
      function inertiaStep() {
        velocity *= CONFIG.galleryDragFriction;

        if (Math.abs(velocity) < CONFIG.gallerySnapThreshold) {
          // Snap back if overscrolled
          var final = clampTranslate(translateX);
          if (final !== translateX) {
            gsap.to({ v: translateX }, {
              v: final,
              duration: 0.4,
              ease: 'power2.out',
              onUpdate: function () {
                setTrackPosition(this.targets()[0].v);
              }
            });
          }
          return;
        }

        var newX = translateX + velocity;

        // Slow down near edges
        if (newX > 0 || newX < getMaxScroll()) {
          velocity *= 0.5;
          newX = translateX + velocity;
        }

        setTrackPosition(newX);
        animFrame = requestAnimationFrame(inertiaStep);
      }

      animFrame = requestAnimationFrame(inertiaStep);
    }

    /* --- Event binding --- */
    // Mouse events
    viewport.addEventListener('mousedown', onDragStart);
    window.addEventListener('mousemove', onDragMove);
    window.addEventListener('mouseup', onDragEnd);

    // Touch events
    viewport.addEventListener('touchstart', onDragStart, { passive: true });
    viewport.addEventListener('touchmove', onDragMove, { passive: false });
    viewport.addEventListener('touchend', onDragEnd);

    // Prevent image drag
    viewport.addEventListener('dragstart', function (e) { e.preventDefault(); });

    /* --- Gallery item click → modal --- */
    var galleryItems = track.querySelectorAll('.gallery-item');
    galleryItems.forEach(function (item) {
      item.addEventListener('click', function () {
        if (dragMoved) return; // was a drag, not a click
        openModal(item);
      });
      item.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openModal(item);
        }
      });
    });

    /* --- Modal --- */
    var scrollY = 0;

    function openModal(item) {
      if (!modal) return;
      var imgDiv = item.querySelector('.gallery-item__img');
      if (!imgDiv) return;

      var bgImage = imgDiv.style.backgroundImage;
      var url = bgImage.replace(/url\(['"]?/, '').replace(/['"]?\)/, '');

      modalImg.src = url;
      modalImg.alt = item.querySelector('.gallery-item__caption')
        ? item.querySelector('.gallery-item__caption').textContent
        : '';

      // Lock scroll
      scrollY = window.scrollY;
      document.body.classList.add('no-scroll');
      document.body.style.top = -scrollY + 'px';

      modal.hidden = false;
      // Force reflow for transition
      void modal.offsetHeight;
      modal.classList.add('is-open');

      modalClose.focus();
    }

    function closeModal() {
      if (!modal) return;
      modal.classList.remove('is-open');

      // Unlock scroll
      document.body.classList.remove('no-scroll');
      document.body.style.top = '';
      window.scrollTo(0, scrollY);

      setTimeout(function () {
        modal.hidden = true;
        modalImg.src = '';
      }, 400);
    }

    if (modalClose) modalClose.addEventListener('click', closeModal);
    if (scrim) scrim.addEventListener('click', closeModal);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal && modal.classList.contains('is-open')) {
        closeModal();
      }
    });
  }

  /* ================================================
     10. FAQ — gentle open/close
     ================================================ */
  function initFaq() {
    var items = document.querySelectorAll('.faq-item');
    if (!items.length) return;

    items.forEach(function (item) {
      var summary = item.querySelector('summary');
      var content = item.querySelector('.faq-item__a');
      if (!summary || !content) return;

      gsap.set(content, { height: 0, opacity: 0, overflow: 'hidden' });

      summary.addEventListener('click', function (e) {
        e.preventDefault();
        var isOpen = item.hasAttribute('open');

        if (isOpen) {
          gsap.to(content, {
            height: 0,
            opacity: 0,
            duration: 0.45,
            ease: 'power3.out',
            onComplete: function () {
              item.removeAttribute('open');
            }
          });
        } else {
          item.setAttribute('open', '');
          var targetHeight = content.scrollHeight;
          gsap.fromTo(content,
            { height: 0, opacity: 0 },
            {
              height: targetHeight,
              opacity: 1,
              duration: 0.5,
              ease: 'power3.out',
              onComplete: function () {
                content.style.height = 'auto';
              }
            }
          );
        }
      });
    });
  }

  /* ================================================
     7. RESERVATION FORM — validation + confirmation
     ================================================ */
  function initForm() {
    var form = document.getElementById('reserveForm');
    var confirm = document.getElementById('reserveConfirm');
    var trust = document.getElementById('reserveTrust');
    var again = document.getElementById('reserveAgain');

    if (!form) return;

    // Set min date to today
    var dateInput = document.getElementById('fdate');
    if (dateInput) {
      var today = new Date().toISOString().split('T')[0];
      dateInput.setAttribute('min', today);
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      // Clear prior validation states
      form.querySelectorAll('.is-invalid').forEach(function (el) {
        el.classList.remove('is-invalid');
      });

      // Validate required fields
      var valid = true;
      var required = form.querySelectorAll('[required]');
      required.forEach(function (field) {
        if (!field.value || !field.value.trim()) {
          field.classList.add('is-invalid');
          valid = false;
        }
      });

      if (!valid) {
        // Focus first invalid field
        var firstInvalid = form.querySelector('.is-invalid');
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      // Show confirmation
      form.hidden = true;
      if (trust) trust.hidden = true;
      if (confirm) confirm.hidden = false;

      // Animate confirmation
      gsap.from(confirm, { opacity: 0, y: 20, duration: 0.6, ease: 'power3.out' });
    });

    // "Make another" resets form
    if (again) {
      again.addEventListener('click', function () {
        form.reset();
        form.hidden = false;
        if (trust) trust.hidden = false;
        if (confirm) confirm.hidden = true;
      });
    }
  }


  /* ================================================
     8. BOOT SEQUENCE
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
        initHero();
  initMasonry();
  initCinematicMenu();
  initMenuGalaxy();
        initReveals();
        initGallery();
  initFaq();
        initForm();
      }, 350);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
