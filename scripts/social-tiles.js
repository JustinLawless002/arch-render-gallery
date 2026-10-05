/**
 * "From the studio" drifting strips — image pipeline.
 *
 * Drop any images (jpg / png / webp) into the `social-feed/` folder in the
 * repo root. Every time the dev server starts or Vercel builds, each one is
 * cropped to a small 4:5 webp tile (TILE_W x TILE_H) in
 * src/assets/images/social-tiles/, plus a manifest.json holding each tile's
 * average colour (shown as a placeholder while the tile loads), and a
 * larger uncropped copy in social-tiles/large/ for when a tile is clicked.
 *
 * - Unchanged images are skipped, so restarts are quick.
 * - Delete an image from social-feed/ and its tile is removed too.
 * - While `npm run dev` is running, adding/removing images updates the page
 *   automatically (it reloads).
 * - social-feed/ is git-ignored (originals can be large); only the small
 *   tiles are committed. If the folder doesn't exist (e.g. on Vercel), this
 *   does nothing and the committed tiles are used as they are.
 *
 * Wired in as a Vite plugin from vite.config.js — no separate command.
 */
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
export const FEED_DIR = path.join(ROOT, 'social-feed');
const TILE_DIR = path.join(ROOT, 'src', 'assets', 'images', 'social-tiles');
const LARGE_DIR = path.join(TILE_DIR, 'large');
const MANIFEST = path.join(TILE_DIR, 'manifest.json');

// Tile size (px) and webp quality. Tiles show at ~150–230px wide, so 400px
// covers high-DPI screens; each comes out around 25–45 KB.
const TILE_W = 400;
const TILE_H = 500;
const QUALITY = 74;
// Larger, uncropped copy shown when a visitor clicks an image (downloaded
// only on click). Longest side in px, and webp quality.
const LARGE_MAX = 1400;
const LARGE_QUALITY = 80;

const SUPPORTED = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const isImage = (f) => SUPPORTED.has(path.extname(f).toLowerCase());
const slugify = (name) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'image';

function readManifest() {
  try {
    return JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
  } catch {
    return {};
  }
}

let running = null;

export function syncSocialTiles() {
  // Coalesce overlapping calls (e.g. several files dropped at once).
  if (!running) running = doSync().finally(() => { running = null; });
  return running;
}

async function doSync() {
  if (!fs.existsSync(FEED_DIR)) return false;
  fs.mkdirSync(TILE_DIR, { recursive: true });
  fs.mkdirSync(LARGE_DIR, { recursive: true });

  const old = readManifest();
  const next = {};
  const seen = new Set();
  let made = 0;

  const sources = fs.readdirSync(FEED_DIR).filter(isImage).sort();
  for (const f of sources) {
    let slug = slugify(path.basename(f, path.extname(f)));
    while (seen.has(slug)) slug += '-2'; // photo.jpg + photo.png
    seen.add(slug);

    const src = path.join(FEED_DIR, f);
    const tileName = `${slug}.webp`;
    const out = path.join(TILE_DIR, tileName);
    const outLarge = path.join(LARGE_DIR, tileName);
    const fresh =
      fs.existsSync(out) &&
      fs.existsSync(outLarge) &&
      old[tileName]?.ar &&
      fs.statSync(out).mtimeMs >= fs.statSync(src).mtimeMs;

    if (fresh) {
      next[tileName] = old[tileName];
      continue;
    }
    try {
      const img = sharp(src).rotate();
      await img
        .clone()
        .resize(TILE_W, TILE_H, { fit: 'cover', position: 'centre' })
        .webp({ quality: QUALITY })
        .toFile(out);
      const large = await img
        .clone()
        .resize({ width: LARGE_MAX, height: LARGE_MAX, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: LARGE_QUALITY })
        .toFile(outLarge);
      // Average colour, slightly darkened, for the loading placeholder.
      const { data } = await img.clone().resize(1, 1, { fit: 'cover' }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
      const hex = [...data.slice(0, 3)]
        .map((v) => Math.round(v * 0.8).toString(16).padStart(2, '0'))
        .join('');
      next[tileName] = { color: `#${hex}`, ar: +(large.width / large.height).toFixed(4) };
      made += 1;
    } catch (err) {
      console.warn(`[social-tiles] skipped ${f}: ${err.message}`);
    }
  }

  // Remove tiles whose original was deleted.
  let removed = 0;
  for (const dir of [TILE_DIR, LARGE_DIR]) {
    for (const f of fs.readdirSync(dir)) {
      if (f.endsWith('.webp') && !next[f]) {
        fs.unlinkSync(path.join(dir, f));
        if (dir === TILE_DIR) removed += 1;
      }
    }
  }

  const changed = made > 0 || removed > 0 || JSON.stringify(old) !== JSON.stringify(next);
  if (changed) {
    fs.writeFileSync(MANIFEST, JSON.stringify(next, null, 2) + '\n');
    console.log(`[social-tiles] ${Object.keys(next).length} tile(s) — ${made} new/updated, ${removed} removed`);
  }
  return changed;
}

/** Vite plugin: builds tiles on start/build and watches social-feed/ in dev. */
export default function socialTiles() {
  return {
    name: 'praxio-social-tiles',
    async buildStart() {
      await syncSocialTiles();
    },
    configureServer(server) {
      if (!fs.existsSync(FEED_DIR)) return;
      server.watcher.add(FEED_DIR);
      let timer;
      const onChange = (file) => {
        // Vite reports Windows paths with forward slashes; normalise first.
        if (!path.resolve(file).toLowerCase().startsWith(FEED_DIR.toLowerCase())) return;
        clearTimeout(timer);
        timer = setTimeout(async () => {
          if (await syncSocialTiles()) server.ws.send({ type: 'full-reload' });
        }, 400);
      };
      server.watcher.on('add', onChange);
      server.watcher.on('change', onChange);
      server.watcher.on('unlink', onChange);
    },
  };
}
