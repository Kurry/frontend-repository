with open("tasks/frontend-workflow-ab-experiments/solution/app/src/styles.css", "r") as f:
    content = f.read()

# Add transition to .results-panel
# "Results panel computed transitionDuration was 0s, so the required slide animation was not observed"
new_results_panel = ".results-panel { position: fixed; z-index: 50; top: 66px; right: 0; bottom: 0; width: min(790px, calc(100vw - 206px)); overflow-y: auto; background: #0d111c; border-left: 1px solid #343b51; box-shadow: -30px 0 80px rgba(0,0,0,.4); transition: transform 0.25s ease-out; }"
content = content.replace(".results-panel { position: fixed; z-index: 50; top: 66px; right: 0; bottom: 0; width: min(790px, calc(100vw - 206px)); overflow-y: auto; background: #0d111c; border-left: 1px solid #343b51; box-shadow: -30px 0 80px rgba(0,0,0,.4); }", new_results_panel)

# Also adding hover wash that was requested but I missed in earlier step
hover_css = """
.bx--data-table tbody tr:hover {
  background-color: var(--surface-3);
}
"""
if ".bx--data-table tbody tr:hover" not in content:
    content += hover_css

with open("tasks/frontend-workflow-ab-experiments/solution/app/src/styles.css", "w") as f:
    f.write(content)
