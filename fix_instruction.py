import re

with open("tasks/frontend-creative-tools-fictional-morton-cell-address-bit-interleave-repair-proof-studio/instruction.md", "r") as f:
    content = f.read()

# Fix markdown in core_features and accessibility by replacing hyphens and backticks
def strip_markdown(text):
    text = text.replace("- **", "")
    text = text.replace("**: ", " ")
    text = text.replace("- ", "")
    text = text.replace("`", "")
    return text

content = re.sub(r'<core_features>(.*?)</core_features>', lambda m: f"<core_features>{strip_markdown(m.group(1))}</core_features>", content, flags=re.DOTALL)
content = re.sub(r'<accessibility>(.*?)</accessibility>', lambda m: f"<accessibility>{strip_markdown(m.group(1))}</accessibility>", content, flags=re.DOTALL)

# Add Tailwind CSS 4.3.2 to summary and requirements
content = content.replace("</summary>", " Built with React 19, Vite, Zustand, Tailwind CSS 4.3.2, Framer Motion, and Zod.\n</summary>")
content = content.replace("Tailwind CSS v4", "Tailwind CSS 4.3.2")
# Add npm-local/no-CDN rule to requirements
content = content.replace("</requirements>", "The application must be fully npm-local with no external CDN resources loaded at runtime.\n</requirements>")

with open("tasks/frontend-creative-tools-fictional-morton-cell-address-bit-interleave-repair-proof-studio/instruction.md", "w") as f:
    f.write(content)
