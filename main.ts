// Leonida Legend: an offline GTA 6 trophy guide and tracker for make.fun.
// The guide is plain static files in app/ (index.html, app.js, style.css and
// app/data/trophies.json with all 55 official PS5 trophies, each with a guide
// written for this entry and its sources). It runs with the network off and
// saves checklist progress in the browser. This program hands it in: it
// copies app/ and screenshots/ from beside this file to /output and writes
// /output/dossier.json with the vendored make.fun library, so the judge
// reads the screenshots and the source outline. Leave
// vendor/makefun-frontend.ts untouched: the scorer rebuilds the dossier
// with its own copy and compares the two byte for byte.
//
// Serve the guide locally with `node serve.ts`, then open
// http://localhost:8080. Outside the grader's container,
// MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files and directories in app/ or
// 48 MiB of app files: app/ counts beside /output's own 1000-entry cap, its screenshots/ and dossier.json).
const dossier = buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 });
writeFileSync(join(out, 'dossier.json'), dossier);

// A run that writes nothing is a silent failure, so confirm the dossier
// landed before the program exits.
const dossierPath = join(out, 'dossier.json');
if (!existsSync(dossierPath)) throw new Error(`dossier.json was not written to ${dossierPath}`);
console.log(`Leonida Legend: dossier written (${dossier.length} bytes) to ${dossierPath}`);
