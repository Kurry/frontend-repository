with open('tasks/frontend-workflow-submission-qc-queue/solution/app/src/components/ReviewDialogs.vue', 'r') as f:
    content = f.read()

content = content.replace(
    "import OverrideDialog from './OverrideDialog.vue'",
    "import OverrideDialog from './OverrideDialog.vue'\nimport ApproveDialog from './ApproveDialog.vue'"
)
content = content.replace(
    "<OverrideDialog />",
    "<OverrideDialog />\n  <ApproveDialog />"
)

with open('tasks/frontend-workflow-submission-qc-queue/solution/app/src/components/ReviewDialogs.vue', 'w') as f:
    f.write(content)
