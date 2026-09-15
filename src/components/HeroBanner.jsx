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
// video can play) and permanently for prefers-reduced-motion users.
const POSTER_SRC = '/videos/hero/modern-house-front.jpg';

export default function HeroBanner({ children }) {
  const [activeSlot, setActiveSlot] = useState(0); // which <video> element (0 or 1) is on top
  const [clipIndex, setClipIndex] = useState(0); // which clip is currently showing
  const [reducedMotion, setReducedMotion] = useState(false);

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
  // this same event), then flip the state that swaps CSS visibility. This
  // ordering matters: doing it the other way around (swap first, reset
  // later in an effect) is what caused the "flicks to a previous frame"
  // glitch — the browser would paint the incoming video visible for a
  // moment while it was still sitting at its old paused end-of-clip frame.
  const advance = useCallback(() => {
    setActiveSlot((prevSlot) => {
      const nextSlot = prevSlot === 0 ? 1 : 0;
      const incoming = videoRefs[nextSlot].current;
      if (incoming) {
        incoming.muted = true;
        incoming.currentTime = 0;
        incoming.play().catch(() => {
          /* autoplay can be blocked in rare cases; the poster stays visible */
        });
      }
      return nextSlot;
    });
    setClipIndex((i) => (i + 1) % CLIPS.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Start the very first clip on mount. Set .muted imperatively rather than
  // relying solely on the JSX attribute — some desktop browsers ignore the
  // JSX-set muted property's timing and block autoplay-with-sound as a
  // result, even though the intent was always muted playback.
  useEffect(() => {
    if (reducedMotion) return;
    const first = videoRefs[0].current;
    if (first) {
      first.muted = true;
      first.play().catch(() => {});
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
      {POSTER_SRC && <img className="hero__poster" src={POSTER_SRC} alt="" aria-hidden="true" />}
      {[0, 1].map((slot) => (
        <video
          key={slot}
          ref={videoRefs[slot]}
          className={`hero__video ${activeSlot === slot ? 'hero__video--visible' : ''}`}
          muted
          playsInline
          onEnded={advance}
          {...(slot === 0 ? { src: CLIPS[0], 'data-clip': CLIPS[0] } : {})}
        />
      ))}
      <div className="hero__scrim" />
      <div className="hero__content">{children}</div>
    </section>
  );
}
