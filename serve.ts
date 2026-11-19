// Tiny static server for trying the guide locally: serves app/ at the root
// on http://localhost:8080. Run with `node serve.ts`.
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), 'app');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };

createServer((req, res) => {
  const raw = req.url.split('?')[0];
  const path = raw === '/' ? '/index.html' : raw;
  const file = join(root, path);
  if (!existsSync(file)) { res.writeHead(404); res.end('not found'); return; }
  res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' });
  res.end(readFileSync(file));
}).listen(8080, () => console.log('Serving the guide at http://localhost:8080'));
