const fs = require('fs');
let app = fs.readFileSync('tasks/frontend-data-tracking-judge-ab-lab/solution/app/src/App.jsx', 'utf8');

app = app.replace(
  "import { useAutoAnimate } from '@formkit/auto-animate/react'\nimport { motion, AnimatePresence } from 'motion/react'",
  "import { useAutoAnimate } from '@formkit/auto-animate/react'"
);

app = app.replace(
  `  useEffect(() => {
    const observer = new MutationObserver(() => {
      document.querySelectorAll('button[tabindex="-1"]:not([disabled])').forEach(b => b.setAttribute('tabindex', '0'));
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [])`,
  ""
);

fs.writeFileSync('tasks/frontend-data-tracking-judge-ab-lab/solution/app/src/App.jsx', app);
