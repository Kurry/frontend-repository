import re

with open("tasks/frontend-workflow-podcast-episode-assembly-board/solution/app/src/App.tsx", "r") as f:
    content = f.read()

# 1. Import validator
content = content.replace("import { useStore", "import { runValidation }\nfrom './validator';\nimport { useStore")

# 2. Update Validation Findings to use real data
validation_ui = """
              {activeTab === 'validator' && (
                <div className="bg-gray-800 p-6 rounded-lg space-y-4">
                  <h3 className="text-lg font-bold">Validation Findings</h3>
                  <ul className="space-y-3">
                    {runValidation(store).map((finding, idx) => (
                      <li key={idx} className={`flex items-center gap-3 p-3 rounded border ${finding.type === 'error' ? 'bg-red-900/30 border-red-800 text-red-200' : 'bg-green-900/30 border-green-800 text-green-200'}`}>
                        {finding.type === 'error' ? <AlertTriangle className="w-5 h-5" /> : <Check className="w-5 h-5" />}
                        {finding.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
"""

# Replace the old static validation block
content = re.sub(
    r"\{activeTab === 'validator' && \([\s\S]*?</div>\s*\)\}",
    validation_ui.strip(),
    content
)

with open("tasks/frontend-workflow-podcast-episode-assembly-board/solution/app/src/App.tsx", "w") as f:
    f.write(content)
