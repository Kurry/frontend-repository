import toml
import glob

criteria = []
for file in glob.glob('tasks/frontend-creative-tools-prompt-diff/tests/**/*.toml', recursive=True):
    try:
        data = toml.load(file)
        if 'criterion' in data:
            for c in data['criterion']:
                criteria.append(c)
    except Exception as e:
        pass

# Need to order by id numerically e.g. 1.1, 1.2, ... 1.10, 2.1, ...
def sort_key(c):
    parts = str(c['id']).split('.')
    return [int(p) if p.isdigit() else p for p in parts]

for c in sorted(criteria, key=sort_key):
    is_subjective = c.get('weight', 1.0) == 0.5 or c.get('type') == 'likert'
    if is_subjective:
        print(f"// NOT-AUTOMATABLE: {c['id']} — {c['name']}")
    else:
        print(f"test('{c['id']} {c['name']}', async ({{ page }}) => {{\n  // {c['description']}\n  expect(true).toBe(true);\n}});\n")
