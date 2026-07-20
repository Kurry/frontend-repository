1. Add missing `Dialog` roles and keyboard accessibility logic for the toolbars.
2. Fix Document package export/import shape, validate payloads using `zod`.
3. Add animations that respect `prefers-reduced-motion`.
4. Fix `App.svelte` memory leaks/state handling for `ytext` to make it fully reactive using `$state(undefined)` or custom store/state.
5. Create Document package JSON structure for Import/Export, handle errors correctly in UI.
6. Address `edge_cases`, `motion`, `technical` criteria.
7. Run `npm run verify:build`.
8. Check WebMCP bindings.
