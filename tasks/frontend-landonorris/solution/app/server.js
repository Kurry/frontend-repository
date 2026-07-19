'use strict';
// Dependency-free static server for the Lando Norris homepage oracle.
// Serves the app fully offline on port 3000. All asset URLs are same-origin.
// Canonical top-level asset prefixes (/fonts, /vendor, /assets.itsoffbrand.io,
// /cdn.prod.website-files.com, /videos, /rive, /gl, /images, /d3e54v103j8qbb...)
// are aliased into the ./assets subdirectory so the page can reference the
// exact local paths the PRD's asset-path table mandates.
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.wasm': 'application/wasm',
  '.riv': 'application/octet-stream',
  '.glb': 'model/gltf-binary',
  '.hdr': 'application/octet-stream',
  '.ktx2': 'image/ktx2',
  '.txt': 'text/plain; charset=utf-8',
};

function contentType(p) {
  return MIME[path.extname(p).toLowerCase()] || 'application/octet-stream';
}

function safeJoin(base, target) {
  const resolved = path.normalize(path.join(base, target));
  if (!resolved.startsWith(base)) return null;
  return resolved;
}

function tryFiles(urlPath) {
  const clean = decodeURIComponent(urlPath.split('?')[0].split('#')[0]);
  const candidates = [];
  const direct = safeJoin(ROOT, clean);
  if (direct) candidates.push(direct);
  // Alias canonical top-level asset paths into ./assets
  const aliased = safeJoin(ROOT, path.join('assets', clean));
  if (aliased) candidates.push(aliased);
  for (const c of candidates) {
    try {
      const st = fs.statSync(c);
      if (st.isDirectory()) {
        const idx = path.join(c, 'index.html');
        if (fs.existsSync(idx)) return idx;
        continue;
      }
      return c;
    } catch (_) { /* keep trying */ }
  }
  return null;
}

const server = http.createServer((req, res) => {
  let urlPath = req.url === '/' ? '/index.html' : req.url;
  const file = tryFiles(urlPath);
  if (!file) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 Not Found');
    return;
  }
  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('500 Internal Server Error');
      return;
    }
    res.writeHead(200, {
      'Content-Type': contentType(file),
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*',
    });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`Lando Norris oracle serving on http://localhost:${PORT}`);
});
