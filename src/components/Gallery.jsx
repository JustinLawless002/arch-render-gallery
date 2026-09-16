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
      {/*
        Scoped, high-specificity rules for just the pieces that were causing
        misalignment (the image box itself). Deliberately not touching
        .tile-caption/.tile-index/.tile-title here, since those are already
        styled elsewhere — this only forces every thumbnail into an
        identical-ratio box instead of rendering at native image size, which
        is what was breaking row alignment when source images varied in
        dimensions. Adjust the aspect-ratio value (currently 4 / 3) to match
        your source photos' typical framing if most are more square or more
        panoramic.
      */}
      <style>{`
        .gallery {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(560px, 1fr));
          gap: 24px;
        }
        .gallery .tile-button {
          display: block !important;
          position: relative;
          width: 100% !important;
          aspect-ratio: 4 / 3 !important;
          overflow: hidden;
        }
        .gallery .tile-button img {
          position: absolute;
          inset: 0;
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          display: block;
        }
      `}</style>

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
