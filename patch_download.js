const fs = require('fs');
const file = 'tasks/frontend-data-tracking-command-center/solution/app/src/App.jsx';
let content = fs.readFileSync(file, 'utf8');

const target = `    link.download = format === 'json' ? 'promptops-session.json' : 'promptops-agents.csv'
    link.click()
    URL.revokeObjectURL(url)`;
const replacement = `    link.download = format === 'json' ? 'promptops-session.json' : 'promptops-agents.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(file, content);
  console.log('Patched download anchor successfully.');
} else {
  console.log('Could not find download anchor target string.');
}
