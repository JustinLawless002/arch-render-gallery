import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { buildWorks } from '../data/works.js';
import { stashHeroTransition } from '../lib/heroTransition.js';

// Remembers where the clicked thumbnail is on screen so the project page can
// grow its hero image out of that exact spot (see ProjectDetail.jsx). Also
// starts downloading the full-size image now, so it is usually ready by the
// time the transition lands.
function handleTileClick(e, work) {
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; // new-tab clicks
  const frame = e.currentTarget;
  const img = frame.querySelector('img');
  if (!img) return;
  const r = frame.getBoundingClientRect();
  stashHeroTransition({
    slug: work.slug,
    rect: { top: r.top, left: r.left, width: r.width, height: r.height },
    src: img.currentSrc || img.src,
    ar: img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : null,
  });
  const pre = new Image();
  pre.src = work.full;
}

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
          grid-template-columns: repeat(auto-fill, minmax(min(680px, 100%), 1fr));
          gap: 0;
        }
        .gallery .tile {
          margin: 0 !important;
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
        <motion.figure
          className="tile"
          key={work.id}
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '0px 0px -6% 0px' }}
          // (i % 3) staggers tiles that arrive on screen together (one row)
          // without making tiles further down the page wait their turn.
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: (i % 3) * 0.09 }}
        >
          <Link
            className="tile-button"
            to={`/project/${work.slug}`}
            aria-label={`View ${work.title}`}
            onClick={(e) => handleTileClick(e, work)}
          >
            <img src={work.thumb} alt={work.title} loading="lazy" />
          </Link>
          <figcaption className="tile-caption">
            <span className="tile-index">A-{String(i + 1).padStart(2, '0')}</span>
            <span className="tile-title">{work.title}</span>
          </figcaption>
        </motion.figure>
      ))}
    </div>
  );
}
