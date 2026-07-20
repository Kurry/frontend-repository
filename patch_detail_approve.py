with open('tasks/frontend-workflow-submission-qc-queue/solution/app/src/components/DetailView.vue', 'r') as f:
    content = f.read()

content = content.replace(
    '<NButton type="primary" :disabled="!!approveReason" @click="store.approve(submission.id)"><IconCheckCircle /> Approve</NButton>',
    '<NButton type="primary" :disabled="!!approveReason" @click="store.dialogs.approve = true"><IconCheckCircle /> Approve</NButton>'
)

with open('tasks/frontend-workflow-submission-qc-queue/solution/app/src/components/DetailView.vue', 'w') as f:
    f.write(content)
