// Slow, eased page scrolling ("seek") used by every in-page link.
//
// The browser's own `behavior: 'smooth'` isn't used: its speed can't be
// set, it's quick over long distances, and Chrome on Windows switches it
// off entirely when the system "animation effects" setting is off, so
// the page would just jump. This runs the same everywhere.
//
// Tuning: duration grows with distance, between MIN_MS and MAX_MS.
const MIN_MS = 700;
const MAX_MS = 1500;
const MS_PER_PX = 0.27;

// Gentle start, gentle landing.
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

let active = null; // the running animation, so a new click replaces it

function stopActive() {
  if (!active) return;
  cancelAnimationFrame(active.raf);
  active.cleanup();
  active = null;
}

// `getTarget` is re-read every frame, so if something above the target
// changes height mid-scroll (an image loading, say), it still lands exactly.
export function smoothScrollTo(getTarget) {
  stopActive();
  const read = typeof getTarget === 'function' ? getTarget : () => getTarget;
  const maxY = () => document.documentElement.scrollHeight - window.innerHeight;
  const clampY = (y) => Math.max(0, Math.min(maxY(), y));

  const startY = window.scrollY;
  const distance = Math.abs(clampY(read()) - startY);
  if (distance < 2) return;
  const duration = Math.min(MAX_MS, Math.max(MIN_MS, distance * MS_PER_PX));
  const t0 = performance.now();

  // Any real scrolling input from the visitor takes over immediately.
  const cancel = () => stopActive();
  const cancelKeys = (e) => {
    if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(e.key)) cancel();
  };
  window.addEventListener('wheel', cancel, { passive: true });
  window.addEventListener('touchstart', cancel, { passive: true });
  window.addEventListener('keydown', cancelKeys);

  const run = {
    raf: 0,
    cleanup() {
      window.removeEventListener('wheel', cancel);
      window.removeEventListener('touchstart', cancel);
      window.removeEventListener('keydown', cancelKeys);
    },
  };
  active = run;

  const step = (now) => {
    const p = Math.min(1, (now - t0) / duration);
    const target = clampY(read());
    window.scrollTo(0, startY + (target - startY) * ease(p));
    if (p < 1) run.raf = requestAnimationFrame(step);
    else {
      run.cleanup();
      if (active === run) active = null;
    }
  };
  run.raf = requestAnimationFrame(step);
}

// Scroll so a section's top sits just below the top edge of the screen.
export function scrollToId(id, offset = 24) {
  const el = document.getElementById(id);
  if (!el) return false;
  smoothScrollTo(() => el.getBoundingClientRect().top + window.scrollY - offset);
  return true;
}
