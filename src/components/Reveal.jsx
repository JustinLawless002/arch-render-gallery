import { useMemo } from 'react';
import { motion } from 'motion/react';

// Same easing/duration family as the gallery tile reveal and the
// workflow-page line reveal, so every "enters the page" moment across the
// site reads as one consistent motion language rather than several.
export const REVEAL_EASE = [0.16, 1, 0.3, 1];

/**
 * Fade-up-on-scroll wrapper for anything that isn't running text (buttons,
 * cards, list items, whole blocks). For headings and paragraphs, prefer
 * RevealLines instead — this one just fades/rises the element as a whole.
 *
 * A fixed header still animates once on load: IntersectionObserver reports
 * an element already sitting in the viewport as "in view" as soon as it
 * mounts, so `once` still fires — no special-casing needed there.
 *
 * `as` accepts either a string tag ("a", "li", ...) or a component
 * reference (e.g. react-router's Link) — the latter is wrapped with
 * motion(...) once per distinct `as` value (memoized) rather than on every
 * render, since re-wrapping on each render would give React a new
 * component type each time and force a remount.
 */
export default function Reveal({
  as = 'div',
  children,
  delay = 0,
  y = 22,
  duration = 0.7,
  once = true,
  className,
  ...rest
}) {
  const Tag = useMemo(() => {
    if (typeof as === 'string') return motion[as] || motion.div;
    return motion(as);
  }, [as]);

  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: '0px 0px -8% 0px' }}
      transition={{ duration, ease: REVEAL_EASE, delay }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
