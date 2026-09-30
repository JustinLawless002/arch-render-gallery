import './HeroBanner.css';

// The 4 clips have been combined into a single file with the transitions
// baked in and set to loop — this replaces the entire multi-<video>
// crossfade/preload/priming setup from earlier, which turned out to be
// fragile across browsers no matter how the play/pause timing was tuned.
// One continuously-looping video sidesteps that class of bug entirely.
const HERO_SRC = '/videos/hero/hero.webm';

// NOTE: this deliberately does NOT check prefers-reduced-motion. An
// earlier version respected it (skipping autoplay for visitors who have
// that OS/browser accessibility setting on) — removed by explicit
// instruction. Worth knowing if this ever comes up again: some visitors
// have that setting on specifically because motion causes them real
// discomfort, not just as a performance preference, so this hero will
// autoplay for them regardless.
// corner: optional buttons floated over the video's bottom-right corner
// (About + Contact on the homepage). Hidden at phone width, where they
// live in the hamburger menu instead.
export default function HeroBanner({ children, corner = null }) {
  return (
    <section className="hero">
      <video
        className="hero__video"
        src={HERO_SRC}
        muted
        autoPlay
        loop
        playsInline
        preload="auto"
        onError={(e) => {
          const err = e.currentTarget.error;
          // eslint-disable-next-line no-console
          console.error('Hero video failed to load/decode:', err && err.message, err);
        }}
      />
      <div className="hero__scrim" />
      {/* Soft fade from the video into the page background, so there's
          no hard edge where the hero ends. */}
      <div className="hero__fade" aria-hidden="true" />
      <div className="hero__content">{children}</div>
      {corner && <div className="hero__corner">{corner}</div>}
    </section>
  );
}
