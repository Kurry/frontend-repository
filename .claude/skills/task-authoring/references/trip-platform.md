# Enterprise trip-planning platform feature spec (user-provided, thick-client state machine)

## Collaborative State & Concurrency (SIMULATED, frontend-only)
- CRDT-style conflict handling SIMULATION: when two "users" (one real, peers simulated) edit the same day/timeline block, no overwrite — a conflict resolution diff modal shows current vs incoming change side-by-side, forcing a manual merge choice.
- Granular permission roles: Owner (delete rights), Editor (move waypoints), Viewer (read-only) — switching active role visibly enables/disables controls.
- Async polling & voting: poll widgets on unassigned-bucket items; simulated group members cast votes; winning item auto-promotes to the active timeline.
- Simulated presence avatars ("Sarah is editing Day 3"), ephemeral colored carets/card outlines drifting to simulate peer edits, activity log feed drawer ("John moved Flight 102 to Day 1").

## Financial Ledger & Multi-Currency
- Interactive multi-currency ledger: tabular grid, inline currency dropdowns, client-side mock FX rates converting to a designated base currency automatically.
- Debt simplification (Splitwise-style): matrix/network-graph visualizer computing the MINIMUM number of settle-up transactions among the group.
- Temporal budget burn-rate: daily burn vs hard budget ceiling chart, projected overages from reserved hotel/flight totals highlighted.
- Cost allocation pie by category (Lodging, Food, Transit, Activities); per-capita vs weighted split toggle per expense; payment settlement checklist with Mark-as-Settled.

## 50-feature list by domain (abbreviated titles; full behaviors in the user spec)
1 Async text parsing sandbox (paste confirmations, regex token highlighting: PNR codes, dates)
2 Web-clipper simulation modal (URL -> extracted metadata card preview)
3 CSV/JSON dropzone with interactive schema-mapping wizard
4 Mock OCR receipt scanner (canvas, bounding-box overlay extracting costs/dates)
5 Template injector (seed "7-Day Tokyo Exploration" style datasets)
6 Synchronized dual-pane viewport (map canvas <-> timeline; hover card highlights map vector)
7 Multi-stop polyline renderer (directional paths, client-computed distances)
8 Isochrone radials (15-min walk/drive boundary circles around a hotel)
9 Map layer toggle (vector/satellite/transit/dark)
10 Marker clustering by zoom
11 Offline map cache indicator (simulated storage metrics)
12 Waypoint focus mode (fit map to one day's items)
13 Drag-and-drop itinerary grid (across days, reorder within day)
14 Time-block collision highlighter (amber overlapping windows; impossible transit)
15 Unassigned concepts bucket (parking-lot drawer)
16 Dynamic travel-time buffer cards between stops (mode selector: Driving/Walking/Transit)
17 Multi-timezone axis switcher (destination local / home / UTC)
18 Collapsible day accordions
19 Recurring event generator ("Daily breakfast 8:00 AM")
20-25 Financial ledger cluster (see above)
26 Multi-attribute filter ribbon (cost $-$$$$, priority, tags)
27 Instant fuzzy in-memory search (titles/addresses/notes)
28 Undo/redo history engine (step through structural changes)
29 Schema-driven custom field builder (add "Accessibility Rating" etc. to all cards)
30 Bulk action selection bar (mass delete/tag/move-to-day)
31-35 Collaboration cluster (see above)
36 Kanban pivot (To Visit / Reserved / Completed)
37 Full spreadsheet matrix grid (keyboard-navigable inline editing)
38 Print-optimized stylesheet
39 Markdown export canvas (compiled itinerary doc, copy + download)
40 ICS calendar string generator (valid .ics payload from timeline blocks)
41 Inline markdown notepad blocks in cards (headers, checkboxes, bullets)
42 Hyperlink metadata preview cards in notes
43 Image gallery carousel drawer per destination (reorder, captions)
44 Packing list sub-tab (categorized, progress bars "4/12 Items Packed")
45 Latency simulation control center (50/500/2000ms sliders -> optimistic UI verification)
46 Local storage capacity gauges (byte footprint instrumentation)
47 Global light/dark structural toggle
48 Error toast dispatcher test matrix (simulated network/parsing errors -> fallbacks)
49 Master purge / factory reset
50 Onboarding interactive coachmarks

All frontend-only with mocked data layers; every simulated capability must still be REAL client state (votes really promote items, merges really apply, FX math really computes) — simulation refers to the absent backend/peers, never to faked outcomes.
