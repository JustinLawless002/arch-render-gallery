// Choices offered by the "Start your project here" wizard.
// Shared by the wizard (src/components/ProcessSection.jsx) and the email
// function (api/send-brief.js) — the function only accepts answers that
// appear here, so edit wording in this one place.
import workflows from './workflows.js';

export const OPTIONS = {
  starting: {
    plans: 'You have CAD, PDF, DWG or Revit drawings.',
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
  deliverables: [
    { id: 'stills', label: 'Still renders', hasCount: true },
    { id: 'animation', label: 'Animated walkthrough' },
    { id: 'motion', label: 'Short social / AI motion clips' },
    { id: 'model', label: '3D model from plans / sketches' },
    { id: 'drawings', label: 'Floorplans, elevations & sections' },
    { id: 'concept', label: 'Concept design' },
  ],
  // PLACEHOLDERS — adjust to your real ranges.
  timelines: ['As soon as possible', 'Within 2–3 weeks', 'Within 1–2 months', 'Flexible'],
  budgets: ['Not sure yet', 'Under US$1,000', 'US$1,000 – 3,000', 'US$3,000 – 7,000', 'US$7,000+'],
};

// Turns the wizard's raw answers into readable, validated values.
// Anything that isn't one of the options above is dropped.
export function describeAnswers(raw = {}) {
  const pick = (v, list) => (list.includes(v) ? v : '');
  const wf = workflows.find((w) => w.slug === raw.starting);
  const ids = Array.isArray(raw.deliverables) ? raw.deliverables : [];
  const count = Math.min(50, Math.max(1, parseInt(raw.stillsCount, 10) || 1));
  const deliverables = OPTIONS.deliverables
    .filter((x) => ids.includes(x.id))
    .map((x) => (x.hasCount ? `${x.label} (about ${count})` : x.label));
  return {
    starting: wf ? wf.buttonLabel : '',
    projectType: pick(raw.projectType, OPTIONS.projectTypes),
    scope: pick(raw.scope, OPTIONS.scope),
    deliverables: deliverables.join(', '),
    timeline: pick(raw.timeline, OPTIONS.timelines),
    budget: pick(raw.budget, OPTIONS.budgets),
  };
}
