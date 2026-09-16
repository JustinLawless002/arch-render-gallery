import { useState, useCallback } from 'react';
import './HeroBanner.css';

// The 4 clips have been combined into a single file with the transitions
// baked in and set to loop — this replaces the entire multi-<video>
// crossfade/preload/priming setup from earlier, which turned out to be
// fragile across browsers no matter how the play/pause timing was tuned.
// One continuously-looping video sidesteps that class of bug entirely.
const HERO_SRC = '/videos/hero/hero.webm';

// Static poster shown instantly on load, before the video can paint its
// first frame. Hidden for good the moment real playback starts.
const POSTER_SRC = '/videos/hero/modern-house-front.jpg';

// NOTE: this deliberately does NOT check prefers-reduced-motion. An
// earlier version respected it (skipping autoplay for visitors who have
// that OS/browser accessibility setting on) — removed by explicit
// instruction. Worth knowing if this ever comes up again: some visitors
// have that setting on specifically because motion causes them real
// discomfort, not just as a performance preference, so this hero will
// autoplay for them regardless.
export default function HeroBanner({ children }) {
  const [showPoster, setShowPoster] = useState(true);
  const hidePoster = useCallback(() => setShowPoster(false), []);

  return (
    <section className="hero">
      {showPoster && <img className="hero__poster" src={POSTER_SRC} alt="" aria-hidden="true" />}
      <video
        className="hero__video"
        src={HERO_SRC}
        muted
        autoPlay
        loop
        playsInline
        preload="auto"
        onPlaying={hidePoster}
      />
      <div className="hero__scrim" />
      <div className="hero__content">{children}</div>
    </section>
  );
}
