# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e.spec.mjs >> 1.3 scene_thumbnails_have_alt_text
- Location: e2e.spec.mjs:140:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('.scene-card').first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('.scene-card').first()

```

```yaml
- banner:
  - button "Docs home"
  - paragraph:
    - button "Demo Projects"
  - heading "Storyboard title menu" [level=1]:
    - button "Storyboard title menu": 1. Getting Started
  - button "Storyboard menu"
  - group "Document tools":
    - button "Undo" [disabled]
    - button "Redo" [disabled]
    - button "Export storyboard"
    - button "Import storyboard"
    - button "Keyboard shortcuts"
    - button "Notifications"
    - button "Dashboard"
    - button "Account"
- main:
  - navigation "Storyboard controls":
    - group "View mode":
      - button "Tile mode" [pressed]
      - button "List mode"
      - button "Slide mode"
    - button "Present storyboard": Present
    - text: Search scenes
    - searchbox "Search scenes"
    - button "Clear search"
    - group "Shot type filter":
      - button "All" [pressed]
      - button "Wide"
      - button "Medium"
      - button "Close-up"
      - button "Insert"
      - button "POV"
    - text: Total duration 191s
  - list:
    - 'listitem "Go to scene 1: Welcome to Docs"': "1"
    - 'listitem "Go to scene 2: Storyboard title and tools"': "2"
    - 'listitem "Go to scene 3: Notifications and dashboard"': "3"
    - 'listitem "Go to scene 4: The user and app settings"': "4"
    - 'listitem "Go to scene 5: Tile, list, or slide mode"': "5"
    - 'listitem "Go to scene 6: Three-dot menu actions"': "6"
    - 'listitem "Go to scene 7: Add scene options"': "7"
    - 'listitem "Go to scene 8: Help and support"': "8"
    - 'listitem "Go to scene 9: Add a frame here"': "9"
    - 'listitem "Go to scene 10: Add a frame here"': "10"
  - text: "1"
  - checkbox "Select scene 1"
  - img "Storyboard scene 1 illustration for the getting started tutorial":
    - img "Storyboard scene 1 illustration for the getting started tutorial"
    - button "Scene 1 actions"
    - text: Wide 18s
  - heading "Welcome to Docs" [level=2]
  - textbox "Scene 1 description": Welcome to Docs! This text is a scene description. You can edit it by clicking directly on the text. We have kept it simple to show you how the product works.
  - text: "2"
  - checkbox "Select scene 2"
  - img "Storyboard scene 2 illustration for the getting started tutorial":
    - img "Storyboard scene 2 illustration for the getting started tutorial"
    - button "Scene 2 actions"
    - text: Medium 24s
  - heading "Storyboard title and tools" [level=2]
  - textbox "Scene 2 description": The header on the left displays the storyboard title and essential tools. Edit modifies your storyboard, Duplicate creates a copy, Share lets you collaborate, Lock prevents edits, and Archive organizes completed storyboards.
  - text: "3"
  - checkbox "Select scene 3"
  - img "Storyboard scene 3 illustration for the getting started tutorial":
    - img "Storyboard scene 3 illustration for the getting started tutorial"
    - button "Scene 3 actions"
    - text: Close-up 22s
  - heading "Notifications and dashboard" [level=2]
  - textbox "Scene 3 description": The right side of the header provides quick access to important updates and management tools. The bell icon keeps you updated with notifications, and the dashboard icon manages all your storyboards, invites members, and reviews archived content.
  - text: "4"
  - checkbox "Select scene 4"
  - img "Storyboard scene 4 illustration for the getting started tutorial":
    - img "Storyboard scene 4 illustration for the getting started tutorial"
    - button "Scene 4 actions"
    - text: Insert 26s
  - heading "The user and app settings" [level=2]
  - textbox "Scene 4 description": Click the user icon to reveal three tabs. Storyboards manages all storyboards, Settings customizes appearance and functionality, and Account adjusts account preferences. Each tab provides tools to control appearance and manage the account.
  - text: "5"
  - checkbox "Select scene 5"
  - img "Storyboard scene 5 illustration for the getting started tutorial":
    - img "Storyboard scene 5 illustration for the getting started tutorial"
    - button "Scene 5 actions"
    - text: Wide 21s
  - heading "Tile, list, or slide mode" [level=2]
  - textbox "Scene 5 description": Control how scenes are displayed. Tile mode views scenes as a grid, list mode shows scene details in a vertical list, and slide mode displays one scene at a time. Refine these options further in Settings.
  - text: "6"
  - checkbox "Select scene 6"
  - img "Storyboard scene 6 illustration for the getting started tutorial":
    - img "Storyboard scene 6 illustration for the getting started tutorial"
    - button "Scene 6 actions"
    - text: POV 25s
  - heading "Three-dot menu actions" [level=2]
  - textbox "Scene 6 description": Hover over any image to reveal the three-dot menu for quick actions. Replace the image, add or edit the description, or reorder, duplicate, or delete scenes. The same menu exposes every per-scene control.
  - text: "7"
  - checkbox "Select scene 7"
  - img "Storyboard scene 7 illustration for the getting started tutorial":
    - img "Storyboard scene 7 illustration for the getting started tutorial"
    - button "Scene 7 actions"
    - text: Medium 23s
  - heading "Add scene options" [level=2]
  - textbox "Scene 7 description": The Add Scene button offers flexible options. Add Scene immediately adds a single scene, while the dropdown lets you import images to upload multiple scenes or change the sort order with precision.
  - text: "8"
  - checkbox "Select scene 8"
  - img "Storyboard scene 8 illustration for the getting started tutorial":
    - img "Storyboard scene 8 illustration for the getting started tutorial"
    - button "Scene 8 actions"
    - text: Close-up 22s
  - heading "Help and support" [level=2]
  - textbox "Scene 8 description": Keep learning and check out the next demo, Create Your First Storyboard. For answers to common questions visit the FAQ, or contact the support team for help with anything else along the way.
  - text: "9"
  - checkbox "Select scene 9"
  - img "Empty camera placeholder scene 9":
    - button "Scene 9 actions"
    - button "Add image to scene 9"
    - text: Insert 5s
  - heading "Add a frame here" [level=2]
  - textbox "Scene 9 description": Camera placeholder. Click the add-image button to attach a frame for this beat of the storyboard, then write what the audience should see.
  - text: "10"
  - checkbox "Select scene 10"
  - img "Empty camera placeholder scene 10":
    - button "Scene 10 actions"
    - button "Add image to scene 10"
    - text: POV 5s
  - heading "Add a frame here" [level=2]
  - textbox "Scene 10 description": Camera placeholder. Add an image here when you are ready to extend the sequence with another shot and its description.
  - button "Add Scene"
  - button "Add scene options"
- status
- alert
- dialog "Getting started tip":
  - text: Tip 1 of 3
  - paragraph: Switch between Tile, List, and Slide to see the same scenes three ways.
  - button "Skip tour"
  - button "Next"
```

# Test source

```ts
  44  |     expect(len, 'body renders visible content').toBeGreaterThan(0);
  45  |   });
  46  |
  47  |   test('webmcp surface is registered and well-formed', async ({ page }) => {
  48  |     await page.goto(BASE);
  49  |     await page.waitForLoadState('networkidle');
  50  |     const kinds = await page.evaluate(() => ({
  51  |       session_info: typeof window.webmcp_session_info,
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
> 144 |     await expect(page.locator('.scene-card').first()).toBeVisible();
      |                                                       ^ Error: expect(locator).toBeVisible() failed
  145 |   });
  146 |
  147 |   test('1.4 create_validation_announced_live', async ({ page }) => {
  148 | // Create-form validation messages are announced via an aria-live polite region as well as shown inline under the field.
  149 |     await page.goto(BASE);
  150 |     await page.waitForLoadState('networkidle');
  151 |
  152 |     await page.getByRole('button', { name: 'Add Scene' }).click();
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
```