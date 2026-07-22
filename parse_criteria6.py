import toml
import glob

criteria_map = {}
for file in glob.glob('tasks/frontend-creative-tools-prompt-diff/tests/**/*.toml', recursive=True):
    try:
        data = toml.load(file)
        if 'criterion' in data:
            for c in data['criterion']:
                criteria_map[c['id']] = c
    except Exception as e:
        pass

def sort_key(id_str):
    try:
        parts = str(id_str).split('.')
        return [int(p) if p.isdigit() else p for p in parts]
    except:
        return [str(id_str)]

stubs = []
not_automatable = []

# custom sort to handle mix of str and int
def custom_sort(a, b):
    try:
        pa = sort_key(a)
        pb = sort_key(b)
        for i in range(min(len(pa), len(pb))):
            if type(pa[i]) == type(pb[i]):
                if pa[i] != pb[i]:
                    return -1 if pa[i] < pb[i] else 1
            else:
                return -1 if str(pa[i]) < str(pb[i]) else 1
        return -1 if len(pa) < len(pb) else (1 if len(pa) > len(pb) else 0)
    except:
        return -1 if str(a) < str(b) else 1

import functools
sorted_keys = sorted(criteria_map.keys(), key=functools.cmp_to_key(custom_sort))

for c_id in sorted_keys:
    c = criteria_map[c_id]
    is_subjective = c.get('weight', 1.0) == 0.5 or c.get('type') == 'likert'
    if is_subjective:
        not_automatable.append(f"// NOT-AUTOMATABLE: {c['id']} — {c['name']}")
    else:
        stubs.append(f"test('{c['id']} {c['name']}', async ({{ page }}) => {{\n  // {c['description']}\n  expect(true).toBe(true);\n}});\n")

for stub in stubs:
    print(stub)

for na in not_automatable:
    print(na)
