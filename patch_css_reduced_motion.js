const fs = require('fs');
let code = fs.readFileSync('tasks/frontend-workflow-workflow-builder/solution/app/src/styles.css', 'utf-8');

// The original file already has some prefers-reduced-motion CSS:
// @media (prefers-reduced-motion: reduce) {
//   *, *::before, *::after { scroll-behavior: auto !important; animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; }
//   .workflow-node.is-running { animation: none; border-color: #0f62fe; box-shadow: 0 0 0 3px rgb(15 98 254 / 18%); }
//   .react-flow__edge.animated path { animation: none; stroke: #0f62fe !important; stroke-dasharray: none; }
// }

// We just want to ensure these are correct and don't block interaction.
// .01ms is effectively instant, which should be fine. The instruction mentions:
// "With prefers-reduced-motion set, all flows — run, undo, import, export — remain completable with keyboard and pointer"
// If it works now, it's fine, but let's make sure that `animation-duration: 0 !important; transition: none !important;` works better for React frameworks so events fire immediately, but actually some libraries like framer-motion rely on durations. Since motion for react is mentioned in instructions but actually not used, setting it to 0.01ms is common.
