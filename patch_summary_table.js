const fs = require('fs');
const file = 'tasks/frontend-data-tracking-command-center/solution/app/src/App.jsx';
let content = fs.readFileSync(file, 'utf8');

const target = `{state.agents.length ? <table className="breakdown-table summary-table"><thead><tr><th>Name</th><th>Model</th><th>State</th><th>Last active</th></tr></thead><tbody>{state.agents.map((agent) => <tr key={agent.id}><td>{agent.name}</td><td>{agent.model}</td><td>{agent.state}</td><td>{relativeTime(agent.lastActive)}</td></tr>)}</tbody></table> : <p className="summary-empty">No agents are connected right now.</p>}`;
const replacement = `{state.agents.length ? <div className="breakdown-table-wrap"><table className="breakdown-table summary-table"><thead><tr><th>Name</th><th>Model</th><th>State</th><th>Last active</th></tr></thead><tbody>{state.agents.map((agent) => <tr key={agent.id}><td>{agent.name}</td><td>{agent.model}</td><td>{agent.state}</td><td>{relativeTime(agent.lastActive)}</td></tr>)}</tbody></table></div> : <p className="summary-empty">No agents are connected right now.</p>}`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(file, content);
  console.log('Patched summary table successfully.');
} else {
  console.log('Could not find summary table target string.');
}
