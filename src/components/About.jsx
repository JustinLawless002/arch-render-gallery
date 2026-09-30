import Reveal from './Reveal.jsx';
import RevealLines from './RevealLines.jsx';

export default function About() {
  return (
    <section className="about-section" id="about" aria-label="About">
      <style>{`
        .about-section {
          padding: 96px var(--page-gutter, 48px) 64px;
        }
        /* Block sits in the centre of the page; the text inside stays
           left-aligned so paragraphs read naturally. */
        .about-inner {
          max-width: 720px;
          margin: 0 auto;
        }
        .about-eyebrow {
          font-family: var(--font-mono);
          font-size: 12px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--text-dim);
          margin-bottom: 8px;
        }
        .about-title {
          font-family: var(--font-display);
          font-size: clamp(28px, 4vw, 44px);
          font-weight: 600;
          letter-spacing: -0.01em;
          margin: 0 0 28px;
        }
        .about-body p {
          font-family: var(--font-body);
          font-size: 16px;
          line-height: 1.7;
          color: var(--text-dim);
          margin: 0 0 20px;
        }
        .about-body p:last-child {
          margin-bottom: 0;
        }
        @media (max-width: 560px) {
          .about-section { padding: 72px 24px 48px; }
        }
      `}</style>

      <div className="about-inner">
        <RevealLines as="h2" className="about-title" text="Background" delay={0.08} />
        <div className="about-body">
          <RevealLines
            as="p"
            delay={0.12}
            stagger={0.03}
            text="After studying 2D animation and 3D modelling, I started my career at a AAA video game studio. That experience taught me the importance of profesionalism in my craft and that good design comes from solving problems through practice and never giving up until it works."
          />
          <RevealLines
            as="p"
            delay={0.18}
            stagger={0.03}
            text="I later brought drawing and 3D organic design skills into the architecture and archviz industry, where I've now worked for more than 18 years. My specialty is rapid prototyping of designs and delivering detailed, descriptive visuals and technical drawings. With the arrival of AI-assisted workflows, I've been able to deliver even better results, faster and therefore at lower costs."
          />
        </div>
      </div>
    </section>
  );
}
