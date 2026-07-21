import os
import re

APP_DIR = 'tasks/frontend-workflow-gate-console/solution/app'

# Let's fix What-If properly.
# We need flipping simulated state to also apply the whatif value properly
# if whatif flip is completely broken on the frontend
store_path = os.path.join(APP_DIR, 'src/lib/console-store.svelte.ts')
with open(store_path, 'r') as f:
    store_code = f.read()

# Let's make sure What-If uses displayed state for everything
if 'get displayedGates()' in store_code:
    pass
