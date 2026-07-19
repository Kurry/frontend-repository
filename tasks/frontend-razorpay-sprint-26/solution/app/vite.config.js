import { defineConfig } from "vite";

// Single-page build: the one route (/sprint/26) is served from dist/index.html
// by server.mjs. Assets use root-absolute URLs so the document can be served
// from any path.
export default defineConfig({
  base: "/",
  publicDir: "public",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 1500,
  },
  server: {
    host: "0.0.0.0",
    port: 3000,
  },
});
