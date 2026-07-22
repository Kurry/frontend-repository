# Task proposal: Multilevel Accessible Route Lab

**Proposed slug:** `frontend-planning-multilevel-accessible-route-lab`
**Genre:** `hard browser app/spatial planning tool`
**Source basis:** debranded from `ColumbiaMap`, `MapApplication`, and campus-orientation apps
**Target user:** Campus visitors planning a timed route across outdoor paths and multiple building floors under mobility constraints

<summary>
Build a "Multilevel Accessible Route Lab" spatial planning tool in the browser. A visitor places ordered stops on a fictional campus map, drags waypoints, chooses a mobility profile, scrubs departure time through deterministic closures, and resolves vertical-circulation conflicts while linked floor plans, elevation profile, turn list, arrival schedule, and accessibility evidence update. The useful artifact is a portable route plan plus valid GeoJSON preserving topology, timing, constraints, annotations, and expected segment outcomes.

This is a good-app genre eval (in-memory state only, no localStorage or backend). It must implement WebMCP contracts for standard entity interactions and produce the artifacts described in the Whole Job. Stack: React/Next.js/Solid or Vanilla JS, with Vite/Webpack; Tailwind CSS 4.3.2 is required.
</summary>

<core_features>
Feature: Layered map and stop authoring — The visitor drags destination pins from a catalog onto the map or selects them through keyboard/mobile search. Stops receive unique order 1–6 and optional dwell 0–30 minutes. Drag reorder in the itinerary rail, map waypoint movement, and keyboard move commands invoke the same route recalculation. Duplicate consecutive stops merge dwell; nonconsecutive duplicates require an explicit revisit flag.
Feature: Floor stack and vertical connectors — Entering a building reveals stacked floor mini-maps with stairs, ramps, and elevator shafts aligned. Selecting a route segment highlights the same connector on map, floor stack, elevation profile, and directions. Floor keyboard commands and mobile floor sheets preserve context. A connector unavailable to the active profile is visible but never silently routed.
Feature: Mobility and preference profile — Profiles are standard|step-free|low-slope with preferences for outdoor exposure, elevator use, and maximum slope. Canonical edge eligibility and weights derive from the profile; cosmetic route color does not. Switching profile recomputes the entire path and identifies changed segments. An impossible profile/stop set remains editable with an exact disconnected cut and nearby allowed alternatives.
Feature: Departure and closure time machine — A time scrubber spans 08:00–20:00 in five-minute steps. Closures, building windows, and elevator waits update as departure or upstream dwell changes. Route arrival times propagate segment by segment; crossing a closure can reroute or invalidate downstream segments. The visitor may pin one arrival window, causing departure-time adjustment if feasible but never modifying dwell silently.
Feature: Waypoint and alternative-route sculpting — Dragging up to three free waypoints onto eligible path nodes forces ordered traversal. A waypoint on a closed/inaccessible node remains preview-only. The app offers up to three deterministic alternatives ranked by time, distance, vertical transitions, and exposure; selecting one records its stable route signature. Alternatives disappear/reorder when constraints change, while the chosen signature is restored if it becomes valid again through undo.
Feature: Linked directions, elevation, and conflict panel — Turn cards include segment id, instruction, floor transition, distance, duration, arrival, and accessibility evidence. Brushing the elevation profile highlights map/floor segments and summarized slope/vertical travel. Conflicts identify closed edge, inaccessible connector, missed opening, pinned-window impossibility, or orphan waypoint and focus every affected surface.
Feature: Route rehearsal and responsive mode — A rehearsal cursor travels the route with pause/resume and step controls; map, floor, profile, instruction, arrival, and elevation focus synchronize. Reduced motion replaces travel with numbered segment states. Mobile transforms into a turn-by-turn card stack with mini-map, floor-transition sheets, time/profile controls, conflict drawer, and itinerary reorder while retaining all actions.
Feature: Checkpoints and artifact — Two named route checkpoints compare stop order, profile, departure, path membership, floors, duration, distance, and conflicts. Export/import preserves stops/dwell/revisits, profile/preferences, departure/pinned window, waypoints, selected alternative signature, annotations, viewport/floor, rehearsal, comparison, history, and route checksum. A valid GeoJSON `FeatureCollection` contains the active path and stops.
Feature: Artifact contract — LayeredCampusRoutePlan uses schemaVersion: "layered-campus-route/v1" and stores fixture id/hash, ordered stops, dwell/revisit, mobility profile/preferences, departure/pinned arrival, waypoint node ids, selected route signature, resolved segment ids/arrivals, two optional checkpoints, annotations, view/rehearsal state, ordered history, derived route/timing/checksum, GeoJSON, and UTC `exportedAt`.
  - Stop/waypoint ids exist; orders are unique contiguous integers; stops 2–6 and waypoints at most three.
  - Route segments form a contiguous directed path through allowed edges at their actual traversal times and preserve vertical connector floor endpoints.
  - Arrival is previous arrival + dwell + fixed segment/profile/elevator duration; times use one declared fixture timezone.
  - GeoJSON is a valid `FeatureCollection` with one path `LineString` and ordered stop `Point`s, fixture coordinates, ids, floor metadata, and route signature.
  - Import rejects fixture mismatch, unknown node/edge, disconnected or profile-invalid path, closure violation, bad order/time/floor, forged route/timing/GeoJSON/checksum, or duplicate history, then recomputes atomically.
  - Canonical JSON re-export changes only `exportedAt`; GeoJSON is byte-identical.
</core_features>

<visual_design>
- Inspect outdoor/indoor, floor transition, selected, closed, inaccessible, rerouted, compared, and certified states must have clear legibility preserving spatial hierarchy.
</visual_design>

<motion>
- Path rerouting, floor transition, arrival propagation, and rehearsal explain consequences.
- Reduced motion uses instant routes plus persistent changed-segment/time deltas.
</motion>

<requirements>
- Add/order stops, profile, scrub time, waypoint/alternative, inspect floors/elevation, rehearse, compare, certify, and export.
- Stack must include Tailwind CSS 4.3.2. All libraries must be installed locally via npm (no CDNs).
- Ensure zero console/page errors, and the app must serve on port 3000 via npm start.
</requirements>

<delivery>
- Deliver standard app.
</delivery>
