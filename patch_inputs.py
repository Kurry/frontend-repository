import re

with open('tasks/frontend-workflow-submission-qc-queue/solution/app/src/components/AddFindingDialog.vue', 'r') as f:
    content = f.read()

# Replace NSelect with native select in AddFindingDialog
content = re.sub(
    r'<NSelect :value="value" :options="tierOptions" placeholder="Select severity tier" aria-describedby="tier-error" @update:value="handleChange" @blur="handleBlur" />',
    r'<select :value="value" id="tier" aria-describedby="tier-error" @change="handleChange($event.target.value)" @blur="handleBlur" class="filter-select"><option value="" disabled>Select severity tier</option><option v-for="opt in tierOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option></select>',
    content
)

content = re.sub(
    r'<NSelect :value="value" :options="categoryOptions" placeholder="Select closed category" aria-describedby="category-error" @update:value="handleChange" @blur="handleBlur" />',
    r'<select :value="value" id="category" aria-describedby="category-error" @change="handleChange($event.target.value)" @blur="handleBlur" class="filter-select"><option value="" disabled>Select closed category</option><option v-for="opt in categoryOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option></select>',
    content
)

content = content.replace('<NInput :value="value" type="textarea" :autosize="{ minRows: 3, maxRows: 6 }" placeholder="Describe the quality issue and its impact…" aria-describedby="description-error" @update:value="handleChange" @blur="handleBlur" />',
    '<NInput input-props="id: \'description\'" id="description" :value="value" type="textarea" :autosize="{ minRows: 3, maxRows: 6 }" placeholder="Describe the quality issue and its impact…" aria-describedby="description-error" @update:value="handleChange" @blur="handleBlur" />')

content = content.replace('<NInput :value="value" type="textarea" :autosize="{ minRows: 2, maxRows: 5 }" placeholder="Paste an observed example or trial note…" @update:value="handleChange" @blur="handleBlur" />',
    '<NInput input-props="id: \'evidence\'" id="evidence" :value="value" type="textarea" :autosize="{ minRows: 2, maxRows: 5 }" placeholder="Paste an observed example or trial note…" @update:value="handleChange" @blur="handleBlur" />')

with open('tasks/frontend-workflow-submission-qc-queue/solution/app/src/components/AddFindingDialog.vue', 'w') as f:
    f.write(content)


with open('tasks/frontend-workflow-submission-qc-queue/solution/app/src/components/RevisionDialog.vue', 'r') as f:
    content = f.read()

content = content.replace('<NInput :value="value" type="textarea" :autosize="{ minRows: 4, maxRows: 8 }" placeholder="Explain what the contributor needs to revise…" aria-describedby="summary-error" @update:value="handleChange" @blur="handleBlur" />',
    '<NInput input-props="id: \'summary\'" id="summary" :value="value" type="textarea" :autosize="{ minRows: 4, maxRows: 8 }" placeholder="Explain what the contributor needs to revise…" aria-describedby="summary-error" @update:value="handleChange" @blur="handleBlur" />')

with open('tasks/frontend-workflow-submission-qc-queue/solution/app/src/components/RevisionDialog.vue', 'w') as f:
    f.write(content)


with open('tasks/frontend-workflow-submission-qc-queue/solution/app/src/components/OverrideDialog.vue', 'r') as f:
    content = f.read()

content = content.replace('<NInput :value="value" type="textarea" :autosize="{ minRows: 4, maxRows: 8 }" placeholder="Explain why this exception is appropriate…" aria-describedby="justification-error" @update:value="handleChange" @blur="handleBlur" />',
    '<NInput input-props="id: \'justification\'" id="justification" :value="value" type="textarea" :autosize="{ minRows: 4, maxRows: 8 }" placeholder="Explain why this exception is appropriate…" aria-describedby="justification-error" @update:value="handleChange" @blur="handleBlur" />')

with open('tasks/frontend-workflow-submission-qc-queue/solution/app/src/components/OverrideDialog.vue', 'w') as f:
    f.write(content)
