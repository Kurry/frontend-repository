Ah, `DetailView.vue` does not update because `gateFailed = computed(() => counts.value.blocker > 0)`.
Wait, `counts` is:
`const counts = computed(() => openFindingCounts(submission.value))`
If `submission.value` points to an object that was mutated, does `computed()` re-evaluate if the object reference doesn't change, but its inner array/properties do?
In Vue 3, `computed` will re-evaluate if any reactive dependency read inside it changes. `store.activeSubmission` is a getter returning an object from a reactive array `state.submissions`. If a property like `s.stage` or `s.findings` changes, it SHOULD trigger reactivity, assuming `submission.value` (the object) is fully reactive. Pinia state is fully reactive by default unless it's explicitly non-deep.
However, in `store.js` snapshot function:
```javascript
snapshot(label) { this.undoStack.push({ label, submissions: clone(this.submissions) }); if (this.undoStack.length > 40) this.undoStack.shift(); this.redoStack = [] },
```
`clone(this.submissions)` creates a deep clone. `submissions` array might be replaced on undo/redo.
Wait, if `requestRevision` modifies `sub.stage = 'needs-revision'`, why didn't the UI reflect it immediately without reload?
"A successful Request revision did not update the visible detail stage or the later export stage, which remained in-review without reload."
Maybe `requestRevision` failed the condition:
`const sub = this.submissions.find((s) => s.id === submissionId); if (!sub) return false`
Wait, did the Request revision succeed? "Request revision returned success...". It has a toast: `this.notify('Revision requested and timeline updated')`.
If the UI didn't update... could it be the test expects `store.updateSubmission` logic but it used `store.requestRevision`?
Wait! In `ReviewDialogs.vue`:
```vue
<RevisionDialog />
```
In `RevisionDialog.vue`:
```javascript
const submit = handleSubmit(async (values) => { if (store.requestRevision(submission.value.id, values)) await nextTick(() => resetForm()) })
```
If `store.requestRevision` returns `true`, why would `export` or `detail` view stay `in-review`?
Maybe `export` uses the WebMCP module handler, which bypassed `store.requestRevision` and directly mutated something else or failed?
Wait, if the test is "Cross-view echo: request revision on a submission in the detail view...", it's clicking through the UI. It says "in the detail view and confirm the queue row stage...".
Wait, `sub.stage = 'needs-revision'; sub.payout_state = sub.payout_state === 'released' ? 'released' : 'held';`
Is `stage` bound properly in DetailView?
In `DetailView.vue`:
```vue
        <div class="submit-actions">
          <NButton @click="store.dialogs.revision = true"><IconSend /> Request revision</NButton>
          <NButton type="primary" :disabled="!!approveReason" @click="store.approve(submission.id)"><IconCheckCircle /> Approve</NButton>
        </div>
```
Wait, the UI doesn't explicitly display the stage string as `needs-revision` unless it's in the status pill.
```vue
<div class="detail-stage"><StatusPill :kind="submission.stage" /></div>
```
It displays `submission.stage`.

Could it be that the test did a bulk update to `in-review`, then tried `Request Revision`, but the bulk update created a cloned state bug?
Wait! "Move to in-review sets every selected submitted-stage row to in-review..." (1.15)
In `QueueView.vue`:
```javascript
async function runBulk(type) {
  const payload = type === 'stage' ? { bulk_stage: 'in-review' } : { bulk_payout_state: 'held' }
  const valid = await validate()
  if (!valid.valid) return
  store.bulkUpdate(store.selectedIds, payload)
  store.clearSelection()
}
```
In `store.js`:
```javascript
    bulkUpdate(ids, payload) {
      if (!ids.length) return false
      this.snapshot('bulk update')
      ids.forEach((id) => {
        const sub = this.submissions.find((s) => s.id === id); if (!sub) return
        if (payload.bulk_stage && sub.stage === 'submitted') { sub.stage = payload.bulk_stage; sub.updated_at = now(); sub.history.unshift(history(payload.bulk_stage, sub.updated_at, 'Bulk stage updated.')) }
        if (payload.bulk_payout_state && sub.payout_state !== 'released') { sub.payout_state = payload.bulk_payout_state; sub.updated_at = now(); sub.history.unshift(history('held', sub.updated_at, 'Bulk payout state held.')) }
      })
      this.notify(`Bulk updated ${ids.length} submission${ids.length === 1 ? '' : 's'}`); return true
    },
```
Wait, I see `clone` implementation in `store.js`!
