# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e.spec.mjs >> 1.4 create_validation_announced_live
- Location: e2e.spec.mjs:147:3

# Error details

```
Error: locator.click: Error: strict mode violation: getByRole('button', { name: 'Add Scene' }) resolved to 2 elements:
    1) <button type="button" data-act="add" class="add-scene" aria-label="Add Scene">Add Scene</button> aka getByRole('button', { name: 'Add Scene', exact: true })
    2) <button type="button" data-act="add" class="add-scene-dropdown" aria-label="Add scene options">…</button> aka getByRole('button', { name: 'Add scene options' })

Call log:
  - waiting for getByRole('button', { name: 'Add Scene' })

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - banner [ref=e4]:
      - button "Docs home" [ref=e5] [cursor=pointer]
      - generic [ref=e7]:
        - paragraph [ref=e8]:
          - button "Demo Projects" [ref=e9] [cursor=pointer]
        - heading "Storyboard title menu" [level=1] [ref=e10]:
          - button "Storyboard title menu" [ref=e11] [cursor=pointer]:
            - generic [ref=e12]: 1. Getting Started
      - button "Storyboard menu" [ref=e13] [cursor=pointer]
      - group "Document tools" [ref=e15]:
        - button "Undo" [disabled] [ref=e16]
        - button "Redo" [disabled] [ref=e18]
        - button "Export storyboard" [ref=e20] [cursor=pointer]
        - button "Import storyboard" [ref=e22] [cursor=pointer]
        - button "Keyboard shortcuts" [ref=e24] [cursor=pointer]
        - button "Notifications" [ref=e27] [cursor=pointer]
        - button "Dashboard" [ref=e29] [cursor=pointer]
        - button "Account" [ref=e31] [cursor=pointer]
    - main [ref=e33]:
      - generic [ref=e34]:
        - navigation "Storyboard controls" [ref=e35]:
          - generic [ref=e36]:
            - group "View mode" [ref=e37]:
              - button "Tile mode" [pressed] [ref=e38] [cursor=pointer]
              - button "List mode" [ref=e40] [cursor=pointer]
              - button "Slide mode" [ref=e42] [cursor=pointer]
            - button "Present storyboard" [ref=e44] [cursor=pointer]:
              - generic [ref=e46]: Present
            - generic [ref=e47]:
              - generic [ref=e48]: Search scenes
              - searchbox "Search scenes" [ref=e49]
              - button "Clear search" [ref=e50] [cursor=pointer]
          - generic [ref=e52]:
            - group "Shot type filter" [ref=e53]:
              - button "All" [pressed] [ref=e54] [cursor=pointer]
              - button "Wide" [ref=e55] [cursor=pointer]
              - button "Medium" [ref=e56] [cursor=pointer]
              - button "Close-up" [ref=e57] [cursor=pointer]
              - button "Insert" [ref=e58] [cursor=pointer]
              - button "POV" [ref=e59] [cursor=pointer]
            - generic [ref=e60]: Total duration 191s
        - generic "Scene overview filmstrip" [ref=e61]:
          - list [ref=e62]:
            - 'listitem "Go to scene 1: Welcome to Docs" [ref=e63] [cursor=pointer]':
              - generic [ref=e64]: "1"
            - 'listitem "Go to scene 2: Storyboard title and tools" [ref=e65] [cursor=pointer]':
              - generic [ref=e66]: "2"
            - 'listitem "Go to scene 3: Notifications and dashboard" [ref=e67] [cursor=pointer]':
              - generic [ref=e68]: "3"
            - 'listitem "Go to scene 4: The user and app settings" [ref=e69] [cursor=pointer]':
              - generic [ref=e70]: "4"
            - 'listitem "Go to scene 5: Tile, list, or slide mode" [ref=e71] [cursor=pointer]':
              - generic [ref=e72]: "5"
            - 'listitem "Go to scene 6: Three-dot menu actions" [ref=e73] [cursor=pointer]':
              - generic [ref=e74]: "6"
            - 'listitem "Go to scene 7: Add scene options" [ref=e75] [cursor=pointer]':
              - generic [ref=e76]: "7"
            - 'listitem "Go to scene 8: Help and support" [ref=e77] [cursor=pointer]':
              - generic [ref=e78]: "8"
            - 'listitem "Go to scene 9: Add a frame here" [ref=e79] [cursor=pointer]':
              - generic [ref=e81]: "9"
            - 'listitem "Go to scene 10: Add a frame here" [ref=e82] [cursor=pointer]':
              - generic [ref=e84]: "10"
        - generic [ref=e85]:
          - generic [ref=e86]:
            - generic [ref=e87]: "1"
            - generic [ref=e88]:
              - checkbox "Select scene 1" [ref=e89] [cursor=pointer]
              - generic [ref=e90]:
                - img "Storyboard scene 1 illustration for the getting started tutorial" [ref=e91]:
                  - img "Storyboard scene 1 illustration for the getting started tutorial" [ref=e92]
                  - button "Scene 1 actions" [ref=e93] [cursor=pointer]
                  - generic [ref=e95]:
                    - generic [ref=e96]: Wide
                    - generic [ref=e97]: 18s
                - heading "Welcome to Docs" [level=2] [ref=e99]
                - textbox "Scene 1 description" [ref=e100]: Welcome to Docs! This text is a scene description. You can edit it by clicking directly on the text. We have kept it simple to show you how the product works.
          - generic [ref=e101]:
            - generic [ref=e102]: "2"
            - generic [ref=e103]:
              - checkbox "Select scene 2" [ref=e104] [cursor=pointer]
              - generic [ref=e105]:
                - img "Storyboard scene 2 illustration for the getting started tutorial" [ref=e106]:
                  - img "Storyboard scene 2 illustration for the getting started tutorial" [ref=e107]
                  - button "Scene 2 actions" [ref=e108] [cursor=pointer]
                  - generic [ref=e110]:
                    - generic [ref=e111]: Medium
                    - generic [ref=e112]: 24s
                - heading "Storyboard title and tools" [level=2] [ref=e114]
                - textbox "Scene 2 description" [ref=e115]: The header on the left displays the storyboard title and essential tools. Edit modifies your storyboard, Duplicate creates a copy, Share lets you collaborate, Lock prevents edits, and Archive organizes completed storyboards.
          - generic [ref=e116]:
            - generic [ref=e117]: "3"
            - generic [ref=e118]:
              - checkbox "Select scene 3" [ref=e119] [cursor=pointer]
              - generic [ref=e120]:
                - img "Storyboard scene 3 illustration for the getting started tutorial" [ref=e121]:
                  - img "Storyboard scene 3 illustration for the getting started tutorial" [ref=e122]
                  - button "Scene 3 actions" [ref=e123] [cursor=pointer]
                  - generic [ref=e125]:
                    - generic [ref=e126]: Close-up
                    - generic [ref=e127]: 22s
                - heading "Notifications and dashboard" [level=2] [ref=e129]
                - textbox "Scene 3 description" [ref=e130]: The right side of the header provides quick access to important updates and management tools. The bell icon keeps you updated with notifications, and the dashboard icon manages all your storyboards, invites members, and reviews archived content.
          - generic [ref=e131]:
            - generic [ref=e132]: "4"
            - generic [ref=e133]:
              - checkbox "Select scene 4" [ref=e134] [cursor=pointer]
              - generic [ref=e135]:
                - img "Storyboard scene 4 illustration for the getting started tutorial" [ref=e136]:
                  - img "Storyboard scene 4 illustration for the getting started tutorial" [ref=e137]
                  - button "Scene 4 actions" [ref=e138] [cursor=pointer]
                  - generic [ref=e140]:
                    - generic [ref=e141]: Insert
                    - generic [ref=e142]: 26s
                - heading "The user and app settings" [level=2] [ref=e144]
                - textbox "Scene 4 description" [ref=e145]: Click the user icon to reveal three tabs. Storyboards manages all storyboards, Settings customizes appearance and functionality, and Account adjusts account preferences. Each tab provides tools to control appearance and manage the account.
          - generic [ref=e146]:
            - generic [ref=e147]: "5"
            - generic [ref=e148]:
              - checkbox "Select scene 5" [ref=e149] [cursor=pointer]
              - generic [ref=e150]:
                - img "Storyboard scene 5 illustration for the getting started tutorial" [ref=e151]:
                  - img "Storyboard scene 5 illustration for the getting started tutorial" [ref=e152]
                  - button "Scene 5 actions" [ref=e153] [cursor=pointer]
                  - generic [ref=e155]:
                    - generic [ref=e156]: Wide
                    - generic [ref=e157]: 21s
                - heading "Tile, list, or slide mode" [level=2] [ref=e159]
                - textbox "Scene 5 description" [ref=e160]: Control how scenes are displayed. Tile mode views scenes as a grid, list mode shows scene details in a vertical list, and slide mode displays one scene at a time. Refine these options further in Settings.
          - generic [ref=e161]:
            - generic [ref=e162]: "6"
            - generic [ref=e163]:
              - checkbox "Select scene 6" [ref=e164] [cursor=pointer]
              - generic [ref=e165]:
                - img "Storyboard scene 6 illustration for the getting started tutorial" [ref=e166]:
                  - img "Storyboard scene 6 illustration for the getting started tutorial" [ref=e167]
                  - button "Scene 6 actions" [ref=e168] [cursor=pointer]
                  - generic [ref=e170]:
                    - generic [ref=e171]: POV
                    - generic [ref=e172]: 25s
                - heading "Three-dot menu actions" [level=2] [ref=e174]
                - textbox "Scene 6 description" [ref=e175]: Hover over any image to reveal the three-dot menu for quick actions. Replace the image, add or edit the description, or reorder, duplicate, or delete scenes. The same menu exposes every per-scene control.
          - generic [ref=e176]:
            - generic [ref=e177]: "7"
            - generic [ref=e178]:
              - checkbox "Select scene 7" [ref=e179] [cursor=pointer]
              - generic [ref=e180]:
                - img "Storyboard scene 7 illustration for the getting started tutorial" [ref=e181]:
                  - img "Storyboard scene 7 illustration for the getting started tutorial" [ref=e182]
                  - button "Scene 7 actions" [ref=e183] [cursor=pointer]
                  - generic [ref=e185]:
                    - generic [ref=e186]: Medium
                    - generic [ref=e187]: 23s
                - heading "Add scene options" [level=2] [ref=e189]
                - textbox "Scene 7 description" [ref=e190]: The Add Scene button offers flexible options. Add Scene immediately adds a single scene, while the dropdown lets you import images to upload multiple scenes or change the sort order with precision.
          - generic [ref=e191]:
            - generic [ref=e192]: "8"
            - generic [ref=e193]:
              - checkbox "Select scene 8" [ref=e194] [cursor=pointer]
              - generic [ref=e195]:
                - img "Storyboard scene 8 illustration for the getting started tutorial" [ref=e196]:
                  - img "Storyboard scene 8 illustration for the getting started tutorial" [ref=e197]
                  - button "Scene 8 actions" [ref=e198] [cursor=pointer]
                  - generic [ref=e200]:
                    - generic [ref=e201]: Close-up
                    - generic [ref=e202]: 22s
                - heading "Help and support" [level=2] [ref=e204]
                - textbox "Scene 8 description" [ref=e205]: Keep learning and check out the next demo, Create Your First Storyboard. For answers to common questions visit the FAQ, or contact the support team for help with anything else along the way.
          - generic [ref=e206]:
            - generic [ref=e207]: "9"
            - generic [ref=e208]:
              - checkbox "Select scene 9" [ref=e209] [cursor=pointer]
              - generic [ref=e210]:
                - img "Empty camera placeholder scene 9" [ref=e211]:
                  - button "Scene 9 actions" [ref=e212] [cursor=pointer]
                  - button "Add image to scene 9" [ref=e215] [cursor=pointer]
                  - generic [ref=e217]:
                    - generic [ref=e218]: Insert
                    - generic [ref=e219]: 5s
                - heading "Add a frame here" [level=2] [ref=e221]
                - textbox "Scene 9 description" [ref=e222]: Camera placeholder. Click the add-image button to attach a frame for this beat of the storyboard, then write what the audience should see.
          - generic [ref=e223]:
            - generic [ref=e224]: "10"
            - generic [ref=e225]:
              - checkbox "Select scene 10" [ref=e226] [cursor=pointer]
              - generic [ref=e227]:
                - img "Empty camera placeholder scene 10" [ref=e228]:
                  - button "Scene 10 actions" [ref=e229] [cursor=pointer]
                  - button "Add image to scene 10" [ref=e232] [cursor=pointer]
                  - generic [ref=e234]:
                    - generic [ref=e235]: POV
                    - generic [ref=e236]: 5s
                - heading "Add a frame here" [level=2] [ref=e238]
                - textbox "Scene 10 description" [ref=e239]: Camera placeholder. Add an image here when you are ready to extend the sequence with another shot and its description.
          - generic [ref=e242]:
            - button "Add Scene" [ref=e243] [cursor=pointer]
            - button "Add scene options" [ref=e244] [cursor=pointer]
  - status [ref=e246]
  - alert [ref=e247]
```

# Test source

```ts
  52  |       list_tools: typeof window.webmcp_list_tools,
  53  |       invoke_tool: typeof window.webmcp_invoke_tool,
  54  |     }));
  55  |     expect(kinds).toEqual({ session_info: 'function', list_tools: 'function', invoke_tool: 'function' });
  56  |     const tools = await listTools(page);
  57  |     const arr = Array.isArray(tools) ? tools : tools?.tools ?? [];
  58  |     expect(arr.length, 'at least one webmcp tool registered').toBeGreaterThan(0);
  59  |     for (const t of arr) expect(typeof (t.name ?? t.id), 'every tool has a name').toBe('string');
  60  |   });
  61  |
  62  |   test('reduced motion behaviorally suppresses animation', async ({ page }) => {
  63  |     await page.emulateMedia({ reducedMotion: 'reduce' });
  64  |     // Install the collector before navigation so load/hydration animations are
  65  |     // observed too. Keep it running through network idle and a settled 1.5s
  66  |     // window so late-starting effects cannot escape the assertion.
  67  |     await page.addInitScript(() => {
  68  |       window.__reducedMotionOffenders = [];
  69  |       const seen = new Set();
  70  |       const sample = () => {
  71  |         for (const animation of document.getAnimations({ subtree: true })) {
  72  |           if (animation.playState !== 'running') continue;
  73  |           let timing = {};
  74  |           try { timing = animation.effect?.getComputedTiming?.() ?? {}; } catch { /* detached */ }
  75  |           const duration = typeof timing.duration === 'number' ? timing.duration : 0;
  76  |           if (duration <= 1) continue;
  77  |           const offender = {
  78  |             kind: animation.constructor?.name ?? 'Animation',
  79  |             name: animation.animationName ?? animation.transitionProperty ?? animation.id ?? '(anonymous)',
  80  |             duration,
  81  |             iterations: timing.iterations ?? 1,
  82  |           };
  83  |           const key = JSON.stringify(offender);
  84  |           if (!seen.has(key)) {
  85  |             seen.add(key);
  86  |             window.__reducedMotionOffenders.push(offender);
  87  |           }
  88  |         }
  89  |         requestAnimationFrame(sample);
  90  |       };
  91  |       requestAnimationFrame(sample);
  92  |     });
  93  |     await page.goto(BASE);
  94  |     await page.waitForLoadState('networkidle');
  95  |     // Precondition sanity check: the emulation actually reaches the app.
  96  |     const reduced = await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  97  |     expect(reduced, 'precondition: app sees prefers-reduced-motion: reduce').toBe(true);
  98  |     // Observe every frame for another 1.5s after load settles and assert on
  99  |     // everything seen since the document started.
  100 |     // Finished, idle, or paused effects and durations <=1ms are allowed; any
  101 |     // meaningfully timed RUNNING effect at any sample is a reduced-motion
  102 |     // failure. Apps with zero animations pass vacuously (the render/console
  103 |     // test still gates them).
  104 |     await page.waitForTimeout(1500);
  105 |     const offenders = await page.evaluate(() => window.__reducedMotionOffenders ?? []);
  106 |     expect(offenders, 'no running animation/transition with meaningful duration under reduced motion').toEqual([]);
  107 |   });
  108 |
  109 |   test('no horizontal overflow at 375px', async ({ page }) => {
  110 |     await page.setViewportSize({ width: 375, height: 812 });
  111 |     await page.goto(BASE);
  112 |     await page.waitForLoadState('networkidle');
  113 |     const overflow = await page.evaluate(() =>
  114 |       document.documentElement.scrollWidth - document.documentElement.clientWidth);
  115 |     expect(overflow, 'no horizontal page scroll at 375px').toBeLessThanOrEqual(1);
  116 |   });
  117 | });
  118 |
  119 | // ==== END CANONICAL REGION — add task-specific criterion tests below. ====
  120 |
  121 |
  122 |   test('1.1 keyboard_operable_storyboard_controls', async ({ page }) => {
  123 | // Every interactive control — header tools, Tile/List/Slide toggles, scene actions, Add Scene create form, and slide previous/next — is reachable and operable with the keyboard alone (Tab, Shift+Tab, Enter/Space), each showing a visible focus indicator when focused.
  124 |     await page.goto(BASE);
  125 |     await page.waitForLoadState('networkidle');
  126 |
  127 |     await page.getByRole('button', { name: 'Add Scene' }).click();
  128 |     await expect(page.getByLabel(/title/i)).toBeVisible();
  129 |   });
  130 |
  131 |   test('1.2 create_form_focus_management', async ({ page }) => {
  132 | // When the Add Scene create form opens as a dialog or overlay, focus moves into the form; closing it returns focus to a sensible origin control such as Add Scene.
  133 |     await page.goto(BASE);
  134 |     await page.waitForLoadState('networkidle');
  135 |
  136 |     await page.getByRole('button', { name: 'Add Scene' }).click();
  137 |     await expect(page.getByLabel(/title/i)).toBeVisible();
  138 |   });
  139 |
  140 |   test('1.3 scene_thumbnails_have_alt_text', async ({ page }) => {
  141 | // Every scene thumbnail image carries descriptive alternative text.
  142 |     await page.goto(BASE);
  143 |     await page.waitForLoadState('networkidle');
  144 |     await expect(page.locator('.scene-card').first()).toBeVisible();
  145 |   });
  146 |
  147 |   test('1.4 create_validation_announced_live', async ({ page }) => {
  148 | // Create-form validation messages are announced via an aria-live polite region as well as shown inline under the field.
  149 |     await page.goto(BASE);
  150 |     await page.waitForLoadState('networkidle');
  151 |
> 152 |     await page.getByRole('button', { name: 'Add Scene' }).click();
      |                                                           ^ Error: locator.click: Error: strict mode violation: getByRole('button', { name: 'Add Scene' }) resolved to 2 elements:
  153 |     await expect(page.getByLabel(/title/i)).toBeVisible();
  154 |   });
  155 |
  156 |   test('1.5 create_fields_explicitly_labeled', async ({ page }) => {
  157 | // The Add Scene title and description fields use explicit label elements associated with those controls.
  158 |     await page.goto(BASE);
  159 |     await page.waitForLoadState('networkidle');
  160 |
  161 |     await page.getByRole('button', { name: 'Add Scene' }).click();
  162 |     await expect(page.getByLabel(/title/i)).toBeVisible();
  163 |   });
  164 |
  165 |   test('1.6 headings_follow_logical_order', async ({ page }) => {
  166 | // Workspace headings (for example the storyboard title 1. Getting Started and section labels) follow a logical order with no skipped levels.
  167 |     await page.goto(BASE);
  168 |     await page.waitForLoadState('networkidle');
  169 |     await expect(page.locator('.scene-card').first()).toBeVisible();
  170 |   });
  171 |
  172 |   test('1.7 workspace_landmarks_present', async ({ page }) => {
  173 | // The app exposes semantic landmarks (for example header/nav for chrome and main for the scene board) so assistive technology can navigate the tool.
  174 |     await page.goto(BASE);
  175 |     await page.waitForLoadState('networkidle');
  176 |     await expect(page.locator('.scene-card').first()).toBeVisible();
  177 |   });
  178 |
  179 |   test('1.8 text_and_controls_have_contrast', async ({ page }) => {
  180 | // Header titles, scene description text, view toggles, and primary buttons meet sufficient contrast against their surfaces on the light workspace.
  181 |     await page.goto(BASE);
  182 |     await page.waitForLoadState('networkidle');
  183 |     await expect(page.locator('.scene-card').first()).toBeVisible();
  184 |   });
  185 |
  186 |   test('1.9 active_view_toggle_exposed_to_at', async ({ page }) => {
  187 | // The active Tile, List, or Slide toggle exposes its pressed state to assistive technology (for example aria-pressed or an equivalent selected state), not only a visual highlight.
  188 |     await page.goto(BASE);
  189 |     await page.waitForLoadState('networkidle');
  190 |
  191 |     await page.getByRole('button', { name: 'Slide' }).click();
  192 |     await expect(page.locator('text=of')).toBeVisible();
  193 |   });
  194 |
  195 |   test('1.10 reduced_motion_respected', async ({ page }) => {
  196 | // With prefers-reduced-motion set, scene entrance staggers and Tile/List/Slide layout animations are removed and state changes apply instantly while every feature — create, edit, delete, and slide navigation — stays usable.
  197 |     await page.goto(BASE);
  198 |     await page.waitForLoadState('networkidle');
  199 |
  200 |     await page.getByRole('checkbox').first().check();
  201 |     await page.getByRole('button', { name: 'Delete selected' }).click();
  202 |     await expect(page.locator('.scene-card').first()).toBeVisible();
  203 |   });
  204 |
  205 |   test('1.11 undo_redo_export_import_keyboard', async ({ page }) => {
  206 | // Undo, Redo, Export, Import, multi-select checkboxes, and bulk Delete selected are reachable and operable with the keyboard alone with a visible focus indicator
  207 |     await page.goto(BASE);
  208 |     await page.waitForLoadState('networkidle');
  209 |
  210 |     await page.getByRole('checkbox').first().check();
  211 |     await page.getByRole('button', { name: 'Delete selected' }).click();
  212 |     await expect(page.locator('.scene-card').first()).toBeVisible();
  213 |   });
  214 |
  215 |   test('1.12 import_validation_announced_live', async ({ page }) => {
  216 | // Import field-contract validation errors are announced via an aria-live polite region as well as shown inline
  217 |     await page.goto(BASE);
  218 |     await page.waitForLoadState('networkidle');
  219 |
  220 |     await page.getByRole('button', { name: 'Import' }).click();
  221 |     await expect(page.locator('textarea')).toBeVisible();
  222 |   });
  223 |
  224 |   test('1.13 search_chips_presenter_keyboard', async ({ page }) => {
  225 | // The search field carries a programmatically associated label, each shot-type filter chip exposes its selected state to assistive technology, and the Present control plus all presenter controls (Pause/Resume, previous/next, End presentation) are keyboard reachable and operable with visible focus indicators
  226 |     await page.goto(BASE);
  227 |     await page.waitForLoadState('networkidle');
  228 |
  229 |     await page.getByRole('button', { name: 'Present' }).click();
  230 |     await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();
  231 |   });
  232 |
  233 |   test('1.14 presenter_escape_and_announcements', async ({ page }) => {
  234 | // In the presenter, pressing Escape always exits back to the board, and scene changes (manual or auto-advance) are announced through an aria-live polite region as well as shown visually
  235 |     await page.goto(BASE);
  236 |     await page.waitForLoadState('networkidle');
  237 |
  238 |     await page.getByRole('button', { name: 'Present' }).click();
  239 |     await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();
  240 |   });
  241 |
  242 |   test('1.15 back_to_top_appears_after_scroll', async ({ page }) => {
  243 | // After scrolling the board down past roughly 400px a back-to-top control appears; clicking it returns the board to the top and the control hides
  244 |     await page.goto(BASE);
  245 |     await page.waitForLoadState('networkidle');
  246 |     await expect(page.locator('.scene-card').first()).toBeVisible();
  247 |   });
  248 |
  249 |   test('1.17 crud_updates_derived_counts', async ({ page }) => {
  250 | // The scenes collection supports create, edit, and delete from the UI, with scene numbering and the Slide N / total counter updating from the same shared collection
  251 |     await page.goto(BASE);
  252 |     await page.waitForLoadState('networkidle');
```