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
  const [reducedMotion, setReducedMotion] = useState(false);

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
    setReducedMotion(mq.matches);
    const onChange = (e) => setReducedMotion(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Preload the *next* clip into the currently-hidden video element while
  // the visible one plays, so the crossfade swap never has to wait on a
  // network fetch.
  useEffect(() => {
    if (reducedMotion) return;
    const hiddenSlot = activeSlot === 0 ? 1 : 0;
    const nextIndex = (clipIndex + 1) % CLIPS.length;
    const hiddenVideo = videoRefs[hiddenSlot].current;
    if (hiddenVideo && hiddenVideo.dataset.clip !== CLIPS[nextIndex]) {
      hiddenVideo.muted = true;
      hiddenVideo.src = CLIPS[nextIndex];
      hiddenVideo.dataset.clip = CLIPS[nextIndex];
      hiddenVideo.load();
    }
  }, [activeSlot, clipIndex, reducedMotion]);

  // Reset and start the incoming video's playback FIRST (synchronously, in
  // this same event), then flip the state that swaps CSS visibility — this
  // ordering is what fixed the earlier "flicks to a stale frame" bug.
  const advance = useCallback(() => {
    setActiveSlot((prevSlot) => {
      const nextSlot = prevSlot === 0 ? 1 : 0;
      const incoming = videoRefs[nextSlot].current;
      if (incoming) {
        incoming.muted = true;
        incoming.currentTime = 0;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
