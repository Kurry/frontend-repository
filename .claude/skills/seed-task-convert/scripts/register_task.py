#!/usr/bin/env python3
"""Register a converted task in the three WebMCP schema files.

  - webmcp-task-sources.json : {source, instruction, description}  (fixes shared_shape)
  - webmcp-assignment-map.json : the module binding (migration input)
  - webmcp-assignments.json    : the SAME binding in the compiled `assignments`
    array — oracle-ci reads THIS file, not the map, so both must carry it.

The binding JSON (see references/webmcp-bridge.md) must have:
  { "modules": [...], "bindings": {...}, "mechanics_exclusions": [...] }
`task` is filled in from --slug. `description` defaults from the binding or --description.

Usage:
  register_task.py --slug frontend-<genre>-<name> --binding /tmp/<name>_binding.json \
      [--description "..."] [--source-name Name]
"""
import argparse
import json
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[4]
SCHEMAS = REPO / "packages/corpuscheck/src/corpuscheck/schemas"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--slug", required=True)
    ap.add_argument("--binding", required=True, help="JSON with modules/bindings/mechanics_exclusions")
    ap.add_argument("--description", default=None)
    ap.add_argument("--source-name", default=None, help="task-sources 'source' key (default: Titlecased name)")
    args = ap.parse_args()

    slug = args.slug
    binding = json.loads(Path(args.binding).expanduser().read_text())
    for key in ("modules", "bindings", "mechanics_exclusions"):
        if key not in binding:
            print(f"ERROR: binding missing '{key}'", file=sys.stderr)
            return 1
    entry = {"task": slug, **{k: binding[k] for k in ("modules", "bindings", "mechanics_exclusions")}}
    name = slug.split("-", 2)[-1]
    source_name = args.source_name or name.replace("_", " ").title().replace(" ", "")
    description = args.description or binding.get("description") or f"{name} good-app eval (seed-converted)."

    # 1. task-sources
    p = SCHEMAS / "webmcp-task-sources.json"
    d = json.loads(p.read_text())
    d[slug] = {"source": source_name, "instruction": f"{source_name}/instruction.md", "description": description}
    p.write_text(json.dumps(d, indent=2, ensure_ascii=False))
    print("  task-sources: registered")

    # 2. assignment-map (list)
    p = SCHEMAS / "webmcp-assignment-map.json"
    d = [x for x in json.loads(p.read_text()) if x.get("task") != slug]
    d.append(entry)
    p.write_text(json.dumps(d, indent=2, ensure_ascii=False))
    print("  assignment-map: registered")

    # 3. compiled assignments (dict with 'assignments' list)
    p = SCHEMAS / "webmcp-assignments.json"
    d = json.loads(p.read_text())
    d["assignments"] = [x for x in d["assignments"] if x.get("task") != slug]
    d["assignments"].append(entry)
    p.write_text(json.dumps(d, indent=1, ensure_ascii=False))
    print("  assignments (compiled): registered")

    print("\nNEXT: `uv run corpuscheck webmcp apply` to render <webmcp_action_contract>")
    return 0


if __name__ == "__main__":
    sys.exit(main())
