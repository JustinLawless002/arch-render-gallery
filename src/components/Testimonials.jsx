import { useEffect, useRef, useState } from 'react';
import testimonialsRaw from '../data/testimonials.txt?raw';
import Reveal from './Reveal.jsx';
import RevealLines from './RevealLines.jsx';

// Parses src/data/testimonials.txt — see that file for the format. Each
// block is separated by a line containing only "---"; the last line of a
// block starting with "-" (or an em/en dash) is treated as the
// attribution and split off from the quote. "#" lines are comments and
// are ignored wherever they appear.
function parseTestimonials(raw) {
  return raw
    .split(/\n\s*---\s*\n/)
    .map((block) => {
      const lines = block.split(/\r?\n/).filter((l) => !l.trim().startsWith('#'));
      while (lines.length && lines[0].trim() === '') lines.shift();
      while (lines.length && lines[lines.length - 1].trim() === '') lines.pop();
      if (lines.length === 0) return null;

      let attribution = null;
      const last = lines[lines.length - 1].trim();
      if (/^[-—–]\s*/.test(last)) {
        attribution = last.replace(/^[-—–]\s*/, '').trim();
        lines.pop();
      }
      while (lines.length && lines[lines.length - 1].trim() === '') lines.pop();

      const quote = lines.join('\n').trim();
      return quote ? { quote, attribution } : null;
    })
    .filter(Boolean);
}

const testimonials = parseTestimonials(testimonialsRaw);

const AUTO_ADVANCE_MS = 6500;

export default function Testimonials() {
  const [index, setIndex] = useState(0);
  const pausedRef = useRef(false);

  useEffect(() => {
    if (testimonials.length <= 1) return undefined;
    const id = setInterval(() => {
      if (!pausedRef.current) setIndex((i) => (i + 1) % testimonials.length);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(id);
  }, []);

  if (testimonials.length === 0) return null;
  const current = testimonials[index];

  return (
    <section
      className="testimonials-section"
      id="testimonials"
      aria-label="Testimonials"
      onMouseEnter={() => { pausedRef.current = true; }}
      onMouseLeave={() => { pausedRef.current = false; }}
    >
      <style>{`
        .testimonials-section {
          padding: 96px var(--page-gutter, 48px) 112px;
        }
        .testimonials-eyebrow {
          font-family: var(--font-mono);
          font-size: 12px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--text-dim);
          margin-bottom: 8px;
          text-align: center;
        }
        .testimonials-title {
          font-family: var(--font-display);
          font-size: clamp(28px, 4vw, 44px);
          font-weight: 600;
          letter-spacing: -0.01em;
          margin: 0 0 56px;
          text-align: center;
        }
        /* min-height is just a comfortable resting size, not a hard cap —
           .testimonial below sizes to its own content rather than being
           forced to fill a fixed box, so a longer testimonial (or one
           wrapping to more lines on a narrow phone) grows the section
           instead of getting clipped. */
        .testimonials-viewport {
          position: relative;
          max-width: 720px;
          margin: 0 auto;
          min-height: 240px;
        }
        .testimonial {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          animation: testimonial-in 700ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes testimonial-in {
          from { opacity: 0; transform: translateY(28px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .testimonial__quote {
          font-family: var(--font-display);
          font-size: clamp(17px, 2vw, 21px);
          line-height: 1.65;
          color: var(--text);
          white-space: pre-line;
          margin: 0 0 20px;
        }
        .testimonial__attribution {
          font-family: var(--font-mono);
          font-size: 12px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--accent);
        }
        .testimonials-dots {
          display: flex;
          justify-content: center;
          gap: 10px;
          margin-top: 40px;
        }
        .testimonials-dots button {
          width: 8px;
          height: 8px;
          padding: 0;
          border-radius: 50%;
          border: none;
          background: var(--line);
          cursor: pointer;
          transition: background 200ms ease, transform 200ms ease;
        }
        .testimonials-dots button.is-active {
          background: var(--accent);
          transform: scale(1.3);
        }
        @media (max-width: 560px) {
          .testimonials-section { padding: 72px 24px 80px; }
          .testimonials-viewport { min-height: 320px; }
        }
      `}</style>

      <Reveal as="div" className="testimonials-eyebrow">Testimonials</Reveal>
      <RevealLines as="h2" className="testimonials-title" text="What clients say" delay={0.08} />

      <div className="testimonials-viewport">
        <div className="testimonial" key={index}>
          <p className="testimonial__quote">{current.quote}</p>
          {current.attribution && <div className="testimonial__attribution">{current.attribution}</div>}
        </div>
      </div>

      {testimonials.length > 1 && (
        <div className="testimonials-dots">
          {testimonials.map((_, i) => (
            <button
              key={i}
              type="button"
              className={i === index ? 'is-active' : ''}
              onClick={() => setIndex(i)}
              aria-label={`Testimonial ${i + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
