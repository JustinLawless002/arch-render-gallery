import { Link, useLocation } from 'react-router-dom';
import { scrollToId } from '../lib/smoothScroll.js';

// Slowly glides to a section by id (see src/lib/smoothScroll.js for the
// speed settings). Leaves a little room at the top so the section title
// isn't tucked under the header when it slides back in.
export function scrollToSection(id) {
  return scrollToId(id, 24);
}

// A link to a homepage section ("/#services" etc). On the homepage it
// glides there instead of jumping; from any other page it navigates home
// and ScrollToTop (App.jsx) takes it to the section.
export default function SectionLink({ to, className, children, onClick, ...rest }) {
  const location = useLocation();
  const id = to.split('#')[1];
  return (
    <Link
      to={`/#${id}`}
      className={className}
      onClick={(e) => {
        onClick?.(e);
        if (location.pathname === '/' && id && scrollToSection(id)) {
          e.preventDefault();
          window.history.replaceState(null, '', `/#${id}`);
        }
      }}
      {...rest}
    >
      {children}
    </Link>
  );
}
