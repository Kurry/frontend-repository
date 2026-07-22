const icons = require('@tabler/icons-solidjs');
console.log(Object.keys(icons).filter(k => k.toLowerCase().includes('undo') || k.toLowerCase().includes('arrowforward') || k.toLowerCase().includes('copy')));
