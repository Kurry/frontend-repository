import re

with open('/tmp/App.jsx', 'r') as f:
    content = f.read()

# 1. Typography and Header Flex
content = content.replace(
    '<header class="bg-indigo-600 text-white p-4 shadow-md flex justify-between items-center">',
    '<header class="bg-indigo-600 text-white p-4 shadow-md flex flex-wrap justify-between items-center gap-4">'
)
content = content.replace(
    '<h1 class="text-xl font-bold">Potluck Contribution Orchestrator</h1>',
    '<h1 class="text-xl md:text-2xl font-bold">Potluck Contribution Orchestrator</h1>'
)
content = content.replace(
    '<div class="space-x-4">',
    '<div class="flex flex-wrap gap-2">'
)

# 2. Buttons min-height 44px
content = content.replace(
    'px-3 py-1 rounded"',
    'px-3 py-2 min-h-[44px] rounded"'
)
content = content.replace(
    'px-4 py-2 rounded',
    'px-4 py-2 min-h-[44px] rounded'
)

# 3. Coverage Matrix table wrapping to prevent overflow on 375px
content = content.replace(
    '<div class="bg-white p-6 rounded shadow">',
    '<div class="bg-white p-4 sm:p-6 rounded shadow max-w-full overflow-hidden">'
)

# Add state for mobile menu if needed, but flex-wrap gap-2 usually solves the basic requirement
# of not breaking layout at 375px.

with open('/tmp/App.jsx', 'w') as f:
    f.write(content)
