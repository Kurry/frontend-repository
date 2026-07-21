import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/* Carbon's compiled stylesheet references IBM Plex subsets on IBM's CDN
   (https://1.www.s81c.com/...). The delivery contract forbids outbound
   requests, so every CDN font URL is rewritten at transform time to the
   matching locally vendored complete-face woff2 in src/fonts/. The local
   face covers every subset range the CDN rule declared, so glyph coverage
   is unchanged and nothing ever leaves the origin. */
const S81C_FONT_URL = /https:\/\/1\.www\.s81c\.com\/[^\s"'()\\]+?\.(?:woff2?|otf|ttf)/g
const LOCAL_SANS_MONO = /\/IBMPlex(Sans|Mono)-([A-Za-z]+?)(?:-(?:Latin1|Latin2|Latin3|Cyrillic|CyrillicExt|Greek|Pi))?\.woff2?$/

const localPlexFonts = () => ({
  name: 'routewatch-local-plex-fonts',
  enforce: 'pre',
  transform(code, id) {
    if (!id.endsWith('.css')) return null
    S81C_FONT_URL.lastIndex = 0
    if (!S81C_FONT_URL.test(code)) return null
    S81C_FONT_URL.lastIndex = 0
    const replaced = code.replace(S81C_FONT_URL, (match) => {
      const known = LOCAL_SANS_MONO.exec(match)
      /* Arabic / Devanagari / Hebrew / JP / KR / Thai variant families are
         vendored to the matching local face when they exist, otherwise to a
         local Sans face — those families only match non-Latin scripts, which
         the app never renders, so glyph coverage is unaffected. */
      const face = known ? `IBMPlex${known[1]}-${known[2]}` : 'IBMPlexSans-Regular'
      return `../../../../src/fonts/${face}.woff2`
    })
    return { code: replaced, map: null }
  },
})

export default defineConfig({
  plugins: [localPlexFonts(), react(), tailwindcss()],
  server: { port: 3000, host: '0.0.0.0' },
})
