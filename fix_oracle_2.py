import json

file_path = "tasks/frontend-creative-tools-drum-pattern-practice-board-forecast-ribbon-rn-github-issue-fields/solution/app/package.json"
with open(file_path, "r") as f:
    data = json.load(f)

data["scripts"]["verify:build"] = "npm run build"
if "start+verify:build" in data["scripts"]:
    del data["scripts"]["start+verify:build"]

with open(file_path, "w") as f:
    json.dump(data, f, indent=2)
