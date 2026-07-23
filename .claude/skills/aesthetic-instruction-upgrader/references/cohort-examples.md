# Cohort examples

These examples are grounded in the 28-task cohort ranked 76–103 in the repository dashboard. The cohort's recurring weakness is not missing visual bullets: its mean penalty-side scores are approximately visual design `0.862`, motion `0.592`, accessibility `0.640`, responsiveness `0.725`, and innovation `0.401`. Use these as patterns, not as a universal style.

Preserve the cohort's assigned technology profiles from `docs/distribution.md`. The profiles below demonstrate how the Awwwards evidence should refine an existing stack rather than replace it.

## Planning and productivity

### `planning-execution-kanban`

Weak direction: a horizontal board with colored card accents and ordinary hover/drag transitions.

Technology profile: preserve React + Zustand, Carbon, and `@dnd-kit/core`. Use the Awwwards dense-operational bundle, retained-CSS grid/flex/transforms/transitions evidence, and stable utility/numeric typography. Reject 3D, smooth-scroll interception, and cinematic route transitions because they do not improve board execution.

Rewrite matching existing bullets in place with this level of specificity only when unchanged criteria already cover the same behavior:

```xml
<visual_design>
- Treat the board as an operations room rather than a four-column card grid: the board horizon is the dominant surface, the toolbar is a compact instrument rail, and each column has a clear title, count, capacity cue, and visual rhythm. Cards prioritize title, owner, due signal, and next action; metadata is subordinate and never competes with the column state.
- Use the column colors as a restrained status language repeated in the column rail, card edge, count, and drag destination preview. The selected card receives a distinct lift and outline; the destination column receives a temporary receiving treatment so the movement has a readable before, during, and after state.
</visual_design>
<motion>
- Dragging or keyboard-moving a card makes the card remain visually attached to the source action: the source slot holds space, the destination column previews insertion, neighboring cards settle into the final order, and the card's status treatment changes only after the move commits. Undo restores the same spatial relationship in reverse. Reduced motion keeps the insertion preview, focus, and final order while removing travel and lift.
</motion>
<responsiveness>
- Below 768px, preserve the board as the primary artifact while turning the toolbar into a compact action rail and keeping column identity visible through a horizontally scrollable board viewport. Cards retain title, status, and next action at the narrow width; secondary metadata moves behind the card detail surface rather than shrinking into unreadable text.
</responsiveness>
```

### `productivity-tagnote` and `productivity-mindthread`

Weak direction: many generic note bubbles, chips, trays, and toasts with no clear visual distinction between capture, organization, and resolution.

Technology profiles: preserve TagNote's Qwik + DaisyUI + AutoAnimate + ProseKit assignment and MindThread's Vue 3 + Tailwind + Reka UI + VueUse Motion/AutoAnimate + TipTap assignment. Use AutoAnimate for list continuity and the framework motion layer only for the signature capture/assignment sequence. Typography and editorial rhythm—not a heavier animation stack—carry the identity.

Rewrite matching existing bullets in place with this level of specificity only when unchanged criteria already cover the same behavior:

```xml
<visual_design>
- Build a tactile field-notes language: the capture surface is the visual anchor, the timeline has a deliberate reading rhythm, and pinned, assigned, archived, and resolved content each has a distinct but related treatment. Use one expressive display role for section moments, a highly legible reading role for note content, and a compact utility role for tags and timestamps. Avoid a uniform stack of interchangeable white cards.
- Make the relationship between a spark/note and its destination visible: tags, thread membership, status, and pinning should read as structured annotations around the content rather than unrelated pills. Empty inboxes and no-match searches receive composed editorial messages with a useful next action.
</visual_design>
<motion>
- The capture action is the signature transition: the new item enters the exact place where the user's attention is directed, the count and timeline respond as one event, and pin/assign/archive motion preserves continuity with the item's identity. Toasts are secondary confirmation, not the primary proof. Rapid submissions, undo, and reduced motion must leave the same final ordering and count.
</motion>
```

## Data and workflow tools

### `data-tracking-release-diff`

Weak direction: dense tables with green/red diff colors but limited visual narrative.

Technology profile: preserve Vue 3 + Pinia + shadcn-vue. Apply the dense-operational and storytelling evidence through CSS grid, sticky table regions, stable numerals, linked status treatment, and restrained framework-native transitions. Reject WebGL, parallax, and landing-page scroll choreography.

Rewrite matching existing bullets in place with this level of specificity only when unchanged criteria already cover the same behavior:

```xml
<visual_design>
- Make the release manifest the source of visual hierarchy: the selected release and its cut lineage lead the page, the summary strip explains the decision in one glance, and the diff table provides evidence beneath it. Added, removed, changed, and unchanged values use a disciplined visual grammar of marker, tint, and label; never rely on red/green color alone.
- The event timeline should feel like a release story, with a clear current position, actor/action labels, and a visually subordinate audit trail. Export and import surfaces use the same release-pack vocabulary and density as the main canvas, not generic modal cards.
</visual_design>
<responsiveness>
- Below 1024px, the release list becomes an intentional overlay with the selected release summarized in the main header; the manifest and diff retain readable row structure through internal scrolling, sticky row labels, and wrapped summary metrics rather than a squeezed desktop table.
</responsiveness>
```

### `workflow-gate-console`

Weak direction: rows, chevrons, banners, and progress indicators without a strong control-room composition.

Technology profile: preserve Svelte 5 runes stores and shadcn-svelte. Use Svelte transitions or CSS for row disclosure and status continuity; add no general timeline library unless the staged rerun cannot be expressed coherently with the assigned stack. Use tabular numerals and a compact utility face for evidence metadata.

Rewrite matching existing bullets in place with this level of specificity only when unchanged criteria already cover the same behavior:

```xml
<visual_design>
- Compose the console as a control room: the run list is a navigation spine, the detail canvas is the dominant evidence surface, and the stage strip is a progress instrument that explains where the run is in its lifecycle. Gate severity, pass/fail state, evidence, and rejection reason use distinct hierarchy and non-color cues. Avoid equal-weight dashboard panels.
- A certificate view is the resolved artifact of the run and should feel visibly different from an in-progress inspection: calmer spacing, signed status, completed stage treatment, and a clear export action while retaining the run identity.
</visual_design>
<motion>
- A rerun reads as a causal system: the initiating run control gains an active state, the stage strip advances in order, each gate changes status when its evidence is available, and the timeline records the result after the final gate settles. Expand/collapse and certificate transitions preserve the user's location and focus. Reduced motion removes travel but keeps ordering and status changes obvious.
</motion>
```

## Games and creative tools

### `game-repquest` and `game-feltrun`

Weak direction: a functional map/table and controls with decorative feedback added afterward.

Technology profiles: preserve RepQuest's Svelte + Skeleton + hand-authored Canvas assignment and bounded Svelte confetti; preserve FeltRun's Vue 3 + Reka UI + Motion for Vue + canvas-confetti assignment. The Awwwards playful-game bundle supports causal result motion, not ambient spectacle. Canvas owns the play field, DOM controls own accessibility, and confetti remains disposable secondary feedback.

Rewrite matching existing bullets in place with this level of specificity only when unchanged criteria already cover the same behavior:

```xml
<visual_design>
- Establish a world-specific visual language before styling the controls: the map/table is the primary stage, the HUD is a compact instrument layer, and progression, risk, reward, and defeat each have distinct visual states. Use a limited palette with one environmental family and one high-contrast interaction family; status is reinforced with icon, shape, or text.
- The result state is a designed scene, not a banner below the controls. Win, loss, achievement, streak, and new-session states preserve the player's context and make the next action unmistakable.
</visual_design>
<motion>
- Tie feedback to the game event that caused it: a dealt card, legal move, resolved hand, unlocked achievement, or defeated boss. The board/table state changes first, the reward or consequence follows, and the controls remain usable. Repeated actions cannot stack stale celebratory effects; reduced motion retains the state change and result emphasis without confetti, camera travel, or looping decoration.
</motion>
<responsiveness>
- At 375px, protect the play surface and next legal action. Stats, history, settings, and export become an intentional drawer or sheet with a visible return path; chip amounts, equity, streaks, and result copy retain a readable numeric hierarchy instead of being clipped.
</responsiveness>
```

### `creative-tools-euroscope` and `creative-tools-ghostty-config`

Weak direction: a competent wizard or settings editor whose visual language does not communicate a focused professional instrument.

Technology profiles: preserve EuroScope's Solid + Kobalte + vanilla-motion assignment and Ghostty Config's Svelte 5 + Bits UI + AutoAnimate/Svelte transitions assignment. Use CSS custom properties, grid/flex composition, controlled utility typography, and framework-native state transitions. Reject 3D, video, and smooth-scroll layers.

Rewrite matching existing bullets in place with this level of specificity only when unchanged criteria already cover the same behavior:

```xml
<visual_design>
- Treat the tool as a specialist instrument: the active work surface dominates, configuration controls form a compact control rail, and generated output is presented as a deliberate result surface with clear before/after or source/output separation. Use one coherent icon family, one density scale, and a small set of semantic accents rather than decorative UI chrome.
- Progress, active fields, validation, generated output, and download-ready states share the same visual vocabulary. The empty and invalid states explain what the operator should do next without placeholder filler.
</visual_design>
```

## Website-fidelity tasks

For `landing-l1-network-marketing`, `landing-readymag`, and `landing-units-gr`, do not replace the reference composition with a generic “premium landing page.” Preserve the reference's type contrast, art-directed crops, scroll rhythm, unusual alignment, copy register, and signature interaction. Clarify existing requirements only when the reference evidence and unchanged criteria already support them.

Preserve their assigned fidelity stacks: Astro islands + GSAP/ScrollTrigger + Lenis for L1 Network Marketing; Astro with React islands + GSAP/Motion for Readymag; and Astro + GSAP family + Lenis + Swiper + Lottie + native view transitions for Units GR. Every library must have one named role. ScrollTrigger/Lenis must preserve native scroll, anchors, focus, and reduced motion; Swiper owns carousel gestures; Lottie owns only authored vector sequences; Motion/GSAP responsibilities must not overlap.

## Review checklist

Before handing off an upgrade, verify:

- the brief names a product-specific visual thesis rather than adjectives;
- the dominant object, reading order, type roles, semantic colors, and material language are explicit;
- populated, empty, error, loading, selected, success, and completed states belong to one system;
- one signature interaction is causal and not merely a collection of fades;
- mobile is an alternate composition with preserved priorities;
- keyboard, focus, contrast, non-color cues, and reduced motion are visually coherent;
- no requirement adds unrelated product scope or grades implementation names;
- every rewritten bullet stays inside an unchanged existing criterion's semantic envelope;
- feature groups, flows, controls, schemas, artifacts, dependencies, WebMCP, rubric files, and aesthetic bullet counts remain identical.
