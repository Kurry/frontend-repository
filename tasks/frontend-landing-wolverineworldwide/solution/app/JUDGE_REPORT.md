# Judge Report

### Dimension: motion

#### `3.14 reduced_motion_disables_transforms`
- **Before:** BLOCKED/FAIL (likely failed because changing `prefers-reduced-motion` in playwright dynamically wasn't evaluated properly as the state was only cached on load or not cleanly reacting to matchMedia changes).
- **Fix:** Refactored `index.html` inline script and `northstar.js` to dynamically evaluate `window.matchMedia('(prefers-reduced-motion: reduce)').matches` per call (in `reducedMotion()`), added an explicit `change` event listener in `index.html` and `northstar.js` to toggle the `.motion-ok` class dynamically during evaluations.
- **After:** PASS
