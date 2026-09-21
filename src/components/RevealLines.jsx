import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion, useInView } from 'motion/react';
import './RevealLines.css';

/**
 * Line-by-line text reveal. Each *visual* line of the text — however the
 * browser happens to wrap it at the current width — slides up out of its
 * own mask, one after another, the first time the text scrolls into view.
 *
 * How it works: the text is first rendered as individual word spans and
 * measured (words sharing the same vertical position are one line), then
 * re-rendered as one masked block per line. It re-measures if the width
 * changes (window resize, rotating a phone) or webfonts finish loading;
 * once it has played, later re-measures never replay the animation.
 *
 * Props:
 *   text     — the string to reveal (plain text only)
 *   as       — element to render: 'span' (default), 'h1', 'h2', 'li', ...
 *   delay    — seconds to wait after scrolling into view
 *   stagger  — seconds between successive lines
 */
export default function RevealLines({
  text,
  as: Tag = 'span',
  className,
  delay = 0,
  stagger = 0.09,
  duration = 0.75,
}) {
  const ref = useRef(null);
  const [mode, setMode] = useState('measure'); // 'measure' | 'split'
  const [lines, setLines] = useState([]);
  const inView = useInView(ref, { once: true, margin: '0px 0px -8% 0px' });
  const played = useRef(false);
  const lastWidth = useRef(0);

  // Measure: words that share a vertical position are one line.
  useLayoutEffect(() => {
    if (mode !== 'measure') return;
    const el = ref.current;
    if (!el) return;
    const spans = el.querySelectorAll('[data-w]');
    const out = [];
    let top = null;
    let current = [];
    spans.forEach((span) => {
      const t = span.offsetTop;
      if (top === null || Math.abs(t - top) > 2) {
        if (current.length) out.push(current.join(' '));
        current = [];
        top = t;
      }
      current.push(span.textContent);
    });
    if (current.length) out.push(current.join(' '));
    lastWidth.current = el.getBoundingClientRect().width;
    setLines(out.length ? out : [text]);
    setMode('split');
  }, [mode, text]);

  // Re-measure when the available width changes, or once webfonts arrive.
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    let timer;
    const remeasure = () => {
      clearTimeout(timer);
      timer = setTimeout(() => setMode('measure'), 120);
    };
    const ro = new ResizeObserver(() => {
      const w = el.getBoundingClientRect().width;
      if (Math.abs(w - lastWidth.current) > 1) remeasure();
    });
    ro.observe(el);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(remeasure);
    return () => {
      clearTimeout(timer);
      ro.disconnect();
    };
  }, []);

  useEffect(() => {
    if (inView) played.current = true;
  }, [inView]);

  const shown = inView || played.current;
  const words = text.split(/\s+/).filter(Boolean);

  return (
    <Tag
      ref={ref}
      className={className}
      data-reveal={shown ? 'in' : 'out'}
      style={Tag === 'span' ? { display: 'block' } : undefined}
    >
      {mode === 'measure' ? (
        words.map((w, i) => (
          <span key={i}>
            <span data-w>{w}</span>{' '}
          </span>
        ))
      ) : (
        <>
          <span className="reveal-sr">{text}</span>
          {lines.map((line, i) => (
            <span className="reveal-mask" aria-hidden="true" key={i}>
              <motion.span
                className="reveal-line"
                initial={played.current ? false : { y: '110%' }}
                animate={{ y: shown ? '0%' : '110%' }}
                transition={{ duration, ease: [0.16, 1, 0.3, 1], delay: delay + i * stagger }}
              >
                {line}
              </motion.span>
            </span>
          ))}
        </>
      )}
    </Tag>
  );
}
