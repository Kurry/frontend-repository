const fs = require('fs');

let main = fs.readFileSync('tasks/frontend-landing-razorpay-sprint-26/solution/app/src/main.js', 'utf8');

// For deep-linking hash parity
const hashFix = `  setTimeout(() => { if (location.hash) { const target = document.querySelector(location.hash); if (target) { target.scrollIntoView(); spy(); } } }, 100);`;
// Add it after initNav() finishes
main = main.replace(
  `  window.addEventListener("scroll", spy, { passive: true });\n  spy();\n}`,
  `  window.addEventListener("scroll", spy, { passive: true });\n  spy();\n${hashFix}\n}`
);

fs.writeFileSync('tasks/frontend-landing-razorpay-sprint-26/solution/app/src/main.js', main);
