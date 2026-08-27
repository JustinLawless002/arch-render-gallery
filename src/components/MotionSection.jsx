import { useRef, useState } from "react";
import ClipOverlay from "./ClipOverlay.jsx";

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
  const [isMuted, setIsMuted] = useState(true);

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
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    const next = !v.muted;
    v.muted = next;
    setIsMuted(next);
    // Unmuting is a direct click, so browsers allow it — make sure
    // it's actually playing rather than sitting on the poster frame.
    if (!next) {
      v.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  return (
    <div
      className="clip-card"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onFocus={handleEnter}
      onBlur={handleLeave}
      tabIndex={0}
    >
      <div className="clip-index">M-{String(index + 1).padStart(2, "0")}</div>

      <div className="phone-frame" onClick={() => onExpand(clip)}>
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
        />
        {!isPlaying && <div className="clip-play-hint">▶</div>}
        <button
          type="button"
          className="mute-toggle"
          onClick={toggleMute}
          aria-label={isMuted ? "Unmute clip" : "Mute clip"}
        >
          {isMuted ? "🔇" : "🔊"}
        </button>
      </div>

      <div className="clip-caption">{clip.title}</div>
    </div>
  );
}

export default function MotionSection({ clips = [] }) {
  const [expandedClip, setExpandedClip] = useState(null);

  return (
    <section className="motion-section" aria-label="Motion work">
      <style>{`
        .motion-section {
          padding: 96px 0 112px;
        }
        .motion-header {
          padding: 0 48px;
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
        .clip-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 40px 32px;
          padding: 0 48px;
        }
        @media (max-width: 900px) {
          .clip-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 560px) {
          .clip-grid { grid-template-columns: 1fr; padding: 0 24px; gap: 40px; }
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
        .clip-index {
          font-family: var(--font-mono);
          font-size: 11px;
          color: var(--accent);
          letter-spacing: 0.05em;
          margin-bottom: 12px;
          align-self: flex-start;
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
        .mute-toggle {
          position: absolute;
          bottom: 16px;
          right: 16px;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: none;
          background: rgba(0,0,0,0.55);
          color: var(--text);
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 3;
        }
        .mute-toggle:hover {
          background: var(--accent);
        }
        .clip-caption {
          font-family: var(--font-body);
          margin-top: 14px;
          font-size: 14px;
          color: var(--text-dim);
          letter-spacing: 0.01em;
          align-self: flex-start;
        }
        @media (prefers-reduced-motion: reduce) {
          .phone-frame { transition: none; }
        }
      `}</style>

      <div className="motion-header">
        <div className="motion-eyebrow">Selected animations</div>
        <h2 className="motion-title">Motion</h2>
      </div>

      <div className="clip-grid">
        {clips.map((clip, i) => (
          <ClipCard key={clip.id ?? i} clip={clip} index={i} onExpand={setExpandedClip} />
        ))}
      </div>

      {expandedClip && (
        <ClipOverlay clip={expandedClip} onClose={() => setExpandedClip(null)} />
      )}
    </section>
  );
}
