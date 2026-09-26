import { Link } from 'react-router-dom';
import workflows from '../data/workflows.js';
import Reveal from './Reveal.jsx';
import RevealLines from './RevealLines.jsx';

// Formerly the standalone /process page (a full-screen "how would you like
// to start?" chooser). Now embedded directly on the home page, after the
// projects gallery, in the same section-block style as About/Services. The
// three options still route to their existing /process/:slug detail pages
// — only the entry chooser moved, not the detail pages behind it.
export default function ProcessSection() {
  return (
    <section className="process-section" id="process" aria-label="Process">
      <style>{`
        .process-section {
          padding: 64px var(--page-gutter, 48px) 96px;
        }
        .process-inner {
          max-width: 720px;
        }
        .process-eyebrow {
          font-family: var(--font-mono);
          font-size: 12px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--text-dim);
          margin-bottom: 8px;
        }
        .process-title {
          font-family: var(--font-display);
          font-size: clamp(28px, 4vw, 44px);
          font-weight: 600;
          letter-spacing: -0.01em;
          margin: 0 0 28px;
        }
        .process-options {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
        }
        .process-options a {
          width: 220px;
          min-height: 76px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          line-height: 1.3;
          padding: 14px 20px;
          background: transparent;
          border: 1px solid var(--line);
          color: var(--text);
          text-decoration: none;
          font-family: var(--font-body);
          font-size: 15px;
          transition: background 200ms ease, color 200ms ease, border-color 200ms ease;
        }
        .process-options a:hover {
          background: var(--text);
          color: var(--bg);
          border-color: var(--text);
        }
        @media (max-width: 560px) {
          .process-section { padding: 48px 24px 72px; }
          .process-options a { width: 100%; }
        }
      `}</style>

      <div className="process-inner">
        <Reveal as="div" className="process-eyebrow">Process</Reveal>
        <RevealLines as="h2" className="process-title" text="How would you like to start?" delay={0.08} />
        <div className="process-options">
          {workflows.map((w, i) => (
            <Reveal key={w.slug} delay={0.16 + i * 0.08} style={{ display: 'inline-block' }}>
              <Link to={`/process/${w.slug}`}>{w.buttonLabel}</Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
