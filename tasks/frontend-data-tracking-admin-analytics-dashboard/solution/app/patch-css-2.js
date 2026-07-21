const fs = require('fs');
let code = fs.readFileSync('styles.css', 'utf8');

// I will make sure .nav-group-item is fully tappable on mobile by giving it min-height
code = code.replace(
  '.nav-group-item {',
  '.nav-group-item { min-height: 44px;'
);
if (!code.includes('min-height: 44px;')) {
  // maybe it's written differently
  code = code.replace('.nav-group-item {', '.nav-group-item { min-height: 44px; ');
}

fs.writeFileSync('styles.css', code);
