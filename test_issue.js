import fs from 'fs';

const content = fs.readFileSync('tasks/frontend-workflow-task-factory/solution/app/src/index.css', 'utf8');
const hasHeightTransition = content.includes('max-height') && content.includes('transition');
console.log(hasHeightTransition);
