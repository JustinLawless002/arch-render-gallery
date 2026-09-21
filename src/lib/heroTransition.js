// Tiny hand-off between the gallery (where a thumbnail is clicked) and the
// project page (where that image becomes the hero). React Router unmounts
// the homepage before the project page mounts, so the only thing that can
// carry "where was the thumbnail on screen?" across the navigation is a
// module-level variable like this one.
//
// It is deliberately *peeked*, not consumed: React StrictMode (dev only)
// runs mount logic twice, and a consume-once design would leave the second
// pass with nothing. The entry expires after 2s and is cleared explicitly
// when the transition finishes.

let pending = null;

export function stashHeroTransition(data) {
  pending = { ...data, at: performance.now() };
}

export function peekHeroTransition(slug) {
  if (!pending) return null;
  if (pending.slug !== slug) return null;
  if (performance.now() - pending.at > 2000) return null;
  return pending;
}

export function clearHeroTransition() {
  pending = null;
}
