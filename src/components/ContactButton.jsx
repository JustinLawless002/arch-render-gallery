import { useEffect, useRef, useState } from 'react';

export default function ContactButton() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="contact-wrap" ref={wrapRef}>
      <style>{`
        .contact-wrap {
          position: relative;
        }
        .contact-panel {
          position: absolute;
          top: calc(100% + 10px);
          right: 0;
          min-width: 240px;
          background: var(--bg-elevated);
          border: 1px solid var(--line);
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          z-index: 50;
        }
        .contact-panel a {
          font-family: var(--font-body);
          font-size: 14px;
          color: var(--text);
          text-decoration: none;
        }
        .contact-panel a:hover {
          color: var(--accent);
          text-decoration: underline;
        }
      `}</style>

      <button
        type="button"
        className="contact-btn"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        Contact
      </button>

      {open && (
        <div className="contact-panel">
          <a href="mailto:justin@primedesign.design">justin@primedesign.design</a>
          <a href="https://wa.me/6281337828881" target="_blank" rel="noopener noreferrer">
            WhatsApp +62 813-3782-8881
          </a>
        </div>
      )}
    </div>
  );
}
