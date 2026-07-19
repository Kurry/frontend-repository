# 50 enterprise-grade features by archetype (user spec; apply WHERE APPROPRIATE per task domain)
# All frontend-only, mocked data; simulated = absent backend, never faked outcomes.

## A1 Productivity & time trackers
1 Eisenhower 2x2 drag canvas (drop mutates urgency/importance metadata)
2 Time-blocking overlay (drag task from backlog onto time axis, stretch to carve non-overlapping slot)
3 Worker-driven pomodoro engine (no drift when tab backgrounded)
4 GitHub-style streak heat-map (multi-month SVG)
5 Interruption log overlay on premature pause (tag Internal/External -> analytics)
6 Tabbed-markdown -> parent-child tree parser with cascading progress bars
7 Daily velocity speedometer (completed weights vs target)
8 Morning rollover dashboard (bulk defer/drop/escalate yesterday's incomplete)
9 Web Audio ambient sound mixer (pink/brown noise, binaural)
10 Focus-mode sheet (single task + time bar only)

## A2 Dense data tracking logs
11 Virtualized spreadsheet (inline-edit up to ~50k mocked rows, smooth)
12 Formula bar (=SUM(A1:A10), =AVERAGE() via in-memory evaluator)
13 Multi-axis line chart (unrelated series on one time horizon)
14 CSV import diagnostic screen (row-level mismatch display, cell-by-cell fixes pre-commit)
15 Threshold alerter (metric caps -> dynamic row color flags historically)
16 Reading velocity calculator (timed sample -> projected completion dates)
17 Drag-and-drop pivot table builder (columns -> axis buckets -> nested summaries)
18 Multi-unit transform ribbon (Imperial/Metric, USD/EUR display-only conversion)
19 Bulk row mutation tray (batch categorize/delete/status)
20 State-size debug dashboard (+ archive-older-than-90d simulation)

## A3 Complex planning hubs
21 Multi-lane day matrix (Breakfast/Lunch/Dinner or stage tracks; cross-lane drag)
22 Recipe scale multiplier (servings -> proportional ingredient math)
23 Auto inventory/checklist generator from active plan
24 Gantt sequencer (drag upstream anchor -> downstream dates shift)
25 Seating chart canvas (drag/rotate tables, bind guests to seats)
26 Run-sheet cue director (blinking Next Cue, to-the-second timing)
27 Dietary constraint cross-referencer (tags + red violation cards vs profile filters)
28 RSVP metric wheel (concentric animated rings by status/diet/type)
29 Conflict detection drawer (overlapping rentals, missing slots)
30 Print-optimized multi-page summary layout

## A4 Kanban & workflow engines
31 Swimlane pivot (columns by Status, lanes by Assignee)
32 WIP limit guard (column bg deep amber on breach)
33 Time-in-stage cumulative area chart
34 Client-side automation rule builder (WHEN drop in Review THEN tag+assign)
35 Card custom-fields designer (dates, checkbox matrices, dropdowns, markdown)
36 Per-card meta-activity feed (stage moves, comments, edits)
37 Search syntax chips (status:Review priority:High tag:Bug)
38 Card relation linker (blocks/blocked-by/duplicate with drawn link lines)
39 Archive vault (browse/filter/restore deleted+completed)
40 Multi-board context switcher (swap board state with clean transitions)

## A5 Creative tool suites
41 SVG color wheel harmonic engine (drag anchor -> analogous/triadic/complementary)
42 WCAG contrast matrix (AA/AAA computed client-side per pairing)
43 Palette layout simulator (mock dashboard/blog/landing recolor live)
44 Leitner flashcard engine (accuracy -> box promotion, interval scheduling)
45 Deck performance sunburst (Mastered/Learning/New)
46 Recipe step mode (giant single-instruction card + inline countdown)
47 Ingredient scaling slider (parse "1 1/2 cups" -> "3 cups" at 2x)
48 Color-blindness SVG filter overlay (Protanopia, Deuteranopia)
49 Freeform card-sorting tabletop canvas
50 Palette export code drawer (CSS vars / Tailwind config JSON / SCSS)

# Lightroom-grade clusters (from the 6-capture inventory; for imaging/editor tasks)
L1 Non-destructive slider stacks with live numeric readouts (Light: Exposure/Contrast/Highlights/Shadows/Whites/Blacks; Effects: Texture/Clarity/Dehaze/Vignette/Grain; Detail: Sharpening+NR)
L2 Histogram updating live with edits
L3 Color engine: Temp/Tint, Vibrance/Saturation, HSL mixer per channel, Point Color, Color Grading (blend/balance)
L4 Tone/point curve control
L5 Masking with per-mask full adjustment sets (Subject/Sky/Background + Brush w/ Auto-mask/Flow/Feather + Linear/Radial gradients)
L6 One-click presets applying multi-slider states (Warm/Subtle/Strong/B&W) + auto light&color
L7 Crop: aspect ratios, straighten, upright modes, guides
L8 Copy/paste settings with granular group checkboxes (batch apply)
L9 Versions/snapshots + before/after compare + reset-to-original
L10 Export depth: formats/sizes, metadata inclusion, destinations
