/**
 * Static server for the natively authored Sprint 26 rebuild.
 *
 * Route contract (see the PRD's Information Architecture section):
 *   /            -> 302 /sprint/26
 *   /sprint/26/  -> 301 /sprint/26
 *   /sprint/26   -> dist/index.html
 *   anything else: static file lookup under dist/ (Vite build output).
 *
 * If dist/ is missing, the server runs `vite build` once, synchronously,
 * before listening. The build is fully offline (no network access needed
 * once node_modules is installed).
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(__dirname, "dist");
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "0.0.0.0";

if (!fs.existsSync(path.join(DIST, "index.html"))) {
  console.log("[server] dist/ missing — running one-time vite build…");
  const viteBin = path.join(__dirname, "node_modules", "vite", "bin", "vite.js");
  const result = spawnSync(process.execPath, [viteBin, "build"], {
    cwd: __dirname,
    stdio: "inherit",
  });
  if (result.status !== 0 || !fs.existsSync(path.join(DIST, "index.html"))) {
    console.error("[server] vite build failed");
    process.exit(1);
  }
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".riv": "application/octet-stream",
  ".glb": "model/gltf-binary",
  ".gltf": "model/gltf+json",
  ".wasm": "application/wasm",
  ".bin": "application/octet-stream",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml",
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, headers);
  res.end(body);
}

function serveFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const type = MIME[ext] || "application/octet-stream";
  const stat = fs.statSync(filePath);
  res.writeHead(200, {
    "Content-Type": type,
    "Content-Length": stat.size,
    "Cache-Control": "no-cache",
  });
  fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer((req, res) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  } catch {
    return send(res, 400, "Bad request");
  }

  // Redirect parity with the live origin (documented in the PRD):
  // root and trailing-slash forms resolve to the canonical /sprint/26.
  if (pathname === "/" || pathname === "/index.html") {
    return send(res, 302, "", { Location: "/sprint/26" });
  }
  if (pathname === "/sprint/26/" || pathname === "/sprint/26/index.html") {
    return send(res, 301, "", { Location: "/sprint/26" });
  }
  if (pathname === "/sprint" || pathname === "/sprint/") {
    return send(res, 301, "", { Location: "/sprint/26" });
  }
  if (pathname === "/sprint/26") {
    return serveFile(res, path.join(DIST, "index.html"));
  }
  if (pathname === "/healthz") {
    return send(res, 200, "ok", { "Content-Type": "text/plain" });
  }

  // Static lookup under dist/ (path-traversal safe).
  const safe = path.normalize(pathname).replace(/^([/\\])+/, "");
  const filePath = path.join(DIST, safe);
  if (!filePath.startsWith(DIST)) return send(res, 403, "Forbidden");
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    return serveFile(res, filePath);
  }
  return send(res, 404, "Not found", { "Content-Type": "text/plain" });
});

server.listen(PORT, HOST, () => {
  console.log(`[server] Sprint 26 rebuild listening on http://${HOST}:${PORT} (route: /sprint/26)`);
});
