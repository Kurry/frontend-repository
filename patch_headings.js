const fs = require('fs');
let app = fs.readFileSync('tasks/frontend-data-tracking-judge-ab-lab/solution/app/src/App.jsx', 'utf8');

const replacements = {
  'Trial collection': 'Trial Collection',
  'Paired trial results': 'Paired Trial Results',
  'A × B agreement map': 'A × B Agreement Map',
  'No flips tagged yet': 'No Flips Tagged Yet',
  'Cost across ordered rescore events': 'Cost Across Ordered Rescore Events',
  'No trials match these filters': 'No Trials Match These Filters',
  'No paired trials match': 'No Paired Trials Match',
  'Pick two distinct labels': 'Pick Two Distinct Labels',
  'No cost series selected': 'No Cost Series Selected',
  'Failing only under': 'Failing Only Under',
  'Event timeline': 'Event Timeline',
  'Create an alternative scoring label': 'Create An Alternative Scoring Label',
  'Assign label': 'Assign Label',
  'No matching command': 'No Matching Command'
};

for (const [search, replace] of Object.entries(replacements)) {
  app = app.split(search).join(replace);
}

fs.writeFileSync('tasks/frontend-data-tracking-judge-ab-lab/solution/app/src/App.jsx', app);
