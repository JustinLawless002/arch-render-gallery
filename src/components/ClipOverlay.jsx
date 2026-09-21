import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { animate } from 'motion/react';

/**
 * Fullscreen video overlay — shared by MotionSection (homepage) and
 * ProjectDetail (individual project pages) so clicking any clip, from
 * either location, opens the exact same experience: true aspect ratio
 * preserved, rounded corners, native controls, closeable via the X
 * button, clicking the dark backdrop, or pressing Escape.
 *
 * Motion: the video grows out of the phone frame that was clicked
 * (`originEl`, the frame's <video>) into its fullscreen size, and shrinks
 * back into the frame on close. Everything is positioned in viewport
 * coordinates (position: fixed), so it is unaffected by page scroll.
 * If the frame has been scrolled out of view by the time the overlay is
 * closed, it fades out in place instead.
 */

const EASE = [0.16, 1, 0.3, 1];
const OPEN_MS = 0.6;
const CLOSE_MS = 0.45;

// Largest box with aspect ratio `ar` that fits within 92% of the viewport,
// centred — the same "max 92vh / 92vw" bounds the old overlay used.
function fitRect(ar) {
  const maxW = window.innerWidth * 0.92;
  const maxH = window.innerHeight * 0.92;
  let height = maxH;
  let width = height * ar;
  if (width > maxW) {
    width = maxW;
    height = width / ar;
  }
  return {
    top: (window.innerHeight - height) / 2,
    left: (window.innerWidth - width) / 2,
    width,
    height,
  };
}

function readRect(el) {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (!r.width || !r.height) return null;
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

function isOnScreen(r) {
  return (
    r.top < window.innerHeight &&
    r.top + r.height > 0 &&
    r.left < window.innerWidth &&
    r.left + r.width > 0
  );
}

function aspectOf(video) {
  return video && video.videoWidth && video.videoHeight
    ? video.videoWidth / video.videoHeight
    : 9 / 16;
}

export default function ClipOverlay({ clip, originEl, onClose }) {
  const frameRef = useRef(null);
  const backdropRef = useRef(null);
  const closing = useRef(false);
  const arRef = useRef(aspectOf(originEl));
  const [showControls, setShowControls] = useState(false);
  const [chromeVisible, setChromeVisible] = useState(false); // close button

  // Measured once, before first paint, so the frame is drawn already sitting
  // on top of the phone frame it came from.
  const [start] = useState(() => ({
    rect: readRect(originEl) || fitRect(arRef.current),
    radius: originEl ? parseFloat(getComputedStyle(originEl).borderRadius) || 16 : 16,
  }));

  // Hide the phone-frame video underneath while the overlay copy stands in
  // for it, so there aren't two of them on screen.
  useLayoutEffect(() => {
    if (!originEl) return undefined;
    const previous = originEl.style.visibility;
    originEl.style.visibility = 'hidden';
    return () => {
      originEl.style.visibility = previous;
    };
  }, [originEl]);

  // Open
  useEffect(() => {
    // One frame later, so the close button's fade-in has a starting state.
    const raf = requestAnimationFrame(() => setChromeVisible(true));
    const frame = frameRef.current;
    const backdrop = backdropRef.current;
    if (!frame || !backdrop) return () => cancelAnimationFrame(raf);
    const t = fitRect(arRef.current);
    const a = animate(
      frame,
      { top: t.top, left: t.left, width: t.width, height: t.height, borderRadius: 8 },
      { duration: OPEN_MS, ease: EASE }
    );
    const b = animate(backdrop, { opacity: 1 }, { duration: OPEN_MS * 0.7, ease: 'easeOut' });
    a.then(() => {
      if (!closing.current) setShowControls(true);
    }).catch(() => {});
    return () => {
      cancelAnimationFrame(raf);
      a.stop();
      b.stop();
    };
  }, []);

  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    setShowControls(false);
    setChromeVisible(false);

    const frame = frameRef.current;
    const backdrop = backdropRef.current;
    if (!frame || !backdrop) {
      onClose();
      return;
    }

    const target = readRect(originEl);
    const frameAnim =
      target && isOnScreen(target)
        ? animate(
            frame,
            {
              top: target.top,
              left: target.left,
              width: target.width,
              height: target.height,
              borderRadius: start.radius,
            },
            { duration: CLOSE_MS, ease: EASE }
          )
        : animate(frame, { opacity: 0 }, { duration: CLOSE_MS * 0.6, ease: 'easeOut' });
    const backdropAnim = animate(backdrop, { opacity: 0 }, { duration: CLOSE_MS, ease: 'easeOut' });

    Promise.all([frameAnim, backdropAnim])
      .catch(() => {})
      .then(onClose);
  }, [onClose, originEl, start.radius]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close]);

  // Keep the frame centred if the window is resized while it's open.
  useEffect(() => {
    const onResize = () => {
      const frame = frameRef.current;
      if (!frame || closing.current) return;
      const t = fitRect(arRef.current);
      frame.style.top = `${t.top}px`;
      frame.style.left = `${t.left}px`;
      frame.style.width = `${t.width}px`;
      frame.style.height = `${t.height}px`;
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // If the frame's video hadn't reported its dimensions when clicked (the
  // 9:16 fallback was used), correct the target once the real ones arrive.
  const handleMetadata = (e) => {
    const real = aspectOf(e.currentTarget);
    if (Math.abs(real - arRef.current) < 0.001 || closing.current) return;
    arRef.current = real;
    const t = fitRect(real);
    animate(
      frameRef.current,
      { top: t.top, left: t.left, width: t.width, height: t.height },
      { duration: 0.3, ease: EASE }
    );
  };

  return (
    <div className="clip-overlay" onClick={close}>
      <style>{`
        .clip-overlay {
          position: fixed;
          inset: 0;
          z-index: 1000;
        }
        .clip-overlay-backdrop {
          position: absolute;
          inset: 0;
          background: rgba(8, 9, 9, 0.94);
          opacity: 0;
        }
        .clip-overlay-frame {
          position: fixed;
          overflow: hidden;
          background: #000;
        }
        .clip-overlay-video {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
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
          opacity: 0;
          transition: opacity 0.3s ease 0.25s, background 0.2s ease, border-color 0.2s ease;
        }
        .clip-overlay-close.is-visible {
          opacity: 1;
        }
        .clip-overlay-close:hover {
          background: var(--accent);
          border-color: var(--accent);
        }
      `}</style>

      <div ref={backdropRef} className="clip-overlay-backdrop" />

      <button
        type="button"
        className={`clip-overlay-close${chromeVisible ? ' is-visible' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          close();
        }}
        aria-label="Close"
      >
        ✕
      </button>

      <div
        ref={frameRef}
        className="clip-overlay-frame"
        style={{
          top: start.rect.top,
          left: start.rect.left,
          width: start.rect.width,
          height: start.rect.height,
          borderRadius: start.radius,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <video
          className="clip-overlay-video"
          src={clip.src}
          poster={clip.poster}
          autoPlay
          loop
          controls={showControls}
          playsInline
          onLoadedMetadata={handleMetadata}
        />
      </div>
    </div>
  );
}
