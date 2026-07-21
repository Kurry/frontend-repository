import os
import re

APP_DIR = 'tasks/frontend-workflow-gate-console/solution/app'

app_path = os.path.join(APP_DIR, 'src/App.svelte')
with open(app_path, 'r') as f:
    app_code = f.read()

# Fix the spin animation specifically by restoring its speed
app_code = app_code.replace('.spin { animation:spin .09s linear infinite; }', '.spin { animation:spin .85s linear infinite; }')

with open(app_path, 'w') as f:
    f.write(app_code)
print("Patched spin in App.svelte")
