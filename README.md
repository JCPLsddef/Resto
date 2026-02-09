# Aegean Elysium — Luxury Restaurant Landing Page

A cinematic, scroll-driven luxury restaurant landing page built with pure HTML, CSS, and vanilla JavaScript. GSAP + ScrollTrigger power the pinned hero with parallax foreground splits, multi-layer background crossfades, and a full conversion funnel.

## Setup & Run

1. **Open the project folder** in VS Code
2. **Install Live Server** extension (if not installed): `ritwickdey.LiveServer`
3. **Right-click `index.html`** → "Open with Live Server"
4. The page opens at `http://127.0.0.1:5500` (default)

No build step, no npm, no framework. Just serve the folder.

### Alternative: Python
```bash
cd cinematic-scroll-site
python3 -m http.server 8080
# Open http://localhost:8080
```

### Required Assets

Place these files in an `images/` directory:

| File | Purpose |
|------|---------|
| `bg1.png` | Hero background layer 1 (initial scene) |
| `bg2.png` | Hero background layer 2 (mid camera push) |
| `bg3.png` | Hero background layer 3 (final reveal) |
| `fg-left.png` | Foreground cutout — left (transparent PNG) |
| `fg-right.png` | Foreground cutout — right (transparent PNG) |
| `logo.png` | Brand logo (transparent PNG) |

## File Structure

```
cinematic-scroll-site/
├── index.html      # Semantic HTML, all 9 conversion sections
├── style.css       # Quiet luxury aesthetic, responsive, reduced-motion
├── script.js       # GSAP hero, gallery engine, form validation
├── README.md       # This file
└── images/
    ├── bg1.png
    ├── bg2.png
    ├── bg3.png
    ├── fg-left.png
    ├── fg-right.png
    └── logo.png
```

## Page Sections (in order)

1. **Cinematic Hero** — Pinned scroll with 3 BG layers, foreground split/sink, 3 text beats, brand reveal + CTA
2. **Value Strip** — 4 trust bullets (Michelin chef, terrace, ingredients, sunset)
3. **Why Us** — 3 editorial cards
4. **Signature Menu** — 6 dish cards with gradient placeholders + "View full menu"
5. **Chef's Highlight** — Featured dish spotlight + CTA
6. **Social Proof** — 4.9 rating + 3 testimonial cards
7. **Immersive Gallery** — DomeGallery-style drag + inertia + curved perspective + modal
8. **Reservation Form** — Date/time/guests/name/phone + animated confirmation
9. **FAQ** — 5 accordion items (pricing, dietary, groups, parking, cancellation)
10. **Premium Footer** — Address, hours, map link, phone, email, social, final CTA

## Bug Report

| # | Issue | Severity | Fix Applied | How to Test |
|---|-------|----------|-------------|-------------|
| 1 | **Overlapping scale tweens on BG1** — two `.to()` calls wrote to `scale` simultaneously during crossfade, causing jitter/frame-drops | High | Replaced with ONE continuous scale tween per BG layer (BG1: 0→0.72, BG2: 0.46→0.88, BG3: 0.78→1.00) | Slow-scrub through hero at 0.4x, watch for any scale jumps at crossfade boundaries |
| 2 | **BG2 scale mismatch** — started at 1.08 while BG1 was at ~1.16 at crossfade entry, causing visible zoom-pop during dissolve | High | Matched `bg2Start: 1.15` to BG1's calculated scale at position 0.46 (~1.166) | Pause at BG1→BG2 crossfade midpoint, check perceived zoom continuity |
| 3 | **Gallery modal `[hidden]` conflict** — CSS overrode `display:none` from `hidden` attr with `display:flex`, breaking native semantics | Medium | Removed `hidden` attribute, use `visibility/opacity/pointer-events` + `aria-hidden` for accessibility | Click gallery item → modal opens; click scrim/Esc → modal closes cleanly |
| 4 | **Scroll lock layout thrash** — `position:fixed` on body applied before `top` was set, causing single-frame scroll jump | Medium | Set `body.style.top` BEFORE adding `.no-scroll` class; also apply `overflow:hidden` to `html` element and block touchmove on iOS | Open gallery modal on mobile, verify no visible page jump |
| 5 | **Hidden modal intercepted clicks** — `.gallery-modal` was `display:flex` even when hidden, and lacked `pointer-events:none` | Medium | Added `pointer-events: none` to default state, `pointer-events: auto` only when `.is-open` | Click elements behind where modal would be; they should respond normally |
| 6 | **No skip-to-content link** — keyboard users had to tab through entire pinned hero | Medium | Added `.skip-link` targeting `#value` section, visible on focus | Press Tab on page load, skip link appears and jumps past hero |
| 7 | **No focus trap in gallery modal** — Tab key could escape to background elements | Medium | Added Tab/Shift+Tab trap cycling between focusable elements inside modal | Open modal, press Tab repeatedly — focus stays within modal |
| 8 | **Focus not restored after modal close** — previously focused element lost on Esc/close | Low | Store `lastFocused` on open, restore on close | Open modal from gallery item 3, close, verify focus returns to item 3 |

## Quick Customization (via CONFIG)

All tuning values live in the `CONFIG` object at the top of `script.js`:

### Swap Images
```js
CONFIG.bg1Url     = 'images/your-bg1.jpg';
CONFIG.bg2Url     = 'images/your-bg2.jpg';
CONFIG.bg3Url     = 'images/your-bg3.jpg';
CONFIG.logoUrl    = 'images/your-logo.png';
CONFIG.fgLeftUrl  = 'images/your-fg-left.png';
CONFIG.fgRightUrl = 'images/your-fg-right.png';
```

### Change Hero Text
Edit directly in `index.html` (`#text1`, `#text2`, `#text3`) or override in CONFIG:
```js
CONFIG.text1 = 'Your Headline';
CONFIG.text2 = 'Your Subhead';
CONFIG.text3 = 'Your Tagline';
```

### Adjust Scroll Length & Feel
```js
CONFIG.scrollLength   = 3600;  // total pin distance (px). Higher = slower scrub.
CONFIG.scrubSmoothing = 1.2;   // scrub inertia (s). Higher = more floaty.
```

### Tune Zoom Scales
```js
CONFIG.bg1Start = 1.00;  CONFIG.bg1End = 1.26;   // BG1 zoom range
CONFIG.bg2Start = 1.15;  CONFIG.bg2End = 1.30;   // BG2 (match bg1 at crossfade)
CONFIG.bg3Start = 1.04;  CONFIG.bg3End = 1.10;   // BG3 final settle
```

### Foreground Split Distance
```js
CONFIG.splitDesktop = 300;  // px at >= 1024px viewport
CONFIG.splitMobile  = 140;  // px at <= 768px viewport
```

### Gallery Behavior
```js
CONFIG.galleryDragFriction  = 0.92;  // 0-1, higher = more slide
CONFIG.gallerySnapThreshold = 3;     // px/frame to stop
CONFIG.galleryCurve         = true;  // 3D perspective curvature
```

### Brand Colors
Edit CSS custom properties in `style.css`:
```css
:root {
  --bg:         #080706;    /* page background */
  --surface:    #100f0d;    /* card backgrounds */
  --text:       #f4efe9;    /* body text */
  --muted:      #a89e93;    /* secondary text */
  --gold:       #c9a96e;    /* accent / CTA */
  --gold-light: #dfc089;    /* accent hover */
}
```

### Fonts
Replace in the Google Fonts `<link>` in `index.html` and update:
```css
--serif: 'Your Serif Font', Georgia, serif;
--sans:  'Your Sans Font', system-ui, sans-serif;
```

## Browser Support

- Chrome 90+, Firefox 90+, Safari 15+, Edge 90+
- Mobile: iOS Safari 15+, Chrome Android 90+
- Graceful degradation for `prefers-reduced-motion` (skips to final hero state, disables all animations)

## Dependencies

- [GSAP 3.12.5](https://greensock.com/gsap/) + ScrollTrigger (loaded via CDN)
- [Playfair Display](https://fonts.google.com/specimen/Playfair+Display) + [Inter](https://fonts.google.com/specimen/Inter) (Google Fonts)
