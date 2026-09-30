import Reveal from './Reveal.jsx';
import RevealLines from './RevealLines.jsx';
import SectionLink from './SectionLink.jsx';

// Services, grouped into four cards instead of one long lined list.
// Edit the wording or move items between groups freely — each group
// just needs a title, an icon name and its items.
const groups = [
  {
    title: 'Visualisation',
    icon: 'frame',
    items: [
      'Still renders',
      'Animated walkthroughs',
      'Full project presentations for print or for PowerPoint video display',
    ],
  },
  {
    title: '3D modelling',
    icon: 'cube',
    items: ['3D modeling from CAD / plans, sketches or photos', 'Organic or parametric 3D modelling'],
  },
  {
    title: 'Design',
    icon: 'spark',
    items: [
      'AI assisted iterative concept designs',
      'Masterplan development for large projects',
      'Interior design mood boards and material selection',
    ],
  },
  {
    title: 'Drawings & sourcing',
    icon: 'plan',
    items: ['Detailed floorplans, elevations and sections', 'Sourcing for materials, furniture and fittings'],
  },
];

function Icon({ name }) {
  const common = {
    width: 26,
    height: 26,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.4,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  };
  if (name === 'frame')
    return (
      <svg {...common}>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 16 5-5 4 4 3-3 6 6" />
        <circle cx="16" cy="9" r="1.4" />
      </svg>
    );
  if (name === 'cube')
    return (
      <svg {...common}>
        <path d="M12 2.8 20 7.2v9.6L12 21.2 4 16.8V7.2z" />
        <path d="M4 7.2 12 11.6l8-4.4M12 11.6v9.6" />
      </svg>
    );
  if (name === 'spark')
    return (
      <svg {...common}>
        <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
        <path d="M12 8.5 13.3 10.7 15.5 12 13.3 13.3 12 15.5 10.7 13.3 8.5 12 10.7 10.7z" />
      </svg>
    );
  return (
    <svg {...common}>
      <path d="M3 4h18v16H3z" />
      <path d="M3 11h7v9M10 4v4M14 11h7M14 11v5" />
    </svg>
  );
}

export default function Services() {
  return (
    <section className="services-section" id="services" aria-label="Services">
      <style>{`
        .services-section {
          padding: 64px var(--page-gutter, 48px) 96px;
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
          margin: 0 0 32px;
          text-align: center;
        }
        .services-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
          max-width: 1100px;
          margin: 0 auto;
        }
        .service-card {
          position: relative;
          height: 100%;
          padding: 28px 28px 30px;
          border-radius: 20px;
          background: linear-gradient(160deg, rgba(255, 255, 255, 0.055), rgba(255, 255, 255, 0.015));
          transition: background 300ms ease, transform 400ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .service-card:hover {
          background: linear-gradient(160deg, rgba(255, 255, 255, 0.085), rgba(255, 255, 255, 0.025));
          transform: translateY(-3px);
        }
        .service-card__top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 26px;
          color: var(--text);
        }
        .service-card__icon {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          background: rgba(255, 255, 255, 0.06);
        }
        .service-card h3 {
          font-family: var(--font-display);
          font-size: 22px;
          font-weight: 500;
          letter-spacing: -0.01em;
          margin: 0 0 14px;
        }
        .service-card ul {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .service-card li {
          position: relative;
          padding-left: 18px;
          font-family: var(--font-body);
          font-size: 15px;
          line-height: 1.5;
          color: var(--text-dim);
        }
        .service-card li::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0.62em;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--text);
          opacity: 0.55;
        }
        .services-foot {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 14px 20px;
          justify-content: center;
          text-align: center;
          margin: 28px auto 0;
          max-width: 1100px;
        }
        .services-turnaround {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 10px 16px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.05);
          font-family: var(--font-body);
          font-size: 14px;
          color: var(--text-dim);
          line-height: 1.4;
        }
        .services-turnaround strong { color: var(--text); font-weight: 500; }
        .services-quote {
          color: var(--text);
          font-size: 14px;
          text-decoration: none;
          border-bottom: 1px solid rgba(255, 255, 255, 0.35);
          padding-bottom: 2px;
          transition: border-color 180ms ease;
        }
        .services-quote:hover { border-color: var(--text); }
        @media (max-width: 760px) {
          .services-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 560px) {
          .services-section { padding: 48px 24px 72px; }
          .service-card { padding: 22px 20px 24px; border-radius: 16px; }
          .services-turnaround { border-radius: 14px; }
        }
      `}</style>

      <RevealLines as="h2" className="services-title" text="What I offer" delay={0.08} />

      <div className="services-grid">
        {groups.map((g, i) => (
          <Reveal as="div" key={g.title} delay={0.12 + i * 0.08}>
            <article className="service-card">
              <div className="service-card__top">
                <span className="service-card__icon">
                  <Icon name={g.icon} />
                </span>
              </div>
              <h3>{g.title}</h3>
              <ul>
                {g.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          </Reveal>
        ))}
      </div>

      <Reveal as="div" className="services-foot" delay={0.3}>
        <span className="services-turnaround">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
          <span>
            Typical turnaround: <strong>2–3 weeks</strong> for initial submission on a standard-sized commercial or
            residential project.
          </span>
        </span>
        <SectionLink to="/#process" className="services-quote">
          Get a quotation
        </SectionLink>
      </Reveal>
    </section>
  );
}
