import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { EmailIcon, WhatsAppIcon } from './ContactIcons.jsx';

// Hover-driven (not click-driven) — the panel appears the instant the
// pointer arrives, no click needed. It's rendered via a portal straight
// into document.body rather than positioned relative to the button in
// place: the button normally sits inside .nav-actions, which needs
// overflow-x: auto on narrow screens (see App.jsx) so the button row can
// scroll horizontally instead of wrapping — but any ancestor with
// overflow set also clips absolutely-positioned children that spill out
// of it, which would cut this panel off. A portal sidesteps that
// entirely by escaping the clipped ancestor, wherever this component is
// used from.
export default function ContactButton({ className = '', label = 'Contact' }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState(null);
  const btnRef = useRef(null);
  const closeTimerRef = useRef(null);

  // The panel is portaled to document.body, so it's not actually a DOM
  // descendant of .contact-wrap — there's a real (if small) gap between
  // the button and the panel below it that belongs to neither element.
  // Moving the mouse from one to the other briefly crosses that gap, and
  // a plain mouseleave-closes-it-immediately approach closes the panel
  // while the cursor is still in transit, before it ever reaches the
  // panel. Delaying the close slightly, and cancelling that delay if the
  // cursor lands on the panel (or back on the button) in time, covers
  // the gap without needing to precisely measure or bridge it.
  const show = () => {
    clearTimeout(closeTimerRef.current);
    const r = btnRef.current?.getBoundingClientRect();
    if (r) setCoords({ top: r.bottom + 8, right: window.innerWidth - r.right });
    setOpen(true);
  };
  const scheduleHide = () => {
    clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => setOpen(false), 250);
  };

  useEffect(() => () => clearTimeout(closeTimerRef.current), []);

  return (
    <div className="contact-wrap" onMouseEnter={show} onMouseLeave={scheduleHide} onFocus={show} onBlur={scheduleHide}>
      <style>{`
        .contact-wrap {
          position: relative;
        }
        .contact-panel {
          position: fixed;
          min-width: 180px;
          background: transparent;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid var(--line);
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          z-index: 500;
          opacity: 0;
          transform: translateY(-4px);
          pointer-events: none;
          transition: opacity 150ms ease, transform 150ms ease;
        }
        .contact-panel.is-open {
          opacity: 1;
          transform: translateY(0);
          pointer-events: auto;
        }
        .contact-panel a {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-family: var(--font-body);
          font-size: 13px;
          color: var(--text);
          text-decoration: none;
          white-space: nowrap;
        }
        .contact-panel a svg {
          flex: 0 0 auto;
        }
        .contact-panel a:hover {
          color: var(--accent);
        }
      `}</style>

      <button ref={btnRef} type="button" className={`contact-btn ${className}`.trim()}>
        {label}
      </button>

      {createPortal(
        <div
          className={`contact-panel${open ? ' is-open' : ''}`}
          style={coords ? { top: coords.top, right: coords.right } : undefined}
          onMouseEnter={show}
          onMouseLeave={scheduleHide}
        >
          <a href="mailto:justin@praxio.studio">
            <EmailIcon />
            email
          </a>
          <a href="https://wa.me/6281337828881" target="_blank" rel="noopener noreferrer">
            <WhatsAppIcon />
            whatsapp
          </a>
        </div>,
        document.body
      )}
    </div>
  );
}
