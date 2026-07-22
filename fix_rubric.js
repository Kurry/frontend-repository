const fs = require('fs');

const file = 'tasks/frontend-planning-airport-layover-activity-planner-constraint-canvas-rn-linear-views/tests/behavioral/behavioral.toml';
const content = fs.readFileSync(file, 'utf8');

const target = `[[criterion]]
id = "behavioral.artifact_round_trip"
title = "Authored order/selection/geometry and domain state survive; invalid import is a no-op."
description = "Verify that exporting, clearing, and importing the artifact restores exact domain states; invalid schema is rejected without mutating state."
weight = 1
`;

// we need to replace the last occurrence or just replace it.
const updated = content.replace(/\[\[criterion\]\]\nid = "behavioral\.artifact_round_trip"[\s\S]*$/, target);
fs.writeFileSync(file, updated);
