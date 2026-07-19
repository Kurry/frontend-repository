<summary>
Build a resume-and-portfolio builder using Qwik, Qwik stores, Tailwind CSS 4.3.2, and DaisyUI.
</summary>

<reference_screenshots>
Screenshots of the reference application are provided in-container at
/reference-screenshots/: overview.png is a full-page desktop-layout
overview (downscaled); segment-NN.png are full-resolution 1440x900 sections
in top-to-bottom order with slight overlap. They are part of this instruction:
recreate what they show. Where a screenshot and the text conflict, the text
wins. Do not copy the images into /app or ship them as app assets.
</reference_screenshots>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit):
Feature: Builder shell —
- The app opens at / into a two-pane PortfolioFrame builder with no login: a left editor panel and a right live preview panel, plus a top bar showing the PortfolioFrame wordmark and a Download PDF button. It starts completely empty — no seeded content and no saved drafts — so the preview shows a friendly "start building" prompt and empty-state hints on first load
- The app never navigates away from /: all controls act through in-app state and there are no outbound navigational links in the chrome
Feature: Profile Header —
- The Profile Header editor has Name, Title/Tagline, and Bio fields; typing into any of them updates the assembled preview's header block immediately, with the typed text appearing in the preview without a reload
Feature: Projects —
- An Add Project form with Title, Description, Category Tag, and Link Label fields appends a project card to the preview's project grid when submitted; each project has Edit and Delete controls in the editor, editing a project updates its card in the preview, and deleting it removes the card from the preview
- The Add Project form validates before submit: its submit control stays disabled while required fields are invalid, and attempting to submit with an empty Title shows an inline error message naming the Title field next to that field and appends no card
Feature: Skills —
- A Skills input adds a skill chip when the user presses Enter or clicks Add; the chip appears in the preview's Skills section
Feature: Testimonials —
- An Add Testimonial form with Quote, Name, and Role fields appends an entry to a horizontally scrollable testimonials row in the preview; each testimonial has a Delete control that removes it
Feature: Section layout —
- Each content section — Profile Header, Projects, Skills, Testimonials, and Contact — has a labeled show/hide toggle; turning a section off immediately removes it from the preview and turning it back on restores it in its existing position rather than appending it at the end
- Each section has Move Up and Move Down controls that reorder the sections shown in the preview
Feature: Theme and density —
- A Theme Picker offers four named color themes labeled Sunrise, Slate, Forest, and Blossom; selecting one instantly recolors the headings, chips, and accent text inside the preview's content blocks only, while the surrounding editor chrome keeps its own colors
- A Density control toggles the preview between Compact and Spacious spacing presets, visibly changing the padding and gaps between the preview's blocks
Feature: Contact —
- A Contact editor has Email and Location fields plus up to 3 custom labeled links (for example Portfolio or Writing); the Email, Location, and each custom link render together in the preview's Contact section with each link showing its own label
Feature: Export —
- A Download PDF button in the top bar triggers the browser's native print flow to export the assembled single-page document; the print output shows only the assembled preview content and hides the editor chrome
Feature: Drafts —
- A Drafts panel saves the current content under a typed name via Save As Draft, lists every saved draft, and lets the user Load a draft (replacing the current editor and preview content) or Delete it from the list
Feature: Completeness —
- A Completeness panel lists recommended fields and sections with a live "x of y complete" count that increases the moment a previously empty recommended field is filled, without a reload
Feature: History —
- An Undo control reverts the most recent content change — adding, editing, or deleting a project, testimonial, or skill, or editing a Profile Header field — and a Redo control reapplies the last undone change; undo history spans multiple consecutive changes so repeated Undo walks back through them one at a time
- A visible History panel models edits to the content as explicit transitions: it shows a region labelled History state with the current snapshot, a selectable list of past and future snapshots, and an Apply Scenario Change action that records the current content as a new explicit transition
- Undoing one or more steps and then making a different change — Apply Scenario Change, or a new create, edit, or delete — creates a separate selectable branch rather than silently discarding or flattening the abandoned states; the History panel lists the alternate branch, and selecting a branch restores the exact prior visible state that branch represents
</core_features>

<user_flows>
- After submitting a valid project through the Add Project form, the preview's project grid shows exactly one more card, the Completeness panel's "x of y complete" count reflects the projects section the moment it first gains content, and after a full page reload the same project card is still present without re-entering it
- Adding a skill through the Skills input shows the new chip in the preview's Skills section immediately; pressing Undo removes exactly that chip and enables Redo, pressing Redo restores the same chip, and the History panel lists these transitions as selectable snapshots
- Saving the current content under a typed name via Save As Draft adds exactly one entry to the drafts list right away; after a full page reload the draft is still listed, and choosing Load on it replaces the editor fields, the preview content, the section order and visibility, and the active theme and density with that draft's exact values without a reload
- Hiding the Testimonials section removes it from the preview while its entries remain in the editor; using Move Up to reorder another section visibly changes the preview's section order; turning Testimonials back on restores it in its remembered position, and after a full page reload the committed order and visibility are unchanged
- Selecting the Forest theme recolors the preview's headings, chips, and accent text in place and switching Density to Compact tightens the preview's padding and gaps; both selections survive a full page reload and the editor chrome's own colors never change
</user_flows>

<edge_cases>
- Attempting to add a skill that duplicates an existing one ignoring letter case is rejected with a visible inline message and creates no second chip
- Move Up is disabled for the first visible section and Move Down for the last, and the disabled controls read as non-interactive
- Undo is disabled when there is nothing to undo and Redo is disabled when there is nothing to redo
- Deleting a draft removes it from the drafts list immediately, and a reload does not revive a draft that was deleted before the reload
- Rapid duplicate submissions of the Add Project or Add Testimonial form create exactly one record, not two
- Deleting the last project, testimonial, or skill returns that region of the preview to its explicit empty-state hint rather than a blank area, and the projects grid, testimonials row, and drafts list each show a hint whenever they are empty
</edge_cases>

<visual_design>
- Clean single-user builder composition on a warm off-white app background (about #FAFAF9) with white surface cards and panels (#FFFFFF) separated by hairline borders (about #E7E5E4); the editor panel and the preview canvas read as distinct surfaces
- Heading text uses a Poppins-first stack (Poppins, then -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif) and body text uses an Inter-first stack (Inter, then the same system fallbacks); the preview's profile name renders at 30px semi-bold as the h1, section titles at 20px semi-bold as h2, and body copy at 15px regular
- Color tokens are applied through CSS custom properties and are visibly used, not merely declared: --color-primary #7C3AED (violet) for chrome buttons, links, and the active accent; --color-accent #F97316 (orange) for highlights; --color-background #FAFAF9; --color-surface #FFFFFF; --color-text-primary #1C1917; --color-text-muted #78716C; --color-border #E7E5E4
- The four preview themes each pair a content accent with a supporting tone, applied only inside the preview's content blocks: Sunrise #F97316 with supporting tone #FDE68A, Slate #475569 with #CBD5E1, Forest #15803D with #BBF7D0, and Blossom #DB2777 with #FBCFE8
- Shape system: an 8px base spacing unit, a 16px border radius for cards and panels, primary buttons filled with --color-primary and white text at a full 999px pill radius with no shadow, and secondary buttons white with --color-primary text and a 1px solid --color-border border at the same pill radius with no shadow
- Skill and category chips render as rounded pills tinted with the active theme's supporting tone; project cards and testimonial cards use the 16px card radius with hairline borders
- Icons come from one consistent icon set used across the chrome — section toggles, reorder controls, delete controls, and the drafts panel share the same visual icon language
- The Completeness panel distinguishes complete from incomplete items by more than the count alone — for example a check mark and struck-through muted label for complete items versus a plain marker for incomplete ones
- Each section's show/hide toggle reads as an on/off switch by thumb position, not by color alone
- Friendly empty states: before any content exists the preview invites the user to start building rather than showing a blank page
</visual_design>

<motion>
- Buttons, theme swatches, section toggles, and history entries each show a visible hover state — a background, border, or shadow change — when the pointer is over them (hover feedback is required and is a common false done; do not omit it)
- Adding a project or testimonial animates the new card into the preview's grid or row, and deleting one animates it out rather than snapping instantly
- Adding a skill chip animates it into the Skills section, and a rejected duplicate produces no chip motion at all
- Using Move Up or Move Down animates the affected section to its new position in the preview through the real reorder controls
- Saving a draft animates the new entry into the drafts list and gives immediate transient feedback that the save succeeded — the new draft appears right away, or a brief confirmation message appears
- Selecting a theme recolors the preview's headings, chips, and accent text in place, and toggling Density visibly re-spaces the preview blocks, each without a reload
- Toggling a section's visibility updates the assembled preview immediately through the real editor controls
- Undo, Redo, Apply Scenario Change, and branch selection in the History panel update the visible preview through the panel's real controls; disabled Undo or Redo controls read as non-interactive
- Download PDF opens the browser's native print preview of the assembled document
- With prefers-reduced-motion set, list and reorder animations are removed and every state change still applies instantly
</motion>

<responsiveness>
- Responsive down to about 375px wide: the editor and preview stack into a single column with no horizontal page scrolling, and the preview's name heading, section headings, and the completeness count stay legible and reflow rather than clipping
- The testimonials row scrolls horizontally within its own container rather than overflowing the page, at every viewport width
</responsiveness>

<accessibility>
- Keyboard Tab focus is visibly indicated on every interactive control, including form fields, theme swatches, section toggles, and reorder buttons
- Every editor control — form fields, Add and Delete controls, toggles, reorder buttons, theme swatches, Density, drafts controls, and the History panel — is reachable and operable with the keyboard alone
- Inline validation and duplicate-rejection messages render adjacent to the field they describe, and the transient save confirmation is exposed to assistive technology as well as shown visually
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors appear during a full exercise of the builder — creating, editing, deleting, reordering, theming, saving and loading drafts, and walking the history
- The primary content workflow stays exact and responsive under at least 25 rapid repetitions through its normal controls, without a blank screen, uncaught error, or sustained freeze
</performance>

<writing>
- Headings, buttons, and panel titles use one consistent capitalization convention throughout the app
- Empty states explain what belongs in the region and how to add it, and validation messages name the field and the fix; no placeholder or lorem text appears anywhere in the shipped UI
</writing>

<requirements>
Shared application state must live in Qwik stores: the content (profile, projects, skills, testimonials, contact), the section order and per-section visibility, the active theme and density, the saved drafts, and the transition history with its branches. A change made through any control must flow through these shared stores so the editor and the live preview update together without a reload.
Persistence is required: saved drafts and the current working content must survive a full page refresh by persisting to localStorage and restoring the exact committed state on reload. Guard storage access so the production build does not crash when storage is unavailable. A reload must not revive a draft that was deleted before the reload.
State contracts (behavioral, not storage keys):
- Editing a Profile Header, Contact, project, or testimonial field updates that same record in the preview everywhere it appears
- Submitting the Add Project or Add Testimonial form adds exactly one card to the shared collection; deleting one removes it from the preview; duplicate rapid submissions must not create duplicate records
- Adding a skill that case-insensitively duplicates an existing one is rejected with a visible inline message and adds no chip
- Section visibility toggles and Move Up / Move Down recompute the preview's rendered sections from the shared order and visibility state; they do not invent a second disconnected copy
- Selecting a theme or density updates shared client state and recolors or re-spaces only the preview, never reloading the document
- Saving a draft stores a named snapshot; loading a draft replaces the current content, order, visibility, theme, and density with the draft's exact values; deleting a draft removes it from the list and it does not return after reload
- Edits to the content are recorded as explicit history transitions; Undo and Redo restore exact adjacent snapshots, invalid Undo or Redo is disabled, Apply Scenario Change and other changes made after an Undo create a selectable branch instead of flattening history, and selecting a branch restores that branch's exact visible state
- Export uses the browser's native print flow: Download PDF calls window.print() against print-specific CSS (an @media print rule) that hides the editor chrome and shows only the assembled preview; there is no PDF-generation library
Seeds and empty state: the app starts with no content and no drafts; the preview and lists show empty states until the user creates data.
Build tooling: a Vite single-page app built with Qwik, styled with Tailwind CSS 4.3.2 (pinned) via the Tailwind CSS Vite plugin, with design tokens declared in @theme. DaisyUI is the component library for the editor chrome — buttons, form controls, section toggles, chips, the drafts list, and confirmation feedback. AutoAnimate is allowed for animation; no other animation libraries. Iconify icons only, delivered through the @iconify/tailwind4 plugin as CSS icons, with one icon set used consistently. All forms — Add Project, Add Testimonial, the Skills input, Contact, and Save As Draft — validate through a Valibot schema driven by Modular Forms for Qwik: the schema defines the rules and inline per-field errors appear before submit. All libraries are installed via npm and bundled locally; no CDN imports. No backend and no authentication. All controls act in-app with no outbound navigation.
Responsive: the layout reflows to a single column at about 375px wide with no horizontal page scrolling, and the testimonials row stays scrollable within its own container.
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in `/app`; scaffold under `/app` as needed for the stack in `<summary>`; `/app/package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds); run via `npm start` on port 3000; do not iframe, proxy, or fetch the product from another origin.
- WebMCP is a required delivery step, not a scoring criterion; implement exactly the `<webmcp_action_contract>` below; register tools yourself from `<module_spec>` + Bindings using the same handlers as the visible UI; honor mechanics exclusions; optional self-test via `webmcp_session_info` / `webmcp_list_tools` / `webmcp_invoke_tool` only.
</delivery>

<webmcp_action_contract>
Contract version: zto-webmcp-v1

Modules:
- structured-editor-v1
- entity-collection-v1

Module specs:
<module_spec id="structured-editor-v1">
{
  "id": "structured-editor-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Structured editor",
  "purpose": "Document, diagram, canvas, configuration, and property editors.",
  "permitted_operations": ["select", "add", "delete", "update_property", "set_content", "switch_mode", "preview"],
  "binding_keys": {
    "required_any_of": [["editor_operations"], ["editor_object_types"]],
    "optional": ["editor_properties", "editor_modes", "value_bounds", "visible_postconditions"]
  },
  "restrictions": [
    "No arbitrary coordinate, DOM, or storage mutation via WebMCP.",
    "Drag, resize, drawing, snapping, and keyboard movement remain Playwright-driven when mechanism matters."
  ],
  "tool_name_prefix": "editor"
}
</module_spec>

<module_spec id="entity-collection-v1">
{
  "id": "entity-collection-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Entity collection",
  "purpose": "Carts, records, favorites, calendar events, list items, and local entities.",
  "permitted_operations": ["create", "select", "update", "delete", "toggle", "quantity", "reorder"],
  "binding_keys": {
    "required_any_of": [["entity"], ["entity_operations"]],
    "optional": ["entity_fields", "value_bounds", "visible_postconditions"]
  },
  "restrictions": [
    "Closed entity and field enums only.",
    "Bounded string and numeric values.",
    "No generic state setter or arbitrary patch object.",
    "Invokes the same domain command used by the visible control.",
    "Delete requires explicit confirm=true.",
    "Reorder only when gesture mechanics are not being evaluated."
  ],
  "tool_name_prefix": "entity"
}
</module_spec>

Bindings:
- Editor object types: header; projects; skills; testimonials; contact
- Editor operations: select; update_property; switch_mode; preview
- Editor properties: name; title; bio; email; location; theme; density; visibility; order
- Editor modes: compact; spacious
- Entity: portfolio-item
- Entity operations: create; select; update; delete
- Entity fields: project; testimonial; skill; draft

Mechanics exclusions:
- Undo/Redo/branch selection and History panel stay Playwright-driven via real controls
- Download PDF (window.print) stays Playwright-observed
- Horizontal testimonials scroll stays Playwright-observed
- Section reorder animation stays Playwright-observed when gesture matters

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
