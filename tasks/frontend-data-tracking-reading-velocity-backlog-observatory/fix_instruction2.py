import re
from pathlib import Path

instruction_path = Path("instruction.md")
content = instruction_path.read_text()

# We need to recreate the PRD based on the proposal, correctly format task.toml and run validation
