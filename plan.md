1.  **Draft execution plan and set up initial structure.**
    - Initialize an execution plan.
    - Set up the Next.js/React structure for the `solution/app` folder, as it is required.
    - Validate `corpuscheck validate` against the created draft files.

2.  **Implementation of `solution/app` (Carry-on Packing Optimizer)**
    - Scaffold a minimal Vite/React frontend in `solution/app`.
    - Implement `spatial composer` interactions to arrange records.
    - Link state for items CRUD operations.
    - Add logic to export/import the portable artifact (`carry-on-pack-v1.json`).

3.  **Implement WebMCP Contract**
    - Expose `window.webmcp_session_info`, `window.webmcp_list_tools`, and `window.webmcp_invoke_tool` conforming to the specified format.
    - Make sure to substitute any instances of brand names with generic ones.

4.  **Produce `evidence.webm`**
    - After the application is ready, record a brief `evidence.webm` using Playwright in the `solution/app` directory showing the end-to-end functionality.

5.  **Clean up and run Pre Commit Steps**
    - Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.

6.  **Submission**
    - Submit the new task.
