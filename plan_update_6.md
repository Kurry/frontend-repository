It uses WebMCP `form_submit` with `request-revision`, which calls `store.requestRevision(id, { summary: args.revision_summary.trim() })`.
Then why did detail and export stay in-review?
If `store.requestRevision` works, it sets `sub.stage = 'needs-revision'` and `sub.payout_state = ...`.
Could it be `args.submission_id` was undefined or incorrect?
"Request revision returned success..." -> so it returned `{ success: true, ... }`. WebMCP does:
`if (result) return ok('Workflow step succeeded')`
So it was successfully processed by `store.requestRevision`.
Wait! Is it possible `export` preview uses `store.submissions` and somehow it's a clone?
No, `store.submissions` is reactive.
Ah, what if the `clone` in `snapshot()` breaks reactivity?
```javascript
snapshot(label) { this.undoStack.push({ label, submissions: clone(this.submissions) }); if (this.undoStack.length > 40) this.undoStack.shift(); this.redoStack = [] },
```
No, `snapshot` clones it for the undo stack. It doesn't modify `this.submissions`.
What if `store.requestRevision` modifies the `sub` correctly, but the UI component `DetailView` doesn't re-render because `submission` is a computed property based on `activeSubmissionId` and the object reference didn't change, AND the template doesn't read the property directly enough? No, `submission.stage` is read directly in the template.
Wait, could there be a typo in the `instruction.md` about `Request revision`?
"request revision on a submission in the detail view and confirm the queue row stage, contributor drawer timeline, and Export preview history/stage all update to needs-revision without a reload" (14.4)
Wait! The failure specifically says:
"A successful Request revision did not update the visible detail stage or the later export stage, which remained in-review without reload."
Look at `DetailView.vue`:
```vue
<StatusPill :kind="submission.stage" />
```
Wait, if you do `store.updateSubmission(submission.value.id, 'stage', 'in-review')` in `beginReview()`, does that work? `updateSubmission` modifies `sub.stage`.
Could it be that the store is imported incorrectly or there's multiple Pinia instances?
No.
Let's check `RevisionDialog.vue`:
```vue
const submit = handleSubmit(async (values) => { if (store.requestRevision(submission.value.id, values)) await nextTick(() => resetForm()) })
```
If it succeeds, it resets the form. But wait! `store.requestRevision` calls `this.dialogs.revision = false;`.
BUT in `DetailView.vue`, `StatusPill` shows `submission.stage`.

Could it be that `requestRevision` modifies the original object in the array, but because it's in a Vue Proxy, it's fine. Wait! If the original array was seeded with `seedSubmissions()`, and `clone(this.submissions)` was run on undo, `this.submissions` is assigned to a cloned array:
`undo() { ... this.submissions = entry.submissions; ... }`
If `this.submissions` is reassigned, `this.activeSubmissionId` doesn't change, `submission.value` will now point to the NEW object in the array because of `activeSubmission: (state) => state.submissions.find((s) => s.id === state.activeSubmissionId) || null`.
So reactivity shouldn't be broken by undo.

Why would 14.4 fail? "Cross-view echo: request revision on a submission in the detail view...".
Ah, look at `DetailView.vue`:
```vue
<NButton type="primary" :disabled="!!approveReason" @click="store.approve(submission.id)"><IconCheckCircle /> Approve</NButton>
```
Is it possible the test script clicked "Request revision" but then clicked "Cancel" instead of submitting? Or it submitted, the API returned success, but the UI didn't update.
Wait! In `store.js` `requestRevision`:
```javascript
      this.snapshot('request revision'); sub.stage = 'needs-revision'; sub.payout_state = sub.payout_state === 'released' ? 'released' : 'held'; sub.updated_at = now(); sub.history.unshift(history('revision-requested', sub.updated_at, payload.summary.trim())); this.dialogs.revision = false; this.notify('Revision requested and timeline updated'); return true
```
Wait, `payload.summary` vs `values.summary`. `RevisionDialog` calls `store.requestRevision(submission.value.id, values)`. `values` has `summary`.
It looks perfectly correct. Why would it remain `in-review`?
Wait! In `App.vue`:
```javascript
import { useQcStore } from './store'
const store = useQcStore()
```
Is `Pinia` initialized properly? Yes.
Look at the FAIL evidence: "A successful Request revision did not update the visible detail stage or the later export stage, which remained in-review without reload. Evidence: cross_view_echo_without_reload-shared.png"
Could it be that `store.requestRevision` throws an error?
"Request revision returned success" — so it did not throw.
Wait, if it was in `in-review`, and it requested revision...
Is there some caching in the WebMCP tools?
`webmcp.js`:
```javascript
      if (args.workflow_step === 'request-revision') result = store.requestRevision(id, { summary: args.revision_summary.trim() })
```
If the test used WebMCP, it sets `result = true`.
Ah! What if the UI was actually showing a cloned submission or something?
In `DetailView.vue`:
```vue
const submission = computed(() => store.activeSubmission)
```
Wait, in `DetailView.vue`:
```vue
<script setup>
const store = useQcStore()
const submission = computed(() => store.activeSubmission)
```
In `store.js`:
```javascript
activeSubmission: (state) => state.submissions.find((s) => s.id === state.activeSubmissionId) || null,
```
If `state.submissions` is updated in place (`sub.stage = 'needs-revision'`), Vue 3 will pick it up because `state.submissions` is a Proxy and `sub` is a Proxy inside it.
BUT what if `sub.stage = ...` does not trigger the computed property because `state.activeSubmissionId` didn't change, and `state.submissions` array identity didn't change?
In Vue 3, `state.submissions.find(...)` iterates through the array. It touches the objects. BUT it only touches `s.id`. It DOES NOT touch `s.stage`!
Therefore, `activeSubmission` getter ONLY tracks `state.activeSubmissionId` and `state.submissions` (array length/identity), and `s.id` of the items it checks! It does NOT track `s.stage`!
So if `sub.stage` changes, `activeSubmission` computed property DOES NOT RE-EVALUATE!
YES!
Because the getter `activeSubmission` only reads `s.id`. So when `submission.stage` changes, `DetailView.vue` reads `submission.value.stage`. Does that trigger a re-render?
If `submission` is a computed property, `submission.value` returns the `sub` proxy. `DetailView.vue` template reads `submission.value.stage`. The template SHOULD track `sub.stage`.
Wait. The template reads `submission.stage` (auto-unwrapped). Since `submission.value` is a Proxy (from Pinia state), reading `submission.stage` in the template tracks `sub.stage`!
Wait, but what if `DetailView.vue` uses `submission.value.stage`?
In `DetailView.vue`:
```vue
<div class="detail-stage"><StatusPill :kind="submission.stage" /></div>
```
That should be reactive.

Wait! What about Export preview?
In `ExportView.vue`:
```vue
const preview = computed(() => store.exportPreview)
```
In `store.js`:
```javascript
    exportPreview() { return this.exportFormat === 'json' ? this.jsonPreview : this.markdownPreview },
```
If `jsonPreview` is a getter:
```javascript
    jsonPreview(state) {
```
It reads `state.submissions.map((s) => ... s.stage ...)`. It tracks everything!
So why did it not update?
Maybe the test did something like:
1. Open submission detail
2. Click "Request revision" -> wait, test says "A successful Request revision did not update the visible detail stage...".
Wait, did the test click "Submit" but the form validation prevented it?
No, "Request revision returned success" means it passed validation and succeeded.
Wait! What if it's the `form` submit in `RevisionDialog`?
```vue
const submit = handleSubmit(async (values) => { if (store.requestRevision(submission.value.id, values)) await nextTick(() => resetForm()) })
```
If it was called from UI, it would trigger `store.requestRevision`.
Is it possible `store.requestRevision` returned `false`?
`const sub = this.submissions.find((s) => s.id === submissionId); if (!sub) return false`
Wait, does it return `true`? `this.notify('Revision requested and timeline updated'); return true`
Yes.

Let's look at `store.js` mutation logic for `bulkUpdate`:
```javascript
    bulkUpdate(ids, payload) {
      if (!ids.length) return false
      this.snapshot('bulk update')
      ids.forEach((id) => {
        const sub = this.submissions.find((s) => s.id === id); if (!sub) return
        if (payload.bulk_stage && sub.stage === 'submitted') { sub.stage = payload.bulk_stage; sub.updated_at = now(); sub.history.unshift(history(payload.bulk_stage, sub.updated_at, 'Bulk stage updated.')) }
...
```
Notice `bulkUpdate` checks `sub.stage === 'submitted'`.
Wait! The UI in `QueueView.vue` for bulk stage says: "Move to in-review sets every selected submitted-stage row to in-review".
What if the test selected an `in-review` row, and called `bulkMove()` from WebMCP?
```javascript
if (args.workflow_step === 'bulk-update') { if (args.bulk_stage) result = store.bulkMove() || result;
```
Wait! `store.bulkMove()`? In `webmcp.js`:
`store.bulkMove()` but the method is `store.bulkUpdate()`!
Let's check `store.js`:
Are there methods `bulkMove` and `bulkHold`?
Let's check `store.js` for `bulkMove`!
