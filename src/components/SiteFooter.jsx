export default function SiteFooter() {
  return (
    <footer className="site-footer-full" aria-label="Contact and social links">
      <style>{`
        .site-footer-full {
          border-top: 1px solid var(--line);
          padding: 48px 48px 32px;
        }
        .footer-columns {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
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
          color: var(--accent);
          text-decoration: underline;
        }
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
        <div className="footer-col">
          <div className="footer-heading">Contact</div>
          <a href="mailto:Jlawless720@gmail.com">Jlawless720@gmail.com</a>
          <a href="mailto:justin_lawless@hotmail.com">justin_lawless@hotmail.com</a>
          <a href="https://wa.me/6281337828881" target="_blank" rel="noopener noreferrer">
            WhatsApp +62 813-3782-8881
          </a>
        </div>
        <div className="footer-col">
          <div className="footer-heading">Studio</div>
          <span>Renon, Denpasar, Bali, Indonesia</span>
        </div>
        <div className="footer-col">
          <div className="footer-heading">Follow</div>
          <a href="https://www.instagram.com/primedesign09/" target="_blank" rel="noopener noreferrer">
            Instagram
          </a>
        </div>
      </div>

      <div className="footer-bottom">Prime Design — {new Date().getFullYear()}</div>
    </footer>
  );
}
