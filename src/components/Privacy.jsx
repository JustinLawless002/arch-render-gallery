import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CONTACT_EMAIL } from './CopyButton.jsx';

// Plain privacy page (/privacy), linked from the footer. Describes what the
// site actually does: the "Get an instant quote" form, Resend email,
// Vercel hosting + analytics, Google Fonts. Update it if any of that changes.
const UPDATED = '2 October 2026';

export default function Privacy() {
  useEffect(() => {
    document.title = 'Privacy — praxio';
    return () => {
      document.title = 'praxio — Architectural Visualization & AI-Assisted Rendering';
    };
  }, []);

  return (
    <main className="privacy-page">
      <style>{`
        .privacy-page {
          padding: 64px var(--page-gutter, 48px) 96px;
        }
        .privacy-inner { max-width: 720px; margin: 0 auto; }
        .privacy-page h1 {
          font-family: var(--font-display);
          font-size: clamp(28px, 4vw, 44px);
          font-weight: 600;
          letter-spacing: -0.01em;
          margin: 0 0 8px;
        }
        .privacy-updated { color: var(--text-dim); font-size: 13px; margin: 0 0 36px; }
        .privacy-page h2 {
          font-family: var(--font-display);
          font-size: 20px;
          font-weight: 500;
          margin: 32px 0 10px;
        }
        .privacy-page p, .privacy-page li {
          font-size: 15px;
          line-height: 1.7;
          color: var(--text-dim);
        }
        .privacy-page p { margin: 0 0 14px; }
        .privacy-page ul { margin: 0 0 14px; padding-left: 20px; }
        .privacy-page a { color: var(--text); }
        @media (max-width: 560px) { .privacy-page { padding: 48px 24px 72px; } }
      `}</style>

      <div className="privacy-inner">
        <h1>Privacy</h1>
        <p className="privacy-updated">Last updated {UPDATED}</p>

        <p>
          This site is run by CV Praxio Studio (praxio), Bali, Indonesia. This page explains what information the
          site collects and what happens to it.
        </p>

        <h2>The instant quote form</h2>
        <p>When you send a brief through “Get an instant quote”, praxio receives:</p>
        <ul>
          <li>your name, email address and, if you add them, your company and notes;</li>
          <li>your answers about the project (type, size, starting point, timing, budget and animation).</li>
        </ul>
        <p>
          These are sent by email to praxio, and a receipt with your answers and quote is sent to the email address
          you entered. Emails are delivered through Resend, an email service. If you choose WhatsApp instead, your
          brief is shared through WhatsApp under its own terms.
        </p>
        <p>
          praxio uses this information only to reply to you, prepare a quote and, if you go ahead, run the project.
          It is not sold or shared for marketing.
        </p>

        <h2>Visits to the site</h2>
        <p>
          The site is hosted by Vercel, which keeps standard server logs. It also uses Vercel Web Analytics and Speed
          Insights to count visits and measure page speed; these don't use cookies to follow you across other sites.
          Fonts are loaded from Google Fonts, so your browser connects to Google's servers.
        </p>

        <h2>How long information is kept</h2>
        <p>
          Briefs and emails are kept for as long as needed to handle your enquiry and any project that follows, and
          for business and tax records.
        </p>

        <h2>Your choices</h2>
        <p>
          You can ask to see, correct or delete the information praxio holds about you at any time by emailing{' '}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>

        <p style={{ marginTop: 40 }}>
          <Link to="/">Back to praxio.studio</Link>
        </p>
      </div>
    </main>
  );
}
