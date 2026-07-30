# Studio Archive — Architectural Render Gallery

A dark-mode, full-bleed gallery for architectural renders. React + Vite, deployed on Vercel.

## Local setup

```bash
npm install
npm run dev
```

The site runs at **http://localhost:5173**. Vite hot-reloads as you edit files.

## Adding new renders

1. Drop image files (`.jpg`, `.jpeg`, `.png`, or `.webp`) into `src/assets/images/raw/`.
   Name them descriptively — the filename becomes the title shown in the gallery
   (e.g. `riverside-tower-01.jpg` → "Riverside Tower 01").
2. Run:
   ```bash
   npm run process-images
   ```
   This resizes and optimizes each new image into a thumbnail + full-size `.webp`
   pair inside `src/assets/images/processed/`.
3. Refresh `localhost:5173` — new images appear in the gallery automatically. No
   manual registration needed; the gallery reads whatever is in `processed/`.

## Contact button

The mailto address lives in one place: `src/components/ContactButton.jsx`.
Change the `EMAIL` constant at the top of that file to your real address.

## Pushing to GitHub

If this project was handed to you as a folder (not already a git repo):

```bash
cd arch-render-gallery
git init
git remote add origin <your-repo-url>
git add -A
git commit -m "Initial scaffold"
git branch -M main
git push -u origin main
```

If you already cloned an empty repo and copied these files into it, skip
straight to:

```bash
git add -A
git commit -m "Initial scaffold"
git push origin main
```

## Deploying on Vercel

1. In the Vercel dashboard: **Add New → Project**, then import this GitHub repo.
2. Framework preset should auto-detect as **Vite** — leave build settings as
   default (`npm run build`, output directory `dist`).
3. Click **Deploy**. Vercel needs at least one commit on `main` to build, so
   push your code before deploying.
4. Every subsequent push to `main` triggers an automatic rebuild + redeploy to
   the same production URL.

## Project structure

```
src/
  assets/images/raw/         ← drop new source images here
  assets/images/processed/   ← optimized output (auto-generated, do not edit by hand)
  components/
    Gallery.jsx               masonry grid + lightbox
    Lightbox.jsx               full-bleed image viewer
    ContactButton.jsx         mailto contact button
  App.jsx
  index.css                  design tokens + all styling
scripts/
  process-images.js          sharp-based resize/optimize pipeline
```
