import projectDetails, { slugifyTitle } from './projectDetails.js';

// Vite's import.meta.glob auto-discovers every processed image at build time —
// drop new files in src/assets/images/raw, run `npm run process-images`,
// and they show up here with no manual registration.
const thumbs = import.meta.glob('../assets/images/processed/*-thumb.webp', {
  eager: true,
  import: 'default',
});
const fulls = import.meta.glob('../assets/images/processed/*-full.webp', {
  eager: true,
  import: 'default',
});

function titleFromPath(p) {
  const base = p.split('/').pop().replace('-thumb.webp', '').replace('-full.webp', '');
  return base
    .split('-')
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ');
}

// Titles hidden from the gallery on request. Kept as a title list rather
// than deleting the underlying raw/processed images, so bringing one back
// later is just removing a line here — no re-uploading or reprocessing.
// "K-Land" was asked for, but no such title exists here (it's the name of
// a brand in the carousel below, not a gallery project) — "K Yard" is the
// only close match, so that's what's excluded; flag if that's wrong.
const HIDDEN_TITLES = new Set(['Chocomelt', 'Chocomelt2x', 'K Yard', 'Melanzane', 'Ofk Dubai', 'Al Othman']);

export function buildWorks() {
  return Object.entries(thumbs)
    .map(([path, thumbSrc]) => {
      const key = path.replace('-thumb.webp', '');
      const fullPath = Object.keys(fulls).find((p) => p.replace('-full.webp', '') === key);
      const title = titleFromPath(path);
      return {
        id: key,
        slug: slugifyTitle(title),
        title,
        thumb: thumbSrc,
        full: fullPath ? fulls[fullPath] : thumbSrc,
        detail: projectDetails[slugifyTitle(title)] || null,
      };
    })
    .filter((w) => !HIDDEN_TITLES.has(w.title))
    .sort((a, b) => {
      // Projects with a written description sort first (alphabetically),
      // projects still awaiting content sink to the bottom (alphabetically
      // among themselves) — so the gallery leads with finished pages.
      const aHasDetail = Boolean(a.detail?.description);
      const bHasDetail = Boolean(b.detail?.description);
      if (aHasDetail !== bHasDetail) return aHasDetail ? -1 : 1;
      return a.title.localeCompare(b.title);
    });
}
