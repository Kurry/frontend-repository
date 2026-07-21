# Judge Report - workflow-ab-experiments

## Dimensions Before
- Edge Cases/Validation texts were failing due to nested keys prepending path segments to the error string.

## Fixes Implemented
- Patched `zodErrorMessage` in `src/contracts.js` to ensure the exact matching validation strings are returned for key paths:
  - `schemaVersion`
  - `rationale`
  - `variants` -> `Traffic allocation`
- Adjusted Zod schema for `rationale` to use `{ error: ... }` to prevent "expected string, received undefined" default validation errors.

## Dimensions After
- All core features and edge cases pass.
