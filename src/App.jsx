import { useEffect, useRef, useState } from 'react';
import { Routes, Route, useLocation, Link } from 'react-router-dom';
import { motion, useScroll, useMotionValueEvent } from 'motion/react';
import Gallery from './components/Gallery.jsx';
import RevealLines from './components/RevealLines.jsx';
import ContactButton from './components/ContactButton.jsx';
import MotionSection from './components/MotionSection.jsx';
import About from './components/About.jsx';
import Services from './components/Services.jsx';
import SiteFooter from './components/SiteFooter.jsx';
import ProjectDetail from './components/ProjectDetail.jsx';
import HeroBanner from './components/HeroBanner.jsx';
import WorkflowPage from './components/WorkflowPage.jsx';
import ProcessSection from './components/ProcessSection.jsx';
import BrandCarousel from './components/BrandCarousel.jsx';
import clips from './data/clips.js';

// Wrapped once at module scope (not inside a component) so it's a stable
// component reference across renders — creating it fresh on every render
// would give React a new component type each time and force a remount.
const MotionLink = motion(Link);

// React Router doesn't reset scroll position on navigation by default —
// without this, clicking a gallery thumbnail while scrolled halfway down
// the homepage lands the project page at that same pixel offset instead
// of at the top. It also now handles hash links (e.g. "/#motion"): since
// the header's section links are visible on every page, not just Home,
// clicking one from a project or workflow page has to navigate to Home
// AND land on the right section, not just reset to the top.
function ScrollToTop() {
  const location = useLocation();
  useEffect(() => {
    if (location.hash) {
      const id = location.hash.slice(1);
      // Two rAFs: the first lets React commit the new route's DOM, the
      // second lets layout settle before measuring where the target is —
      // a single rAF right after a route swap isn't always enough.
      let raf2;
      const raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => {
          document.getElementById(id)?.scrollIntoView({ behavior: 'auto', block: 'start' });
        });
      });
      return () => {
        cancelAnimationFrame(raf1);
        if (raf2) cancelAnimationFrame(raf2);
      };
    }
    window.scrollTo(0, 0);
  }, [location.pathname, location.hash]);
  return null;
}

// Slides out of view while the visitor scrolls down and back in as soon as
// they scroll up (or reach the top of the page), so it never sits on top of
// the renders. Needs ~24px of consistent movement in one direction before it
// reacts, so a jittery trackpad doesn't make it flicker. Also reappears when
// something inside it receives keyboard focus.
function HidingHeader() {
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  const travel = useRef(0);

  useMotionValueEvent(scrollY, 'change', (y) => {
    const delta = y - lastY.current;
    lastY.current = y;

    if (y < 120) {
      travel.current = 0;
      setHidden(false);
      return;
    }
    // Direction changed → start counting again from zero.
    if (Math.sign(delta) !== Math.sign(travel.current)) travel.current = 0;
    travel.current += delta;

    if (travel.current > 24) setHidden(true);
    else if (travel.current < -24) setHidden(false);
  });

  return (
    <motion.header
      className="site-header"
      animate={{ y: hidden ? '-100%' : '0%' }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      onFocus={() => setHidden(false)}
    >
      {/* The whole logo+wordmark lockup drops in from above the viewport
          together as one unit on load, rather than each piece animating
          separately — a single clear entrance instead of several small
          competing ones. */}
      <MotionLink
        to="/"
        className="brand"
        initial={{ opacity: 0, y: -48 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        <svg
          className="brand-logo"
          viewBox="0 0 40 40"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <rect x="3" y="3" width="34" height="34" rx="9" fill="none" stroke="currentColor" strokeWidth="2.6" />
          <text
            x="20"
            y="21.5"
            textAnchor="middle"
            dominantBaseline="central"
            fontFamily="'Sora', var(--font-display), system-ui, sans-serif"
            fontWeight="600"
            fontSize="19"
            fill="currentColor"
          >
            P
          </text>
        </svg>
        <div className="brand-text">
          <h1 className="site-title">praxio</h1>
        </div>
      </MotionLink>

      <motion.nav
        className="nav-actions"
        aria-label="Section links"
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
      >
        <Link to="/#gallery" className="nav-cta">Portfolio</Link>
        <Link to="/#motion" className="nav-cta">Motion</Link>
        <Link to="/#about" className="nav-cta">About</Link>
        <Link to="/#services" className="nav-cta">Services</Link>
        <Link to="/#process" className="nav-cta">Process</Link>
        <ContactButton className="nav-cta" />
      </motion.nav>
    </motion.header>
  );
}

function Home() {
  return (
    <>
      <main>
        <HeroBanner>
          <RevealLines as="h2" className="hero__headline" text="Bringing architectural vision to life" delay={0.15} />
          <RevealLines
            as="p"
            className="hero__subtext"
            text="Concept renders, animations, and technical drawings — refined through AI-assisted workflows."
            delay={0.4}
            stagger={0.06}
          />
        </HeroBanner>

        <MotionSection clips={clips} />

        <div id="gallery" className="gallery-section">
          <RevealLines as="h2" className="gallery-section-title" text="Projects gallery" />
          <BrandCarousel />
          <Gallery />
        </div>
        <ProcessSection />
        <About />
        <Services />
      </main>
      <SiteFooter />
    </>
  );
}

export default function App() {
  return (
    <div className="page">
      <style>{`
        :root {
          /* Used by the header (fixed height) and the hero (negative
             margin to sit edge-to-edge underneath it). Keep both in sync
             if you resize the header. */
          --header-h: 76px;
          /* Matches .page's own left/right padding formula (from
             index.css) exactly, rather than a separately-chosen value —
             so the header and hero align not just with each other but
             with the same left edge every other section on the site
             already uses. */
          --page-gutter: clamp(20px, 4vw, 56px);
        }

        /* index.css's own .site-header rule sets display/align-items/
           justify-content/padding/border-bottom — overriding only some of
           those (as an earlier pass here did) leaves the rest still in
           effect and fighting this. Every property it sets is covered
           below. */
        .site-header {
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          height: var(--header-h) !important;
          z-index: 100 !important;
          padding: 16px var(--page-gutter) 0 !important;
          margin: 0 !important;
          border-bottom: none !important;
          background: none !important;
          gap: 16px;
        }
        .page {
          background: #0a0a0a;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 16px;
          flex: 0 0 auto;
          text-decoration: none;
          color: inherit;
        }
        .brand-logo {
          height: 29px;
          width: 29px;
          flex: 0 0 auto;
          display: block;
          color: var(--text);
        }
        .site-title {
          font-family: 'Sora', var(--font-display), system-ui, sans-serif;
          font-weight: 300;
          letter-spacing: 0em;
          text-transform: lowercase;
        }
        .brand-text {
          display: flex;
          flex-direction: column;
        }

        /* Top-right nav/action row — smaller, pill-cornered versions of
           the buttons that used to sit inside the hero itself. On narrow
           screens it scrolls horizontally rather than wrapping, so the
           header's height stays fixed and predictable (route-content and
           the hero both rely on --header-h being accurate). */
        .nav-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1 1 auto;
          min-width: 0;
          justify-content: flex-end;
          overflow-x: auto;
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
          padding-bottom: 2px;
        }
        .nav-actions::-webkit-scrollbar {
          display: none;
        }
        .nav-cta {
          flex: 0 0 auto;
          display: inline-flex;
          align-items: center;
          padding: 8px 16px;
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.4);
          border-radius: 10px;
          color: var(--text);
          text-decoration: none;
          font-family: var(--font-body);
          font-size: 12.5px;
          letter-spacing: 0.01em;
          white-space: nowrap;
          cursor: pointer;
          transition: background 180ms ease, color 180ms ease, border-color 180ms ease;
        }
        .nav-cta:hover {
          background: var(--text);
          color: var(--bg);
          border-color: var(--text);
        }
        /* .contact-btn and .nav-cta are equal specificity, so whichever
           stylesheet loads second could still win — this scoped,
           more-specific selector guarantees the nav row's look applies
           regardless of load order. */
        .nav-actions .contact-btn {
          display: inline-flex;
          align-items: center;
          padding: 8px 16px;
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.4);
          border-radius: 10px;
          color: var(--text);
          font-family: var(--font-body);
          font-size: 12.5px;
          letter-spacing: 0.01em;
          text-transform: none;
          white-space: nowrap;
          cursor: pointer;
          transition: background 180ms ease, color 180ms ease, border-color 180ms ease;
        }
        .nav-actions .contact-btn:hover {
          background: var(--text);
          color: var(--bg);
          border-color: var(--text);
        }

        /* Pushes every routed page down below the fixed header. The hero
           (Home only) cancels this out itself via a negative margin so it
           still reaches the true top of the viewport — see HeroBanner.css. */
        .route-content {
          padding-top: var(--header-h);
        }

        .gallery-section {
          padding: 64px var(--page-gutter) 32px;
        }
        .gallery-section-title {
          font-family: var(--font-display);
          font-size: clamp(28px, 4vw, 44px);
          font-weight: 600;
          letter-spacing: -0.01em;
          margin: 0 0 28px;
        }
        @media (max-width: 560px) {
          .gallery-section { padding: 48px 24px 16px; }
          :root {
            --header-h: 138px;
          }
          .site-header {
            padding: 14px var(--page-gutter) 0 !important;
            gap: 10px;
          }
          .brand-logo {
            height: 24px;
            width: 24px;
          }
          .nav-cta,
          .nav-actions .contact-btn {
            padding: 7px 12px;
            font-size: 11.5px;
          }
          /* Mobile only: a horizontally-scrolling single row reads as
             cramped/messy next to the logo at this width. Instead, take
             the row out of the header's normal flex flow and let it wrap
             into a compact block stacked in the top-right corner —
             logo stays top-left on its own, buttons form their own
             right-aligned cluster underneath that same top edge. */
          .nav-actions {
            position: absolute;
            top: 14px;
            right: var(--page-gutter);
            max-width: 190px;
            flex-wrap: wrap;
            justify-content: flex-end;
            overflow: visible;
          }
        }
      `}</style>

      <ScrollToTop />

      <HidingHeader />

      <div className="route-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/project/:slug" element={<ProjectDetail />} />
          <Route path="/process/:slug" element={<WorkflowPage />} />
        </Routes>
      </div>
    </div>
  );
}
