import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
  },
  server: {
    port: 3000,
    strictPort: false,
  },
  preview: {
    port: 3000,
    strictPort: true,
    host: "0.0.0.0",
  },
});
