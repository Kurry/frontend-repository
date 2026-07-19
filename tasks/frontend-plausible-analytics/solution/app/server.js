// Minimal zero-dependency static file server for the Plausible Analytics oracle.
// Serves on port 3000 (override with PORT). No external packages required.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
};

const server = createServer(async (req, res) => {
  try {
    let urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    if (urlPath === '/') urlPath = '/index.html';
    const safe = normalize(urlPath).replace(/^(\.\.[/\\])+/, '');
    const filePath = join(__dirname, safe);
    if (!filePath.startsWith(__dirname)) {
      res.writeHead(403).end('Forbidden');
      return;
    }
    const body = await readFile(filePath);
    const type = TYPES[extname(filePath)] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' });
    res.end(body);
  } catch (err) {
    res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found');
  }
});

server.listen(PORT, () => {
  console.log(`Plausible Analytics oracle running at http://localhost:${PORT}`);
});
