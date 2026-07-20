import glob

for filename in glob.glob('tasks/frontend-workflow-submission-qc-queue/solution/app/src/components/*Dialog.vue'):
    with open(filename, 'r') as f:
        content = f.read()

    # NInput needs :input-props="{ id: '...' }" instead of input-props="id: '...'"
    content = content.replace('input-props="id: \'description\'"', ':input-props="{ id: \'description\' }"')
    content = content.replace('input-props="id: \'evidence\'"', ':input-props="{ id: \'evidence\' }"')
    content = content.replace('input-props="id: \'summary\'"', ':input-props="{ id: \'summary\' }"')
    content = content.replace('input-props="id: \'justification\'"', ':input-props="{ id: \'justification\' }"')

    with open(filename, 'w') as f:
        f.write(content)
