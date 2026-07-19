import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const root = path.resolve(__dirname)

const MIME = {
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.html': 'text/html; charset=utf-8',
}

const apiCacheDir = path.join(root, 'public/api-cache')
const lambdaCacheDir = path.join(root, 'public/lambda-cache')

function cacheKey(urlPath) {
  return Buffer.from(urlPath).toString('base64url')
}

/**
 * Offline media middleware (native code, no upstream requests):
 * - serves exact pre-recorded bytes for query-string image-CDN URLs from
 *   `public/lambda-cache`, falling back to an in-process sharp crop/resize of
 *   the mirrored source file so `?w=&h=&e=webp&cX…` variants keep working;
 * - answers `/api/*` from the recorded `public/api-cache` responses;
 * - no-ops the view counter and telemetry endpoints with 204s.
 */
function offlineMediaMiddleware(req, res, next) {
  const rawUrl = req.url || ''
  const raw = rawUrl.split('?')[0]
  const qs = rawUrl.includes('?') ? new URL(rawUrl, 'http://local').searchParams : null

  const isImageCdn =
    raw.startsWith('/offline-cdn/i-p.rmcdn.net/') || raw.startsWith('/offline-cdn/i-t.rmcdn.net/')

  // Exact recorded response for path + query when available.
  if (qs && isImageCdn) {
    const key = cacheKey(rawUrl)
    const cached = path.join(lambdaCacheDir, key + '.bin')
    const metaP = path.join(lambdaCacheDir, key + '.meta.json')
    if (fs.existsSync(cached)) {
      let type = 'application/octet-stream'
      try {
        if (fs.existsSync(metaP)) type = JSON.parse(fs.readFileSync(metaP, 'utf8')).contentType || type
      } catch {}
      res.setHeader('Content-Type', type)
      res.setHeader('Cache-Control', 'public, max-age=3600')
      res.end(fs.readFileSync(cached))
      return
    }
  }

  // On-the-fly crop/resize of the mirrored source for uncached variants.
  if (qs && isImageCdn && /\.(png|jpe?g|webp)$/i.test(raw)) {
    const file = path.join(root, 'public', raw)
    if (fs.existsSync(file) && fs.statSync(file).isFile()) {
      const w = Number(qs.get('w') || 0)
      const h = Number(qs.get('h') || 0)
      const e = (qs.get('e') || '').toLowerCase()
      const cX = Number(qs.get('cX') || 0)
      const cY = Number(qs.get('cY') || 0)
      const cW = Number(qs.get('cW') || 0)
      const cH = Number(qs.get('cH') || 0)
      const run = async () => {
        const meta = await sharp(file).metadata()
        const srcW = meta.width || 0
        const srcH = meta.height || 0
        const cropFits =
          cW > 0 &&
          cH > 0 &&
          srcW >= Math.round(cX) + Math.round(cW) - 1 &&
          srcH >= Math.round(cY) + Math.round(cH) - 1
        const needsResizeW = w > 0 && srcW > w + 1
        const needsResizeH = h > 0 && srcH > h + 1
        if (!cropFits && !needsResizeW && !needsResizeH) {
          const buf = fs.readFileSync(file)
          const type = MIME['.' + (meta.format === 'jpeg' ? 'jpg' : meta.format)] || 'application/octet-stream'
          res.setHeader('Content-Type', type)
          res.setHeader('Cache-Control', 'public, max-age=3600')
          res.end(buf)
          return
        }
        let img = sharp(file)
        if (cropFits) {
          const left = Math.max(0, Math.round(cX))
          const top = Math.max(0, Math.round(cY))
          const width = Math.min(Math.round(cW), srcW - left)
          const height = Math.min(Math.round(cH), srcH - top)
          if (width > 0 && height > 0) img = img.extract({ left, top, width, height })
        }
        if (needsResizeW) img = img.resize({ width: Math.round(w), withoutEnlargement: true })
        else if (needsResizeH) img = img.resize({ height: Math.round(h), withoutEnlargement: true })
        let out
        let type
        if (e === 'webp' || meta.format === 'webp') {
          out = await img.webp({ quality: 90 }).toBuffer()
          type = 'image/webp'
        } else if (/\.jpe?g$/i.test(raw) || meta.format === 'jpeg') {
          out = await img.jpeg({ quality: 90 }).toBuffer()
          type = 'image/jpeg'
        } else {
          out = await img.png().toBuffer()
          type = 'image/png'
        }
        res.setHeader('Content-Type', type)
        res.setHeader('Cache-Control', 'public, max-age=3600')
        res.end(out)
      }
      run().catch(() => next())
      return
    }
  }

  if (!raw.startsWith('/api/')) return next()

  // No-op view counter and telemetry.
  if (raw.startsWith('/api/countview/') || raw === '/api/proxy/honeycomb') {
    res.statusCode = 204
    res.setHeader('Content-Type', 'text/plain')
    res.end('')
    return
  }

  // Recorded API responses (air-gapped; nothing is ever fetched upstream).
  const key = cacheKey(rawUrl)
  const metaPath = path.join(apiCacheDir, key + '.meta.json')
  const bodyPath = path.join(apiCacheDir, key + '.bin')
  if (fs.existsSync(metaPath) && fs.existsSync(bodyPath)) {
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'))
    res.statusCode = meta.status || 200
    if (meta.contentType) res.setHeader('Content-Type', meta.contentType)
    res.setHeader('Cache-Control', 'no-cache')
    res.end(fs.readFileSync(bodyPath))
    return
  }

  res.statusCode = 404
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify({ error: 'offline_miss', path: rawUrl }))
}

function offlineMediaPlugin() {
  return {
    name: 'readymag-offline-media',
    configureServer(server) {
      server.middlewares.use(offlineMediaMiddleware)
    },
    configurePreviewServer(server) {
      server.middlewares.use(offlineMediaMiddleware)
    },
  }
}

export default defineConfig({
  plugins: [
    offlineMediaPlugin(),
    react({
      jsxImportSource: '@emotion/react',
    }),
  ],
  server: {
    host: true,
    port: 3000,
    open: false,
  },
  preview: {
    host: true,
    port: 3000,
  },
  build: {
    sourcemap: true,
  },
})
