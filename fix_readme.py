import os
import sys
sys.path.append(os.path.abspath('packages/corpuscheck/src'))
from corpuscheck import package_frontend_tasks as package
from pathlib import Path

content = package.render_oracle_readme('frontend-productivity-focus-soundscape-automation-mixer', ['structured-editor-v1', 'entity-collection-v1', 'artifact-transfer-v1'])
Path('tasks/frontend-productivity-focus-soundscape-automation-mixer/solution/app/README.md').write_bytes(content.encode())
