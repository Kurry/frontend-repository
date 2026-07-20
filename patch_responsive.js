const fs = require('fs');
let css = fs.readFileSync('tasks/frontend-data-tracking-judge-ab-lab/solution/app/src/styles.css', 'utf8');

// Global overflow fixes
css = css.replace(
  '.app-root { min-height: 100vh; display: flex; flex-direction: column; background: var(--bg); color: var(--text); }',
  '.app-root { min-height: 100vh; display: flex; flex-direction: column; background: var(--bg); color: var(--text); width: 100%; max-width: 100vw; overflow-x: hidden; }'
);

css = css.replace(
  '.page-shell { width: 1080px; max-width: 100%; margin: 0 auto; padding: 36px 0 80px; flex: 1; }',
  '.page-shell { width: 1080px; max-width: 100vw; margin: 0 auto; padding: 36px 0 80px; flex: 1; overflow-x: hidden; box-sizing: border-box; }'
);

css = css.replace(
  '.suggestions { display: flex; align-items: center; gap: 8px; margin-bottom: 24px; }',
  '.suggestions { display: flex; align-items: center; gap: 8px; margin-bottom: 24px; flex-wrap: wrap; }'
);

// Mobile specific overrides
css = css.replace(
  '.filter-bar { display: flex; overflow-x: auto; align-items: flex-end; }',
  '.filter-bar { display: grid; grid-template-columns: 1fr; gap: 12px; align-items: stretch; overflow-x: hidden; }'
);

css = css.replace(
  '.filter-bar > * { min-width: 155px; flex: 0 0 auto; }',
  '.filter-bar > * { min-width: 0; flex: none; }'
);

css = css.replace(
  '.summary-strip { grid-template-columns: repeat(5, minmax(135px, 1fr)); overflow-x: auto; }',
  '.summary-strip { grid-template-columns: 1fr 1fr; gap: 10px; overflow-x: hidden; }\n  .summary-strip > * { min-width: 0; }'
);

css = css.replace(
  '.page-shell { width: calc(100% - 24px); padding-top: 22px; }',
  '.page-shell { width: 100%; padding: 22px 12px; box-sizing: border-box; }'
);

// Tap targets override
css = css.replace(
  '@media (max-width: 760px) {',
  `@media (max-width: 760px) {
  .mantine-ActionIcon-root { min-height: 44px; min-width: 44px; }
  .mantine-Button-root { min-height: 44px; }
  .mantine-Select-input, .mantine-NumberInput-input, .mantine-TextInput-input, .mantine-MultiSelect-input { min-height: 44px; }
  .chip { min-height: 44px; padding: 10px 16px; font-size: 13px; }
  .header-actions { gap: 6px; }
  .table-scroll { max-width: calc(100vw - 24px); overflow-x: auto; }
`
);

fs.writeFileSync('tasks/frontend-data-tracking-judge-ab-lab/solution/app/src/styles.css', css);
