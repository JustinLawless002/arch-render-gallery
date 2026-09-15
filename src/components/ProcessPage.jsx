import './ProcessPage.css';

// Placeholder for the side-scrolling workflow pipeline. Each button below
// is meant to eventually kick off a horizontal node/step flow specific to
// that starting point (plans / reference images / a bare idea) — for now
// they're just inert buttons until that flow is designed.
const STARTING_POINTS = ['With architectural plans', 'With reference images', 'With an idea'];

export default function ProcessPage() {
  return (
    <main className="process-page">
      <h1 className="process-page__title">How would you like to start?</h1>
      <div className="process-page__options">
        {STARTING_POINTS.map((label) => (
          <button
            key={label}
            type="button"
            className="hero__cta"
            onClick={() => {
              // TODO: route into the corresponding pipeline node/step flow.
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </main>
  );
}
