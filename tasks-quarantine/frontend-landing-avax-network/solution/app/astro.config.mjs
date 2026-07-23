// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  // The frozen reference is served by a plain static file server. Keep the
  // oracle build self-contained: every route and endpoint is materialized in
  // dist/ and no Astro/Node SSR process is required at grading time.
  output: "static",
  // Dev toolbar pollutes pixel captures (bottom-center pill) — must stay off for reference captures.
  devToolbar: { enabled: false },
  vite: {
    plugins: [tailwindcss()],
  },
});
