// Shared with both MotionSection (home page) and ProjectDetail (project pages).
// `slug` here should match the lowercase, space-separated slug that Gallery's
// still images resolve to (see works.js / projectDetails.js) so a still and
// its matching motion clip can be cross-linked on the project detail page.

const clips = [
  {
    id: 'junichi-villa',
    slug: 'junichi villa',
    title: 'Junichi Villa',
    src: '/videos/Junichi-villa.mp4',
    poster: '/videos/posters/Junichi-villa.jpg',
  },
  {
    id: 'tamdeen-square',
    slug: 'tamdeen square',
    title: 'Tamdeen Square',
    src: '/videos/Tamdeen Square.mp4',
    poster: '/videos/posters/Tamdeen Square.jpg',
  },
  {
    id: 'adel',
    slug: 'adel villa',
    title: 'Adel Villa',
    src: '/videos/Adel.mp4',
    poster: '/videos/posters/Adel.jpg',
  },
  {
    id: 'al-nawah',
    slug: 'al nawah',
    title: 'Al-Nawah Villa',
    src: '/videos/Al-Nawah.mp4',
    poster: '/videos/posters/Al-Nawah.jpg',
  },
  {
    id: 'atelier',
    slug: 'atelier',
    title: 'The Atelier',
    src: '/videos/Atelier.mp4',
    poster: '/videos/posters/Atelier.jpg',
  },
  {
    id: 'chocomelt-bahrain',
    slug: 'chocomelt',
    // TEMPORARY: Chocomelt2x.jpeg is aliased to this same clip until you
    // clarify what distinguishes the two still images. Only one card shows
    // in the Motion grid; both project pages will still find this video.
    aliasSlugs: ['chocomelt2x'],
    title: 'Chocomelt',
    hideInMotion: true, // removed from the homepage Motion grid; delete this line to show it again
    src: '/videos/Chocomelt_Bahrain.mp4',
    poster: '/videos/posters/Chocomelt_Bahrain.jpg',
  },
  {
    id: 'villa-gemericik',
    slug: 'villa gemericik',
    title: 'Villa Gemericik',
    src: '/videos/villa-gemericik.mp4',
    poster: '/videos/posters/villa-gemericik.jpg',
  },
  {
    id: 'the-point',
    slug: 'the point',
    title: 'The Point',
    src: '/videos/The-Point.mp4',
    poster: '/videos/posters/The-Point.jpg',
  },
  {
    id: 'ofk-habra',
    slug: 'ofk habra',
    title: 'Open Flame Kitchen',
    src: '/videos/OFK-Habra.mp4',
    poster: '/videos/posters/OFK-Habra.jpg',
  },
];

export function getClipForSlug(slug) {
  return clips.find((c) => c.slug === slug || c.aliasSlugs?.includes(slug)) || null;
}

export default clips;
