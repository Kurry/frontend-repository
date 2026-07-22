with open('tasks/frontend-productivity-focus-soundscape-automation-mixer/task.toml', 'r') as f:
    task_toml = f.read()

task_toml = task_toml.replace('name = "frontend-productivity/focus-soundscape-automation-mixer"', 'name = "frontend-productivity/focus-soundscape-automation-mixer"')
with open('tasks/frontend-productivity-focus-soundscape-automation-mixer/task.toml', 'w') as f:
    f.write(task_toml)
