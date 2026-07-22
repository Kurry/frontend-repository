import os
import re

with open('tasks/frontend-productivity-focus-soundscape-automation-mixer/task.toml', 'r') as f:
    task_toml = f.read()

task_toml = task_toml.replace('name = "Focus Soundscape Automation Mixer"', 'name = "frontend-productivity/focus-soundscape-automation-mixer"')
task_toml = task_toml.replace('[artifacts]\noracle_app = true\nreference_screenshots = false', 'artifacts = [\n  "oracle_app",\n]')
with open('tasks/frontend-productivity-focus-soundscape-automation-mixer/task.toml', 'w') as f:
    f.write(task_toml)

with open('tasks/frontend-productivity-focus-soundscape-automation-mixer/instruction.md', 'r') as f:
    content = f.read()

content = content.replace('- Provide a robust WebMCP contract binding `window.webmcp_session_info`, `webmcp_list_tools`, `webmcp_invoke_tool`.', 'Provide a robust WebMCP contract binding window.webmcp_session_info, webmcp_list_tools, webmcp_invoke_tool.')
with open('tasks/frontend-productivity-focus-soundscape-automation-mixer/instruction.md', 'w') as f:
    f.write(content)

os.system('rm tasks/frontend-productivity-focus-soundscape-automation-mixer/tests/core_features/core_features.toml')
os.system('rm tasks/frontend-productivity-focus-soundscape-automation-mixer/tests/visual_design/visual_design.toml')
os.system('rm tasks/frontend-productivity-focus-soundscape-automation-mixer/tests/motion/motion.toml')
os.system('rm tasks/frontend-productivity-focus-soundscape-automation-mixer/tests/technical/technical.toml')
