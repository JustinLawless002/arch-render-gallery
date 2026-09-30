import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Reveal from './Reveal.jsx';
import RevealLines from './RevealLines.jsx';
import SectionLink from './SectionLink.jsx';
import heroImg from '../assets/images/case-study/ofk-hero.webp'; // ofk-01, the first OFK image in the brand carousel
import logo from '../assets/images/brands/ofk.png';
import stage1 from '../assets/images/case-study/ofk-site-layout.webp'; // layout plan + existing site photos
import stage2 from '../assets/images/case-study/ofk-references.webp'; // design references + palette
import stage3 from '../assets/images/case-study/ofk-lighting.webp'; // lighting references + light & tone
import stage4 from '../assets/images/case-study/ofk-stage-04.webp'; // ofk-04.jpg (thumbnail)
// Full-size finals for the "Final render" gallery (ofk-01 … ofk-04).
import render2 from '../assets/images/case-study/ofk-render-02.webp';
import render3 from '../assets/images/case-study/ofk-render-03.webp';
import render4 from '../assets/images/case-study/ofk-render-04.webp';

// ─────────────────────────────────────────────────────────────────────
//  CASE STUDY — MOCK-UP / PLACEHOLDER (OFK)
//
//  Content is filled in; anything still marked
//  `placeholder: true` shows a small "placeholder" tag on the page until
//  you replace its text and delete that flag. Images and the clip are the
//  real OFK files already in the project — swap any of them freely.
// ─────────────────────────────────────────────────────────────────────
const CASE = {
  eyebrow: 'Case study',
  title: 'Open Flame Kitchen',
  lede: 'An upscale open-flame grill concept at Al Hamra Tower & Mall, Kuwait City, built around a theatrical show kitchen.',
  facts: [
    { label: 'Client', value: 'OFK — Open Flame Kitchen' },
    { label: 'Location', value: 'Al Hamra Tower & Mall, Kuwait City' },
    { label: 'Year', value: '2022' },
    { label: 'Scope', value: 'Interior design · rendering' },
    { label: 'Tools', value: '3ds Max · Corona' },
  ],
  story: [
    {
      heading: 'The brief',
      text: 'Create a unique visual experience to match the concept of a modern, open theatrical kitchen. With 540 m² of indoor floorspace to cover, each part had to have a coherent design without becoming repetitive.',
    },
    {
      heading: 'The challenge',
      text: 'Every area of the restaurant presented its own challenges, from the parametric curved ceiling with hidden lights to the sculpted ceiling of the VIP room. The client had a discerning eye and we went through many revisions, but the end result was the pay-off.',
    },
    {
      heading: 'The approach',
      text: 'More than most projects, this required a lot of organic forms and a precise understanding of the site’s dimensions and how everything fits together. 3ds Max modelling skills were instrumental here.',
    },
  ],
  stages: [
    { src: stage1, caption: 'Concept & layout' },
    { src: stage2, caption: 'Materials & look development' },
    { src: stage3, caption: 'Lighting & atmosphere' },
    // gallery: clicking opens a lightbox that steps through all of these
    { src: stage4, caption: 'Final render', gallery: [heroImg, render2, render3, render4] },
  ],
  clip: { src: '/videos/OFK-Habra.mp4', poster: '/videos/posters/OFK-Habra.jpg' },
  results: [
    { value: '20+', label: 'final stills delivered' },
    { value: '±35 wks', label: 'from brief to sign-off' },
    { value: '540 m²', label: 'indoor floor area' },
  ],
  // Set to an object like { text: '…', by: 'Name, role — OFK' } to show a client quote.
  quote: null,
};


function Ph({ show }) {
  return show ? <span className="cs-ph">placeholder</span> : null;
}

// Plays only while on screen, so it doesn't eat bandwidth/battery further
// down the page. Muted + playsInline so phones allow autoplay.
function AutoClip({ src, poster }) {
  const ref = useRef(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          v.preload = 'auto';
          v.play().catch(() => {});
        } else v.pause();
      },
      { threshold: 0.35 }
    );
    io.observe(v);
    return () => io.disconnect();
  }, []);
  return <video ref={ref} className="cs-clip" src={src} poster={poster} muted loop playsInline preload="none" />;
}

// Click a stage image to see it full size (the floorplan and mood board
// are too detailed to read as thumbnails). Click anywhere / Esc to close.
function Zoom({ item, onClose }) {
  const images = item.gallery || [item.src];
  const many = images.length > 1;
  const [i, setI] = useState(0);
  const go = (d) => setI((n) => (n + d + images.length) % images.length);
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (many && e.key === 'ArrowRight') go(1);
      if (many && e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, many]); // eslint-disable-line react-hooks/exhaustive-deps

  // swipe left/right on phones
  const t0 = useRef(null);
  const onTouchStart = (e) => (t0.current = { x: e.touches[0].clientX, y: e.touches[0].clientY });
  const onTouchEnd = (e) => {
    if (!t0.current || !many) return;
    const dx = e.changedTouches[0].clientX - t0.current.x;
    const dy = e.changedTouches[0].clientY - t0.current.y;
    t0.current = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
  };
  const stop = (e) => e.stopPropagation();

  return createPortal(
    <div className="cs-zoom" onClick={onClose} role="dialog" aria-label={item.caption}>
      <div className="cs-zoom__stage" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <img key={images[i]} src={images[i]} alt={`${item.caption}${many ? ` ${i + 1} of ${images.length}` : ''}`} onClick={stop} />
        {many && (
          <>
            <button type="button" className="cs-zoom__nav prev" aria-label="Previous image" onClick={(e) => { stop(e); go(-1); }}>
              ‹
            </button>
            <button type="button" className="cs-zoom__nav next" aria-label="Next image" onClick={(e) => { stop(e); go(1); }}>
              ›
            </button>
          </>
        )}
      </div>
      <div className="cs-zoom__cap">
        {item.caption}
        {many && ` · ${i + 1} / ${images.length}`}
      </div>
      {many && (
        <div className="cs-zoom__thumbs" onClick={stop}>
          {images.map((src, n) => (
            <button key={src} type="button" className={n === i ? 'is-active' : ''} onClick={() => setI(n)} aria-label={`Image ${n + 1}`}>
              <img src={src} alt="" />
            </button>
          ))}
        </div>
      )}
      <button type="button" className="cs-zoom__close" aria-label="Close">✕</button>
    </div>,
    document.body
  );
}

export default function CaseStudy() {
  const [zoom, setZoom] = useState(null);
  return (
    <section className="case-study" id="case-study" aria-label="Case study">
      <style>{`
        .case-study { padding: 96px var(--page-gutter, 48px) 64px; }
        .cs-eyebrow {
          font-family: var(--font-mono);
          font-size: 12px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--text-dim);
          margin-bottom: 8px;
        }
        .cs-title {
          font-family: var(--font-display);
          font-size: clamp(28px, 4vw, 44px);
          font-weight: 600;
          letter-spacing: -0.01em;
          margin: 0 0 12px;
        }
        .cs-lede { color: var(--text-dim); font-size: 16px; line-height: 1.6; max-width: 60ch; margin: 0 0 32px; }
        .cs-ph {
          display: inline-block;
          margin-left: 8px;
          padding: 2px 7px;
          border: 1px dashed rgba(255, 255, 255, 0.35);
          border-radius: 6px;
          font-family: var(--font-mono);
          font-size: 9.5px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--text-dim);
          vertical-align: middle;
          white-space: nowrap;
        }

        .cs-hero {
          position: relative;
          border-radius: 20px;
          overflow: hidden;
          border: 1px solid var(--line);
          aspect-ratio: 21 / 9;
          background: var(--bg-elevated);
        }
        .cs-hero img.cs-hero__img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .cs-hero::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(0, 0, 0, 0.65), rgba(0, 0, 0, 0) 55%);
        }
        .cs-hero__logo {
          position: absolute;
          z-index: 1;
          left: 28px;
          bottom: 20px;
          width: clamp(90px, 12vw, 150px);
          mix-blend-mode: screen;
        }

        .cs-facts {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 20px;
          margin: 28px 0 64px;
          padding-bottom: 28px;
          border-bottom: 1px solid var(--line);
        }
        .cs-fact dt {
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--text-dim);
          margin-bottom: 8px;
        }
        .cs-fact dd { margin: 0; font-size: 14.5px; line-height: 1.45; }

        .cs-story { display: grid; grid-template-columns: repeat(3, 1fr); gap: 40px; margin-bottom: 72px; }
        .cs-story h3 { font-family: var(--font-display); font-size: 20px; font-weight: 500; margin: 0 0 12px; }
        .cs-story p { color: var(--text-dim); font-size: 15px; line-height: 1.7; margin: 0; }

        .cs-sub {
          font-family: var(--font-display);
          font-size: clamp(22px, 2.6vw, 30px);
          font-weight: 500;
          margin: 0 0 24px;
        }
        .cs-stages { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 72px; }
        .cs-stage figure { margin: 0; }
        .cs-stage img {
          width: 100%;
          aspect-ratio: 4 / 3;
          object-fit: cover;
          border-radius: 14px;
          border: 1px solid var(--line);
          display: block;
        }
        .cs-stage__open {
          display: block;
          width: 100%;
          padding: 0;
          border: 0;
          background: none;
          cursor: zoom-in;
          border-radius: 14px;
        }
        .cs-stage__open img { transition: transform 400ms cubic-bezier(0.16, 1, 0.3, 1), border-color 200ms ease; }
        .cs-stage__open:hover img { transform: scale(1.02); border-color: rgba(255, 255, 255, 0.35); }
        .cs-zoom {
          position: fixed;
          inset: 0;
          z-index: 1000;
          background: rgba(8, 9, 9, 0.94);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          padding: 32px;
          cursor: zoom-out;
          animation: cs-zoom-in 260ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes cs-zoom-in { from { opacity: 0; } to { opacity: 1; } }
        .cs-zoom__stage { position: relative; display: flex; align-items: center; justify-content: center; }
        .cs-zoom__stage > img {
          max-width: min(1400px, 92vw);
          max-height: 74vh;
          object-fit: contain;
          border-radius: 12px;
          border: 1px solid var(--line);
          cursor: default;
          animation: cs-zoom-in 320ms ease;
        }
        .cs-zoom__nav {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 46px;
          height: 46px;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.4);
          background: rgba(0, 0, 0, 0.45);
          color: var(--text);
          font-size: 26px;
          line-height: 1;
          cursor: pointer;
        }
        .cs-zoom__nav.prev { left: 14px; }
        .cs-zoom__nav.next { right: 14px; }
        .cs-zoom__nav:hover { background: var(--text); color: var(--bg); }
        .cs-zoom__thumbs { display: flex; gap: 10px; cursor: default; }
        .cs-zoom__thumbs button {
          width: 76px;
          height: 52px;
          padding: 0;
          border-radius: 8px;
          border: 1px solid var(--line);
          overflow: hidden;
          background: none;
          opacity: 0.5;
          cursor: pointer;
          transition: opacity 180ms ease, border-color 180ms ease;
        }
        .cs-zoom__thumbs button:hover { opacity: 0.85; }
        .cs-zoom__thumbs button.is-active { opacity: 1; border-color: var(--text); }
        .cs-zoom__thumbs img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .cs-stage__open { position: relative; }
        .cs-stage__chip {
          position: absolute;
          right: 10px;
          bottom: 10px;
          padding: 4px 9px;
          border-radius: 999px;
          background: rgba(0, 0, 0, 0.55);
          -webkit-backdrop-filter: blur(6px);
          backdrop-filter: blur(6px);
          color: var(--text);
          font-family: var(--font-mono);
          font-size: 10.5px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        @media (max-width: 640px) {
          .cs-zoom__nav { display: none; }
          .cs-zoom__stage > img { max-width: 94vw; max-height: 62vh; }
          .cs-zoom__thumbs button { width: 60px; height: 42px; }
        }
        .cs-zoom__cap { font-family: var(--font-mono); font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--text-dim); }
        .cs-zoom__close {
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
        }
        .cs-stage figcaption { display: flex; gap: 10px; align-items: baseline; margin-top: 12px; font-size: 14px; flex-wrap: wrap; }

        .cs-bottom { display: grid; grid-template-columns: 1.4fr 1fr; gap: 40px; align-items: center; }
        .cs-clip { width: 100%; aspect-ratio: 16 / 9; object-fit: cover; border-radius: 16px; border: 1px solid var(--line); display: block; background: #000; }
        .cs-results { display: grid; gap: 18px; padding-left: 18px; border-left: 1px solid var(--line); }
        .cs-result__v { font-family: var(--font-display); font-size: 22px; font-weight: 400; letter-spacing: 0.01em; line-height: 1.1; color: var(--text); }
        .cs-result__l { color: var(--text-dim); font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; margin-top: 6px; }
        .cs-quote { margin: 8px 0 0; padding-left: 18px; border-left: 1px solid var(--text); }
        .cs-quote p { font-size: 16px; line-height: 1.6; margin: 0 0 8px; }
        .cs-quote cite { font-style: normal; font-family: var(--font-mono); font-size: 11.5px; letter-spacing: 0.06em; text-transform: uppercase; color: var(--text-dim); }
        .cs-cta { margin-top: 26px; }
        .cs-cta a {
          display: inline-flex;
          padding: 12px 22px;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.4);
          color: var(--text);
          text-decoration: none;
          font-size: 14px;
          transition: background 180ms ease, color 180ms ease;
        }
        .cs-cta a:hover { background: var(--text); color: var(--bg); }

        @media (max-width: 900px) {
          .cs-facts { grid-template-columns: repeat(2, 1fr); }
          .cs-story { grid-template-columns: 1fr; gap: 28px; }
          .cs-stages { grid-template-columns: repeat(2, 1fr); }
          .cs-bottom { grid-template-columns: 1fr; }
        }
        @media (max-width: 560px) {
          .case-study { padding: 72px 24px 48px; }
          .cs-hero { aspect-ratio: 4 / 3; border-radius: 16px; }
          .cs-hero__logo { left: 16px; bottom: 12px; }
          .cs-stages { grid-template-columns: 1fr 1fr; gap: 12px; }
        }
      `}</style>

      <RevealLines as="h2" className="cs-title" text={CASE.title} delay={0.08} />
      <Reveal as="p" className="cs-lede" delay={0.12}>{CASE.lede}</Reveal>

      <Reveal as="div" className="cs-hero" delay={0.16}>
        <img className="cs-hero__img" src={heroImg} alt="OFK Kuwait dining room render" loading="lazy" />
        <img className="cs-hero__logo" src={logo} alt="" aria-hidden="true" />
      </Reveal>

      <dl className="cs-facts">
        {CASE.facts.map((f, i) => (
          <Reveal as="div" className="cs-fact" key={f.label} delay={i * 0.05}>
            <dt>{f.label}</dt>
            <dd>
              {f.value}
              <Ph show={f.placeholder} />
            </dd>
          </Reveal>
        ))}
      </dl>

      <div className="cs-story">
        {CASE.story.map((s, i) => (
          <Reveal as="div" key={s.heading} delay={i * 0.08}>
            <h3>
              {s.heading}
              <Ph show={s.placeholder} />
            </h3>
            <p>{s.text}</p>
          </Reveal>
        ))}
      </div>

      <RevealLines as="h3" className="cs-sub" text="From concept to final image" />
      <div className="cs-stages">
        {CASE.stages.map((s, i) => (
          <Reveal as="div" className="cs-stage" key={s.caption} delay={i * 0.08}>
            <figure>
              <button type="button" className="cs-stage__open" onClick={() => setZoom(s)} aria-label={`View ${s.caption} full size`}>
                <img src={s.src} alt={s.caption} loading="lazy" />
                {s.gallery && <span className="cs-stage__chip">{s.gallery.length} images</span>}
              </button>
              <figcaption>
                {s.caption}
                <Ph show={s.placeholder} />
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>

      <div className="cs-bottom">
        <Reveal as="div">
          <AutoClip {...CASE.clip} />
        </Reveal>
        <Reveal as="div" delay={0.1}>
          <div className="cs-results">
            {CASE.results.map((r) => (
              <div key={r.label}>
                <div className="cs-result__v">
                  {r.value}
                  <Ph show={r.placeholder} />
                </div>
                <div className="cs-result__l">{r.label}</div>
              </div>
            ))}
            {CASE.quote && (
              <blockquote className="cs-quote">
                <p>“{CASE.quote.text}”</p>
                <cite>{CASE.quote.by}</cite>
              </blockquote>
            )}
          </div>
          <div className="cs-cta">
            <SectionLink to="/#process">Start a project like this</SectionLink>
          </div>
        </Reveal>
      </div>
      {zoom && <Zoom item={zoom} onClose={() => setZoom(null)} />}
    </section>
  );
}
