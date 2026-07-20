const fs = require('fs');
let code = fs.readFileSync('tasks/frontend-workflow-workflow-builder/solution/app/src/App.jsx', 'utf-8');

const coachmark = `
function Coachmark() {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;
  return (
    <div className="coachmark" style={{ position: 'absolute', top: 16, right: 16, zIndex: 100 }}>
      <InlineNotification kind="info" title="Welcome!" subtitle="Drag nodes from the palette, click Run, or Export Artifacts." onCloseButtonClick={() => setVisible(false)} />
    </div>
  );
}`;

code = code.replace('function App() {', coachmark + '\n\nfunction App() {');
code = code.replace('<ToastLayer />', '<ToastLayer />\n      <Coachmark />');

fs.writeFileSync('tasks/frontend-workflow-workflow-builder/solution/app/src/App.jsx', code);
