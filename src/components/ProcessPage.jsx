import { useNavigate } from 'react-router-dom';
import workflows from '../data/workflows.js';
import './ProcessPage.css';

export default function ProcessPage() {
  const navigate = useNavigate();

  const handleSelect = (slug) => {
    navigate(`/process/${slug}`);
  };

  return (
    <main className="process-page">
      <h1 className="process-page__title">How would you like to start?</h1>
      <div className="process-page__options">
        {workflows.map((w) => (
          <button
            key={w.slug}
            type="button"
            className="hero__cta"
            onClick={() => handleSelect(w.slug)}
          >
            {w.buttonLabel}
          </button>
        ))}
      </div>
    </main>
  );
}
