import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { animate, motion } from 'motion/react';
import { buildWorks } from '../data/works.js';
import { getClipForSlug } from '../data/clips.js';
import { peekHeroTransition, clearHeroTransition } from '../lib/heroTransition.js';
import ClipOverlay from './ClipOverlay.jsx';

const EASE = [0.16, 1, 0.3, 1];

export default function ProjectDetail() {
  const { slug } = useParams();
  const works = useMemo(buildWorks, []);
  const work = works.find((w) => w.slug === slug);
  const clip = work ? getClipForSlug(work.slug) : null;
  const [expanded, setExpanded] = useState(false);
  const phoneVideoRef = useRef(null);

  // ---- Thumbnail → hero transition -------------------------------------
  // If the visitor arrived by clicking a gallery tile, a "ghost" copy of the
  // thumbnail starts exactly where that tile was on screen and glides into
  // the hero's place, then hands over to the real (full-size) image. A
  // direct visit / refresh / back-button arrival has no hand-off data, so it
  // simply shows the page normally.
  const transition = useMemo(() => peekHeroTransition(slug), [slug]);
  const useGhost = Boolean(transition && work);
  const [ghost, setGhost] = useState(null); // { from, src }
  const [ghostArrived, setGhostArrived] = useState(!useGhost);
  const [heroLoaded, setHeroLoaded] = useState(false);
  const heroRef = useRef(null);
  const heroImgRef = useRef(null);
  const ghostRef = useRef(null);
  const started = useRef(null);

  useLayoutEffect(() => {
    if (!useGhost || started.current === slug) return;
    started.current = slug;
    // ScrollToTop (App.jsx) also does this, but it runs after this effect;
    // the hero must be measured at its final, scrolled-to-top position.
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    setGhost({ from: transition.rect, src: transition.src });
  }, [useGhost, slug, transition]);

  useEffect(() => {
    if (!ghost || !ghostRef.current || !heroRef.current) return;
    const to = heroRef.current.getBoundingClientRect();
    const controls = animate(
      ghostRef.current,
      { top: to.top, left: to.left, width: to.width, height: to.height },
      { duration: 0.75, ease: EASE }
    );
    controls.then(() => setGhostArrived(true)).catch(() => {});
    return () => controls.stop();
  }, [ghost]);

  // The ghost is only removed once the real image has actually loaded, so
  // there is never a blank frame between the two.
  useEffect(() => {
    const img = heroImgRef.current;
    if (img && img.complete && img.naturalWidth > 0) setHeroLoaded(true);
  }, [work]);

  useEffect(() => {
    if (ghost && ghostArrived && heroLoaded) {
      setGhost(null);
      clearHeroTransition();
    }
  }, [ghost, ghostArrived, heroLoaded]);

  return (
    <div className="project-detail">
      <style>{`
        .project-detail {
          min-height: 60vh;
          padding: 32px 48px 96px;
        }
        .back-link {
          display: inline-block;
          font-family: var(--font-mono);
          font-size: 13px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: var(--text-dim);
          text-decoration: none;
          margin-bottom: 32px;
        }
        .back-link:hover {
          color: var(--accent);
        }
        .project-detail-hero {
          width: 100%;
          max-height: 78vh;
        }
        .project-detail-image {
          width: 100%;
          height: 100%;
          max-height: 78vh;
          object-fit: cover;
          border: 1px solid var(--line);
          display: block;
        }
        /* Known proportions: the wrapper holds the box, the image fills it. */
        .project-detail-hero--ratio {
          position: relative;
        }
        .project-detail-hero--ratio .project-detail-image {
          position: absolute;
          inset: 0;
        }
        .project-detail-ghost {
          border: 1px solid var(--line);
          position: fixed;
          z-index: 500;
          object-fit: cover;
          pointer-events: none;
          margin: 0;
        }
        .project-detail-body {
          max-width: 900px;
          margin: 40px auto 0;
        }
        .project-detail-title {
          font-family: var(--font-display);
          font-size: clamp(26px, 4vw, 38px);
          font-weight: 600;
          margin: 0 0 24px;
        }
        .project-detail-meta {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 20px;
          margin: 0 0 28px;
          padding: 20px 0;
          border-top: 1px solid var(--line);
          border-bottom: 1px solid var(--line);
        }
        .project-detail-meta dt {
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--text-dim);
          margin-bottom: 6px;
        }
        .project-detail-meta dd {
          font-family: var(--font-body);
          margin: 0;
          font-size: 14px;
          color: var(--text);
        }
        .project-detail-description {
          font-family: var(--font-body);
          font-size: 16px;
          line-height: 1.7;
          color: var(--text-dim);
          margin: 0;
        }
        .project-detail-description.muted {
          font-style: italic;
        }

        /* Text-only layout (no matching motion clip) */
        .project-detail-content {
          display: block;
        }

        /* Two-column layout when a motion clip exists */
        .project-detail-content.with-motion {
          display: flex;
          gap: 48px;
          align-items: flex-start;
        }
        .project-detail-content.with-motion .project-detail-text {
          flex: 1;
          min-width: 0;
        }
        @media (max-width: 760px) {
          .project-detail-content.with-motion {
            flex-direction: column;
          }
        }

        /* Exact phone-frame styling reused from MotionSection, now with
           the same click-to-expand affordance and hover accent. */
        .project-detail-phone-wrap {
          flex: 0 0 auto;
          width: 100%;
          max-width: 300px;
        }
        .project-detail-phone-frame {
          position: relative;
          width: 100%;
          max-width: 300px;
          aspect-ratio: 9 / 16;
          background: var(--bg-elevated);
          border: 1px solid var(--line);
          border-radius: 22px;
          padding: 6px;
          box-shadow: 0 20px 40px -20px rgba(0,0,0,0.6);
          transition: border-color 0.25s ease;
          cursor: pointer;
        }
        .project-detail-phone-frame:hover {
          border-color: var(--accent);
        }
        .project-detail-phone-notch {
          position: absolute;
          top: 12px;
          left: 50%;
          transform: translateX(-50%);
          width: 46px;
          height: 5px;
          background: var(--line);
          border-radius: 3px;
          z-index: 2;
        }
        .project-detail-phone-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 16px;
          background: var(--bg-elevated);
          pointer-events: none;
        }
        .project-detail-play-hint {
          position: absolute;
          inset: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          color: var(--text);
          background: rgba(0,0,0,0.15);
          border-radius: 16px;
          pointer-events: none;
          opacity: 0.85;
        }
        .project-detail-motion-heading {
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--text-dim);
          margin: 0 0 12px;
        }

        @media (max-width: 560px) {
          .project-detail { padding: 24px 24px 64px; }
        }
      `}</style>

      <Link to="/" className="back-link">
        ← Back to gallery
      </Link>

      {!work ? (
        <p>Project not found.</p>
      ) : (
        <>
          <div
            ref={heroRef}
            className={`project-detail-hero${transition?.ar ? ' project-detail-hero--ratio' : ''}`}
            style={{
              // When we know the image's proportions (arrived via a tile
              // click) reserve the exact box up front, so the ghost knows
              // where to land before the full image has downloaded.
              aspectRatio: transition?.ar || undefined,
              opacity: ghostArrived ? 1 : 0,
            }}
          >
            <img
              ref={heroImgRef}
              src={work.full}
              alt={work.title}
              className="project-detail-image"
              onLoad={() => setHeroLoaded(true)}
            />
          </div>

          {ghost && (
            <img
              ref={ghostRef}
              src={ghost.src}
              alt=""
              aria-hidden="true"
              className="project-detail-ghost"
              style={{
                top: ghost.from.top,
                left: ghost.from.left,
                width: ghost.from.width,
                height: ghost.from.height,
              }}
            />
          )}

          <motion.div
            className="project-detail-body"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: EASE, delay: useGhost ? 0.4 : 0.05 }}
          >
            <h1 className="project-detail-title">{work.title}</h1>

            <div className={`project-detail-content${clip ? ' with-motion' : ''}`}>
              {clip && (
                <div className="project-detail-phone-wrap">
                  <div className="project-detail-motion-heading">Motion</div>
                  <div
                    className="project-detail-phone-frame"
                    onClick={() => setExpanded(true)}
                  >
                    <div className="project-detail-phone-notch" />
                    <video
                      ref={phoneVideoRef}
                      className="project-detail-phone-video"
                      src={clip.src}
                      poster={clip.poster}
                      muted
                      playsInline
                      preload="metadata"
                    />
                    <div className="project-detail-play-hint">▶</div>
                  </div>
                </div>
              )}

              <div className="project-detail-text">
                {work.detail && (work.detail.client || work.detail.year || work.detail.software) && (
                  <dl className="project-detail-meta">
                    {work.detail.client && (
                      <div>
                        <dt>Location</dt>
                        <dd>{work.detail.client}</dd>
                      </div>
                    )}
                    {work.detail.year && (
                      <div>
                        <dt>Year</dt>
                        <dd>{work.detail.year}</dd>
                      </div>
                    )}
                    {work.detail.software && (
                      <div>
                        <dt>Software</dt>
                        <dd>
                          {Array.isArray(work.detail.software)
                            ? work.detail.software.join(', ')
                            : work.detail.software}
                        </dd>
                      </div>
                    )}
                  </dl>
                )}

                {work.detail?.description ? (
                  <p className="project-detail-description">{work.detail.description}</p>
                ) : (
                  <p className="project-detail-description muted">Project details coming soon.</p>
                )}
              </div>
            </div>
          </motion.div>

          {clip && expanded && (
            <ClipOverlay
              clip={clip}
              originEl={phoneVideoRef.current}
              onClose={() => setExpanded(false)}
            />
          )}
        </>
      )}
    </div>
  );
}
