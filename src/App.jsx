import { useEffect } from 'react';
import { Routes, Route, useLocation, Link } from 'react-router-dom';
import Gallery from './components/Gallery.jsx';
import ContactButton from './components/ContactButton.jsx';
import MotionSection from './components/MotionSection.jsx';
import About from './components/About.jsx';
import Services from './components/Services.jsx';
import SiteFooter from './components/SiteFooter.jsx';
import ProjectDetail from './components/ProjectDetail.jsx';
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
        <Gallery />
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
        .site-header {
          align-items: center;
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
        <div className="header-right">
          <ContactButton />
        </div>
      </header>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/project/:slug" element={<ProjectDetail />} />
      </Routes>
    </div>
  );
}
