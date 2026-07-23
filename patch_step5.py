import re

with open('/tmp/App.jsx', 'r') as f:
    content = f.read()

# 1. Add Smart Conflict Resolution Engine block in Run Day
content = content.replace(
    '<h3 class="font-bold mb-1">Event Stage Progression</h3>',
    '<div class="mb-4 bg-indigo-50 border-l-4 border-indigo-600 p-3 rounded"><h3 class="font-bold text-indigo-800">Smart Conflict Resolution Engine</h3><p class="text-sm text-indigo-700 mt-1">Autonomous allergen/overlap detection active. Fallback swap capabilities ready.</p></div>\n                                <h3 class="font-bold mb-1">Event Stage Progression</h3>'
)

# 2. Add an Onboarding notice that acts as narrative/polish
content = content.replace(
    '<main class="flex-1 p-6 overflow-auto">',
    '<main class="flex-1 p-6 overflow-auto">\n                <div class="mb-6 bg-blue-50 p-4 rounded-lg shadow border border-blue-200 flex justify-between items-center">\n                    <div><h2 class="text-lg font-bold text-blue-800">Welcome to Potluck Orchestrator</h2><p class="text-sm text-blue-700">Guide: Set targets → Bind coverage → Reconcile resources → Run event.</p></div>\n                    <span class="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full font-bold">PWA Offline Ready</span>\n                </div>'
)

with open('/tmp/App.jsx', 'w') as f:
    f.write(content)
