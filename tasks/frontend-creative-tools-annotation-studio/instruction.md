<summary>
Build an annotation studio for the Corvid evaluation platform using React, Zustand, Tailwind CSS 4.3.2, and IBM Carbon Design System. The app produces the operator's labeling package: a downloadable and copyable Labels JSON document (plus Annotations JSONL and a Stats summary) compiled live from submitted annotations, taxonomy, regions, metadata fields, and review states, conforming to the same API-shaped field contracts as create and edit forms, with Import that round-trips that Labels JSON.
</summary>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit):

Feature: Annotation queue —
- The left sidebar shows a queue of unannotated eval outputs grouped by eval suite (at least 3 seeded suites on first load), with a count badge of remaining items per suite
- Clicking a suite loads its unannotated items into the main panel in queue order; the queue count decrements each time an item is submitted
- Each queue entry carries a selection checkbox and a review-state chip showing one of Unlabeled, Labeled, Reviewed, or Disputed; the chip updates in place when the item's state changes
- A Select all control per suite checks every visible item in that suite; a bulk actions bar appears whenever at least one item is selected and shows the live selected count
- Bulk actions apply to every selected item at once: Skip selected moves them all to the end of the queue with skipped badges, Mark reviewed sets their state to Reviewed, and Clear selection unchecks everything; after a bulk action the selection clears and the affected chips and badges all update without a reload

Feature: Annotation card —
- The main panel shows one output at a time: the original prompt at the top in a read-only code snippet block, then the model response in a scrollable body area
- A thumbs-up / thumbs-down binary rating pair appears below the response; selecting one highlights the active choice in the Carbon brand blue
- A rubric scoring section shows one labeled slider per rubric dimension (Accuracy, Clarity, Relevance at minimum) ranging from 1 to 5; each slider shows the current numeric value to its right and the value updates as the slider moves
- A free-text comments field at the bottom accepts optional annotator notes up to 500 characters with a live character counter that counts down as the annotator types; input beyond 500 characters is prevented and the counter shows 0 remaining
- Items that carry an attached image show it in a region annotation area above the response body; items without an image show only the prompt and response
- Submitting the card produces an AnnotationCreate record that IS the would-be annotation request body a labeling API would accept. AnnotationCreate field contract (API-shaped create payload; all keys required unless marked optional; example values illustrative only; enforced with inline errors naming the offending field before submit, and with Submit & Next disabled until every required field is valid):
  - rating: required closed enum exactly one of up or down
  - scores: required object with keys Accuracy, Clarity, and Relevance; each value is an integer from 1 to 5 inclusive
  - comment: optional string of at most 500 characters (empty string allowed); further input is prevented at 500
  - metadata: required object keyed by metadata field name; each value matches that field's kind (string for text, finite number for number, one of the field's options for select, boolean for checkbox); may be empty when no metadata fields exist
  - regions: required array (may be empty) of RegionCreate objects matching the RegionCreate field contract below
- Cross-field rules for AnnotationCreate: a score outside 1 to 5, a rating outside up or down, a comment longer than 500 characters, a metadata value that fails its field's kind, or a region that fails RegionCreate is invalid; invalid payloads save nothing and leave the queue unchanged

Feature: Submit and advance —
- A Submit & Next button is disabled until the AnnotationCreate payload is valid (binary rating chosen and every rubric dimension slider interacted with so each score is an integer 1 to 5); clicking it saves the AnnotationCreate record, sets the item's state to Labeled, removes the item from the unannotated queue, and loads the next unannotated item
- A Skip button moves the current item to the end of the queue without saving; a skipped count badge appears in that suite's sidebar entry and increments with each skip
- Submitting the last unannotated item in a suite shows an empty state in the main panel naming the suite as complete and offering a control to switch suites or open the review queue

Feature: Command palette —
- Pressing Ctrl+K (Cmd+K on macOS) opens a command palette overlay with a search input focused; typing fuzzy-matches across queue items (by title), suites, taxonomy classes, and view names, and the result list narrows as the user types
- Arrow keys move a visible highlight through the results and Enter activates the highlighted one: an item result opens that item in the annotation card, a suite result selects the suite, a class result opens it in the Taxonomy view, and a view result switches to that view; Escape closes the palette and returns focus to where it was
- Each result row shows a kind label (Item, Suite, Class, or View) so results of different kinds are distinguishable; a query matching nothing shows an empty-state line in the palette rather than a blank list

Feature: Label taxonomy builder —
- A Taxonomy view lists the seeded label classes (at least 5 on first load); each class row shows its name, a color swatch, its badge icon, its single-key keyboard shortcut, and its attribute list
- Clicking New Class opens a form that produces a TaxonomyClassCreate record that IS the would-be class create request body. TaxonomyClassCreate field contract (API-shaped create/update payload; all keys required unless marked optional; example values illustrative only; enforced with inline errors naming the offending field before submit, and with Save disabled until every required field is valid):
  - name: required string of 1 to 60 characters after trim; must be unique among classes (case-insensitive)
  - color: required string matching the closed fixed palette as a hex color of the form #RRGGBB
  - icon: required non-empty string identifying one icon from the searchable icon picker
  - shortcut: required string that is exactly one character from the closed set 1 through 9; must be unique across classes
  - attributes: required array (may be empty); each element has name (required non-empty string), kind (required closed enum exactly select or text), and when kind is select an options array of at least one non-empty trimmed string (comma-separated entry in the form maps to that array)
- Cross-field rules for TaxonomyClassCreate: a duplicate shortcut or duplicate name is invalid and names the conflicting class; a select attribute with an empty options list is invalid and names the attribute options field; values outside the closed shortcut or attribute-kind sets are invalid
- The icon picker shows a searchable grid of at least 20 icons where typing filters the grid and clicking an icon selects it with a visible selected treatment; the chosen badge icon then renders beside the class name everywhere the class appears: the taxonomy list, the class picker, and its region list rows
- Submitting the class form with a shortcut already used by another class shows an inline validation message naming the shortcut field and identifying the conflicting class, and saves nothing
- Saving a valid class adds exactly one row to the taxonomy list, and the new class immediately appears in the annotation card's class picker and responds to its keyboard shortcut without a reload
- Editing a class opens the same form prefilled with the same field contract; renaming a class updates its name everywhere it appears — taxonomy list, class picker, existing region labels, and the export preview — without a reload
- Deleting a class that is used by existing regions shows a confirmation dialog stating the exact count of regions that carry it; confirming removes the class and marks those regions as Unclassified

Feature: Custom metadata fields —
- A Metadata fields section in the Taxonomy view lets the user define custom annotation fields that produce a MetadataFieldCreate record that IS the would-be field create request body. MetadataFieldCreate field contract (API-shaped create payload; all keys required unless marked optional; example values illustrative only; Save disabled until valid):
  - name: required string of 1 to 40 characters after trim; must be unique among metadata fields (case-insensitive)
  - kind: required closed enum exactly one of text, number, select, or checkbox
  - options: required array of at least one non-empty trimmed string when kind is select (comma-separated entry in the form maps to that array); must be omitted or empty when kind is text, number, or checkbox
- Cross-field rules for MetadataFieldCreate: select without a non-empty options list is invalid and names options; a duplicate name is invalid and names name; a kind outside the closed set is invalid
- Saving a valid field adds one row to the field list and the new field immediately appears on the annotation card below the comments field, rendered as the matching control for its kind
- At least 2 metadata fields are seeded on first load (one select and one checkbox) and already render on the annotation card
- Values entered in metadata fields save with the AnnotationCreate.metadata object: they appear in the History read-only view and inside that annotation's entry in the Labels JSON export preview, keyed by field name
- A number-kind field rejects non-numeric input with an inline validation message naming the field, and the annotation still submits once the value is corrected; deleting a metadata field removes its control from the card and shows a confirmation dialog stating the exact count of saved annotations that carry values for it

Feature: Region annotation on images —
- On an image-bearing item, pressing a class's keyboard shortcut or picking it from the class picker arms that class; dragging on the image then draws a bounding box that produces a RegionCreate record that IS the would-be region create request body. RegionCreate field contract (API-shaped create payload; all keys required unless marked optional; example values illustrative only):
  - classId: required non-empty string that must equal an existing taxonomy class id
  - x: required number greater than or equal to 0 (image-relative left edge)
  - y: required number greater than or equal to 0 (image-relative top edge)
  - w: required number greater than or equal to 8 (width in image pixels)
  - h: required number greater than or equal to 8 (height in image pixels)
  - attributeValues: required object keyed by attribute name for the class's attributes (may be empty when the class has no attributes); select attributes must use one of that attribute's options; text attributes are strings of at most 120 characters
- Cross-field rules for RegionCreate: x plus w and y plus h must stay within the image width and height; a box with w or h below 8 is a sliver and is discarded rather than created; a classId that does not match any taxonomy class is invalid
- Each drawn box appears simultaneously in a region list beside the image showing its class, its attribute values, and a delete control; deleting a list entry removes exactly that box from the image
- Selecting a box (on the image or in the list) highlights it in both places and shows its attribute form; attribute values chosen there (for example a severity select) display on the region list entry and update the RegionCreate.attributeValues object
- Zoom controls (plus, minus, and fit) scale the image; boxes keep their positions relative to the image content at every zoom level
- Dragging with the pan tool active moves the zoomed image within its viewport; boxes move with the image

Feature: Review states and review queue —
- Every item carries exactly one review state stored as review_state with closed enum unlabeled, labeled, reviewed, or disputed (UI labels Unlabeled, Labeled, Reviewed, Disputed map to those values); submitting an annotation moves unlabeled to labeled, a Mark reviewed control moves labeled to reviewed, and a Dispute control submits a DisputeCreate payload that moves labeled or reviewed to disputed
- DisputeCreate field contract (the dispute submit IS the would-be dispute request body; all keys required; example values illustrative only): reason (required string of 1 to 200 characters after trim, a single line with no newline characters). Dispute stays disabled until reason is valid; an empty, over-length, or multi-line reason shows an inline message naming the reason field and changes no review state
- A Review queue view lists labeled items in three priority tiers shown top to bottom: Disputed first, then Labeled awaiting review, then Reviewed; each tier shows a live count and items move between tiers immediately as their states change
- Resolving a disputed item (a Resolve control that records the corrected rating as ResolveCreate: rating required closed enum up or down) returns it to the Reviewed tier and decrements the Disputed tier count by exactly one
- The tier ordering is a priority queue, not a static grouping: a newly disputed item appears at the top of the Disputed tier, and the same item disputed a second time returns to the top of the Disputed tier rather than keeping its old position

Feature: Inter-annotator agreement —
- An Agreement view compares the two seeded simulated annotators (Annotator A — Kestrel, Annotator B — Juniper) over the seeded double-annotated items (at least 12 across the suites); it renders one row per double-annotated item showing both annotators' binary ratings, each rubric dimension's two scores, and an agreement indicator
- A row is flagged as a disagreement when the two binary ratings differ or any rubric dimension's scores differ by 2 or more; flagged rows carry a visibly distinct warning treatment and a Flag for dispute control
- A summary strip above the table shows the suite's agreement percentage (the share of unflagged rows) and the count of flagged rows; switching the suite selector recomputes the table rows and both summary figures for the selected suite
- Activating Flag for dispute on a disagreement row sets that item's review state to Disputed, and the item immediately appears in the Review queue's Disputed tier

Feature: Assist run with visible steps —
- A Run Assist control on a suite starts a simulated pre-labeling pass decomposed into one visible step per unannotated item: each step shows the item's title and a status that advances visibly through pending, running, and complete or failed; a retrying step shows a retrying status
- Occasional simulated step failures retry automatically: the step shows a visible backoff countdown and an attempt counter (for example, waiting before retry 2 of 3); a step that exhausts its retries is marked failed with an inline error summary and a manual Retry control
- Activating a failed step's Retry control resumes the run from that step — steps already completed keep their original outputs and timestamps and never re-execute
- A running assist pass can be paused and resumed: pausing freezes step progression at the current step; resuming continues from exactly that step, with completed steps unchanged
- A run-level rollup derives live from the step states — completed count out of total (n of m), overall elapsed duration, and failure count — and updates as steps advance
- Each assist run has an event timeline: an ordered log of step transitions with timestamps, filterable by status; selecting a timeline entry highlights the corresponding step
- A completed assist step attaches a suggested rating to its item, visibly marked as Suggested on the annotation card; the annotator can accept it with one control (which fills the binary rating and sliders) or ignore it — a suggestion never counts as a submitted annotation on its own

Feature: Undo and redo —
- Undo and Redo controls sit in the top toolbar and also respond to Ctrl+Z and Ctrl+Shift+Z (Cmd on macOS); both controls are disabled when their stack is empty
- Undo reverses the most recent annotation action — a submitted annotation, a skip, a bulk action, a region box add or delete, a taxonomy edit, or a review-state change — and restores the exact prior state: queue counts, badges, chips, and the export preview all return to their previous values
- Redo reapplies the most recently undone action with the same completeness; performing a new action after an undo clears the redo stack and disables Redo
- A history panel lists the most recent actions in order with a human-readable label per action (for example, Submitted annotation, Skipped 3 items, Added region); undoing visibly removes or marks the reverted entry

Feature: Annotation history —
- A History tab in the left sidebar lists all submitted annotations with the response summary, the binary rating, and the date; clicking one opens a read-only view of the saved ratings, comments, and any region boxes
- New submissions appear in the history list immediately, and an undone submission disappears from it

Feature: Export center and Import (API-shaped LabelsPackage) —
- The app produces the operator's labeling artifacts: a Download JSONL control above the queue plus an Export view with live-compiled previews. Export shows a monospaced preview with two tabs — Labels JSON and Stats summary — plus Copy export, Download, and Import affordances on the Labels JSON tab
- Download JSONL exports all completed annotations as a JSONL file where each line is an AnnotationsJsonlLine object conforming to this field contract: prompt (required string), response (required string), rating (required closed enum up or down), scores (required object with Accuracy, Clarity, and Relevance integers 1 to 5), comment (required string of at most 500 characters), metadata (required object keyed by field name), regions (required array of RegionCreate objects)
- Labels JSON is a single LabelsPackage object API-shaped like a labeling-dataset upsert payload. LabelsPackage field contract (Copy, Download, and Import all conform to this same shape; field names and enum values are visible in the preview text; all keys and nesting required unless marked optional; example values illustrative only):
  - schemaVersion: required string exactly annotation-studio-labels-v1
  - taxonomy: required array of TaxonomyClass records; each element carries id (required non-empty string), name, color, icon, shortcut, and attributes matching the TaxonomyClassCreate field contract plus id
  - metadataFields: required array of MetadataField records; each element carries id (required non-empty string), name, kind, and options matching the MetadataFieldCreate field contract plus id
  - items: required array of ItemRecord objects; each element carries id (required non-empty string), suite (required non-empty string), review_state (required closed enum unlabeled, labeled, reviewed, or disputed), and annotation (null when review_state is unlabeled; otherwise an AnnotationCreate object with rating, scores, comment, metadata, and regions)
- Cross-field rules for LabelsPackage: every RegionCreate.classId in any item's regions must reference a taxonomy[].id present in the package; every annotation.metadata key must match a metadataFields[].name when metadataFields is non-empty; review_state unlabeled requires annotation null; review_state labeled, reviewed, or disputed requires a non-null AnnotationCreate; after a session mutation (submit, taxonomy edit, region add, dispute resolve), the Labels JSON preview includes those values under the field-contract keys — an export that omits a session mutation is incorrect
- Stats summary lists per-suite progress counts, agreement percentage per suite, per-class region usage counts, and the disputed count; its numbers always match the numbers shown elsewhere in the app: suite progress matches the sidebar counts, the agreement percentage matches the Agreement view, and the disputed count matches the Review queue's Disputed tier
- The preview compiles from current session state: submitting an annotation, resolving a dispute, adding a region, or editing taxonomy changes the corresponding values in the preview without a reload
- A Copy export control puts the exact visible preview text on the clipboard and shows a visible confirmation (an icon swap or a toast) that reverts after a moment; Download triggers a real file download whose contents match the open preview
- An Import control accepts pasted or file-picked Labels JSON matching the LabelsPackage field contract. A valid import replaces taxonomy, metadata fields, and item annotations and review states so the queue chips, History, Taxonomy list, region lists, and the next Labels JSON and Stats summary previews match the imported document without a reload
- Import rejects non-conforming payloads without mutating state: malformed JSON, missing required schemaVersion, taxonomy, metadataFields, or items keys, schemaVersion not exactly annotation-studio-labels-v1, a review_state outside unlabeled|labeled|reviewed|disputed, a rating outside up|down, a score outside 1 to 5, a region failing RegionCreate bounds, a classId absent from taxonomy, or unlabeled with a non-null annotation shows a visible validation message naming the offending field and leaves taxonomy, annotations, and review states unchanged
- Exporting then re-importing a LabelsPackage reconstructs the same visible taxonomy names, shortcuts, annotation ratings and scores, region geometry, metadata values, and review-state chips; an export that omits session mutations or fails the field contract is incorrect
</core_features>

<user_flows>
- Annotating end to end: selecting a suite, rating an item with thumbs-up, moving all three sliders, typing a comment, and pressing Submit & Next decrements that suite's queue badge by exactly one, adds the item to the History tab, advances the card to the next item, and increases the Labels JSON preview's annotation count by exactly one — all without a reload — and the new Labels JSON entry shows rating up, integer scores under Accuracy, Clarity, and Relevance, and schemaVersion annotation-studio-labels-v1 at the package root
- Building taxonomy into labels: creating a new class with a valid TaxonomyClassCreate payload using shortcut 7 and a chosen badge icon makes it appear in the class picker with that icon; on an image-bearing item, pressing 7 and dragging draws a box in the new class's color with RegionCreate w and h at least 8; the box appears in the region list, and the Labels JSON preview then contains the new class name in both the taxonomy array and that item's regions entry with matching classId
- Metadata through the pipeline: defining a new select metadata field with a valid MetadataFieldCreate payload makes its control appear on the annotation card; choosing a value and submitting the annotation shows that value in the item's History entry and inside annotation.metadata in the Labels JSON preview, keyed by the field name
- Palette navigation: opening the command palette with Ctrl+K, typing part of a queue item's title, and pressing Enter on the highlighted result opens exactly that item in the annotation card; reopening the palette and choosing the Agreement view entry switches to the Agreement view
- Assisted labeling with recovery: running Assist on a suite advances the steps while the rollup counts up; when a step exhausts its retries and is marked failed, the rollup failure count increases; retrying it resumes from that step, pausing and resuming freezes and continues progression at the same step, the event timeline records the pause and resume transitions in order, and accepting a resulting Suggested rating fills the card so submitting it decrements the queue like a manual annotation
- Dispute round trip: flagging a disagreement row in the Agreement view moves that item to the top of the Review queue's Disputed tier and increments the tier count by one; resolving it there with a valid ResolveCreate rating returns it to the Reviewed tier, and the Stats summary's disputed count and agreement figures update to match both views
- Bulk action with undo: selecting three queue items and choosing Skip selected moves all three to the end of the queue and raises the skipped badge by three; pressing Ctrl+Z restores all three to their original positions, returns the skipped badge to its prior value, and leaves the export preview's counts exactly as they were before the bulk skip
- Artifact end state: after submitting an annotation with a distinctive comment and a region, open Export and confirm Labels JSON shows schemaVersion annotation-studio-labels-v1 plus taxonomy, metadataFields, and items keys reflecting those session values; Download or Copy the Labels JSON, then Import that same document and confirm History, Taxonomy, region lists, and review-state chips reconstruct to match the export
- Schema validation flow: attempt TaxonomyClassCreate with a duplicate shortcut (saves nothing, shortcut named); attempt DisputeCreate with an empty reason (state unchanged, reason named); Import JSON missing schemaVersion or with schemaVersion not annotation-studio-labels-v1 (state unchanged, field named); then a valid class save and a valid LabelsPackage import succeed against the same field contracts
- A page reload returns the app to its seeded state: the seeded suites and their counts, the seeded taxonomy, the seeded history, the seeded double-annotated agreement data, empty undo and redo stacks, and no assist runs in progress
</user_flows>

<edge_cases>
- Double-activating Submit & Next saves exactly one annotation: the queue count decrements by one and the history gains one entry
- Skipping every item in a suite leaves the queue showing the same items in their skip order with the skipped badge equal to the number of skips; submitting then proceeds normally from the front of the reordered queue
- Undo with an empty history and Redo with an empty redo stack are disabled controls; activating them does nothing and produces no console errors
- Drawing a box with width or height below 8 image pixels is discarded rather than creating an unusable sliver region
- Deleting the last region on an item leaves the image visible with an empty region list and a short empty-state line explaining how to draw a region
- The comments counter at exactly 500 characters shows 0 remaining and further input is prevented; the saved annotation shows the full 500-character comment in history and in Labels JSON under comment
- Submitting the taxonomy form with an attribute of kind select and an empty option list shows an inline validation message naming the attribute's options field and saves nothing
- Submitting DisputeCreate with an empty reason or a reason longer than 200 characters changes no review state and names the reason field
- Running Assist on a suite whose items are all annotated shows a message that there is nothing to pre-label instead of starting an empty run
- Filtering the assist event timeline to a status with no entries shows an empty-state message in the timeline region rather than a blank area
- Copying the export while the preview is mid-update copies exactly the text currently visible in the preview block
- Importing malformed Labels JSON, or JSON that fails the LabelsPackage field contract — missing required schemaVersion, taxonomy, metadataFields, or items keys, schemaVersion not annotation-studio-labels-v1, a review_state outside the closed set, a rating outside up|down, a score outside 1 to 5, or a region classId absent from taxonomy — leaves taxonomy, annotations, and review states unchanged and shows a visible error naming the offending field; it rejects the whole document rather than applying a partial subset
- Export with only the seeded history and no new session submit still opens and shows a LabelsPackage that includes schemaVersion annotation-studio-labels-v1 and every required LabelsPackage key rather than crashing; Download, Copy, and Import remain available
</edge_cases>

<visual_design>
- Layout: a left sidebar containing the queue, History tab, and suite entries; a main content area that swaps between the annotation card, Taxonomy, Review queue, Agreement, and Export views via a toolbar view switcher; the Export view exposes Labels JSON / Stats summary tabs with Copy, Download, and Import affordances; the assist run step list and timeline render alongside the queue while a run is active
- The thumbs-up / thumbs-down buttons use an icon-button style; the selected state renders the icon in the Carbon brand blue with a filled background; the unselected button is outlined in a subtle border tone
- Rubric sliders show the dimension label above and the numeric value to the right of each track
- The response body sits in a tile with a soft light-gray background and generous line height for reading comfort
- The queue sidebar uses a structured list; suites with remaining items show a count tag badge, and skipped counts render as a second, visually distinct badge
- Review-state chips use one consistent color mapping everywhere they appear: Unlabeled neutral gray, Labeled blue, Reviewed green, Disputed red — identical in the queue, the review queue tiers, the agreement table, and the card header
- Class colors are used consistently: a class's swatch in the taxonomy list, its picker entry, its boxes on the image, and its region list rows all share the same color
- Disagreement-flagged rows in the Agreement view carry a distinct warning treatment (tinted background plus an icon), not color alone
- Typography shows a clear hierarchy: the app title larger than panel headings, which are larger than table body and label text, consistent across views
- Spacing follows a consistent rhythm: gaps between the sidebar, card, region area, and panels are visually regular, with no crowded or orphaned regions
- Buttons, inputs, selects, sliders, and toggles show distinct default, hover, focus (visible ring), disabled, and error treatments
- One consistent icon set is used throughout the toolbar, queue entries, step statuses, and row actions
</visual_design>

<motion>
- Submitting an annotation transitions the card out upward and the next card in from below over roughly 250 milliseconds
- Binary rating selection animates the button background with a roughly 150 millisecond fill
- Queue entries animate when they change: a submitted item's entry animates out, a skipped item's entry animates to the end of the list, and bulk-skipped entries animate as a group rather than snapping
- Assist step status changes animate: the running indicator shows continuous activity, a completing step's status transitions with a short fade rather than snapping, and the retry countdown ticks visibly
- A newly drawn region box appears with a brief scale-settle animation, and a deleted box fades out
- Review-state chips animate their color change when a state transition occurs rather than swapping instantly
- Hover animations (required): buttons ease background and shadow with a slight press effect; queue entries, table rows, and timeline entries take a full-width hover wash; form controls show focus rings
- The Copy export confirmation swaps its icon with a brief transition and reverts after a moment
- Feedback toasts after bulk actions, dispute resolution, and export copy slide in, remain readable, and auto-dismiss with a fade
- With prefers-reduced-motion set, card transitions, button fills, list animations, and chip transitions apply instantly
</motion>

<responsiveness>
- At widths of 768 pixels and below, the queue sidebar collapses behind a toggle control that opens it as an overlay; at desktop widths the sidebar is open by default
- At 375 pixel width no content clips or overflows the viewport and no page-level horizontal scrolling appears; the agreement table and export preview scroll within their own containers
- The region annotation image scales to fit its container at every width while boxes keep their relative positions
</responsiveness>

<accessibility>
- Every interactive control — queue entries and checkboxes, rating buttons, sliders, the class picker, region list actions, review-state controls, undo and redo, and all form fields — is reachable and operable with the keyboard alone, with a visible focus indicator
- Dialogs trap focus while open, close on Escape, and return focus to the control that opened them
- Submitting an annotation, the completion of an assist run, a step entering the failed state, and a successful Import are announced through an aria-live region as well as shown visually
- Form fields have visible labels, and validation messages are associated with their fields so each message names the field it belongs to
- Review states and disagreement flags are conveyed by text or icon plus color, never color alone
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors or warnings appear on load or during a full exercise of the app
- The UI stays responsive under rapid repeated input — quick suite switches, rapid slider drags, fast view toggles, rapid undo/redo — with no hangs or dropped interactions, including while an assist run is advancing
</performance>

<writing>
- Headings, view names, and buttons use one consistent capitalization convention throughout the app
- Action labels are specific verbs such as Submit & Next, Run Assist, Copy export, and Import rather than generic labels where a specific one is possible
- Validation messages name the offending field and the fix (including schemaVersion, shortcut, reason, rating, and options); empty states explain what belongs in the region and how to fill it; no placeholder text appears anywhere in the shipped UI
- The review-state vocabulary is identical everywhere it appears: Unlabeled, Labeled, Reviewed, and Disputed, never synonyms
</writing>

<innovation>
- Optional enhancements are welcome where they do not conflict with the specified behaviors: keyboard-first annotation (rating and sliders operable without the pointer), a per-suite progress ring, a compact annotator leaderboard, or a subtle celebration when a suite reaches fully reviewed
</innovation>

<requirements>
Shared application state must live in Zustand (in-memory only): the suites and their item queues, per-item annotations, review states, skip order, selection sets, the taxonomy classes with icons, shortcuts, and attributes, the custom metadata field definitions and per-annotation metadata values, the command palette open state and query, region boxes with zoom and pan state, the two simulated annotators' seeded annotations and derived agreement data, assist-run steps with attempt counts and checkpoints, the assist event timeline and its status filter, run rollups, suggested ratings, the undo and redo stacks, the history list, the export preview text, the active view, and UI chrome. Do not use localStorage, sessionStorage, or other browser storage APIs.
State contracts (behavioral, not storage keys):
- Submitting an annotation updates the queue, the suite badge, the history, the review state, and the export preview from the same shared state
- Editing or deleting a taxonomy class updates the taxonomy list, the class picker, existing region labels, and the export preview everywhere at once
- Review-state transitions recompute the review queue tiers, the agreement summary, and the export stats from the same shared data; no view keeps a second disconnected copy
- Undo and redo operate on the same shared state the views render from, so every dependent surface reverts or reapplies together
- Advancing an assist step updates the step list, the event timeline, and the rollup from the same shared run state; pausing and resuming preserve completed steps' outputs and timestamps
Build tooling: Vite SPA. Styling is Tailwind CSS 4.3.2 (pinned) with design tokens in the theme layer. IBM Carbon Design System (@carbon/react) is the component library for all UI chrome — modals, structured lists, tiles, tags, sliders, code snippets, notifications, and form controls; no other component library. Motion for React and AutoAnimate allowed for animation; no other animation libraries. Icons from @carbon/icons-react only, installed via npm — no raw copy-pasted SVG icon sets. All forms — the taxonomy class form, the metadata field form, the dispute reason form, Resolve, Import paste when presented as a form, and any settings forms — are driven by React Hook Form validating through a Zod schema: the schema defines the rules and inline per-field errors render before submit, with submit controls disabled until valid. Schemas are API-shaped: they model the AnnotationCreate, TaxonomyClassCreate, MetadataFieldCreate, RegionCreate, DisputeCreate, ResolveCreate, AnnotationsJsonlLine, and LabelsPackage field contracts above (the record each form creates IS the would-be request body; Labels JSON export and Import, and JSONL export, compile and validate against those same schemas, including closed enums, integer score bounds 1 to 5, comment max 500, region w/h at least 8, and schemaVersion exactly annotation-studio-labels-v1). Field contracts are enforceable in the UI (named field errors), not only declared in schema code. End-state contract: Download Labels JSON, Download JSONL, and Copy export MUST reflect the session's actual annotations, taxonomy, regions, metadata, and review states — an export that omits session work is invalid; Import MUST restore the same visible state from a conforming LabelsPackage. All libraries installed via npm and bundled locally; no CDN imports. No backend or authentication; the assist pass is simulated with realistic latency, occasional simulated step failures, and varied suggested ratings, so two assist runs over the same items produce different (not identical) suggestion sets. Attached images are locally bundled or locally generated assets — no outbound image requests.
- Seed at least 3 eval suites each with at least 10 unannotated outputs and at least 5 already-submitted annotations in the history on first load; at least 2 items per suite carry an attached image; seed at least 5 taxonomy classes with distinct shortcuts and icons, at least 2 custom metadata fields (one select and one checkbox), and at least 12 double-annotated items across suites for the two simulated annotators, including at least 3 seeded disagreements
- Submitting any form with invalid required fields must not change the underlying collections; show visible validation feedback
- Zero navigational outbound links for app chrome — in-app controls only; view changes via shared client state
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in `/app`; scaffold under `/app` as needed for the stack in `<summary>`; `/app/package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds); run via `npm start` on port 3000; do not iframe, proxy, or fetch the product from another origin.
- Before you finish, run `npm run verify:build` and confirm it exits 0, then run `npm start` and confirm the app serves on port 3000. This is your responsibility: the verifier runs the same `verify:build` gate first, and an app that fails it is not served or judged and scores 0 outright — no partial credit for a build that does not come up.
- WebMCP is a required delivery step, not a scoring criterion; implement exactly the `<webmcp_action_contract>` below; register tools yourself from `<module_spec>` + Bindings using the same handlers as the visible UI; honor mechanics exclusions; optional self-test via `webmcp_session_info` / `webmcp_list_tools` / `webmcp_invoke_tool` only.
- Self-test tooling is preinstalled: the same CDP bridge the verifier runs is baked at `/opt/webmcp/webmcp_stdio_server.mjs`, and a shared headless Chrome already exposes CDP at `http://127.0.0.1:9222`. Open your served app in that Chrome, then run `node /opt/webmcp/webmcp_stdio_server.mjs` (stdio MCP; defaults to that endpoint) to exercise your registered `window.webmcp_*` tools exactly as the verifier will.
</delivery>

<webmcp_action_contract>
Contract version: zto-webmcp-v1

Modules:
- entity-collection-v1
- structured-editor-v1
- command-session-v1
- artifact-transfer-v1

Module specs:
<module_spec id="entity-collection-v1">
{
  "id": "entity-collection-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Entity collection",
  "purpose": "Carts, records, favorites, calendar events, list items, and local entities.",
  "permitted_operations": ["create", "select", "update", "delete", "toggle", "quantity", "reorder"],
  "binding_keys": {
    "required_any_of": [["entity"], ["entity_operations"]],
    "optional": ["entity_fields", "value_bounds", "visible_postconditions"]
  },
  "restrictions": [
    "Closed entity and field enums only.",
    "Bounded string and numeric values.",
    "No generic state setter or arbitrary patch object.",
    "Invokes the same domain command used by the visible control.",
    "Delete requires explicit confirm=true.",
    "Reorder only when gesture mechanics are not being evaluated."
  ],
  "tool_name_prefix": "entity"
}
</module_spec>

<module_spec id="structured-editor-v1">
{
  "id": "structured-editor-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Structured editor",
  "purpose": "Document, diagram, canvas, configuration, and property editors.",
  "permitted_operations": ["select", "add", "delete", "update_property", "set_content", "switch_mode", "preview"],
  "binding_keys": {
    "required_any_of": [["editor_operations"], ["editor_object_types"]],
    "optional": ["editor_properties", "editor_modes", "value_bounds", "visible_postconditions"]
  },
  "restrictions": [
    "No arbitrary coordinate, DOM, or storage mutation via WebMCP.",
    "Drag, resize, drawing, snapping, and keyboard movement remain Playwright-driven when mechanism matters."
  ],
  "tool_name_prefix": "editor"
}
</module_spec>

<module_spec id="command-session-v1">
{
  "id": "command-session-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Command / session",
  "purpose": "Media, games, presentations, simulations, demos, and remote-control shells.",
  "permitted_operations": ["start", "pause", "resume", "stop", "restart", "advance", "trigger_demo", "connect", "disconnect"],
  "binding_keys": {
    "required_any_of": [["session_operations"]],
    "optional": ["demos", "visible_postconditions"]
  },
  "restrictions": [
    "No batching or replay of gameplay.",
    "Timing, animation, collision, repeated input, and transient UI require immediate Playwright observation.",
    "Tool output cannot prove successful playback or connection."
  ],
  "tool_name_prefix": "session"
}
</module_spec>

<module_spec id="artifact-transfer-v1">
{
  "id": "artifact-transfer-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Artifact transfer",
  "purpose": "Import, export, copy, print, and conversion workflows.",
  "permitted_operations": ["import", "export", "copy", "print_preview", "convert"],
  "binding_keys": {
    "required_any_of": [["artifact_operations"]],
    "optional": ["import_modes", "export_formats", "conversion_modes", "visible_postconditions"]
  },
  "restrictions": [
    "No raw files, filesystem paths, blobs, base64, or artifact contents in WebMCP arguments or results.",
    "File picker interaction, clipboard contents, and downloaded artifacts remain Playwright responsibilities."
  ],
  "tool_name_prefix": "artifact"
}
</module_spec>

Bindings:
- Entity: queue-item
- Entity operations: select; update; toggle; reorder
- Entity fields: rating; scores; comment; metadata-values; review_state; dispute-reason; resolved-rating; skip; bulk-selection; suggested-rating-accept
- Editor object types: taxonomy-class; metadata-field; region
- Editor properties: name; color; icon; shortcut; attributes; attribute-values; field-kind; options; class-id; x; y; w; h
- Editor operations: select; add; delete; update_property; switch_mode; preview
- Editor modes: annotate; taxonomy; review-queue; agreement; history; export
- Session operations: start; pause; resume
- Demos: assist-run
- Artifact operations: export; import; copy
- Export formats: annotations-jsonl; labels-json; stats-summary-text
- Value bounds: rating in {up, down}; scores integer 1-5 keyed by dimension (Accuracy, Clarity, Relevance); comment max 500 chars; review_state in {unlabeled, labeled, reviewed, disputed}; shortcut single digit 1-9 unique across classes; metadata field kind in {text, number, select, checkbox}, field name unique; attribute kind in {select, text}; select attributes require a non-empty option list; region x/y/w/h numeric within image bounds; sliver boxes discarded; dispute requires a one-line reason
- Workflow completion: submitting an annotation decrements the suite queue badge by one, sets the chip to Labeled, adds a History entry, and increments the Labels JSON preview's annotation count with rating/scores under AnnotationCreate field names
- Workflow completion: a saved taxonomy class appears in the taxonomy list, the class picker, and the Labels JSON taxonomy array with its icon and shortcut without a reload
- Workflow completion: adding a region puts the box on the image, a row in the region list, and a regions entry with classId and x/y/w/h in the Labels JSON preview
- Workflow completion: flag-for-dispute moves the item to the top of the Review queue's Disputed tier and increments its count; resolve returns it to Reviewed
- Workflow completion: assist-run completion attaches Suggested ratings; accepting one fills the rating and sliders so Submit & Next enables
- Workflow completion: Stats summary counts always match the sidebar suite counts, the Agreement view percentage, and the Disputed tier count
- Workflow completion: Labels JSON export shows schemaVersion annotation-studio-labels-v1 and required taxonomy, metadataFields, and items keys reflecting live session mutations
- Workflow completion: Import of a conforming LabelsPackage restores taxonomy, annotations, regions, metadata, and review-state chips so Export previews match; non-conforming import leaves state unchanged and names the offending field
- Import modes: labels-json

Mechanics exclusions:
- Bounding-box drag-drawing, zoom plus/minus/fit scaling, and pan-tool dragging are gesture mechanics graded via Playwright; region CREATION as state goes through the editor add binding
- Command palette Ctrl+K open, fuzzy-match narrowing per keystroke, arrow-key highlight, and Escape focus-return are keyboard mechanics graded via Playwright
- Undo/redo (Ctrl+Z / Ctrl+Shift+Z) and the history panel are graded through the real toolbar controls and shortcuts via Playwright — a WebMCP shortcut would bypass the stacks being graded
- Card slide-out/in transitions, rating-fill animation, queue entry animate-out, chip color transitions, retry-countdown ticking, and toasts stay Playwright-observed
- Clipboard contents of Copy export and the downloaded JSONL bytes are verified via Playwright, never returned in WebMCP results

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
