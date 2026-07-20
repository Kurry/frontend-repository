import json

with open('tasks/frontend-workflow-submission-qc-queue/solution/reward-details.json', 'r') as f:
    data = json.load(f)

for category_name, category in data.items():
    if isinstance(category, dict) and 'criteria' in category:
        print(f"=== {category_name} ===")
        for crit in category['criteria']:
            if crit.get('value') == 0:
                print(f"[{crit.get('id')}] {crit.get('name')}:\n  {crit.get('description')}\n  {crit.get('reasoning')}\n")
