const fs = require('fs');

let main = fs.readFileSync('tasks/frontend-landing-razorpay-sprint-26/solution/app/src/main.js', 'utf8');

// Ensure WebGL fallback still triggers exit cleanly.
// It seems `glbLoaded` is dispatched by fallback() as well, so it triggers `minReady` and `exit()`.
