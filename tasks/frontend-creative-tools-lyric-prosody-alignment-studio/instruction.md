# Lyric Prosody Alignment Studio

<summary>
The user edits original lyric lines, tokenizes syllables, aligns them to beat/note intervals, marks stress and elongation, links rhyme and motif families, arranges section repeats, branches wording alternatives, rehearses with logical playback, resolves deterministic prosody findings, approves a version, and exports exact timed lyrics, score maps, and revision artifacts.
</summary>

<core_features>
The following feature groups must be completed in depth-first order.
Lyric and syllable editor: Users can insert, delete, merge, or split syllables, preserving old-token provenance. Re-tokenization maps to previous timing. Keyboard and mobile paths must exist.
Beat and note alignment grid: Syllable bars can be dragged and resized on a rational beat grid (1/2, 1/3, 1/4, 1/6 snap), spanning melody notes. Constraints prevent overlap within lanes, section leaving, and uncovered lyric notes. Numeric inputs match drag actions.
Stress and prosody map: Users mark primary, secondary, or unstressed syllables and phrase emphasis. A deterministic evaluator flags issues against metrics, duration, phrase peak, and punctuation. Overrides require a performance note.
Rhyme and motif graph: Users can create families (perfect, slant, repeated-word, visual) across line endings or spans, and motif spans for recurrence. Visualizing a family highlights lines, sections, and counts. Overlapping contradictory memberships are rejected.
Section arrangement and inheritance: Users drag section blocks (verse, chorus, etc.) on a timeline. Repeated sections inherit lyrics, timing, and properties from a master instance unless overridden locally. Edits to masters propagate; edits to repeats require this, this-and-future, or master scope selection.
Wording branches and compare: Users can fork line or song variants, preserving mapping and properties. A comparison mode highlights differences. Merging resolves conflicts.
Logical rehearsal and cue review: Playback uses a logical clock with adjustable speed, loop, and karaoke cursor. The rehearsal runner tracks late/early/missed events without actual audio analysis.
Responsive studio and artifacts: The UI scales from desktop (editor, grid, graph, rehearsal) to mobile (cards, sheets, drilldowns). Import and export use canonical JSON, enhanced LRC, CSV ledger, SVG map, and Markdown lyric sheet.
</core_features>

<visual_design>
Inspect source, edited, stale, and mapped tokens. Inspect stressed, misaligned, override, rhyme, motif, master, inherited, override, playback, finding, and approved states. Visual hierarchy must stay legible across all states simultaneously.
</visual_design>

<motion>
Retokenize, remap, drag, resize, propagate section, propagate family, scrub, play, loop, and merge actions must explain their cause visually through animation.
Under reduced motion, causal motion is disabled, but persistent changed-token, changed-time, and changed-span deltas are retained.
</motion>


<requirements>
- **Deterministic fixture:** The original fictional song `Paper Constellations` has 28 lyric lines, 176 syllable tokens, 96 measures in 4/4 and 6/8, fixed tempo-map changes, abstract melody-note intervals, section/repeat structure, stress dictionary for fixture words, and five deliberate prosody issues. All text is authored for the benchmark and has no external copyright dependency.
Requirements must not use local npm installation logic or rely on CDNs. (i.e. The npm-local/no-CDN rule is required).
Tailwind CSS 4.3.2 must be used for styling.
All core interactions (edit, map, mark stress, arrange, compare, playback, approve, export) must be achievable without a pointer device. Focus and state match pointer interaction.
The system must handle 10,000 lines, 100,000 tokens, 20,000 sections and variants, and 100,000 rehearsal events responsively. Stale mapping work must be cancellable.
Conflict copy must name the exact line, token, revision, measure, beat, family, section, and event, as well as the recovery action.
State must round-trip exactly when saving, reloading, and checking point branching. Partial invalid imports must be rejected with no state mutation.
</requirements>

<integrity>
</integrity>

<delivery>
</delivery>

<webmcp_action_contract>
</webmcp_action_contract>

<reference_screenshots>
</reference_screenshots>
