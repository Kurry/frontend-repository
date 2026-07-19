<summary>
Build a frontend-only, peer-to-peer WebRTC chat and file-transfer client using SolidJS, Solid stores, and Tailwind CSS.
</summary>

<reference_screenshots>
Screenshots of the reference application are provided in-container at
`/reference-screenshots/`: `overview.png` is a full-page desktop-layout
overview (downscaled); `segment-NN.png` are full-resolution 1440x900 sections
in top-to-bottom order with slight overlap. They are part of this instruction:
recreate what they show. Where a screenshot and the text conflict, the text
wins. Do not copy the images into `/app` or ship them as app assets.
</reference_screenshots>

<core_features>
Core features:
- The workspace opens directly into a communication shell: a session panel (peer name field, read-only client ID, room/peer identifier field, Join Room and Leave Room controls, connection badge), a chat panel (message history and message composer), and a file-transfer panel (a control to choose local files and a queue table) all render together instead of a generic starter page
- The session panel seeds a non-empty local peer identity on first load: an editable display name and a read-only generated client identifier, both visible without any action
- The chat panel opens with at least 2 seeded local/loopback demo lines so the transcript is non-empty on first load; these lines are clearly local/demo content, not messages from a real connected peer
- Entering a room or peer identifier and choosing Join Room starts exactly one connection attempt: the connection badge changes from its idle label to a connecting label, then within a few seconds settles into a waiting-for-peer label. At no point does the badge, chat panel, or any other visible text state that a peer has connected — there is no real signaling channel behind this shell
- Choosing Leave Room while connecting or waiting returns the connection badge to a disconnected label immediately; Join Room is available again afterward to start a new attempt
- While the session is connecting or waiting, the chat composer is enabled and appending a message adds it to the local transcript immediately, right-aligned to distinguish it from the seeded demo lines; while idle or disconnected, the composer is disabled and a nearby note explains that sending is unavailable because no session is active
- Choosing one or more local files through the file-transfer control adds one row per chosen file to the queue table immediately, each showing that file's own name and size and a Not Started status, with no recipient, room, or connected peer required; choosing a second, different file adds a second distinct row without overwriting or merging with the first
- Entering a second room or peer identifier after a first replaces the value shown in the join field; the field always reflects only the latest value typed
- Reloading the page restores the local peer identity (name and client ID), the last-entered room or peer identifier, the seeded plus any locally sent chat lines, and the file queue from local storage; the connection badge always resumes at rest (idle or disconnected), never at connecting or waiting, since no real peer session can survive a reload
</core_features>

<visual_design>
- Three-column communication workspace on desktop: a session/identity column on the left, the chat transcript and composer in the center as the primary visual focus, and the file-transfer queue on the right as secondary content
- The connection badge is a small pill with distinct background/text colors per state (idle, connecting, waiting, disconnected) so the state is visually legible at a glance, not just from its label text
- Chat bubbles distinguish the local user's own sent messages (right-aligned, filled accent color) from seeded demo/loopback lines (left-aligned, neutral surface)
- The file queue renders as a compact table with Name, Size, and Status columns; an empty state message appears when no files are queued
- Supports a light and a dark surface, switchable from a chrome control near the top of the page; both surfaces keep the same layout and badge color coding, only recoloring backgrounds, borders, and text
- At mobile width, the three columns restack vertically in session, chat, then file-transfer order, keeping the chat/composer reachable without horizontal scrolling
</visual_design>

<motion>
- Buttons (Join Room, Leave Room, theme toggle, choose-file) apply a hover background/shadow change and a brief scale-down on press
- The connection badge transitions its background and text color smoothly whenever the connection state changes (idle to connecting, connecting to waiting, waiting to disconnected)
- File queue rows and chat composer controls apply a hover or focus wash (row background tint on hover, focus ring on the composer input) so interactive chrome never looks static
- Switching between light and dark surfaces recolors backgrounds, borders, and text with a short smooth transition rather than an instant flip
</motion>

<requirements>
- Use SolidJS, Solid stores, and Tailwind CSS.
- No authentication wall — open directly into the primary communication workspace.
- Connection-state machine contract: exactly four visible states — idle (no room/peer identifier entered or session left), connecting (immediately after Join Room), waiting for peer (after the connection attempt settles), and disconnected (after Leave Room, or when reload cannot resume a pending attempt). Never render or claim a fifth "connected to peer" or "online" state anywhere in the UI or in any exposed tool output — this shell has no real signaling channel and must not fabricate a remote peer.
- File-queue contract: choosing a local file must add its filename (and size) to the visible queue immediately, independent of connection state and without requiring a recipient or connected peer; each queued file keeps its own name distinct from other queued files.
- Persist local peer identity (name, generated client identifier), the last-entered room or peer identifier, chat transcript, file queue, and theme choice in localStorage (or equivalent client storage) so a reload restores them; the connection state itself must never restore as connecting or waiting.
- Seed the workspace with a local peer identity and at least 2 demo/loopback chat lines so it is non-empty on first load.
- Keep the implementation frontend-only and self-contained: no backend, no real WebRTC signaling or peer connection, no outbound network calls, and no outbound navigation from any control.
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
