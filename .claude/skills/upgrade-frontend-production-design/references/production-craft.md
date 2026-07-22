# Production craft reference

Use these prompts to make task requirements concrete without prescribing one aesthetic.

## Composition

- Name the dominant element in each major state.
- Describe relationships: overlaps, anchors, rails, layers, axes, cropping, whitespace, and depth.
- Distinguish navigation, work, context, and output zones.
- Keep controls near the state they affect.
- Require populated layouts to remain intentional at minimum and maximum realistic data density.

## Typography

- Assign display, body, label, control, annotation, and numeric roles where applicable.
- Describe contrast through scale, weight, width, case, spacing, and placement—not font count.
- Bound long titles, labels, numbers, and localized strings with intentional wrap or truncation behavior.
- Preserve readable measure and line-height in prose.
- Align tabular values and use stable numeral widths when changing numbers would cause jitter.

## Color and material

- Define roles before values: canvas, surface, raised surface, primary text, secondary text, accent, focus, selection, success, warning, error, and visualization series.
- Require contrast through every interactive state, including disabled and muted states.
- Use texture, border, shadow, translucency, or depth consistently with the concept.
- Keep semantic state distinguishable without color.
- Test imagery and charts against their actual surrounding field, not isolated swatches.

## Components and states

- Give buttons, fields, tabs, menus, cards, panels, dialogs, toasts, and tooltips one shared edge and feedback language.
- Design hover, focus, press, selected, disabled, pending, invalid, and destructive states.
- Make empty states explain the next action; make errors name the failure and recovery.
- Keep loading placeholders structurally related to the settled content.
- Ensure confirmation and completion states expose what changed and what the user can do next.

## Motion grammar

- Use fast acknowledgement for press, focus, and direct input.
- Use moderate transitions for panels, reordering, view changes, and derived-result updates.
- Reserve longer sequences for scene changes, narrative chapters, or meaningful completion.
- Define sequencing by hierarchy: container before detail, cause before result, origin before destination.
- Keep transforms and opacity composited where practical; avoid animating expensive layout continuously.
- Support interruption and rapid repeated actions without stale end states.
- Stop ambient loops when hidden, offscreen, paused, or reduced motion is active.

Do not encode arbitrary millisecond requirements unless timing itself is essential to the observed experience. Grade early, intermediate, and settled states when the motion path matters.

## Responsive transformation

- Preserve the primary artifact, current state, and next action.
- Convert side-by-side comparison to tabs only when simultaneous comparison is no longer readable.
- Convert dense sidebars to sheets, drawers, steppers, or contextual toolbars.
- Replace precision drag with tap-select or explicit controls when touch cannot reproduce it reliably.
- Reorder content by task priority rather than DOM convenience.
- Specify landscape and portrait behavior for canvas, board, map, timeline, and media-led tasks.

## Real-world content

- Seed values that expose long text, duplicate-looking records, zero states, high values, timestamps, units, and status variety.
- Use domain-correct terminology and artifacts.
- Avoid lorem ipsum, repeated placeholder avatars, unexplained percentages, and fake growth charts.
- Make validation, partial completion, stale data, retry, undo, and destructive confirmation visually intentional.
- Ensure the exported or completed artifact receives the same design care as the setup flow.
