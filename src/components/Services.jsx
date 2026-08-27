const services = [
  'Still renders',
  'Animated walkthroughs',
  '3D modeling from CAD / plans, sketches or photos',
  'Detailed floorplans, elevations and sections',
];

export default function Services() {
  return (
    <section className="services-section" id="services" aria-label="Services">
      <style>{`
        .services-section {
          padding: 64px 48px 96px;
        }
        .services-inner {
          max-width: 720px;
        }
        .services-eyebrow {
          font-family: var(--font-mono);
          font-size: 12px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--text-dim);
          margin-bottom: 8px;
        }
        .services-title {
          font-family: var(--font-display);
          font-size: clamp(28px, 4vw, 44px);
          font-weight: 600;
          letter-spacing: -0.01em;
          margin: 0 0 28px;
        }
        .services-list {
          list-style: none;
          margin: 0 0 28px;
          padding: 0;
          border-top: 1px solid var(--line);
        }
        .services-list li {
          font-family: var(--font-body);
          padding: 16px 0;
          border-bottom: 1px solid var(--line);
          font-size: 16px;
          color: var(--text-dim);
          transition: color 0.2s ease, padding-left 0.2s ease, border-color 0.2s ease;
        }
        .services-list li:hover {
          color: var(--text);
          padding-left: 8px;
          border-bottom-color: var(--accent);
        }
        .services-turnaround {
          font-family: var(--font-mono);
          font-size: 13px;
          color: var(--text-dim);
          line-height: 1.6;
          margin: 0;
        }
        @media (max-width: 560px) {
          .services-section { padding: 48px 24px 72px; }
        }
      `}</style>

      <div className="services-inner">
        <div className="services-eyebrow">Services</div>
        <h2 className="services-title">What I offer</h2>
        <ul className="services-list">
          {services.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
        <p className="services-turnaround">
          Typical turnaround: 2–3 weeks for initial submission on a standard-sized commercial
          or residential project. Contact for a quotation for your project.
        </p>
      </div>
    </section>
  );
}
