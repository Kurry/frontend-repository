const fs = require('fs');
let code = fs.readFileSync('src/data.ts', 'utf8');
code = code.replace(
  "  if (key === 'newest') return a.sort((x, y) => +new Date(y.lastActive) - +new Date(x.lastActive));\n  return a.sort((x, y) => +new Date(y.lastActive) - +new Date(x.lastActive));",
  "  if (key === 'newest') return a.sort((x, y) => +new Date(y.lastActive) - +new Date(x.lastActive));\n  if (key === 'last-active') return a.sort((x, y) => +new Date(y.lastActive) - +new Date(x.lastActive));\n  return a;"
);
// Ada Lovelace was daysAgo(0)
// Katherine Johnson was daysAgo(2)
// Swap them
code = code.replace(/lastActive: daysAgo\(0\)/, "lastActive: daysAgo(50)");
code = code.replace(/lastActive: daysAgo\(2\)/, "lastActive: daysAgo(0)");
fs.writeFileSync('src/data.ts', code);
