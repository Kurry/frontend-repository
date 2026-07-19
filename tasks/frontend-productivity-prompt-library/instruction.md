<summary>
Build a prompt library content manager for a prompt-engineering platform using React, Zustand, Tailwind CSS 4.3.2, and IBM Carbon Design System.
</summary>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit):

Feature: Create prompt —
- Clicking New Prompt opens a modal dialog with fields: title (required), body text (required), technique tag (select, required), and description (optional); the Submit control stays disabled until title and body are non-empty and a technique is selected
- Submitting a valid prompt closes the modal, inserts exactly one row into the library table, and increases the visible prompt count by one
- Submitting with an empty title shows an inline validation message naming the title field and adds no row
- The toolbar shows a visible count of the form X of Y prompts that tracks the collection and the active search and filter constraints

Feature: Search, filter, and suggestions —
- Typing in the search field narrows the table to rows whose title or body contain the query string; clearing the field restores the full list exactly
- The technique-tag filter select narrows the list to prompts matching the selected technique; combining search and tag filter applies both constraints simultaneously
- A horizontal row of suggestion chips above the table offers common searches and technique filters; clicking a chip fills the search field or applies the filter exactly and the table narrows accordingly; when the chips overflow, the row scrolls horizontally without shifting the vertical layout
- When search and filters match nothing, the table body shows an empty state with a message and a Clear filters control that resets both constraints and restores the full list

Feature: Prompt body as code —
- Opening a prompt's detail or edit surface renders the prompt body in a monospaced block with a visible format label
- The body block carries a Copy control; activating it puts the exact body text on the clipboard and shows visible confirmation (icon swap or toast) that clears after a moment

Feature: Edit and version history —
- Clicking the Edit action on a row opens the same modal pre-filled with that prompt's data; submitting updates the row in place and records a new version entry
- Clicking View History opens a side panel listing each saved version with a timestamp and a diff summary; clicking a version restores that version's content into the edit form
- The row's version column increments with each saved edit

Feature: Delete —
- Clicking Delete on a row opens a confirmation dialog; confirming removes exactly that row and decreases the visible count by one; canceling leaves the row intact

Feature: Extend and Combine with sources —
- Selecting two or more rows via their checkboxes enables an Extend and a Combine control in the toolbar; with fewer than two selected, the controls are disabled or hidden
- Extend opens a modal showing the selected prompt with an appended extension text field; submitting creates a new prompt entry derived from the original
- Combine opens a modal merging the selected prompt bodies into a single editable composite; submitting creates exactly one new prompt from the merged content
- A prompt created through Extend or Combine shows a sources affordance: a count trigger that opens a list of the contributing prompts, and choosing a listed source opens that prompt's detail in-app without any outbound navigation

Feature: Attachments —
- Prompts carry seeded example files: in the library table each row with attachments shows compact inline badges, and hovering a badge reveals a small preview; the detail and edit surfaces show attachments as detailed rows with filename and type metadata
- Each attachment shows a type-appropriate preview: an image thumbnail for images, a media glyph for media files, and a document icon fallback otherwise
- An Add attachment control on the edit surface lets the user pick from a set of seeded assets; the chosen attachment appears immediately on the prompt
- Hovering an attachment row reveals a Remove control; activating it deletes exactly that attachment with visible feedback, and the row's attachment badges update to match
</core_features>

<user_flows>
- Creating a prompt end to end: submitting New Prompt with valid fields adds exactly one row, increases the toolbar count by one, and typing the new prompt's title into the search field narrows the table to that row — all without a reload
- Editing with history: saving an edit updates the row in place and increments its version; opening View History shows the new version at the top with a timestamp and diff summary, and clicking the older version restores its content into the edit form
- Deriving a prompt: selecting two rows and running Combine creates one new prompt whose sources list names both originals, and choosing a source from the list opens that original prompt's detail
- Filter round trip: applying a technique filter plus a search narrows the table under both constraints, the toolbar count updates, and Clear filters restores the full list exactly
- A page reload returns the app to its seeded state: the seeded prompts, their attachments and versions, and no active search or filter
</user_flows>

<edge_cases>
- Double-activating the New Prompt Submit control creates exactly one prompt: the count increases by one and one new row appears
- Canceling the create, edit, extend, combine, or delete dialog leaves the collection unchanged: row count and toolbar count are identical before and after
- A prompt title longer than 60 characters is truncated with an ellipsis in its table row and shown in full on the detail and edit surfaces; a long body shows a truncated single-line preview in the table
- After deleting every prompt, the table region shows a designed empty state naming what belongs there with a New Prompt call to action
- Removing the last attachment from a prompt clears its attachment badges in the table without breaking the row layout
</edge_cases>

<visual_design>
- The library renders as a data table with columns: title, technique, created, version, attachments, and actions
- The toolbar row contains: the search input, the technique filter, the prompt count, the New Prompt button, and the conditional Extend and Combine buttons
- Hovering a row shows a full-width hover treatment; selected rows carry a visually distinct selected-layer treatment
- The empty state is illustrated and prompt-relevant, with a New Prompt call to action
- Technique tags render as colored badges with one consistent color per technique across all rows
- Typography shows a clear hierarchy: the app title larger than the toolbar and table headers, which are larger than body and metadata text
- Buttons, inputs, and selects show distinct default, hover, focus (visible ring), disabled, and error treatments; one consistent icon set is used across the toolbar, row actions, and attachment types
- Spacing follows a consistent rhythm across the toolbar, table, side panel, and modals, with no crowded or orphaned regions
</visual_design>

<motion>
- Newly created rows animate into the table from opacity 0 over roughly 200 milliseconds
- Deleted rows collapse in height over roughly 150 milliseconds before disappearing
- Hover animations (required): buttons ease background and shadow with a slight press effect; table rows and suggestion chips take a visible hover treatment; form controls show focus rings
- Modals enter with a short opacity and scale transition of roughly 200 to 300 milliseconds and exit the same way; the history side panel slides in and out
- The copy confirmation animates (icon swap or toast) and reverts smoothly after a moment
- Feedback toasts after create, delete, and attachment removal slide in, remain readable, and auto-dismiss with a fade
- With prefers-reduced-motion set, all transitions apply instantly
</motion>

<responsiveness>
- At widths of 768 pixels and below, the toolbar wraps or collapses its controls behind an overflow control while keeping search reachable; the history side panel becomes a full-width overlay
- At 375 pixel width no content clips or overflows the viewport and no page-level horizontal scrolling appears; the library table scrolls within its own container
</responsiveness>

<accessibility>
- Every interactive control — toolbar controls, suggestion chips, table row actions, checkboxes, attachment controls, form fields — is reachable and operable with the keyboard alone, with a visible focus indicator
- Modals trap focus while open, close on Escape, and return focus to the control that opened them; the history side panel closes on Escape
- The copy confirmation and validation messages are announced through an aria-live region as well as shown visually
- Form fields have visible labels, and validation messages are associated with their fields so each message names the field it belongs to
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors or warnings appear on load or during a full exercise of the app
- The UI stays responsive under rapid repeated input — fast typing in search, quick filter changes, rapid row selection — with no hangs or dropped interactions
</performance>

<requirements>
Shared application state must live in Zustand (in-memory only): the prompts collection with per-prompt versions, sources, and attachment lists, the search query and technique filter, row selection, the active modal or panel, transient copy feedback, and UI chrome. Do not use localStorage, sessionStorage, or other browser storage APIs.
State contracts (behavioral, not storage keys):
- Creating a valid prompt increases the collection and shows the new row; the toolbar count updates
- Editing a prompt updates that record everywhere it appears (table row, detail, history panel) and appends a version
- Deleting a prompt removes it from the table, the selection, and the derived counts
- Search and filter recompute the visible list from the shared collection; they do not create a second disconnected copy
- Sources on derived prompts resolve against the live collection rather than duplicating prompt content
- Adding or removing an attachment updates the table badges and the detail rows from the same per-prompt list
Build tooling: Vite SPA. Styling is Tailwind CSS 4.3.2 (pinned) with design tokens in the theme layer. IBM Carbon Design System (@carbon/react) is the component library for all UI components and the data table; no other component library. Motion for React and AutoAnimate allowed for animation; no other animation libraries. Icons from @carbon/icons-react only, installed via npm — no raw copy-pasted SVG icon sets. All forms — New Prompt, Edit, Extend, and Combine — are driven by React Hook Form validating through a Zod schema: the schema defines the rules and inline per-field errors render before submit. All libraries installed via npm and bundled locally; no CDN imports; attachment assets are seeded local files, with no real upload backend. No backend or authentication.
- Seed at least 15 prompts across at least 5 technique categories on first load, with at least 3 seeded prompts carrying one or more attachments
- Submitting New Prompt with empty required fields must not increase the prompt count; show visible validation feedback
- After deleting all prompts, or when search and filters match nothing, show the designed empty state in the table region
- Zero navigational outbound links for app chrome — in-app controls only; view changes via shared client state
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
- entity-collection-v1
- browse-query-v1
- form-workflow-v1
- artifact-transfer-v1

Module specs:
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

<module_spec id="browse-query-v1">
{
  "id": "browse-query-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Browse / query",
  "purpose": "Content sites, catalogs, feeds, dashboards, and navigation.",
  "permitted_operations": ["open", "search", "apply_filter", "clear_filter", "sort", "set_locale", "set_theme"],
  "binding_keys": {
    "required_any_of": [["destinations"]],
    "optional": ["browsable_entity", "filters", "sorts", "locales", "themes", "visible_postconditions"]
  },
  "restrictions": [
    "No arbitrary URL, selector, or undeclared route.",
    "Destinations and filters come from bounded PRD declarations.",
    "Visible navigation state must update via the same handlers as UI controls."
  ],
  "tool_name_prefix": "browse"
}
</module_spec>

<module_spec id="form-workflow-v1">
{
  "id": "form-workflow-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Form workflow",
  "purpose": "Forms, setup flows, authentication shells, and multi-step workflows.",
  "permitted_operations": ["validate", "submit", "cancel", "reset", "advance", "return"],
  "binding_keys": {
    "required_any_of": [["form_fields"], ["form_operations"]],
    "optional": ["workflow_steps", "value_bounds", "visible_postconditions"]
  },
  "restrictions": [
    "Declared fields only.",
    "Normal validation and visible errors remain active.",
    "Cannot manufacture authentication or bypass guarded routes.",
    "Backend-free apps must surface honest unavailable state through product handlers."
  ],
  "tool_name_prefix": "form"
}
</module_spec>

<module_spec id="artifact-transfer-v1">
{
  "id": "artifact-transfer-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Artifact transfer",
  "purpose": "Import, export, copy, print, and conversion workflows.",
  "permitted_operations": ["import", "export", "copy", "print_preview", "convert"],
  "binding_keys": {
    "required_any_of": [["artifact_operations"]],
    "optional": ["import_modes", "export_formats", "conversion_modes", "visible_postconditions"]
  },
  "restrictions": [
    "No raw files, filesystem paths, blobs, base64, or artifact contents in WebMCP arguments or results.",
    "File picker interaction, clipboard contents, and downloaded artifacts remain Playwright responsibilities."
  ],
  "tool_name_prefix": "artifact"
}
</module_spec>

Bindings:
- Entity: prompt
- Entity operations: create; select; update; delete
- Entity fields: title; body; technique; description; attachments; version; sources
- Destinations: library-table; prompt-detail; version-history
- Browsable entity: prompts
- Filters: search; technique
- Form fields: title; body; technique; description; extension-text; combined-body
- Form operations: validate; submit; cancel
- Artifact operations: copy

Mechanics exclusions:
- Attachments: attachment badge hover preview and hover-revealed Remove control visibility stay Playwright-observed
- Prompt body as code: clipboard contents verification and copy-confirmation icon swap/toast animation stay Playwright responsibilities

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
