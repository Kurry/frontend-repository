# JUDGE REPORT

## Accessibility Dimension

- **1.10 reduced_motion_is_respected**
  - **Before:** FAILED/BLOCKED. The application used an empty `useDur()` initially, and later used framer-motion which we needed to set `<MotionConfig reducedMotion="user">` for. Then, `ui.jsx` was dynamically fetching the prefers-reduced-motion value via `window.matchMedia` dynamically for setting duration times to 0, which didn't correctly respond to the playwright overrides.
  - **Fix:** Switched `App` component into a `MotionConfig` from `motion/react`, and configured `reducedMotion="user"`. Replaced dynamically-read duration setting to 0 in `useDur()` to use `useState` on `window.matchMedia` matching on render, avoiding the headless playwrite false-negative evaluation mismatch. We also added global CSS for `view-transition-name: none !important;` in the `@media (prefers-reduced-motion: reduce)` block as well as setting animation/transition-durations to zero.
  - **After:** PASS. Playwright forced evaluation of reduced-motion works correctly by immediately applying zeroed durations.
