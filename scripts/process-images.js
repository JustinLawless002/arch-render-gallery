/**
 * Reads every image in src/assets/images/raw, and writes an optimized
 * full-size + thumbnail webp pair into src/assets/images/processed.
 *
 * Brand renders: full-size originals live in src/assets/images/brands/render-raw/
 * (NOT bundled into the site). Each one is saved as a web-sized webp in
 * brands/render/, which is what the carousel lightbox shows. Any original
 * dropped straight into brands/render/ out of habit is moved into
 * render-raw/ automatically first. Unchanged images are skipped, so re-runs
 * are quick. To remove a render, delete it from BOTH folders.
 *
 * Also builds the brand carousel tiles: for each logo in
 * src/assets/images/brands/, its first render (brands/render/<slug>-01.*)
 * cropped square with the logo blended on top, saved small as
 * brands/tiles/<slug>.webp. The carousel uses these so visitors don't
 * download every full-size render just to see the tiles. Re-run this
 * after adding a brand or changing its first render.
 *
 * Usage: npm run process-images
 */
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAW_DIR = path.join(__dirname, '..', 'src', 'assets', 'images', 'raw');
const OUT_DIR = path.join(__dirname, '..', 'src', 'assets', 'images', 'processed');

const BRANDS_DIR = path.join(__dirname, '..', 'src', 'assets', 'images', 'brands');
const BRAND_RENDER_DIR = path.join(BRANDS_DIR, 'render');
const BRAND_TILE_DIR = path.join(BRANDS_DIR, 'tiles');
const BRAND_RENDER_RAW_DIR = path.join(BRANDS_DIR, 'render-raw');
// Web size for the lightbox: longest side in px, and webp quality.
const RENDER_MAX = 2048;
const RENDER_QUALITY = 82;
const TILE_SIZE = 900;

const SUPPORTED = new Set(['.jpg', '.jpeg', '.png', '.webp']);

const SIZES = {
  full: { width: 1920, quality: 82 },
  thumb: { width: 640, quality: 78 },
};

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

const baseName = (f) => path.basename(f, path.extname(f));
const isImage = (f) => SUPPORTED.has(path.extname(f).toLowerCase());

async function optimizeBrandRenders() {
  if (!fs.existsSync(BRANDS_DIR)) return;
  fs.mkdirSync(BRAND_RENDER_DIR, { recursive: true });
  fs.mkdirSync(BRAND_RENDER_RAW_DIR, { recursive: true });

  // 1. Anything in render/ that isn't a generated copy of an original is an
  //    original itself — move it into render-raw/.
  const rawNames = () => new Set(fs.readdirSync(BRAND_RENDER_RAW_DIR).filter(isImage).map(baseName));
  let raws = rawNames();
  for (const f of fs.readdirSync(BRAND_RENDER_DIR).filter(isImage)) {
    const isGenerated = path.extname(f).toLowerCase() === '.webp' && raws.has(baseName(f));
    if (isGenerated) continue;
    const from = path.join(BRAND_RENDER_DIR, f);
    if (raws.has(baseName(f))) {
      fs.unlinkSync(from); // same image already kept as an original
    } else {
      fs.renameSync(from, path.join(BRAND_RENDER_RAW_DIR, f));
      console.log(`→ moved original brands/render/${f} to brands/render-raw/`);
    }
  }
  raws = rawNames();

  // 2. Make (or refresh) the web-sized webp for each original.
  let made = 0;
  let before = 0;
  let after = 0;
  for (const f of fs.readdirSync(BRAND_RENDER_RAW_DIR).filter(isImage)) {
    const src = path.join(BRAND_RENDER_RAW_DIR, f);
    const out = path.join(BRAND_RENDER_DIR, `${baseName(f)}.webp`);
    if (fs.existsSync(out) && fs.statSync(out).mtimeMs >= fs.statSync(src).mtimeMs) continue;
    await sharp(src)
      .rotate() // respect camera orientation
      .resize({ width: RENDER_MAX, height: RENDER_MAX, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: RENDER_QUALITY })
      .toFile(out);
    before += fs.statSync(src).size;
    after += fs.statSync(out).size;
    made += 1;
    console.log(`✓ brands/render/${baseName(f)}.webp`);
  }
  if (made) {
    const mb = (n) => (n / 1024 / 1024).toFixed(1);
    console.log(`  ${made} render(s): ${mb(before)} MB of originals → ${mb(after)} MB on the site`);
  }
}

async function makeBrandTiles() {
  if (!fs.existsSync(BRANDS_DIR)) return;
  fs.mkdirSync(BRAND_TILE_DIR, { recursive: true });
  const renders = fs.existsSync(BRAND_RENDER_DIR) ? fs.readdirSync(BRAND_RENDER_DIR) : [];
  const logos = fs.readdirSync(BRANDS_DIR).filter((f) => SUPPORTED.has(path.extname(f).toLowerCase()));

  for (const logoFile of logos) {
    const slug = path.basename(logoFile, path.extname(logoFile));
    const logo = await sharp(path.join(BRANDS_DIR, logoFile))
      .resize(TILE_SIZE, TILE_SIZE, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
    const first = renders
      .filter((f) => SUPPORTED.has(path.extname(f).toLowerCase()))
      .map((f) => ({ f, m: path.basename(f, path.extname(f)).match(/^(.*)-(\d+)$/) }))
      .filter((r) => r.m && r.m[1] === slug)
      .sort((a, b) => Number(a.m[2]) - Number(b.m[2]))[0];

    const outPath = path.join(BRAND_TILE_DIR, `${slug}.webp`);
    const base = first
      ? sharp(path.join(BRAND_RENDER_DIR, first.f)).resize(TILE_SIZE, TILE_SIZE, { fit: 'cover' })
      : sharp({ create: { width: TILE_SIZE, height: TILE_SIZE, channels: 3, background: '#16181a' } });
    // "screen" blend = the logo's light linework brightens the render, black adds nothing
    await base
      .composite([{ input: logo, blend: first ? 'screen' : 'over' }])
      .webp({ quality: 84 })
      .toFile(outPath);
    console.log(`✓ brands/tiles/${slug}.webp`);
  }
}

async function main() {
  await optimizeBrandRenders();
  await makeBrandTiles();

  if (!fs.existsSync(RAW_DIR)) {
    console.error(`Raw folder not found: ${RAW_DIR}`);
    process.exit(1);
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const files = fs
    .readdirSync(RAW_DIR)
    .filter((f) => SUPPORTED.has(path.extname(f).toLowerCase()));

  if (files.length === 0) {
    console.log('No new images found in src/assets/images/raw — drop some files in and rerun.');
    return;
  }

  for (const file of files) {
    const ext = path.extname(file);
    const base = slugify(path.basename(file, ext));
    const srcPath = path.join(RAW_DIR, file);

    for (const [variant, opts] of Object.entries(SIZES)) {
      const outPath = path.join(OUT_DIR, `${base}-${variant}.webp`);
      await sharp(srcPath)
        .resize({ width: opts.width, withoutEnlargement: true })
        .webp({ quality: opts.quality })
        .toFile(outPath);
      console.log(`✓ ${path.basename(outPath)}`);
    }
  }

  console.log(`\nProcessed ${files.length} image(s). Run "npm run dev" and refresh to see them in the gallery.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
