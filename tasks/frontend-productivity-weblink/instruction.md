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
Core features (each line is an observable behavior the finished app must exhibit):

Feature: Communication workspace —
- The workspace opens directly into a communication shell: a session panel (peer name field, read-only client ID, room/peer identifier field, Join Room and Leave Room controls, connection badge), a chat panel (message history and message composer), a file-transfer panel (a control to choose local files and a queue table), and Export Session / Import Session controls all render together instead of a generic starter page
- The session panel seeds a non-empty local peer identity on first load: an editable display name and a read-only generated client identifier, both visible without any action
- The chat panel opens with at least 2 seeded local/loopback demo lines so the transcript is non-empty on first load; these lines are clearly local/demo content, not messages from a real connected peer
- Entering a room or peer identifier that satisfies the JoinSession field contract and choosing Join Room starts exactly one connection attempt: the connection badge changes from its idle label to a connecting label, then within 5 seconds settles into a waiting-for-peer label. At no point does the badge, chat panel, or any other visible text state that a peer has connected — there is no real signaling channel behind this shell
- Choosing Leave Room while connecting or waiting returns the connection badge to a disconnected label immediately; Join Room is available again afterward to start a new attempt
- While the session is connecting or waiting, the chat composer is enabled and submitting a ChatMessage payload that satisfies the field contract adds it to the local transcript immediately, right-aligned to distinguish it from the seeded demo lines; while idle or disconnected, the composer is disabled and a nearby note explains that sending is unavailable because no session is active
- Choosing one or more local files through the file-transfer control adds one row per chosen file to the queue table immediately, each showing that file's own name and size and a Not Started status, with no recipient, room, or connected peer required; choosing a second, different file adds a second distinct row without overwriting or merging with the first
- Editing the display name to a value that satisfies the PeerIdentity field contract updates the visible peer identity immediately without any save control or page reload

Feature: API-shaped field contracts (forms submit would-be request bodies) —
- PeerIdentity update payload (the display-name field commits exactly this body; the stored peer record IS the would-be request body): required displayName — trimmed non-empty string, length at least 1 and at most 40 characters. Whitespace-only or longer than 40 characters shows an inline message naming the displayName field and leaves the last valid name unchanged
- JoinSession payload (Join Room submits exactly this body; the pending session record IS the would-be request body): required roomId — trimmed non-empty string, length at least 1 and at most 64 characters, matching only the characters A–Z, a–z, 0–9, hyphen, and underscore (no spaces or other punctuation). Empty, over-long, or illegal-character roomId shows an inline message naming the roomId field, starts no connection attempt (badge stays idle), and the error clears once a valid roomId is typed
- ChatMessage create payload (the composer submits exactly this body; each appended transcript line IS the would-be request body plus generated id/createdAt): required text — trimmed non-empty string at most 2000 characters. Whitespace-only text adds no transcript line; text longer than 2000 characters shows an inline message naming the text field and adds no line
- FileQueueEntry records created by choosing a file carry: required name (non-empty string), required sizeBytes (non-negative integer), and required status exactly the string not-started. Those same field names, types, and the closed status enum appear in Session Pack export and are required again on Import
- Violations always name the offending field inline next to it (not a browser alert). Records created by forms ARE the would-be request bodies: the same field names, bounds, and enums appear in the live Session Pack JSON export

Feature: Session Pack export and import (the app produces the user's session files) —
- Export Session opens a drawer or dialog with a live Session Pack JSON preview regenerated from the current store, plus Copy (clipboard confirmation) and Download (real client-side .json download whose contents match the preview)
- Session Pack JSON is a single object whose top-level field contract is: schemaVersion (exactly the string weblink-session-v1), exportedAt (ISO-8601 date-time), peer (object with required displayName and clientId strings), roomId (string, may be empty when never joined), theme (exactly one of the closed enum light or dark), messages (array of message objects), and fileQueue (array of FileQueueEntry objects)
- Each message object must include: id (string), text (string), role (exactly one of local or demo), and createdAt (ISO-8601 date-time). Each fileQueue object must include: id (string), name, sizeBytes, and status exactly not-started. The pack must never claim a peer connected and must never serialize connection state as connecting or waiting — after export the implied rest state is idle or disconnected
- Export content that omits the session's actual work is invalid: after editing the display name, joining a distinctive roomId, sending a distinctive chat line, and queueing a file, the Session Pack preview, Copy, and Download must contain that displayName, roomId, chat text, and file name, and must still show every required top-level key from the field contract
- Import Session accepts a pasted or file-picked Session Pack JSON; export and import compile and validate against that same schema. A valid import replaces peer displayName, roomId, theme, messages, and fileQueue so the panels and a fresh Export match the pack (connection badge resumes at rest — idle or disconnected). Malformed JSON or a document that fails the field contract (wrong schemaVersion, theme outside light|dark, message role outside local|demo, fileQueue status other than not-started, displayName outside 1–40 characters, roomId with illegal characters when non-empty, missing required keys) shows validation naming the offending field and changes nothing
</core_features>

<user_flows>
User flows (each chain must hold end to end):
- Join-and-chat flow: entering a roomId that satisfies the JoinSession field contract and choosing Join Room moves the connection badge from idle to connecting and then to waiting for peer within 5 seconds, the chat composer becomes enabled at the same moment the badge leaves idle, and submitting one valid ChatMessage adds exactly one new right-aligned line to the transcript immediately (the transcript line count increases by exactly one). Reloading the page afterward restores the peer identity, the last-entered roomId, and the seeded plus the newly sent chat line in the same order, while the connection badge resumes at rest (idle or disconnected), never at connecting or waiting
- File-queue flow: with the queue empty and its empty-state message showing, choosing two different local files replaces the empty state with exactly two queue rows, each carrying its own file name, its own size, and a Not Started status; the rows appear regardless of connection state. Reloading the page restores both rows with the same names, sizes, statuses, and order, and the connection badge is back at rest
- Leave-and-rejoin flow: choosing Leave Room while waiting flips the connection badge to disconnected immediately, the chat composer disables and its explanatory note appears in the same moment, and the transcript keeps every previously sent line; entering a new valid roomId and choosing Join Room again starts a fresh attempt whose badge walks idle-to-connecting-to-waiting exactly as the first did
- Artifact end state: edit displayName to a distinctive valid value, join a distinctive valid roomId, send a distinctive chat line, queue one file, open Export Session and confirm the Session Pack preview still shows schemaVersion weblink-session-v1 plus peer, roomId, theme, messages, and fileQueue keys from the field contract with those live values; Copy confirms; Download then Import Session of that same JSON reconstructs the same displayName, roomId, transcript lines, file queue, and theme, with the connection badge at rest
- Reloading the page at any point restores the local peer identity (name and client ID), the last-entered room or peer identifier, the seeded plus any locally sent chat lines, the file queue, and the theme choice from local storage; the connection badge always resumes at rest (idle or disconnected), never at connecting or waiting, since no real peer session can survive a reload
</user_flows>

<edge_cases>
- Activating Join Room with an empty roomId, a roomId longer than 64 characters, or a roomId containing spaces or other illegal characters starts no connection attempt: an inline error names the roomId field, the badge stays on its idle label, and no other panel changes
- Entering a second room or peer identifier after a first replaces the value shown in the join field; the field always reflects only the latest value typed
- When no files are queued, the file-transfer panel shows an empty-state message in place of table rows explaining that chosen files will appear there
- Sending a message consisting only of whitespace, or a message longer than 2000 characters, adds no transcript line; whitespace clears or keeps the input without appending anything, and over-long text shows an inline message naming the text field
- Choosing the same file twice in a row still yields distinct visible rows rather than silently merging them, so the queue row count always equals the number of choose actions' files
- Editing displayName to whitespace-only or longer than 40 characters shows an inline message naming the displayName field and leaves the last valid name unchanged
- Importing malformed Session Pack JSON, or parseable JSON that fails the field contract (wrong schemaVersion, theme outside light|dark, invalid message role, fileQueue status other than not-started, displayName outside bounds, illegal roomId characters when non-empty, missing required keys), leaves peer, transcript, queue, and theme unchanged and shows validation naming the offending field
</edge_cases>

<visual_design>
- Three-column communication workspace on desktop: a session/identity column on the left, the chat transcript and composer in the center as the primary visual focus, and the file-transfer queue on the right as secondary content
- The connection badge is a small pill with distinct background/text colors per state (idle, connecting, waiting, disconnected) so the state is visually legible at a glance, not just from its label text
- Chat bubbles distinguish the local user's own sent messages (right-aligned, filled accent color) from seeded demo/loopback lines (left-aligned, neutral surface)
- The file queue renders as a compact table with Name, Size, and Status columns
- Every labeled control and status region pairs its text with a small icon from one consistent icon set (session, chat, file-transfer, theme, and Export/Import controls all carry icons in the same visual style and stroke weight)
- Supports a light and a dark surface, switchable from a chrome control near the top of the page; both surfaces keep the same layout and badge color coding, only recoloring backgrounds, borders, and text
</visual_design>

<motion>
- Buttons (Join Room, Leave Room, theme toggle, choose-file, Export Session, Import Session, Copy, Download) apply a hover background/shadow change and a brief scale-down on press
- The connection badge transitions its background and text color smoothly whenever the connection state changes (idle to connecting, connecting to waiting, waiting to disconnected)
- A newly sent chat message animates into the transcript with a brief slide/fade rather than appearing instantly, and newly added file queue rows animate in the same way
- File queue rows and chat composer controls apply a hover or focus wash (row background tint on hover, focus ring on the composer input) so interactive chrome never looks static
- Inline field-contract errors (join, display name, composer, import) appear with a short fade or slide rather than popping in
- Switching between light and dark surfaces recolors backgrounds, borders, and text with a short smooth transition rather than an instant flip
- With prefers-reduced-motion set, entrance and transition animations are removed and state changes apply instantly while every feature remains usable
</motion>

<responsiveness>
- At mobile width, the three columns restack vertically in session, chat, then file-transfer order, keeping the chat/composer and Export/Import controls reachable without horizontal scrolling
- At 375 pixel width no content clips or overflows the viewport and no horizontal scrollbar appears; the queue table stays readable by scrolling inside its own panel if needed
</responsiveness>

<accessibility>
- Every interactive control (name field, identifier field, Join Room, Leave Room, theme toggle, composer, choose-file, Export Session, Import Session, and export Copy/Download) is reachable and operable with the keyboard alone, with a visible focus indicator
- The connection badge's current state is exposed as text (not color alone) and state changes are announced through an aria-live polite region
- Inline field-contract errors (displayName, roomId, text, Import) are programmatically associated with their fields and announced when they appear
- The disabled chat composer exposes its disabled state to assistive technology, and the nearby explanatory note is readable text in the DOM, not a tooltip-only hint
- The Export Session and Import Session surfaces use dialog or complementary semantics: focus moves into the surface on open, Escape closes it, and focus returns to the invoking control on close
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors or warnings appear on load or during a full exercise of joining, leaving, chatting, queueing files, exporting, importing, toggling theme, and reloading
- Rapid repeated input (fast typing in the composer, quick Join/Leave toggling) causes no hangs, duplicated transcript lines, or dropped interactions
</performance>

<writing>
- Control labels are specific verbs or verb phrases (Join Room, Leave Room, Send, Export Session, Import Session, Copy, Download) with one consistent capitalization convention across the app
- The seeded demo lines are explicitly labeled as local/demo content so they cannot be read as messages from a real peer
- Empty states, the disabled-composer note, and field-contract error messages name the situation and the offending field; no lorem ipsum or placeholder text appears anywhere in the shipped UI
</writing>

<requirements>
- Use SolidJS with Solid stores for all shared application state: the peer identity, connection state, room/peer identifier, chat transcript, file queue, theme, and UI chrome all live in one shared store that every panel derives from — never a second disconnected copy — and WebMCP tool handlers invoke the same store commands as the visible controls.
- Styling is Tailwind CSS 4.3.2, pinned, with design tokens in the Tailwind theme.
- Kobalte components for the interactive chrome: text fields, buttons, the theme toggle switch, Export/Import dialogs, and any tooltip or toast surfaces.
- Vanilla Motion (motion.dev) and CSS transitions are allowed for animation; no other animation libraries.
- Tabler icons via @tabler/icons-solidjs only; no other icon sets, no raw pasted SVGs, no icon CDN.
- All forms — PeerIdentity (display name), JoinSession (roomId), ChatMessage (composer text), and Import Session — validate through a Zod schema driven by TanStack Form for Solid. Schemas are API-shaped: they mirror the PeerIdentity, JoinSession, ChatMessage, FileQueueEntry, and Session Pack payloads declared in core features (required fields, 1–40 displayName, 1–64 roomId character class, 1–2000 chat text, theme light|dark, message role local|demo, fileQueue status not-started, schemaVersion exactly weblink-session-v1). The record a form creates IS the would-be request body; Session Pack export and Import validate against those same schemas. Inline per-field errors appear before submit, naming the offending field.
- No authentication wall — open directly into the primary communication workspace.
- Connection-state machine contract: exactly four visible states — idle (no room/peer identifier entered or session left), connecting (immediately after Join Room), waiting for peer (after the connection attempt settles within 5 seconds), and disconnected (after Leave Room, or when reload cannot resume a pending attempt). Never render or claim a fifth "connected to peer" or "online" state anywhere in the UI, in Session Pack JSON, or in any exposed tool output — this shell has no real signaling channel and must not fabricate a remote peer.
- File-queue contract: choosing a local file must add its filename (and size) to the visible queue immediately, independent of connection state and without requiring a recipient or connected peer; each queued file keeps its own name distinct from other queued files and carries status not-started.
- Persist local peer identity (name, generated client identifier), the last-entered room or peer identifier, chat transcript, file queue, and theme choice in localStorage (or equivalent client storage) so a reload restores them; the connection state itself must never restore as connecting or waiting.
- Seed the workspace with a local peer identity and at least 2 demo/loopback chat lines so it is non-empty on first load.
- The useful end state is the Session Pack: Export Session must produce Session Pack JSON that contains the session's actual peer, roomId, messages, fileQueue, and theme, with Copy and Download, and that JSON must round-trip through Import Session while conforming to the declared field contract.
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
- Artifact operations: import; export; copy
- Export formats: session-json

Mechanics exclusions:
- Real peer connection and file-picker interaction stay Playwright-observed
- Tool output cannot prove a peer connected
- Session Pack download contents and clipboard text stay Playwright-observed

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
