const fs = require('fs');
let text = fs.readFileSync('/tmp/test_out.log', 'utf8');
let fails = text.split('Failed').length - 1;
let passes = text.split('passed').length - 1;
console.log('Fails:', fails, 'Passes:', passes);
