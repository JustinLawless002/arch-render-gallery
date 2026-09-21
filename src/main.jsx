import { BrowserRouter } from 'react-router-dom';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { MotionConfig } from 'motion/react';
import App from './App.jsx';
import './index.css';

// reducedMotion="never" keeps the new Motion-library animations (tile
// reveals, hero transition, clip expand, header hide) playing even when the
// visitor's OS has "reduce motion" switched on — matching how the hero video
// and the workflow-page slide-up are already deliberately set up. If you
// ever want these to honour that setting, change "never" to "user": Motion
// will then drop the movement (keeping simple fades) for those visitors.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <MotionConfig reducedMotion="never">
        <App />
      </MotionConfig>
    </BrowserRouter>
  </React.StrictMode>
);
