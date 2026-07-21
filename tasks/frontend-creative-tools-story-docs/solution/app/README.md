# Story Docs — 1. Getting Started (oracle)

Reference oracle for the `frontend-creative-tools-story-docs` eval task: a storyboard
getting-started tutorial built with Astro + React islands, Nanostores, Tailwind, and
DaisyUI. All state is in-memory (no browser storage); the portable end state is the
StoryboardPackage JSON produced by the Export drawer and consumed by Import.

- `npm run build` — static build into `dist/` (committed alongside source)
- `npm run verify:build` — build + assert the dist entry exists
- `npm start` — serve the built app on port 3000
