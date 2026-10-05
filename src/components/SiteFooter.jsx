import { Link } from 'react-router-dom';
import Reveal from './Reveal.jsx';
import { EmailIcon, WhatsAppIcon } from './ContactIcons.jsx';
import CopyButton, { CONTACT_EMAIL } from './CopyButton.jsx';

export default function SiteFooter() {
  return (
    <footer className="site-footer-full" aria-label="Contact and social links">
      <style>{`
        .site-footer-full {
          border-top: 1px solid var(--line);
          padding: 48px var(--page-gutter, 48px) 32px;
        }
        .footer-columns {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, max-content));
          column-gap: 96px;
          gap: 32px;
          max-width: 900px;
          margin-bottom: 40px;
        }
        @media (max-width: 640px) {
          .footer-columns { grid-template-columns: 1fr; gap: 28px; }
        }
        .footer-heading {
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--text-dim);
          margin-bottom: 12px;
        }
        .footer-col {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .footer-col a,
        .footer-col span {
          font-family: var(--font-body);
          font-size: 14px;
          color: var(--text-dim);
          text-decoration: none;
        }
        .footer-col a:hover {
          color: var(--text);
          text-decoration: underline;
        }
        .footer-email-row {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .footer-contact-link {
          display: inline-flex;
          align-items: center;
          gap: 10px;
        }
        .footer-contact-link svg {
          flex: 0 0 auto;
        }
        .footer-bottom a.footer-privacy { color: inherit; }
        .footer-bottom a.footer-privacy:hover { color: var(--text); }
        .footer-bottom {
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: var(--text-dim);
          border-top: 1px solid var(--line);
          padding-top: 20px;
        }
      `}</style>

      <div className="footer-columns">
        <Reveal as="div" className="footer-col" delay={0}>
          <div className="footer-heading">Contact</div>
          <div className="footer-email-row">
            <a className="footer-contact-link" href={`mailto:${CONTACT_EMAIL}`}>
              <EmailIcon />
              {CONTACT_EMAIL}
            </a>
            <CopyButton iconOnly />
          </div>
          <a
            className="footer-contact-link"
            href="https://wa.me/6281337828881"
            target="_blank"
            rel="noopener noreferrer"
          >
            <WhatsAppIcon />
            whatsapp
          </a>
        </Reveal>
        <Reveal as="div" className="footer-col" delay={0.08}>
          <div className="footer-heading">Follow</div>
          <a href="https://www.instagram.com/praxiodesign" target="_blank" rel="noopener noreferrer">
            Instagram
          </a>
          <a href="https://x.com/praxiostudio" target="_blank" rel="noopener noreferrer">
            X
          </a>
        </Reveal>
      </div>

      {/* Plain (not a scroll-reveal): it's the last thing on the page, so it
          can never scroll far enough up to trigger a reveal animation. */}
      <div className="footer-bottom">
        © {new Date().getFullYear()} praxio. All rights reserved. ·{' '}
        <Link to="/privacy" className="footer-privacy">Privacy</Link>
      </div>
    </footer>
  );
}
