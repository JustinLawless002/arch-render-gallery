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
// Placeholder case studies (swap for real case-study images when ready).
import klandHero from '../assets/images/brands/render/kland-01.webp';
import klandR2 from '../assets/images/brands/render/kland-02.webp';
import klandR3 from '../assets/images/brands/render/kland-03.webp';
import klandR4 from '../assets/images/brands/render/kland-04.webp';
import klandBrief from '../assets/images/case-study/kland-brief.webp'; // masterplan + zoning board
import klandMood from '../assets/images/case-study/kland-moodboard.webp'; // play & dining references
import klandLogo from '../assets/images/brands/kland.png';
import alNawahHero from '../assets/images/processed/al-nawah-full.webp';

// ─────────────────────────────────────────────────────────────────────
//  CASE STUDY — MOCK-UP / PLACEHOLDER (OFK)
//
//  Content is filled in; anything still marked
//  `placeholder: true` shows a small "placeholder" tag on the page until
//  you replace its text and delete that flag. Images and the clip are the
//  real OFK files already in the project — swap any of them freely.
// ─────────────────────────────────────────────────────────────────────
const CASE = {
  id: 'ofk',
  eyebrow: 'Case study',
  title: 'Open Flame Kitchen',
  hero: { src: heroImg, alt: 'OFK Kuwait dining room render', logo },
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
  map: 'https://maps.app.goo.gl/pv9h8wAK3CAhoAHj9', // Google Maps link on the Location fact
  results: [
    { value: '20+', label: 'final stills delivered' },
    { value: '±35 wks', label: 'from brief to sign-off' },
    { value: '540 m²', label: 'indoor floor area' },
  ],
  // Set to an object like { text: '…', by: 'Name, role — OFK' } to show a client quote.
  quote: null,
};

// ─────────────────────────────────────────────────────────────────────
//  MORE CASE STUDIES — each one is a folder in the stack. Order here =
//  tab order, left to right; the first one is in front when the page
//  loads. Anything with `placeholder: true` shows a "placeholder" tag.
//  Sections left out (stages, clip, results, quote) are simply skipped.
// ─────────────────────────────────────────────────────────────────────
const KLAND = {
  id: 'kland',
  title: 'K-Land',
  lede: 'A large seasonal family entertainment, dining and play destination, with soft play zones, themed areas, cafés and restaurants.',
  hero: { src: klandHero, alt: 'K-Land render', logo: klandLogo },
  facts: [
    { label: 'Client', value: 'K-Land' },
    { label: 'Location', value: 'Blajat Beach, Salmiya, Kuwait' },
    { label: 'Year', value: '2024' },
    { label: 'Scope', value: 'Design · rendering' },
    { label: 'Tools', value: '3ds Max · Corona' },
  ],
  story: [
    {
      heading: 'The brief',
      text: 'Create a multi-zoned beachside family resort spanning 9,200 m², focused on family-friendly shopping, dining and play areas.',
    },
    {
      heading: 'The challenge',
      text: 'Keeping a handle on revisions across multiple areas at the same time, and adding seasonal versions of some areas, meant the project scope changed quite a lot.',
    },
    {
      heading: 'The approach',
      text: 'Breaking the project into smaller zones and versioning it by season kept it much more manageable. For the masterplan aerial shots, a less detailed version of the model was used.',
    },
  ],
  stages: [
    { src: klandBrief, caption: 'Brief: masterplan & zoning' },
    { src: klandMood, caption: 'Challenge: play & dining moodboard' },
    { src: klandR2, caption: 'Approach: zoned, seasonal renders', gallery: [klandHero, klandR2, klandR3, klandR4] },
  ],
  clip: { src: '/videos/kland.mp4', poster: '/videos/posters/kland.jpg' },
  map: 'https://maps.app.goo.gl/YtXYW64DFZaGChT58',
  results: [
    { value: '9,200 m²', label: 'beachside site' },
    { value: '5', label: 'zones, each with its own revisions' },
    { value: '±48 wks', label: 'from brief to sign-off' },
  ],
  quote: null,
};

const AL_NAWAH = {
  id: 'al-nawah',
  title: 'Al Nawah',
  lede: 'One-line summary of the Al Nawah project goes here.',
  ledePlaceholder: true,
  hero: { src: alNawahHero, alt: 'Al Nawah render', logo: null },
  facts: [
    { label: 'Client', value: 'Al Nawah', placeholder: true },
    { label: 'Location', value: 'Kuwait', placeholder: true },
    { label: 'Year', value: '2025', placeholder: true },
    { label: 'Scope', value: 'Interior design · rendering', placeholder: true },
    { label: 'Tools', value: '3ds Max · Corona', placeholder: true },
  ],
  story: [
    { heading: 'The brief', text: 'What the client asked for.', placeholder: true },
    { heading: 'The challenge', text: 'What made it difficult.', placeholder: true },
    { heading: 'The approach', text: 'How it was solved.', placeholder: true },
  ],
  stages: [],
  clip: null,
  results: [],
  quote: null,
  comingSoon: true,
};

// Al Nawah is hidden for now — add AL_NAWAH back to this list to show it.
const CASES = [CASE, KLAND];



function Ph({ show }) {
  return show ? <span className="cs-ph">placeholder</span> : null;
}

// Plays only while on screen, so it doesn't eat bandwidth/battery further
// down the page. Muted + playsInline so phones allow autoplay.
// Small map-pin icon for the Location fact (links to Google Maps).
function MapPin() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </svg>
  );
}

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
              <img src={src} alt={`${item.caption} ${n + 1}`} />
            </button>
          ))}
        </div>
      )}
      <button type="button" className="cs-zoom__close" aria-label="Close">✕</button>
    </div>,
    document.body
  );
}


// The inside of one folder (everything below the tab).
function CaseBody({ c, onZoom }) {
  return (
    <>
      <h2 className="cs-sr">{c.title}</h2>
      <p className="cs-lede">
        {c.lede}
        <Ph show={c.ledePlaceholder} />
      </p>

      {c.hero && (
        <div className="cs-hero">
          <img className="cs-hero__img" src={c.hero.src} alt={c.hero.alt} loading="lazy" />
          {c.hero.logo && <img className="cs-hero__logo" src={c.hero.logo} alt={`${c.title} logo`} />}
        </div>
      )}

      {c.facts?.length > 0 && (
        <dl className="cs-facts">
          {c.facts.map((f, i) => (
            <Reveal as="div" className="cs-fact" key={f.label} delay={i * 0.05}>
              <dt>{f.label}</dt>
              <dd>
                {f.label === 'Location' && c.map ? (
                  <a className="cs-fact__map" href={c.map} target="_blank" rel="noopener noreferrer" aria-label={`${f.value} — open in Google Maps`}>
                    <MapPin />
                    {f.value}
                  </a>
                ) : (
                  f.value
                )}
                <Ph show={f.placeholder} />
              </dd>
            </Reveal>
          ))}
        </dl>
      )}

      {c.story?.length > 0 && (
        <div className="cs-story">
          {c.story.map((s, i) => (
            <Reveal as="div" key={s.heading} delay={i * 0.08}>
              <h3>
                {s.heading}
                <Ph show={s.placeholder} />
              </h3>
              <p>{s.text}</p>
            </Reveal>
          ))}
        </div>
      )}

      {c.stages?.length > 0 && (
        <>
          <RevealLines as="h3" className="cs-sub" text="From concept to final image" />
          <div className={`cs-stages${c.stages.length === 3 ? ' cs-stages--3' : ''}`}>
            {c.stages.map((s, i) => (
              <Reveal as="div" className="cs-stage" key={s.caption} delay={i * 0.08}>
                <figure>
                  <button type="button" className="cs-stage__open" onClick={() => onZoom(s)} aria-label={`View ${s.caption} full size`}>
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
        </>
      )}

      {(c.clip || c.results?.length > 0 || c.quote) ? (
        <div className="cs-bottom">
          {c.clip && (
            <Reveal as="div">
              <AutoClip {...c.clip} />
            </Reveal>
          )}
          <Reveal as="div" delay={0.1}>
            <div className="cs-results">
              {c.results.map((r) => (
                <div key={r.label}>
                  <div className="cs-result__v">
                    {r.value}
                    <Ph show={r.placeholder} />
                  </div>
                  <div className="cs-result__l">{r.label}</div>
                </div>
              ))}
              {c.quote && (
                <blockquote className="cs-quote">
                  <p>“{c.quote.text}”</p>
                  <cite>{c.quote.by}</cite>
                </blockquote>
              )}
            </div>
            <div className="cs-cta">
              <SectionLink to="/#process">Get a quote for a project like this</SectionLink>
            </div>
          </Reveal>
        </div>
      ) : (
        <>
          {c.comingSoon && <p className="cs-soon">Full case study coming soon.</p>}
          <div className="cs-cta">
            <SectionLink to="/#process">Get a quote for a project like this</SectionLink>
          </div>
        </>
      )}
    </>
  );
}

// Curved slope joining a tab to its folder (mirrored for the left side).
function Ramp({ side }) {
  return (
    <svg className={`cs-tab__ramp cs-tab__ramp--${side}`} viewBox="0 0 64 100" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 0 H10 C34 0 30 100 64 100 H0 Z" />
    </svg>
  );
}

// One row of tabs, all in their fixed slots. Used for the clickable
// "behind" row and, with only one tab visible, as each folder's own tab.
function TabRow({ role, onSelect, activeId, ownId, depth }) {
  const interactive = Boolean(onSelect);
  return (
    <div className="cs-tabs" role={role} aria-label={interactive ? 'Case studies' : undefined} aria-hidden={interactive ? undefined : true}>
      {CASES.map((c, i) => {
        const d = depth(c.id);
        const own = c.id === ownId;
        return (
          <button
            key={c.id}
            type="button"
            role={interactive ? 'tab' : undefined}
            id={interactive ? `cs-tab-${c.id}` : undefined}
            aria-selected={interactive ? c.id === activeId : undefined}
            aria-controls={interactive ? 'cs-panel' : undefined}
            tabIndex={interactive ? undefined : -1}
            data-d={d}
            className={`cs-tab${d === 0 ? ' is-front' : ''}${own ? ' is-own' : ''}${i === 0 ? ' is-first' : ''}`}
            onClick={interactive ? () => onSelect(c.id) : undefined}
          >
            {i > 0 && <Ramp side="l" />}
            {/* non-breaking hyphens so "K-Land" never splits across lines */}
            {c.title.replace(/-/g, '\u2011')}
            <Ramp side="r" />
          </button>
        );
      })}
    </div>
  );
}

// A whole folder: its raised tab plus its page.
function Folder({ c, onZoom, leaving = false, isNew = false, onDone }) {
  const first = CASES[0].id === c.id;
  return (
    <div
      className={`cs-folder${leaving ? ' cs-folder--leaving' : ''}${isNew ? ' is-new' : ''}`}
      data-d="0"
      onAnimationEnd={leaving ? (e) => e.target === e.currentTarget && onDone?.() : undefined}
      aria-hidden={leaving || undefined}
    >
      <TabRow ownId={c.id} depth={(id) => (id === c.id ? 0 : 1)} />
      <div
        id={leaving ? undefined : 'cs-panel'}
        role={leaving ? undefined : 'tabpanel'}
        aria-labelledby={leaving ? undefined : `cs-tab-${c.id}`}
        className={`cs-folder__body${first ? ' is-first' : ''}`}
      >
        <CaseBody c={c} onZoom={onZoom} />
      </div>
    </div>
  );
}

export default function CaseStudy() {
  const [zoom, setZoom] = useState(null);
  const [activeId, setActiveId] = useState(CASES[0].id);
  // The folder that was in front a moment ago, while it drops away.
  const [leavingId, setLeavingId] = useState(null);
  const leaveTimer = useRef(null);
  useEffect(() => () => clearTimeout(leaveTimer.current), []);

  const select = (id) => {
    if (id === activeId) return;
    // Plays even with the OS "reduce motion" setting on, like the rest of
    // the site (see MotionConfig reducedMotion="never" in main.jsx).
    setLeavingId(activeId);
    setActiveId(id);
    // Fallback in case the browser never reports the animation's end.
    clearTimeout(leaveTimer.current);
    leaveTimer.current = setTimeout(() => setLeavingId(null), 1200);
  };

  return (
    <section className="case-study" id="case-study" aria-label="Case studies">
      <style>{`
        .case-study { padding: 96px var(--page-gutter, 48px) 96px; }

        /* ── File-folder group ───────────────────────────────────────────
           Every case study is a folder. The selected one is in front, and
           its tab stands one step higher than the others; the folders behind
           all sit level with each other, showing only their tabs. Tabs keep
           their places left to right; clicking one brings it to the front.
           data-d: 0 = front folder, 1 = behind. */
        .cs-files { --step: 14px; --ramp: 44px; position: relative; isolation: isolate; }
        .cs-files [data-d='0'] { --cs-folder: #141618; }
        .cs-files [data-d='1'] { --cs-folder: #1b1e20; }

        /* Layers, bottom to top:
             1. .cs-back  — every tab, in the "behind" grey (the clickable ones)
             2. the selected folder — its own raised tab + its page
             3. the folder being put away — drops down and out of sight
           Each folder layer repeats the whole tab row with only its own tab
           visible, so its tab lands exactly over its slot. */
        .cs-files { overflow: hidden; overflow: clip; }
        .cs-back { position: absolute; top: 0; left: 0; right: 0; z-index: 1; }
        /* Clicks pass through a folder's tab strip to the real tabs below;
           only its page takes clicks. */
        .cs-folder { position: relative; z-index: 2; pointer-events: none; }
        .cs-folder__body { pointer-events: auto; }
        .cs-folder .cs-tab:not(.is-own) { visibility: hidden; }
        .cs-folder--leaving {
          position: absolute; top: 0; left: 0; right: 0; z-index: 3;
          animation: cs-drop 720ms cubic-bezier(0.55, 0, 0.75, 0.2) forwards;
        }
        .cs-folder--leaving * { pointer-events: none; }
        @keyframes cs-drop {
          from { transform: translateY(0); }
          to { transform: translateY(105vh); }
        }
        /* The newly selected tab rises from the "behind" level into place. */
        .cs-folder:not(.cs-folder--leaving).is-new .cs-tab.is-own {
          animation: cs-rise 520ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes cs-rise { from { transform: translateY(var(--step)); } to { transform: none; } }
        /* Keep these playing for visitors with "reduce motion" on — overrides
           the site-wide reduced-motion rule in index.css (owner's choice,
           same as MotionConfig reducedMotion="never" in main.jsx). */
        @media (prefers-reduced-motion: reduce) {
          .cs-files .cs-folder--leaving { animation-duration: 720ms !important; }
          .cs-files .cs-folder.is-new .cs-tab.is-own { animation-duration: 520ms !important; }
        }

        .cs-tabs {
          display: flex;
          align-items: stretch; /* every tab is as tall as the tallest */
          padding-right: var(--ramp);
        }
        .cs-tab {
          position: relative;
          flex: 0 0 auto;
          display: flex;
          align-items: flex-end;
          margin: var(--step) 0 0; /* folders behind sit one step lower */
          padding: 20px 30px 10px;
          border: 0;
          border-radius: 0;
          background: var(--cs-folder);
          color: var(--text-dim);
          font-family: var(--font-display);
          font-size: clamp(18px, 2vw, 26px);
          font-weight: 600;
          letter-spacing: -0.01em;
          line-height: 1.15;
          text-align: left;
          white-space: nowrap;
          cursor: pointer;
          transition: color 200ms ease;
        }
        .cs-tab + .cs-tab { margin-left: calc(var(--ramp) + 12px); }
        .cs-tab.is-front { margin-top: 0; }
        .cs-tab.is-first { border-top-left-radius: 28px; }
        .cs-tab:hover { color: var(--text); }
        .cs-tab.is-front { color: var(--text); cursor: default; }
        .cs-tab:focus-visible { outline: 1px solid var(--text); outline-offset: -6px; }
        .cs-tab__ramp {
          position: absolute;
          top: 0;
          width: var(--ramp);
          height: calc(100% + 1px);
          fill: var(--cs-folder);
          display: block;
          pointer-events: none;
        }
        .cs-tab__ramp--r { left: calc(100% - 1px); }          /* 1px overlap hides seams */
        .cs-tab__ramp--l { right: calc(100% - 1px); transform: scaleX(-1); }

        .cs-folder__body {
          position: relative;
          background: var(--cs-folder);
          border-radius: 28px;
          padding: 30px 40px 48px;
          margin-top: -1px;
        }
        .cs-folder__body.is-first { border-top-left-radius: 0; }
        .cs-sr {
          position: absolute; width: 1px; height: 1px; overflow: hidden;
          clip: rect(0 0 0 0); white-space: nowrap;
        }
        .cs-soon { color: var(--text-dim); font-size: 14px; font-style: italic; margin: 28px 0 0; }
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
        .cs-stages--3 { grid-template-columns: repeat(3, 1fr); }
        .cs-fact__map {
          display: inline-flex;
          align-items: flex-start;
          gap: 6px;
          color: inherit;
          text-decoration: none;
        }
        .cs-fact__map svg { flex: 0 0 auto; margin-top: 2px; opacity: 0.8; transition: opacity 180ms ease; }
        .cs-fact__map:hover { text-decoration: underline; text-underline-offset: 3px; }
        .cs-fact__map:hover svg { opacity: 1; }
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
          .case-study { padding: 56px 16px 56px; }
          /* Phones: tabs shrink and titles wrap so all tabs fit in one row. */
          .cs-files { --step: 8px; --ramp: 20px; }
          .cs-tab { max-width: 38%; padding: 12px 11px 6px; font-size: 13px; white-space: normal; }
          .cs-tab + .cs-tab { margin-left: calc(var(--ramp) + 4px); }
          .cs-tab.is-first { border-top-left-radius: 20px; }
          .cs-folder__body { padding: 22px 20px 32px; border-radius: 20px; }
          .cs-hero { aspect-ratio: 4 / 3; border-radius: 16px; }
          .cs-hero__logo { left: 16px; bottom: 12px; }
          .cs-stages { grid-template-columns: 1fr 1fr; gap: 12px; }
        }
      `}</style>

      <Reveal as="div" className="cs-files" delay={0.08}>
        {/* 1. All tabs, "behind" grey — these are the real, clickable tabs. */}
        <div className="cs-back">
          <TabRow
            role="tablist"
            onSelect={select}
            activeId={activeId}
            depth={() => 1}
          />
        </div>

        {/* 2. The selected folder. */}
        <Folder key={activeId} c={CASES.find((c) => c.id === activeId)} onZoom={setZoom} isNew={Boolean(leavingId)} />

        {/* 3. The folder being put away, dropping out of sight. */}
        {leavingId && (
          <Folder
            key={`leaving-${leavingId}`}
            c={CASES.find((c) => c.id === leavingId)}
            onZoom={setZoom}
            leaving
            onDone={() => setLeavingId(null)}
          />
        )}
      </Reveal>

      {zoom && <Zoom item={zoom} onClose={() => setZoom(null)} />}
    </section>
  );
}
