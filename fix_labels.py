import re
import glob

for filename in glob.glob('tasks/frontend-workflow-submission-qc-queue/solution/app/src/components/*Dialog.vue'):
    with open(filename, 'r') as f:
        content = f.read()

    # Revert to original using <div class="form-field"> instead of <label class="form-field">
    content = content.replace('<label class="form-field"', '<div class="form-field"')
    content = content.replace('</label>', '</div>')

    with open(filename, 'w') as f:
        f.write(content)
