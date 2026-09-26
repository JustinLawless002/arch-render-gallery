import Reveal from './Reveal.jsx';
import RevealLines from './RevealLines.jsx';

const services = [
  'Still renders',
  'Animated walkthroughs',
  '3D modeling from CAD / plans, sketches or photos',
  'Detailed floorplans, elevations and sections',
  'Organic or parametric 3D modelling',
  'AI assisted iterative concept designs',
  'Masterplan development for large projects',
  'Interior design mood boards and material selection',
  'Full project presentations for print or for PowerPoint video display',
  'Sourcing for materials, furniture and fittings',
];

export default function Services() {
  return (
    <section className="services-section" id="services" aria-label="Services">
      <style>{`
        .services-section {
          padding: 64px var(--page-gutter, 48px) 96px;
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
        <Reveal as="div" className="services-eyebrow">Services</Reveal>
        <RevealLines as="h2" className="services-title" text="What I offer" delay={0.08} />
        <ul className="services-list">
          {services.map((s, i) => (
            <Reveal as="li" key={s} delay={0.16 + i * 0.06}>
              {s}
            </Reveal>
          ))}
        </ul>
        <Reveal
          as="p"
          className="services-turnaround"
          delay={0.16 + services.length * 0.06 + 0.05}
        >
          Typical turnaround: 2–3 weeks for initial submission on a standard-sized commercial
          or residential project. Contact for a quotation for your project.
        </Reveal>
      </div>
    </section>
  );
}
