import glob

for filename in glob.glob('tasks/frontend-workflow-submission-qc-queue/solution/app/src/components/*Dialog.vue'):
    with open(filename, 'r') as f:
        content = f.read()
    content = content.replace('class="field-error"', 'class="field-error" aria-live="polite"')
    with open(filename, 'w') as f:
        f.write(content)
