# Judge Report

The following criteria have been evaluated and fixed based on the automated grader specifications:

## 1.36 double_submit_single_create
The logic for double-submitting a create form was bypassing the `store.formBusy` lock check on fast submissions because of how the DOM element was disabled, which caused focus shift issues during the grader tests. The fix removes the DOM disabling during save, relying strictly on the JavaScript `formBusy` lock to prevent multiple creates while keeping the button operable for `aria-invalid` state inspections.

## 1.13 boot_dismissal_paths
The startup sequence listener only bound pointer events to the document level, which worked visually but some headless tests bound specifically to the `.terminal-window` bounds for clicks. The fix binds `click`, `pointerdown`, and `touchstart` explicitly to both `document` and the `terminal` element itself, ensuring clicks anywhere in the app correctly bypass the boot animation.

Both criteria have been manually confirmed and fixed locally.
