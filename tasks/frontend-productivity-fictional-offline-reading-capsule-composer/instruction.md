<summary>
Fictional Offline Reading Capsule Composer is a hard browser section-range, offline-budget, and EPUB composition tool. A fictional commuter prepares one finite, inspectable reading capsule before going offline.
The app is a strict, offline-budget composition tool where users brush continuous semantic ranges of text in an article's spine and fold them into an ordered capsule. The tool validates exact byte and minute budgets. It provides synchronized navigation, source-fallback status, branches, actor-aware history, rehearsal completion proof, and export to a valid EPUB and standalone HTML proof. The application maintains deterministic fictional state using a bundled dataset, zero external network requests, and API-shaped WebMCP schema mutations.
</summary>

<core_features>
Article-spine range brush and fold:
The dominant desktop surface pairs a vertical article spine with ordered section bands, headings, word/byte ticks, saved-state marks, and contiguous range handles. Drag from one section through another; the selected bands gather into a fold card that can be dropped on a capsule seam. During the gesture, source identity, exact included/omitted bounds, prospective bytes/minutes, capsule order, and coverage appear before commit. Release opens a confirmation sheet naming article, first/last section, section IDs, old/new totals, budgets, source count, coverage, insertion order, and affected hashes. Confirm creates one event and stable entry. Escape, outside release, same-range duplicate, stale source, reversed handle, or noncontiguous selection restores exact prior state.

Keyboard, exact, and compact parity:
Keyboard users navigate section bands in source order, press Space to anchor a range, Shift+arrows to extend contiguously, F to pick up the fold card, arrows to choose a seam, and Enter to open the confirmation. Escape returns focus to the anchor section. An exact sheet accepts article ID, first/last section ID, and insertion order, then previews the same normalized range. At 390x844, the spine becomes a section checklist with contiguous-range bracket and the capsule becomes a stepwise insertion sheet. Every committed path emits the same event and exact bytes.

Linked capsule budget and offline reader:
Synchronize the spine and capsule ribbon with a byte-budget treemap, reading-time ruler, source-coverage matrix, provenance map, EPUB navigation tree, entry inspector, and rendered offline reader. Selecting or hovering a section, entry, treemap tile, ruler interval, matrix cell, provenance edge, nav item, or reader heading identifies the same article/section/entry IDs and capsule revision everywhere. Brush an interval on the reading-time ruler to filter visible entries without changing totals or order. Adding the canonical range while a filter is active updates hidden and visible counts without losing selected stable IDs. The reader preserves section order, headings, safe inline marks, internal navigation, current entry/section, and progress. No preview loads the fictional source URL.

Budget boundary and source-fallback proof:
After a fold, extending the range to an overage displays exact overages, newly implicated sections, and no automatic eviction. Confirmation is disabled. Cancel restores all state.
Switching a source from available to unavailable preserves saved sections which remain readable from verified fallback snapshots with provenance. Unsaved sections show unavailable placeholders.

Branches, actor-aware history, and read-through rehearsal:
Fork branches, compare capsules against Full Source to reveal omitted sections and deltas. Filter history by actor, article, entry, section, or operation.
Add notes, selectively undo/redo events. Read-through rehearsal advances a logical cursor through entries/sections, verifies saved fallbacks, records no reading completion, and must pass for approval. Approval requires budgets pass, no duplicates, fallback verified, rehearsal passes.

Exact packet, atomic import, and independent proof:
Export is enabled for approved active branches. Import accepts JSON or packet ZIP. JSON restores state. Packet ZIP verifies all files before commit. Successful import restores full workspace state. Re-export preserves semantics.
</core_features>

<visual_design>
The visual design must maintain a distinct, non-color-reliant hierarchy. At 1440x900, the article spine and capsule ribbon dominate the desktop surface. States for fresh, selected, brushing, fold-held, prospective, confirmed, over-budget, unavailable, changed, suspended-note, rehearsing, and approved must be clearly distinct. Meaning must not rely solely on color. Data visualizations like the treemap and reading-time ruler must clearly map to sections.
</visual_design>

<motion>
Motion must explain causality. Selected section bands gather into the fold card and travel to the seam, expanding the capsule ribbon and reflowing budget and navigation evidence. Invalid extensions spring back. Reduced motion uses immediate placement, indexed before/after anchors, exact signed deltas, patterns, and announcements.
</motion>

<requirements>
Render the UI at port 3000 using Vite and React, running without console errors, layout shifts, or external network requests.
All dependencies must be installed locally via npm. Loading assets or libraries from CDNs is strictly prohibited.
Use Tailwind CSS 4.3.2 for styling.
Use the deterministic fictional fixture dataset (8 articles, 42 sections, initial branches and history events).
Implement the article-spine range brush and fold interaction, allowing users to drag across section bands and drop on a capsule seam.
Implement keyboard navigation for anchoring and extending ranges, and an exact input sheet for range bounds.
Synchronize all linked views (spine, capsule ribbon, treemap, ruler, matrix, provenance map, EPUB nav tree, inspector, and reader preview) to identical capsule revisions.
Calculate and enforce exact byte and time budgets for the capsule (budget of 24,000 bytes and 24 minutes). Over-budget additions must disable confirmation.
Implement source-fallback simulation: making an article unavailable must preserve included saved sections while displaying placeholders for unsaved sections.
Implement history tracking with actor-selective undo/redo and branch forking.
Implement read-through rehearsal which requires advancing through all sections before capsule approval.
Export an approved capsule as a ZIP packet containing manifest.json, capsule.json, sections.csv, sources.opml, fictional-line.epub, capsule-map.svg, offline-proof.html, and README.txt.
Implement importing a packet with strict validation for schema, missing files, byte/word counts, and fallback states.
The UI must correctly respond to compact viewport constraints (390x844), changing the spine to a section checklist and step-wise insertion.
</requirements>

<webmcp_action_contract>
window.webmcp_session_info = {
    "status": "ready"
};

window.webmcp_list_tools = () => {
    return [
        {
            "name": "get_fixture",
            "description": "Get the deterministic fictional fixture dataset.",
            "inputSchema": {
                "type": "object",
                "properties": {}
            }
        },
        {
            "name": "get_state",
            "description": "Get the current reading capsule state.",
            "inputSchema": {
                "type": "object",
                "properties": {}
            }
        },
        {
            "name": "get_derived",
            "description": "Get derived metrics including totals, coverage, navigation, and state hash.",
            "inputSchema": {
                "type": "object",
                "properties": {}
            }
        },
        {
            "name": "get_packet_preview",
            "description": "Preview the files generated for the exported packet.",
            "inputSchema": {
                "type": "object",
                "properties": {}
            }
        },
        {
            "name": "preview_range",
            "description": "Preview the addition of a range to a capsule seam.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "articleId": { "type": "string" },
                    "firstSectionId": { "type": "string" },
                    "lastSectionId": { "type": "string" },
                    "insertAt": { "type": "number" }
                },
                "required": ["articleId", "firstSectionId", "lastSectionId", "insertAt"]
            }
        },
        {
            "name": "add_range",
            "description": "Add a contiguous semantic range to the capsule.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "articleId": { "type": "string" },
                    "firstSectionId": { "type": "string" },
                    "lastSectionId": { "type": "string" },
                    "insertAt": { "type": "number" }
                },
                "required": ["articleId", "firstSectionId", "lastSectionId", "insertAt"]
            }
        },
        {
            "name": "cancel_range",
            "description": "Cancel a prospective range preview or operation.",
            "inputSchema": {
                "type": "object",
                "properties": {}
            }
        },
        {
            "name": "remove_entry",
            "description": "Remove an entry from the capsule.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "entryId": { "type": "string" }
                },
                "required": ["entryId"]
            }
        },
        {
            "name": "reorder_entry",
            "description": "Reorder an entry in the capsule.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "entryId": { "type": "string" },
                    "insertAt": { "type": "number" }
                },
                "required": ["entryId", "insertAt"]
            }
        },
        {
            "name": "select_entity",
            "description": "Select an article, section, or entry.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "entityType": { "type": "string" },
                    "entityId": { "type": "string" }
                },
                "required": ["entityType", "entityId"]
            }
        },
        {
            "name": "set_time_brush",
            "description": "Filter visible entries by brushing an interval on the reading-time ruler.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "startMin": { "type": "number" },
                    "endMin": { "type": "number" }
                },
                "required": ["startMin", "endMin"]
            }
        },
        {
            "name": "set_filters",
            "description": "Set workspace filters.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "filters": { "type": "object" }
                },
                "required": ["filters"]
            }
        },
        {
            "name": "set_reader_location",
            "description": "Set the current location and progress in the reader.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "entryId": { "type": "string" },
                    "sectionId": { "type": "string" },
                    "progress": { "type": "number" }
                },
                "required": ["entryId", "sectionId"]
            }
        },
        {
            "name": "search_sources",
            "description": "Search available sources.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "query": { "type": "string" }
                },
                "required": ["query"]
            }
        },
        {
            "name": "set_source_status",
            "description": "Set the availability status of an article.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "articleId": { "type": "string" },
                    "status": { "type": "string", "enum": ["available", "unavailable", "changed"] }
                },
                "required": ["articleId", "status"]
            }
        },
        {
            "name": "compare_source_revision",
            "description": "Compare a source revision.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "articleId": { "type": "string" }
                },
                "required": ["articleId"]
            }
        },
        {
            "name": "preview_replace_snapshot",
            "description": "Preview replacing a fallback snapshot with a changed source.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "articleId": { "type": "string" }
                },
                "required": ["articleId"]
            }
        },
        {
            "name": "cancel_replace_snapshot",
            "description": "Cancel a snapshot replacement.",
            "inputSchema": {
                "type": "object",
                "properties": {}
            }
        },
        {
            "name": "fork_branch",
            "description": "Fork a new branch from the active branch.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "name": { "type": "string" }
                },
                "required": ["name"]
            }
        },
        {
            "name": "compare_branch",
            "description": "Compare the current capsule branch against another target.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "targetBranchId": { "type": "string" }
                },
                "required": ["targetBranchId"]
            }
        },
        {
            "name": "append_note",
            "description": "Append a note to an entry.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "entryId": { "type": "string" },
                    "content": { "type": "string" },
                    "actorId": { "type": "string" }
                },
                "required": ["entryId", "content", "actorId"]
            }
        },
        {
            "name": "selective_undo",
            "description": "Undo a specific historical event.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "eventId": { "type": "string" }
                },
                "required": ["eventId"]
            }
        },
        {
            "name": "selective_redo",
            "description": "Redo a previously undone event.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "eventId": { "type": "string" }
                },
                "required": ["eventId"]
            }
        },
        {
            "name": "seek_history",
            "description": "Seek history to a specific event cursor.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "eventId": { "type": "string" }
                },
                "required": ["eventId"]
            }
        },
        {
            "name": "get_history_anchor",
            "description": "Get the most recent compacted history anchor.",
            "inputSchema": {
                "type": "object",
                "properties": {}
            }
        },
        {
            "name": "start_rehearsal",
            "description": "Start a read-through rehearsal of the capsule.",
            "inputSchema": {
                "type": "object",
                "properties": {}
            }
        },
        {
            "name": "step_rehearsal",
            "description": "Advance the rehearsal cursor to the next section.",
            "inputSchema": {
                "type": "object",
                "properties": {}
            }
        },
        {
            "name": "reset_rehearsal",
            "description": "Reset rehearsal to the beginning.",
            "inputSchema": {
                "type": "object",
                "properties": {}
            }
        },
        {
            "name": "review_warning",
            "description": "Review an approval warning.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "warningId": { "type": "string" }
                },
                "required": ["warningId"]
            }
        },
        {
            "name": "approve_capsule",
            "description": "Approve the capsule for export.",
            "inputSchema": {
                "type": "object",
                "properties": {}
            }
        },
        {
            "name": "export_packet",
            "description": "Export the approved capsule as a ZIP packet.",
            "inputSchema": {
                "type": "object",
                "properties": {}
            }
        },
        {
            "name": "import_json",
            "description": "Import capsule state from a JSON string.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "jsonString": { "type": "string" }
                },
                "required": ["jsonString"]
            }
        },
        {
            "name": "import_packet",
            "description": "Import an offline capsule packet from a ZIP blob.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "zipBlob": { "type": "string" }
                },
                "required": ["zipBlob"]
            }
        },
        {
            "name": "reset_session",
            "description": "Reset the entire application session.",
            "inputSchema": {
                "type": "object",
                "properties": {}
            }
        }
    ];
};

window.webmcp_invoke_tool = async (toolName, args) => {
    const store = window.__ZUSTAND_STORE?.getState();
    if (!store) {
        throw new Error("Store not initialized");
    }

    switch (toolName) {
        case "get_fixture":
            return store.getFixture();
        case "get_state":
            return store.getStateSnapshot();
        case "get_derived":
            return store.getDerived();
        case "get_packet_preview":
            return store.getPacketPreview();
        case "preview_range":
            return store.previewRange(args.articleId, args.firstSectionId, args.lastSectionId, args.insertAt);
        case "add_range":
            return store.addRange(args.articleId, args.firstSectionId, args.lastSectionId, args.insertAt);
        case "cancel_range":
            return store.cancelRange();
        case "remove_entry":
            return store.removeEntry(args.entryId);
        case "reorder_entry":
            return store.reorderEntry(args.entryId, args.insertAt);
        case "select_entity":
            return store.selectEntity(args.entityType, args.entityId);
        case "set_time_brush":
            return store.setTimeBrush(args.startMin, args.endMin);
        case "set_filters":
            return store.setFilters(args.filters);
        case "set_reader_location":
            return store.setReaderLocation(args.entryId, args.sectionId, args.progress);
        case "search_sources":
            return store.searchSources(args.query);
        case "set_source_status":
            return store.setSourceStatus(args.articleId, args.status);
        case "compare_source_revision":
            return store.compareSourceRevision(args.articleId);
        case "preview_replace_snapshot":
            return store.previewReplaceSnapshot(args.articleId);
        case "cancel_replace_snapshot":
            return store.cancelReplaceSnapshot();
        case "fork_branch":
            return store.forkBranch(args.name);
        case "compare_branch":
            return store.compareBranch(args.targetBranchId);
        case "append_note":
            return store.appendNote(args.entryId, args.content, args.actorId);
        case "selective_undo":
            return store.selectiveUndo(args.eventId);
        case "selective_redo":
            return store.selectiveRedo(args.eventId);
        case "seek_history":
            return store.seekHistory(args.eventId);
        case "get_history_anchor":
            return store.getHistoryAnchor();
        case "start_rehearsal":
            return store.startRehearsal();
        case "step_rehearsal":
            return store.stepRehearsal();
        case "reset_rehearsal":
            return store.resetRehearsal();
        case "review_warning":
            return store.reviewWarning(args.warningId);
        case "approve_capsule":
            return store.approveCapsule();
        case "export_packet":
            return store.exportPacket();
        case "import_json":
            return store.importJson(args.jsonString);
        case "import_packet":
            return store.importPacket(args.zipBlob);
        case "reset_session":
            return store.resetSession();
        default:
            throw new Error(`Unknown tool: ${toolName}`);
    }
};
</webmcp_action_contract>
