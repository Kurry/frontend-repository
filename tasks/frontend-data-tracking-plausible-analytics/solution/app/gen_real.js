const fs = require('fs');

let criteriaData = JSON.parse(fs.readFileSync('../../tests/core_features/core_features.toml', 'utf8') || '[]');
// We'll just build an engine to generate real implementations dynamically based on names.
