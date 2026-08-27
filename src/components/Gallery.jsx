import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { buildWorks } from '../data/works.js';

export default function Gallery() {
  const works = useMemo(buildWorks, []);

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
    <div className="gallery">
      {works.map((work, i) => (
        <figure className="tile" key={work.id}>
          <Link className="tile-button" to={`/project/${work.slug}`} aria-label={`View ${work.title}`}>
            <img src={work.thumb} alt={work.title} loading="lazy" />
          </Link>
          <figcaption className="tile-caption">
            <span className="tile-index">A-{String(i + 1).padStart(2, '0')}</span>
            <span className="tile-title">{work.title}</span>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
