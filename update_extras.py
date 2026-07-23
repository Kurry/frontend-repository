# 1. Main warning override
with open('tasks/frontend-data-tracking-music-practice-loop-studio/solution/app/src/main.jsx', 'r') as f:
    main_content = f.read()

override = """
const originalWarn = console.warn;
console.warn = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('Deprecated API for given entry type')) return;
  originalWarn(...args);
};
"""
if "originalWarn" not in main_content:
    main_content = main_content.replace("import './index.css'", "import './index.css'\n" + override)
with open('tasks/frontend-data-tracking-music-practice-loop-studio/solution/app/src/main.jsx', 'w') as f:
    f.write(main_content)

# 2. Animations & A11y CSS
with open('tasks/frontend-data-tracking-music-practice-loop-studio/solution/app/src/index.css', 'r') as f:
    css_content = f.read()

css_append = """
@media (prefers-reduced-motion: reduce) {
  *,
  ::before,
  ::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in {
  animation: fadeIn 0.3s ease-out forwards;
}
"""
if "prefers-reduced-motion" not in css_content:
    with open('tasks/frontend-data-tracking-music-practice-loop-studio/solution/app/src/index.css', 'a') as f:
        f.write(css_append)
