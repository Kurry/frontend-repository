import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Air-gapped oracle server — serves ONLY local harvest/oracle assets.
 * No live CloudFront / Vimeo / origin proxy. Missing assets → 404.
 */
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "web");
const HARVEST = process.env.HARVEST_ROOT
  ? path.resolve(process.env.HARVEST_ROOT)
  : path.join(__dirname, "..", "harvest");
const HARVEST_CDN = path.join(HARVEST, "d3ql15awrosklt.cloudfront.net");
const HARVEST_VIMEO = path.join(HARVEST, "download-video-ak.vimeocdn.com");
const HARVEST_PLAYER = path.join(HARVEST, "player.vimeo.com");
/** Bundled mirrors under web/ when solution/harvest is absent */
const WEB_CDN = path.join(ROOT, "d3ql15awrosklt.cloudfront.net");
const WEB_VIMEO = path.join(ROOT, "download-video-ak.vimeocdn.com");
const WEB_PLAYER = path.join(ROOT, "player.vimeo.com");
const WEB_VIDEOS = path.join(ROOT, "videos");
const PORT = Number(process.env.PORT || 3000);

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
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".map": "application/json",
  ".ico": "image/x-icon",
  ".txt": "text/plain",
  ".xml": "application/xml",
  ".webmanifest": "application/manifest+json",
  ".mp4": "video/mp4",
  ".pdf": "application/pdf",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

function resolvePage(urlPath) {
  let p = decodeURIComponent(urlPath.split("?")[0]);
  if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
  if (p === "" || p === "/") return path.join(ROOT, "index.html");
  const candidates = [
    path.join(ROOT, p + ".html"),
    path.join(ROOT, p, "index.html"),
    path.join(ROOT, p),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
  }
  return null;
}

function safeJoin(root, reqPath) {
  const cleaned = decodeURIComponent(reqPath.split("?")[0]).replace(/^\/+/, "");
  const full = path.normalize(path.join(root, cleaned));
  if (!full.startsWith(root)) return null;
  return full;
}

function firstExisting(roots, rel) {
  for (const root of roots) {
    const local = safeJoin(root, rel);
    if (local && fs.existsSync(local) && fs.statSync(local).isFile()) {
      return local;
    }
  }
  return null;
}

function sendFile(res, filePath, extra = {}) {
  const ext = path.extname(filePath).toLowerCase();
  const stat = fs.statSync(filePath);
  res.writeHead(200, {
    "Content-Type": MIME[ext] || "application/octet-stream",
    "Content-Length": stat.size,
    "Cache-Control": "public, max-age=120",
    "Access-Control-Allow-Origin": "*",
    "X-Oracle-Stack": "CraftCMS+Vite+TS+GSAP+Swup",
    "X-Oracle-Airgap": "1",
    ...extra,
  });
  fs.createReadStream(filePath).pipe(res);
}

function notFound(res, msg) {
  res.writeHead(404, {
    "Content-Type": "text/plain; charset=utf-8",
    "X-Oracle-Airgap": "1",
  });
  res.end(msg);
}

const server = http.createServer((req, res) => {
  const url = req.url || "/";
  const pathname = decodeURIComponent(url.split("?")[0]);

  // Block analytics / GTM / telemetry paths explicitly
  if (
    /googletagmanager|google-analytics|gtag\/|GTM-|doubleclick|facebook\.net|hotjar|bugherd/i.test(
      pathname,
    )
  ) {
    return notFound(res, "Blocked (air-gap): " + pathname);
  }

  // Local CloudFront mirror (harvest/, else web/)
  if (pathname.startsWith("/cdn/d3ql15awrosklt.cloudfront.net/")) {
    const rel = pathname.replace("/cdn/d3ql15awrosklt.cloudfront.net/", "");
    const local = firstExisting([HARVEST_CDN, WEB_CDN], rel);
    if (local) {
      return sendFile(res, local, { "X-Oracle-Media": "local-cdn" });
    }
    return notFound(res, "CDN mirror miss: " + rel);
  }

  // Local Vimeo download mirror only
  if (pathname.startsWith("/download-video-ak.vimeocdn.com/")) {
    const rel = pathname.replace("/download-video-ak.vimeocdn.com/", "");
    const local = firstExisting([HARVEST_VIMEO, WEB_VIMEO, WEB_VIDEOS], rel);
    // Alias broken/empty vimeocdn path → bundled home hero mp4
    const aliased =
      local ||
      (rel.includes("b5e531a4-7af0-41e1-b78d-ff37cbbd003f")
        ? firstExisting([WEB_VIDEOS], "home-720p.mp4")
        : null);
    if (aliased) {
      return sendFile(res, aliased, {
        "Content-Type": "video/mp4",
        "X-Oracle-Media": "local-vimeo",
      });
    }
    return notFound(res, "Vimeo mirror miss: " + rel);
  }

  // Local player.vimeo.com progressive MP4 mirror
  if (pathname.startsWith("/player.vimeo.com/")) {
    const rel = pathname.replace("/player.vimeo.com/", "");
    const local = firstExisting([HARVEST_PLAYER, WEB_PLAYER], rel);
    const aliased =
      local ||
      (rel.includes("1177303164")
        ? firstExisting([WEB_VIDEOS], "home-720p.mp4")
        : null);
    if (aliased) {
      return sendFile(res, aliased, {
        "Content-Type": "video/mp4",
        "X-Oracle-Media": "local-player-vimeo",
      });
    }
    return notFound(res, "Player.vimeo mirror miss: " + rel);
  }

  if (pathname.startsWith("/medias/")) {
    const rel = pathname.replace(/^\//, "");
    const local = firstExisting([HARVEST_CDN, WEB_CDN], rel);
    if (local) return sendFile(res, local);
    return notFound(res, "medias miss: " + rel);
  }

  const asFile = safeJoin(ROOT, pathname);
  if (asFile && fs.existsSync(asFile) && fs.statSync(asFile).isFile()) {
    return sendFile(res, asFile);
  }

  const page = resolvePage(pathname);
  if (page) return sendFile(res, page);

  return notFound(res, "Not found: " + url);
});

server.listen(PORT, () => {
  console.log(`Wolverine Worldwide oracle (AIR-GAP) → http://localhost:${PORT}`);
  console.log(`Webroot: ${ROOT}`);
  console.log(`CDN mirrors: ${HARVEST_CDN} | ${WEB_CDN}`);
  console.log(`Vimeo mirrors: ${HARVEST_VIMEO} | ${WEB_VIMEO}`);
  console.log(`Player.vimeo mirrors: ${HARVEST_PLAYER} | ${WEB_PLAYER}`);
  console.log("No live CDN/origin proxy — offline assets only");
});
