// Change this to your real address — it's the only contact config in the project.
const EMAIL = 'hello@yourdomain.com';

export default function ContactButton() {
  return (
    <a className="contact-btn" href={`mailto:${EMAIL}`}>
      Contact
    </a>
  );
}
