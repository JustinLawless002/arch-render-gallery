import { useParams, Link } from 'react-router-dom';
import workflows from '../data/workflows.js';
import ContactButton from './ContactButton.jsx';
import RevealLines from './RevealLines.jsx';
import './WorkflowPage.css';

function DownArrow() {
  return (
    <div className="workflow-connector">
      <svg className="workflow-connector__arrow" viewBox="0 0 24 40" aria-hidden="true">
        <line x1="12" y1="0" x2="12" y2="28" stroke="currentColor" strokeWidth="2" />
        <polygon points="4,26 20,26 12,40" fill="currentColor" />
      </svg>
    </div>
  );
}

// Spreads the 3 images evenly through the step sequence — inserted after
// the step index closest to the 1/4, 2/4, and 3/4 marks, regardless of how
// many steps a given workflow has (7 vs 8).
function buildFlowItems(steps, images) {
  const insertAfter = [1, 2, 3].map((k) => Math.round((k * steps.length) / 4) - 1);
  const items = [];
  let stepSide = 0; // tracks left/right independently of images inserted

  steps.forEach((step, i) => {
    items.push({ type: 'step', step, side: stepSide % 2 === 0 ? 'right' : 'left' });
    stepSide += 1;

    const imgIdx = insertAfter.indexOf(i);
    if (imgIdx !== -1 && images[imgIdx]) {
      items.push({ type: 'image', src: images[imgIdx] });
    }
  });

  return items;
}

export default function WorkflowPage() {
  const { slug } = useParams();
  const workflow = workflows.find((w) => w.slug === slug);

  if (!workflow) {
    return (
      <main className="workflow-page">
        <p className="workflow-page__missing">That workflow doesn't exist.</p>
        <Link to="/process" className="hero__cta">
          Back to process
        </Link>
      </main>
    );
  }

  const flowItems = buildFlowItems(workflow.steps, workflow.images || []);

  return (
    <main className="workflow-page">
      <div className="workflow-page__header">
        <Link to="/process" className="workflow-page__back">
          ← Back
        </Link>
        {/* delay: the whole page also slides up on arrival (see
            WorkflowPage.css), so the title waits for that to settle. */}
        <RevealLines
          as="h1"
          className="workflow-page__title"
          text={workflow.title}
          delay={0.45}
        />
      </div>

      <div className="workflow-timeline">
        {flowItems.map((item, i) => (
          <div key={i}>
            {item.type === 'step' ? (
              <div className={`workflow-step workflow-step--${item.side}`}>
                <div className="workflow-step__content">
                  <span className="workflow-step__index">
                    {String(
                      flowItems.slice(0, i + 1).filter((x) => x.type === 'step').length
                    ).padStart(2, '0')}
                  </span>
                  <RevealLines
                    as="h2"
                    className="workflow-step__title"
                    text={item.step.title}
                  />
                  <ul className="workflow-step__points">
                    {item.step.points.map((point, pi) => (
                      <RevealLines
                        as="li"
                        key={point}
                        text={point}
                        delay={0.18 + pi * 0.14}
                        stagger={0.07}
                      />
                    ))}
                  </ul>
                </div>
                <div className="workflow-step__spacer" />
              </div>
            ) : (
              <div className="workflow-image">
                <img src={item.src} alt="" loading="lazy" />
              </div>
            )}
            <DownArrow />
          </div>
        ))}

        <div className="workflow-end">
          <RevealLines as="h2" className="workflow-end__title" text="Ready to start?" />
          <ContactButton className="hero__cta" label="Contact for a meeting and quote" />
        </div>
      </div>
    </main>
  );
}
