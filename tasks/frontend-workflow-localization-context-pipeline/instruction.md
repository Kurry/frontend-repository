<summary>
A fictional product team is localizing a bounded interface catalog into three fixture locales fr-FR, de-DE, ja-JP. The user groups source strings, inspects screenshot context, authors locale variants with typed placeholders and plural/select branches, compares revisions, previews deterministic layout fit and fallback, routes linguistic/context/visual reviews, repairs parity failures, handles partial package export, approves a release, and exports exact JSON/XLIFF/CSV artifacts. This is not a translation textarea or CMS, it is a hard browser app for contextual string localization utilizing Tailwind CSS 4.3.2. All assets must be loaded locally without CDNs.
</summary>

<core_features>
- Source-unit and context graph: View a fictional interface with 80 source units across 12 screens. Selecting a unit highlights its screen region, related terms, dependency/fallback nodes, locale rows, review history, and artifact entry.
- Structured message editor: Bounded syntax supporting text, typed placeholder, plural, select, and number/date fixture format nodes with nesting depth less than or equal to 3. Users edit in synchronized structure/text views. AST must preserve required placeholders, types, plural categories, select keys, and escaping. Invalid edits remain draft with exact parser/path error.
- Locale revision branches: Each locale unit has draft/reviewed/approved revision lineage with text/AST, author persona, rationale, source revision, and timestamps. Editing reviewed content creates a child revision. Compare highlights text, node, placeholder, branch, punctuation, and source changes; merge resolves each AST path conflict.
- Terminology and consistency graph: Fixture terms have allowed/preferred/forbidden locale forms, part-of-speech tag, case behavior, and screen context. Users bind exact target spans to term ids. A graph surfaces shared term/unit relationships and inconsistent/forbidden uses. Term revision marks affected locale reviews stale but never rewrites messages.
- Screenshot and responsive fit preview: Target messages render into deterministic fixture boxes at 1440/768/375 using bundled metric tables. Preview controls substitute valid fixture placeholder/plural/select values and show line breaks, truncation, clipping, overlap, and expansion ratio. Editing layout is out of scope; a typed compact-copy exception may choose a distinct locale revision.
- Fallback and completeness matrix: Fallback chains are target locale to language fixture to source and must be acyclic. A matrix distinguishes missing, draft, parser-invalid, structurally invalid, visual-overflow, terminology issue, in-review, approved, source-stale, and fallback-used. Selecting any cell filters exact units without changing content.
- Review and package workflow: Units route translate to structural check to linguistic review to context review to visual review to approved. Reviewers accept/reject with exact AST/span/screenshot evidence. A source change invalidates target revisions under declared change classes. Packaging emits each locale catalog, XLIFF, context manifest, and QA CSV; first run deterministically fails one locale catalog and XLIFF checksum, with failed-only retry preserving successes.
- Responsive pipeline and artifacts: Desktop shows unit tree/matrix, editor/AST, screenshot/fit, and terminology/review rail. Mobile becomes unit/locale cards, structured-node sheets, context preview carousel, vertical revision/review lineage, and package stepper. Export produces canonical JSON, locale JSON catalogs, declared XLIFF subset, CSV QA/revision ledger, and SVG completion/fallback report; import reconstructs state exactly.
</core_features>

<visual_design>
- Inspect source/target/draft/invalid/missing/overflow/fallback/stale/reviewed/approved/package states and AST/text/context hierarchy with legibility without color alone.
- Utilize Tailwind CSS 4.3.2 for styling.
</visual_design>

<motion>
- Edit branch/reflow preview, propagate term/source stale, transition matrix/reviews, retry package, then repeat reduced causing causal endpoints and state agree.
- Causal motion: AST branch changes, preview reflow, matrix/fallback transitions, source stale propagation, and package retry explain cause; reduced motion retains text/path/state/count deltas.
</motion>

<requirements>
- LocalizationRelease uses schemaVersion localization-release/v1 and stores fixture/hash/Unicode normalization, source units/revisions/context/screens/regions, target locale revision DAGs/text/AST/source bindings, placeholders/plural/select/format definitions, terminology revisions/span bindings, fallback graph, preview substitutions/fit results, review events/approvals/staleness, package attempts/files/status, filters/annotations/history, derived parser/structure/term/fit/completeness/artifact checksums, locale JSON, XLIFF, CSV, SVG, and UTC exportedAt.
- Text uses declared normalization; AST nodes/ids/paths are stable and valid under depth/escaping/type rules.
- Target AST preserves exact required placeholder names/types and locale plural/select categories; formatted fixture substitutions are deterministic.
- Revision/term/fallback graphs are acyclic; span bindings use half-open code-point offsets against exact revision.
- Fit uses fixed metric/box/line rules per screen/viewport/substitution; fallback resolution and completeness states are exact.
- Review/package events append; approvals reference current source/target/term/fit checksums; failed-only retry is idempotent.
- Locale JSON AST/text, XLIFF unit/segment/notes/state/placeholder ids, CSV rows, and SVG counts/edges agree with approved canonical release.
- Import rejects fixture/normalization mismatch, parser/AST/placeholder/plural/select/term/span/fallback error, revision cycle, stale/forged review/package/checksum, unsafe XML/SVG, or artifact disagreement atomically.
- Canonical re-export changes only exportedAt; locale JSON, XLIFF, CSV, and SVG remain byte-identical.
- All assets must be loaded locally without CDNs.
</requirements>

<webmcp_action_contract>
Contract version: zto-webmcp-v1

Modules:
- structured-editor-v1
- entity-collection-v1
- artifact-transfer-v1

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
  "purpose": "List, table, and hierarchy management for domain entities.",
  "permitted_operations": ["list", "get", "create", "update", "delete", "filter", "sort"],
  "binding_keys": {
    "required_any_of": [["entity_types"]],
    "optional": ["entity_properties", "filter_fields", "sort_fields", "visible_postconditions"]
  },
  "restrictions": [
    "No DOM traversal queries.",
    "Pagination must use abstract cursors or offsets, not infinite-scroll simulation."
  ],
  "tool_name_prefix": "collection"
}
</module_spec>

<module_spec id="artifact-transfer-v1">
{
  "id": "artifact-transfer-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Artifact transfer",
  "purpose": "Import and export of domain files.",
  "permitted_operations": ["export", "import", "download", "upload"],
  "binding_keys": {
    "required_any_of": [["artifact_formats"]],
    "optional": ["artifact_types", "transfer_modes", "visible_postconditions"]
  },
  "restrictions": [
    "No raw filesystem paths.",
    "Must output deterministic strings or standard encodings (base64, utf-8)."
  ],
  "tool_name_prefix": "artifact"
}
</module_spec>
</webmcp_action_contract>
