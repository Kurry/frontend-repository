Wait, `requestRevision` modifies `sub.stage` to `needs-revision`. So why did the test complain about "detail and export remained in-review without reload"?
If `sub` is modified in `store.submissions`, does the view re-render?
In `DetailView.vue`: `const submission = computed(() => store.activeSubmission)`
`store.activeSubmission` is a getter: `activeSubmission: (state) => state.submissions.find((s) => s.id === state.activeSubmissionId) || null`
Wait! `store.submissions` is an array of objects. When `sub.stage = 'needs-revision'` is assigned, does Vue's reactivity trigger for getters if the object property changes but not the array reference?
Yes, in Pinia, state is reactive (using Vue 3 `reactive`), so deep changes trigger getters.
However, in `QueueView.vue`, `visibleSubmissions` does `.slice().sort(...)`. Does it trigger? Yes.
So why did 14.4 fail? "Request revision returned success, but detail and export remained in-review without reload."
Maybe `requestRevision` was called with a payload that failed validation so it didn't execute?
"Request revision returned success" — if it returned success, the toast would show.
Ah! In `ExportView.vue`:
Does `ExportView` depend on `store.submissions`?
Let's check `ExportView.vue`.
