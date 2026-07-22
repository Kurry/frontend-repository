# Stage Blocking Path Studio

## <summary>
You will build a deterministic, framework-agnostic spatiotemporal performance planner and blocking studio for a fictional stage scene, "The Last Lantern." The application must orchestrate actor and prop movement, custody handoffs, entrance/exit timing, collision and sightline analysis, branch repair, and export artifacts. The signature interaction is dragging a path waypoint at one scene beat while actor positions, travel feasibility, collision/sightline overlays, dialogue focus, prop custody, entrance timing, cue anchors, rehearsal trace, and artifacts update together. The application operates entirely in-memory with no localStorage or backend persistence. Built with React and Tailwind CSS 4.3.2. All dependencies must be npm-local (no CDNs).
</summary>

## <core_features>
Stage and Entity Placement: Provide a 12x8-meter stage polygon with three entrances and 10 scenic obstacles/zones. Actors (5) and props (6) occupy circle/rectangle footprints on a 0.1-meter grid with facing direction. Ensure positions stay in accessible stage/entrance zones and outside obstacles.
Beat-Aligned Path Editor: Implement waypoints for each actor/prop keyed to scene beat (1 to 48) with x/y/facing, movement type, and hold. Paths interpolate linearly between beats under speed bounds. Allow dragging, inserting, deleting, copying, mirroring, and retiming waypoints. Duplicate beat points and impossible travel must remain preview-only.
Collision, Aisle, and Accessibility Analysis: Sample paths at declared beat fractions to detect actor/prop/obstacle collisions, blocked entrances, inaccessible path/turn radius, and required clear aisle. Selecting a finding must highlight exact entities, beat interval, sampled positions, and repair options.
Sightline and Dialogue Focus: Implement raycasting from audience sample points to the speaking actor’s center, respecting scenic/actor occlusion. Dialogue blocks declare primary speaker and optional addressed actor; facing and distance rules apply. Provide a heatmap by beat showing sightline/focus coverage.
Entrance, Exit, and Scene Continuity: Restrict actor entrances/exits to assigned entrances; they cannot appear onstage before/after state. Ensure costume/role changes enforce offstage duration. Scene beat blocks bind dialogue/action objective, required people/props, and technical cue anchors.
Prop Custody and Handoffs: Guarantee each prop has exactly one location/custodian at every beat. Require spatial proximity, free-hand fixture, and valid state for pickup, set-down, pass, conceal, reveal, and preset events. Handoffs must animate owner-to-owner and update prop path.
Branch, Rehearsal, and Repair: Enable blocking variant forks, allowing comparison of positions, paths, and timing, and merging of ranges. Provide a logical rehearsal that advances beats and records late/early/missed path/cue/handoff events. Require absence/delayed-entrance repair (e.g., understudy substitution, reroute) as future-only branches, keeping completed beats immutable.
Export and Artifacts: Produce canonical JSON (schemaVersion: "stage-blocking-score/v1"), SVG stage maps at key beats plus a path atlas, CSV waypoint/custody/rehearsal ledger, and a Markdown script. Provide import that reconstructs state exactly and rejects any mismatches or forged data.
</core_features>

## <visual_design>
Layout: The desktop layout features a stage/path canvas, beat timeline, continuity/custody graph, and analysis/rehearsal rail. Mobile layout transforms to a stage mini-map, actor/waypoint cards, vertical beat/entrance/custody lineage, finding drilldowns, and rehearsal controls.
Hierarchy and Legibility: Clearly distinguish selected, waypoint, path, hold, collision, inaccessible, occluded, focus, offstage/onstage, prop custody, completed, disrupted, and approved states.
Grid and Canvas: Draw a clean 0.1-meter grid (visualized appropriately for scale).
</visual_design>

## <motion>
Causal Animation: Waypoint/path travel, focus/occlusion changes, handoff owner flow, and absence repair must explain cause through smooth transitions.
Reduced Motion: When prefers-reduced-motion is active, retain sampled path/beat/status deltas but disable smooth interpolations between states.
</motion>

## <requirements>
All application state must be strictly in-memory (no localStorage, sessionStorage, IndexedDB, or backend).
The application must serve on port 3000 (npm start must run the application or serve the built output dist/ on port 3000).
The app must start with immutable stage/scene/actors/props and flawed starter blocking with no user edit, branch, rehearsal, approval, annotation, or export.
Moving one waypoint must predictably change interpolated positions, collisions, cue timing, handoff feasibility, rehearsal trace, WebMCP state, and downloadable artifacts.
Provide keyboard paths for all actions: placement, facing, waypoint editing, beat/cue changes, prop custody, branching, rehearsal, findings navigation, and export.
Provide a responsive layout that remains fully functional on 1440px, 768px, and 375px widths.
Support 200 actors/props, 10,000 beats/waypoints, and 1,000 rehearsal branches responsively; cancel stale sampling/raycast work during interactions.
Built with React and Tailwind CSS 4.3.2. All dependencies must be npm-local (no CDNs).
</requirements>

## <webmcp_action_contract>
The application must expose a WebMCP v1 compliant contract bound to the global window object:
- window.webmcp_session_info: Must export { schemaVersion: "zto-webmcp-v1", supportedModules: ["stage-blocking"] }.
- window.webmcp_list_tools(moduleName): Must return an array of available operations including mutations, analysis, branching, and exports.
- window.webmcp_invoke_tool(moduleName, toolName, params): Must implement the required orchestration primitives safely without DOM coupling.
</webmcp_action_contract>
