import { useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import workflows from '../data/workflows.js';
import { OPTIONS, estimateQuote, formatRange, projectSize } from '../data/wizardOptions.js';
import { smoothScrollTo } from '../lib/smoothScroll.js';
import { markQuote } from '../lib/quoteTracking.js';
import Reveal from './Reveal.jsx';
import RevealLines from './RevealLines.jsx';
import CopyButton, { CONTACT_EMAIL } from './CopyButton.jsx';

// ─────────────────────────────────────────────────────────────────────
//  "Start your project here" — a short step-by-step project brief.
//
//  Modelled on the brief/quote wizards archviz studios use (and general
//  multi-step form practice): one topic per step, a handful of choices
//  each, a progress bar, Back always available, and a summary at the
//  end. Step 1 is the three existing workflows (plans / references /
//  idea); the summary shows that workflow's stages and links to its full
//  page.
//
//  "Send brief" posts to /api/send-brief (Resend). Once it's sent, the
//  visitor sees an estimated price range (estimateQuote in
//  src/data/wizardOptions.js — all prices and weights live there) and
//  gets it in their receipt email; an exact quote follows by email.
//  "Copy" and "WhatsApp" are there for people who'd rather not use the
//  form. Wording and options are in src/data/wizardOptions.js.
// ─────────────────────────────────────────────────────────────────────

const WHATSAPP_NUMBER = '6281337828881';


const STEPS = ['Starting point', 'Project', 'Timing', 'Your details', 'Your quote'];
const LAST = STEPS.length - 1;

const EMPTY = {
  starting: null,
  hasModel: false,
  projectType: null,
  sizeMode: 'area',
  area: '',
  spaces: 4,
  views: 6,
  scope: null,
  animation: false,
  animSeconds: 30,
  timeline: null,
  budget: null,
  name: '',
  email: '',
  company: '',
  notes: '',
  website: '', // honeypot — hidden from people, bots fill it in
};

const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

function buildBrief(d) {
  const wf = workflows.find((w) => w.slug === d.starting);
  return [
    `Project brief — ${d.name || 'new enquiry'}${d.company ? `, ${d.company}` : ''}`,
    '',
    `Starting point: ${wf ? wf.buttonLabel.toLowerCase() : '—'}${d.hasModel ? ' + 3D model' : ''}`,
    `Project type: ${d.projectType || '—'}${projectSize(d) ? `, ${projectSize(d).text}` : ''}${d.scope ? ` (${d.scope.toLowerCase()})` : ''}`,
    `Animation: ${animText(d)}`,
    `Timeline: ${d.timeline || '—'}`,
    `Budget: ${d.budget || '—'}`,
    '',
    d.notes ? `Notes:\n${d.notes}` : 'Notes: —',
    '',
    `Reply to: ${d.email}`,
  ].join('\n');
}

const animText = (d) => (d.animation ? `Yes, about ${d.animSeconds} s` : 'No');

// The wizard state is sent as-is to the API (and estimateQuote).
const payload = (d) => d;

function Estimate({ est, compact }) {
  return (
    <div className="wz-est">
      <div className="wz-label" style={{ marginTop: 0 }}>Your instant quote</div>
      <div className="wz-est__price">{formatRange(est)}</div>
      <ul className="wz-est__basis">
        {est.basis.map((b) => (
          <li key={b}>{b}</li>
        ))}
      </ul>
      {!compact && (
        <p className="wz-note">
          Includes design input at every stage and unlimited revisions within the agreed scope. Your instant
          quote is an estimate; the exact fixed price follows once your drawings and references have been reviewed.
        </p>
      )}
    </div>
  );
}

function Choice({ selected, onClick, children, sub, multi }) {
  return (
    <button
      type="button"
      className={`wz-choice${selected ? ' is-selected' : ''}${sub ? ' has-sub' : ''}`}
      aria-pressed={selected}
      onClick={onClick}
    >
      <span className={`wz-choice__mark${multi ? ' is-multi' : ''}`} aria-hidden="true" />
      <span className="wz-choice__text">
        <span className="wz-choice__label">{children}</span>
        {sub && <span className="wz-choice__sub">{sub}</span>}
      </span>
    </button>
  );
}

export default function ProcessSection() {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [d, setD] = useState(EMPTY);
  const [touched, setTouched] = useState(false);
  // true after an "edit" from the summary: the step then offers a direct
  // "Back to summary" instead of making the visitor click through again.
  const [editing, setEditing] = useState(false);
  const [send, setSend] = useState({ state: 'idle', message: '' }); // idle | sending | sent | error
  const topRef = useRef(null);
  const set = (patch) => setD((prev) => ({ ...prev, ...patch }));

  const valid = [
    !!d.starting,
    !!d.projectType && !!projectSize(d),
    true, // timing is optional
    d.name.trim() !== '' && emailOk(d.email),
    true,
  ];

  const go = (to) => {
    if (to > step && !valid[step]) {
      setTouched(true);
      return;
    }
    setTouched(false);
    if (step === LAST && to < LAST) setEditing(true);
    if (to === LAST) setEditing(false);
    setDir(to > step ? 1 : -1);
    setStep(to);
    // free funnel tracking (see src/lib/quoteTracking.js)
    if (to === 1) markQuote('1-started');
    if (to === 3) markQuote('2-details');
    if (to === LAST) markQuote('3-summary');
    // keep the wizard in view if it's taller than the screen on phones
    const top = topRef.current?.getBoundingClientRect().top;
    if (top != null && top < 0) {
      smoothScrollTo(window.scrollY + top - 24);
    }
  };

  const brief = useMemo(() => buildBrief(d), [d]);
  const est = useMemo(() => estimateQuote(payload(d)), [d]);
  const wf = workflows.find((w) => w.slug === d.starting);
  const subject = `Project brief${d.projectType ? ` — ${d.projectType}` : ''}${d.name ? ` (${d.name})` : ''}`;
  const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(brief)}`;
  // The WhatsApp message also carries the estimate, so it's in the chat thread.
  const waText = est
    ? `${brief}\n\nInstant quote (shown on the site): ${formatRange(est)}\n${est.basis.map((b) => `- ${b}`).join('\n')}`
    : brief;
  const whatsapp = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(waText)}`;

  // Sends the brief straight from the page via /api/send-brief (a Vercel
  // function → Resend). No email app needed. Only works on Vercel (preview
  // or live), not under `npm run dev`, which has no /api.
  const submit = async () => {
    setSend({ state: 'sending', message: '' });
    try {
      const r = await fetch('/api/send-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload(d)),
      });
      const out = await r.json().catch(() => ({}));
      if (r.ok && out.ok) {
        setSend({ state: 'sent', message: '' });
        markQuote('4-sent-email');
        return;
      }
      const local = import.meta.env.DEV && (r.status === 404 || !out.error);
      setSend({
        state: 'error',
        message: local
          ? 'Sending only works on the live site or a Vercel preview link — not in local npm run dev.'
          : out.error || 'The brief could not be sent right now.',
      });
    } catch {
      setSend({ state: 'error', message: 'Could not reach the server — check your connection.' });
    }
  };
  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <section className="process-section" id="process" aria-label="Get an instant quote">
      <style>{`
        .process-section { padding: 64px var(--page-gutter, 48px) 96px; }
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
          margin: 0 0 12px;
        }
        .process-intro {
          color: var(--text-dim);
          font-size: 15px;
          line-height: 1.6;
          max-width: 56ch;
          margin: 0 0 36px;
        }

        /* Heading sits above the wizard, lined up with the box's edges. On
           wide screens the title goes left and the intro right, bottoms level. */
        .process-layout { max-width: 1100px; margin: 0 auto; }
        .process-head { margin-bottom: 28px; }
        .process-title { margin: 0; }
        .process-intro { margin: 12px 0 0; }
        @media (min-width: 900px) {
          .process-head {
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            gap: 48px;
          }
          .process-intro { margin: 0; max-width: 46ch; padding-bottom: 6px; }
        }
        .wz {
          max-width: 1100px;
          border: 1px solid var(--line);
          border-radius: 20px;
          background: rgba(22, 24, 26, 0.6);
          overflow: hidden;
          scroll-margin-top: 24px;
        }
        .wz-top { padding: 22px 28px 0; }
        .wz-steps {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--text-dim);
        }
        .wz-steps__names { display: flex; gap: 18px; flex-wrap: wrap; }
        .wz-steps__names button {
          padding: 0;
          border: 0;
          background: none;
          color: inherit;
          font: inherit;
          letter-spacing: inherit;
          text-transform: inherit;
          cursor: default;
          opacity: 0.55;
        }
        .wz-steps__names button.is-done { opacity: 0.9; cursor: pointer; }
        .wz-steps__names button.is-done:hover { color: var(--text); }
        .wz-steps__names button.is-current { opacity: 1; color: var(--text); }
        .wz-bar { height: 2px; background: var(--line); margin-top: 14px; border-radius: 2px; overflow: hidden; }
        .wz-bar__fill { height: 100%; background: var(--text); transition: width 500ms cubic-bezier(0.16, 1, 0.3, 1); }

        .wz-body { position: relative; padding: 32px 28px 8px; min-height: 360px; }
        .wz-q {
          font-family: var(--font-display);
          font-size: clamp(22px, 2.6vw, 30px);
          font-weight: 500;
          letter-spacing: -0.01em;
          margin: 0 0 6px;
        }
        .wz-hint { color: var(--text-dim); font-size: 14px; margin: 0 0 24px; }
        .wz-label {
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--text-dim);
          margin: 26px 0 12px;
        }
        .wz-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 10px; }
        .wz-grid--3 { grid-template-columns: repeat(3, 1fr); }
        .wz-choice {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          width: 100%;
          padding: 14px 16px;
          border: 1px solid var(--line);
          border-radius: 12px;
          background: transparent;
          color: var(--text);
          text-align: left;
          font-family: var(--font-body);
          font-size: 14.5px;
          line-height: 1.35;
          cursor: pointer;
          transition: border-color 180ms ease, background 180ms ease;
        }
        .wz-choice.has-sub { padding: 18px; }
        .wz-choice:hover { border-color: rgba(255, 255, 255, 0.35); }
        .wz-choice.is-selected { border-color: var(--text); background: rgba(255, 255, 255, 0.06); }
        .wz-choice__mark {
          flex: 0 0 auto;
          width: 16px;
          height: 16px;
          margin-top: 1px;
          border: 1.5px solid rgba(255, 255, 255, 0.45);
          border-radius: 50%;
          position: relative;
        }
        .wz-choice__mark.is-multi { border-radius: 4px; }
        .wz-choice.is-selected .wz-choice__mark { border-color: var(--text); background: var(--text); }
        .wz-choice.is-selected .wz-choice__mark::after {
          content: '';
          position: absolute;
          left: 4.5px;
          top: 1.5px;
          width: 4px;
          height: 8px;
          border: solid var(--bg);
          border-width: 0 1.8px 1.8px 0;
          transform: rotate(45deg);
        }
        .wz-choice__text { display: flex; flex-direction: column; gap: 6px; }
        .wz-choice__label { font-weight: 500; }
        .wz-choice.has-sub .wz-choice__label { font-family: var(--font-display); font-size: 17px; }
        .wz-choice__sub { color: var(--text-dim); font-size: 13.5px; }

        .wz-count { display: flex; align-items: center; gap: 12px; margin: 14px 0 0 2px; font-size: 14px; color: var(--text-dim); }
        .wz-count button {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 1px solid var(--line);
          background: transparent;
          color: var(--text);
          font-size: 16px;
          cursor: pointer;
        }
        .wz-count button:hover { border-color: var(--text); }
        .wz-count strong { color: var(--text); min-width: 2ch; text-align: center; font-size: 16px; }

        .wz-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .wz-field { display: flex; flex-direction: column; gap: 6px; }
        .wz-field--wide { grid-column: 1 / -1; }
        .wz-field span { font-size: 12.5px; color: var(--text-dim); }
        .wz-field input,
        .wz-field textarea {
          width: 100%;
          padding: 12px 14px;
          border: 1px solid var(--line);
          border-radius: 10px;
          background: rgba(0, 0, 0, 0.25);
          color: var(--text);
          font-family: var(--font-body);
          font-size: 15px;
          resize: vertical;
        }
        .wz-field input:focus,
        .wz-field textarea:focus { outline: none; border-color: var(--text); }
        .wz-field.is-bad input { border-color: #c96a5a; }
        .wz-error { color: #d98b7d; font-size: 13px; margin-top: 16px; }

        .wz-summary { display: grid; grid-template-columns: 1.1fr 1fr; gap: 28px; }
        .wz-brief { margin: 0; display: grid; grid-template-columns: max-content 1fr; gap: 14px 18px; align-content: start; font-size: 14.5px; }
        .wz-brief dt { color: var(--text-dim); }
        .wz-brief dd { margin: 0; }
        .wz-brief button {
          padding: 0;
          border: 0;
          background: none;
          color: var(--text-dim);
          font: inherit;
          font-size: 12px;
          text-decoration: underline;
          cursor: pointer;
          margin-left: 8px;
        }
        .wz-flow { border-left: 1px solid var(--line); padding-left: 24px; }
        .wz-flow ol { list-style: none; margin: 0 0 16px; padding: 0; counter-reset: s; }
        .wz-flow li {
          counter-increment: s;
          display: flex;
          gap: 12px;
          padding: 7px 0;
          font-size: 14px;
          color: var(--text);
        }
        .wz-flow li::before {
          content: counter(s, decimal-leading-zero);
          font-family: var(--font-mono);
          font-size: 11.5px;
          color: var(--text-dim);
          padding-top: 2px;
        }
        .wz-flow a { color: var(--text); font-size: 13.5px; }
        .wz-note { color: var(--text-dim); font-size: 13px; margin: 14px 0 0; }
        .wz-send { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-top: 26px; }
        .wz-note a { color: var(--text); }
        .wz-btn[aria-busy='true'] { opacity: 0.75; cursor: progress; visibility: visible; }
        .wz-spin {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          border: 2px solid currentColor;
          border-right-color: transparent;
          animation: wz-spin 0.7s linear infinite;
        }
        @keyframes wz-spin { to { transform: rotate(360deg); } }
        .wz-hp { position: absolute; left: -9999px; width: 1px; height: 1px; overflow: hidden; }
        .wz-done { padding: 12px 0 8px; max-width: 560px; }
        .wz-done__tick {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: var(--text);
          color: var(--bg);
          margin-bottom: 20px;
        }
        .wz-done a { color: var(--text); font-size: 14px; }
        .wz-done { max-width: 640px; }
        .wz-area { max-width: 240px; margin-top: 14px; }
        .wz-area__row { display: flex; align-items: center; gap: 10px; color: var(--text); }
        .wz-area .wz-area__unit { font-size: 15px; color: var(--text-dim); }
        .wz-area input::-webkit-outer-spin-button,
        .wz-area input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        .wz-area input { -moz-appearance: textfield; }
        .wz-grid--small { grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); }
        .wz-est {
          margin: 24px 0 22px;
          padding: 20px 22px;
          border: 1px solid var(--line);
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.03);
        }
        .wz-est__price {
          font-family: var(--font-display);
          font-size: clamp(26px, 3.4vw, 36px);
          font-weight: 600;
          letter-spacing: -0.01em;
        }
        .wz-est__basis { list-style: none; margin: 10px 0 0; padding: 0; color: var(--text-dim); font-size: 13.5px; }
        .wz-est__basis li { padding: 2px 0; }
        /* Dev-only live price panel (npm run dev), never on the live site */
        .wz-devpanel {
          position: fixed;
          right: 16px;
          bottom: 16px;
          z-index: 9999;
          width: min(320px, calc(100vw - 32px));
          max-height: 70vh;
          overflow: auto;
          padding: 14px 16px 4px;
          border: 1px dashed rgba(255, 255, 255, 0.45);
          border-radius: 14px;
          background: rgba(10, 11, 12, 0.94);
          font-size: 13px;
        }
        .wz-devpanel__tag { font-size: 11px; color: var(--text-dim); margin-bottom: 8px; }
        .wz-devpanel .wz-est { margin: 0 0 10px; padding: 0; border: 0; background: none; }
        .wz-devpanel .wz-est__price { font-size: 24px; }
        .wz-devpanel .wz-note { margin: 8px 0 0; font-size: 12px; }

        .wz-nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          padding: 20px 28px 24px;
        }
        .wz-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 22px;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.4);
          background: transparent;
          color: var(--text);
          font-family: var(--font-body);
          font-size: 14px;
          text-decoration: none;
          cursor: pointer;
          transition: background 180ms ease, color 180ms ease, border-color 180ms ease, opacity 180ms ease;
        }
        .wz-btn:hover { background: var(--text); color: var(--bg); border-color: var(--text); }
        .wz-btn--primary { background: var(--text); color: var(--bg); border-color: var(--text); }
        .wz-btn--primary:hover { opacity: 0.85; }
        .wz-btn--ghost { border-color: transparent; color: var(--text-dim); }
        .wz-btn--ghost:hover { background: transparent; color: var(--text); border-color: transparent; }
        .wz-nav .wz-btn[disabled] { visibility: hidden; }

        @media (max-width: 700px) {
          .process-section { padding: 48px 24px 72px; }
          .wz { border-radius: 16px; }
          .wz-top, .wz-body, .wz-nav { padding-left: 18px; padding-right: 18px; }
          .wz-steps__names { display: none; }
          .wz-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .wz-grid.wz-grid--3 { grid-template-columns: 1fr; }
          .wz-fields { grid-template-columns: 1fr; }
          .wz-summary { grid-template-columns: 1fr; }
          .wz-flow { border-left: 0; padding-left: 0; border-top: 1px solid var(--line); padding-top: 20px; }
          .wz-body { min-height: 0; }
        }
      `}</style>

      <div className="process-layout">
      <div className="process-head">
        <RevealLines as="h2" className="process-title" text="Get an instant quote" delay={0.08} />
        <Reveal as="p" className="process-intro" delay={0.12}>
          Answer a few quick questions and see your price straight away. Free, no call
          needed, plus a clear picture of how your project will run.
        </Reveal>
      </div>

      <Reveal as="div" delay={0.16}>
        <div className="wz" ref={topRef}>
          <div className="wz-top">
            <div className="wz-steps">
              <div className="wz-steps__names">
                {STEPS.map((name, i) => (
                  <button
                    key={name}
                    type="button"
                    className={i === step ? 'is-current' : i < step || editing ? 'is-done' : ''}
                    onClick={() => (i < step || editing) && i !== step && go(i)}
                    tabIndex={i < step || editing ? 0 : -1}
                  >
                    {name}
                  </button>
                ))}
              </div>
              <span>
                {step + 1} / {STEPS.length}
              </span>
            </div>
            <div className="wz-bar">
              <div className="wz-bar__fill" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="wz-body">
            <AnimatePresence mode="wait" custom={dir} initial={false}>
              <motion.div
                key={step}
                custom={dir}
                initial={{ opacity: 0, x: dir * 28 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: dir * -28 }}
                transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              >
                {step === 0 && (
                  <>
                    <h3 className="wz-q">What are you starting with?</h3>
                    <p className="wz-hint">This decides how the project runs — pick the closest.</p>
                    <div className="wz-grid wz-grid--3">
                      {workflows.map((w) => (
                        <Choice
                          key={w.slug}
                          selected={d.starting === w.slug}
                          onClick={() => set({ starting: w.slug })}
                          sub={OPTIONS.starting[w.slug]}
                        >
                          {w.buttonLabel}
                        </Choice>
                      ))}
                    </div>
                    <div className="wz-label">Do you also have a 3D model?</div>
                    <div className="wz-grid">
                      <Choice multi selected={d.hasModel} onClick={() => set({ hasModel: !d.hasModel })}>
                        Yes, SketchUp, Revit, Rhino or similar
                      </Choice>
                    </div>
                  </>
                )}

                {step === 1 && (
                  <>
                    <h3 className="wz-q">What kind of project is it?</h3>
                    <p className="wz-hint">Choose one.</p>
                    <div className="wz-grid">
                      {OPTIONS.projectTypes.map((t) => (
                        <Choice key={t} selected={d.projectType === t} onClick={() => set({ projectType: t })}>
                          {t}
                        </Choice>
                      ))}
                    </div>
                    <div className="wz-label">Interior or exterior?</div>
                    <div className="wz-grid wz-grid--3">
                      {OPTIONS.scope.map((t) => (
                        <Choice key={t} selected={d.scope === t} onClick={() => set({ scope: t })}>
                          {t}
                        </Choice>
                      ))}
                    </div>
                    <div className="wz-label">How big is it?</div>
                    <div className="wz-grid wz-grid--3">
                      {OPTIONS.sizeModes.map((m) => (
                        <Choice key={m.id} selected={d.sizeMode === m.id} onClick={() => set({ sizeMode: m.id })}>
                          {m.label}
                        </Choice>
                      ))}
                    </div>
                    {d.sizeMode === 'area' ? (
                      <label className={`wz-field wz-area${touched && !projectSize(d) ? ' is-bad' : ''}`}>
                        <span className="wz-area__row">
                          <input
                            type="number"
                            inputMode="numeric"
                            min="10"
                            placeholder="e.g. 180"
                            value={d.area}
                            onChange={(e) => set({ area: e.target.value })}
                            aria-label="Floor area in square metres"
                          />
                          <span className="wz-area__unit">m²</span>
                        </span>
                      </label>
                    ) : (
                      <div className="wz-count">
                        {d.sizeMode === 'spaces' ? 'How many spaces?' : 'How many final views?'}
                        <button
                          type="button"
                          aria-label="Fewer"
                          onClick={() => set({ [d.sizeMode]: Math.max(1, d[d.sizeMode] - 1) })}
                        >
                          −
                        </button>
                        <strong>{d[d.sizeMode]}</strong>
                        <button
                          type="button"
                          aria-label="More"
                          onClick={() => set({ [d.sizeMode]: Math.min(d.sizeMode === 'spaces' ? 100 : 200, d[d.sizeMode] + 1) })}
                        >
                          +
                        </button>
                      </div>
                    )}
                    <p className="wz-note">{OPTIONS.sizeModes.find((m) => m.id === d.sizeMode)?.hint}</p>
                    <div className="wz-label">Add an animation?</div>
                    <div className="wz-grid">
                      <Choice multi selected={d.animation} onClick={() => set({ animation: !d.animation })} sub="Walkthrough or short motion clips.">
                        Yes, include an animation
                      </Choice>
                    </div>
                    {d.animation && (
                      <>
                        <div className="wz-label">Roughly how long is the animation?</div>
                        <div className="wz-grid wz-grid--small">
                          {OPTIONS.animationLengths.map((s) => (
                            <Choice key={s} selected={d.animSeconds === s} onClick={() => set({ animSeconds: s })}>
                              {s} seconds
                            </Choice>
                          ))}
                        </div>
                      </>
                    )}
                  </>
                )}

                {step === 2 && (
                  <>
                    <h3 className="wz-q">Timing and budget</h3>
                    <p className="wz-hint">Rough is fine — both optional. A typical first submission takes 2–3 weeks.</p>
                    <div className="wz-label">When do you need it?</div>
                    <div className="wz-grid">
                      {OPTIONS.timelines.map((t) => (
                        <Choice key={t} selected={d.timeline === t} onClick={() => set({ timeline: d.timeline === t ? null : t })}>
                          {t}
                        </Choice>
                      ))}
                    </div>
                    <div className="wz-label">Budget range</div>
                    <div className="wz-grid">
                      {OPTIONS.budgets.map((t) => (
                        <Choice key={t} selected={d.budget === t} onClick={() => set({ budget: d.budget === t ? null : t })}>
                          {t}
                        </Choice>
                      ))}
                    </div>
                  </>
                )}

                {step === 3 && (
                  <>
                    <h3 className="wz-q">Where should the quote go?</h3>
                    <p className="wz-hint">Drawings and references can be sent with the email or after the first reply.</p>
                    <div className="wz-fields">
                      <label className={`wz-field${touched && !d.name.trim() ? ' is-bad' : ''}`}>
                        <span>Name *</span>
                        <input value={d.name} onChange={(e) => set({ name: e.target.value })} autoComplete="name" />
                      </label>
                      <label className={`wz-field${touched && !emailOk(d.email) ? ' is-bad' : ''}`}>
                        <span>Email *</span>
                        <input
                          type="email"
                          value={d.email}
                          onChange={(e) => set({ email: e.target.value })}
                          autoComplete="email"
                        />
                      </label>
                      <label className="wz-field wz-field--wide">
                        <span>Company / studio (optional)</span>
                        <input value={d.company} onChange={(e) => set({ company: e.target.value })} autoComplete="organization" />
                      </label>
                      <label className="wz-hp" aria-hidden="true">
                        Website
                        <input tabIndex={-1} autoComplete="off" value={d.website} onChange={(e) => set({ website: e.target.value })} />
                      </label>
                      <label className="wz-field wz-field--wide">
                        <span>Anything else? Location, style, links to references… (optional)</span>
                        <textarea rows={4} value={d.notes} onChange={(e) => set({ notes: e.target.value })} />
                      </label>
                    </div>
                  </>
                )}

                {step === LAST && send.state === 'sent' && (
                  <div className="wz-done">
                    <div className="wz-done__tick" aria-hidden="true">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12.5 10 17.5 19 7" />
                      </svg>
                    </div>
                    <h3 className="wz-q">
                      {send.via === 'whatsapp' ? 'Almost there' : 'Brief sent'} — thank you, {d.name.split(' ')[0]}
                    </h3>
                    {send.via === 'whatsapp' ? (
                      <p className="wz-hint">
                        Your brief is ready in WhatsApp. Just press send there and it reaches praxio. You'll get a reply
                        with questions or a quote, and you can share drawings or references in the same chat.
                      </p>
                    ) : (
                      <p className="wz-hint">
                        It's with praxio now, and a copy is on its way to {d.email}. You'll get a reply with questions or a
                        quote. If you have drawings or references, just reply to that email and attach them.
                      </p>
                    )}
                    {est && <Estimate est={est} />}
                    {wf && <Link to={`/process/${wf.slug}`}>See how your project will run</Link>}
                  </div>
                )}

                {step === LAST && send.state !== 'sent' && (
                  <>
                    <h3 className="wz-q">Your brief is ready</h3>
                    <p className="wz-hint">
                      {est
                        ? "Check it over, then send it. Your instant quote appears straight away."
                        : "Check it over, then send it — you'll get a reply with questions or a quote."}
                    </p>
                    <div className="wz-summary">
                      <dl className="wz-brief">
                        <dt>Starting</dt>
                        <dd>
                          {wf?.buttonLabel}
                          {d.hasModel ? ' + 3D model' : ''}
                          <button type="button" onClick={() => go(0)}>edit</button>
                        </dd>
                        <dt>Project</dt>
                        <dd>
                          {d.projectType}
                          {projectSize(d) ? ` · ${projectSize(d).text}` : ''}
                          {d.scope ? ` · ${d.scope}` : ''}
                          <button type="button" onClick={() => go(1)}>edit</button>
                        </dd>
                        <dt>Animation</dt>
                        <dd>
                          {animText(d)}
                          <button type="button" onClick={() => go(1)}>edit</button>
                        </dd>
                        <dt>Timing</dt>
                        <dd>
                          {d.timeline || 'Not specified'}
                          {d.budget ? ` · ${d.budget}` : ''}
                          <button type="button" onClick={() => go(2)}>edit</button>
                        </dd>
                        <dt>Contact</dt>
                        <dd>
                          {d.name} · {d.email}
                          <button type="button" onClick={() => go(3)}>edit</button>
                        </dd>
                      </dl>
                      {wf && (
                        <div className="wz-flow">
                          <div className="wz-label" style={{ marginTop: 0 }}>How it will run</div>
                          <ol>
                            {wf.steps.map((s) => (
                              <li key={s.title}>{s.title}</li>
                            ))}
                          </ol>
                          <Link to={`/process/${wf.slug}`}>See every step in detail</Link>
                        </div>
                      )}
                    </div>
                    {send.state === 'error' && (
                      <p className="wz-error" role="alert">
                        {send.message} You can still send it another way below.
                      </p>
                    )}
                    <div className="wz-send">
                      <button
                        type="button"
                        className="wz-btn wz-btn--primary"
                        onClick={submit}
                        disabled={send.state === 'sending'}
                        aria-busy={send.state === 'sending'}
                      >
                        {send.state === 'sending' ? (
                          <>
                            <span className="wz-spin" aria-hidden="true" /> Sending…
                          </>
                        ) : (
                          est ? 'Send brief & see my quote' : 'Send brief'
                        )}
                      </button>
                      <a
                        className="wz-btn"
                        href={whatsapp}
                        target="_blank"
                        rel="noopener noreferrer"
                        // Opening WhatsApp counts as sending: show the done
                        // screen with the estimate, as after "Send brief".
                        onClick={() => {
                          setSend({ state: 'sent', message: '', via: 'whatsapp' });
                          markQuote('4-sent-whatsapp');
                        }}
                      >
                        Send on WhatsApp
                      </a>
                      <CopyButton text={brief} label="Copy the brief" />
                    </div>
                    {est && (
                      <p className="wz-note">
                        Your quote appears here as soon as you send, and is emailed to you. The exact fixed price follows
                        once praxio has reviewed your drawings and references.
                      </p>
                    )}
                    <p className="wz-note">
                      Prefer your own email? <a href={mailto} onClick={() => markQuote('4-own-email')}>Open it in your email app</a> or send it to {CONTACT_EMAIL}{' '}
                      <CopyButton iconOnly />
                    </p>
                  </>
                )}

                {touched && !valid[step] && (
                  <p className="wz-error" role="alert">
                    {step === 3
                      ? 'Please add your name and a valid email.'
                      : step === 1
                        ? 'Choose a project type and add its size (at least 10 m²).'
                        : 'Choose an option to continue.'}
                  </p>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="wz-nav">
            <button type="button" className="wz-btn wz-btn--ghost" onClick={() => go(step - 1)} disabled={step === 0 || send.state === 'sent'}>
              Back
            </button>
            {step < LAST && editing ? (
              <button type="button" className="wz-btn wz-btn--primary" onClick={() => go(LAST)}>
                Back to summary
              </button>
            ) : step < LAST ? (
              <button type="button" className="wz-btn wz-btn--primary" onClick={() => go(step + 1)}>
                {step === LAST - 1 ? 'See my quote' : 'Next'}
              </button>
            ) : (
              <button
                type="button"
                className="wz-btn wz-btn--ghost"
                onClick={() => {
                  setD(EMPTY);
                  setSend({ state: 'idle', message: '' });
                  go(0);
                  setEditing(false);
                }}
              >
                Start over
              </button>
            )}
          </div>
        </div>
      </Reveal>
      </div>

      {import.meta.env.DEV &&
        createPortal(
          // Local testing only: live estimate that updates as you click
          // through the wizard. Edit PRICING in wizardOptions.js and Vite
          // reloads it instantly. Never rendered on the live site.
          <div className="wz-devpanel" aria-hidden="true">
            <div className="wz-devpanel__tag">
              Dev only · live estimate{est ? ` · priced as ${Math.round(est.area).toLocaleString('en-US')} m²` : ''}
            </div>
            {est ? (
              <Estimate est={est} compact />
            ) : (
              <p className="wz-note">Add the project size to see a price.</p>
            )}
          </div>,
          document.body
        )}
    </section>
  );
}
