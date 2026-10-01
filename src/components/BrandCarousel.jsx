import { memo, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import brandDescriptionsRaw from '../data/brand-descriptions.txt?raw';
import SectionLink from './SectionLink.jsx';

// Brand carousel on the homepage, right under the "Projects gallery"
// heading: a 3D "coverflow" (centre slide flat, neighbours turned
// inward), looping endlessly in both directions.
//
// Auto-discovers every logo in src/assets/images/brands/ — drop a new
// logo there and it appears automatically. Each brand can have a render
// set: originals in brands/render-raw/ named <brand-slug>-01.jpg, -02.jpg…,
// shrunk into brands/render/ by `npm run process-images`; clicking
// the front slide opens those in the lightbox, with the title/description
// from src/data/brand-descriptions.txt.
//
// Slide images come from brands/tiles/<slug>.webp (first render + logo,
// pre-shrunk by `npm run process-images`). A brand without a tile yet
// still works — its tile is built in the browser instead — but re-run
// that script after adding a brand so visitors get the small file.
//
// Motion: one continuous position, eased every frame, so drag/swipe,
// ← → keys (while hovered) and autoplay all glide and then settle on the
// nearest slide. The mouse wheel is deliberately NOT captured — scrolling
// over the carousel scrolls the page as normal.

// Knobs worth playing with while testing.
const SETTINGS = {
  rotate: 50, // degrees each neighbouring slide turns (Swiper demo: 50)
  depth: 100, // px each step pushes a slide back (demo: 100)
  spacing: 1, // gap between slide centres, in slide widths (1 = touching like the demo)
  perspective: 1200, // px — lower = more dramatic 3D
  shadows: true, // darken the turned-away edge of side slides
  ease: 9, // how quickly motion catches up — higher = snappier, lower = floatier
  flick: 0.25, // how far a fast swipe keeps going (seconds of momentum)
  autoplayDelay: 3500, // ms between automatic moves; 0 = off
  previewSize: 900, // px — size the tile images are shrunk to (lightbox still uses full size)
  visibleRange: 3.4, // slides further than this from the centre aren't drawn at all
};

// ── Data: same auto-discovery as BrandCarousel.jsx ──────────────────
const brandModules = import.meta.glob('../assets/images/brands/*.{png,jpg,jpeg,webp}', {
  eager: true,
  import: 'default',
});
const renderModules = import.meta.glob('../assets/images/brands/render/*.{png,jpg,jpeg,webp}', {
  eager: true,
  import: 'default',
});

const tileModules = import.meta.glob('../assets/images/brands/tiles/*.webp', {
  eager: true,
  import: 'default',
});

const slugFromPath = (p) => p.split('/').pop().replace(/\.(png|jpe?g|webp)$/i, '');
const nameFromSlug = (slug) =>
  slug
    .split(/[-_]/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ');

// Same format rules as BrandCarousel's parser (see brand-descriptions.txt).
function parseBrandDescriptions(raw) {
  const blocks = {};
  let slug = null;
  let title = null;
  let titleFound = false;
  let body = [];
  const flush = () => {
    if (!slug) return;
    const description = body.join('\n').trim().replace(/\n{3,}/g, '\n\n');
    blocks[slug] = { title, description: description || null };
  };
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    const section = t.match(/^\[(.+)\]$/);
    if (section) {
      flush();
      slug = section[1].trim().toLowerCase();
      title = null;
      titleFound = false;
      body = [];
      continue;
    }
    if (!slug || t.startsWith('#')) continue;
    if (!titleFound) {
      if (t === '') continue;
      const m = t.match(/^Title:\s*(.*)$/i);
      if (m) {
        title = m[1].trim();
        titleFound = true;
        continue;
      }
      titleFound = true;
    }
    body.push(line);
  }
  flush();
  return blocks;
}

const brandText = parseBrandDescriptions(brandDescriptionsRaw);

const rendersBySlug = {};
for (const [path, src] of Object.entries(renderModules)) {
  const m = slugFromPath(path).match(/^(.*)-(\d+)$/);
  if (!m) continue;
  (rendersBySlug[m[1]] ??= []).push({ src, order: Number(m[2]) });
}

const brands = Object.entries(brandModules)
  .map(([path, src]) => {
    const slug = slugFromPath(path);
    const text = brandText[slug];
    return {
      slug,
      name: text?.title || nameFromSlug(slug),
      description: text?.description || null,
      src,
      tile: tileModules[`../assets/images/brands/tiles/${slug}.webp`] || null,
      renders: (rendersBySlug[slug] || []).sort((a, b) => a.order - b.order).map((r) => r.src),
    };
  })
  .sort((a, b) => a.name.localeCompare(b.name));

// ── Tile images ──────────────────────────────────────────────────────
// The render photos are ~2750px wide (the lightbox wants them that big),
// but a tile is at most ~400px. Squeezing full-size photos into moving
// 3D tiles — plus blending the logo on top live, every frame — is what
// made mobile stutter. So each tile image is made ONCE when the page
// loads: render cropped square, logo blended on with "screen" (same look
// as the live preview), shrunk to SETTINGS.previewSize, kept in memory.
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function makeTileImage(brand, size) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  const logo = await loadImage(brand.src);
  if (brand.renders.length > 0) {
    const r = await loadImage(brand.renders[0]);
    const s = Math.max(size / r.width, size / r.height); // "cover" crop
    ctx.drawImage(r, (size - r.width * s) / 2, (size - r.height * s) / 2, r.width * s, r.height * s);
    ctx.globalCompositeOperation = 'screen';
  }
  const ls = Math.min(size / logo.width, size / logo.height); // "contain"
  ctx.drawImage(logo, (size - logo.width * ls) / 2, (size - logo.height * ls) / 2, logo.width * ls, logo.height * ls);
  const blob = await new Promise((res) => canvas.toBlob(res, 'image/webp', 0.88));
  return URL.createObjectURL(blob);
}

// ── Slides ───────────────────────────────────────────────────────────
// React draws the slides once (plus once more per finished tile image).
// All movement is written straight to each slide's style from the
// animation loop below — no React re-render per frame.
const Slides = memo(function Slides({ tiles, slideRefs }) {
  return brands.map((b, i) => (
    <div
      className={`cf-slide${b.renders.length ? ' has-renders' : ''}`}
      key={b.slug}
      data-index={i}
      ref={(el) => (slideRefs.current[i] = el)}
    >
      {tiles[b.slug] ? (
        <img src={tiles[b.slug]} alt={b.name} draggable="false" />
      ) : (
        <img src={b.src} alt={b.name} draggable="false" className="cf-slide__logo-only" />
      )}
      {SETTINGS.shadows && (
        <>
          <div className="cf-shade cf-shade--l" />
          <div className="cf-shade cf-shade--r" />
        </>
      )}
    </div>
  ));
});

const n = brands.length;
const wrap = (x) => ((x % n) + n) % n;
// Signed distance of slide i from the centre, taking the shortest way
// round the loop — this is what makes it endless in both directions.
const offsetOf = (i, pos) => {
  let o = wrap(i - pos);
  if (o > n / 2) o -= n;
  return o;
};
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export default function BrandCarousel() {
  const stageRef = useRef(null);
  const slideRefs = useRef([]);
  const engine = useRef({ pos: 0, target: 0 });
  const openRef = useRef(null);
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(null);
  const [tiles, setTiles] = useState(() =>
    Object.fromEntries(brands.filter((b) => b.tile).map((b) => [b.slug, b.tile]))
  );
  openRef.current = open;

  // A tile image arriving re-renders the slides, which resets their
  // classes — ask the loop to redraw once so the front slide keeps its border.
  useEffect(() => {
    engine.current.dirty = true;
  }, [tiles]);

  // Fallback only: build tiles in the browser for any brand that doesn't
  // have a pre-made one yet (centre-first so the visible ones land first).
  useEffect(() => {
    let cancelled = false;
    const urls = [];
    const order = brands.map((_, i) => i).filter((i) => !brands[i].tile).sort((a, b) => Math.abs(offsetOf(a, 0)) - Math.abs(offsetOf(b, 0)));
    (async () => {
      for (const i of order) {
        const b = brands[i];
        try {
          const url = await makeTileImage(b, SETTINGS.previewSize);
          if (cancelled) return URL.revokeObjectURL(url);
          urls.push(url);
          setTiles((t) => ({ ...t, [b.slug]: url }));
        } catch {
          // leave the plain logo showing for this brand
        }
      }
    })();
    return () => {
      cancelled = true;
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const e = engine.current;
    let inView = true;
    let slideW = slideRefs.current[0]?.offsetWidth || 300;
    let lastActive = -1;
    let lastDrawnPos = NaN;
    let lastInteraction = performance.now();
    let hovered = false;

    const ro = new ResizeObserver(() => {
      slideW = slideRefs.current[0]?.offsetWidth || slideW;
      lastDrawnPos = NaN; // force a redraw at the new size
    });
    ro.observe(stage);
    // Only autoplay (and spend frames) while the carousel is on screen.
    const io = new IntersectionObserver(([entry]) => (inView = entry.isIntersecting));
    io.observe(stage);

    const touched = () => (lastInteraction = performance.now());
    const goTo = (t) => {
      e.target = t;
      touched();
    };

    // ── Drag / swipe (mouse and touch via pointer events). A press that
    // barely moves counts as a click: front slide → open it, side slide
    // → bring it to the front.
    let down = null;
    const onPointerDown = (ev) => {
      if (ev.button !== 0 || openRef.current) return;
      down = { x: ev.clientX, y: ev.clientY, pos: e.pos, dragging: false, samples: [], id: ev.pointerId };
    };
    const onPointerMove = (ev) => {
      if (!down || ev.pointerId !== down.id) return;
      const dx = ev.clientX - down.x;
      if (!down.dragging) {
        if (Math.abs(dx) < 6) return;
        if (Math.abs(ev.clientY - down.y) > Math.abs(dx)) return (down = null); // vertical — let the page scroll
        down.dragging = true;
        down.x = ev.clientX; // start from here so it doesn't lurch 6px
        stage.setPointerCapture(ev.pointerId);
        stage.classList.add('is-dragging');
      }
      e.pos = e.target = down.pos - (ev.clientX - down.x) / (slideW * SETTINGS.spacing);
      const now = performance.now();
      down.samples.push({ t: now, p: e.pos });
      while (down.samples.length > 2 && now - down.samples[0].t > 100) down.samples.shift();
      touched();
    };
    const onPointerUp = (ev) => {
      if (!down || ev.pointerId !== down.id) return;
      const d = down;
      down = null;
      stage.classList.remove('is-dragging');
      if (d.dragging) {
        const s = d.samples;
        const v = s.length > 1 ? (s[s.length - 1].p - s[0].p) / Math.max((s[s.length - 1].t - s[0].t) / 1000, 0.016) : 0;
        goTo(Math.round(e.pos + clamp(v * SETTINGS.flick, -4, 4)));
        return;
      }
      const slide = ev.target.closest?.('.cf-slide');
      if (!slide) return;
      const i = Number(slide.dataset.index);
      const o = offsetOf(i, e.pos);
      if (Math.abs(o) < 0.5) {
        if (brands[i].renders.length) setOpen(brands[i]);
      } else {
        goTo(Math.round(e.pos + o));
      }
    };
    const onPointerCancel = () => {
      down = null;
      stage.classList.remove('is-dragging');
      e.target = Math.round(e.pos);
    };
    const onEnter = (ev) => ev.pointerType === 'mouse' && (hovered = true);
    const onLeave = (ev) => ev.pointerType === 'mouse' && (hovered = false);

    const onKey = (ev) => {
      if (openRef.current) return; // the lightbox has its own ← →
      if (!hovered || !inView) return; // only while the pointer is over the carousel
      if (ev.target.closest?.('input, textarea, [contenteditable]')) return;
      if (ev.key === 'ArrowRight') goTo(Math.round(e.target) + 1);
      if (ev.key === 'ArrowLeft') goTo(Math.round(e.target) - 1);
    };

    stage.addEventListener('pointerdown', onPointerDown);
    stage.addEventListener('pointermove', onPointerMove);
    stage.addEventListener('pointerup', onPointerUp);
    stage.addEventListener('pointercancel', onPointerCancel);
    stage.addEventListener('pointerenter', onEnter);
    stage.addEventListener('pointerleave', onLeave);
    window.addEventListener('keydown', onKey);

    // ── Animation loop
    const draw = () => {
      const { rotate, depth, spacing, visibleRange } = SETTINGS;
      slideRefs.current.forEach((el, i) => {
        if (!el) return;
        const o = offsetOf(i, e.pos);
        const a = Math.abs(o);
        if (a > visibleRange) {
          if (el.style.visibility !== 'hidden') el.style.visibility = 'hidden';
          return;
        }
        el.style.visibility = 'visible';
        el.style.transform =
          `translate(-50%, -50%) translate3d(${o * slideW * spacing}px, 0, ${-depth * a}px) ` +
          `rotateY(${clamp(-rotate * o, -80, 80)}deg)`;
        el.style.zIndex = String(1000 - Math.round(a * 100));
        el.classList.toggle('is-active', a < 0.5);
        if (SETTINGS.shadows) {
          // darken the edge that's turned away from you
          el.children[1].style.opacity = String(clamp(o, 0, 1) * 0.75);
          el.children[2].style.opacity = String(clamp(-o, 0, 1) * 0.75);
        }
      });
      const idx = wrap(Math.round(e.pos));
      if (idx !== lastActive) {
        lastActive = idx;
        setActive(idx);
      }
    };

    let raf;
    let last = performance.now();
    const tick = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (!down?.dragging) {
        const diff = e.target - e.pos;
        e.pos = Math.abs(diff) < 0.0005 ? e.target : e.pos + diff * (1 - Math.exp(-SETTINGS.ease * dt));
      }
      if (
        SETTINGS.autoplayDelay &&
        inView &&
        !hovered &&
        !down &&
        !openRef.current &&
        e.pos === e.target &&
        now - lastInteraction > SETTINGS.autoplayDelay
      ) {
        goTo(e.target + 1);
      }
      if (inView && (e.pos !== lastDrawnPos || e.dirty)) {
        e.dirty = false;
        draw();
        lastDrawnPos = e.pos;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      stage.removeEventListener('pointerdown', onPointerDown);
      stage.removeEventListener('pointermove', onPointerMove);
      stage.removeEventListener('pointerup', onPointerUp);
      stage.removeEventListener('pointercancel', onPointerCancel);
      stage.removeEventListener('pointerenter', onEnter);
      stage.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  if (brands.length === 0) return null;
  const current = brands[active];

  return (
    <section className="brand-carousel" aria-label="Brands">
      <style>{`
        /* Full-bleed: cancels the gallery section's side padding so the
           side slides run to the screen edge instead of being clipped. */
        .brand-carousel {
          position: relative;
          margin: 0 calc(-1 * var(--page-gutter, 24px)) 64px;
          overflow: hidden;
        }
        .cf-stage {
          --slide: min(62vw, 400px);
          position: relative;
          width: 100%;
          height: calc(var(--slide) + 100px);
          perspective: ${SETTINGS.perspective}px;
          touch-action: pan-y; /* horizontal swipes are ours, vertical still scrolls the page */
          cursor: grab;
          user-select: none;
          -webkit-user-select: none;
          -webkit-tap-highlight-color: transparent;
        }
        .cf-stage.is-dragging { cursor: grabbing; }
        .cf-slide {
          position: absolute;
          left: 50%;
          top: 50%;
          width: var(--slide);
          aspect-ratio: 1 / 1;
          border-radius: 36px;
          border: 1px solid var(--line);
          overflow: hidden;
          background: var(--bg-elevated);
          transform-style: preserve-3d;
          will-change: transform;
          backface-visibility: hidden;
          transition: border-color 400ms ease;
        }
        .cf-slide.is-active { border-color: var(--accent); }
        .cf-slide.is-active.has-renders { cursor: zoom-in; }
        .cf-stage.is-dragging .cf-slide { cursor: grabbing; }
        .cf-slide img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          pointer-events: none;
          -webkit-user-drag: none;
        }
        .cf-slide img.cf-slide__logo-only { object-fit: contain; }
        .cf-shade {
          position: absolute;
          inset: 0;
          opacity: 0;
          pointer-events: none;
        }
        .cf-shade--l { background: linear-gradient(to left, rgba(0,0,0,0.15), rgba(0,0,0,0.85)); }
        .cf-shade--r { background: linear-gradient(to right, rgba(0,0,0,0.15), rgba(0,0,0,0.85)); }

        .cf-caption { text-align: center; margin-top: 18px; min-height: 52px; padding: 0 16px; }
        .cf-caption__name {
          font-family: var(--font-display);
          font-weight: 600;
          font-size: clamp(20px, 2.4vw, 28px);
          color: var(--accent);
        }
        .cf-caption__hint { font-size: 13px; color: var(--text-dim); margin-top: 6px; }
        @media (max-width: 560px) {
          .brand-carousel { margin: 0 -24px 40px; }
          .cf-stage { --slide: 64vw; height: calc(var(--slide) + 60px); }
          .cf-slide { border-radius: 24px; }
        }
      `}</style>

      <div className="cf-stage" ref={stageRef}>
        <Slides tiles={tiles} slideRefs={slideRefs} />
      </div>

      <div className="cf-caption" aria-live="polite">
        <div className="cf-caption__name">{current?.name}</div>
        <div className="cf-caption__hint">Drag or swipe · tap the front image to open</div>
      </div>

      {open && <BrandLightbox brand={open} onClose={() => setOpen(null)} />}
    </section>
  );
}

// ── Lightbox: copy of the one in BrandCarousel.jsx ───────────────────
// (copied rather than imported so the live component file stays untouched)
function BrandLightbox({ brand, onClose }) {
  const [index, setIndex] = useState(0);
  const renders = brand.renders;
  const paragraphs = brand.description ? brand.description.split(/\n{2,}/) : [];
  const prevIndex = (index - 1 + renders.length) % renders.length;
  const nextIndex = (index + 1) % renders.length;

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setIndex((i) => (i + 1) % renders.length);
      if (e.key === 'ArrowLeft') setIndex((i) => (i - 1 + renders.length) % renders.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [renders.length, onClose]);

  const touchStartRef = useRef(null);
  const onTouchStart = (e) => {
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e) => {
    if (!touchStartRef.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartRef.current.x;
    const dy = t.clientY - touchStartRef.current.y;
    touchStartRef.current = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) setIndex(dx < 0 ? nextIndex : prevIndex);
  };

  return createPortal(
    // Any click on empty black space closes it; clicks on the images,
    // buttons or the text itself don't.
    <div
      className="brand-lightbox"
      onClick={(e) => {
        if (!e.target.closest('img, button, a, .brand-lightbox__title, .brand-lightbox__description p')) onClose();
      }}
    >
      <style>{`
        .brand-lightbox {
          position: fixed; inset: 0; z-index: 1000;
          background: rgba(8, 9, 9, 0.94);
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: 32px; overflow-y: auto;
          animation: brand-lightbox-in 260ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes brand-lightbox-in { from { opacity: 0; } to { opacity: 1; } }
        .brand-lightbox__row { display: flex; align-items: center; justify-content: center; gap: 20px; width: 100%; }
        .brand-lightbox__stage {
          position: relative; max-width: 70vw; max-height: 68vh;
          display: flex; align-items: center; justify-content: center; flex: 0 1 auto;
        }
        .brand-lightbox__stage img {
          max-width: 70vw; max-height: 68vh; object-fit: contain;
          border: 1px solid var(--line); display: block;
        }
        .brand-lightbox__nav {
          position: absolute; top: 50%; transform: translateY(-50%);
          width: 44px; height: 44px; border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.4); background: rgba(0, 0, 0, 0.45);
          color: var(--text); font-size: 16px; cursor: pointer;
        }
        .brand-lightbox__nav.prev { left: 14px; }
        .brand-lightbox__nav.next { right: 14px; }
        .brand-lightbox__side-thumb {
          flex: 0 0 auto; width: 84px; height: 84px; padding: 0; border-radius: 10px;
          border: 1px solid var(--line); background: var(--bg-elevated); overflow: hidden;
          cursor: pointer; opacity: 0.6;
          transition: opacity 200ms ease, transform 200ms ease;
        }
        .brand-lightbox__side-thumb:hover { opacity: 1; transform: scale(1.05); }
        .brand-lightbox__side-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
        /* Text block: centred on the page, text inside left-aligned, with the
           "Start a project like this" button on the right, level with the title. */
        .brand-lightbox__text {
          width: 100%; max-width: 900px; margin-top: 28px;
          display: flex; align-items: flex-start; justify-content: space-between; gap: 40px;
          text-align: left;
        }
        .brand-lightbox__copy { flex: 1 1 auto; min-width: 0; max-width: 680px; }
        .brand-lightbox__cta {
          flex: 0 0 auto; margin-top: 4px;
          display: inline-flex; align-items: center; white-space: nowrap;
          padding: 12px 22px; border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.4); background: transparent; color: var(--text);
          font-family: var(--font-body); font-size: 14px; text-decoration: none;
          transition: background 180ms ease, color 180ms ease, border-color 180ms ease;
        }
        .brand-lightbox__cta:hover { background: var(--text); color: var(--bg); border-color: var(--text); }
        @media (max-width: 640px) {
          .brand-lightbox__text { flex-direction: column; gap: 24px; }
          .brand-lightbox__cta { margin-top: 0; }
        }
        .brand-lightbox__title {
          font-family: var(--font-display); font-weight: 600;
          font-size: clamp(24px, 3vw, 34px); color: var(--accent); margin: 0 0 12px;
        }
        .brand-lightbox__description p {
          font-family: var(--font-body); font-size: 15px; line-height: 1.65;
          color: var(--text); margin: 0 0 12px;
        }
        .brand-lightbox__description p:last-child { margin-bottom: 0; }
        .brand-lightbox__close {
          position: fixed; top: 20px; right: 24px; width: 44px; height: 44px; border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.4); background: rgba(0, 0, 0, 0.3);
          color: var(--text); font-size: 18px; cursor: pointer; z-index: 1;
        }
        .brand-lightbox__mobile-thumbs { display: none; }
        @media (max-width: 900px) { .brand-lightbox__side-thumb { display: none; } }
        @media (max-width: 640px) {
          .brand-lightbox__stage img { max-width: 90vw; max-height: 50vh; }
          .brand-lightbox__nav { display: none; }
          .brand-lightbox__mobile-thumbs { display: flex; gap: 10px; justify-content: center; margin-top: 14px; }
          .brand-lightbox__mobile-thumbs button {
            width: 58px; height: 58px; padding: 0; border-radius: 10px;
            border: 1px solid var(--line); background: var(--bg-elevated); overflow: hidden;
            cursor: pointer; opacity: 0.55;
          }
          .brand-lightbox__mobile-thumbs button.is-active { opacity: 1; border-color: var(--accent); }
          .brand-lightbox__mobile-thumbs img { width: 100%; height: 100%; object-fit: cover; display: block; }
        }
      `}</style>

      <button type="button" className="brand-lightbox__close" onClick={onClose} aria-label="Close">
        ✕
      </button>

      <div className="brand-lightbox__row">
        {renders.length > 1 && (
          <button type="button" className="brand-lightbox__side-thumb" onClick={() => setIndex(prevIndex)} aria-label="Previous image">
            <img src={renders[prevIndex]} alt="" aria-hidden="true" />
          </button>
        )}
        <div className="brand-lightbox__stage" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          <img src={renders[index]} alt={`${brand.name} — image ${index + 1}`} />
          {renders.length > 1 && (
            <>
              <button type="button" className="brand-lightbox__nav prev" onClick={() => setIndex(prevIndex)} aria-label="Previous image">
                &lt;
              </button>
              <button type="button" className="brand-lightbox__nav next" onClick={() => setIndex(nextIndex)} aria-label="Next image">
                &gt;
              </button>
            </>
          )}
        </div>
        {renders.length > 1 && (
          <button type="button" className="brand-lightbox__side-thumb" onClick={() => setIndex(nextIndex)} aria-label="Next image">
            <img src={renders[nextIndex]} alt="" aria-hidden="true" />
          </button>
        )}
      </div>

      {renders.length > 1 && (
        <div className="brand-lightbox__mobile-thumbs">
          {renders.map((src, i) => (
            <button key={src} type="button" className={i === index ? 'is-active' : ''} onClick={() => setIndex(i)} aria-label={`Image ${i + 1}`}>
              <img src={src} alt={`${brand.name} image ${i + 1}`} />
            </button>
          ))}
        </div>
      )}

      <div className="brand-lightbox__text">
        <div className="brand-lightbox__copy">
          <div className="brand-lightbox__title">{brand.name}</div>
          {paragraphs.length > 0 && (
            <div className="brand-lightbox__description">
              {paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          )}
        </div>
        <SectionLink to="/#process" className="brand-lightbox__cta" onClick={onClose}>
          Get a quote for a project like this
        </SectionLink>
      </div>
    </div>,
    document.body
  );
}
