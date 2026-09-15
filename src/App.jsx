import { useEffect } from 'react';
import { Routes, Route, useLocation, Link } from 'react-router-dom';
import Gallery from './components/Gallery.jsx';
import ContactButton from './components/ContactButton.jsx';
import MotionSection from './components/MotionSection.jsx';
import About from './components/About.jsx';
import Services from './components/Services.jsx';
import SiteFooter from './components/SiteFooter.jsx';
import ProjectDetail from './components/ProjectDetail.jsx';
import HeroBanner from './components/HeroBanner.jsx';
import ProcessPage from './components/ProcessPage.jsx';
import logoIcon from './assets/logo-icon.png';
import clips from './data/clips.js';

// React Router doesn't reset scroll position on navigation by default —
// without this, clicking a gallery thumbnail while scrolled halfway down
// the homepage lands the project page at that same pixel offset instead
// of at the top.
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function Home() {
  return (
    <>
      <main>
        <HeroBanner>
          <h2 className="hero__headline">Bringing architectural vision to life</h2>
          <p className="hero__subtext">
            Concept renders, animations, and technical drawings — refined
            through AI-assisted workflows.
          </p>
          <div className="hero__actions">
            <a href="#gallery" className="hero__cta">
              View portfolio
            </a>
            <Link to="/process" className="hero__cta">
              The process
            </Link>
            {/*
              ContactButton renders its own rollout panel (emails + WhatsApp).
              It isn't guaranteed to pick up hero__cta's look unless it
              forwards a className prop down to its root button — check its
              source and adjust if the styling doesn't match View
              portfolio/The process once this is live.
            */}
            <ContactButton className="hero__cta" />
          </div>
        </HeroBanner>

        <div id="gallery">
          <Gallery />
        </div>
        <MotionSection clips={clips} />
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
          --header-h: 88px;
        }

        .site-header {
          align-items: center;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: var(--header-h);
          z-index: 100;
          background: rgba(10, 10, 10, 0.5);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }
        .brand {
          display: flex;
          align-items: center;
          gap: 16px;
          text-decoration: none;
          color: inherit;
        }
        .brand-logo {
          height: 40px;
          width: auto;
          display: block;
        }
        .brand-text {
          display: flex;
          flex-direction: column;
        }

        /* Pushes every routed page down below the fixed header. The hero
           (Home only) cancels this out itself via a negative margin so it
           still reaches the true top of the viewport — see HeroBanner.css. */
        .route-content {
          padding-top: var(--header-h);
        }
      `}</style>

      <ScrollToTop />

      <header className="site-header">
        <Link to="/" className="brand">
          <img src={logoIcon} alt="Prime Design logo" className="brand-logo" />
          <div className="brand-text">
            <h1 className="site-title">Prime Design</h1>
            <span className="site-sub">
              Architectural design, visualization &amp; AI-assisted rendering
            </span>
          </div>
        </Link>
      </header>

      <div className="route-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/project/:slug" element={<ProjectDetail />} />
          <Route path="/process" element={<ProcessPage />} />
        </Routes>
      </div>
    </div>
  );
}
