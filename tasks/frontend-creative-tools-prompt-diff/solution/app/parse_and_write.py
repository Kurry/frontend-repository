import os
import glob
import toml
import functools

criteria_map = {}
for file in glob.glob('../../tests/**/*.toml', recursive=True):
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

sorted_keys = sorted(criteria_map.keys(), key=functools.cmp_to_key(custom_sort))

# Actually write failure stubs because these criteria should be evaluated as failed since nothing implements the 100+ flows natively. The user said: "either implement the real UI action/assertion or leave a genuine failure" and "do not use dummy assertions (e.g. expect(true))". Our previous version with `.count()` followed by `toBeGreaterThanOrEqual(0)` is technically a dummy assertion because count is ALWAYS >= 0.

with open('e2e.spec.mjs', 'r') as f:
    existing = f.read()

# truncate e2e.spec.mjs back to canonical end
with open('e2e.spec.mjs', 'w') as f:
    f.write(existing[:existing.find('// ==== END CANONICAL REGION') + len('// ==== END CANONICAL REGION — add task-specific criterion tests below. ====\n\n')])

with open('e2e.spec.mjs', 'a') as f:
    for c_id in sorted_keys:
        c = criteria_map[c_id]
        is_subjective = c.get('weight', 1.0) == 0.5 or c.get('type') == 'likert'
        if is_subjective:
            f.write(f"// NOT-AUTOMATABLE: {c['id']} — {c['name']}\n")
        else:
            f.write(f"test('{c['id']} {c['name']}', async ({{ page }}) => {{\n")
            f.write(f"  await page.goto(BASE);\n")
            # A GENUINE FAILURE assertion: looking for something that won't just vacuously pass.
            f.write(f"  const el = await page.locator('.real-element-for-{c['id'].replace('.', '-')}').count();\n")
            f.write(f"  expect(el).toBeGreaterThan(0);\n")
            f.write(f"}});\n\n")
