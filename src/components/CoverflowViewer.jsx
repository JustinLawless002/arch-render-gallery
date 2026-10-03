import { useEffect, useRef } from 'react';

// Coverflow image viewer used inside every lightbox (brand carousel
// lightbox, case-study zoom). Same feel as the Projects gallery carousel
// (BrandCarousel.jsx): the current image sits flat in the middle, its
// neighbours turn inward on either side, and you can
//   • drag / swipe (with a little momentum on a fast flick),
//   • click or tap a side image to bring it to the front,
//   • press ← / → while the lightbox is open.
// Loops endlessly when there are 3+ images.
//
// Props:
//   images        [{ src, alt }]
//   index         the image that should be in front (controlled)
//   onIndexChange called with the new front index while moving
//   onBackdrop    called on a plain click that misses every image (close)

const SETTINGS = {
  rotate: 45, // degrees each neighbouring image turns
  depth: 0.55, // how far each step pushes an image back, in box widths
  //   (big lightbox images need this, or their outer edge swings out at you)
  spacing: 0.82, // gap between image centres, in stage-box widths
  perspective: 1400,
  ease: 9, // higher = snappier
  flick: 0.25, // seconds of momentum after a fast swipe
  visibleRange: 2.2, // images further than this from the front aren't drawn
};

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export default function CoverflowViewer({ images, index = 0, onIndexChange, onBackdrop, label = 'Images' }) {
  const stageRef = useRef(null);
  const slideRefs = useRef([]);
  const engine = useRef({ pos: index, target: index });
  const reported = useRef(index);
  const cb = useRef({});
  cb.current = { onIndexChange, onBackdrop };

  const n = images.length;
  const loop = n > 2;
  const wrap = (x) => ((x % n) + n) % n;
  const offsetOf = (i, pos) => {
    if (!loop) return i - pos;
    let o = wrap(i - pos);
    if (o > n / 2) o -= n;
    return o;
  };
  const fit = (t) => (loop ? t : clamp(t, 0, n - 1));
  const helpers = useRef({});
  helpers.current = { wrap, offsetOf, fit };

  // Parent picked an image (e.g. a thumbnail) → glide there the short way.
  useEffect(() => {
    if (index === reported.current) return;
    const e = engine.current;
    const { offsetOf: off, fit: f } = helpers.current;
    e.target = f(Math.round(e.target) + off(index, Math.round(e.target)));
    reported.current = index;
  }, [index]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || n === 0) return;
    const e = engine.current;
    let boxW = stage.offsetWidth || 800;
    let lastDrawn = NaN;
    const ro = new ResizeObserver(() => {
      boxW = slideRefs.current[0]?.offsetWidth || stage.offsetWidth;
      lastDrawn = NaN;
    });
    ro.observe(stage);
    boxW = slideRefs.current[0]?.offsetWidth || boxW;

    const goTo = (t) => (e.target = helpers.current.fit(t));

    let down = null;
    const onPointerDown = (ev) => {
      if (ev.button !== 0) return;
      down = { x: ev.clientX, y: ev.clientY, pos: e.pos, dragging: false, samples: [], id: ev.pointerId };
    };
    const onPointerMove = (ev) => {
      if (!down || ev.pointerId !== down.id || n < 2) return;
      const dx = ev.clientX - down.x;
      if (!down.dragging) {
        if (Math.abs(dx) < 6) return;
        if (Math.abs(ev.clientY - down.y) > Math.abs(dx)) return (down = null);
        down.dragging = true;
        down.x = ev.clientX;
        stage.setPointerCapture(ev.pointerId);
        stage.classList.add('is-dragging');
      }
      let p = down.pos - (ev.clientX - down.x) / (boxW * SETTINGS.spacing);
      if (!loop) p = clamp(p, -0.3, n - 0.7);
      e.pos = e.target = p;
      const now = performance.now();
      down.samples.push({ t: now, p });
      while (down.samples.length > 2 && now - down.samples[0].t > 100) down.samples.shift();
    };
    const onPointerUp = (ev) => {
      if (!down || ev.pointerId !== down.id) return;
      const d = down;
      down = null;
      stage.classList.remove('is-dragging');
      if (d.dragging) {
        const s = d.samples;
        const v = s.length > 1 ? (s[s.length - 1].p - s[0].p) / Math.max((s[s.length - 1].t - s[0].t) / 1000, 0.016) : 0;
        goTo(Math.round(e.pos + clamp(v * SETTINGS.flick, -3, 3)));
        return;
      }
      // A plain click: side image → bring it forward; empty space → close.
      const img = ev.target.closest?.('.cfv-slide img');
      if (!img) {
        cb.current.onBackdrop?.();
        return;
      }
      const i = Number(img.closest('.cfv-slide').dataset.index);
      const o = helpers.current.offsetOf(i, e.pos);
      if (Math.abs(o) >= 0.5) goTo(Math.round(e.pos + o));
    };
    const onPointerCancel = () => {
      down = null;
      stage.classList.remove('is-dragging');
      e.target = helpers.current.fit(Math.round(e.pos));
    };
    const onKey = (ev) => {
      if (n < 2) return;
      if (ev.key === 'ArrowRight') goTo(Math.round(e.target) + 1);
      if (ev.key === 'ArrowLeft') goTo(Math.round(e.target) - 1);
    };

    stage.addEventListener('pointerdown', onPointerDown);
    stage.addEventListener('pointermove', onPointerMove);
    stage.addEventListener('pointerup', onPointerUp);
    stage.addEventListener('pointercancel', onPointerCancel);
    window.addEventListener('keydown', onKey);

    const draw = () => {
      const { rotate, depth, spacing, visibleRange } = SETTINGS;
      slideRefs.current.forEach((el, i) => {
        if (!el) return;
        const o = helpers.current.offsetOf(i, e.pos);
        const a = Math.abs(o);
        if (a > visibleRange) {
          if (el.style.visibility !== 'hidden') el.style.visibility = 'hidden';
          return;
        }
        el.style.visibility = 'visible';
        el.style.transform =
          `translate(-50%, -50%) translate3d(${o * boxW * spacing}px, 0, ${-depth * boxW * a}px) ` +
          `rotateY(${clamp(-rotate * o, -80, 80)}deg)`;
        el.style.zIndex = String(100 - Math.round(a * 10));
        el.style.opacity = String(clamp(1.6 - a * 0.6, 0, 1));
        el.style.filter = a < 0.02 ? 'none' : `brightness(${1 - clamp(a, 0, 1) * 0.6})`;
        el.classList.toggle('is-active', a < 0.5);
      });
      const idx = helpers.current.wrap(Math.round(e.pos));
      if (idx !== reported.current) {
        reported.current = idx;
        cb.current.onIndexChange?.(idx);
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
      if (e.pos !== lastDrawn) {
        draw();
        lastDrawn = e.pos;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      stage.removeEventListener('pointerdown', onPointerDown);
      stage.removeEventListener('pointermove', onPointerMove);
      stage.removeEventListener('pointerup', onPointerUp);
      stage.removeEventListener('pointercancel', onPointerCancel);
      window.removeEventListener('keydown', onKey);
    };
  }, [n, loop]);

  return (
    <div className={`cfv${n > 1 ? ' cfv--many' : ''}`} ref={stageRef} role="group" aria-roledescription="carousel" aria-label={label}>
      <style>{`
        .cfv {
          --cfv-w: min(64vw, 1280px);
          --cfv-h: min(64vh, 860px);
          position: relative;
          width: 100%;
          height: var(--cfv-h);
          perspective: ${SETTINGS.perspective}px;
          touch-action: pan-y;
          user-select: none;
          -webkit-user-select: none;
          -webkit-tap-highlight-color: transparent;
        }
        .cfv--many { cursor: grab; }
        .cfv.is-dragging, .cfv.is-dragging * { cursor: grabbing !important; }
        .cfv-slide {
          position: absolute; left: 50%; top: 50%;
          width: var(--cfv-w); height: var(--cfv-h);
          display: flex; align-items: center; justify-content: center;
          pointer-events: none; /* only the picture itself is clickable */
          visibility: hidden; /* until the first frame places it */
          will-change: transform;
          backface-visibility: hidden;
        }
        .cfv-slide img {
          max-width: 100%; max-height: 100%; object-fit: contain; display: block;
          border: 1px solid var(--line);
          pointer-events: auto;
          -webkit-user-drag: none;
        }
        .cfv--many .cfv-slide:not(.is-active) img { cursor: pointer; }
        @media (max-width: 640px) {
          .cfv { --cfv-w: 84vw; --cfv-h: 52vh; }
        }
      `}</style>
      {images.map((im, i) => (
        <div className="cfv-slide" key={`${im.src}-${i}`} data-index={i} ref={(el) => (slideRefs.current[i] = el)}>
          <img src={im.src} alt={im.alt || ''} draggable="false" decoding="async" />
        </div>
      ))}
    </div>
  );
}
