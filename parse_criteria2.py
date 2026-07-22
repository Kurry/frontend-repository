import re
import glob

criteria = []
for f in glob.glob("tasks/frontend-creative-tools-schema-builder/tests/*/*.toml"):
    with open(f) as file:
        content = file.read()

        matches = re.finditer(r'\[\[criterion\]\][^[]*id\s*=\s*"([^"]+)"\s*name\s*=\s*"([^"]+)"\s*description\s*=\s*"([^"]+)"', content)
        for m in matches:
            criteria.append((m.group(1), m.group(2), m.group(3), f.split("/")[-1]))

def parse_id(id_str):
    parts = id_str.split('.')
    return [int(p) for p in parts]

valid_criteria = []
for c in criteria:
    try:
        parse_id(c[0])
        valid_criteria.append(c)
    except:
        pass

valid_criteria.sort(key=lambda x: parse_id(x[0]))

print("// ==== END CANONICAL REGION — add task-specific criterion tests below. ====")
print("import { test, expect } from '@playwright/test';")
print()
print("async function listTools(page) {")
print("    return await page.evaluate(() => window.webmcp_list_tools?.() || []);")
print("}")
print("async function invokeTool(page, name, args) {")
print("    return await page.evaluate(async ([n, a]) => window.webmcp_invoke_tool?.(n, a), [name, args]);")
print("}")
print()

for c in valid_criteria:
    print(f"test('{c[0]} {c[1]}', async ({{ page }}) => {{")
    print(f"    // {c[2]}")
    print(f"    await page.goto('http://localhost:3000');")
    print(f"    test.fixme(true, 'To be implemented');")
    print(f"}});")
    print()
