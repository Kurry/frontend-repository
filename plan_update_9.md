Ah! `QueueView.vue` DOES call `store.bulkMove()` and `store.bulkHold()`.
Okay, sorry for my confusion.

Let's address: "A successful Request revision did not update the visible detail stage or the later export stage, which remained in-review without reload."
Why would `store.requestRevision` modify `sub.stage` but not trigger re-render?
In `RevisionDialog.vue`:
```vue
const submit = handleSubmit(async (values) => { if (store.requestRevision(submission.value.id, values)) await nextTick(() => resetForm()) })
```
If `submission.value.id` was passed correctly, `store.requestRevision` finds the submission.
`sub.stage = 'needs-revision'` mutates it.
Why would it not trigger a re-render in `DetailView.vue` and `ExportView.vue`?
Maybe `sub` is NOT reactive?
`store.submissions` is initialized with `seedSubmissions()`.
If I clone `this.submissions` in `snapshot` and push to undo, that's fine.
BUT what if we do `undo()`? `this.submissions = entry.submissions;`
`entry.submissions` is a deep clone. It's a plain object array!
When you do `this.submissions = entry.submissions`, Pinia will make it reactive.
But wait! If the test didn't `undo`, it was just `request-revision` directly.
Wait. Is there a case where `state.submissions` is replaced somewhere else?
No.

Let's look at `store.js` `requestRevision`:
```javascript
    requestRevision(submissionId, payload) {
      const sub = this.submissions.find((s) => s.id === submissionId); if (!sub) return false
      this.snapshot('request revision'); sub.stage = 'needs-revision'; sub.payout_state = sub.payout_state === 'released' ? 'released' : 'held'; sub.updated_at = now(); sub.history.unshift(history('revision-requested', sub.updated_at, payload.summary.trim())); this.dialogs.revision = false; this.notify('Revision requested and timeline updated'); return true
    },
```
Wait, `payload.summary` vs `payload.revision_summary`.
If `requestRevision` is called from WebMCP:
```javascript
      if (args.workflow_step === 'request-revision') result = store.requestRevision(id, { summary: args.revision_summary.trim() })
```
Wait, if it's called from `webmcp.js`, it works.
If it's called from UI, it's called from `RevisionDialog.vue`:
```javascript
const submit = handleSubmit(async (values) => { if (store.requestRevision(submission.value.id, values)) await nextTick(() => resetForm()) })
```
It looks fine.

What about: "Request revision returned success, but detail and export remained in-review without reload."
Could it be `App.vue` or `DetailView.vue` caching the `submission`?
```javascript
const submission = computed(() => store.activeSubmission)
```
This is a standard computed.
Wait, if `store.activeSubmission` doesn't track `stage` changes?
Yes! `store.activeSubmission` is a Pinia getter.
```javascript
activeSubmission: (state) => state.submissions.find((s) => s.id === state.activeSubmissionId) || null,
```
As established earlier, Vue 3 `find` tracks `s.id`. It returns a reactive Proxy.
When `DetailView.vue` reads `submission.stage`, it reads from the Proxy. It SHOULD track `stage`.
Unless `DetailView.vue` doesn't read `submission.stage`!
Wait, `DetailView.vue` does:
```vue
<StatusPill :kind="submission.stage" />
```
It reads it!

What if `StatusPill.vue` caches the prop?
```vue
<script setup>
import { computed } from 'vue'
const props = defineProps({ kind: String })
const label = computed(() => {
  if (props.kind === 'submitted') return 'Submitted'
  if (props.kind === 'in-review') return 'In review'
  if (props.kind === 'needs-revision') return 'Needs revision'
  if (props.kind === 'approved') return 'Approved'
  return props.kind
})
</script>
<template><span class="status-pill" :class="`pill-${kind}`">{{ label }}</span></template>
```
No, props are reactive.

Wait. Is it possible the test is looking at the EXPORT preview and NOT finding the updated stage?
"Cross-view echo: request revision on a submission in the detail view and confirm the queue row stage, contributor drawer timeline, and Export preview history/stage all update to needs-revision without a reload"
"A successful Request revision did not update the visible detail stage or the later export stage, which remained in-review without reload."
Why would BOTH Detail View and Export View remain `in-review`?
Ah! `DetailView.vue`:
Does the test click "Submit" in the Request Revision dialog, or does it click the "Request revision" button in the queue?
There is no Request revision in the queue.
Wait! `store.js` `requestRevision` modifies `sub.stage = 'needs-revision'`.
Is it possible the test script clicked "Cancel" instead? If so it wouldn't have "returned success".
Wait! "A successful Request revision did not update the visible detail stage... Evidence: cross_view_echo_without_reload-shared.png"
Could it be that the page reloaded somehow?
"without a reload"
Wait, form submit! In `RevisionDialog.vue`:
```vue
      <form class="review-form" novalidate @submit="submit">
```
Does it need `@submit.prevent`?
Yes!!!
If there is no `.prevent`, the form submits natively and reloads the page!
```vue
      <form class="review-form" novalidate @submit.prevent="submit">
```
Ah! `vee-validate`'s `handleSubmit` usually prevents default, but in some Vue 3 setups, if you bind it like `@submit="submit"`, it might NOT prevent default unless you do `@submit.prevent`.
Wait, VeeValidate's `handleSubmit` returns a function that DOES prevent default.
From vee-validate docs: `handleSubmit` wraps your handler and calls `e.preventDefault()`.
BUT what if there's a bug with `handleSubmit` not preventing default?
Actually, `vee-validate`'s `handleSubmit` receives the event and calls `e.preventDefault()`.
Wait, what about `AddFindingDialog.vue`?
```vue
      <form class="review-form" novalidate @submit="submit">
```
If it reloads the page, then the state is reset!
If the state resets to seeded baseline, the submission is back to `in-review`!
"A successful Request revision did not update the visible detail stage or the later export stage, which remained in-review without reload."
YES! If the page reloads, the state is reset to the baseline seeded data, and the submission goes back to its original `in-review` stage!
That perfectly explains why "Undo removed the added finding and restored the detail count/gate, but the export preview was not rechecked after undo" and other weird state reset issues if they triggered a reload.
Let me change ALL forms to `@submit.prevent="submit"`.

Plan:
1. Replace `NSelect` with native `<select>` for all `QueueView` filters, `QueueView` sort, and `AddFindingDialog` selects.
2. Add `@submit.prevent="submit"` to all forms (`AddFindingDialog.vue`, `RevisionDialog.vue`, `OverrideDialog.vue`).
3. Add `ApproveDialog.vue`, add it to `ReviewDialogs.vue`.
4. Update `DetailView.vue` to open `ApproveDialog` instead of calling `store.approve`.
5. Fix focus trap / ESC in modals: Add `@keydown.esc.stop="store.dialogs.xxx = false"` or ensure `NModal` closes properly (it should with `mask-closable="true"` and a proper focused element, but let's add `on-esc` prop `on-esc="store.dialogs.add = false"` or just use `@keydown.esc` on the wrapper). Wait, `NModal` has `on-esc` hook.
6. Add Live Regions (`aria-live="polite"`) to `field-error` elements.
7. Add CSS transitions for 3.3, 3.4, 3.7, 3.8, 3.9.
8. Fix responsiveness (7.1, 7.2, 7.4, 7.5, 7.7): `QueueView.vue` `NDataTable` needs `:scroll-x="1000"` or wrapper with `overflow-x-auto`.
   - Ensure Mobile tap targets > 44px (e.g. `header button`, `palette result`, etc).
