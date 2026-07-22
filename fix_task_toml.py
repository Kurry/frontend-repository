import toml
import os

task_dir = "tasks/frontend-creative-tools-drum-pattern-practice-board-forecast-ribbon-rn-github-issue-fields"
with open(f"{task_dir}/task.toml", "r") as f:
    lines = f.readlines()

with open(f"{task_dir}/task.toml", "w") as f:
    for line in lines:
        if line.startswith("name = "):
            f.write('name = "mercor-intelligence/frontend-creative-tools-drum-pattern-practice-board-forecast-ribbon-rn-github-issue-fields"\n')
        else:
            f.write(line)
