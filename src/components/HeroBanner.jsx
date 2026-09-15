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
// Point this at any still frame from one of the clips, or leave as null.
const POSTER_SRC = '/videos/hero/modern-house-front.jpg';

const CROSSFADE_MS = 800;

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
      hiddenVideo.src = CLIPS[nextIndex];
      hiddenVideo.dataset.clip = CLIPS[nextIndex];
      hiddenVideo.load();
    }
  }, [activeSlot, clipIndex, reducedMotion]);

  const advance = useCallback(() => {
    setActiveSlot((s) => (s === 0 ? 1 : 0));
    setClipIndex((i) => (i + 1) % CLIPS.length);
  }, []);

  // Kick off playback of whichever slot just became active.
  useEffect(() => {
    if (reducedMotion) return;
    const video = videoRefs[activeSlot].current;
    if (video) {
      video.currentTime = 0;
      video.play().catch(() => {
        /* autoplay can be blocked in rare cases; the poster stays visible */
      });
    }
  }, [activeSlot, reducedMotion]);

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
          autoPlay={slot === 0}
          onEnded={advance}
          {...(slot === 0 ? { src: CLIPS[0], 'data-clip': CLIPS[0] } : {})}
        />
      ))}
      <div className="hero__scrim" />
      <div className="hero__content">{children}</div>
    </section>
  );
}
