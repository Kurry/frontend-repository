// Minimal dependency-free static file server for the Riviera Trip Planner oracle.
// Serves the app on 0.0.0.0:3000 using only Node built-ins. No external requests,
// no proxies, no iframes — the product is served from this origin only.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join, normalize, sep, extname } from "node:path";

const ROOT = fileURLToPath(new URL(".", import.meta.url));
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || "0.0.0.0";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".map": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

function safePath(urlPath) {
  let p = decodeURIComponent(urlPath.split("?")[0].split("#")[0]);
  if (p === "/" || p === "") p = "index.html";
  // Strip a leading slash so path.join does not discard ROOT (join(root, "/x") => "/x").
  p = p.replace(/^\/+/, "");
  const resolved = normalize(join(ROOT, p));
  const rootWithSep = ROOT.endsWith(sep) ? ROOT : ROOT + sep;
  if (resolved !== ROOT && !resolved.startsWith(rootWithSep)) return null;
  return resolved;
}

const server = createServer(async (req, res) => {
  try {
    const target = safePath(req.url || "/");
    if (!target) {
      res.writeHead(403, { "content-type": "text/plain" });
      res.end("Forbidden");
      return;
    }
    let filePath = target;
    let info = await stat(filePath).catch(() => null);
    if (info && info.isDirectory()) {
      filePath = join(filePath, "index.html");
      info = await stat(filePath).catch(() => null);
    }
    if (!info || !info.isFile()) {
      // SPA fallback: unknown non-asset routes render the workspace (deep-link parity).
      if (!extname(filePath)) {
        filePath = join(ROOT, "index.html");
        info = await stat(filePath).catch(() => null);
      }
    }
    if (!info || !info.isFile()) {
      res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }
    const type = MIME[extname(filePath).toLowerCase()] || "application/octet-stream";
    const body = await readFile(filePath);
    res.writeHead(200, {
      "content-type": type,
      "cache-control": "no-cache",
      "x-content-type-options": "nosniff",
    });
    res.end(body);
  } catch (err) {
    res.writeHead(500, { "content-type": "text/plain" });
    res.end("Server error");
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Riviera Trip Planner serving on http://${HOST}:${PORT}`);
});
