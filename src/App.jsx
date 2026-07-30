import Gallery from './components/Gallery.jsx';
import ContactButton from './components/ContactButton.jsx';

export default function App() {
  return (
    <div className="page">
      <header className="site-header">
        <div>
          <h1 className="site-title">Studio Archive</h1>
          <span className="site-sub">Selected renders</span>
        </div>
        <div className="header-right">
          <ContactButton />
        </div>
      </header>

      <main>
        <Gallery />
      </main>

      <footer className="site-footer">Studio Archive — {new Date().getFullYear()}</footer>
    </div>
  );
}
