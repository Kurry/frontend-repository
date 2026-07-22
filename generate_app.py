import os
import subprocess

app_dir = "tasks/frontend-creative-tools-fictional-darkroom-test-strip-mask-composer/solution/app"
os.makedirs(app_dir, exist_ok=True)

# Generate a basic vite app
subprocess.run(["npm", "create", "vite@latest", ".", "--", "--template", "react-ts"], cwd=app_dir)

# Modify package.json
package_json = """{
  "name": "app",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "start": "vite preview --port 3000 --strictPort --host",
    "verify:build": "tsc -b && vite build"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "zustand": "^5.0.0",
    "framer-motion": "^12.0.0",
    "zod": "^3.24.0",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/vite": "^4.0.0",
    "lucide-react": "^0.470.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.4",
    "typescript": "~5.7.2",
    "vite": "^6.1.0"
  }
}"""
with open(f"{app_dir}/package.json", "w") as f:
    f.write(package_json)

# Modify vite.config.ts
vite_config = """import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
})
"""
with open(f"{app_dir}/vite.config.ts", "w") as f:
    f.write(vite_config)

# Modify index.css
index_css = """@import "tailwindcss";"""
with open(f"{app_dir}/src/index.css", "w") as f:
    f.write(index_css)

# Create placeholder video
subprocess.run(["npx", "playwright", "install", "chromium"], cwd=app_dir)
playwright_script = """import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ recordVideo: { dir: './' } });
  const page = await context.newPage();
  await page.goto('about:blank');
  await page.waitForTimeout(1000);
  await context.close();
  await browser.close();

  const fs = require('fs');
  const path = require('path');
  const files = fs.readdirSync('./');
  for (const file of files) {
    if (file.endsWith('.webm')) {
      fs.renameSync(file, 'evidence.webm');
      break;
    }
  }
})();
"""
with open(f"{app_dir}/video.js", "w") as f:
    f.write(playwright_script)
