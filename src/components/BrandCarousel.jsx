import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import brandDescriptionsRaw from '../data/brand-descriptions.txt?raw';

// Slow, continuously scrolling row of client/brand logos, placed right
// under the "Projects gallery" heading. Auto-discovers every image in
// src/assets/images/brands/ at build time (same import.meta.glob pattern
// works.js uses for renders) — drop a new logo in that folder and it
// appears here automatically, no manual registration.
//
// A brand can also have a src/assets/images/brands/render/ set — up to a
// few images named `<brand-slug>-01.jpg`, `-02.jpg`, etc. When present,
// hovering the tile cycles through them as a quick crossfading preview,
// and clicking opens a full-size viewer for all of them. A brand with no
// render set yet just shows its static logo, as before — nothing to
// click, nothing to hover-cycle, so partially-filled render folders never
// look broken.
const brandModules = import.meta.glob('../assets/images/brands/*.{png,jpg,jpeg,webp}', {
  eager: true,
  import: 'default',
});
const renderModules = import.meta.glob('../assets/images/brands/render/*.{png,jpg,jpeg,webp}', {
  eager: true,
  import: 'default',
});

function slugFromPath(p) {
  return p.split('/').pop().replace(/\.(png|jpe?g|webp)$/i, '');
}

function nameFromSlug(slug) {
  return slug
    .split(/[-_]/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ');
}

// Parses src/data/brand-descriptions.txt — see that file for the format
// and how to edit it. "[slug]" starts a brand's block (must match its logo
// filename minus the extension); "Title:" on the line right after sets
// the heading; everything after that, up to the next "[slug]" or end of
// file, is the description (blank lines become paragraph breaks). Lines
// starting with "#" are comments and are ignored wherever they appear.
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
      if (t === '') continue; // blank lines before the title are ignored
      const m = t.match(/^Title:\s*(.*)$/i);
      if (m) {
        title = m[1].trim();
        titleFound = true;
        continue;
      }
      titleFound = true; // no "Title:" line present — this line starts the body instead
    }
    body.push(line);
  }
  flush();
  return blocks;
}

const brandText = parseBrandDescriptions(brandDescriptionsRaw);

// Group render images by brand: "burger-boutique-01.jpeg" -> slug
// "burger-boutique", sorted by its trailing number.
const rendersBySlug = {};
for (const [path, src] of Object.entries(renderModules)) {
  const base = slugFromPath(path);
  const m = base.match(/^(.*)-(\d+)$/);
  if (!m) continue;
  const [, slug, num] = m;
  (rendersBySlug[slug] ??= []).push({ src, order: Number(num) });
}
for (const slug in rendersBySlug) {
  rendersBySlug[slug].sort((a, b) => a.order - b.order).forEach((r, i) => (r.order = i));
}

const brands = Object.entries(brandModules)
  .map(([path, src]) => {
    const slug = slugFromPath(path);
    const text = brandText[slug];
    return {
      id: path,
      slug,
      name: text?.title || nameFromSlug(slug),
      description: text?.description || null,
      src,
      renders: (rendersBySlug[slug] || []).map((r) => r.src),
    };
  })
  .sort((a, b) => a.name.localeCompare(b.name));

// A plain, small, in-strip tile. It never resizes or moves relative to the
// strip anymore — the enlarged preview is a separate fixed element
// (BrandPreviewStage below), so there's nothing here to drift with the
// scroll and then snap back. isCenterSource only tints the border, purely
// as a hint of which small tile the big preview is currently showing.
function BrandTile({ brand, isCenterSource, onOpen }) {
  const hasRenders = brand.renders.length > 0;
  return (
    <div
      className={`brand-tile${hasRenders ? ' has-renders' : ''}${isCenterSource ? ' is-center-source' : ''}`}
      onClick={() => hasRenders && onOpen(brand)}
      role={hasRenders ? 'button' : undefined}
      tabIndex={hasRenders ? 0 : undefined}
      onKeyDown={(e) => {
        if (hasRenders && (e.key === 'Enter' || e.key === ' ')) onOpen(brand);
      }}
      aria-label={hasRenders ? `View ${brand.name} renders` : brand.name}
    >
      <img src={brand.src} alt={brand.name} loading="lazy" className="brand-tile__logo" />
    </div>
  );
}

// The big preview. Rendered once, absolutely centered inside the carousel
// and never repositioned — it does not travel with the scrolling strip at
// all. Only its *content* changes: whichever brand is currently at the
// strip's center is the one shown here.
function BrandPreviewStage({ brand, onOpen }) {
  const hasRenders = !!brand && brand.renders.length > 0;

  if (!brand) return null;

  return (
    <div
      // key remounts this box whenever the brand changes, which is what
      // lets the CSS fade-in animation below replay for each new brand.
      key={brand.slug}
      className={`brand-preview-stage${hasRenders ? ' has-renders' : ''}`}
      onClick={() => hasRenders && onOpen(brand)}
      role={hasRenders ? 'button' : undefined}
      aria-label={hasRenders ? `View ${brand.name} renders` : brand.name}
    >
      <img src={brand.src} alt={brand.name} className="brand-preview-stage__logo" />
      {/* Only the first render image, not a cycling set — cycling through
          all of them caused a visible flicker each time the interval
          swapped images. The rest of a brand's renders are still there in
          the click-to-open lightbox, just not auto-cycled here. */}
      {hasRenders && (
        <img
          src={brand.renders[0]}
          alt=""
          aria-hidden="true"
          className="brand-preview-stage__render"
          style={{ opacity: 1 }}
        />
      )}
      {/* Logo watermark over the thumbnail: mix-blend-mode: screen makes
          black contribute nothing and only the logo's light linework add
          brightness on top of the thumbnail underneath — the "add"-style
          compositing that was asked for (CSS's closest standard
          equivalent is screen/plus-lighter, not a mode literally named
          "add"). Only when there's a thumbnail to blend with. */}
      {hasRenders && (
        <img
          src={brand.src}
          alt=""
          aria-hidden="true"
          className="brand-preview-stage__logo-overlay"
        />
      )}
    </div>
  );
}

function BrandLightbox({ brand, onClose }) {
  const [index, setIndex] = useState(0);
  const renders = brand.renders;
  const paragraphs = brand.description ? brand.description.split(/\n{2,}/) : [];

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setIndex((i) => (i + 1) % renders.length);
      if (e.key === 'ArrowLeft') setIndex((i) => (i - 1 + renders.length) % renders.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [renders.length, onClose]);

  const prevIndex = (index - 1 + renders.length) % renders.length;
  const nextIndex = (index + 1) % renders.length;

  // Swipe (mobile replacement for the arrows, which are hidden below
  // 640px): a simple swipe-to-switch on the image itself, not a
  // drag-follows-finger — just measure the total movement between
  // touchstart and touchend and switch one image if it was clearly more
  // horizontal than vertical.
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
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
      setIndex(dx < 0 ? nextIndex : prevIndex);
    }
  };

  // Portaled to document.body: .brand-carousel keeps overflow:hidden (to
  // clip the scrolling track horizontally), which would otherwise clip a
  // plain fixed-position modal down to the carousel's small strip instead
  // of covering the full viewport. Portaling sidesteps that regardless of
  // whatever else this container's styling does.
  return createPortal(
    <div className="brand-lightbox" onClick={onClose}>
      <style>{`
        .brand-lightbox {
          position: fixed;
          inset: 0;
          z-index: 1000;
          background: rgba(8, 9, 9, 0.94);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 32px;
          animation: brand-lightbox-in 260ms cubic-bezier(0.16, 1, 0.3, 1);
          overflow-y: auto;
        }
        @keyframes brand-lightbox-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .brand-lightbox__row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 20px;
          width: 100%;
        }
        .brand-lightbox__stage {
          position: relative;
          max-width: 70vw;
          max-height: 68vh;
          display: flex;
          align-items: center;
          justify-content: center;
          flex: 0 1 auto;
        }
        .brand-lightbox__stage img {
          max-width: 70vw;
          max-height: 68vh;
          object-fit: contain;
          border: 1px solid var(--line);
          display: block;
        }
        .brand-lightbox__nav {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          flex: 0 0 auto;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.4);
          background: rgba(0, 0, 0, 0.45);
          color: var(--text);
          font-size: 16px;
          cursor: pointer;
        }
        .brand-lightbox__nav.prev { left: 14px; }
        .brand-lightbox__nav.next { right: 14px; }
        .brand-lightbox__side-thumb {
          flex: 0 0 auto;
          width: 84px;
          height: 84px;
          padding: 0;
          border-radius: 10px;
          border: 1px solid var(--line);
          background: var(--bg-elevated);
          overflow: hidden;
          cursor: pointer;
          opacity: 0.6;
          transition: opacity 200ms ease, border-color 200ms ease, transform 200ms ease;
        }
        .brand-lightbox__side-thumb:hover {
          opacity: 1;
          transform: scale(1.05);
        }
        .brand-lightbox__side-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .brand-lightbox__text {
          max-width: 680px;
          margin-top: 28px;
          text-align: center;
        }
        .brand-lightbox__title {
          font-family: var(--font-display);
          font-weight: 600;
          font-size: clamp(24px, 3vw, 34px);
          color: var(--accent);
          margin: 0 0 12px;
        }
        .brand-lightbox__description p {
          font-family: var(--font-body);
          font-size: 15px;
          line-height: 1.65;
          color: var(--text);
          margin: 0 0 12px;
        }
        .brand-lightbox__description p:last-child {
          margin-bottom: 0;
        }
        .brand-lightbox__close {
          position: fixed;
          top: 20px;
          right: 24px;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.4);
          background: rgba(0, 0, 0, 0.3);
          color: var(--text);
          font-size: 18px;
          cursor: pointer;
          z-index: 1;
        }
        @media (max-width: 900px) {
          .brand-lightbox__side-thumb { display: none; }
        }
        @media (max-width: 640px) {
          .brand-lightbox__stage img { max-width: 90vw; max-height: 50vh; }
          .brand-lightbox__nav { display: none; }
        }
        .brand-lightbox__mobile-thumbs {
          display: none;
        }
        @media (max-width: 640px) {
          .brand-lightbox__mobile-thumbs {
            display: flex;
            gap: 10px;
            justify-content: center;
            margin-top: 14px;
          }
          .brand-lightbox__mobile-thumbs button {
            width: 58px;
            height: 58px;
            padding: 0;
            border-radius: 10px;
            border: 1px solid var(--line);
            background: var(--bg-elevated);
            overflow: hidden;
            cursor: pointer;
            opacity: 0.55;
            transition: opacity 160ms ease, border-color 160ms ease;
          }
          .brand-lightbox__mobile-thumbs button.is-active {
            opacity: 1;
            border-color: var(--accent);
          }
          .brand-lightbox__mobile-thumbs img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
          }
        }
      `}</style>

      <button type="button" className="brand-lightbox__close" onClick={onClose} aria-label="Close">
        ✕
      </button>

      <div className="brand-lightbox__row" onClick={(e) => e.stopPropagation()}>
        {renders.length > 1 && (
          <button
            type="button"
            className="brand-lightbox__side-thumb"
            onClick={() => setIndex(prevIndex)}
            aria-label="Previous image"
          >
            <img src={renders[prevIndex]} alt="" aria-hidden="true" />
          </button>
        )}

        <div className="brand-lightbox__stage" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          <img src={renders[index]} alt={`${brand.name} — image ${index + 1}`} />
          {/* Arrows overlay the image itself (not shown at all below
              640px — a swipe on the image, plus the thumbnail row below
              it, replace them on phones instead). */}
          {renders.length > 1 && (
            <button
              type="button"
              className="brand-lightbox__nav prev"
              onClick={() => setIndex(prevIndex)}
              aria-label="Previous image"
            >
              &lt;
            </button>
          )}
          {renders.length > 1 && (
            <button
              type="button"
              className="brand-lightbox__nav next"
              onClick={() => setIndex(nextIndex)}
              aria-label="Next image"
            >
              &gt;
            </button>
          )}
        </div>

        {renders.length > 1 && (
          <button
            type="button"
            className="brand-lightbox__side-thumb"
            onClick={() => setIndex(nextIndex)}
            aria-label="Next image"
          >
            <img src={renders[nextIndex]} alt="" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Mobile-only equivalent of the side-thumbnails above (those are
          hidden below 900px) — all of the brand's images in one row under
          the main one, with the current one highlighted, rather than just
          a prev/next pair (which read as confusing — only two thumbnails
          for four images looked like there were only two more to see). */}
      {renders.length > 1 && (
        <div className="brand-lightbox__mobile-thumbs" onClick={(e) => e.stopPropagation()}>
          {renders.map((src, i) => (
            <button
              key={src}
              type="button"
              className={i === index ? 'is-active' : ''}
              onClick={() => setIndex(i)}
              aria-label={`Image ${i + 1}`}
            >
              <img src={src} alt="" aria-hidden="true" />
            </button>
          ))}
        </div>
      )}

      <div className="brand-lightbox__text" onClick={(e) => e.stopPropagation()}>
        <div className="brand-lightbox__title">{brand.name}</div>
        {paragraphs.length > 0 && (
          <div className="brand-lightbox__description">
            {paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

export default function BrandCarousel() {
  const [open, setOpen] = useState(null);
  const [centerTrackIdx, setCenterTrackIdx] = useState(0);
  const carouselRef = useRef(null);
  const trackRef = useRef(null);
  const stageAnchorRef = useRef(null);
  const pausedRef = useRef(false);
  const offsetRef = useRef(0);
  const wheelVelocityRef = useRef(0);
  const lastCenterIdxRef = useRef(-1);
  const containerWidthRef = useRef(0);
  const tileWidthRef = useRef(0);

  // Auto-scroll speed as a fraction of the carousel's own width per
  // second, so it feels the same on a phone and a wide monitor. 0.06 = the
  // "increase by about 400%" setting from an earlier 0.012 baseline.
  const WIDTH_FRACTION_PER_SEC = 0.06;
  // Each wheel event moves the strip roughly deltaY * this many px in
  // total, spread over a smooth decelerating glide (see the tick loop)
  // instead of being applied in one instant jump.
  const WHEEL_SENSITIVITY = 1.2;
  // How quickly wheel momentum dies off (per second). Higher = stops
  // sooner/stiffer, lower = longer glide. ~7 settles in about 0.4s.
  const WHEEL_FRICTION = 7;
  const MAX_WHEEL_VELOCITY = 6000; // px/s cap so a big flick can't fling it absurdly far

  useEffect(() => {
    // ResizeObserver instead of a one-time measure() + window 'resize'
    // listener: on mobile, clientWidth read at mount can land before the
    // browser's own layout has fully settled (address-bar collapse, etc.),
    // and nothing else changes window size while just scrolling, so a
    // plain resize listener never fires to correct that first bad reading.
    const measure = () => {
      containerWidthRef.current = carouselRef.current?.clientWidth || containerWidthRef.current;
      tileWidthRef.current = trackRef.current?.firstElementChild?.offsetWidth || tileWidthRef.current;
    };
    const ro = new ResizeObserver(measure);
    if (carouselRef.current) ro.observe(carouselRef.current);
    measure();

    // Wheel control, listening on the tile band AND the big preview that
    // sits on top of its middle — the preview covers part of the strip, so
    // without this the center of the carousel would be a dead zone. Real
    // (non-passive) DOM listeners rather than React's onWheel, so
    // preventDefault reliably stops the page from scrolling; React and
    // most browsers treat wheel listeners as passive by default, which
    // would silently ignore preventDefault().
    const onWheel = (e) => {
      e.preventDefault();
      const v = wheelVelocityRef.current - e.deltaY * WHEEL_SENSITIVITY * WHEEL_FRICTION;
      wheelVelocityRef.current = Math.max(-MAX_WHEEL_VELOCITY, Math.min(MAX_WHEEL_VELOCITY, v));
    };
    let lastTouchEndTime = 0;
    const onEnter = () => {
      // Touch devices fire a synthetic "mouseenter" for compatibility right
      // after a real touch ends, with no matching "mouseleave" to follow —
      // without this guard, that phantom event would re-pause the carousel
      // permanently after the very first swipe, since nothing would ever
      // clear it again.
      if (performance.now() - lastTouchEndTime < 500) return;
      pausedRef.current = true;
    };
    const onLeave = () => { pausedRef.current = false; };
    const hoverTargets = [trackRef.current, stageAnchorRef.current].filter(Boolean);
    hoverTargets.forEach((el) => {
      el.addEventListener('wheel', onWheel, { passive: false });
      el.addEventListener('mouseenter', onEnter);
      el.addEventListener('mouseleave', onLeave);
    });

    // Touch/swipe — mobile has no wheel, so this is its equivalent. A
    // one-finger drag moves the strip 1:1 with the finger; releasing it
    // feeds the last moment's speed into the same wheelVelocityRef
    // momentum/decay the wheel already uses, so a flick glides to a stop
    // instead of just halting. Only commits to a horizontal drag once the
    // gesture is clearly more horizontal than vertical — otherwise it
    // leaves the touch alone so the page can still scroll normally.
    let touchDeciding = false;
    let touchIsHorizontal = false;
    let startX = 0;
    let startY = 0;
    let lastX = 0;
    let lastTime = 0;
    let lastVelocity = 0;

    const onTouchStart = (e) => {
      const t = e.touches[0];
      startX = lastX = t.clientX;
      startY = t.clientY;
      lastTime = performance.now();
      lastVelocity = 0;
      touchDeciding = true;
      touchIsHorizontal = false;
      pausedRef.current = true;
    };
    const onTouchMove = (e) => {
      const t = e.touches[0];
      if (touchDeciding) {
        const dxTotal = t.clientX - startX;
        const dyTotal = t.clientY - startY;
        if (Math.abs(dxTotal) < 8 && Math.abs(dyTotal) < 8) return; // not enough movement to tell yet
        touchDeciding = false;
        touchIsHorizontal = Math.abs(dxTotal) > Math.abs(dyTotal);
        if (!touchIsHorizontal) {
          pausedRef.current = false; // a vertical scroll gesture — let the page handle it, resume auto-scroll
          return;
        }
      }
      if (!touchIsHorizontal) return;
      e.preventDefault(); // only once committed to a horizontal drag, so vertical page scroll isn't blocked otherwise
      const now = performance.now();
      const dx = t.clientX - lastX;
      const dt = Math.max((now - lastTime) / 1000, 0.001);
      offsetRef.current += dx;
      lastVelocity = dx / dt;
      lastX = t.clientX;
      lastTime = now;
    };
    const onTouchEnd = () => {
      lastTouchEndTime = performance.now();
      pausedRef.current = false;
      if (touchIsHorizontal) {
        wheelVelocityRef.current = Math.max(-MAX_WHEEL_VELOCITY, Math.min(MAX_WHEEL_VELOCITY, lastVelocity));
      }
      touchDeciding = false;
      touchIsHorizontal = false;
    };
    hoverTargets.forEach((el) => {
      el.addEventListener('touchstart', onTouchStart, { passive: true });
      el.addEventListener('touchmove', onTouchMove, { passive: false });
      el.addEventListener('touchend', onTouchEnd);
      el.addEventListener('touchcancel', onTouchEnd);
    });
    // Belt-and-suspenders: a touch that started on one of the elements
    // above keeps receiving its touchmove/touchend there even if the
    // finger drifts outside it (standard "implicit capture" touch
    // behavior), so the listeners above should always see the matching
    // touchend. This window-level fallback, in the capture phase so it
    // runs before anything below could stop the event, guarantees the
    // pause clears even in the rare case that doesn't happen — a stuck
    // "permanently paused" carousel is a worse failure than a redundant
    // listener.
    window.addEventListener('touchend', onTouchEnd, true);
    window.addEventListener('touchcancel', onTouchEnd, true);

    let raf;
    let last = performance.now();
    const tick = (now) => {
      const dt = Math.min((now - last) / 1000, 0.1); // clamp so a backgrounded tab doesn't lurch on return
      last = now;
      const trackEl = trackRef.current;
      if (trackEl) {
        if (!pausedRef.current) {
          offsetRef.current -= containerWidthRef.current * WIDTH_FRACTION_PER_SEC * dt;
        }
        // Wheel momentum: applied every frame and decayed exponentially,
        // so one wheel notch becomes a short smooth glide, not a jump.
        // Independent of the hover-pause flag — hovering pauses the
        // *automatic* drift, not the user's own input.
        if (wheelVelocityRef.current !== 0) {
          offsetRef.current += wheelVelocityRef.current * dt;
          wheelVelocityRef.current *= Math.exp(-WHEEL_FRICTION * dt);
          if (Math.abs(wheelVelocityRef.current) < 1) wheelVelocityRef.current = 0;
        }

        const singleSetWidth = trackEl.scrollWidth / 2; // track holds two copies back to back
        if (singleSetWidth > 0) {
          // Wraps seamlessly in either direction — wheel can push the
          // offset forward or backward.
          while (offsetRef.current <= -singleSetWidth) offsetRef.current += singleSetWidth;
          while (offsetRef.current > 0) offsetRef.current -= singleSetWidth;

          // Which rendered tile currently sits under the carousel's fixed
          // horizontal center — pure arithmetic from the current offset
          // and measured tile size, not a per-frame DOM pass over every
          // tile. Only touches React state when the answer changes.
          const slotWidth = singleSetWidth / brands.length;
          const raw = Math.round(
            (containerWidthRef.current / 2 - offsetRef.current - tileWidthRef.current / 2) / slotWidth
          );
          const doubled = brands.length * 2;
          const idx = ((raw % doubled) + doubled) % doubled;
          if (idx !== lastCenterIdxRef.current) {
            lastCenterIdxRef.current = idx;
            setCenterTrackIdx(idx);
          }
        }
        trackEl.style.transform = `translateX(${offsetRef.current}px)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      hoverTargets.forEach((el) => {
        el.removeEventListener('wheel', onWheel);
        el.removeEventListener('mouseenter', onEnter);
        el.removeEventListener('mouseleave', onLeave);
        el.removeEventListener('touchstart', onTouchStart);
        el.removeEventListener('touchmove', onTouchMove);
        el.removeEventListener('touchend', onTouchEnd);
        el.removeEventListener('touchcancel', onTouchEnd);
      });
      window.removeEventListener('touchend', onTouchEnd, true);
      window.removeEventListener('touchcancel', onTouchEnd, true);
    };
  }, []);

  if (brands.length === 0) return null;

  // Duplicated once so the strip can loop seamlessly: the loop above wraps
  // the offset by exactly one copy's width, so the second copy lines up
  // pixel-for-pixel with the first at the wrap point.
  const track = [...brands, ...brands];
  const previewBrand = brands[centerTrackIdx % brands.length];

  return (
    <div className="brand-carousel" ref={carouselRef}>
      <style>{`
        .brand-carousel {
          position: relative;
          width: 100%;
          overflow: hidden;
          /* Room for the fixed preview to sit centered without being
             clipped by this container's own overflow:hidden, which is
             still needed to hide the looping strip horizontally. All
             dimensions here are the previous set scaled down 15%, per
             request, keeping the same proportions/clearances. */
          padding: 187px 0;
          margin: 0 0 75px;
        }
        /* Fade-to-background at each edge — a plain decorative overlay
           (not a mask-image on the whole container) because CSS masking
           also blocks hover/click events on whatever it covers. */
        .brand-carousel__fade {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 109px;
          pointer-events: none;
          z-index: 20;
        }
        .brand-carousel__fade--left {
          left: 0;
          background: linear-gradient(to right, var(--bg), transparent);
        }
        .brand-carousel__fade--right {
          right: 0;
          background: linear-gradient(to left, var(--bg), transparent);
        }
        .brand-carousel__track {
          display: flex;
          align-items: center;
          width: max-content;
          gap: 34px;
          /* Tells the browser upfront that horizontal gestures here are
             ours to handle, not its own native pan/scroll — without this,
             a fast or long horizontal swipe can let the browser's native
             touch-scroll machinery partially engage before our JS finishes
             claiming the gesture, which was silently swallowing the
             touchend event on exactly those swipes. pan-y still leaves
             vertical scrolling to the browser natively. */
          touch-action: pan-y;
        }
        .brand-tile {
          position: relative;
          flex: 0 0 auto;
          width: 177px;
          height: 177px;
          border-radius: 20px;
          border: 1px solid var(--line);
          overflow: hidden;
          background: var(--bg-elevated);
          transition: border-color 400ms ease;
        }
        .brand-tile.has-renders { cursor: pointer; }
        /* No transform, no size change — just a border tint, so the small
           tile can never drift or snap relative to the strip. */
        .brand-tile.is-center-source { border-color: var(--accent); }
        .brand-tile__logo {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: contain;
          display: block;
        }

        /* The fixed preview. The anchor never moves and never animates,
           so nothing here can drift with the scroll; only the box inside
           it (remounted per brand) fades/grows in. */
        .brand-preview-anchor {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 530px;
          height: 530px;
          transform: translate(-50%, -50%);
          z-index: 10;
          touch-action: pan-y;
        }
        .brand-preview-stage {
          position: relative;
          width: 100%;
          height: 100%;
          border-radius: 61px;
          border: 1px solid var(--accent);
          overflow: hidden;
          background: var(--bg-elevated);
          animation: brand-preview-in 650ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .brand-preview-stage.has-renders { cursor: pointer; }
        @keyframes brand-preview-in {
          from { opacity: 0; scale: 0.94; }
          to { opacity: 1; scale: 1; }
        }
        .brand-preview-stage__logo,
        .brand-preview-stage__render,
        .brand-preview-stage__logo-overlay {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: contain;
          display: block;
        }
        .brand-preview-stage__render {
          object-fit: cover;
          opacity: 0;
          /* No longer cycling/crossfading between multiple images (that
             caused a flicker each swap) — just the one static render
             image now, fading in once via the parent's own mount
             animation. This transition is harmless leftover for opacity
             changes but nothing currently triggers one. */
          transition: opacity 700ms ease;
        }
        .brand-preview-stage__logo-overlay {
          mix-blend-mode: screen;
          pointer-events: none;
        }
        @media (max-width: 560px) {
          .brand-carousel {
            /* Mobile scaled down an additional 50% on top of the desktop
               reduction, per request. */
            padding: 88px 0;
            margin: 0 0 46px;
          }
          .brand-carousel__fade { width: 64px; }
          .brand-carousel__track { gap: 20px; }
          .brand-tile { width: 84px; height: 84px; }
          .brand-preview-anchor { width: 252px; height: 252px; }
          .brand-preview-stage { border-radius: 29px; }
        }
      `}</style>
      <div className="brand-carousel__fade brand-carousel__fade--left" aria-hidden="true" />
      <div className="brand-carousel__fade brand-carousel__fade--right" aria-hidden="true" />
      <div className="brand-carousel__track" ref={trackRef}>
        {track.map((b, i) => (
          <BrandTile brand={b} key={`${b.id}-${i}`} isCenterSource={i === centerTrackIdx} onOpen={setOpen} />
        ))}
      </div>
      <div className="brand-preview-anchor" ref={stageAnchorRef}>
        <BrandPreviewStage brand={previewBrand} onOpen={setOpen} />
      </div>

      {open && <BrandLightbox brand={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
