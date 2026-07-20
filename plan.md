1. **Accessibility fixes:**
   - **Focus trap & Esc in modals**: Add `@keydown.esc="store.dialogs.add = false"` (and for revision/override) on `NModal` or within it so escape actually closes dialogs. Ensure focus returns (Naive UI usually handles this, might just need `close-on-esc` prop correctly set, `display-directive="show"` vs `if`, or `trap-focus="true"`, `auto-focus="true"`, `escape-closes="true"`). Wait, `NModal` has `close-on-esc`. Add it.
   - **Live regions**: Add `role="alert"` or `aria-live="polite"` to form validation `<p class="field-error">`. Add an `aria-live="polite"` region for toasts or gate feedback.
   - **Form explicit labels**: The custom Tier and Category `<NSelect>` components don't associate with the `<label>` text. We can add `id` to the select input via prop, or use standard HTML `<select>` if Naive UI `NSelect` doesn't support semantic roles/ids properly. Naive UI `NSelect` renders as a `div`. We must use Native `<select>` or pass `input-props="{ id: 'tier-input' }"`. We can just use `<select>` for better accessibility and semantic roles if styling allows, but `NSelect` is allowed by instructions.
   - **Semantic html roles**: The filters in `QueueView` are `<NSelect>` (render as div without semantic role button/combobox). We might need to ensure they have `role="combobox"` or `role="button"` if Naive doesn't. Or add ARIA attributes. Or switch to `<select>` if Naive UI's `NSelect` accessibility is fundamentally flawed. Let's see if we can use native `<select>` with classes.

2. **Core/Behavioral fixes:**
   - **Sort reversal**: In `store.js` visibleSubmissions: `const ascending = count(a) - count(b) || a.id.localeCompare(b.id)`. Wait, it says `sort by finding count ascending`. Currently: `desc` is default. The user toggles to `asc` -> `count(a) - count(b)`. Wait, why didn't it work? "Ascending and descending finding-count probes produced the same visible row order". Maybe `count()` logic is bad or `state.sort` is not updating properly.
   - **Different inputs change outcomes**: (14.6) Two findings with different tiers. Add them to export properly.
   - **Cross-view echo (14.4)**: `store.requestRevision` should update `activeSubmission` or just `submissions` correctly. "Request revision returned success, but detail and export remained in-review without reload." Ah, in `DetailView.vue`, `submission` is `computed(() => store.activeSubmission)`. Does `activeSubmission` update? In `store.js`: `requestRevision` modifies `sub`.
   - **Gate banner derives live (1.6)**: Adding blocker from zero blocker submission should immediately flip gate to failed. Wait, in `DetailView`, `gateFailed = computed(() => counts.value.blocker > 0)`. Why didn't it update?
   - **Bulk actions propagate to open detail view (1.15)**: If detail view is open while bulk action is running, `activeSubmission` should reflect changes.
   - **Command palette (1.16)**: Ctrl/Cmd+K. Enter on submission, contributor, view targets was not fully verified. Make sure `activate` method is working. `store.palette.open = false` before navigating maybe?

3. **Motion / Design fixes:**
   - **Gate banner & failure profile animation (3.4)**: Add CSS transitions for `gate-banner` class and `bar-fill`.
   - **Finding insertion / override strike-through (3.3)**: Add `TransitionGroup` for findings list, with enter/leave classes.
   - **Reduced motion (3.8)**: Use `@media (prefers-reduced-motion: reduce)` to disable transitions.
   - **Palette and bulk bar (3.9)**: Add short opacity/scale transition for palette, ease height for bulk bar.
   - **Disclosure and toasts (3.7)**: Expand collapse for evidence.

4. **Responsive layout (7.1, 7.2, 7.4, 7.5, 7.7):**
   - At 375px, the queue table remains 1024px wide. Naive UI `NDataTable` `scroll-x` prop must be used: `:scroll-x="800"` or wrap it in a container with `overflow-x-auto`. Wait, `NDataTable` has a prop `scroll-x` which makes it scroll horizontally instead of overflowing viewport.
   - Undo/Redo targets measure only about 32x34px. Increase `min-width` and `min-height` to 44px on mobile.
   - Contributor drawer becomes full-width.

5. **Technical (storage, keyboard navigation):**
   - `DetailView` Approve action "executed immediately without an approval dialog/form". (6.9) Wait, `Approve` should have a dialog? Let's check `ReviewDialogs.vue`. Only `AddFindingDialog`, `RevisionDialog`, `OverrideDialog`. Does the spec say Approve needs a form? "Overlays: Add finding, Request revision, Override, and Approve dialogs/forms open... accept valid submits or cancel cleanly". I'll add an `ApproveDialog`.
