import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "web");
const PORT = Number(process.env.PORT || 3000);
const MIME = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8", ".json": "application/json",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp",
  ".ico": "image/x-icon", ".webmanifest": "application/manifest+json",
  ".woff2": "font/woff2", ".webm": "video/webm", ".pdf": "application/pdf"
};

function resolveFile(requestUrl) {
  const pathname = decodeURIComponent((requestUrl || "/").split("?")[0]);
  if (pathname !== "/" && pathname.endsWith("/")) return null;
  const relative = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const target = path.normalize(path.join(ROOT, relative));
  if (!target.startsWith(`${ROOT}${path.sep}`) || !fs.existsSync(target) || !fs.statSync(target).isFile()) return null;
  return target;
}

const server = http.createServer((req, res) => {
  const file = resolveFile(req.url);
  if (!file) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8", "X-Oracle-App": "Northstar-Collective" });
    res.end("Not found");
    return;
  }
  const stat = fs.statSync(file);
  res.writeHead(200, {
    "Content-Type": MIME[path.extname(file).toLowerCase()] || "application/octet-stream",
    "Content-Length": stat.size,
    "Cache-Control": "public, max-age=120",
    "X-Content-Type-Options": "nosniff",
    "X-Oracle-App": "Northstar-Collective"
  });
  if (req.method === "HEAD") res.end();
  else fs.createReadStream(file).pipe(res);
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Northstar Collective oracle → http://localhost:${PORT}`);
});
