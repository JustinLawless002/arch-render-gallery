import { useEffect } from 'react';

/**
 * Fullscreen video overlay — shared by MotionSection (homepage) and
 * ProjectDetail (individual project pages) so clicking any clip, from
 * either location, opens the exact same experience: true aspect ratio
 * preserved, rounded corners, native controls, closeable via the X
 * button, clicking the dark backdrop, or pressing Escape.
 */
export default function ClipOverlay({ clip, onClose }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="clip-overlay" onClick={onClose}>
      <style>{`
        .clip-overlay {
          position: fixed;
          inset: 0;
          background: rgba(8, 9, 9, 0.94);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 40px 20px;
        }
        .clip-overlay-video {
          max-height: 92vh;
          max-width: 92vw;
          border-radius: 8px;
          background: #000;
        }
        .clip-overlay-close {
          position: absolute;
          top: 20px;
          right: 24px;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 1px solid var(--line);
          background: rgba(255,255,255,0.06);
          color: var(--text);
          font-size: 18px;
          cursor: pointer;
          z-index: 1001;
        }
        .clip-overlay-close:hover {
          background: var(--accent);
          border-color: var(--accent);
        }
      `}</style>

      <button type="button" className="clip-overlay-close" onClick={onClose} aria-label="Close">
        ✕
      </button>
      <video
        className="clip-overlay-video"
        src={clip.src}
        poster={clip.poster}
        autoPlay
        loop
        controls
        playsInline
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}
