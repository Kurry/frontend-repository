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

Feature: Chunked transfer simulation (local loopback, per-file progress) —
- Every queue row whose status is Not Started shows a Start control; activating Start begins a local loopback chunked-transfer simulation for exactly that file: the row's status changes to Transferring and a per-row progress bar plus a numeric readout (bytes transferred of the file's total bytes, and a percent) advance in visible increments until the full sizeBytes has been processed, at which point the status becomes Completed and the readout shows 100 percent. Progress totals always equal the chosen file's real sizeBytes — never an unrelated fabricated number — and no wording anywhere claims a remote peer received, downloaded, or acknowledged the file; completion labels the local simulation only
- While a row is Transferring, its Start control is replaced by Pause and Cancel; Pause freezes the progress bar and numeric readout at their current values and sets status Paused; Resume continues from exactly the frozen value, never restarting from zero; Cancel sets status Canceled, keeps the partial progress readout visible, and offers a Retry control
- Retry on a Canceled or Completed row resets exactly that row's progress to zero and status to Not Started so a fresh Start can run again
- A zero-byte file completes immediately at 100 percent with no malformed readout; multiple rows can transfer at the same time, each advancing its own progress independently

Feature: Queue multi-select, batch actions, and drag reorder —
- Each queue row carries a selection checkbox and the queue header carries a select-all checkbox; selecting at least one row reveals a bulk action bar showing the selected count (for example "2 selected") with Remove Selected and Retry Selected controls; clearing the selection hides the bar
- Remove Selected deletes exactly the selected rows (the row count drops by the selection size and unselected rows are untouched); removing every row returns the queue to its empty state and clears the select-all checkbox
- Retry Selected resets every selected Canceled or Completed row to Not Started with zeroed progress and leaves selected Transferring or Paused rows unchanged
- Each row carries a drag handle; dragging a row to a new position reorders the queue visibly, the new order survives a reload, and the fileQueue array in Session Pack exports serializes rows in the on-screen order

Feature: Transfer log and transcript export —
- An append-only transfer log panel lists one timestamped entry per queue lifecycle event — queued, started, paused, resumed, canceled, completed, retried, removed — newest first, each entry naming its file; entries appear immediately when the action happens and earlier entries are never rewritten or deleted by later actions
- An Export Transcript control opens a surface with a markdown transcript document compiled live from the store — one line per chat message carrying its role label (local or demo) and timestamp in transcript order — with Copy (clipboard confirmation) and Download (real client-side .md download whose contents match the preview); a distinctive line sent this session must appear in the document

Feature: API-shaped field contracts (forms submit would-be request bodies) —
- PeerIdentity update payload (the display-name field commits exactly this body; the stored peer record IS the would-be request body): required displayName — trimmed non-empty string, length at least 1 and at most 40 characters. Whitespace-only or longer than 40 characters shows an inline message naming the displayName field and leaves the last valid name unchanged
- JoinSession payload (Join Room submits exactly this body; the pending session record IS the would-be request body): required roomId — trimmed non-empty string, length at least 1 and at most 64 characters, matching only the characters A–Z, a–z, 0–9, hyphen, and underscore (no spaces or other punctuation). Empty, over-long, or illegal-character roomId shows an inline message naming the roomId field, starts no connection attempt (badge stays idle), and the error clears once a valid roomId is typed
- ChatMessage create payload (the composer submits exactly this body; each appended transcript line IS the would-be request body plus generated id/createdAt): required text — trimmed non-empty string at most 2000 characters. Whitespace-only text adds no transcript line; text longer than 2000 characters shows an inline message naming the text field and adds no line
- FileQueueEntry records created by choosing a file carry: required name (non-empty string), required sizeBytes (non-negative integer), required status exactly one of the closed enum not-started, transferring, paused, completed, or canceled (always not-started at creation), and required bytesTransferred (integer from 0 to sizeBytes, 0 at creation). Those same field names, types, and the closed status enum appear in Session Pack export and are required again on Import
- TransferLogEntry records carry: required id (string), required at (ISO-8601 date-time), required fileName (non-empty string), and required event exactly one of the closed enum queued, started, paused, resumed, canceled, completed, retried, or removed; the same shape appears in Session Pack export and is required again on Import
- Violations always name the offending field inline next to it (not a browser alert). Records created by forms ARE the would-be request bodies: the same field names, bounds, and enums appear in the live Session Pack JSON export

Feature: Session Pack export and import (the app produces the user's session files) —
- Export Session opens a drawer or dialog with a live Session Pack JSON preview regenerated from the current store, plus Copy (clipboard confirmation) and Download (real client-side .json download whose contents match the preview)
- Session Pack JSON is a single object whose top-level field contract is: schemaVersion (exactly the string weblink-session-v2), exportedAt (ISO-8601 date-time), peer (object with required displayName and clientId strings), roomId (string, may be empty when never joined), theme (exactly one of the closed enum light or dark), messages (array of message objects), fileQueue (array of FileQueueEntry objects in the on-screen queue order), and transferLog (array of TransferLogEntry objects)
- Each message object must include: id (string), text (string), role (exactly one of local or demo), and createdAt (ISO-8601 date-time). Each fileQueue object must include: id (string), name, sizeBytes, status from the closed enum, and bytesTransferred from 0 to sizeBytes. The pack must never claim a peer connected, must never serialize connection state as connecting or waiting, and must never serialize a fileQueue status of transferring — a row that is mid-transfer at export time serializes as paused at its current bytesTransferred
- Export content that omits the session's actual work is invalid: after editing the display name, joining a distinctive roomId, sending a distinctive chat line, queueing a file, and starting then pausing its transfer, the Session Pack preview, Copy, and Download must contain that displayName, roomId, chat text, file name, the row's paused status with its non-zero bytesTransferred, and the matching transfer-log entries, and must still show every required top-level key from the field contract
- Import Session accepts a pasted or file-picked Session Pack JSON; export and import compile and validate against that same schema. A valid import replaces peer displayName, roomId, theme, messages, fileQueue (statuses, bytesTransferred, and order included), and transferLog so the panels and a fresh Export match the pack (connection badge resumes at rest — idle or disconnected). Malformed JSON or a document that fails the field contract (wrong schemaVersion, theme outside light|dark, message role outside local|demo, fileQueue status outside the closed enum or equal to transferring, bytesTransferred negative or greater than sizeBytes, transferLog event outside the closed enum, displayName outside 1–40 characters, roomId with illegal characters when non-empty, missing required keys) shows validation naming the offending field and changes nothing
</core_features>

<user_flows>
User flows (each chain must hold end to end):
- Join-and-chat flow: entering a roomId that satisfies the JoinSession field contract and choosing Join Room moves the connection badge from idle to connecting and then to waiting for peer within 5 seconds, the chat composer becomes enabled at the same moment the badge leaves idle, and submitting one valid ChatMessage adds exactly one new right-aligned line to the transcript immediately (the transcript line count increases by exactly one). Reloading the page afterward restores the peer identity, the last-entered roomId, and the seeded plus the newly sent chat line in the same order, while the connection badge resumes at rest (idle or disconnected), never at connecting or waiting
- File-queue flow: with the queue empty and its empty-state message showing, choosing two different local files replaces the empty state with exactly two queue rows, each carrying its own file name, its own size, and a Not Started status; the rows appear regardless of connection state. Reloading the page restores both rows with the same names, sizes, statuses, and order, and the connection badge is back at rest
- Leave-and-rejoin flow: choosing Leave Room while waiting flips the connection badge to disconnected immediately, the chat composer disables and its explanatory note appears in the same moment, and the transcript keeps every previously sent line; entering a new valid roomId and choosing Join Room again starts a fresh attempt whose badge walks idle-to-connecting-to-waiting exactly as the first did
- Transfer lifecycle flow: queue one file and choose Start; the row's status flips to Transferring and its progress readout advances; Pause freezes the readout at its current value; Resume continues from exactly that frozen value (the readout is never lower afterwards); Cancel sets Canceled while keeping the partial readout; Retry returns the row to Not Started at zero. After the sequence the transfer log shows one entry per action in order, and opening Export Session shows the row's current status and bytesTransferred plus those log entries
- Batch queue flow: queue three files, select two via their row checkboxes; the bulk action bar appears showing "2 selected"; Remove Selected leaves exactly the one unselected row and the log gains one removed entry per deleted file; selecting the survivor and choosing Retry Selected after it completed returns it to Not Started at zero progress
- Reorder flow: with three queued rows, drag the first row's handle to the last position; the on-screen order updates immediately, reloading the page preserves the new order, and the Session Pack fileQueue array lists the rows in that same order
- Transcript artifact flow: send a distinctive chat line, open Export Transcript, and confirm the markdown document contains that line with its role label and timestamp in transcript order; Copy confirms; Download produces a real .md file matching the preview
- Artifact end state: edit displayName to a distinctive valid value, join a distinctive valid roomId, send a distinctive chat line, queue one file and start then pause its transfer, open Export Session and confirm the Session Pack preview still shows schemaVersion weblink-session-v2 plus peer, roomId, theme, messages, fileQueue, and transferLog keys from the field contract with those live values (the paused row carrying its non-zero bytesTransferred); Copy confirms; Download then Import Session of that same JSON reconstructs the same displayName, roomId, transcript lines, file queue (statuses, progress, and order), transfer log, and theme, with the connection badge at rest
- Reloading the page at any point restores the local peer identity (name and client ID), the last-entered room or peer identifier, the seeded plus any locally sent chat lines, the file queue (statuses, per-row progress, and order), the transfer log, and the theme choice from local storage; the connection badge always resumes at rest (idle or disconnected), never at connecting or waiting, and a row that was Transferring at reload time restores as Paused at its saved progress, never as Transferring
</user_flows>

<edge_cases>
- Activating Join Room with an empty roomId, a roomId longer than 64 characters, or a roomId containing spaces or other illegal characters starts no connection attempt: an inline error names the roomId field, the badge stays on its idle label, and no other panel changes
- Entering a second room or peer identifier after a first replaces the value shown in the join field; the field always reflects only the latest value typed
- When no files are queued, the file-transfer panel shows an empty-state message in place of table rows explaining that chosen files will appear there
- Sending a message consisting only of whitespace, or a message longer than 2000 characters, adds no transcript line; whitespace clears or keeps the input without appending anything, and over-long text shows an inline message naming the text field
- Choosing the same file twice in a row still yields distinct visible rows rather than silently merging them, so the queue row count always equals the number of choose actions' files
- Editing displayName to whitespace-only or longer than 40 characters shows an inline message naming the displayName field and leaves the last valid name unchanged
- Importing malformed Session Pack JSON, or parseable JSON that fails the field contract (wrong schemaVersion, theme outside light|dark, invalid message role, fileQueue status outside the closed enum or equal to transferring, bytesTransferred outside 0 to sizeBytes, transferLog event outside the closed enum, displayName outside bounds, illegal roomId characters when non-empty, missing required keys), leaves peer, transcript, queue, transfer log, and theme unchanged and shows validation naming the offending field
- Pausing and resuming a transfer repeatedly never rewinds or loses progress: after each Resume the readout continues from the frozen value, and a Completed row always reads exactly 100 percent
- Canceling then retrying a row resets that row to Not Started at zero progress while the transfer log keeps the earlier canceled entry — the log is append-only and later actions never rewrite or remove earlier entries
- Selecting every row and choosing Remove Selected returns the queue to its empty-state message, hides the bulk action bar, and clears the select-all checkbox
- Dropping a dragged row back onto its original position leaves the queue order unchanged with no duplicated or lost rows
- Starting a transfer for a zero-byte file completes it immediately at 100 percent with no malformed readout (no NaN or negative values)
</edge_cases>

<visual_design>
- Three-column communication workspace on desktop: a session/identity column on the left, the chat transcript and composer in the center as the primary visual focus, and the file-transfer queue on the right as secondary content
- The connection badge is a small pill with distinct background/text colors per state (idle, connecting, waiting, disconnected) so the state is visually legible at a glance, not just from its label text
- Chat bubbles distinguish the local user's own sent messages (right-aligned, filled accent color) from seeded demo/loopback lines (left-aligned, neutral surface)
- The file queue renders as a compact table with a selection checkbox, drag handle, Name, Size, Status, and Progress per row; each of the five queue statuses (Not Started, Transferring, Paused, Completed, Canceled) renders as a small pill with a visually distinct background/text color so status is legible at a glance, not just from its label
- Each queue row's progress renders as a horizontal bar paired with a numeric readout (percent plus bytes transferred of total)
- The bulk action bar appears only while at least one row is selected, showing the selected count beside Remove Selected and Retry Selected
- The transfer log renders as a timestamped list, newest entry first, each entry pairing the event name with its file name
- Every labeled control and status region pairs its text with a small icon from one consistent icon set (session, chat, file-transfer, theme, and Export/Import controls all carry icons in the same visual style and stroke weight)
- Supports a light and a dark surface, switchable from a chrome control near the top of the page; both surfaces keep the same layout and badge color coding, only recoloring backgrounds, borders, and text
</visual_design>

<motion>
- Buttons (Join Room, Leave Room, theme toggle, choose-file, Export Session, Import Session, Copy, Download) apply a hover background/shadow change and a brief scale-down on press
- The connection badge transitions its background and text color smoothly whenever the connection state changes (idle to connecting, connecting to waiting, waiting to disconnected)
- A newly sent chat message animates into the transcript with a brief slide/fade rather than appearing instantly, and newly added file queue rows animate in the same way
- File queue rows and chat composer controls apply a hover or focus wash (row background tint on hover, focus ring on the composer input) so interactive chrome never looks static
- Inline field-contract errors (join, display name, composer, import) appear with a short fade or slide rather than popping in
- Transfer progress bars animate their fill smoothly between increments rather than jumping in hard steps, and the paired numeric readout updates in the same moment
- The bulk action bar slides or fades in when the first row is selected and out when the selection clears; new transfer-log entries animate in with a brief slide or fade
- While a queue row is being dragged it lifts visually (shadow or slight scale) and settles into place on drop
- Switching between light and dark surfaces recolors backgrounds, borders, and text with a short smooth transition rather than an instant flip
- With prefers-reduced-motion set, entrance and transition animations are removed and state changes apply instantly while every feature remains usable
</motion>

<responsiveness>
- At mobile width, the three columns restack vertically in session, chat, then file-transfer order, keeping the chat/composer and Export/Import controls reachable without horizontal scrolling
- At 375 pixel width no content clips or overflows the viewport and no horizontal scrollbar appears; the queue table stays readable by scrolling inside its own panel if needed, and each row's progress readout, status pill, and transfer controls stay reachable
- On touch or narrow viewports where dragging a row is impractical, the keyboard/button reorder alternative remains available so reordering is never desktop-only
</responsiveness>

<accessibility>
- Every interactive control (name field, identifier field, Join Room, Leave Room, theme toggle, composer, choose-file, per-row Start/Pause/Resume/Cancel/Retry, row checkboxes, select-all, Remove Selected, Retry Selected, Export Session, Import Session, Export Transcript, and export Copy/Download) is reachable and operable with the keyboard alone, with a visible focus indicator
- Each row's transfer progress is exposed with progress semantics (a progressbar role carrying the current value, or equivalent visible text tied to the row), and each row checkbox is labeled with its file's name
- Drag reorder has a keyboard-operable alternative (for example move-up/move-down controls or a keyboard-activated handle) that achieves the same reordering
- The connection badge's current state is exposed as text (not color alone) and state changes are announced through an aria-live polite region
- Inline field-contract errors (displayName, roomId, text, Import) are programmatically associated with their fields and announced when they appear
- The disabled chat composer exposes its disabled state to assistive technology, and the nearby explanatory note is readable text in the DOM, not a tooltip-only hint
- The Export Session and Import Session surfaces use dialog or complementary semantics: focus moves into the surface on open, Escape closes it, and focus returns to the invoking control on close
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors or warnings appear on load or during a full exercise of joining, leaving, chatting, queueing files, exporting, importing, toggling theme, and reloading
- Rapid repeated input (fast typing in the composer, quick Join/Leave toggling, rapid Pause/Resume clicking) causes no hangs, duplicated transcript lines, or dropped interactions
- Ten queued files transferring at the same time keep every progress bar and readout advancing without frozen readouts or dropped frames, and a transfer log holding 50 or more entries scrolls without lag
</performance>

<writing>
- Control labels are specific verbs or verb phrases (Join Room, Leave Room, Send, Export Session, Import Session, Copy, Download) with one consistent capitalization convention across the app
- The seeded demo lines are explicitly labeled as local/demo content so they cannot be read as messages from a real peer
- Empty states, the disabled-composer note, and field-contract error messages name the situation and the offending field; no lorem ipsum or placeholder text appears anywhere in the shipped UI
- The five queue status labels (Not Started, Transferring, Paused, Completed, Canceled) are worded identically everywhere they appear (row pills, transfer log, export preview), and no transfer copy claims a remote peer received or downloaded a file
</writing>

<requirements>
- Use SolidJS with Solid stores for all shared application state: the peer identity, connection state, room/peer identifier, chat transcript, file queue (including per-row status, bytesTransferred, and order), queue selection set, transfer log, theme, and UI chrome all live in one shared store that every panel derives from — never a second disconnected copy — and WebMCP tool handlers invoke the same store commands as the visible controls.
- Styling is Tailwind CSS 4.3.2, pinned, with design tokens in the Tailwind theme.
- Kobalte components for the interactive chrome: text fields, buttons, the theme toggle switch, Export/Import dialogs, and any tooltip or toast surfaces.
- Vanilla Motion (motion.dev) and CSS transitions are allowed for animation; no other animation libraries.
- Tabler icons via @tabler/icons-solidjs only; no other icon sets, no raw pasted SVGs, no icon CDN.
- All forms — PeerIdentity (display name), JoinSession (roomId), ChatMessage (composer text), and Import Session — validate through a Zod schema driven by TanStack Form for Solid. Schemas are API-shaped: they mirror the PeerIdentity, JoinSession, ChatMessage, FileQueueEntry, TransferLogEntry, and Session Pack payloads declared in core features (required fields, 1–40 displayName, 1–64 roomId character class, 1–2000 chat text, theme light|dark, message role local|demo, fileQueue status in the closed enum not-started|transferring|paused|completed|canceled, bytesTransferred 0..sizeBytes, transferLog event in the closed enum, schemaVersion exactly weblink-session-v2). The record a form creates IS the would-be request body; Session Pack export and Import validate against those same schemas. Inline per-field errors appear before submit, naming the offending field.
- No authentication wall — open directly into the primary communication workspace.
- Connection-state machine contract: exactly four visible states — idle (no room/peer identifier entered or session left), connecting (immediately after Join Room), waiting for peer (after the connection attempt settles within 5 seconds), and disconnected (after Leave Room, or when reload cannot resume a pending attempt). Never render or claim a fifth "connected to peer" or "online" state anywhere in the UI, in Session Pack JSON, or in any exposed tool output — this shell has no real signaling channel and must not fabricate a remote peer.
- File-queue contract: choosing a local file must add its filename (and size) to the visible queue immediately, independent of connection state and without requiring a recipient or connected peer; each queued file keeps its own name distinct from other queued files and carries status not-started with bytesTransferred 0.
- Transfer-simulation contract: Start processes the chosen file's actual bytes client-side in fixed-size chunks (for example reading the File in slices); the progress readout derives from bytes actually processed against the file's real sizeBytes, never from a timer disconnected from file size; Pause/Resume checkpoint at chunk boundaries so Resume continues from the frozen byte count; no transfer surface, log entry, or export ever claims a remote peer received a file.
- Persist local peer identity (name, generated client identifier), the last-entered room or peer identifier, chat transcript, file queue (per-row status, bytesTransferred, and order), transfer log, and theme choice in localStorage (or equivalent client storage) so a reload restores them; the connection state itself must never restore as connecting or waiting, and a mid-transfer row restores as paused at its saved progress, never as transferring.
- Seed the workspace with a local peer identity and at least 2 demo/loopback chat lines so it is non-empty on first load.
- The useful end state is the Session Pack plus the transcript document: Export Session must produce Session Pack JSON that contains the session's actual peer, roomId, messages, fileQueue (statuses, progress, order), transferLog, and theme, with Copy and Download, and that JSON must round-trip through Import Session while conforming to the declared field contract; Export Transcript must produce the markdown transcript with Copy and Download.
- Keep the implementation frontend-only and self-contained: no backend, no real WebRTC signaling or peer connection, no outbound network calls, and no outbound navigation from any control.
- Build tooling: Vite (or an equivalent SPA setup). All libraries installed via npm and bundled locally; no CDN imports of any library, font, or icon set.
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in `/app`; scaffold under `/app` as needed for the stack in `<summary>`; `/app/package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds); run via `npm start` on port 3000; do not iframe, proxy, or fetch the product from another origin.
- Before you finish, run `npm run verify:build` and confirm it exits 0, then run `npm start` and confirm the app serves on port 3000. This is your responsibility: the verifier runs the same `verify:build` gate first, and an app that fails it is not served or judged and scores 0 outright — no partial credit for a build that does not come up.
- WebMCP is a required delivery step, not a scoring criterion; implement exactly the `<webmcp_action_contract>` below; register tools yourself from `<module_spec>` + Bindings using the same handlers as the visible UI; honor mechanics exclusions; optional self-test via `webmcp_session_info` / `webmcp_list_tools` / `webmcp_invoke_tool` only.
- Self-test tooling is preinstalled: the same CDP bridge the verifier runs is baked at `/opt/webmcp/webmcp_stdio_server.mjs`, and a shared headless Chrome already exposes CDP at `http://127.0.0.1:9222`. Open your served app in that Chrome, then run `node /opt/webmcp/webmcp_stdio_server.mjs` (stdio MCP; defaults to that endpoint) to exercise your registered `window.webmcp_*` tools exactly as the verifier will.
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
