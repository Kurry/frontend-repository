import json

with open('tasks/frontend-workflow-submission-qc-queue/solution/reward-details.json', 'r') as f:
    data = json.load(f)

for category in data.values():
    if isinstance(category, dict) and 'criteria' in category:
        for crit in category['criteria']:
            if crit.get('value') == 0:
                print(f"{crit.get('id')} - {crit.get('name')}:\n  {crit.get('description')}\n  {crit.get('reasoning')}\n")
