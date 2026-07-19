import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [solid(), tailwindcss()],
  publicDir: "pub",
  base: "/",
  server: { host: "0.0.0.0", port: 3000 },
  preview: { host: "0.0.0.0", port: 3000 },
});
