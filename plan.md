1.  **Draft Task Artifacts Foundation**:
    *   Initialize `task.toml` for the task `frontend-creative-tools-fictional-darkroom-test-strip-mask-composer`.
    *   Initialize `instruction.md` precisely using the proposal details, observing the strict layout and <webmcp_action_contract> ordering requirements.
    *   Run `uv run corpuscheck scaffold` to generate standard test dimensions.
    *   Create tailored TOML files for `core_features`, `visual_design`, `motion`, and `technical` dimensions, each mapping exactly to the PRD requirements.
    *   Iterate with `uv run corpuscheck propagate` and `uv run corpuscheck validate` until all structure/layout checks pass.
    *(Completed)*

2.  **Oracle App Bootstrapping**:
    *   Initialize a Vite + React + TypeScript app in `solution/app` (react-ts template).
    *   Install mandated dependencies (`zustand`, `framer-motion`, `zod`, `tailwindcss` / `@tailwindcss/vite`, `lucide-react`).
    *   Fix the `tsconfig.json` `erasableSyntaxOnly` compiler option.
    *   Ensure the local build script `verify:build` succeeds.
    *   Set up a mock `evidence.webm` structure that won't fail validation.
    *(Completed)*

3.  **Core State Management & Domain Logic**:
    *   Implement the deterministic domain rules: half-open `[x, x+w)` millimeter geometry, rational arithmetic for cell exposure coverage (intersection where covered area is >= half of a cell).
    *   Implement data models (`StripRecord`, `ExposurePassRecord`, `ZoneDecisionRecord`, `NegativeRecord`, `HistoryEvent`).
    *   Build a robust state store using `zustand` to house the negative raster, strip metadata, pass stack, calibration sources, history (Event DAG), selected items, and views.
    *   Implement the core reducer responsible for canonical mutation handling, ensuring pass edits produce stable hashes, correctly recalculate intersections and effective exposures without dropping fractional precision (milli-deciseconds).
    *   Seed the store with the required starting plan: 3 read-only demonstration passes, 3 editable proposed passes (including `pass-04`), calibration sources, and the 48x32 negative fixture.

4.  **UI Implementation**:
    *   **Main Workspace**: A responsive grid containing the Canvas, Pass Stack, and Zone Evidence tools.
    *   **Millimeter Canvas**: Render the 160x40mm test strip. Map logical paper cells to visual boxes. Render masks with draggable handles (`Alt+Arrow` mapped for keyboard, touch steppers mapped for mobile). Implement immediate preview vs commit logic for drag gestures.
    *   **Pass Stack**: Display editable passes, allowing duplication, merging, and splitting. Ensure drag and drop for reordering works accurately without changing cumulative exposure sums.
    *   **Linked Zone Evidence**: Density curve, histogram, contact sheet. Brushing must highlight cross-linked elements.
    *   **Intersection Matrix**: Visual grid representing overlaps between passes and zones.
    *   **Decisions & Corrections**: Zone selection leading to a decision record. A correction flow (e.g. changing `outputFactorMilli`) that allows rebasing the recipe.
    *   **History & Review**: History DAG view, compare checkpoint wipe, review blocker checklist.

5.  **WebMCP Contract Integration**:
    *   Implement `window.webmcp_session_info`, `window.webmcp_list_tools`, and `window.webmcp_invoke_tool`.
    *   Map WebMCP actions like `commit_mask`, `set_canvas_viewport`, `commit_zone_decision`, etc., directly to the Zustard store's canonical reducers, bypassing transient UI state.

6.  **Artifact Generation (ZIP Import/Export)**:
    *   Implement the `jszip` or raw Blob-based zip builder for exporting the exact 9-file ZIP.
    *   Implement deterministic SVG generation for the proof and mask plan.
    *   Implement CSV formatting (`passes.csv`, `zone-samples.csv`).
    *   Build a rigorous import validator (Zod-driven) that accepts ZIP or JSON, validates schemas, hashes, and cell coverages, and atomically updates the store on success.

7.  **Final Verification**:
    *   Clean up all mock outputs.
    *   Generate a genuine `evidence.webm` using Playwright traversing the canonical flow.
    *   Remove `node_modules` from `solution/app`.
    *   Run `uv run corpuscheck validate --force --root tasks frontend-creative-tools-fictional-darkroom-test-strip-mask-composer` to verify a fully green build (excluding expected unregistered task errors).
