export default function About() {
  return (
    <section className="about-section" id="about" aria-label="About">
      <style>{`
        .about-section {
          padding: 96px 48px 64px;
        }
        .about-inner {
          max-width: 720px;
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
        <div className="about-eyebrow">About</div>
        <h2 className="about-title">Background</h2>
        <div className="about-body">
          <p>
            After studying 2D animation and 3D modelling, I started my career at a AAA video game
            studio. That experience taught me the beauty and economy of simple efficiency.
          </p>
          <p>
            I later brought those drawing and 3D design skills into the architecture and archviz
            industry, where I've now worked for more than 18 years. My specialty is rapid
            prototyping of designs and delivering detailed, descriptive visual stills, animations,
            and technical drawings. With the arrival of AI-assisted workflows, I've been able to
            deliver even better results at a lower cost.
          </p>
        </div>
      </div>
    </section>
  );
}
