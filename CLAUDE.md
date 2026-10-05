# praxio.studio — project guide

Start here instead of reading the whole codebase. Only open the files a task
actually touches.

## What it is
Dark, minimal portfolio for **praxio** (Justin Lawless, archviz, Bali). React 18 +
Vite, React Router, `motion` (Framer Motion) for animation. Hosted on **Vercel**
(Hobby plan), auto-deploys from GitHub `JustinLawless002/arch-render-gallery`,
branch `main`. Live at **praxio.studio** (primedesign.design redirects there).

## Workflow (owner's rules)
- Owner tests locally first (`check-locally.bat` → `npm run dev`), then deploys
  with `deploy.bat` (git add/commit/push → Vercel builds). Don't push for him
  unless asked; hand over changed files as a zip that unzips into the repo root.
- He prefers being asked questions to gather content, not being asked to write copy.
- `api/` only runs on Vercel, never under `npm run dev`.

## Homepage order (`src/App.jsx` → `Home`)
Hero video (About + Contact float bottom-right) → **Projects gallery**
(BrandCarousel coverflow → Gallery grid → Motion clips as a subsection) →
**Case study** (OFK) → **Start your project** wizard → About → Services →
Testimonials → **From the studio** drifting image strips (SocialStrips) → Footer.
Routes: `/`, `/project/:slug` (ProjectDetail), `/process/:slug` (WorkflowPage).

## Where things live
| Change | File |
|---|---|
| Header links, mobile hamburger menu, page shell | `src/App.jsx` |
| Colours, fonts (`--accent` is white now, was copper) | `src/index.css` |
| Gallery projects: add images | `src/assets/images/raw/` → `npm run process-images` |
| Project text (location/year/software/description) | `src/data/projectDetails.js` |
| Hide a gallery project | `HIDDEN_TITLES` in `src/data/works.js` |
| Motion clips (videos in `public/videos/`) | `src/data/clips.js` (`hideInMotion: true` hides one) |
| Brand carousel logos / renders / text | logos in `src/assets/images/brands/`; render originals in `brands/render-raw/<slug>-01.jpg…` (auto-shrunk to webp in `brands/render/` by `npm run process-images`); text in `src/data/brand-descriptions.txt` |
| Carousel tiles (small, pre-made) | `brands/tiles/` — rebuilt by `npm run process-images` |
| Case study text + images | `CASE` object at top of `src/components/CaseStudy.jsx`; images in `src/assets/images/case-study/` |
| Wizard choices (project types, budgets…) | `src/data/wizardOptions.js` (shared by page + email function) |
| Workflows (3 process pages) | `src/data/workflows.js` |
| Services cards | `groups` at top of `src/components/Services.jsx` |
| Testimonials | `src/data/testimonials.txt` |
| "From the studio" drifting strips | drop images in `social-feed/` (repo root, git-ignored); a Vite plugin (`scripts/social-tiles.js`) makes 400×500 webp tiles in `src/assets/images/social-tiles/` on dev start/build. Speed etc. at top of `src/components/SocialStrips.jsx` |
| About text | `src/components/About.jsx` |
| Contact email / WhatsApp | `CONTACT_EMAIL` in `src/components/CopyButton.jsx`; WhatsApp in ContactButton, App (mobile menu), SiteFooter, ProcessSection |
| Scroll speed for section links | top of `src/lib/smoothScroll.js` |

## Email (wizard "Send brief")
`api/send-brief.js` (Vercel function) → **Resend** API. Domain praxio.studio is
verified in Resend (DKIM + `send`/`rsend` CNAMEs in Namecheap). Vercel env var
`RESEND_API_KEY` (Production + Preview). Optional: `BRIEF_TO`, `BRIEF_FROM`,
`SEND_CONFIRMATION=false`. Briefs go to justin@praxio.studio (forwards to his
personal inboxes); visitor gets a receipt with only their menu choices. Honeypot
field `website` blocks bots.

## Gotchas
- `import.meta.glob` bundles every image in a globbed folder — hidden gallery
  projects still ship; delete files if size matters.
- `brands/render/` is generated (2048px webp, ~19 MB total); the full-size
  originals (~150 MB) sit in `brands/render-raw/` and are never bundled.
  Settings `RENDER_MAX` / `RENDER_QUALITY` are at the top of `scripts/process-images.js`.
- Case-study boards (site/layout, references, lighting) are composed images
  made from the owner's uploads; to change one, supply new source images.
- Styles live mostly in `<style>` blocks inside each component.
