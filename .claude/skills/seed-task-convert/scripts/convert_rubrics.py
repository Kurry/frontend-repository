#!/usr/bin/env python3
"""Port a seed task's 8 source rubric dimensions into the new 13-dim shape.

Maps each source dimension to its target, copies the target file's canonical
[judge] header (+ [scoring]) verbatim, and re-emits the source criteria with:
  - id  = the source criterion name (stable provenance, e.g. AG-FUNC-001)
  - name = a snake_case descriptor derived from that id
  - weight normalized to the only allowed values: 0.5 (<1.0) or 1.0 (>=1.0)
  - `optional`/`negate` preserved

It also installs the required `innovation.catchall` positive. It does NOT touch
the foundation dims (motion/responsiveness/performance/design_fidelity) or the
anti-cheat edge_cases from the skeleton — leave those, and hand-add >=1
app-specific POSITIVE criterion to edge_cases (the rubric tier requires one).

Usage:
  convert_rubrics.py --source <src_task>/task/tests --target tasks/<slug>/tests
"""
import argparse
import re
import sys
import tomllib
from pathlib import Path

# source dim file (without .toml) -> target dim
DIM_MAP = [
    ("functional/functional", "core_features"),
    ("design/design", "visual_design"),
    ("ux/ux", "user_flows"),
    ("behavioral/behavioral", "behavioral"),
    ("technical/technical", "technical"),
    ("accessibility/accessibility", "accessibility"),
    ("writing/writing", "writing"),
]


def snake(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", value.lower()).strip("_")


def header(target_file: Path) -> str:
    """Everything before the first [[criterion]] — the canonical judge header."""
    txt = target_file.read_text()
    i = txt.find("[[criterion]]")
    if i < 0:
        return txt.rstrip() + "\n\n"
    return txt[:i].rstrip() + "\n\n"


def emit(crit: dict) -> str:
    cid = crit["name"]  # source uses `name` as the id-like token
    weight = float(crit.get("weight", 1.0))
    if crit.get("optional") and weight > 0.5:
        weight = 0.5
    weight = 1.0 if weight >= 1.0 else 0.5
    desc = crit["description"]
    lines = ["[[criterion]]", f'id = "{cid}"', f'name = "{snake(cid)}"']
    if "\n" in desc or '"' in desc:
        lines.append('description = """' + desc.strip() + '"""')
    else:
        lines.append(f'description = "{desc}"')
    lines.append(f'type = "{crit.get("type", "binary")}"')
    if crit.get("negate"):
        lines.append("negate = true")
    lines.append(f"weight = {weight}")
    return "\n".join(lines) + "\n\n"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--source", required=True, help="<src_task>/task/tests")
    ap.add_argument("--target", required=True, help="tasks/<slug>/tests")
    args = ap.parse_args()
    src = Path(args.source).expanduser()
    tgt = Path(args.target).expanduser()

    for src_rel, target_dim in DIM_MAP:
        src_file = src / f"{src_rel}.toml"
        tgt_file = tgt / target_dim / f"{target_dim}.toml"
        if not src_file.exists():
            print(f"  skip {target_dim}: no source {src_file.name}")
            continue
        if not tgt_file.exists():
            print(f"  WARN {target_dim}: target file missing ({tgt_file})")
            continue
        data = tomllib.loads(src_file.read_text())
        crits = data.get("criterion") or data.get("criteria") or []
        tgt_file.write_text(header(tgt_file) + "".join(emit(c) for c in crits))
        print(f"  {target_dim}: {len(crits)} criteria")

    # innovation.catchall (recognized only by id ending in .catchall)
    inno = tgt / "innovation" / "innovation.toml"
    if inno.exists():
        catchall = (
            '[[criterion]]\n'
            'id = "innovation.catchall"\n'
            'name = "innovation_catchall"\n'
            'description = """The app demonstrates a noteworthy, browser-observable '
            'enhancement beyond the spec that is NOT covered by any other criterion in '
            'this file. The enhancement must plausibly matter to a real user, not be a '
            'nitpick. If present, name the enhancement and cite the concrete evidence '
            '(element, page state, screenshot) that demonstrates it. If the enhancement '
            'is already covered — even partially — by another criterion in this file, '
            'answer no here and let that criterion carry it."""\n'
            'type = "binary"\n'
            'weight = 0.5\n'
        )
        txt = inno.read_text()
        i = txt.find("[[criterion]]")
        inno.write_text((txt[:i].rstrip() + "\n\n" + catchall) if i >= 0 else txt.rstrip() + "\n\n" + catchall)
        print("  innovation: installed innovation.catchall")

    print("\nNEXT: add >=1 app-specific POSITIVE criterion to tests/edge_cases/edge_cases.toml")
    return 0


if __name__ == "__main__":
    sys.exit(main())
