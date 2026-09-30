import { useEffect, useState } from 'react';

// Local-only headline font switcher. Rendered from App.jsx only when
// running `npm run dev`, so it never ships to praxio.studio.
// Pick a font, and every heading on every page switches to it. The choice
// is remembered while you click around. Delete this file (and its line in
// App.jsx) once a font is chosen.
const FONTS = [
  { name: 'Space Grotesk', note: 'current', css: "'Space Grotesk'", query: null },
  { name: 'Manrope', note: 'calm, geometric', css: "'Manrope'", query: 'Manrope:wght@500;600' },
  { name: 'Syne', note: 'wide, architectural', css: "'Syne'", query: 'Syne:wght@500;600' },
  { name: 'Archivo Expanded', note: 'engineered, wide', css: "'Archivo'", query: 'Archivo:wdth,wght@125,500;125,600', stretch: '125%' },
  { name: 'Bricolage Grotesque', note: 'characterful', css: "'Bricolage Grotesque'", query: 'Bricolage+Grotesque:opsz,wght@12..96,500;12..96,600' },
  { name: 'Instrument Serif', note: 'elegant serif', css: "'Instrument Serif'", query: 'Instrument+Serif', weight: 400 },
  { name: 'Cormorant Garamond', note: 'luxury serif', css: "'Cormorant Garamond'", query: 'Cormorant+Garamond:wght@500;600' },
];

const KEY = 'praxio-font-test';

function loadFont(f) {
  if (!f.query || document.getElementById(`ft-${f.name}`)) return;
  const link = document.createElement('link');
  link.id = `ft-${f.name}`;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${f.query}&display=swap`;
  document.head.appendChild(link);
}

export default function FontTester() {
  const [current, setCurrent] = useState(() => {
    try { return localStorage.getItem(KEY) || FONTS[0].name; } catch { return FONTS[0].name; }
  });
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const f = FONTS.find((x) => x.name === current) || FONTS[0];
    loadFont(f);
    const root = document.documentElement;
    root.style.setProperty('--font-display', `${f.css}, system-ui, sans-serif`);
    let tweak = document.getElementById('ft-tweak');
    if (!tweak) {
      tweak = document.createElement('style');
      tweak.id = 'ft-tweak';
      document.head.appendChild(tweak);
    }
    // Some fonts only come in one weight or need their wide setting on.
    const rules = [];
    if (f.stretch) rules.push(`font-stretch: ${f.stretch} !important;`);
    if (f.weight) rules.push(`font-weight: ${f.weight} !important;`);
    tweak.textContent = rules.length
      ? `h1, h2, h3, [class*="title"], [class*="headline"] { ${rules.join(' ')} }`
      : '';
    try { localStorage.setItem(KEY, current); } catch { /* ignore */ }
  }, [current]);

  return (
    <div className="ft">
      <style>{`
        .ft {
          position: fixed; left: 16px; bottom: 16px; z-index: 9999;
          background: rgba(13, 15, 16, 0.94); border: 1px solid var(--line);
          border-radius: 14px; padding: 12px; width: 240px;
          font-family: 'Inter', system-ui, sans-serif; font-size: 13px; color: var(--text);
          box-shadow: 0 20px 40px -20px rgba(0,0,0,0.8);
        }
        .ft__head { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
        .ft__head strong { font-weight: 500; }
        .ft__toggle { background: none; border: 0; color: var(--text-dim); cursor: pointer; font-size: 12px; }
        .ft__list { list-style: none; margin: 10px 0 0; padding: 0; display: grid; gap: 4px; }
        .ft__list button {
          width: 100%; text-align: left; background: none; border: 1px solid transparent;
          border-radius: 8px; padding: 7px 9px; color: var(--text); cursor: pointer;
          display: flex; justify-content: space-between; gap: 8px; font: inherit;
        }
        .ft__list button:hover { border-color: var(--line); }
        .ft__list button[aria-pressed="true"] { border-color: var(--text); }
        .ft__list small { color: var(--text-dim); }
        .ft__foot { margin: 10px 0 0; color: var(--text-dim); font-size: 11.5px; line-height: 1.4; }
      `}</style>
      <div className="ft__head">
        <strong>Headline font</strong>
        <button type="button" className="ft__toggle" onClick={() => setOpen((o) => !o)}>
          {open ? 'Hide' : 'Show'}
        </button>
      </div>
      {open && (
        <>
          <ul className="ft__list">
            {FONTS.map((f) => (
              <li key={f.name}>
                <button type="button" aria-pressed={current === f.name} onClick={() => setCurrent(f.name)}>
                  <span>{f.name}</span>
                  <small>{f.note}</small>
                </button>
              </li>
            ))}
          </ul>
          <p className="ft__foot">Local testing only. This panel never appears on the live site.</p>
        </>
      )}
    </div>
  );
}
