# CSS Theme Builder

Oracle implementation of the CSS Theme Builder reference app: a dense
three-panel theme studio (themes / editor / live preview) in vanilla JS on
Vite. All styling/runtime dependencies are bundled locally — DaisyUI and the
Tailwind browser runtime under `vendor/`, the Outfit variable font via
`@fontsource-variable/outfit`, and pako from node_modules. No CDN requests.

State is in-memory only (no localStorage/sessionStorage/IndexedDB); the
shareable theme payload lives in the same-document `#theme=` hash (JSON →
deflate → URL-safe Base64). WebMCP tool bindings (structured-editor-v1,
entity-collection-v1, artifact-transfer-v1) are registered on
`window.webmcp_session_info / webmcp_list_tools / webmcp_invoke_tool` and
drive the same handlers as the visible UI.

![App Screenshot](./screenshot_final.png)
