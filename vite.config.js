import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import socialTiles from './scripts/social-tiles.js';

export default defineConfig({
  // socialTiles: turns images in social-feed/ into small tiles for the
  // "From the studio" drifting strips (see scripts/social-tiles.js).
  plugins: [react(), socialTiles()],
});
