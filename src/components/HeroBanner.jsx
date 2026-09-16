import { useState, useRef, useEffect, useCallback } from 'react';
import './HeroBanner.css';

// Drop your 4 files into /public/videos/hero/ with these exact
// lowercase, hyphenated names (Vercel's Linux build is case-sensitive,
// unlike Windows/Mac, so mismatched casing will 404 in production).
const CLIPS = [
  '/videos/hero/modern-house-front.mp4',
  '/videos/hero/modern-house-living-room.mp4',
  '/videos/hero/modern-house-back.mp4',
  '/videos/hero/modern-house-3-4.mp4',
];

// Optional: a static poster shown instantly on load (before the first
// video can paint a frame) — hidden for good the moment real playback
// starts, see showPoster below.
const POSTER_SRC = '/videos/hero/modern-house-front.jpg';

export default function HeroBanner({ children }) {
  const [activeSlot, setActiveSlot] = useState(0); // which <video> element (0 or 1) is on top
  const [clipIndex, setClipIndex] = useState(0); // which clip is currently showing
  // Read the real value BEFORE the first render (a lazy useState
  // initializer runs synchronously on mount) rather than defaulting to
  // false and correcting it a moment later in an effect. That earlier
  // pattern was the actual cause of the desktop Chrome AbortError: if this
  // environment does have prefers-reduced-motion set, the component would
  // render the video branch first, call .play() on it, and THEN re-render
  // into the poster-only branch once the effect caught up — unmounting the
  // video element while its play() was still pending, which Chrome reports
  // as "interrupted by a new load request." Computing it up front means
  // the correct branch renders from the very first paint, so no
  // mid-playback unmount can happen.
  const [reducedMotion, setReducedMotion] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  );

  // The poster was staying mounted (and fully opaque) underneath both
  // videos for the entire session. During a crossfade both videos briefly
  // dip below full opacity at the same time, and since the poster behind
  // them never fades, it showed through in that gap — on every transition,
  // not just the first one. Fix: permanently hide it the moment the first
  // real frame renders, well before any crossfade can ever happen.
  const [showPoster, setShowPoster] = useState(true);
  const hidePoster = useCallback(() => setShowPoster(false), []);

  const videoRefs = [useRef(null), useRef(null)];

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (e) => setReducedMotion(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Preload the *next* clip into the currently-hidden video element, and
  // PRIME it: briefly play it (muted, invisible — opacity 0 via CSS) until
  // the browser confirms a real frame has actually rendered, then pause it
  // right back at the start. This keeps its decoder warmed up for however
  // long it sits hidden (several seconds, the full remaining length of the
  // current clip), rather than starting cold exactly at the crossfade
  // moment — which was the actual cause of the black-flash stall, even
  // after an earlier attempt to fix it by starting playback ~0.6s early:
  // that attempt relied on reading the video's `duration` property to know
  // when "0.6s before the end" was, and some mobile-encoded MP4s don't
  // report a reliable duration on the element (NaN, or resolves late) —
  // so that check silently failed and quietly fell back to the same cold
  // start as before. This approach doesn't depend on duration at all.
  useEffect(() => {
    if (reducedMotion) return;
    const hiddenSlot = activeSlot === 0 ? 1 : 0;
    const nextIndex = (clipIndex + 1) % CLIPS.length;
    const hiddenVideo = videoRefs[hiddenSlot].current;
    if (hiddenVideo && hiddenVideo.dataset.clip !== CLIPS[nextIndex]) {
      hiddenVideo.muted = true;
      hiddenVideo.src = CLIPS[nextIndex];
      hiddenVideo.dataset.clip = CLIPS[nextIndex];

      const primeOnce = () => {
        hiddenVideo.removeEventListener('playing', primeOnce);
        hiddenVideo.pause();
        hiddenVideo.currentTime = 0;
      };
      hiddenVideo.addEventListener('playing', primeOnce);

      hiddenVideo.load();
      hiddenVideo.play().catch(() => {
        hiddenVideo.removeEventListener('playing', primeOnce);
      });
    }
  }, [activeSlot, clipIndex, reducedMotion]);

  // The incoming video was already primed above (played briefly then
  // paused at the start, as soon as it preloaded) — this just resumes an
  // already-warmed decoder rather than starting one cold, and flips which
  // slot is visible.
  const advance = useCallback(() => {
    setActiveSlot((prevSlot) => {
      const nextSlot = prevSlot === 0 ? 1 : 0;
      const incoming = videoRefs[nextSlot].current;
      if (incoming) {
        incoming.muted = true;
        const p = incoming.play();
        if (p && typeof p.catch === 'function') {
          p.catch((err) => {
            // eslint-disable-next-line no-console
            console.error(`Hero video ${incoming.dataset.clip} failed to play on transition:`, err);
          });
        }
      }
      return nextSlot;
    });
    setClipIndex((i) => (i + 1) % CLIPS.length);
  }, []);

  // Start the very first clip on mount. .muted is set imperatively (not
  // just via the JSX attribute) since some browsers check the property's
  // state at the moment .play() is called rather than at initial markup.
  useEffect(() => {
    if (reducedMotion) return;
    const first = videoRefs[0].current;
    if (first) {
      first.muted = true;
      const p = first.play();
      if (p && typeof p.catch === 'function') {
        p.catch((err) => {
          // If this logs on desktop Chrome, the message here (open
          // DevTools → Console) tells us exactly why the browser refused
          // to play — e.g. an autoplay-policy rejection vs. the file
          // itself failing to decode — rather than us guessing further.
          // eslint-disable-next-line no-console
          console.error('Hero video autoplay was blocked or failed:', err);
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion]);

  if (reducedMotion) {
    return (
      <section className="hero">
        <img className="hero__poster" src={POSTER_SRC} alt="" aria-hidden="true" />
        <div className="hero__scrim" />
        <div className="hero__content">{children}</div>
      </section>
    );
  }

  return (
    <section className="hero">
      {showPoster && POSTER_SRC && (
        <img className="hero__poster" src={POSTER_SRC} alt="" aria-hidden="true" />
      )}
      {[0, 1].map((slot) => (
        <video
          key={slot}
          ref={videoRefs[slot]}
          className={`hero__video ${activeSlot === slot ? 'hero__video--visible' : ''}`}
          muted
          playsInline
          preload="auto"
          onPlaying={hidePoster}
          onEnded={advance}
          {...(slot === 0 ? { src: CLIPS[0], 'data-clip': CLIPS[0] } : {})}
        />
      ))}
      <div className="hero__scrim" />
      <div className="hero__content">{children}</div>
    </section>
  );
}
