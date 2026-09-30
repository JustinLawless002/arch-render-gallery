import { useRef, useState } from "react";
import ClipOverlay from "./ClipOverlay.jsx";
import Reveal from "./Reveal.jsx";
import RevealLines from "./RevealLines.jsx";

/**
 * Motion section — sits below (or as a tab beside) the main image gallery.
 * Clips sit in a 3-column, 3-row grid (wraps to 2 then 1 column on smaller
 * screens), each shown in the same vertical phone-mockup frame regardless
 * of the source clip's own aspect ratio — a horizontal clip is simply
 * cropped to fit, same as object-fit: cover on an image. Clicking a clip
 * opens it via the shared ClipOverlay component (also used on project
 * detail pages) so the expand behavior is identical everywhere.
 *
 * Uses the site's shared CSS variables (--bg, --text, --accent, --font-*
 * etc., defined in index.css) so it stays visually consistent with the
 * rest of the site rather than carrying its own separate palette.
 *
 * Drop-in usage:
 *   <MotionSection clips={clips} />
 *
 * clips = [
 *   { id: "01", title: "Lakeside Villa — Dusk", src: "/videos/lakeside-01.mp4", poster: "/videos/posters/lakeside-01.jpg" },
 *   ...
 * ]
 */

function ClipCard({ clip, index, onExpand }) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  // The poster stays on top of the video and only fades out once the video
  // actually has a real frame on screen (the 'playing' event) — swapping on
  // a timer or on play() instead risks a black flash between the poster
  // disappearing and the browser having decoded anything to show yet.
  const [showPoster, setShowPoster] = useState(true);

  const handleEnter = () => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = 0;
    v.play().catch(() => {});
    setIsPlaying(true);
  };

  const handleLeave = () => {
    const v = videoRef.current;
    if (!v) return;
    v.pause();
    setIsPlaying(false);
    setShowPoster(true);
  };

  return (
    <Reveal
      as="div"
      className="clip-card"
      delay={(index % 3) * 0.1}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onFocus={handleEnter}
      onBlur={handleLeave}
      tabIndex={0}
    >
      <div className="phone-frame" onClick={() => onExpand(clip, videoRef.current)}>
        <div className="phone-notch" />
        <video
          ref={videoRef}
          className="clip-video"
          src={clip.src}
          poster={clip.poster}
          muted
          loop
          playsInline
          preload="metadata"
          onPlaying={() => setShowPoster(false)}
        />
        {/* Crossfades out over the video once real frames are playing,
            instead of the browser's own abrupt poster→frame swap. */}
        <img
          src={clip.poster}
          alt=""
          aria-hidden="true"
          className="clip-poster"
          style={{ opacity: showPoster ? 1 : 0 }}
        />
        {!isPlaying && <div className="clip-play-hint">▶</div>}
      </div>

      <div className="clip-caption">{clip.title}</div>
    </Reveal>
  );
}

// nested: shown as a subsection inside the Projects gallery (which already
// supplies the page side padding), with a smaller heading.
export default function MotionSection({ clips = [], nested = false }) {
  // { clip, el } — `el` is the clicked card's <video>, which the overlay
  // grows out of and shrinks back into.
  const [expanded, setExpanded] = useState(null);

  return (
    <section className={`motion-section${nested ? ' motion-section--nested' : ''}`} id="motion" aria-label="Motion work">
      <style>{`
        .motion-section {
          padding: 96px 0 112px;
        }
        .motion-header {
          padding: 0 var(--page-gutter, 48px);
          margin-bottom: 48px;
        }
        .motion-eyebrow {
          font-family: var(--font-mono);
          font-size: 12px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--text-dim);
        }
        .motion-title {
          font-family: var(--font-display);
          font-size: clamp(28px, 4vw, 44px);
          font-weight: 600;
          letter-spacing: -0.01em;
          margin: 6px 0 0;
        }
        /* Subsection of Projects gallery: no extra side padding (the
           gallery section already has it) and a smaller, h3-level title. */
        .motion-section--nested { padding: 88px 0 24px; }
        .motion-section--nested .motion-header,
        .motion-section--nested .clip-grid { padding-left: 0; padding-right: 0; }
        .motion-section--nested .motion-title { font-size: clamp(22px, 2.6vw, 30px); }
        /* Desktop: the phone frames are 340px wide, so plain 1fr columns
           left big empty strips between them. Pack them to 340px columns,
           centred, with the gaps cut by ~60%. */
        @media (min-width: 901px) {
          .motion-section .clip-grid {
            grid-template-columns: repeat(4, minmax(0, 340px)); /* 4 across × 2 rows */
            justify-content: center;
            column-gap: 46px;
            row-gap: 16px; /* was 40px */
          }
        }
        .clip-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 40px 32px;
          padding: 0 var(--page-gutter, 48px);
        }
        @media (max-width: 900px) {
          .clip-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 560px) {
          .clip-grid { grid-template-columns: 1fr; padding: 0 24px; gap: 40px; }
          .motion-section--nested { padding: 64px 0 16px; }
        }
        .clip-card {
          outline: none;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          width: 100%;
          max-width: 340px;
          margin: 0 auto;
        }
        .phone-frame {
          position: relative;
          width: 100%;
          max-width: 340px;
          aspect-ratio: 9 / 16;
          background: var(--bg-elevated);
          border: 1px solid var(--line);
          border-radius: 22px;
          padding: 6px;
          box-shadow: 0 20px 40px -20px rgba(0,0,0,0.6);
          transition: border-color 0.25s ease;
          cursor: pointer;
          overflow: hidden;
        }
        .clip-card:hover .phone-frame,
        .clip-card:focus .phone-frame {
          border-color: var(--accent);
        }
        .phone-notch {
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
        .clip-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 16px;
          background: var(--bg-elevated);
        }
        .clip-poster {
          position: absolute;
          top: 6px;
          left: 6px;
          right: 6px;
          bottom: 6px;
          width: calc(100% - 12px);
          height: calc(100% - 12px);
          object-fit: cover;
          border-radius: 16px;
          pointer-events: none;
          transition: opacity 480ms ease;
        }
        .clip-play-hint {
          position: absolute;
          inset: 0;
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
        .clip-caption {
          font-family: var(--font-display);
          margin-top: 14px;
          font-size: 15px;
          font-weight: 500;
          color: var(--accent);
          letter-spacing: 0.01em;
          align-self: flex-start;
        }
        @media (prefers-reduced-motion: reduce) {
          .phone-frame { transition: none; }
        }
      `}</style>

      <div className="motion-header">
        <div className="motion-eyebrow">Selected animations</div>
        <RevealLines as={nested ? 'h3' : 'h2'} className="motion-title" text="Motion" />
      </div>

      <div className="clip-grid">
        {clips.filter((c) => !c.hideInMotion).map((clip, i) => (
          <ClipCard key={clip.id ?? i} clip={clip} index={i} onExpand={(c, el) => setExpanded({ clip: c, el })} />
        ))}
      </div>

      {expanded && (
        <ClipOverlay
          clip={expanded.clip}
          originEl={expanded.el}
          onClose={() => setExpanded(null)}
        />
      )}
    </section>
  );
}
