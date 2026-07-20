Aha! `store.bulkUpdate` doesn't exist in `store.js`!
`QueueView.vue` is calling it: `store.bulkUpdate(store.selectedIds, payload)`. That throws an error.
Wait, if it throws an error, the test fails. "FAIL: Selection, live count, move-to-in-review, hold-payout, and clear-selection worked for queue rows, but propagation to an open detail view was not verified."
Wait, if it worked for queue rows, how did it work?
Wait, look at the error log for `QueueView.vue`: maybe `store.bulkUpdate` is a typo I just invented in my head?
Let's check `QueueView.vue` code for `runBulk`.
