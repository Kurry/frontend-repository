const fs = require('fs');
let app = fs.readFileSync('tasks/frontend-data-tracking-judge-ab-lab/solution/app/src/App.jsx', 'utf8');

// Also ensure withinPortal={false} is set for SavePairModal, RescoreModal, ExportModal to be safe?
// No, those are fine as portals. We only need the ones inside CompareView to be hidden when CompareView is hidden.
