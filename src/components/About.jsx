import Reveal from './Reveal.jsx';
import RevealLines from './RevealLines.jsx';

// One quote either side of the Background text (stacked under it on narrow screens).
const QUOTE_LEFT = { text: 'Good design is the result of a process.', by: 'Paul Rand' };
const QUOTE_RIGHT = { text: 'Inspiration exists, but it has to find you working.', by: 'Pablo Picasso' };

function Quote({ q, delay }) {
  return (
    <Reveal as="aside" className="about-side" delay={delay}>
      <blockquote className="about-quote">
        <p>“{q.text}”</p>
        <cite>{q.by}</cite>
      </blockquote>
    </Reveal>
  );
}

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
        /* Three columns on wide screens: quote · text · quote. */
        .about-layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 720px) minmax(0, 1fr);
          gap: 56px;
          align-items: center;
          max-width: 1280px;
          margin: 0 auto;
        }
        .about-layout .about-inner { margin: 0; }
        .about-side { max-width: 260px; }
        .about-side:first-child { justify-self: end; }
        .about-side:last-child { justify-self: start; }
        @media (max-width: 1100px) {
          .about-layout { grid-template-columns: minmax(0, 720px); justify-content: center; gap: 28px; }
          .about-layout .about-inner { order: -1; }
          .about-side, .about-side:first-child, .about-side:last-child { justify-self: start; max-width: none; }
          .about-side:first-child { margin-top: 16px; }
        }
        .about-quote {
          margin: 0;
          padding-left: 18px;
          border-left: 1px solid var(--line);
        }
        .about-quote p {
          margin: 0;
          font-family: var(--font-display);
          font-size: clamp(17px, 1.8vw, 20px);
          line-height: 1.4;
          color: var(--text);
        }
        .about-quote cite {
          display: block;
          margin-top: 6px;
          font-style: normal;
          font-size: 13px;
          color: var(--text-dim);
        }
        @media (max-width: 560px) {
          .about-section { padding: 72px 24px 48px; }
        }
      `}</style>

      <div className="about-layout">
      <Quote q={QUOTE_LEFT} delay={0.1} />
      <div className="about-inner">
        <RevealLines as="h2" className="about-title" text="Background" delay={0.08} />
        <div className="about-body">
          <RevealLines
            as="p"
            delay={0.12}
            stagger={0.03}
            text="I studied 2D animation and 3D modelling and began a career at a AAA video game studio. That experience taught me the importance of having professionalism in my work and that good design comes from solving problems through practice."
          />
          <RevealLines
            as="p"
            delay={0.18}
            stagger={0.03}
            text="I later brought the tools of drawing, digital painting and 3D sculpting with me into exploring architecture and archviz. I have now worked for more than 18 years at creating all kinds of images that have been made reality. My specialty is rapid prototyping of designs and delivering detailed, descriptive visuals and technical drawings. With the arrival of AI-assisted workflows I have been able to deliver even better results, faster and at lower costs."
          />
        </div>
      </div>
      <Quote q={QUOTE_RIGHT} delay={0.2} />
      </div>
    </section>
  );
}
