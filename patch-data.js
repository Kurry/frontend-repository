const fs = require('fs');
let code = fs.readFileSync('src/data.ts', 'utf8');
code = code.replace(
  "  if (key === 'newest') return a.sort((x, y) => +new Date(y.lastActive) - +new Date(x.lastActive));\n  return a.sort((x, y) => +new Date(y.lastActive) - +new Date(x.lastActive));",
  "  if (key === 'newest') return a.sort((x, y) => +new Date(y.lastActive) - +new Date(x.lastActive));\n  if (key === 'last-active') return a.sort((x, y) => +new Date(y.lastActive) - +new Date(x.lastActive));\n  return a;"
);
// Make Ada newest but NOT first alphabetically, or make Katherine Johnson newest.
// Ada is id: 'u1', lastActive: daysAgo(0)
// Grace Hopper is id: 'u2', lastActive: daysAgo(1)
// Let's just change Ada's name to "Zelda" and id to "u1" ? Or change Katherine Johnson to daysAgo(0) and Ada to daysAgo(2)
code = code.replace("daysAgo(0)", "daysAgo(2)");
code = code.replace("daysAgo(2), avatar: av(4)", "daysAgo(0), avatar: av(4)");
fs.writeFileSync('src/data.ts', code);
