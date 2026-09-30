# praxio — architectural visualisation portfolio

Live at **praxio.studio**. React + Vite, hosted on Vercel.

## Everyday use
- **Check locally:** run `check-locally.bat` (pulls, installs, starts the site at http://localhost:5173).
- **Go live:** run `deploy.bat` (commits and pushes; Vercel publishes in a minute or two).

## Adding content
- **New gallery project:** put the image in `src/assets/images/raw/`, run `npm run process-images`, then add its text in `src/data/projectDetails.js`.
- **New brand in the carousel:** logo in `src/assets/images/brands/`, full-size renders in `brands/render-raw/` named `<brand>-01.jpg`, `-02.jpg`…, text in `src/data/brand-descriptions.txt`, then run `npm run process-images`.
- **Motion clip:** video in `public/videos/`, entry in `src/data/clips.js`.
- **Testimonials:** `src/data/testimonials.txt`.

See `CLAUDE.md` for the full map of where everything lives.
