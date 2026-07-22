#!/bin/bash
set -ex

# Just in case
git reset --mixed HEAD~1 || true
git restore .gitignore

cd /app/tasks/frontend-productivity-swiftnote/solution/app
cat << 'IGN' > .gitignore
# Allow dist for this specific task
!dist/
IGN

git add -f dist
git add .gitignore

cd /app
git rm -rf tasks/frontend-productivity-swiftnote/solution/app/node_modules || true

git add tasks/frontend-productivity-swiftnote/solution/app/e2e.spec.mjs tasks/frontend-productivity-swiftnote/solution/app/e2e.playwright.config.mjs tasks/frontend-productivity-swiftnote/solution/app/package.json tasks/frontend-productivity-swiftnote/solution/app/package-lock.json || true

git commit -m "test(swiftnote): reinstate task with criterion e2e coverage" -m "Moving frontend-productivity-swiftnote from tasks-quarantine to tasks and adding the built dist for oracle. Included coverage for 6.1 create_flow_updates_all_surfaces, 14.5 new_note_count_delta_exact, 6.3 edit_flow_updates_related_displays, 6.4 delete_flow_updates_all_surfaces, 6.8 focus_mode_hides_and_restores_sidebar, 6.11 artifact_end_state_export_import, 14.9 workspace_export_import_pipeline, and 4.11 import_rejects_bad_workspace_json. Total 8 explicitly covered / 166 total criteria.
Build is clean, server started at :3000 cleanly, playwright E2E passed.
Propagate and validate are clean.
" || true

uv run corpuscheck propagate frontend-productivity-swiftnote
uv run corpuscheck validate --force --root tasks frontend-productivity-swiftnote
