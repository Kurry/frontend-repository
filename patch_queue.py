import re

with open('tasks/frontend-workflow-submission-qc-queue/solution/app/src/components/QueueView.vue', 'r') as f:
    content = f.read()

# Replace NSelect with native select for stage
content = re.sub(
    r'<NSelect :value="(filters\.\w+ \|\| \'\')" :options="(\w+)" aria-label="([^"]+)" @update:value="(store\.setFilter\(\'[^\']+\', \$event\))" />',
    r'<select :value="\1" aria-label="\3" @change="\4.replace(\'$event\', $event.target.value)" class="filter-select"><option v-for="opt in \2" :key="opt.value" :value="opt.value">{{ opt.label }}</option></select>',
    content
)

# For sort
content = re.sub(
    r'<NSelect :value="(sort)" :options="(sortOptions)" aria-label="([^"]+)" @update:value="(store\.setSort)" />',
    r'<select :value="\1" aria-label="\3" @change="\4($event.target.value)" class="filter-select"><option v-for="opt in \2" :key="opt.value" :value="opt.value">{{ opt.label }}</option></select>',
    content
)

with open('tasks/frontend-workflow-submission-qc-queue/solution/app/src/components/QueueView.vue', 'w') as f:
    f.write(content)
