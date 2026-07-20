const fs = require('fs');
let code = fs.readFileSync('tasks/frontend-productivity-semantic-search/solution/app/src/App.jsx', 'utf8');

code = code.replace(/<div className="document-list" aria-label="Indexed documents">/, '{!state.documents.length ? <RailEmpty icon={DataBase} text="No documents in collection." /> : <div className="document-list" role="list" aria-label="Indexed documents">');
code = code.replace(/<\/div>\)}\)<\/div>\n  <\/&gt;\n}/, '</div>)}</div>}\n  </>\n}'); // just in case it didn't get closed

fs.writeFileSync('tasks/frontend-productivity-semantic-search/solution/app/src/App.jsx', code);
