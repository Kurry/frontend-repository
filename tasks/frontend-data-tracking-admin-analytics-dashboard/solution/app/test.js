const fs = require('fs');
const code = fs.readFileSync('src/data.ts', 'utf8');
const lines = code.split('\n').filter(line => line.includes('return a.sort') && line.includes('name-az'));
console.log(lines);
