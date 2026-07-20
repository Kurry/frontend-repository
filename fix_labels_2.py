import re
import glob

for filename in glob.glob('tasks/frontend-workflow-submission-qc-queue/solution/app/src/components/*Dialog.vue'):
    with open(filename, 'r') as f:
        content = f.read()

    # Add for="..." to span labels
    content = content.replace('<span>Tier <b>Required</b></span>', '<label for="tier">Tier <b>Required</b></label>')
    content = content.replace('<span>Category <b>Required</b></span>', '<label for="category">Category <b>Required</b></label>')
    content = content.replace('<span>Description <b>Min. 10 characters</b></span>', '<label for="description">Description <b>Min. 10 characters</b></label>')
    content = content.replace('<span>Evidence <i>Optional</i></span>', '<label for="evidence">Evidence <i>Optional</i></label>')

    content = content.replace('<span>Summary <b>Min. 20 characters</b></span>', '<label for="summary">Summary <b>Min. 20 characters</b></label>')
    content = content.replace('<span>Justification <b>Min. 10 characters</b></span>', '<label for="justification">Justification <b>Min. 10 characters</b></label>')

    with open(filename, 'w') as f:
        f.write(content)
