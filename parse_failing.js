const fs = require('fs');
const data = JSON.parse(fs.readFileSync('tasks/frontend-productivity-semantic-search/solution/reward-details.json', 'utf8'));

let count = 0;
for (const [category, details] of Object.entries(data)) {
    if (details.criteria) {
        for (const entry of details.criteria) {
            if (entry.value === 0 || (entry.reasoning && (entry.reasoning.startsWith('BLOCKED:') || entry.reasoning.startsWith('FAIL:')))) {
                console.log(`[${category}] ${entry.name}`);
                count++;
            }
        }
    }
}
console.log(`Total: ${count}`);
