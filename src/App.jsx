import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Routes, Route, useLocation, Link } from 'react-router-dom';
import { motion, useScroll, useMotionValueEvent } from 'motion/react';
import Gallery from './components/Gallery.jsx';
import RevealLines from './components/RevealLines.jsx';
import PraxioLogo from './components/PraxioLogo.jsx';
import ContactButton from './components/ContactButton.jsx';
import MotionSection from './components/MotionSection.jsx';
import SectionLink, { scrollToSection } from './components/SectionLink.jsx';
import { smoothScrollTo } from './lib/smoothScroll.js';
import CopyButton, { CONTACT_EMAIL } from './components/CopyButton.jsx';
import { EmailIcon, WhatsAppIcon } from './components/ContactIcons.jsx';
import CaseStudy from './components/CaseStudy.jsx';
import About from './components/About.jsx';
import Services from './components/Services.jsx';
import Testimonials from './components/Testimonials.jsx';
import SocialStrips from './components/SocialStrips.jsx';
import SiteFooter from './components/SiteFooter.jsx';
import ProjectDetail from './components/ProjectDetail.jsx';
import HeroBanner from './components/HeroBanner.jsx';
import WorkflowPage from './components/WorkflowPage.jsx';
import ProcessSection from './components/ProcessSection.jsx';
import Privacy from './components/Privacy.jsx';
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
      // Arriving from another page: start from the top of the homepage,
      // then glide down to the section (same smooth motion as on-page links).
      window.scrollTo(0, 0);
      let raf2;
      const raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => scrollToSection(id));
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
// Header section links. About is added after these on every page; Contact
// floats in the screen's bottom-right corner instead (ContactFloat).
const NAV_LINKS = [
  { id: 'gallery', label: 'Portfolio' },
  { id: 'case-study', label: 'Case studies' },
  { id: 'services', label: 'Services' },
  { id: 'process', label: 'Instant quote' },
];

// Phone-width menu: everything (section links, About, Contact) folded
// behind one hamburger button. Portaled to <body> because the header is
// transformed while it hides/shows, which would otherwise trap a fixed
// panel inside it.
function MobileMenu({ open, onClose }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return createPortal(
    <div className={`mobile-menu${open ? ' is-open' : ''}`} onClick={onClose} aria-hidden={!open}>
      <nav className="mobile-menu__panel" aria-label="Menu" onClick={(e) => e.stopPropagation()}>
        {[...NAV_LINKS, { id: 'about', label: 'About' }].map((l, i) => (
          <SectionLink
            key={l.id}
            to={`/#${l.id}`}
            className="mobile-menu__link"
            style={{ transitionDelay: open ? `${60 + i * 40}ms` : '0ms' }}
            onClick={onClose}
            tabIndex={open ? 0 : -1}
          >
            {l.label}
          </SectionLink>
        ))}
        <div className="mobile-menu__contact" style={{ transitionDelay: open ? '300ms' : '0ms' }}>
          <div className="mobile-menu__heading">Contact</div>
          <div className="mobile-menu__row">
            <a href={`mailto:${CONTACT_EMAIL}`} tabIndex={open ? 0 : -1}>
              <EmailIcon /> {CONTACT_EMAIL}
            </a>
            <CopyButton iconOnly />
          </div>
          <a href="https://wa.me/6281337828881" target="_blank" rel="noopener noreferrer" tabIndex={open ? 0 : -1}>
            <WhatsAppIcon /> whatsapp
          </a>
        </div>
      </nav>
    </div>,
    document.body
  );
}

// Slides out of view while the visitor scrolls down and back in as soon as
// they scroll up (or reach the top of the page), so it never sits on top of
// the renders. Needs ~24px of consistent movement in one direction before it
// reacts, so a jittery trackpad doesn't make it flicker. Also reappears when
// something inside it receives keyboard focus.
function HidingHeader() {
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const lastY = useRef(0);
  const travel = useRef(0);
  const { pathname } = useLocation();
  const onHome = pathname === '/';

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

  // Close the menu if the page changes underneath it.
  useEffect(() => setMenuOpen(false), [pathname]);

  return (
    <>
      <motion.header
        className="site-header"
        animate={{ y: hidden && !menuOpen ? '-100%' : '0%' }}
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
          aria-label="praxio, back to the top of the home page"
          initial={{ opacity: 0, y: -48 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => {
            if (onHome) {
              e.preventDefault();
              smoothScrollTo(0);
            }
          }}
        >
          <PraxioLogo className="brand-logo" />
        </MotionLink>

        <motion.nav
          className="nav-actions"
          aria-label="Section links"
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
        >
          {NAV_LINKS.map((l) => (
            <SectionLink key={l.id} to={`/#${l.id}`} className="nav-cta">
              {l.label}
            </SectionLink>
          ))}
          <SectionLink to="/#about" className="nav-cta">About</SectionLink>
        </motion.nav>

        <motion.button
          type="button"
          className={`menu-toggle${menuOpen ? ' is-open' : ''}`}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
        >
          <span />
          <span />
          <span />
        </motion.button>
      </motion.header>
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}

// Contact button that follows the screen: always in the bottom-right
// corner, on every page. Its panel (email + WhatsApp) opens upwards.
function ContactFloat() {
  return (
    <div className="contact-float">
      <ContactButton className="nav-cta" placement="up" />
    </div>
  );
}

// Keeps <link rel="canonical"> pointing at the page being viewed, so each
// project page is indexed as itself rather than as a copy of the homepage.
function CanonicalLink() {
  const { pathname } = useLocation();
  useEffect(() => {
    const link = document.querySelector('link[rel="canonical"]');
    if (link) link.href = `https://www.praxio.studio${pathname}`;
  }, [pathname]);
  return null;
}

// The 6-image grid under the brand carousel. Hidden while it's being
// polished — set to true to show it again. Project pages still work.
const SHOW_GALLERY_GRID = false;

function Home() {
  return (
    <>
      <main>
        <HeroBanner>
          <RevealLines as="h1" className="hero__headline" text="Practical design solutions." delay={0.15} />
          <RevealLines
            as="p"
            className="hero__subtext"
            text="A flexible design process that lets you fine-tune your project at every step of the way. Accurate 3D designs enhanced by AI."
            delay={0.4}
            stagger={0.06}
          />
          <SectionLink to="/#process" className="hero__cta hero__quote">
            Free instant quote in 1 minute
          </SectionLink>
        </HeroBanner>

        <div id="gallery" className="gallery-section">
          <RevealLines as="h2" className="gallery-section-title" text="Projects gallery" />
          <BrandCarousel />
          {SHOW_GALLERY_GRID && <Gallery />}
        </div>

        <CaseStudy />

        {/* Motion clips follow the case study; same page padding as the gallery. */}
        <div className="gallery-section gallery-section--motion">
          <MotionSection clips={clips} nested />
        </div>

        <ProcessSection />
        <About />
        <Services />
        <Testimonials />
        <SocialStrips />
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
          height: 26px;
          width: auto;
          flex: 0 0 auto;
          display: block;
          color: var(--text);
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
        .nav-actions .contact-btn,
        .hero__corner .contact-btn,
        .contact-float .contact-btn {
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
        .hero__corner .nav-cta,
        .contact-float .contact-btn {
          background: rgba(0, 0, 0, 0.28);
          -webkit-backdrop-filter: blur(8px);
          backdrop-filter: blur(8px);
          padding: 10px 20px;
          font-size: 13.5px;
        }
        .hero__corner .nav-cta:hover { background: var(--text); }
        .nav-actions .contact-btn:hover,
        .hero__corner .contact-btn:hover,
        .contact-float .contact-btn:hover {
          background: var(--text);
          color: var(--bg);
          border-color: var(--text);
        }

        /* Floating Contact button (ContactFloat). Above the page, below the
           mobile menu (90), header (100) and lightboxes (1000). */
        .contact-float {
          position: fixed;
          right: var(--page-gutter);
          bottom: 28px;
          z-index: 80;
        }
        @media (max-width: 640px) {
          .contact-float { right: 16px; bottom: 16px; }
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
        }
        .gallery-section--motion { padding-top: 0; }

        /* Hamburger — only shown at phone/tablet widths (below). */
        .menu-toggle {
          display: none;
          position: relative;
          width: 44px;
          height: 44px;
          flex: 0 0 auto;
          padding: 0;
          border: 1px solid rgba(255, 255, 255, 0.4);
          border-radius: 10px;
          background: rgba(0, 0, 0, 0.25);
          -webkit-backdrop-filter: blur(8px);
          backdrop-filter: blur(8px);
          cursor: pointer;
        }
        .menu-toggle span {
          position: absolute;
          left: 12px;
          right: 12px;
          height: 1.5px;
          background: var(--text);
          border-radius: 2px;
          transition: transform 260ms cubic-bezier(0.16, 1, 0.3, 1), opacity 180ms ease;
        }
        .menu-toggle span:nth-child(1) { top: 15px; }
        .menu-toggle span:nth-child(2) { top: 21px; }
        .menu-toggle span:nth-child(3) { top: 27px; }
        .menu-toggle.is-open span:nth-child(1) { transform: translateY(6px) rotate(45deg); }
        .menu-toggle.is-open span:nth-child(2) { opacity: 0; }
        .menu-toggle.is-open span:nth-child(3) { transform: translateY(-6px) rotate(-45deg); }

        .mobile-menu {
          position: fixed;
          inset: 0;
          z-index: 90; /* under the header (100), so the ✕ stays on top */
          background: rgba(10, 10, 10, 0.72);
          -webkit-backdrop-filter: blur(14px);
          backdrop-filter: blur(14px);
          opacity: 0;
          visibility: hidden;
          transition: opacity 260ms ease, visibility 0s linear 260ms;
        }
        .mobile-menu.is-open {
          opacity: 1;
          visibility: visible;
          transition: opacity 260ms ease, visibility 0s;
        }
        .mobile-menu__panel {
          padding: calc(var(--header-h) + 24px) var(--page-gutter) 40px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .mobile-menu__link,
        .mobile-menu__contact {
          opacity: 0;
          transform: translateY(10px);
          transition: opacity 320ms ease, transform 420ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .mobile-menu.is-open .mobile-menu__link,
        .mobile-menu.is-open .mobile-menu__contact {
          opacity: 1;
          transform: none;
        }
        .mobile-menu__link {
          font-family: var(--font-display);
          font-size: 30px;
          font-weight: 500;
          letter-spacing: -0.01em;
          color: var(--text);
          text-decoration: none;
          padding: 10px 0;
          border-bottom: 1px solid var(--line);
        }
        .mobile-menu__contact {
          margin-top: 28px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .mobile-menu__heading {
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--text-dim);
        }
        .mobile-menu__contact a {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          color: var(--text);
          text-decoration: none;
          font-size: 15px;
        }
        .mobile-menu__row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }

        @media (max-width: 760px) {
          :root { --header-h: 72px; }
          .site-header {
            padding: 14px var(--page-gutter) 0 !important;
          }
          .brand-logo {
            height: 21px;
            width: auto;
          }
          .nav-actions { display: none; }
          .menu-toggle { display: block; }
        }
      `}</style>

      <ScrollToTop />

      <HidingHeader />
      <ContactFloat />

      <div className="route-content">
        <CanonicalLink />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/project/:slug" element={<ProjectDetail />} />
          <Route path="/process/:slug" element={<WorkflowPage />} />
          <Route path="/privacy" element={<Privacy />} />
        </Routes>
      </div>
    </div>
  );
}
