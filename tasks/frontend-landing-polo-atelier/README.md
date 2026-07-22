# Polo Atelier

Debranded immersive polo-factory-tour experience fidelity eval.

Inspiration URL: https://members-play.lacoste.com/polo-factory-experience/us/en/
(The Lacoste Polo Atelier Experience). The task recreates the experience's
structure and interaction ambition — preloader, lobby, three 3D machine halls
(knitting, dyeing, embroidering) each driven by a press-and-hold arcade
button, a schema-validated prize-draw entry form, and a confirmation chapter —
under the fully fictional brand **Heron & Loom**. No source-site asset, mark,
mascot, font, copy, or link may appear in a build; every asset is newly
authored. The debranded PRD adds the corpus-standard useful end state
(exportable atelier-pass JSON + WebMCP-queryable session state).

Reference specifics (for authoring/judging alignment):

- Chapters: preloader → lobby (mascot + floating polos) → Knitting → Dyeing →
  Embroidering → prize-draw entry → confirmation; halls unlock in order.
- Signature object: oversized three-part arcade push button with hold-to-charge
  (~1s), drain on early release, staged 4–7s machine run, spotlight polo reveal.
- Dyeing hall: six named dye swatches drive the polo color through the rest of
  the session and the export.
- Rotate-device overlay on portrait sub-tablet viewports; WebGL-absent 2D
  fallback must keep the tour completable.

A frontend-only Harbor eval task. A builder agent recreates the
app in `instruction.md`, delivering a self-contained SPA in `/app`
with `start` (port 3000) and `verify:build` scripts plus the
WebMCP tool surface from the action contract.

## Judging

The verifier serves the built app and grades it in a real browser
across 13 weighted dimensions; `pass` at reward >= 0.7. The judge
observes via Playwright MCP and drives state-changing setup through
the app's registered WebMCP tools (a task-local CDP bridge in
`tests/webmcp_stdio_server.mjs`). Criteria live in
`tests/<dimension>/<dimension>.toml`.

## Status

- Solution oracle: **pending** — to be harvested from a passing trial via the
  oracle-harvest workflow (`solution/solve.sh` currently expects
  `/solution/app`, which is not yet populated).
- Reference screenshots: not shipped; the source experience gates headless
  browsers ("Old browser") and its assets are proprietary. The instruction
  text is the sole normative reference.

## Running

    harbor run -p tasks/frontend-landing-polo-atelier -a claude-code -m sonnet
