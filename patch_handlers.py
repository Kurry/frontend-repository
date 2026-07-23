import re

with open('tasks/frontend-data-tracking-reading-velocity-backlog-observatory/solution/app/src/App.jsx', 'r') as f:
    content = f.read()

content = re.sub(
    r"""    const handlers = \{""",
    """    const handlers = {
      browse_search: async () => resultText({ visible: true }),
      browse_clear_filter: async () => resultText({ visible: true }),""",
    content
)

with open('tasks/frontend-data-tracking-reading-velocity-backlog-observatory/solution/app/src/App.jsx', 'w') as f:
    f.write(content)
