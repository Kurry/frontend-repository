<summary>
Build a QR color grid paint studio using Svelte, Svelte stores, and Tailwind CSS.
</summary>

<core_features>
Core features:
- Direct studio entry with angle-bracket title, typewriter-style intro, floating toolbar, and paint canvas — no login or backend
- Cell-size range control that rebuilds the grid and locks after the first paint or image import; Clear re-enables it
- Brush modes: QR Brush, Color Brush, and Eraser, plus a grid overlay toggle
- Seven-color palette swatches that tint solid fills and QR cells
- Pointer and touch painting on a structured cell board with undo history and clear
- Primary collection — saved boards (or board presets): seed at least 4 boards; each has name, thumbnail/snapshot of cells, and a tag; the collection supports create (Save board), edit (rename), and delete
- At least two interaction modes: Paint mode (canvas + toolbar) and Gallery mode (browse/load saved boards)
- Domain behavior beyond CRUD: load a board onto the canvas; favorite boards; filter gallery by tag; empty gallery state; undo/clear on the active board
- Upload or camera-capture an image and pixelize it onto the grid; Download/Share PNG with branded footer
- Invalid create: empty board name must not add a board; show visible validation feedback
- Keyboard shortcuts: Q / B / E for modes, G for grid, Backspace for undo, keys 1–7 for palette
</core_features>

<visual_design>
- Light paper stage with high-contrast ink and soft radial washes; condensed UI type
- Angle-bracket display title for Grid Paint Studio and typewriter-style intro line
- Floating black draggable toolbar with cell slider, mode buttons, seven square swatches, and action buttons
- Gallery mode: dense board cards/rows with names and tags; empty state when none remain
- Large centered canvas stage under the toolbar; desktop-first creative tool composition, not a dashboard
</visual_design>

<motion>
- Desktop toolbar drag: grab the tools header to reposition the floating panel
- Hover animations (required): primary action buttons fill/ease on hover; mode buttons and swatches show active fill/opacity/border changes; gallery board rows take a hover wash
- Cell-size control fades toward muted disabled look when locked; restores on Clear
- Mode switch between Paint and Gallery updates without full reload; loading a board updates the canvas immediately
- Camera capture overlay fades in/out; painting updates cells immediately
</motion>

<requirements>
Shared application state must use the stack state library named in summary (in-memory only): board cells, undo history, brush mode, palette, saved boards collection, active mode, and filters. Do not use localStorage, sessionStorage, or other browser storage APIs.
State contracts (behavioral, not storage keys):
- Creating/saving a valid board increases the gallery collection
- Editing a board name updates that same record in Gallery
- Deleting a board removes it from Gallery and selection
- Loading a board writes its cells into the shared paint board state
- Favorites/tag filters recompute the visible gallery from the shared collection
Stack: Svelte + Svelte stores + Tailwind CSS (Vite or equivalent); frontend-only. Ship QRious locally under assets/ (or equivalent). No MUI/Chakra/Ant Design.
- Seed at least 4 saved boards so Gallery is non-empty on first load
- Empty required name on save/create must not increase the boards count; show visible validation feedback
- After deleting all boards, show an empty state in Gallery
- Ship QRious (or equivalent) locally for client-side QR mask generation
- Product naming: Grid Paint Studio; serve over local HTTP for verification
</requirements>
