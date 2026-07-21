const fs = require('fs');
let code = fs.readFileSync('src/data.ts', 'utf8');

// Fix nextId
code = code.replace(
  "export function nextId(): string { return `u-${Date.now()}-${Math.floor(Math.random() * 1e4)}`; }",
  "let _uid = 100;\nexport function nextId(): string { return `u-${Date.now()}-${_uid++}`; }"
);

fs.writeFileSync('src/data.ts', code);
