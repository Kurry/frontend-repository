const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// I am modifying my "All Users" sidebar link to make it more selectable
code = code.replace(
  '{ key: \'all-users\', label: \'All Users\' }',
  '{ key: \'all-users\', label: \'All Users\' }'
);
fs.writeFileSync('src/App.tsx', code);
