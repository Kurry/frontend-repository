#!/bin/bash
TARGET="tasks/frontend-data-tracking-pantry-nutrition-stock-ledger-constraint-canvas-rn-linear-views"

HEADER=$(cat "$TARGET/tests/user_flows/user_flows.toml" | awk '/\[scoring\]/{exit} {print}')

for file in "$TARGET/tests/core_features/core_features.toml" \
            "$TARGET/tests/visual_design/visual_design.toml" \
            "$TARGET/tests/motion/motion.toml" \
            "$TARGET/tests/technical/technical.toml"; do
  # Extract the criteria parts (from [[criterion]] onwards)
  CRITERIA=$(cat "$file" | awk '/\[\[criterion\]\]/{flag=1} flag')
  echo "$HEADER" > "$file"
  echo "" >> "$file"
  echo "[scoring]" >> "$file"
  echo "aggregation = \"weighted_mean\"" >> "$file"
  echo "" >> "$file"
  echo "$CRITERIA" >> "$file"
done
