<summary>
Build a storyboard getting-started tutorial using React, Jotai, and Tailwind CSS.
</summary>

<core_features>
Core features:
- Direct tutorial entry — first load opens the storyboard workspace (header + scene grid); no login or admin gate
- Product header — logo mark, project label (Demo Projects), storyboard title (1. Getting Started), kebab menu, and inert utility tools
- Primary collection — scenes/frames: seed at least 8 imaged scenes; each has number, title/description, image, and optional camera note; the list supports create (Add Scene), edit (description/title), and delete
- At least two interaction modes: Board mode (Tile / List layouts of the scene set) and Tutorial/Slide mode (single centered active scene with prev/next)
- Domain behavior beyond CRUD: Tile/List/Slide view toggles; reorder or renumber after delete; empty board state; description focus/edit affordance; drawers for notifications/account may remain demo chrome
- Invalid create: empty scene title/description when required must not add a scene; show visible validation feedback
- Inert chrome — non-navigational controls toast demo only instead of leaving the page
- Right drawers for notifications and account/storyboards may remain as demo chrome with seeded rows
</core_features>

<visual_design>
- Light workspace with Gabarito UI type and yellow accent
- Top header: logo mark, Demo Projects + 1. Getting Started titles, kebab menu, utility tools
- Storyboard nav bar with Tile / List / Slide toggles; scene cards in a multi-column grid
- Welcome line Welcome to Docs!; product chrome density of a docs/storyboard app — not a marketing landing
- Empty board state is visually clear when no scenes remain
</visual_design>

<motion>
- Scene enter: on first load, scene cards stagger in with a short fade and slight upward settle
- Hover animations (required): scene cards ease upward with soft shadow; scene images brighten on hover; header and mode toggles ease background/press; per-scene actions may fade in on card hover
- View modes: Tile / List / Slide toggles re-layout the same scene set; switching modes may toast the mode name
- Slide mode: board collapses to a single centered active scene; prev/next advance the active scene
- Description edit: focusing a scene description applies a soft yellow wash and dashed outline while editing
</motion>

<requirements>
Shared application state must use the stack state library named in summary (in-memory only): scenes collection, view mode, slide index, drawers/toast, and edit focus. Do not use localStorage, sessionStorage, or other browser storage APIs.
State contracts (behavioral, not storage keys):
- Creating a valid scene increases the collection and shows it on the board
- Editing a scene updates that same record in Tile/List/Slide
- Deleting a scene removes it from the board, renumbers as needed, and updates slide bounds
- View mode and slide index are shared client state; switching modes does not reload the document
Stack: React + Jotai + Tailwind CSS (Vite or equivalent SPA); frontend-only. Local Gabarito fonts. No external component libraries.
- Seed at least eight imaged scenes plus placeholders/Add Scene
- Empty required fields on create must not increase the scenes count; show visible validation feedback
- After deleting all scenes, show an empty state on the board
- Zero navigational outbound links; inert controls toast demo only
- Document title 1. Getting Started — Docs; welcome line Welcome to Docs!
</requirements>
