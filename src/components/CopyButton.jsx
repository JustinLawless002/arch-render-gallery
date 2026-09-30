import { useEffect, useRef, useState } from 'react';

export const CONTACT_EMAIL = 'justin@praxio.studio';

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Older browsers / non-secure contexts (e.g. testing on a phone over
    // the local network): fall back to a hidden textarea.
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch {
      ok = false;
    }
    ta.remove();
    return ok;
  }
}

// Small "copy" button that sits beside an email link. Copies the address
// and briefly shows a tick, so visitors on webmail (no mail app set up)
// can still grab it with one click.
// iconOnly: just the copy symbol (a tick once copied), no word — used
// beside email addresses. The label is still there for screen readers
// and as a hover tooltip.
export default function CopyButton({ text = CONTACT_EMAIL, label = 'Copy email address', iconOnly = false }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <button
      type="button"
      className={`copy-btn${iconOnly ? ' copy-btn--icon' : ''}${copied ? ' is-copied' : ''}`}
      aria-label={copied ? 'Copied' : label}
      title={copied ? 'Copied' : label}
      onClick={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (await copyText(text)) {
          setCopied(true);
          clearTimeout(timer.current);
          timer.current = setTimeout(() => setCopied(false), 1600);
        }
      }}
    >
      <style>{`
        .copy-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          flex: 0 0 auto;
          padding: 4px 8px;
          border: 1px solid var(--line);
          border-radius: 8px;
          background: transparent;
          color: var(--text-dim);
          font-family: var(--font-body);
          font-size: 11.5px;
          line-height: 1;
          cursor: pointer;
          transition: color 160ms ease, border-color 160ms ease;
        }
        .copy-btn:hover { color: var(--text); border-color: rgba(255, 255, 255, 0.4); }
        .copy-btn.is-copied { color: var(--text); border-color: var(--text); }
        .copy-btn svg { display: block; }
        .copy-btn--icon { padding: 5px; }
      `}</style>
      {copied ? (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 12.5 10 17.5 19 7" />
        </svg>
      ) : (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="8.5" y="8.5" width="12" height="12" rx="2.5" />
          <path d="M15.5 8.5V6a2.5 2.5 0 0 0-2.5-2.5H6A2.5 2.5 0 0 0 3.5 6v7A2.5 2.5 0 0 0 6 15.5h2.5" />
        </svg>
      )}
      {!iconOnly && <span>{copied ? 'Copied' : 'Copy'}</span>}
    </button>
  );
}
