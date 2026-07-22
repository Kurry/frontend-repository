import toml
import glob
import json
import os

criteria = []
for file in glob.glob('tasks/frontend-creative-tools-prompt-diff/tests/**/*.toml', recursive=True):
    try:
        data = toml.load(file)
        if 'criterion' in data:
            for c in data['criterion']:
                criteria.append(c)
    except Exception as e:
        pass

print(json.dumps(criteria, indent=2))
