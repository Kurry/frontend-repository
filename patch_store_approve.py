with open('tasks/frontend-workflow-submission-qc-queue/solution/app/src/store.js', 'r') as f:
    content = f.read()

content = content.replace(
    'dialogs: { add: false, revision: false, override: false, overrideFindingId: null }',
    'dialogs: { add: false, revision: false, override: false, approve: false, overrideFindingId: null }'
)

with open('tasks/frontend-workflow-submission-qc-queue/solution/app/src/store.js', 'w') as f:
    f.write(content)
