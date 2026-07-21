const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Fix Aria-Live in ExportDrawer
// Replace: <div className="export-summary" aria-label="Export summary">
// With: <div className="export-summary" aria-live="polite" aria-atomic="true" aria-label="Export summary">
code = code.replace(
  '<div className="export-summary" aria-label="Export summary">',
  '<div className="export-summary" aria-live="polite" aria-atomic="true" aria-label="Export summary">'
);

// We need an aria-live region to announce the change when we switch tabs
code = code.replace(
  '<div className="export-tabs" role="tablist" aria-label="Export format">',
  '<div aria-live="polite" className="sr-only">{`Export preview updated: ${exportTab === "json" ? "Session JSON" : "Users CSV"}`}</div>\n        <div className="export-tabs" role="tablist" aria-label="Export format">'
);

fs.writeFileSync('src/App.tsx', code);
