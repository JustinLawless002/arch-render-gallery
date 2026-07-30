import { useEffect } from 'react';

export default function Lightbox({ work, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="lightbox" role="dialog" aria-modal="true" onClick={onClose}>
      <button className="lightbox-close" onClick={onClose}>
        Close
      </button>
      <img src={work.full} alt={work.title} onClick={(e) => e.stopPropagation()} />
      <div className="lightbox-meta">
        <strong>{work.title}</strong>
        <span>Esc to close</span>
      </div>
    </div>
  );
}
