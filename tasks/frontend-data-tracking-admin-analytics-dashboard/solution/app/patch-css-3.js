const fs = require('fs');
let code = fs.readFileSync('styles.css', 'utf8');

// I will make sure .nav-item is fully tappable on mobile by giving it min-height
if (code.includes('.nav-item {') && !code.includes('.nav-item { min-height: 44px;')) {
  code = code.replace('.nav-item {', '.nav-item { min-height: 44px;');
}

fs.writeFileSync('styles.css', code);
