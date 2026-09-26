import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

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
    return {
      id: path,
      slug,
      name: nameFromSlug(slug),
      src,
      renders: (rendersBySlug[slug] || []).map((r) => r.src),
    };
  })
  .sort((a, b) => a.name.localeCompare(b.name));

function BrandTile({ brand, onOpen }) {
  const [hoverIndex, setHoverIndex] = useState(-1); // -1 = showing the static logo
  const timerRef = useRef(null);
  const hasRenders = brand.renders.length > 0;

  const startCycle = () => {
    if (!hasRenders) return;
    let i = 0;
    setHoverIndex(0);
    timerRef.current = setInterval(() => {
      i = (i + 1) % brand.renders.length;
      setHoverIndex(i);
    }, 900);
  };
  const stopCycle = () => {
    clearInterval(timerRef.current);
    setHoverIndex(-1);
  };
  useEffect(() => () => clearInterval(timerRef.current), []);

  return (
    <div
      className={`brand-tile${hasRenders ? ' has-renders' : ''}`}
      onMouseEnter={startCycle}
      onMouseLeave={stopCycle}
      onClick={() => hasRenders && onOpen(brand)}
      role={hasRenders ? 'button' : undefined}
      tabIndex={hasRenders ? 0 : undefined}
      onKeyDown={(e) => {
        if (hasRenders && (e.key === 'Enter' || e.key === ' ')) onOpen(brand);
      }}
      aria-label={hasRenders ? `View ${brand.name} renders` : brand.name}
    >
      <img src={brand.src} alt={brand.name} loading="lazy" className="brand-tile__logo" />
      {hasRenders &&
        brand.renders.map((src, i) => (
          <img
            key={src}
            src={src}
            alt=""
            aria-hidden="true"
            className="brand-tile__render"
            style={{ opacity: hoverIndex === i ? 1 : 0 }}
          />
        ))}
      {/* Logo watermark over the cycling thumbnails: mix-blend-mode:
          screen makes black contribute nothing and only the logo's light
          linework add brightness on top of whatever thumbnail is showing
          — the same "add"-style compositing the request asked for (CSS's
          closest standard equivalent is screen/plus-lighter, not a mode
          literally named "add"). Only shown while cycling — at rest there
          is nothing underneath for it to blend with. */}
      {hasRenders && (
        <img
          src={brand.src}
          alt=""
          aria-hidden="true"
          className="brand-tile__logo-overlay"
          style={{ opacity: hoverIndex === -1 ? 0 : 1 }}
        />
      )}
    </div>
  );
}

function BrandLightbox({ brand, onClose }) {
  const [index, setIndex] = useState(0);
  const renders = brand.renders;

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setIndex((i) => (i + 1) % renders.length);
      if (e.key === 'ArrowLeft') setIndex((i) => (i - 1 + renders.length) % renders.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [renders.length, onClose]);

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
        }
        @keyframes brand-lightbox-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .brand-lightbox__stage {
          position: relative;
          max-width: 86vw;
          max-height: 70vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .brand-lightbox__stage img {
          max-width: 86vw;
          max-height: 70vh;
          object-fit: contain;
          border: 1px solid var(--line);
        }
        .brand-lightbox__title {
          margin-top: 18px;
          font-family: var(--font-display);
          font-size: 15px;
          color: var(--accent);
        }
        .brand-lightbox__thumbs {
          display: flex;
          gap: 10px;
          margin-top: 16px;
        }
        .brand-lightbox__thumbs button {
          width: 56px;
          height: 56px;
          padding: 0;
          border-radius: 8px;
          border: 1px solid var(--line);
          background: var(--bg-elevated);
          overflow: hidden;
          cursor: pointer;
          opacity: 0.55;
          transition: opacity 160ms ease, border-color 160ms ease;
        }
        .brand-lightbox__thumbs button.is-active {
          opacity: 1;
          border-color: var(--accent);
        }
        .brand-lightbox__thumbs img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .brand-lightbox__nav {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.4);
          background: rgba(0, 0, 0, 0.3);
          color: var(--text);
          font-size: 16px;
          cursor: pointer;
        }
        .brand-lightbox__nav.prev { left: -56px; }
        .brand-lightbox__nav.next { right: -56px; }
        .brand-lightbox__close {
          position: absolute;
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
        }
        @media (max-width: 640px) {
          .brand-lightbox__nav { display: none; }
        }
      `}</style>

      <button type="button" className="brand-lightbox__close" onClick={onClose} aria-label="Close">
        ✕
      </button>

      <div className="brand-lightbox__stage" onClick={(e) => e.stopPropagation()}>
        {renders.length > 1 && (
          <button
            type="button"
            className="brand-lightbox__nav prev"
            onClick={() => setIndex((i) => (i - 1 + renders.length) % renders.length)}
            aria-label="Previous image"
          >
            ←
          </button>
        )}
        <img src={renders[index]} alt={`${brand.name} — image ${index + 1}`} />
        {renders.length > 1 && (
          <button
            type="button"
            className="brand-lightbox__nav next"
            onClick={() => setIndex((i) => (i + 1) % renders.length)}
            aria-label="Next image"
          >
            →
          </button>
        )}
      </div>

      <div className="brand-lightbox__title">{brand.name}</div>

      {renders.length > 1 && (
        <div className="brand-lightbox__thumbs" onClick={(e) => e.stopPropagation()}>
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
    </div>,
    document.body
  );
}

export default function BrandCarousel() {
  const [open, setOpen] = useState(null);
  const carouselRef = useRef(null);
  const trackRef = useRef(null);
  const pausedRef = useRef(false);
  // Speed as a fraction of the carousel's own width per second, not a
  // fixed pixel count — a fixed px/s moves the SAME absolute distance
  // regardless of screen size, but a phone screen shows far less of the
  // row at once, so that same distance is a much bigger fraction of what's
  // visible: identical px/s reads as crawling on desktop and sprinting on
  // a narrow phone. Scaling by the container's own width keeps the
  // fraction-of-screen-per-second constant instead, so the felt speed
  // matches across screen sizes. Re-measured on resize (device rotation,
  // window resize), not just once on mount.
  const WIDTH_FRACTION_PER_SEC = 0.012; // 1.2% of the carousel's width, per second
  const containerWidthRef = useRef(0);

  useEffect(() => {
    const measure = () => {
      containerWidthRef.current = carouselRef.current?.clientWidth || 0;
    };
    measure();
    window.addEventListener('resize', measure);

    let raf;
    let last = performance.now();
    let offset = 0;
    const tick = (now) => {
      const dt = (now - last) / 1000;
      last = now;
      const track = trackRef.current;
      if (track && !pausedRef.current) {
        const singleSetWidth = track.scrollWidth / 2; // track holds two copies back to back
        const pxPerSec = containerWidthRef.current * WIDTH_FRACTION_PER_SEC;
        offset -= pxPerSec * dt;
        if (singleSetWidth > 0 && offset <= -singleSetWidth) {
          offset += singleSetWidth; // wraps seamlessly — the duplicate copy lines up exactly
        }
        track.style.transform = `translateX(${offset}px)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', measure);
    };
  }, []);

  if (brands.length === 0) return null;

  // Duplicated once so the strip can loop seamlessly: the JS loop above
  // wraps the offset by exactly one copy's width, so the second copy lines
  // up pixel-for-pixel with the first at the wrap point.
  const track = [...brands, ...brands];

  return (
    <div
      className="brand-carousel"
      ref={carouselRef}
      onMouseEnter={() => { pausedRef.current = true; }}
      onMouseLeave={() => { pausedRef.current = false; }}
    >
      <style>{`
        .brand-carousel {
          position: relative;
          width: 100%;
          overflow: hidden;
          /* Extra vertical room so a tile scaled up 3x on hover has space
             to grow into without getting clipped by this container's own
             overflow:hidden (which is still needed to hide the looping
             duplicate strip horizontally) — the tile is centered in this
             taller band rather than sitting flush at a fixed height. */
          padding: 116px 0;
          margin: -116px 0 -68px;
        }
        /* Fade-to-background at each edge — previously a mask-image on
           this whole container, which (undocumented but real) also makes
           Chromium stop delivering hover/click events to anything sitting
           in the masked-out region, so the first and last tile's hover
           and pause-on-hover silently never fired. These are plain
           decorative overlays instead: pointer-events:none keeps them
           purely visual, so every tile underneath — edge ones included —
           gets real hover and click events. */
        .brand-carousel__fade {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 64px;
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
          gap: 20px;
        }
        .brand-tile {
          position: relative;
          flex: 0 0 auto;
          width: 104px;
          height: 104px;
          border-radius: 12px;
          border: 1px solid var(--line);
          overflow: hidden;
          background: var(--bg-elevated);
          transition: transform 650ms cubic-bezier(0.16, 1, 0.3, 1), border-color 400ms ease;
        }
        .brand-tile.has-renders {
          cursor: pointer;
        }
        /* 300% = scale to 3x. Applies to every tile, not just ones with
           renders yet, so hovering still feels alive on brands that only
           have a logo so far. z-index lifts the hovered tile above its
           now-overlapped neighbors, since transform doesn't reflow them. */
        .brand-tile:hover,
        .brand-tile:focus-visible {
          transform: scale(3);
          border-color: var(--accent);
          z-index: 10;
          outline: none;
        }
        .brand-tile__logo,
        .brand-tile__render,
        .brand-tile__logo-overlay {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: contain;
          display: block;
        }
        .brand-tile__render {
          object-fit: cover;
          opacity: 0;
          transition: opacity 420ms ease;
        }
        .brand-tile__logo-overlay {
          object-fit: contain;
          mix-blend-mode: screen;
          opacity: 0;
          pointer-events: none;
          transition: opacity 420ms ease;
        }
        @media (max-width: 560px) {
          .brand-carousel {
            padding: 92px 0;
            margin: -92px 0 -44px;
          }
          .brand-tile { width: 84px; height: 84px; }
        }
      `}</style>
      <div className="brand-carousel__fade brand-carousel__fade--left" aria-hidden="true" />
      <div className="brand-carousel__fade brand-carousel__fade--right" aria-hidden="true" />
      <div className="brand-carousel__track" ref={trackRef}>
        {track.map((b, i) => (
          <BrandTile brand={b} key={`${b.id}-${i}`} onOpen={setOpen} />
        ))}
      </div>

      {open && <BrandLightbox brand={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
