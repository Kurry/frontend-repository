// @ts-check
import { defineConfig } from "astro/config";
import node from "@astrojs/node";
import tailwindcss from "@tailwindcss/vite";

// Natively authored oracle app. Served with `astro dev` (see package.json);
// the node adapter lets the on-demand /api/contact POST endpoint run both in
// dev and in a built server if ever needed. Fully offline at runtime: no
// remote font/image/video/JS requests anywhere in the app.
export default defineConfig({
  output: "static",
  adapter: node({ mode: "standalone" }),
  // The contact endpoint is a local, offline form sink — allow POSTs without
  // same-origin headers (verifier tooling may POST directly).
  security: { checkOrigin: false },
  // The dev toolbar would pollute pixel captures — keep it off.
  devToolbar: { enabled: false },
  server: {
    host: true,
    port: Number(process.env.PORT || 3000),
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
