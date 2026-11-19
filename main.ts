// Leonida Legend: an offline GTA 6 trophy guide and tracker for make.fun.
//
// The guide itself is plain static files in app/ (index.html, app.js,
// style.css and app/data/trophies.json with all 55 official PS5 trophies,
// each with a guide written for this entry and its sources). It runs with
// the network off and saves checklist progress in the browser. This
// program is the entrypoint that hands the guide in: it checks the guide
// first, then copies app/ and screenshots/ from beside this file to
// /output and writes /output/dossier.json with the vendored make.fun
// library, so the judge reads the screenshots and the source outline.
//
// Leave vendor/makefun-frontend.ts untouched: the scorer rebuilds the
// dossier with its own copy and compares the two byte for byte.
//
// Serve the guide locally with `node serve.ts`, then open
// http://localhost:8080. Outside the grader's container,
// MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const MAX_SHOT_BYTES = 262144;

// The guide is only worth handing in when its data is whole, so refuse
// to build a dossier from a half-written app/ instead of failing quietly
// in the grader. The scorer's own gate re-checks all of this, but a
// local failure here names the file at fault while it is still fixable.
function checkGuide() {
  const dataPath = join(here, 'app', 'data', 'trophies.json');
  if (!existsSync(dataPath)) throw new Error(`missing ${dataPath}`);
  const doc = JSON.parse(readFileSync(dataPath, 'utf8'));
  const trophies = Array.isArray(doc) ? doc : doc.trophies;
  if (!Array.isArray(trophies) || trophies.length !== 55) {
    throw new Error(`expected 55 trophies in ${dataPath}, found ${Array.isArray(trophies) ? trophies.length : 'none'}`);
  }
  const withoutGuide = trophies.filter((t) => typeof t.guide !== 'string' || !t.guide.trim());
  if (withoutGuide.length) throw new Error(`${withoutGuide.length} trophies have no guide: ${withoutGuide.map((t) => t.name).join(', ')}`);
  const grades = new Set(trophies.map((t) => t.grade));
  for (const grade of ['platinum', 'gold', 'silver', 'bronze']) {
    if (!grades.has(grade)) throw new Error(`no ${grade} trophy in ${dataPath}`);
  }
  if (!existsSync(join(here, 'app', 'index.html'))) throw new Error('missing app/index.html');
  const shotsDir = join(here, 'screenshots');
  if (!existsSync(shotsDir)) throw new Error('missing screenshots/');
  const shots = readdirSync(shotsDir).filter((f) => !f.startsWith('.'));
  if (shots.length < 3 || shots.length > 4) throw new Error(`expected 3 or 4 screenshots, found ${shots.length}`);
  for (const shot of shots) {
    const size = statSync(join(shotsDir, shot)).size;
    if (size > MAX_SHOT_BYTES) throw new Error(`screenshot ${shot} is ${size} bytes, over the 256 KiB cap`);
    // A screenshot must be a whole JPEG or PNG, not a renamed text file:
    // JPEG starts FF D8 FF, PNG starts 89 50 4E 47.
    const head = readFileSync(join(shotsDir, shot)).subarray(0, 4);
    const isJpeg = head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
    const isPng = head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47;
    if (!isJpeg && !isPng) throw new Error(`screenshot ${shot} is not a JPEG or PNG file`);
  }
  return { trophies: trophies.length, shots: shots.length };
}

const checked = checkGuide();

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes
// the bytes; the others refuse an entry the scorer would refuse (more
// than 4 screenshots or one over 256 KiB; more than 993 files and
// directories in app/ or 48 MiB of app files: app/ counts beside
// /output's own 1000-entry cap, its screenshots/ and dossier.json).
const dossier = buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 });
writeFileSync(join(out, 'dossier.json'), dossier);

// A run that writes nothing is a silent failure, so confirm the dossier
// landed and fits the scorer's 1.5 MiB cap before the program exits.
const dossierPath = join(out, 'dossier.json');
if (!existsSync(dossierPath)) throw new Error(`dossier.json was not written to ${dossierPath}`);
if (statSync(dossierPath).size > 1572864) throw new Error(`dossier.json is over the 1.5 MiB cap`);
console.log(`Leonida Legend: ${checked.trophies} trophies, ${checked.shots} screenshots, dossier written (${dossier.length} bytes) to ${dossierPath}`);
