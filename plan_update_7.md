Okay, `bulkMove()` exists.
Let's check `QueueView.vue` for `bulkUpdate`:
Ah, `QueueView.vue` does:
```javascript
  const payload = type === 'stage' ? { bulk_stage: 'in-review' } : { bulk_payout_state: 'held' }
  const valid = await validate()
  if (!valid.valid) return
  store.bulkUpdate(store.selectedIds, payload)
```
BUT `QueueView.vue` is using `store.bulkUpdate(...)` but it doesn't exist in `store.js`!!!
Wait! If `store.bulkUpdate` doesn't exist, it would throw an error!
Let's check if `bulkUpdate` exists in `store.js`:
