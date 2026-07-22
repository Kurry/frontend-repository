const fs = require('fs');
const path = require('path');

const baseDir = 'tasks/frontend-planning-airport-layover-activity-planner-constraint-canvas-rn-linear-views/tests';

const headerFile = path.join(baseDir, 'user_flows/user_flows.toml');
const headerContent = fs.readFileSync(headerFile, 'utf8').split('[[criterion]]')[0];

const tomlsToFix = ['core_features', 'visual_design', 'motion', 'technical'];

for (const dir of tomlsToFix) {
  const filePath = path.join(baseDir, dir, `${dir}.toml`);
  const content = fs.readFileSync(filePath, 'utf8');

  // Find where our custom criterion starts
  const criteriaStart = content.indexOf('[[criterion]]');
  if (criteriaStart !== -1) {
    const customCriteria = content.substring(criteriaStart);
    fs.writeFileSync(filePath, headerContent + customCriteria);
  }
}
