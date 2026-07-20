Sort issue:
In `store.js`, sorting: `return state.sort === 'asc' ? ascending : -ascending`
If `state.sort` is 'desc' (default), it returns `-ascending` which is `count(b) - count(a)` if `count(a) != count(b)`.
But what if the number of findings is the same for all? The seeding seems to have different amounts. Let's look at `store.js` seeding:
`sub-1048` has `0` findings.
`sub-1047` has `2` findings.
`sub-1046` has `1` findings.
Wait, `a.id.localeCompare(b.id)` means string comparison.
If `state.sort` is 'desc', `b` should come before `a` if `count(b) > count(a)`.
Wait, if `ascending` is positive (a > b), `-ascending` is negative, meaning `a` comes first. Wait, standard sort:
`ascending = count(a) - count(b)`
If `count(a) = 5`, `count(b) = 2`, `ascending = 3`.
If `sort === 'asc'`, return `3`. `a > b`, so `b` comes before `a`. Correct (2 then 5).
If `sort === 'desc'`, return `-3`. `a < b`, so `a` comes before `b`. Correct (5 then 2).
If `count(a) == count(b)`, say they are both 0.
`ascending = a.id.localeCompare(b.id)`. (say "sub-1047" vs "sub-1048" -> -1)
If `sort === 'asc'`, return `-1`. `a` comes before `b`. (sub-1047 then sub-1048)
If `sort === 'desc'`, return `1`. `b` comes before `a`. (sub-1048 then sub-1047)
Why did sort reversal test fail? "Ascending and descending finding-count probes produced the same visible row order, although the row count stayed at 12."
Ah! In `QueueView.vue`:
```vue
<NSelect :value="sort" :options="sortOptions" aria-label="Sort by open finding count" @update:value="store.setSort" />
```
Wait, `sort` is from `const { filters, sort, visibleSubmissions, selectedIds } = storeToRefs(store)`
Is it possible `NSelect` doesn't emit `@update:value` correctly, or `store.setSort` wasn't receiving the right value?
In `QueueView.vue`, `sort` is a string. `setSort(value) { this.sort = value === 'asc' ? 'asc' : 'desc' }`.
Wait! If `sort` is used as v-model, `update:value` should work.
Let's check `sortOptions`: `[{ label: 'Most findings first', value: 'desc' }, { label: 'Fewest findings first', value: 'asc' }]`
Is the test interacting with a `select` element differently? "Queue filters, sort, and finding-tier selectors were rendered as focusable DIV elements without semantic button/combobox roles". Since the script uses Playwright, it might try to click the `<select>` but it's an `NSelect` which isn't a native `<select>`.
If I change them to native `<select>`:
`<select :value="sort" aria-label="Sort by open finding count" @change="store.setSort($event.target.value)" class="filter-select">`
That would solve both the accessibility semantic roles issue and the playwright scripting failure (since playwright might be calling `.selectOption()` which only works on native `<select>`).
Yes! `NSelect` creates custom DOM structure that `.selectOption()` in Playwright will fail to operate on unless it's designed to handle NaiveUI exactly. The instructions state: "Interactive controls use semantic button/link/checkbox roles... Queue filters, sort, and finding-tier selectors were rendered as focusable DIV elements without semantic button/combobox roles".
So changing `NSelect` to native `<select>` in `QueueView.vue` and `AddFindingDialog.vue` is necessary for accessibility and for the automated test to work.

Let's review the required fixes:

1. **Change `NSelect` to native `<select>`:**
   - In `QueueView.vue`: `stageOptions`, `tierOptions`, `contributorOptions`, `sortOptions`.
   - In `AddFindingDialog.vue`: `tierOptions`, `categoryOptions`.
   - Update CSS classes so they look okay.

2. **Dialog accessibility (1.2, 4.9, 1.4):**
   - Add `@keydown.esc="store.dialogs.add = false"` to all dialogs, but native `NModal` might just need `display-directive="show"` or something. Let's look at `NModal`. Actually Naive UI `NModal` closes on ESC if `mask-closable="true"` and `closable` or if `on-esc` is handled. Wait, it handles ESC if it is focused. Let's add `@keydown.esc.stop="store.dialogs.add = false"` to the `<NCard>` or use the `on-esc` prop of `NModal`. `NModal` has `on-esc` prop? Let's check `on-esc` prop.
   - Or just use `NModal`'s `@esc="store.dialogs.add = false"`. Let's just use `<div @keydown.esc="close">` inside.
   - For 1.4 Live Regions: add `role="alert"` or `aria-live="polite"` to `field-error` paragraphs.
   - `AddFindingDialog.vue`, `RevisionDialog.vue`, `OverrideDialog.vue` need this.

3. **Motion (3.4, 3.8, 3.9):**
   - CSS for `prefers-reduced-motion: reduce`.
   - Add `TransitionGroup` for findings list in `DetailView.vue`. It currently uses `<TransitionGroup name="finding-list">`. We need to add `.finding-list-enter-active, .finding-list-leave-active { transition: all 0.3s ease; } .finding-list-enter-from, .finding-list-leave-to { opacity: 0; transform: translateX(30px); }` in CSS.
   - Gate banner swap (3.4): `.gate-banner { transition: background-color 0.3s ease, color 0.3s ease; }`
   - Profile bars (3.4): `.bar-fill { transition: width 0.3s ease; }`

4. **Approve Dialog (6.9):**
   - The test specifically wants an Approve dialog! "Approve executed immediately without an approval dialog/form and the full cancel set was not completed".
   - I'll create `ApproveDialog.vue` similar to `OverrideDialog.vue`.
   - Update `ReviewDialogs.vue` to include it.
   - Update `store.js` dialogs state to include `approve: false`.
   - Update `DetailView.vue` to set `store.dialogs.approve = true` instead of calling `store.approve` directly.

5. **Cross-view echo (14.4):**
   - Ensure `requestRevision` updates the `submission.stage` so it immediately reflects. In `store.js`:
   `markRevised(submissionId)` is there. What about `requestRevision`?
   Wait, is there a `requestRevision` in `store.js`?
   Let's check.
