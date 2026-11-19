// Tiny static server for trying the guide locally: serves app/ at the
// root on http://localhost:8080. Run with `node serve.ts` (or
// `PORT=9000 node serve.ts` for another port). It serves only files under
// app/, so a request can never escape the guide's own directory.
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(join(fileURLToPath(new URL('.', import.meta.url)), 'app'));
const port = Number(process.env.PORT ?? 8080);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png' };

createServer((req, res) => {
  const raw = decodeURIComponent(req.url.split('?')[0]);
  const path = raw === '/' ? '/index.html' : raw;
  const file = resolve(join(root, path));
  if (!file.startsWith(root + sep) || !existsSync(file) || !statSync(file).isFile()) {
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('not found');
    return;
  }
  res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream', 'cache-control': 'no-store' });
  if (req.method === 'HEAD') { res.end(); return; }
  res.end(readFileSync(file));
}).listen(port, () => console.log(`Serving the guide at http://localhost:${port}`));
