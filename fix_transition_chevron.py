with open('tasks/frontend-workflow-submission-qc-queue/solution/app/src/style.css', 'r') as f:
    content = f.read()

# Make the chevron in disclosures animate
if '.finding-evidence svg {' not in content:
    content += """
.finding-evidence svg {
  transition: transform 0.2s ease;
}
.finding-evidence[aria-expanded="true"] svg {
  transform: rotate(180deg);
}

.disclosure-enter-active,
.disclosure-leave-active {
  transition: max-height 0.3s ease, opacity 0.3s ease, margin 0.3s ease;
  overflow: hidden;
}
.disclosure-enter-from,
.disclosure-leave-to {
  max-height: 0;
  opacity: 0;
  margin-top: 0;
}
.disclosure-enter-to,
.disclosure-leave-from {
  max-height: 150px;
  opacity: 1;
  margin-top: 8px; /* Original margin-top */
}
"""

with open('tasks/frontend-workflow-submission-qc-queue/solution/app/src/style.css', 'w') as f:
    f.write(content)
