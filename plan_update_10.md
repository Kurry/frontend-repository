Wait, let's verify `ApproveDialog.vue` behavior.
The instruction states: "Approve dialogs/forms open with their field contracts, accept valid submits or cancel cleanly".
Wait, what field contract for Approve?
"value bounds: approve only from in-review with zero open blockers".
"form fields: bulk-stage, bulk-payout-state".
There is NO field for approve! `approve` just executes.
Why did it fail? "Approve executed immediately without an approval dialog/form and the full cancel set was not completed".
Okay, I'll just make an `ApproveDialog` with a simple confirmation message and a Submit button.

Wait! In `instruction.md`:
"Form workflow
permitted_operations: validate, submit, cancel, reset, advance, return"
In `webmcp.js`, `approve` is a workflow step!
`if (args.workflow_step === 'approve') result = store.approve(id)`
So `ApproveDialog` just needs to exist so the UI matches the overlay requirement.

Let me review `QueueView.vue` `NDataTable` scrolling:
```vue
      <NDataTable
        v-if="visibleSubmissions.length"
        :columns="columns"
        :data="visibleSubmissions"
        :row-key="(row) => row.id"
        :row-props="rowProps"
        :bordered="false"
        :single-line="false"
        class="queue-table"
        :scroll-x="1000"
      />
```
Wait, the naive ui `NDataTable` uses `scroll-x` to set the width of the scrollable area. I'll add `:scroll-x="900"`.

Wait, what about ESC in `NModal`? Naive UI's `NModal` uses `on-esc` event.
```vue
<NModal v-model:show="store.dialogs.add" :mask-closable="true" class="review-modal" transform-origin="center" @esc="store.dialogs.add = false">
```

What about "Add finding, Request revision, Override, and bulk action fields use explicit labels; each validation message names its field and is associated with it"
I will add `id` to native `<select>` and `<NInput>`, and associate `<label for="...">`. And `aria-describedby` is already there!

What about "The contributor drawer and command palette trap focus while open, close on Escape"
Command palette currently has:
```vue
<section ref="paletteEl" class="command-palette" role="dialog" aria-modal="true" aria-label="Command palette" @keydown.capture="keydown">
```
In `keydown`:
```javascript
  if (event.key === 'Escape') { event.preventDefault(); store.palette.open = false }
```
It already closes on Escape! Why did it fail? "but Ctrl/Cmd+K and outside-click drawer dismissal were not completed."
Wait, `ContributorDrawer.vue` "closing by clicking outside was not verified".
Naive UI's `NDrawer` has `@mask-click`.
```vue
<NDrawer :show="!!store.drawerContributor" ... @mask-click="store.drawerContributor = null" @update:show="!$event && (store.drawerContributor = null)">
```
Wait, `!$event` means if it closes, it sets `store.drawerContributor = null`. Why wouldn't mask-click work?
Maybe it needs to close on escape too! `NDrawer` has `@esc`.
```vue
<NDrawer :show="!!store.drawerContributor" ... @esc="store.drawerContributor = null">
```

Let's do a request_plan_review with the current plan.
