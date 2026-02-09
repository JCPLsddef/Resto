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
    hoverScale: 1.03,
    blurToFocus: true
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

  if (section.classList.contains('s-value')) items = section.querySelectorAll('.curved-loop');
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
     6. CURVED LOOP — marquee text path
     ================================================ */
  function initCurvedLoops() {
    var loops = document.querySelectorAll('.curved-loop');
    if (!loops.length) return;

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    loops.forEach(function (loop, index) {
      var svg = loop.querySelector('.curved-loop__svg');
      var measure = loop.querySelector('.curved-loop__measure');
      var textPath = loop.querySelector('.curved-loop__textpath');
      var path = loop.querySelector('.curved-loop__path');

      if (!svg || !measure || !textPath || !path) return;

      var text = loop.getAttribute('data-text') || '';
      var speed = parseFloat(loop.getAttribute('data-speed')) || 1.2;
      var curveAmount = parseFloat(loop.getAttribute('data-curve')) || 220;
      var direction = loop.getAttribute('data-direction') || 'left';
      var interactive = loop.getAttribute('data-interactive') !== 'false';

      var hasTrailing = /\s|\u00A0$/.test(text);
      text = (hasTrailing ? text.replace(/\s+$/, '') : text) + '\u00A0';

      var spacing = 0;
      var offset = 0;
      var dragActive = false;
      var lastX = 0;
      var velocity = 0;
      var dir = direction;

  var existingId = path.getAttribute('id');
  var pathId = existingId || ('curvedLoopPath-' + index);
  path.setAttribute('id', pathId);
  textPath.setAttribute('href', '#' + pathId);

      function buildPath() {
        path.setAttribute('d', 'M-100,40 Q500,' + (40 + curveAmount) + ' 1540,40');
      }

      function buildText() {
        measure.textContent = text;
        spacing = measure.getComputedTextLength();
        if (!spacing) return;

        var repeats = Math.ceil(1800 / spacing) + 2;
        var totalText = new Array(repeats).fill(text).join('');
        textPath.textContent = totalText;
        offset = -spacing;
        textPath.setAttribute('startOffset', offset + 'px');
        loop.style.visibility = 'visible';
      }

      buildPath();
      buildText();

      if (reduceMotion) {
        textPath.setAttribute('startOffset', '0px');
        loop.style.visibility = 'visible';
        return;
      }

      var frame = 0;
      var step = function () {
        if (!dragActive) {
          var delta = dir === 'right' ? speed : -speed;
          var currentOffset = parseFloat(textPath.getAttribute('startOffset') || '0');
          var newOffset = currentOffset + delta;
          var wrapPoint = spacing;

          if (wrapPoint) {
            if (newOffset <= -wrapPoint) newOffset += wrapPoint;
            if (newOffset > 0) newOffset -= wrapPoint;
          }

          textPath.setAttribute('startOffset', newOffset + 'px');
          offset = newOffset;
        }
        frame = requestAnimationFrame(step);
      };

      frame = requestAnimationFrame(step);

      window.addEventListener('resize', function () {
        buildPath();
        buildText();
      });

      if (!interactive) {
        loop.style.cursor = 'auto';
        return;
      }

      loop.addEventListener('pointerdown', function (e) {
        dragActive = true;
        loop.classList.add('is-dragging');
        lastX = e.clientX;
        velocity = 0;
        loop.setPointerCapture(e.pointerId);
      });

      loop.addEventListener('pointermove', function (e) {
        if (!dragActive) return;
        var dx = e.clientX - lastX;
        lastX = e.clientX;
        velocity = dx;

        var currentOffset = parseFloat(textPath.getAttribute('startOffset') || '0');
        var newOffset = currentOffset + dx;
        var wrapPoint = spacing;

        if (wrapPoint) {
          if (newOffset <= -wrapPoint) newOffset += wrapPoint;
          if (newOffset > 0) newOffset -= wrapPoint;
        }

        textPath.setAttribute('startOffset', newOffset + 'px');
        offset = newOffset;
      });

      function endDrag() {
        if (!dragActive) return;
        dragActive = false;
        loop.classList.remove('is-dragging');
        dir = velocity > 0 ? 'right' : 'left';
      }

      loop.addEventListener('pointerup', endDrag);
      loop.addEventListener('pointerleave', endDrag);
      loop.addEventListener('pointercancel', endDrag);
    });
  }

  /* ================================================
     7. MASONRY — Reactbits-style animated grid
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
    }

    function handleMouseLeave(e) {
      var element = e.currentTarget;
      if (MASONRY_OPTIONS.scaleOnHover) {
        gsap.to(element, { scale: 1, duration: 0.3, ease: 'power2.out' });
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
      gsap.set(galaxy, { opacity: 1 });
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
      tl.to(galaxy, { opacity: 0, duration: 0.35, ease: 'power2.out' }, 0.43);
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
     8. MENU LIGHT RAYS — WebGL shader background
     ================================================ */
  function initMenuGalaxy() {
    var container = document.getElementById('menuGalaxy');
    if (!container) return;

    var canvas = document.createElement('canvas');
    var gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return;

    gl.clearColor(0, 0, 0, 1);

    var vertexSrc = [
      'attribute vec2 position;',
      'varying vec2 vUv;',
      'void main() {',
      '  vUv = position * 0.5 + 0.5;',
      '  gl_Position = vec4(position, 0.0, 1.0);',
      '}'
    ].join('\n');

    var fragmentSrc = [
      'precision highp float;',
      '',
      'uniform float iTime;',
      'uniform vec2  iResolution;',
      'uniform vec2  rayPos;',
      'uniform vec2  rayDir;',
      'uniform vec3  raysColor;',
      'uniform float raysSpeed;',
      'uniform float lightSpread;',
      'uniform float rayLength;',
      'uniform float pulsating;',
      'uniform float fadeDistance;',
      'uniform float saturation;',
      'uniform vec2  mousePos;',
      'uniform float mouseInfluence;',
      'uniform float noiseAmount;',
      'uniform float distortion;',
      '',
      'varying vec2 vUv;',
      '',
      'float noise(vec2 st) {',
      '  return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);',
      '}',
      '',
      'float rayStrength(vec2 raySource, vec2 rayRefDirection, vec2 coord,',
      '                  float seedA, float seedB, float speed) {',
      '  vec2 sourceToCoord = coord - raySource;',
      '  vec2 dirNorm = normalize(sourceToCoord);',
      '  float cosAngle = dot(dirNorm, rayRefDirection);',
      '',
      '  float distortedAngle = cosAngle + distortion * sin(iTime * 2.0 + length(sourceToCoord) * 0.01) * 0.2;',
      '',
      '  float spreadFactor = pow(max(distortedAngle, 0.0), 1.0 / max(lightSpread, 0.001));',
      '',
      '  float distance = length(sourceToCoord);',
      '  float maxDistance = iResolution.x * rayLength;',
      '  float lengthFalloff = clamp((maxDistance - distance) / maxDistance, 0.0, 1.0);',
      '',
      '  float fadeFalloff = clamp((iResolution.x * fadeDistance - distance) / (iResolution.x * fadeDistance), 0.5, 1.0);',
      '  float pulse = pulsating > 0.5 ? (0.8 + 0.2 * sin(iTime * speed * 3.0)) : 1.0;',
      '',
      '  float baseStrength = clamp(',
      '    (0.45 + 0.15 * sin(distortedAngle * seedA + iTime * speed)) +',
      '    (0.3 + 0.2 * cos(-distortedAngle * seedB + iTime * speed)),',
      '    0.0, 1.0',
      '  );',
      '',
      '  return baseStrength * lengthFalloff * fadeFalloff * spreadFactor * pulse;',
      '}',
      '',
      'void main() {',
      '  vec2 coord = vec2(gl_FragCoord.x, iResolution.y - gl_FragCoord.y);',
      '',
      '  vec2 finalRayDir = rayDir;',
      '  if (mouseInfluence > 0.0) {',
      '    vec2 mouseScreenPos = mousePos * iResolution.xy;',
      '    vec2 mouseDirection = normalize(mouseScreenPos - rayPos);',
      '    finalRayDir = normalize(mix(rayDir, mouseDirection, mouseInfluence));',
      '  }',
      '',
      '  vec4 rays1 = vec4(1.0) *',
      '               rayStrength(rayPos, finalRayDir, coord, 36.2214, 21.11349,',
      '                           1.5 * raysSpeed);',
      '  vec4 rays2 = vec4(1.0) *',
      '               rayStrength(rayPos, finalRayDir, coord, 22.3991, 18.0234,',
      '                           1.1 * raysSpeed);',
      '',
      '  vec4 fragColor = rays1 * 0.5 + rays2 * 0.4;',
      '',
      '  if (noiseAmount > 0.0) {',
      '    float n = noise(coord * 0.01 + iTime * 0.1);',
      '    fragColor.rgb *= (1.0 - noiseAmount + noiseAmount * n);',
      '  }',
      '',
      '  float brightness = 1.0 - (coord.y / iResolution.y);',
      '  fragColor.x *= 0.1 + brightness * 0.8;',
      '  fragColor.y *= 0.3 + brightness * 0.6;',
      '  fragColor.z *= 0.5 + brightness * 0.5;',
      '',
      '  if (saturation != 1.0) {',
      '    float gray = dot(fragColor.rgb, vec3(0.299, 0.587, 0.114));',
      '    fragColor.rgb = mix(vec3(gray), fragColor.rgb, saturation);',
      '  }',
      '',
      '  fragColor.rgb *= raysColor;',
      '',
      '  gl_FragColor = fragColor;',
      '}'
    ].join('\n');

    function compileShader(type, src) {
      var s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error('LightRays shader error:', gl.getShaderInfoLog(s));
        return null;
      }
      return s;
    }

    var vs = compileShader(gl.VERTEX_SHADER, vertexSrc);
    var fs = compileShader(gl.FRAGMENT_SHADER, fragmentSrc);
    if (!vs || !fs) return;

    var prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error('LightRays program link error:', gl.getProgramInfoLog(prog));
      return;
    }
    gl.useProgram(prog);

    // Full-screen triangle
    var verts = new Float32Array([-1, -1, 3, -1, -1, 3]);
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);

    var posLoc = gl.getAttribLocation(prog, 'position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    // Uniform locations
    var loc = {
      iTime: gl.getUniformLocation(prog, 'iTime'),
      iResolution: gl.getUniformLocation(prog, 'iResolution'),
      rayPos: gl.getUniformLocation(prog, 'rayPos'),
      rayDir: gl.getUniformLocation(prog, 'rayDir'),
      raysColor: gl.getUniformLocation(prog, 'raysColor'),
      raysSpeed: gl.getUniformLocation(prog, 'raysSpeed'),
      lightSpread: gl.getUniformLocation(prog, 'lightSpread'),
      rayLength: gl.getUniformLocation(prog, 'rayLength'),
      pulsating: gl.getUniformLocation(prog, 'pulsating'),
      fadeDistance: gl.getUniformLocation(prog, 'fadeDistance'),
      saturation: gl.getUniformLocation(prog, 'saturation'),
      mousePos: gl.getUniformLocation(prog, 'mousePos'),
      mouseInfluence: gl.getUniformLocation(prog, 'mouseInfluence'),
      noiseAmount: gl.getUniformLocation(prog, 'noiseAmount'),
      distortion: gl.getUniformLocation(prog, 'distortion')
    };

    // Set static uniforms
    gl.uniform3f(loc.raysColor, 1.0, 1.0, 1.0);
    gl.uniform1f(loc.raysSpeed, 1.0);
    gl.uniform1f(loc.lightSpread, 1.0);
    gl.uniform1f(loc.rayLength, 2.0);
    gl.uniform1f(loc.pulsating, 0.0);
    gl.uniform1f(loc.fadeDistance, 1.0);
    gl.uniform1f(loc.saturation, 1.0);
    gl.uniform1f(loc.mouseInfluence, 0.1);
    gl.uniform1f(loc.noiseAmount, 0.0);
    gl.uniform1f(loc.distortion, 0.0);

    var rafId;
    var smoothMouse = { x: 0.5, y: 0.5 };
    var targetMouse = { x: 0.5, y: 0.5 };

    function resize() {
      canvas.width = container.offsetWidth;
      canvas.height = container.offsetHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(loc.iResolution, canvas.width, canvas.height);
      // top-center origin: anchor above center, direction pointing down
      var outside = 0.2;
      gl.uniform2f(loc.rayPos, 0.5 * canvas.width, -outside * canvas.height);
      gl.uniform2f(loc.rayDir, 0.0, 1.0);
    }

    function update(t) {
      rafId = requestAnimationFrame(update);
      gl.uniform1f(loc.iTime, t * 0.001);

      smoothMouse.x += (targetMouse.x - smoothMouse.x) * 0.08;
      smoothMouse.y += (targetMouse.y - smoothMouse.y) * 0.08;
      gl.uniform2f(loc.mousePos, smoothMouse.x, smoothMouse.y);

      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    function handleMouseMove(e) {
      var rect = container.getBoundingClientRect();
      targetMouse.x = (e.clientX - rect.left) / rect.width;
      targetMouse.y = (e.clientY - rect.top) / rect.height;
    }

    window.addEventListener('resize', resize, false);
    window.addEventListener('mousemove', handleMouseMove);

    resize();
    container.appendChild(canvas);
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
      var chevron = item.querySelector('.faq-item__chevron');
      if (!summary || !content) return;

      gsap.set(content, { height: 0, opacity: 0, overflow: 'hidden' });

      summary.addEventListener('click', function (e) {
        e.preventDefault();
        var isOpen = item.hasAttribute('open');

        if (isOpen) {
          if (chevron) gsap.to(chevron, { rotation: 0, duration: 0.4, ease: 'power3.out' });
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
          if (chevron) gsap.to(chevron, { rotation: 180, duration: 0.4, ease: 'power3.out' });
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
    8. RESERVATION FORM — validation + confirmation
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
        el.removeAttribute('aria-invalid');
      });

      // Validate required fields
      var valid = true;
      var required = form.querySelectorAll('[required]');
      required.forEach(function (field) {
        if (!field.value || !field.value.trim()) {
          field.classList.add('is-invalid');
          field.setAttribute('aria-invalid', 'true');
          valid = false;
        }
      });

      // Validate phone format (at least 6 digits)
      var phoneField = document.getElementById('fphone');
      if (phoneField && phoneField.value.trim()) {
        var digits = phoneField.value.replace(/\D/g, '');
        if (digits.length < 6) {
          phoneField.classList.add('is-invalid');
          phoneField.setAttribute('aria-invalid', 'true');
          valid = false;
        }
      }

      // Validate email format if provided
      var emailField = document.getElementById('femail');
      if (emailField && emailField.value.trim()) {
        var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(emailField.value.trim())) {
          emailField.classList.add('is-invalid');
          emailField.setAttribute('aria-invalid', 'true');
          valid = false;
        }
      }

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
    9. BOOT SEQUENCE
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
    initCurvedLoops();
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
