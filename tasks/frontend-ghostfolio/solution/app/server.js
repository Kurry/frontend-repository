// Zero-dependency static file server for the Ghostfolio oracle.
// Serves the self-contained app on port 3000 (override with PORT for side-port self-tests).
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, normalize } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT) || 3000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = createServer(async (req, res) => {
  try {
    let urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    if (urlPath === '/') urlPath = '/index.html';
    // Prevent path traversal.
    const safePath = normalize(join(__dirname, urlPath));
    if (!safePath.startsWith(__dirname)) {
      res.writeHead(403).end('Forbidden');
      return;
    }
    const ext = safePath.slice(safePath.lastIndexOf('.'));
    const body = await readFile(safePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(body);
  } catch (err) {
    if (err && err.code === 'ENOENT') {
      res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found');
    } else {
      res.writeHead(500, { 'Content-Type': 'text/plain' }).end('Server error');
    }
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Ghostfolio oracle serving on http://0.0.0.0:${port}`);
});
