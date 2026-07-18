<summary>
Build a Material theme design studio using React, Redux Toolkit, and Tailwind CSS.
</summary>

<core_features>
Core features:
- App header with product title Material-UI Theme Creator, inert version chip, Tutorial control (in-page modal), and inert GitHub icon
- Main tabs: Preview / Components / Saved Themes (in-app only; never leave the page)
- Monaco editor showing ThemeOptions TypeScript, bi-synced with Palette / Fonts / Typography / Snippets tool panels
- Editor actions: Editor Settings, Copy theme code, undo/redo, save control with save-status text
- Light/Dark palette Type toggle that updates preview surfaces and editor source
- Device-framed sample sites (Phone / Tablet / Desktop) with sample templates containing internal anatomy
- Searchable component gallery themed by the active options
- Primary collection — saved themes: seed at least 3 saved themes; each has name, palette type (light/dark), and ThemeOptions payload; the list supports create (New Theme), edit (rename + save options), and delete
- At least two interaction modes: Preview/Editor mode (device preview + Monaco + tools) and Saved Themes mode (collection management + load into editor)
- Domain behavior beyond CRUD: load a saved theme into the editor/preview; Light/Dark type toggle; save-status feedback; empty saved-themes state after deleting all; filters or search over saved theme names
- Invalid create: empty theme name must not add a saved theme; show visible validation feedback
- Inert former external affordances — interactive look, no navigation
</core_features>

<visual_design>
- Dark studio shell (near-black surfaces, light shell text, indigo/Material primary accent) with Roboto and Material iconography
- Header brand lockup above main tabs; full-viewport tool density — not a marketing landing
- Preview tab: device toggles + framed sample site on one side; Monaco plus stacked tool panels on the other
- Saved Themes mode: dense list/cards of saved themes with load/delete actions and empty state
- Sample sites and component demos reflect live ThemeOptions
- Layout and chrome styled with Tailwind utility classes
</visual_design>

<motion>
- Main tabs: primary-colored indicator slides when switching Preview / Components / Saved Themes; tab labels ease opacity and background on hover/selection
- Hover animations (required): buttons and icon buttons brightness lift on hover; accordion summaries take a subtle hover wash; saved theme rows take a hover wash; inert link-like controls underline on hover
- Palette tool: accordion rows expand/collapse with chevron; color swatches stay live with the editor
- Preview stage: Phone / Tablet / Desktop toggles reframe the sample site chrome without reload
- Tutorial control opens an in-page modal/flow; action toasts may appear for save/apply
- Light/Dark palette type toggle updates preview surfaces immediately
</motion>

<requirements>
Shared application state must use the stack state library named in summary (in-memory only): saved themes collection, active theme/options, tab selection, device/template, and editor UI flags. Do not use localStorage, sessionStorage, or other browser storage APIs.
State contracts (behavioral, not storage keys):
- Creating a valid saved theme increases the collection and shows it under Saved Themes
- Editing/renaming a saved theme updates that same record; saving options updates the active and saved payload
- Deleting a saved theme removes it from the list and from active selection if it was loaded
- Loading a saved theme writes its options into the shared editor/preview state
- Tab and Light/Dark type are shared client state; toggling them does not reload the document
Stack: React + Redux Toolkit + Tailwind CSS (Vite or equivalent SPA); frontend-only. Styling must use Tailwind utility classes. Monaco Editor is required. Roboto + Material Icons allowed. No MUI/Chakra/Ant Design runtime component libraries as the studio shell kit.
- Seed at least 3 saved themes so Saved Themes is non-empty on first load
- Empty required name on create must not increase the saved themes count; show visible validation feedback
- After deleting all saved themes, show an empty state in the Saved Themes region
- Zero navigational outbound links after settle; same-document hashes for component jumps allowed
- Document title Material UI Theme Creator; product header shows Material-UI Theme Creator
</requirements>
