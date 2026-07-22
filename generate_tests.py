import json

def format_id(id_str):
    return id_str

with open('criteria.json', 'r') as f:
    criteria = json.load(f)

print("import { test, expect, listTools, invokeTool } from '@playwright/test';\n")

for c in criteria:
    print(f"// NOT-AUTOMATABLE: {c['id']} — {c['name']}")
    print(f"// {c['description']}")
