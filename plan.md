1. **Analyze failing criteria**: The test expects functionality such as an interactive Add Scene form (with validation), deletion with confirmation, a shared state that updates when scenes are modified/added/deleted, functional filter/search, presenter mode, and WebMCP contract bounds.
2. **Rewrite / Extend Vanilla JS app.js**: Since we must not change to a framework, we will extend `app.js` and `index.html` to actually implement the mock state store using Vanilla JS (in-memory).
    - `scenes` array with the 10 seeded items (8 images, 2 placeholders).
    - Render loop to update the `scenes-grid` based on the state.
    - Implement the `Add Scene` dialog/form and validation.
    - Implement `Delete` logic with a dialog.
    - Implement `WebMCP` globals (`window.webmcp_session_info`, `window.webmcp_list_tools`, `window.webmcp_invoke_tool`).
    - Handle `prefers-reduced-motion`.
    - Handle keyboard accessibility, label `<input>` elements.
3. **Verify verify:build**: `verify:build` is just `node -e "require('fs').accessSync('index.html')"`.
4. **Take Screenshot**: We must run `npm start` and use Playwright or just a simple curl script to verify. Wait, no, we must provide a screenshot in `solution/app/README.md`.
5. **Commit**: Finally commit locally.
