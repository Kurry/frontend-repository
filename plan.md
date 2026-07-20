1. **Accessibility & CSS fixes**:
   - Fix contrast of text on cream hero (needs dark text `rgb(17,17,18)`).
   - Fix lime button text to black.
   - `prefers-reduced-motion` CSS to disable marquee and JS logic to disable scroll-linked media.
2. **State & Undo/Redo**:
   - Implement `state` object with `races`, `shortlist`, `newsletter`, `undoStack`, `redoStack`.
3. **HTML structure additions**:
   - Add `PRESS KIT` and `Selected races / Shortlist` counters to `<header>`.
   - Add `Shortlist` buttons to horizontal media cards and helmet cards.
   - Add `<section id="race-calendar">` with filters and list.
   - Add Newsletter form in `<footer>`.
   - Add Press Kit Drawer modal.
   - Add Command Palette modal.
4. **JavaScript implementation**:
   - Race calendar logic (render, filter, edit status, select).
   - Shortlist logic.
   - Newsletter validation and submission.
   - Press Kit generation (JSON, MD, ICS), copy, download, import.
   - Command Palette search and actions.
   - Undo/Redo system.
   - MCP bindings for the above.
5. **Pre-commit checks & Submission**.
