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

def sort_key(c):
    return c['id']

stubs = []
not_automatable = []

for c in sorted(criteria, key=sort_key):
    is_subjective = c.get('weight', 1.0) == 0.5 or c.get('type') == 'likert'
    if is_subjective:
        not_automatable.append(f"// NOT-AUTOMATABLE: {c['id']} — {c['name']}")
    else:
        stubs.append(f"test('{c['id']} {c['name']}', async ({{ page }}) => {{\n  // {c['description']}\n  expect(true).toBe(true);\n}});\n")

for stub in stubs:
    print(stub)

for na in not_automatable:
    print(na)
