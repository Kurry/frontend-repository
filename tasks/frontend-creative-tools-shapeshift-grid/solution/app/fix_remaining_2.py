import re
with open("grid-tool.js", "r") as f:
    content = f.read()

# Make sure camera triggers lock
content = content.replace("finalizeUpload(video, ox, oy, sz);", "finalizeUpload(video, ox, oy, sz); lockSlider();")

# 5. Fix text selection / contrast in UI inputs
content = content.replace('background: #222;', 'background: #000; border: 1px solid #333;')

with open("grid-tool.js", "w") as f:
    f.write(content)
