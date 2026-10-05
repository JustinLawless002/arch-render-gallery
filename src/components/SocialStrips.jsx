import { useEffect, useRef } from 'react';
import RevealLines from './RevealLines.jsx';

/**
 * "Design explorations" (AI image feed) — an endless, draggable canvas of scattered images.
 *
 * Images sit on three depth layers (back / mid / front). Each layer moves at
 * a different speed, which gives the 3D feel without any 3D library. The
 * canvas drifts slowly on its own; visitors can drag/flick it in any
 * direction (horizontal swipe on phones, so page scrolling still works).
 * Whenever a tile wraps around off-screen it picks up the next image, so
 * the collage keeps changing. Clicking an image glides it to the centre and
 * enlarges it (uncropped, sharper copy loaded on demand); click again, drag,
 * or press Esc to put it back.
 *
 * Images: drop them into social-feed/ in the repo root; the dev server /
 * Vercel build turns them into small tiles (scripts/social-tiles.js).
 *
 * Load time: no extra libraries. No image is requested until the section is
 * about one screen away, and the animation only runs while it's on screen.
 * All movement is done with transforms outside React, so it stays smooth.
 */

// Section heading and the line under it.
const TITLE = 'Design explorations';
// Optional line under the title; leave empty ('') for none.
const SUBTITLE = '';

const INSTAGRAM_URL = 'https://www.instagram.com/praxiodesign';
const X_URL = 'https://x.com/praxiostudio';

// ---- Feel (tweak freely) -------------------------------------------------
// Idle drift speed in px per second (x, y). 0,0 = still until dragged.
const DRIFT = { x: 16, y: 7 };
// How quickly a flick slows down: closer to 1 = glides longer.
const FRICTION = 0.94;
// Mouse-hover parallax strength in px (the scene leans away from the cursor).
const HOVER_PARALLAX = 36;
// Gentle bobbing of each tile, in px.
const BOB = 6;
// Depth layers. factor = movement speed relative to a drag; size = tile
// width range in px at desktop; density = one tile per this many px² of area.
const LAYERS = [
  { name: 'back', factor: 0.5, size: [110, 150], density: 120000, z: 1 },
  { name: 'mid', factor: 0.8, size: [165, 215], density: 200000, z: 2 },
  { name: 'front', factor: 1.15, size: [235, 300], density: 360000, z: 3 },
];
// Clicked image: max share of the section's width / height it fills.
const FOCUS_MAX_W = 0.82;
const FOCUS_MAX_H = 0.74;
// Hide the whole section if there are fewer images than this.
const MIN_IMAGES = 3;
// -------------------------------------------------------------------------

const tileUrls = import.meta.glob('../assets/images/social-tiles/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
});
const manifest =
  Object.values(
    import.meta.glob('../assets/images/social-tiles/manifest.json', { eager: true, import: 'default' }),
  )[0] || {};

// Larger uncropped copies, used only when a tile is clicked (URLs only —
// nothing is downloaded until then).
const largeUrls = import.meta.glob('../assets/images/social-tiles/large/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
});
const largeByName = Object.fromEntries(
  Object.entries(largeUrls).map(([p, url]) => [p.split('/').pop(), url]),
);

const allTiles = Object.entries(tileUrls).map(([p, url]) => {
  const name = p.split('/').pop();
  return {
    name,
    url,
    large: largeByName[name] || url,
    ar: manifest[name]?.ar || 0.8,
    color: manifest[name]?.color || '#16181a',
  };
});

const rand = (a, b) => a + Math.random() * (b - a);
const mod = (a, n) => ((a % n) + n) % n;

function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function SocialStrips() {
  const sectionRef = useRef(null);
  const stageRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    if (!section || !stage) return undefined;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Images are handed out from a shuffled queue, reshuffled when used up.
    let queue = shuffle(allTiles);
    let qi = 0;
    const nextTile = () => {
      if (qi >= queue.length) {
        queue = shuffle(allTiles);
        qi = 0;
      }
      return queue[qi++];
    };

    let slots = [];
    let W = 0;
    let H = 0;
    let cellW = 0;
    let cellH = 0;
    let margin = 0;
    let near = false;
    let visible = false;
    let raf = 0;
    let lastFrame = 0;

    const cam = { x: rand(0, 5000), y: rand(0, 5000) };
    const vel = { x: 0, y: 0 };
    const hover = { x: 0, y: 0, tx: 0, ty: 0 };
    let dragging = false;
    let last = null;
    let down = null; // where the current press started (click vs drag)
    let focused = null; // slot currently zoomed to the centre
    const focusCam = { x: 0, y: 0 };

    function setImage(slot, tile) {
      slot.el.style.backgroundColor = tile.color;
      slot.img.classList.remove('is-loaded');
      slot.tile = tile;
      if (near) slot.img.src = tile.url;
    }

    // Lay out one "cell" a bit bigger than the section; every tile wraps
    // around inside it, which makes the canvas endless in every direction.
    function build() {
      stage.textContent = '';
      slots = [];
      focused = null;
      section.classList.remove('has-focus');
      W = section.clientWidth;
      H = section.clientHeight;
      const s = Math.min(1, Math.max(0.55, W / 1440));
      margin = Math.round(330 * s);
      cellW = W + 2 * margin;
      cellH = H + 2 * margin;
      const area = cellW * cellH;

      for (const L of LAYERS) {
        const n = Math.max(3, Math.round(area / (L.density * s * s)));
        // Jittered grid: one tile per randomly chosen grid cell, randomly
        // offset inside it — scattered, but without big clumps or holes.
        const cols = Math.max(1, Math.round(Math.sqrt((n * cellW) / cellH)));
        const rows = Math.ceil(n / cols);
        const cells = shuffle([...Array(cols * rows).keys()]).slice(0, n);
        for (const ci of cells) {
          const c = ci % cols;
          const r = Math.floor(ci / cols);
          const w = Math.round(rand(L.size[0], L.size[1]) * s);
          const h = Math.round(w * (Math.random() < 0.3 ? 1 : 1.25));
          const el = document.createElement('div');
          el.className = `canvas-tile canvas-tile--${L.name}`;
          el.style.width = `${w}px`;
          el.style.height = `${h}px`;
          el.style.zIndex = L.z;
          const img = document.createElement('img');
          img.alt = '';
          img.decoding = 'async';
          img.draggable = false;
          img.onload = () => img.classList.add('is-loaded');
          el.appendChild(img);
          stage.appendChild(el);
          const slot = {
            el,
            img,
            L,
            w,
            h,
            x: ((c + rand(0.08, 0.92)) / cols) * cellW,
            y: ((r + rand(0.08, 0.92)) / rows) * cellH,
            rot: rand(-4, 4),
            phase: rand(0, Math.PI * 2),
            speed: rand(0.25, 0.55),
            kx: null,
            ky: null,
            cx: 0,
            cy: 0,
            fa: 0, // 0 = resting in the collage, 1 = fully focused
          };
          setImage(slot, nextTile());
          slots.push(slot);
        }
      }
      render(performance.now());
    }

    function render(t) {
      const time = t / 1000;
      for (const s of slots) {
        const f = s.L.factor;
        const rx = s.x - cam.x * f;
        const ry = s.y - cam.y * f;
        const kx = Math.floor((rx + margin) / cellW);
        const ky = Math.floor((ry + margin) / cellH);
        // Wrapped round the edge (while off-screen) → swap in a new image.
        if (s.kx !== null && (kx !== s.kx || ky !== s.ky)) setImage(s, nextTile());
        s.kx = kx;
        s.ky = ky;
        const rest = 1 - s.fa;
        const bob = reduce ? 0 : Math.sin(time * s.speed + s.phase) * BOB * f * rest;
        s.cx = mod(rx + margin, cellW) - margin;
        s.cy = mod(ry + margin, cellH) - margin;
        const x = s.cx + hover.x * f * rest;
        const y = s.cy + hover.y * f * rest + bob;
        // translate(-50%,-50%) keeps the tile centred while its size animates.
        s.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%) rotate(${(s.rot * rest).toFixed(2)}deg)`;
      }
    }

    function frame(t) {
      const dt = Math.min(0.05, lastFrame ? (t - lastFrame) / 1000 : 0.016);
      lastFrame = t;
      if (focused) {
        // Glide the camera so the clicked tile ends up dead centre.
        const k = Math.min(1, dt * 5);
        cam.x += (focusCam.x - cam.x) * k;
        cam.y += (focusCam.y - cam.y) * k;
      } else if (!dragging) {
        const k = Math.pow(FRICTION, dt * 60);
        vel.x *= k;
        vel.y *= k;
        const d = reduce ? 0 : 1;
        cam.x += (vel.x + DRIFT.x * d) * dt;
        cam.y += (vel.y + DRIFT.y * d) * dt;
      }
      const e = Math.min(1, dt * 3);
      hover.x += (hover.tx - hover.x) * e;
      hover.y += (hover.ty - hover.y) * e;
      const fk = Math.min(1, dt * 6);
      for (const s of slots) {
        const target = s === focused ? 1 : 0;
        if (s.fa !== target) s.fa = Math.abs(target - s.fa) < 0.001 ? target : s.fa + (target - s.fa) * fk;
      }
      render(t);
      raf = requestAnimationFrame(frame);
    }

    function start() {
      if (raf || !visible || document.hidden) return;
      lastFrame = 0;
      raf = requestAnimationFrame(frame);
    }
    function stop() {
      cancelAnimationFrame(raf);
      raf = 0;
    }

    // ---- Pointer: drag / flick, plus hover parallax on desktop ----
    // ---- Click to focus ----
    function focusSlot(s) {
      if (focused) unfocus();
      focused = s;
      vel.x = 0;
      vel.y = 0;
      const f = s.L.factor;
      focusCam.x = cam.x + (s.cx - W / 2) / f;
      focusCam.y = cam.y + (s.cy - H / 2) / f;
      // Grow to the image's real (uncropped) shape.
      const ar = s.tile.ar;
      const fw = Math.min(W * FOCUS_MAX_W, H * FOCUS_MAX_H * ar);
      s.el.style.width = `${Math.round(fw)}px`;
      s.el.style.height = `${Math.round(fw / ar)}px`;
      s.el.style.zIndex = 9;
      s.el.classList.add('is-focused');
      section.classList.add('has-focus');
      // Swap in the sharp version once it has downloaded.
      const tile = s.tile;
      const pre = new Image();
      pre.onload = () => {
        if (s.tile === tile) s.img.src = tile.large;
      };
      pre.src = tile.large;
    }
    function unfocus() {
      const s = focused;
      if (!s) return;
      focused = null;
      s.el.style.width = `${s.w}px`;
      s.el.style.height = `${s.h}px`;
      s.el.classList.remove('is-focused');
      section.classList.remove('has-focus');
      // Drop back under the front layer once it has shrunk.
      setTimeout(() => {
        if (focused !== s) s.el.style.zIndex = s.L.z;
      }, 500);
    }
    function onKey(e) {
      if (e.key === 'Escape') unfocus();
    }

    function onDown(e) {
      if (e.button !== 0 || e.target.closest('a')) return;
      down = { x: e.clientX, y: e.clientY, t: performance.now(), tile: e.target.closest('.canvas-tile') };
      dragging = true;
      last = { x: e.clientX, y: e.clientY, t: performance.now() };
      vel.x = 0;
      vel.y = 0;
      section.classList.add('is-dragging', 'has-dragged');
      try { section.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    }
    function onMove(e) {
      if (e.pointerType === 'mouse') {
        const r = section.getBoundingClientRect();
        hover.tx = -((e.clientX - r.left) / r.width - 0.5) * HOVER_PARALLAX;
        hover.ty = -((e.clientY - r.top) / r.height - 0.5) * HOVER_PARALLAX;
      }
      if (!dragging) return;
      // Not a drag until it has moved a few px (so clicks don't nudge it).
      if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 6) return;
      if (down) {
        down = null;
        unfocus();
      }
      const now = performance.now();
      const dx = e.clientX - last.x;
      const dy = e.clientY - last.y;
      const dts = Math.max(0.008, (now - last.t) / 1000);
      cam.x -= dx;
      cam.y -= dy;
      vel.x = Math.max(-3000, Math.min(3000, vel.x * 0.7 + (-dx / dts) * 0.3));
      vel.y = Math.max(-3000, Math.min(3000, vel.y * 0.7 + (-dy / dts) * 0.3));
      last = { x: e.clientX, y: e.clientY, t: now };
      if (!raf) render(now);
    }
    function onUp(e) {
      if (!dragging) return;
      dragging = false;
      if (down && e.type === 'pointerup') {
        // A click: focus the tile under it, or close if it's the focused one
        // (or empty space).
        const el = down.tile;
        const s = el && slots.find((x) => x.el === el);
        down = null;
        section.classList.remove('is-dragging');
        if (s && s !== focused) focusSlot(s);
        else unfocus();
        return;
      }
      down = null;
      // Finger/mouse paused before letting go → no flick.
      if (performance.now() - last.t > 90) {
        vel.x = 0;
        vel.y = 0;
      }
      section.classList.remove('is-dragging');
    }
    function onLeave() {
      hover.tx = 0;
      hover.ty = 0;
    }

    section.addEventListener('pointerdown', onDown);
    section.addEventListener('pointermove', onMove);
    section.addEventListener('pointerup', onUp);
    section.addEventListener('pointercancel', onUp);
    section.addEventListener('pointerleave', onLeave);
    window.addEventListener('keydown', onKey);

    // ---- Lazy loading + only animating while on screen ----
    const nearObs = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        near = true;
        for (const s of slots) s.img.src = s.tile.url;
        nearObs.disconnect();
      },
      { rootMargin: '100% 0px' },
    );
    const visObs = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else {
        stop();
        if (focused) {
          unfocus();
          for (const s of slots) s.fa = 0;
        }
      }
    });
    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener('visibilitychange', onVisibility);

    let resizeTimer;
    let lastW = 0;
    const ro = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        // Ignore height-only changes (mobile address bar showing/hiding).
        if (Math.abs(section.clientWidth - lastW) < 2) return;
        lastW = section.clientWidth;
        build();
      }, 150);
    });

    lastW = section.clientWidth;
    build();
    nearObs.observe(section);
    visObs.observe(section);
    ro.observe(section);

    return () => {
      stop();
      clearTimeout(resizeTimer);
      nearObs.disconnect();
      visObs.disconnect();
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      section.removeEventListener('pointerdown', onDown);
      section.removeEventListener('pointermove', onMove);
      section.removeEventListener('pointerup', onUp);
      section.removeEventListener('pointercancel', onUp);
      section.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  if (allTiles.length < MIN_IMAGES) return null;

  return (
    <section ref={sectionRef} className="studio-canvas" id="studio-feed" aria-label={TITLE}>
      <style>{`
        .studio-canvas {
          position: relative;
          height: clamp(520px, 80vh, 880px);
          overflow: hidden;
          cursor: grab;
          user-select: none;
          -webkit-user-select: none;
          /* Phones: horizontal swipes move the canvas, vertical ones still
             scroll the page. */
          touch-action: pan-y;
        }
        .studio-canvas.is-dragging { cursor: grabbing; }
        .studio-canvas__stage {
          position: absolute;
          inset: 0;
        }
        .canvas-tile {
          position: absolute;
          top: 0;
          left: 0;
          overflow: hidden;
          border-radius: 2px;
          will-change: transform;
          cursor: zoom-in;
          transition:
            width 650ms cubic-bezier(0.16, 1, 0.3, 1),
            height 650ms cubic-bezier(0.16, 1, 0.3, 1),
            box-shadow 400ms ease;
        }
        .studio-canvas.is-dragging .canvas-tile { cursor: grabbing; }
        .canvas-tile.is-focused {
          cursor: zoom-out;
          box-shadow: 0 40px 90px rgba(0, 0, 0, 0.75);
        }
        .canvas-tile--front { box-shadow: 0 24px 50px rgba(0, 0, 0, 0.5); }
        .canvas-tile--mid { box-shadow: 0 14px 30px rgba(0, 0, 0, 0.4); }
        .canvas-tile img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0;
          transition: opacity 800ms ease, filter 400ms ease;
          pointer-events: none;
        }
        .canvas-tile img.is-loaded { opacity: 1; }
        /* Depth: further back = darker, softer, less colour. */
        .canvas-tile--back img { filter: brightness(0.42) saturate(0.55) blur(1.2px); }
        .canvas-tile--mid img { filter: brightness(0.7) saturate(0.8); }
        .canvas-tile--front img { filter: brightness(0.94); }
        .studio-canvas:not(.is-dragging) .canvas-tile:hover img {
          filter: brightness(1.05) saturate(1);
        }
        /* While one image is focused, everything else sinks back. */
        .studio-canvas.has-focus .canvas-tile:not(.is-focused) img {
          filter: brightness(0.22) saturate(0.4) blur(2px);
        }
        .studio-canvas .canvas-tile.is-focused img,
        .studio-canvas .canvas-tile.is-focused:hover img {
          filter: none;
        }

        /* Fade the canvas into the page at the top and bottom. */
        .studio-canvas::after {
          content: '';
          position: absolute;
          inset: 0;
          z-index: 5;
          pointer-events: none;
          background:
            linear-gradient(180deg, var(--bg) 0%, rgba(13, 15, 16, 0) 22%, rgba(13, 15, 16, 0) 80%, var(--bg) 100%);
        }

        .studio-canvas__head {
          position: absolute;
          top: 48px;
          left: var(--page-gutter, 48px);
          right: var(--page-gutter, 48px);
          z-index: 10;
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 8px 24px;
          pointer-events: none;
        }
        .studio-canvas__title {
          font-family: var(--font-display);
          font-size: clamp(28px, 4vw, 44px);
          font-weight: 600;
          letter-spacing: -0.01em;
          margin: 0;
          text-shadow: 0 2px 24px rgba(0, 0, 0, 0.6);
        }
        .studio-canvas__sub {
          margin: 10px 0 0;
          max-width: 34ch;
          font-size: clamp(13px, 1.1vw, 15px);
          line-height: 1.5;
          color: var(--text-dim);
          text-shadow: 0 2px 16px rgba(0, 0, 0, 0.8);
        }
        .studio-canvas__links {
          display: flex;
          gap: 20px;
          font-family: var(--font-mono);
          font-size: 12px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          pointer-events: auto;
        }
        .studio-canvas__links a {
          color: var(--text-dim);
          text-decoration: none;
          transition: color 200ms ease;
        }
        .studio-canvas__links a:hover { color: var(--text); }

        .studio-canvas__hint {
          position: absolute;
          left: 50%;
          bottom: 36px;
          z-index: 10;
          transform: translateX(-50%);
          padding: 8px 14px;
          border: 1px solid rgba(255, 255, 255, 0.18);
          border-radius: 999px;
          background: rgba(13, 15, 16, 0.55);
          backdrop-filter: blur(6px);
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--text-dim);
          pointer-events: none;
          transition: opacity 500ms ease;
        }
        .studio-canvas.has-dragged .studio-canvas__hint { opacity: 0; }
        .studio-canvas.has-focus .studio-canvas__head { opacity: 0; }
        .studio-canvas__head { transition: opacity 400ms ease; }

        @media (max-width: 560px) {
          .studio-canvas { height: 72vh; min-height: 480px; }
          .studio-canvas__head { top: 32px; left: 24px; right: 24px; }
        }
      `}</style>

      <div ref={stageRef} className="studio-canvas__stage" aria-hidden="true" />

      <div className="studio-canvas__head">
        <div>
          <RevealLines as="h2" className="studio-canvas__title" text={TITLE} />
          {SUBTITLE && <p className="studio-canvas__sub">{SUBTITLE}</p>}
        </div>
        <div className="studio-canvas__links">
          <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">Instagram ↗</a>
          <a href={X_URL} target="_blank" rel="noopener noreferrer">X ↗</a>
        </div>
      </div>

      <div className="studio-canvas__hint">Drag to explore · click to view</div>
    </section>
  );
}
