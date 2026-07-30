/**
 * Reads every image in src/assets/images/raw, and writes an optimized
 * full-size + thumbnail webp pair into src/assets/images/processed.
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

async function main() {
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
