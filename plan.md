1. **HTML Updates**: Modify `index.html` to add new buttons to the board header (Rollover, Undo, Redo, Export). Add the filter bar container, bulk tray container, and export canvas modal. Add `aria-describedby` and validation error containers to the Edit Task form.
2. **CSS Updates**: Add styles for the new containers, focus traps, drag-and-drop classes, and animations. Make sure hover states and reduced-motion queries are handled properly.
3. **JS State & Undo/Redo**: Add a history array to store state snapshots on every mutation. Implement Undo and Redo functions.
4. **JS Export/Import**: Implement logic to generate valid ICS string and Planner JSON string from `state.tasks`. Add functions to download them, copy to clipboard, and import from text.
5. **JS Multi-select & Bulk Tray**: Update task rendering to include a selection checkbox. Track selected tasks in state. Reveal bulk tray when `selectedTasks.length > 0`. Implement "Complete selected", "Move to day", "Delete selected".
6. **JS Drag & Drop**: Implement drag and drop for scheduled tasks in the calendar. Dragging updates `startTime`.
7. **JS Filter & Search**: Implement the filter bar. Update rendering to only show tasks that match the channel and search query. Ensure column totals only reflect visible tasks.
8. **JS Validation & Accessibility**: Implement live validation on Add Task and Edit Task forms. Trap focus in modals. Update WebMCP registration to include form and artifact modules.
9. **Verify**: Test all flows using `npm start` and standard verification commands. Ensure anticheat conditions are met (no referencing criteria text).
