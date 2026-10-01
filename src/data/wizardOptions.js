// Choices offered by the "Start your project here" wizard.
// Shared by the wizard (src/components/ProcessSection.jsx) and the email
// function (api/send-brief.js) — the function only accepts answers that
// appear here, so edit wording in this one place.
import workflows from './workflows.js';

export const OPTIONS = {
  starting: {
    plans: 'You have architectural files, a moodboard or presentation, and reference images.',
    references: 'You have photos, moodboards or sketches.',
    idea: 'You have a concept but nothing drawn yet.',
  },
  projectTypes: [
    'Villa / house',
    'Apartment building',
    'Restaurant / café',
    'Retail / boutique',
    'Office / commercial',
    'Hotel / resort',
    'Masterplan / mixed-use',
    'Other',
  ],
  scope: ['Exterior', 'Interior', 'Both'],
  // How the client tells us the project's size. Area is the main one; the
  // other two are for clients who don't know it (converted to an area
  // with PRICING.m2PerSpace / m2PerView).
  sizeModes: [
    { id: 'area', label: 'Floor area', hint: 'Rough is fine: the total area to be designed and visualised, inside and out.' },
    { id: 'spaces', label: 'Number of spaces', hint: 'Rooms or outdoor areas, e.g. living room, kitchen, pool deck.' },
    { id: 'views', label: 'Number of final views', hint: 'Final images you want at the end. Previews along the way are always included.' },
  ],
  animationLengths: [15, 30, 45, 60, 90], // seconds
  // The first timeline is the rush option (see PRICING.rushFactor).
  timelines: ['Rush: first images in 2–3 days', 'Within 2–3 weeks', 'Within 1–2 months', 'Flexible'],
  budgets: ['Not sure yet', 'Under US$1,000', 'US$1,000 – 3,000', 'US$3,000 – 7,000', 'US$7,000+'],
};

// ─────────────────────────────────────────────────────────────────────
//  PRICE ESTIMATE — every number that shapes the estimate lives here.
//  All prices in US$. Priced on the project's AREA, not on a count of
//  renders: previews and final views are as many as the project needs.
//
//    fee = (base + rate × area^exponent) × starting point × 3D model × rush
//          + animation seconds × animationPerSecond × the same factors
//
//  The exponent < 1 makes each extra m² cheaper on bigger projects.
//  Calibrated on two real projects:
//    K-Land Chocomelt  180 m², from references  →  ~US$1,600 – 2,000
//    K-Land resort   9,200 m², from plans       →  ~US$21,700 – 28,500 (actual ~25,000)
// ─────────────────────────────────────────────────────────────────────
export const PRICING = {
  // Overall level: multiplies every estimate. 1 = as calibrated below,
  // 1.15 = 15% higher. The easiest dial for raising or lowering all prices.
  overall: 1.15,
  base: 300, // every project; also works as the minimum fee
  rate: [19, 25], // [low, high] — sets the width of the range
  exponent: 0.77,
  m2PerSpace: 60, // "number of spaces" → area
  m2PerView: 25, // "number of final views" → area
  animationPerSecond: 15,
  // What the client starts from (step 1). 1 = normal price.
  startingFactor: { plans: 1, references: 1.2, idea: 1.3 },
  modelFactor: 0.85, // client also has a usable 3D model: 15% off
  rushFactor: 1.3, // rush timeline: +30%
};

const clampInt = (v, min, max, dflt) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : dflt;
};
const animLength = (v) => (OPTIONS.animationLengths.includes(Number(v)) ? Number(v) : 30);
const money = (n) => `US$${n.toLocaleString('en-US')}`;
const n0 = (n) => Math.round(n).toLocaleString('en-US');

export const formatRange = (est) =>
  est.high > est.low ? `${money(est.low)} – ${est.high.toLocaleString('en-US')}` : money(est.low);

// The project's size as an area in m², whichever way the client gave it.
// Returns null if no usable size was given.
export function projectSize(raw = {}) {
  const mode = OPTIONS.sizeModes.some((m) => m.id === raw.sizeMode) ? raw.sizeMode : 'area';
  if (mode === 'spaces') {
    const n = clampInt(raw.spaces, 1, 100, 1);
    return { mode, count: n, area: n * PRICING.m2PerSpace, text: `${n} space${n > 1 ? 's' : ''}` };
  }
  if (mode === 'views') {
    const n = clampInt(raw.views, 1, 200, 1);
    return { mode, count: n, area: n * PRICING.m2PerView, text: `${n} final view${n > 1 ? 's' : ''}` };
  }
  const a = clampInt(raw.area, 0, 200000, 0);
  return a >= 10 ? { mode, area: a, text: `about ${n0(a)} m²` } : null;
}

// Round down/up to a step that suits the size of the number.
const stepFor = (v) => (v < 2000 ? 50 : v < 10000 ? 100 : 500);

// Estimated price range from the wizard's raw answers. Returns null when
// no usable size was given.
export function estimateQuote(raw = {}) {
  const seconds = raw.animation === true ? animLength(raw.animSeconds) : 0;
  const size = projectSize(raw);
  if (!size) return null;

  const P = PRICING;
  const startF = P.startingFactor[raw.starting] ?? 1;
  const hasModel = raw.hasModel === true;
  const rush = raw.timeline === OPTIONS.timelines[0];
  const f = (P.overall ?? 1) * startF * (hasModel ? P.modelFactor : 1) * (rush ? P.rushFactor : 1);

  const scale = size.area ** P.exponent;
  const anim = seconds * P.animationPerSecond;
  let low = (P.base + P.rate[0] * scale + anim) * f;
  let high = (P.base + P.rate[1] * scale + anim) * f;
  low = Math.floor(low / stepFor(low)) * stepFor(low);
  high = Math.max(low, Math.ceil(high / stepFor(high)) * stepFor(high));

  // A short list of what the estimate is based on, for the page and emails.
  const wf = workflows.find((w) => w.slug === raw.starting);
  const basis = [];
  basis.push(size.mode === 'area' ? `Project size ${size.text}` : `${size.text} (treated as about ${n0(size.area)} m²)`);
  basis.push('Previews and final views as needed, no per-image charge');
  if (seconds) basis.push(`${seconds}-second animation`);
  if (wf) basis.push(`${wf.buttonLabel}${hasModel ? ', plus a 3D model' : ''}`);
  else if (hasModel) basis.push('With a 3D model');
  if (rush) basis.push(`Rush delivery (+${Math.round((P.rushFactor - 1) * 100)}%)`);

  return { low, high, currency: 'USD', area: size.area, basis };
}

// Turns the wizard's raw answers into readable, validated values.
// Anything that isn't one of the options above is dropped.
export function describeAnswers(raw = {}) {
  const pick = (v, list) => (list.includes(v) ? v : '');
  const wf = workflows.find((w) => w.slug === raw.starting);
  return {
    starting: wf ? wf.buttonLabel + (raw.hasModel === true ? ' + 3D model' : '') : '',
    projectType: pick(raw.projectType, OPTIONS.projectTypes),
    size: projectSize(raw)?.text || '',
    scope: pick(raw.scope, OPTIONS.scope),
    animation: raw.animation === true ? `Yes, about ${animLength(raw.animSeconds)} s` : 'No',
    timeline: pick(raw.timeline, OPTIONS.timelines),
    budget: pick(raw.budget, OPTIONS.budgets),
  };
}
