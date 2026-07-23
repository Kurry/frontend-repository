const fs = require('fs');

// To fix reduced motion with framer-motion, we need to respect the hook or CSS query.
// A simple way is to use Tailwind's `motion-safe:` utility class for transition durations on buttons,
// but for Framer Motion we should wrap with a MotionConfig or just use CSS for basic animation if we don't have MotionConfig setup.
// Let's modify index.css to enforce reduced motion globally since Tailwind's transition utilities just need to be overridden.

let css = fs.readFileSync('tasks/frontend-creative-tools-stack-trace-path-finder/solution/app/src/index.css', 'utf8');

if (!css.includes('prefers-reduced-motion')) {
  css += `
@media (prefers-reduced-motion: reduce) {
  *, ::before, ::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
`;
  fs.writeFileSync('tasks/frontend-creative-tools-stack-trace-path-finder/solution/app/src/index.css', css);
}
