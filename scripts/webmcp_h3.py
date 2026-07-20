#!/usr/bin/env python3
"""Idempotent WebMCP Action Contract XML renderer + migrator for the 23-task corpus.

Modes:
  dry-run  — print planned writes; touch no files
  check    — exit 1 if any target is missing/outdated contract or invalid modules
  apply    — write/replace <webmcp_action_contract> on instruction.md; strip markdown
             WebMCP / Product Requirements from packaged READMEs

Targets:
  1. tasks/frontend-*/instruction.md when packaged Harbor tasks exist
  2. else authoring sources from schemas/webmcp-task-sources.json (instruction.md)

Never edits rubric.json / criterion TOML. Rejects unknown modules and schema fragments.
Assignment JSON remains authoring-only; packaged instruction.md is the sole agent source.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ASSIGNMENTS = ROOT / "schemas" / "webmcp-assignments.json"
SOURCES = ROOT / "schemas" / "webmcp-task-sources.json"
LEGACY_MAP = ROOT / "scripts" / "canonical" / "webmcp-assignment-map.json"
MODULE_SPECS_DIR = ROOT / "packages" / "webmcp-contracts" / "specs" / "modules"

CANONICAL_MODULES = frozenset(
    {
        "browse-query-v1",
        "entity-collection-v1",
        "form-workflow-v1",
        "structured-editor-v1",
        "command-session-v1",
        "artifact-transfer-v1",
    }
)

XML_OPEN = "<webmcp_action_contract>"
XML_CLOSE = "</webmcp_action_contract>"
INTEGRITY_OPEN = "<integrity>"
INTEGRITY_CLOSE = "</integrity>"
DELIVERY_OPEN = "<delivery>"
DELIVERY_CLOSE = "</delivery>"
LEGACY_DELIVERY_HEADING = "## Delivery and integrity"
LEGACY_H3_TITLE = "### WebMCP Action Contract"
PRODUCT_REQ = "## Product Requirements"

IMPLEMENTATION_BULLETS = (
    "- Register browser WebMCP tools for every permitted operation in the selected "
    "module specs, bound to the product values in Bindings.\n"
    "- Tool handlers must call the same application logic as the visible UI.\n"
    "- Do not invent extra modules, destinations, or operations beyond this block.\n"
    "- WebMCP is not graded; missing tools must not create fake UI success paths."
)

# Prefer human labels in the PRD contract; schema keys stay in the assignment JSON.
BINDING_LABELS: dict[str, str] = {
    "browsable_entity": "Browsable entity",
    "entity": "Entity",
    "destinations": "Destinations",
    "filters": "Filters",
    "sorts": "Sorts",
    "locales": "Locales",
    "themes": "Themes",
    "entity_operations": "Entity operations",
    "entity_fields": "Entity fields",
    "form_fields": "Form fields",
    "form_operations": "Form operations",
    "workflow_steps": "Workflow steps",
    "editor_object_types": "Editor object types",
    "editor_properties": "Editor properties",
    "editor_modes": "Editor modes",
    "editor_operations": "Editor operations",
    "session_operations": "Session operations",
    "demos": "Demos",
    "import_modes": "Import modes",
    "export_formats": "Export formats",
    "conversion_modes": "Conversion modes",
    "artifact_operations": "Artifact operations",
    "visible_postconditions": "Workflow completion",
    "value_bounds": "Value bounds",
}

LEGACY_H3_BLOCK_RE = re.compile(
    r"(?:## Product Requirements\n\n)?"
    r"### WebMCP Action Contract\n[\s\S]*?"
    r"(?=\n## |\n</|\Z)"
)

XML_BLOCK_RE = re.compile(
    r"<webmcp_action_contract>\n?[\s\S]*?</webmcp_action_contract>\n?"
)

# Delivery/integrity preamble (optional) + contract — sole agent-facing WebMCP section.
# Matches legacy markdown H2 or current <integrity>/<delivery> XML tags.
INSTRUCTION_WEBMCP_SECTION_RE = re.compile(
    r"(?:"
    r"## Delivery and integrity\n[\s\S]*?\n"
    r"|"
    r"<integrity>\n[\s\S]*?</integrity>\n+"
    r"<delivery>\n[\s\S]*?</delivery>\n+"
    r")?"
    r"<webmcp_action_contract>\n?[\s\S]*?</webmcp_action_contract>\n?"
)

PREAMBLE_STRIP_RE = re.compile(
    r"(?:"
    r"## Delivery and integrity\n[\s\S]*?(?=\n## |\n</|\n<webmcp_action_contract>|\Z)"
    r"|"
    r"<integrity>\n[\s\S]*?</integrity>\n+"
    r"<delivery>\n[\s\S]*?</delivery>\n*"
    r")"
)


def _fmt_binding_value(value: object) -> str:
    if isinstance(value, list):
        return "; ".join(str(v) for v in value)
    if isinstance(value, dict):
        return json.dumps(value, separators=(",", ":"))
    return str(value)


def load_module_spec(module_id: str) -> dict:
    """Load authoring SoT module JSON from packages/webmcp-contracts/specs/modules/."""
    path = MODULE_SPECS_DIR / f"{module_id}.json"
    if not path.is_file():
        raise FileNotFoundError(f"missing module spec: {path}")
    data = json.loads(path.read_text())
    if not isinstance(data, dict):
        raise ValueError(f"{path}: module spec must be a JSON object")
    if data.get("id") != module_id:
        raise ValueError(
            f"{path}: module spec id mismatch: expected {module_id!r}, got {data.get('id')!r}"
        )
    return data


def load_module_spec_text(module_id: str) -> str:
    """Exact JSON text for inlining into <module_spec> (authoring SoT file body)."""
    path = MODULE_SPECS_DIR / f"{module_id}.json"
    # Validate id / JSON before embedding.
    load_module_spec(module_id)
    return path.read_text().rstrip() + "\n"


def render_instruction_preamble() -> str:
    """Compact integrity/delivery/WebMCP language for instruction.md (no Baseline)."""
    return (
        f"{INTEGRITY_OPEN}\n"
        "- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or "
        "verifier artifacts.\n"
        f"{INTEGRITY_CLOSE}\n"
        "\n"
        f"{DELIVERY_OPEN}\n"
        "- Produce an original self-contained app in `/app`; scaffold under `/app` as needed "
        "for the stack in `<summary>`; `/app/package.json` MUST define npm scripts named "
        "exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the "
        "app entry/build is present and succeeds); run via `npm start` on port 3000; do not "
        "iframe, proxy, or fetch the product from another origin.\n"
        "- Before you finish, run `npm run verify:build` and confirm it exits 0, then run "
        "`npm start` and confirm the app serves on port 3000. This is your responsibility: the "
        "verifier runs the same `verify:build` gate first, and an app that fails it is not "
        "served or judged and scores 0 outright — no partial credit for a build that does not "
        "come up.\n"
        "- WebMCP is a required delivery step, not a scoring criterion; implement exactly the "
        "`<webmcp_action_contract>` below; register tools yourself from `<module_spec>` + "
        "Bindings using the same handlers as the visible UI; honor mechanics exclusions; "
        "optional self-test via `webmcp_session_info` / `webmcp_list_tools` / "
        "`webmcp_invoke_tool` only.\n"
        "- Self-test tooling is preinstalled: the same CDP bridge the verifier runs is baked "
        "at `/opt/webmcp/webmcp_stdio_server.mjs`, and a shared headless Chrome already "
        "exposes CDP at `http://127.0.0.1:9222`. Open your served app in that Chrome, then "
        "run `node /opt/webmcp/webmcp_stdio_server.mjs` (stdio MCP; defaults to that "
        "endpoint) to exercise your registered `window.webmcp_*` tools exactly as the "
        "verifier will.\n"
        f"{DELIVERY_CLOSE}\n"
    )


def render_contract(assignment: dict) -> str:
    """Render a self-contained plain-text <webmcp_action_contract> block."""
    modules = assignment["modules"]
    if not 1 <= len(modules) <= 4:
        raise ValueError(f"{assignment.get('task')}: modules must be 1–4")
    unknown = [m for m in modules if m not in CANONICAL_MODULES]
    if unknown:
        raise ValueError(f"{assignment.get('task')}: unknown modules {unknown}")
    if "schema" in assignment or "json_schema" in assignment:
        raise ValueError(f"{assignment.get('task')}: custom schema fragments forbidden")

    bindings = assignment.get("bindings") or {}
    if not isinstance(bindings, dict):
        raise ValueError(f"{assignment.get('task')}: bindings must be an object")
    for key, val in bindings.items():
        if key in {"$schema", "properties", "additionalProperties", "type"}:
            raise ValueError(
                f"{assignment.get('task')}: binding key {key!r} looks like a schema fragment"
            )
        if isinstance(val, dict) and key != "value_bounds":
            raise ValueError(
                f"{assignment.get('task')}: nested object binding {key!r} not allowed"
            )

    module_lines = "\n".join(f"- {m}" for m in modules)
    spec_blocks: list[str] = []
    for module_id in modules:
        spec_text = load_module_spec_text(module_id)
        spec_blocks.append(f'<module_spec id="{module_id}">\n{spec_text}</module_spec>')
    specs_block = "\n\n".join(spec_blocks)

    binding_lines: list[str] = []
    for key, val in bindings.items():
        # TASK_SPECS may already use human labels as keys
        if key in BINDING_LABELS:
            label = BINDING_LABELS[key]
        elif " " in key or key[:1].isupper():
            label = key
        else:
            label = key.replace("_", " ").title()
        if key == "visible_postconditions" and isinstance(val, list):
            for item in val:
                binding_lines.append(f"- {label}: {item}")
            continue
        binding_lines.append(f"- {label}: {_fmt_binding_value(val)}")
    if not binding_lines:
        binding_lines.append("- TODO: product bindings pending module-owner review")

    excl = assignment.get("mechanics_exclusions") or []
    excl_lines = "\n".join(f"- {e}" for e in excl) if excl else "- None"

    return (
        f"{XML_OPEN}\n"
        "Contract version: zto-webmcp-v1\n"
        "\n"
        "Modules:\n"
        f"{module_lines}\n"
        "\n"
        "Module specs:\n"
        f"{specs_block}\n"
        "\n"
        "Bindings:\n"
        f"{chr(10).join(binding_lines)}\n"
        "\n"
        "Mechanics exclusions:\n"
        f"{excl_lines}\n"
        "\n"
        "Implementation:\n"
        f"{IMPLEMENTATION_BULLETS}\n"
        f"{XML_CLOSE}\n"
    )


def render_instruction_webmcp_section(assignment: dict) -> str:
    """Preamble + inlined-spec contract for packaged instruction.md."""
    return render_instruction_preamble() + "\n" + render_contract(assignment)


# Back-compat aliases for callers/tests still using H3 names.
render_h3 = render_contract


def strip_legacy_markdown_webmcp(text: str) -> str:
    """Remove ## Product Requirements / ### WebMCP Action Contract markdown blocks."""
    text = LEGACY_H3_BLOCK_RE.sub("", text)
    text = re.sub(r"\n*## Product Requirements\n+", "\n", text)
    text = re.sub(r"\n*### WebMCP Action Contract\n[\s\S]*?(?=\n## |\n</|\Z)", "\n", text)
    return text


def upsert_contract(text: str, block: str) -> str:
    """Idempotently insert or replace delivery preamble + contract after </requirements>."""
    text = strip_legacy_markdown_webmcp(text)
    block = block.rstrip() + "\n"
    has_preamble = (
        XML_OPEN in text
        or INTEGRITY_OPEN in text
        or DELIVERY_OPEN in text
        or LEGACY_DELIVERY_HEADING in text
    )
    if has_preamble:
        replaced, n = INSTRUCTION_WEBMCP_SECTION_RE.subn(block, text, count=1)
        if n:
            return replaced.rstrip() + "\n"
        # Tag/heading present but regex missed — strip coarsely then append
        text = PREAMBLE_STRIP_RE.sub("", text)
        text = XML_BLOCK_RE.sub("", text)
    if "</requirements>" in text:
        return text.replace("</requirements>", f"</requirements>\n\n{block}", 1).rstrip() + "\n"
    return text.rstrip() + "\n\n" + block


# Back-compat
upsert_h3 = upsert_contract


def load_assignments() -> list[dict]:
    map_path = ROOT / "schemas" / "webmcp-assignment-map.json"
    if map_path.exists():
        data = json.loads(map_path.read_text())
        if isinstance(data, list):
            return data
        return list(data["assignments"])
    if ASSIGNMENTS.exists():
        data = json.loads(ASSIGNMENTS.read_text())
        return list(data["assignments"])
    if LEGACY_MAP.exists():
        return json.loads(LEGACY_MAP.read_text())
    raise FileNotFoundError("missing assignment map under schemas/ or scripts/canonical/")


def load_sources() -> dict[str, dict]:
    if SOURCES.exists():
        return json.loads(SOURCES.read_text())
    if LEGACY_MAP.exists():
        out: dict[str, dict] = {}
        for entry in json.loads(LEGACY_MAP.read_text()):
            src = entry.get("source", "")
            out[entry["task"]] = {
                "source": src,
                "instruction": f"{src}/instruction.md",
            }
        return out
    return {}


def resolve_instruction_target(assignment: dict, sources: dict[str, dict]) -> Path | None:
    """Prefer packaged Harbor instruction.md; else authoring instruction.md."""
    slug = assignment["task"]
    packaged = ROOT / "tasks" / slug / "instruction.md"
    if packaged.exists():
        return packaged
    src_meta = sources.get(slug) or {}
    instr = src_meta.get("instruction")
    if instr:
        p = ROOT / instr
        if p.exists():
            return p
    return None


def resolve_readme_target(assignment: dict) -> Path | None:
    slug = assignment["task"]
    readme = ROOT / "tasks" / slug / "README.md"
    return readme if readme.exists() else None


def contract_matches(text: str, expected: str) -> bool:
    if XML_OPEN not in text or XML_CLOSE not in text:
        return False
    if LEGACY_H3_TITLE in text or PRODUCT_REQ in text:
        return False
    if "<module_spec" not in text or "Implementation:" not in text:
        return False
    if "Baseline Quality Bar" in text or "/opt/webmcp-contracts" in text:
        return False
    if INTEGRITY_OPEN not in text or DELIVERY_OPEN not in text:
        return False
    if LEGACY_DELIVERY_HEADING in text:
        return False
    for line in expected.splitlines():
        if line.startswith("- ") and not line.startswith("- TODO"):
            if line not in text:
                return False
    if "Contract version: zto-webmcp-v1" not in text:
        return False
    return True


def run(mode: str) -> int:
    assignments = load_assignments()
    sources = load_sources()
    errors: list[str] = []
    pending = 0
    applied = 0
    ok = 0

    for assignment in assignments:
        slug = assignment["task"]
        try:
            section = render_instruction_webmcp_section(assignment)
        except (ValueError, FileNotFoundError) as exc:
            errors.append(str(exc))
            continue

        instr_path = resolve_instruction_target(assignment, sources)
        if instr_path is None:
            pending += 1
            print(f"[pending] {slug}: no packaged task or source instruction")
            continue

        readme_path = resolve_readme_target(assignment)
        slug_ok = True

        current = instr_path.read_text()
        updated = upsert_contract(current, section)
        matched = contract_matches(current, section)

        if mode == "check":
            if matched:
                print(f"[ok] {slug} -> {instr_path.relative_to(ROOT)}")
            else:
                slug_ok = False
                errors.append(f"{slug}: webmcp_action_contract missing or stale at {instr_path}")
                print(f"[fail] {slug} -> {instr_path.relative_to(ROOT)}")
            if readme_path is not None:
                readme = readme_path.read_text()
                if LEGACY_H3_TITLE in readme or PRODUCT_REQ in readme or XML_OPEN in readme:
                    slug_ok = False
                    errors.append(f"{slug}: README still contains WebMCP/Product Requirements")
                    print(f"[fail] {slug} -> {readme_path.relative_to(ROOT)} (webmcp still present)")
        elif mode == "dry-run":
            action = "noop" if current == updated else "would-write"
            print(f"[{action}] {slug} -> {instr_path.relative_to(ROOT)}")
            if current != updated:
                slug_ok = False
            if readme_path is not None:
                readme = readme_path.read_text()
                stripped = strip_legacy_markdown_webmcp(readme)
                stripped = XML_BLOCK_RE.sub("", stripped).rstrip() + "\n"
                if readme != stripped and (
                    LEGACY_H3_TITLE in readme or PRODUCT_REQ in readme or XML_OPEN in readme
                ):
                    print(f"[would-strip] {slug} -> {readme_path.relative_to(ROOT)}")
                    slug_ok = False
        else:
            # apply
            if current != updated:
                instr_path.write_text(updated)
                applied += 1
                slug_ok = False
                print(f"[applied] {slug} -> {instr_path.relative_to(ROOT)}")
            else:
                print(f"[unchanged] {slug} -> {instr_path.relative_to(ROOT)}")
            if readme_path is not None:
                readme = readme_path.read_text()
                stripped = strip_legacy_markdown_webmcp(readme)
                stripped = XML_BLOCK_RE.sub("", stripped)
                stripped = re.sub(r"\n{3,}", "\n\n", stripped).rstrip() + "\n"
                if readme != stripped:
                    readme_path.write_text(stripped)
                    applied += 1
                    print(f"[stripped] {slug} -> {readme_path.relative_to(ROOT)}")

        if slug_ok:
            ok += 1
        elif mode == "dry-run":
            pending += 1

    print(
        f"\nsummary mode={mode} assignments={len(assignments)} "
        f"ok={ok} applied={applied} pending={pending} errors={len(errors)}"
    )
    if errors:
        for e in errors:
            print(f"ERROR: {e}", file=sys.stderr)
        return 1
    if mode == "check" and pending:
        return 1
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "mode",
        choices=("dry-run", "check", "apply"),
        help="dry-run | check | apply",
    )
    args = parser.parse_args()
    return run(args.mode)


if __name__ == "__main__":
    raise SystemExit(main())
