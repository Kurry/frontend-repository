import toml
import os

task_slug = "frontend-creative-tools-drum-pattern-practice-board-forecast-ribbon-rn-github-issue-fields"
task_dir = f"tasks/{task_slug}"

# task.toml
task_toml = {
    "name": f"Kurry/{task_slug}",
    "description": "Drum Pattern Practice Board - Forecast Ribbon - GitHub Issue Fields",
    "version": "1.0.0",
    "metadata": {
        "genre": "good-app"
    }
}

os.makedirs(task_dir, exist_ok=True)
with open(f"{task_dir}/task.toml", "w") as f:
    toml.dump(task_toml, f)

print("Created task.toml")
