// Keyed by the project's exact title as it will appear in the gallery
// (Gallery.jsx builds titles from filenames by turning hyphens into spaces
// and capitalizing each word — e.g. "al-nawah-full.webp" becomes the title
// "Al Nawah" — so keys here are lowercase, space-separated versions of
// that, matched case-insensitively via slugifyTitle()).
//
// If a still image's filename doesn't produce one of these exact titles,
// its project page will just show "Project details coming soon." until
// the key is corrected to match.

const projectDetails = {
  'adel villa': {
    client: 'Kuwait',
    year: '2025',
    software: ['3ds Max', 'Corona Renderer', 'AI-assisted workflow'],
    description:
      'A full interior redesign for a residential villa, replacing a previous design from ' +
      'another firm. With no models provided by the original team, the entire exterior was ' +
      'modeled from reference by eye. The client was happy with the result.',
  },
  'al nawah': {
    client: 'Kuwait',
    year: '2025',
    software: ['3ds Max', 'Corona Renderer', 'AI-assisted workflow'],
    description:
      'A large-scale interior design project spanning three floors and a basement, aiming ' +
      'for a clean, modern, and elegant design language throughout. The client was happy ' +
      'with the outcome.',
  },
  atelier: {
    client: 'Jakarta',
    year: '2026',
    software: ['3ds Max', 'Corona Renderer', 'AI-assisted workflow'],
    description:
      'A concept boutique for a batik (traditional Indonesian cloth) shop, developed from ' +
      'simple drawings into a basic 3D model. AI-assisted workflows were used heavily to ' +
      'speed up the initial pitch. The client is happy and the project awaits further ' +
      'instructions to proceed.',
  },
  // TEMPORARY: both Chocomelt.jpeg and Chocomelt2x.jpeg are getting the
  // same placeholder description and video until you tell me what
  // distinguishes them (different locations? angles of the same one?).
  chocomelt: {
    client: 'Chocomelt — Bahrain',
    year: '2022',
    software: ['3ds Max', 'Corona Renderer', 'AI-assisted workflow'],
    description:
      'One of several ongoing locations for a recurring client. Each site brings its own ' +
      'challenge — keeping the brand design consistent yet fresh, adapting to a new location ' +
      'type, and working to tight deadlines. The client has been pleased with the results ' +
      'across every location delivered so far.',
  },
  chocomelt2x: {
    client: 'Chocomelt — Bahrain',
    year: '2022',
    software: ['3ds Max', 'Corona Renderer', 'AI-assisted workflow'],
    description:
      'One of several ongoing locations for a recurring client. Each site brings its own ' +
      'challenge — keeping the brand design consistent yet fresh, adapting to a new location ' +
      'type, and working to tight deadlines. The client has been pleased with the results ' +
      'across every location delivered so far.',
  },
  'junichi villa': {
    client: 'Bogor',
    year: '2026',
    software: ['3ds Max', 'Corona Renderer', 'AI-assisted workflow'],
    description:
      'A concept pitch for a villa in Bogor, Indonesia, built around a tropical modern ' +
      'Japanese aesthetic. AI-assisted workflows helped rapidly iterate on the design ' +
      'during the pitch process.',
  },
  'the point': {
    client: 'Jakarta',
    year: '2026',
    software: ['3ds Max', 'Corona Renderer', 'AI-assisted workflow'],
    description:
      'A concept pitch for a mid-to-high-end apartment development in Jakarta, combining ' +
      'mid-century and modern styles with natural elements worked into the balcony areas. ' +
      'AI-assisted workflows helped shape a design the client liked within budget.',
  },
  'tamdeen square': {
    client: 'Kuwait',
    year: '2022',
    software: ['3ds Max', 'Corona Renderer', 'AI-assisted workflow'],
    description:
      'An outdoor restaurant complex for an up-and-coming area of Kuwait. Rustic metal ' +
      'beams, reclaimed brick, and corrugated roofing were arranged to feel new while ' +
      'nodding to sustainability. A family-friendly complex with drive-through areas ' +
      'at the rear.',
  },
  'k yard': {
    client: 'Kuwait',
    year: '2025',
    software: ['3ds Max', 'Corona Renderer', 'AI-assisted workflow'],
    description:
      'A large beachside complex combining recreational, dining, and shopping areas for ' +
      'the whole family, with a range of distinct features designed across the site.',
  },
};

export function slugifyTitle(title) {
  return title.trim().toLowerCase();
}

export function getProjectDetail(title) {
  return projectDetails[slugifyTitle(title)] || null;
}

export default projectDetails;
