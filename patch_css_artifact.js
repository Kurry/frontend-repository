const fs = require('fs');
let code = fs.readFileSync('tasks/frontend-workflow-workflow-builder/solution/app/src/styles.css', 'utf-8');

// Add artifact-panel styling reusing saved-panel styling
code += `

.artifact-panel { width: 56px; padding-inline: 8px; background: #fff; border-left: 1px solid #e0e0e0; transition: width .2s ease; overflow: hidden; display: flex; flex-direction: column; }
.artifact-panel:not(.open) .artifact-content, .artifact-panel:not(.open) .panel-heading > div { display: none; }
.artifact-panel.open { width: min(340px, 86vw); position: fixed; z-index: 20; top: var(--header-height); right: 0; bottom: 0; padding: 16px 12px; box-shadow: -12px 0 28px rgb(0 0 0 / 16%); }
@media (min-width: 1025px) {
  /* On desktop, artifact panel takes space if open */
  .workspace { display: flex; }
  .artifact-panel { position: static; height: calc(100vh - var(--header-height)); box-shadow: none; border-left: 1px solid #e0e0e0; flex-shrink: 0; }
  .artifact-panel.open { width: 340px; }
  .saved-panel { position: static; height: calc(100vh - var(--header-height)); box-shadow: none; flex-shrink: 0; }
  .saved-panel.open { width: var(--saved-width); }
  .center-column { flex: 1; min-width: 0; }
}
@media (max-width: 1024px) {
  .artifact-panel { display: none; }
  .artifact-panel.open { display: flex; }
}
@media (max-width: 768px) {
  .artifact-panel.open { top: auto; bottom: 0; left: 0; width: 100vw; height: 50vh; box-shadow: 0 -12px 28px rgb(0 0 0 / 16%); border-left: none; border-top: 1px solid #e0e0e0; }
}
`;

fs.writeFileSync('tasks/frontend-workflow-workflow-builder/solution/app/src/styles.css', code);
