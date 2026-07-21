const fs = require('fs');
let code = fs.readFileSync('styles.css', 'utf8');

// Fix tabs off screen
code = code.replace(
  '.export-tabs { display: flex; gap: .4rem; padding: .8rem 1.2rem; border-bottom: var(--hairline); }',
  '.export-tabs { display: flex; gap: .4rem; padding: .8rem 1.2rem; border-bottom: var(--hairline); flex-wrap: wrap; }'
);

// We should also check for `nav` landmarks. It should already be good from the App.tsx patch.

fs.writeFileSync('styles.css', code);
