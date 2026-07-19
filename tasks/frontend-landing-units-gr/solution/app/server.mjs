// Dependency-free static file server for the built oracle site.
// Serves ./prebuilt on 0.0.0.0:$PORT (default 3000), fully offline.
import { createServer } from "node:http";
import { stat, readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("./prebuilt", import.meta.url));
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "0.0.0.0";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
};

async function resolveFile(urlPath) {
  let pathname = decodeURIComponent(urlPath.split("?")[0]);
  pathname = normalize(pathname).replace(/^(\.\.[/\\])+/, "");
  let filePath = join(ROOT, pathname);
  if (!filePath.startsWith(ROOT)) return null;
  try {
    const s = await stat(filePath);
    if (s.isDirectory()) {
      filePath = join(filePath, "index.html");
      await stat(filePath);
    }
    return filePath;
  } catch {
    // Try "/foo" -> "/foo/index.html"
    try {
      const alt = join(ROOT, pathname, "index.html");
      await stat(alt);
      return alt;
    } catch {
      return null;
    }
  }
}

const server = createServer(async (req, res) => {
  try {
    const filePath = await resolveFile(req.url || "/");
    if (!filePath) {
      res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
      res.end("<!doctype html><title>404</title><h1>404 Not Found</h1>");
      return;
    }
    const body = await readFile(filePath);
    const type = MIME[extname(filePath).toLowerCase()] || "application/octet-stream";
    res.writeHead(200, {
      "Content-Type": type,
      "Content-Length": body.length,
      "Cache-Control": "no-cache",
    });
    res.end(body);
  } catch (err) {
    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Internal server error");
  }
});

server.listen(PORT, HOST, () => {
  console.log(`units-gr oracle serving ./prebuilt at http://${HOST}:${PORT}`);
});
