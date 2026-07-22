import json

file_path = "tasks/frontend-creative-tools-drum-pattern-practice-board-forecast-ribbon-rn-github-issue-fields/solution/app/package.json"
with open(file_path, "r") as f:
    data = json.load(f)

# corpuscheck seems to match exactly the command, maybe it needs "npm run build && npm start"
# Oh wait, the validation script checks `start+verify:build` and expects it.
data["scripts"]["start+verify:build"] = "npm run build && npm start"

with open(file_path, "w") as f:
    json.dump(data, f, indent=2)
