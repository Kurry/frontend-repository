<summary>
Build a frontend-only, peer-to-peer WebRTC chat and file-transfer client using SolidJS, Solid stores, Tailwind CSS 4.3.2, and Kobalte.
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
Core features:
- The workspace opens directly into a communication shell: a session panel (peer name field, read-only client ID, room/peer identifier field, Join Room and Leave Room controls, connection badge), a chat panel (message history and message composer), and a file-transfer panel (a control to choose local files and a queue table) all render together instead of a generic starter page
- The session panel seeds a non-empty local peer identity on first load: an editable display name and a read-only generated client identifier, both visible without any action
- The chat panel opens with at least 2 seeded local/loopback demo lines so the transcript is non-empty on first load; these lines are clearly local/demo content, not messages from a real connected peer
- Entering a room or peer identifier and choosing Join Room starts exactly one connection attempt: the connection badge changes from its idle label to a connecting label, then within a few seconds settles into a waiting-for-peer label. At no point does the badge, chat panel, or any other visible text state that a peer has connected — there is no real signaling channel behind this shell
- The session panel's join form validates inline before any connection attempt: with the room or peer identifier empty, activating Join Room shows an inline error message naming the identifier field next to it and starts no attempt (the badge stays idle); the error clears as soon as a non-empty identifier is typed
- Choosing Leave Room while connecting or waiting returns the connection badge to a disconnected label immediately; Join Room is available again afterward to start a new attempt
- While the session is connecting or waiting, the chat composer is enabled and appending a message adds it to the local transcript immediately, right-aligned to distinguish it from the seeded demo lines; while idle or disconnected, the composer is disabled and a nearby note explains that sending is unavailable because no session is active
- Choosing one or more local files through the file-transfer control adds one row per chosen file to the queue table immediately, each showing that file's own name and size and a Not Started status, with no recipient, room, or connected peer required; choosing a second, different file adds a second distinct row without overwriting or merging with the first
- Editing the display name in the session panel updates the visible peer identity immediately without any save control or page reload
</core_features>

<user_flows>
User flows (each chain must hold end to end):
- Join-and-chat flow: entering a room identifier and choosing Join Room moves the connection badge from idle to connecting and then to waiting for peer, the chat composer becomes enabled at the same moment the badge leaves idle, and appending a message adds exactly one new right-aligned line to the transcript immediately (the transcript line count increases by exactly one). Reloading the page afterward restores the peer identity, the last-entered room identifier, and the seeded plus the newly sent chat line in the same order, while the connection badge resumes at rest (idle or disconnected), never at connecting or waiting
- File-queue flow: with the queue empty and its empty-state message showing, choosing two different local files replaces the empty state with exactly two queue rows, each carrying its own file name, its own size, and a Not Started status; the rows appear regardless of connection state. Reloading the page restores both rows with the same names, sizes, statuses, and order, and the connection badge is back at rest
- Leave-and-rejoin flow: choosing Leave Room while waiting flips the connection badge to disconnected immediately, the chat composer disables and its explanatory note appears in the same moment, and the transcript keeps every previously sent line; entering a new identifier and choosing Join Room again starts a fresh attempt whose badge walks idle-to-connecting-to-waiting exactly as the first did
- Reloading the page at any point restores the local peer identity (name and client ID), the last-entered room or peer identifier, the seeded plus any locally sent chat lines, the file queue, and the theme choice from local storage; the connection badge always resumes at rest (idle or disconnected), never at connecting or waiting, since no real peer session can survive a reload
</user_flows>

<edge_cases>
- Activating Join Room with an empty room or peer identifier starts no connection attempt: an inline error names the identifier field, the badge stays on its idle label, and no other panel changes
- Entering a second room or peer identifier after a first replaces the value shown in the join field; the field always reflects only the latest value typed
- When no files are queued, the file-transfer panel shows an empty-state message in place of table rows explaining that chosen files will appear there
- Sending a message consisting only of whitespace adds no transcript line; the composer clears or keeps the input without appending anything
- Choosing the same file twice in a row still yields distinct visible rows rather than silently merging them, so the queue row count always equals the number of choose actions' files
</edge_cases>

<visual_design>
- Three-column communication workspace on desktop: a session/identity column on the left, the chat transcript and composer in the center as the primary visual focus, and the file-transfer queue on the right as secondary content
- The connection badge is a small pill with distinct background/text colors per state (idle, connecting, waiting, disconnected) so the state is visually legible at a glance, not just from its label text
- Chat bubbles distinguish the local user's own sent messages (right-aligned, filled accent color) from seeded demo/loopback lines (left-aligned, neutral surface)
- The file queue renders as a compact table with Name, Size, and Status columns
- Every labeled control and status region pairs its text with a small icon from one consistent icon set (session, chat, file-transfer, and theme controls all carry icons in the same visual style and stroke weight)
- Supports a light and a dark surface, switchable from a chrome control near the top of the page; both surfaces keep the same layout and badge color coding, only recoloring backgrounds, borders, and text
</visual_design>

<motion>
- Buttons (Join Room, Leave Room, theme toggle, choose-file) apply a hover background/shadow change and a brief scale-down on press
- The connection badge transitions its background and text color smoothly whenever the connection state changes (idle to connecting, connecting to waiting, waiting to disconnected)
- A newly sent chat message animates into the transcript with a brief slide/fade rather than appearing instantly, and newly added file queue rows animate in the same way
- File queue rows and chat composer controls apply a hover or focus wash (row background tint on hover, focus ring on the composer input) so interactive chrome never looks static
- The inline join-form error appears with a short fade or slide rather than popping in
- Switching between light and dark surfaces recolors backgrounds, borders, and text with a short smooth transition rather than an instant flip
- With prefers-reduced-motion set, entrance and transition animations are removed and state changes apply instantly while every feature remains usable
</motion>

<responsiveness>
- At mobile width, the three columns restack vertically in session, chat, then file-transfer order, keeping the chat/composer reachable without horizontal scrolling
- At 375 pixel width no content clips or overflows the viewport and no horizontal scrollbar appears; the queue table stays readable by scrolling inside its own panel if needed
</responsiveness>

<accessibility>
- Every interactive control (name field, identifier field, Join Room, Leave Room, theme toggle, composer, choose-file) is reachable and operable with the keyboard alone, with a visible focus indicator
- The connection badge's current state is exposed as text (not color alone) and state changes are announced through an aria-live polite region
- The inline join-form error is programmatically associated with the identifier field and announced when it appears
- The disabled chat composer exposes its disabled state to assistive technology, and the nearby explanatory note is readable text in the DOM, not a tooltip-only hint
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors or warnings appear on load or during a full exercise of joining, leaving, chatting, queueing files, toggling theme, and reloading
- Rapid repeated input (fast typing in the composer, quick Join/Leave toggling) causes no hangs, duplicated transcript lines, or dropped interactions
</performance>

<writing>
- Control labels are specific verbs or verb phrases (Join Room, Leave Room, Send) with one consistent capitalization convention across the app
- The seeded demo lines are explicitly labeled as local/demo content so they cannot be read as messages from a real peer
- Empty states and the disabled-composer note name the situation and what the user can do next; no lorem ipsum or placeholder text appears anywhere in the shipped UI
</writing>

<requirements>
- Use SolidJS with Solid stores for all shared application state: the peer identity, connection state, room/peer identifier, chat transcript, file queue, theme, and UI chrome all live in one shared store that every panel derives from — never a second disconnected copy — and WebMCP tool handlers invoke the same store commands as the visible controls.
- Styling is Tailwind CSS 4.3.2, pinned, with design tokens in the Tailwind theme.
- Kobalte components for the interactive chrome: text fields, buttons, the theme toggle switch, and any tooltip or toast surfaces.
- Vanilla Motion (motion.dev) and CSS transitions are allowed for animation; no other animation libraries.
- Tabler icons via @tabler/icons-solidjs only; no other icon sets, no raw pasted SVGs, no icon CDN.
- All forms — the session panel's name and join fields and the chat composer — validate through a Zod schema driven by TanStack Form for Solid, rendering inline per-field errors before any submit or join action proceeds.
- No authentication wall — open directly into the primary communication workspace.
- Connection-state machine contract: exactly four visible states — idle (no room/peer identifier entered or session left), connecting (immediately after Join Room), waiting for peer (after the connection attempt settles), and disconnected (after Leave Room, or when reload cannot resume a pending attempt). Never render or claim a fifth "connected to peer" or "online" state anywhere in the UI or in any exposed tool output — this shell has no real signaling channel and must not fabricate a remote peer.
- File-queue contract: choosing a local file must add its filename (and size) to the visible queue immediately, independent of connection state and without requiring a recipient or connected peer; each queued file keeps its own name distinct from other queued files.
- Persist local peer identity (name, generated client identifier), the last-entered room or peer identifier, chat transcript, file queue, and theme choice in localStorage (or equivalent client storage) so a reload restores them; the connection state itself must never restore as connecting or waiting.
- Seed the workspace with a local peer identity and at least 2 demo/loopback chat lines so it is non-empty on first load.
- Keep the implementation frontend-only and self-contained: no backend, no real WebRTC signaling or peer connection, no outbound network calls, and no outbound navigation from any control.
- Build tooling: Vite (or an equivalent SPA setup). All libraries installed via npm and bundled locally; no CDN imports of any library, font, or icon set.
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
- command-session-v1
- artifact-transfer-v1

Module specs:
<module_spec id="command-session-v1">
{
  "id": "command-session-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Command / session",
  "purpose": "Media, games, presentations, simulations, demos, and remote-control shells.",
  "permitted_operations": ["start", "pause", "resume", "stop", "restart", "advance", "trigger_demo", "connect", "disconnect"],
  "binding_keys": {
    "required_any_of": [["session_operations"]],
    "optional": ["demos", "visible_postconditions"]
  },
  "restrictions": [
    "No batching or replay of gameplay.",
    "Timing, animation, collision, repeated input, and transient UI require immediate Playwright observation.",
    "Tool output cannot prove successful playback or connection."
  ],
  "tool_name_prefix": "session"
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
- Session operations: connect; disconnect
- Artifact operations: import

Mechanics exclusions:
- Real peer connection and file-picker interaction stay Playwright-observed
- Tool output cannot prove a peer connected

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
