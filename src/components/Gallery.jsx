import { useMemo, useState } from 'react';
import Lightbox from './Lightbox.jsx';

// Vite's import.meta.glob auto-discovers every processed image at build time —
// drop new files in src/assets/images/raw, run `npm run process-images`,
// and they show up here with no manual registration.
const thumbs = import.meta.glob('../assets/images/processed/*-thumb.webp', {
  eager: true,
  import: 'default',
});
const fulls = import.meta.glob('../assets/images/processed/*-full.webp', {
  eager: true,
  import: 'default',
});

function titleFromPath(p) {
  const base = p.split('/').pop().replace('-thumb.webp', '').replace('-full.webp', '');
  return base
    .split('-')
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ');
}

function buildWorks() {
  return Object.entries(thumbs)
    .map(([path, thumbSrc]) => {
      const key = path.replace('-thumb.webp', '');
      const fullPath = Object.keys(fulls).find((p) => p.replace('-full.webp', '') === key);
      return {
        id: key,
        title: titleFromPath(path),
        thumb: thumbSrc,
        full: fullPath ? fulls[fullPath] : thumbSrc,
      };
    })
    .sort((a, b) => a.title.localeCompare(b.title));
}

export default function Gallery() {
  const works = useMemo(buildWorks, []);
  const [active, setActive] = useState(null);

  if (works.length === 0) {
    return (
      <div className="empty-state">
        <h2>No renders yet</h2>
        <p>
          Drop image files into <code>src/assets/images/raw</code>, then run{' '}
          <code>npm run process-images</code>.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="gallery">
        {works.map((work, i) => (
          <figure className="tile" key={work.id}>
            <button className="tile-button" onClick={() => setActive(work)} aria-label={`Open ${work.title}`}>
              <img src={work.thumb} alt={work.title} loading="lazy" />
            </button>
            <figcaption className="tile-caption">
              <span className="tile-index">{String(i + 1).padStart(3, '0')}</span>
              <span className="tile-title">{work.title}</span>
            </figcaption>
          </figure>
        ))}
      </div>
      {active && <Lightbox work={active} onClose={() => setActive(null)} />}
    </>
  );
}
