# Community Garden Workday Planner - Batch Reconciler

<summary>
The Community Garden Workday Planner is a self-contained local application designed for managing work tasks in a community garden context. The core feature allows users to group selected task records into a batch and reconcile aggregate totals, mimicking a specialized local workflow with a single, clear outcome. The application features a distinctive, domain-specific workbench with clear state tokens and intentional density. Its architecture draws from release note patterns translated into a frontend-only tool with robust session ledger mechanics for safe save, resume, and recovery capabilities. The entire tool is localized in the browser, relying solely on in-memory state and providing an interoperable artifact export. It uses Tailwind CSS 4.3.2 for styling.
</summary>

<reference_screenshots>
</reference_screenshots>

<core_features>
The user can create, edit, delete, archive, and filter work task records with explicit domain statuses (e.g., empty, draft, ready, changed, archived).
The user can group selected records into a batch and reconcile aggregate totals, which serves as the application signature mutation.
The user can undo the last mutation and inspect the linked representation, which restores ordering, selection, and derived values.
The user can export the current session artifact as a downloadable JSON file, clear the current session, and import a previously exported artifact with strict field-level validation.
</core_features>

<user_flows>
The user starts with an empty state, creates a series of work tasks, filters them by status, and verifies that exact field boundaries are accepted and invalid inputs trigger recovery explanations.
The user selects multiple records, initiates a batch reconciliation, views the derived aggregate summary in the linked panel, and then undoes the action to verify state restoration.
The user modifies tasks, exports the garden-workday-v1-batch-reconciler JSON artifact, clears the application state, and successfully imports the artifact, verifying that all previous records, selections, derived summaries, and event history are fully restored.
</user_flows>

<edge_cases>
The application rejects conflicting or incomplete batch mutations without partial updates, maintaining data integrity.
The application handles malformed imports by treating them as a no-op, preserving the prior valid state and preventing data corruption from invalid schemas or IDs.
The application preserves the prior valid state and provides clear recovery explanations when invalid cross-field values or exact boundary violations occur during task creation or editing.
</edge_cases>

<visual_design>
The application presents a distinctive, domain-specific workbench with a clean, focused canvas, intentional density, and clear state tokens reflecting the task lifecycle.
The interface utilizes a three-pane or dedicated panel layout on desktop, dividing the primary work surface (task collection) from the derived summary (batch reconciler) and detail inspector.
The visual hierarchy clearly emphasizes current task state, pending actions, and aggregate totals, utilizing semantic colors and clear contrast for usability.
</visual_design>

<motion>
The acted-on item animates or morphs smoothly into its new state during the batch reconciliation mutation.
The interface implements reduced motion equivalents, preserving causal feedback and state transition clarity without utilizing complex transforms when requested by the OS.
Transitions between states (e.g., from selected to reconciled) are clearly articulated through motion, guiding the user focus to the relevant updated elements.
</motion>

<responsiveness>
The application intelligently adapts its three-pane desktop layout to a narrow viewport by converting secondary surfaces into drawers or stacked steps, ensuring no horizontal overflow.
The primary interaction model shifts dynamically based on viewport width while preserving comfortable touch targets for mobile usage.
</responsiveness>

<accessibility>
The signature batch reconciliation interaction and all CRUD operations can be completed identically using both keyboard and touch-equivalent controls.
The application provides live updates and visible focus management during interactions, ensuring screen-reader users are aware of state changes and derived summary updates.
The UI adheres to standard contrast requirements and provides a fully semantic HTML structure for optimal navigation.
</accessibility>

<performance>
The application maintains a responsive interaction for the signature mutation when seeded with a collection of at least 100 records.
The UI efficiently limits repaints, ensuring unrelated rows remain stable and responsive during individual record edits or bulk mutations.
</performance>

<writing>
The application copy clearly names domain consequences and recovery actions precisely, without generic error messaging.
Labels, statuses, errors, and empty-state text are context-aware and reflect the specific community garden domain.
</writing>

<innovation>
The linked representations (e.g., the batch reconciler summary) provide domain utility beyond basic CRUD, directly translating the selected state into derived, actionable intelligence.
</innovation>

<requirements>
The application must strictly store state in-memory only; it must not use localStorage, IndexedDB, or any remote network calls.
The export must be a JSON artifact named garden-workday-v1-batch-reconciler.json conforming to the specified schema.
The application must operate without errors on port 3000 and the build output must be fully localized to the dist folder.
All dependencies must be installed locally using npm; CDN links are strictly prohibited.
</requirements>

<integrity>
Work only from this instruction and /app; do not use /solution, /tests, or verifier artifacts.
</integrity>

<delivery>
The application logic, React components, state management, and styling are fully contained within the solution/app directory.
The implementation properly uses package.json for managing Vite/React dependencies.
</delivery>

<webmcp_action_contract>
{
  "entity_create_record": {
    "description": "Create a new record in the collection.",
    "input_schema": {
      "type": "object",
      "properties": {
        "payload": {
          "type": "object",
          "description": "The data for the new record."
        }
      },
      "required": ["payload"]
    }
  },
  "entity_update_record": {
    "description": "Update an existing record.",
    "input_schema": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string"
        },
        "payload": {
          "type": "object"
        }
      },
      "required": ["id", "payload"]
    }
  },
  "entity_delete_record": {
    "description": "Delete a record.",
    "input_schema": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string"
        }
      },
      "required": ["id"]
    }
  },
  "entity_list_records": {
    "description": "List all records.",
    "input_schema": {
      "type": "object",
      "properties": {}
    }
  },
  "workflow_group_records": {
    "description": "Group selected records into a batch.",
    "input_schema": {
      "type": "object",
      "properties": {
        "ids": {
          "type": "array",
          "items": {
            "type": "string"
          }
        }
      },
      "required": ["ids"]
    }
  },
  "workflow_reconcile_batch": {
    "description": "Reconcile aggregate totals for the current batch.",
    "input_schema": {
      "type": "object",
      "properties": {}
    }
  },
  "workflow_undo_last_action": {
    "description": "Undo the last mutation.",
    "input_schema": {
      "type": "object",
      "properties": {}
    }
  },
  "artifact_export_session_json": {
    "description": "Export the current session state as a JSON artifact.",
    "input_schema": {
      "type": "object",
      "properties": {}
    }
  },
  "artifact_import_session_json": {
    "description": "Import a session state from a JSON artifact.",
    "input_schema": {
      "type": "object",
      "properties": {
        "payload": {
          "type": "object"
        }
      },
      "required": ["payload"]
    }
  }
}
</webmcp_action_contract>
