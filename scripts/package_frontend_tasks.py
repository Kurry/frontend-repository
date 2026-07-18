#!/usr/bin/env python3
"""Package frontend-repository authoring folders into Harbor Reward Kit tasks."""

from __future__ import annotations

import json
import re
import shutil
import sys
import textwrap
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TASKS = ROOT / "tasks"
sys.path.insert(0, str(TASKS))
sys.path.insert(0, str(ROOT / "scripts"))
from _pins import HARBOR_REWARDKIT_PACKAGE  # noqa: E402
import webmcp_h3  # noqa: E402

# slug -> (source relative path, description, webmcp assignment)
TASK_SPECS: dict[str, dict] = {
    "frontend-daisyui-admin-dashboard": {
        "source": "DaisyUI",
        "description": "DaisyUI admin user-management dashboard good-app eval.",
        "modules": ["browse-query-v1", "entity-collection-v1", "form-workflow-v1"],
        "bindings": {
            "Browsable entity": "Users collection and Operations Overview",
            "Destinations": "Operations Overview; All Users; Add User; Roles; Permissions; User Logs; User Stats; User Payments; User Products",
            "Entity operations": "create, select, update, delete, bulk status/role change, filter, sort",
            "Workflow completion": "Create user form validates and commits a new user row",
            "Entity fields": "name, email, role, status (Active|Invited|Suspended), payments, products, last-active",
        },
        "mechanics_exclusions": [
            "Chart hover/tooltip mechanics stay Playwright-only",
            "Drawer overlay slide on small viewports stays Playwright-observed",
        ],
    },
    "frontend-daisyui-theme-generator": {
        "source": "DaisyUI/theme-generator",
        "description": "daisyUI theme generator good-app eval.",
        "modules": ["structured-editor-v1", "entity-collection-v1", "artifact-transfer-v1"],
        "bindings": {
            "Browsable entity": "Theme presets and CSS variables",
            "Destinations": "Themes list; Theme editor; Live preview",
            "Entity operations": "create/select/update/delete theme; update declared CSS variable properties",
            "Editor objects": "theme document with declared color/radius/font tokens",
            "Artifact operations": "export theme CSS / copy serialized theme; import declared theme mode",
        },
        "mechanics_exclusions": [
            "Raw file path / base64 blobs must not appear in WebMCP args",
            "Color-picker drag gestures stay Playwright when mechanism matters",
        ],
    },
    "frontend-camera-exposure": {
        "source": "CameraExposure",
        "description": "Camera exposure simulator good-app eval.",
        "modules": ["command-session-v1", "structured-editor-v1"],
        "bindings": {
            "Session operations": "adjust exposure stops; reset; toggle help panel",
            "Editor objects": "exposure stop state mapped to preview image/brightness",
            "Destinations": "Main simulator canvas; Help panel",
        },
        "mechanics_exclusions": [
            "Continuous hold-to-repeat on edge buttons stays Playwright-observed",
        ],
    },
    "frontend-design-portfolio": {
        "source": "DesignPortfolio",
        "description": "CLI terminal product designer portfolio good-app eval.",
        "modules": ["browse-query-v1", "entity-collection-v1"],
        "bindings": {
            "Browsable entity": "Portfolio projects / case studies",
            "Destinations": "Terminal home; Project detail; About/contact views",
            "Entity operations": "select project; update portfolio entries; create/delete case notes when offered",
        },
        "mechanics_exclusions": ["Terminal typing animation timing stays Playwright-observed"],
    },
    "frontend-finance-reports": {
        "source": "FinanceReports",
        "description": "Personal finance reports page good-app eval.",
        "modules": ["browse-query-v1", "entity-collection-v1"],
        "bindings": {
            "Browsable entity": "Expense / report records",
            "Destinations": "Reports overview; Category breakdown; Transaction list",
            "Entity operations": "create, update, delete expenses; apply/clear filters; sort",
        },
        "mechanics_exclusions": ["Chart geometry / pie segment hover stays Playwright-observed"],
    },
    "frontend-material-ui-theme-creator": {
        "source": "MaterialUI",
        "description": "Material UI theme creator good-app eval.",
        "modules": ["structured-editor-v1", "entity-collection-v1", "artifact-transfer-v1"],
        "bindings": {
            "Editor objects": "Material theme with declared palette/typography/shape properties",
            "Destinations": "Theme editor; Component preview; Saved themes",
            "Entity operations": "create/select/update/delete theme presets; update declared properties",
            "Artifact operations": "export theme JSON/CSS; copy; declared import mode",
        },
        "mechanics_exclusions": [
            "Raw file paths/blobs forbidden in WebMCP args",
            "Color picker drag stays Playwright when mechanism matters",
        ],
    },
    "frontend-media-timeline": {
        "source": "MediaTimeline",
        "description": "Media history timeline explorer good-app eval.",
        "modules": ["browse-query-v1", "entity-collection-v1"],
        "bindings": {
            "Browsable entity": "Timeline media events",
            "Destinations": "Timeline view; Event detail; Filter panel",
            "Entity operations": "create/update/delete events; filter by era/type; select event",
        },
        "mechanics_exclusions": ["Scroll-linked parallax / scrub timing stays Playwright-observed"],
    },
    "frontend-palette-library": {
        "source": "PaletteLibrary",
        "description": "Fine-art color palette library good-app eval.",
        "modules": ["browse-query-v1", "entity-collection-v1"],
        "bindings": {
            "Browsable entity": "Color palettes",
            "Destinations": "Library grid; Palette detail; Search/filter",
            "Entity operations": "create/update/delete palettes; toggle favorites; search/filter",
        },
        "mechanics_exclusions": ["Scroll reveal / hover wash timing stays Playwright-observed"],
    },
    "frontend-shapeshift-grid": {
        "source": "Shapeshift",
        "description": "SHAPESHIFT QR color grid painter good-app eval.",
        "modules": ["structured-editor-v1", "command-session-v1"],
        "bindings": {
            "Editor objects": "QR color grid cells with declared color enum",
            "Editor operations": "select cell; set color; clear; switch tool/mode; refresh preview",
            "Session operations": "start/reset painting session; trigger demo fill when offered",
        },
        "mechanics_exclusions": [
            "Drag-paint / brush stroke geometry stays Playwright (gesture mechanics)",
        ],
    },
    "frontend-story-docs": {
        "source": "StoryDocs",
        "description": "Storyboard getting-started tutorial good-app eval.",
        "modules": ["browse-query-v1", "form-workflow-v1", "entity-collection-v1"],
        "bindings": {
            "Browsable entity": "Tutorial scenes / storyboard frames",
            "Destinations": "Scene list; Scene detail; Getting-started steps",
            "Entity operations": "create/update/delete scenes; reorder when offered",
            "Workflow completion": "Advance/return tutorial steps; validate scene form fields",
        },
        "mechanics_exclusions": [],
    },
    "frontend-trip-itinerary": {
        "source": "TripItinerary",
        "description": "French Riviera trip itinerary planner good-app eval.",
        "modules": ["browse-query-v1", "entity-collection-v1", "form-workflow-v1"],
        "bindings": {
            "Browsable entity": "Itinerary days and activities",
            "Destinations": "Map/itinerary overview; Day detail; Activity form",
            "Entity operations": "create/update/delete activities; move between days; filter",
            "Workflow completion": "Activity form validate/submit/cancel",
        },
        "mechanics_exclusions": ["Map pan/zoom / marker drag stays Playwright"],
    },
    "frontend-admin-analytics-dashboard": {
        "source": "variants/AdminAnalyticsDashboard",
        "description": "Commerce ops admin analytics dashboard variant.",
        "modules": ["browse-query-v1", "entity-collection-v1"],
        "bindings": {
            "Browsable entity": "Users",
            "Destinations": "Operations Overview; All Users; Add User; Roles; Permissions; User Logs; User Stats; User Payments; User Products",
            "Filters": "role; status",
            "Sorts": "last-active; newest; highest-spend; name-az",
            "Entity operations": "create; select; update; delete",
            "Entity fields": "name; email; role; status; payments; products; last-active",
        },
        "mechanics_exclusions": ["Chart hover tooling stays Playwright-observed"],
    },
    "frontend-color-palette-archive": {
        "source": "variants/ColorPaletteArchive",
        "description": "Fine-art color palette archive variant.",
        "modules": ["browse-query-v1", "entity-collection-v1"],
        "bindings": {
            "Browsable entity": "Archived palettes",
            "Destinations": "Archive grid; Palette detail; Filters",
            "Entity operations": "create/update/delete palettes; search; filter; toggle",
        },
        "mechanics_exclusions": [],
    },
    "frontend-css-theme-builder": {
        "source": "variants/CssThemeBuilder",
        "description": "CSS theme builder variant.",
        "modules": ["structured-editor-v1", "entity-collection-v1", "artifact-transfer-v1"],
        "bindings": {
            "Editor objects": "CSS theme tokens",
            "Destinations": "Token editor; Preview; Saved themes",
            "Entity operations": "create/select/update/delete themes; update declared properties",
            "Artifact operations": "export CSS; copy; declared import",
        },
        "mechanics_exclusions": ["Raw file paths/blobs forbidden in WebMCP args"],
    },
    "frontend-expense-breakdown-reports": {
        "source": "variants/ExpenseBreakdownReports",
        "description": "Personal finance expense breakdown reports variant.",
        "modules": ["browse-query-v1", "entity-collection-v1"],
        "bindings": {
            "Browsable entity": "Expenses",
            "Destinations": "Breakdown overview; Expense list; Category filter",
            "Entity operations": "create/update/delete expenses; filter; sort",
        },
        "mechanics_exclusions": ["Chart hover stays Playwright-observed"],
    },
    "frontend-exposure-control-lab": {
        "source": "variants/ExposureControlLab",
        "description": "Camera exposure control lab variant.",
        "modules": ["command-session-v1", "structured-editor-v1"],
        "bindings": {
            "Session operations": "adjust exposure; reset; toggle help",
            "Editor objects": "exposure controls mapped to preview",
            "Destinations": "Lab canvas; Help panel",
        },
        "mechanics_exclusions": ["Hold-to-repeat control timing stays Playwright-observed"],
    },
    "frontend-grid-paint-studio": {
        "source": "variants/GridPaintStudio",
        "description": "QR color grid paint studio variant.",
        "modules": ["structured-editor-v1", "command-session-v1"],
        "bindings": {
            "Editor objects": "Grid cells with declared colors",
            "Editor operations": "select cell; set color; clear; switch mode; refresh preview",
            "Session operations": "start/reset painting session",
        },
        "mechanics_exclusions": ["Drag-paint gestures stay Playwright"],
    },
    "frontend-l1-network-marketing": {
        "source": "variants/L1NetworkMarketing",
        "description": "Layer-1 blockchain network marketing site good-app eval.",
        "modules": ["browse-query-v1", "form-workflow-v1", "entity-collection-v1"],
        "bindings": {
            "Browsable entity": "Network features / waitlist entries",
            "Destinations": "Marketing sections; Feature detail; Waitlist/signup form",
            "Entity operations": "create/update/delete feature cards or waitlist rows when offered",
            "Workflow completion": "Waitlist/contact form validate/submit/cancel",
        },
        "mechanics_exclusions": ["Outbound marketing CTAs must remain in-app (no origin navigation)"],
    },
    "frontend-material-theme-studio": {
        "source": "variants/MaterialThemeStudio",
        "description": "Material theme design studio variant.",
        "modules": ["structured-editor-v1", "entity-collection-v1", "artifact-transfer-v1"],
        "bindings": {
            "Editor objects": "Material theme tokens",
            "Destinations": "Studio editor; Preview; Saved themes",
            "Entity operations": "create/select/update/delete themes; update properties",
            "Artifact operations": "export/copy/import declared theme formats",
        },
        "mechanics_exclusions": ["Raw file paths/blobs forbidden in WebMCP args"],
    },
    "frontend-media-history-timeline": {
        "source": "variants/MediaHistoryTimeline",
        "description": "Media history timeline explorer variant.",
        "modules": ["browse-query-v1", "entity-collection-v1"],
        "bindings": {
            "Browsable entity": "Timeline events",
            "Destinations": "Timeline; Event detail; Filters",
            "Entity operations": "create/update/delete events; filter; select",
        },
        "mechanics_exclusions": ["Scroll/scrub timing stays Playwright-observed"],
    },
    "frontend-storyboard-tutorial": {
        "source": "variants/StoryboardTutorial",
        "description": "Storyboard getting-started tutorial variant.",
        "modules": ["browse-query-v1", "form-workflow-v1", "entity-collection-v1"],
        "bindings": {
            "Browsable entity": "Tutorial scenes",
            "Destinations": "Scene list; Scene editor; Tutorial steps",
            "Entity operations": "create/update/delete scenes",
            "Workflow completion": "Advance/return steps; validate scene form",
        },
        "mechanics_exclusions": [],
    },
    "frontend-terminal-portfolio": {
        "source": "variants/TerminalPortfolio",
        "description": "CLI terminal product designer portfolio variant.",
        "modules": ["browse-query-v1", "entity-collection-v1"],
        "bindings": {
            "Browsable entity": "Portfolio projects",
            "Destinations": "Terminal home; Project detail; About",
            "Entity operations": "select/update projects; create/delete notes when offered",
        },
        "mechanics_exclusions": ["Terminal typing animation timing stays Playwright-observed"],
    },
    "frontend-travel-itinerary-planner": {
        "source": "variants/TravelItineraryPlanner",
        "description": "French Riviera trip itinerary planner variant.",
        "modules": ["browse-query-v1", "entity-collection-v1", "form-workflow-v1"],
        "bindings": {
            "Browsable entity": "Itinerary activities",
            "Destinations": "Overview; Day detail; Activity form",
            "Entity operations": "create/update/delete/move activities; filter",
            "Workflow completion": "Activity form validate/submit/cancel",
        },
        "mechanics_exclusions": ["Map pan/zoom / marker drag stays Playwright"],
    },
}

CRITERION_MAP = {
    "Core Features": "core_features",
    "Visual Design": "visual_design",
    "Motion": "motion",
    "Technical Implementation": "technical",
}

SKIP_NAMES = {
    "instruction.md",
    "rubric.json",
    "verifier_checklist.json",
    "README.md",
    "rubric.md",
    "build_capture.py",
    "generate_scenes.py",
    ".DS_Store",
}
SKIP_PREFIXES = ("_source-capture",)
SKIP_DIRS = {
    "__pycache__",
    "theme-generator",  # nested task; only when packaging DaisyUI parent
    ".git",
    ".cursor",
}


_LEGACY_WEBMCP_MD_RE = re.compile(
    r"(?:## Product Requirements\n\n)?"
    r"### WebMCP Action Contract\n[\s\S]*?"
    r"(?=\n## |\n</|\Z)"
)
_XML_WEBMCP_RE = re.compile(
    r"(?:## Delivery and integrity\n[\s\S]*?\n)?"
    r"<webmcp_action_contract>\n?[\s\S]*?</webmcp_action_contract>\n?"
)


def _strip_webmcp_from_readme(text: str) -> str:
    """Packaged README must not duplicate the agent-facing WebMCP contract."""
    text = _LEGACY_WEBMCP_MD_RE.sub("", text)
    text = re.sub(r"\n*## Product Requirements\n+", "\n", text)
    text = _XML_WEBMCP_RE.sub("", text)
    text = re.sub(r"\n*## Delivery and integrity\n[\s\S]*?(?=\n## |\Z)", "\n", text)
    return re.sub(r"\n{3,}", "\n\n", text).rstrip() + "\n"


def attach_webmcp(
    readme_text: str | None, instruction_text: str, section: str
) -> tuple[str | None, str]:
    """Return (readme_or_none, instruction) with preamble+contract on instruction only.

    Harbor agents receive instruction.md as the sole product/WebMCP source of truth.
    Packaged READMEs must not duplicate the contract.
    """
    instruction_text = webmcp_h3.upsert_contract(instruction_text, section)
    if readme_text is not None:
        readme_text = _strip_webmcp_from_readme(readme_text)
    return readme_text, instruction_text


def assignment_for_slug(slug: str) -> dict:
    """Authoring assignment (modules/bindings) for a packaged task slug."""
    for entry in webmcp_h3.load_assignments():
        if entry["task"] == slug:
            return entry
    # Fall back to TASK_SPECS when schemas are absent (dev-only).
    spec = TASK_SPECS[slug]
    return {
        "task": slug,
        "modules": spec["modules"],
        "bindings": spec["bindings"],
        "mechanics_exclusions": spec.get("mechanics_exclusions") or [],
    }


def judge_mcp_servers_block() -> str:
    """Inline Stagehand WebMCP + Playwright CDP from canonical fragment."""
    path = ROOT / "scripts" / "canonical" / "mcp" / "reward_mcp_servers.toml"
    text = path.read_text()
    idx = text.find("[[judge.mcp_servers]]")
    if idx < 0:
        raise ValueError("canonical reward_mcp_servers.toml missing [[judge.mcp_servers]]")
    return text[idx:].rstrip() + "\n"


def toml_escape(s: str) -> str:
    return s.replace("\\", "\\\\").replace('"', '\\"')


def checklist_criterion_id(item_id: str | int) -> str:
    """Stable judge criterion id for a verifier_checklist.json item."""
    return f"checklist-{item_id}"


def checklist_criterion_name(item_id: str | int) -> str:
    """Criterion.name must match ^[a-zA-Z0-9_-]{1,64}$."""
    return f"checklist_{item_id}"


def emit_criterion_lines(
    lines: list[str],
    *,
    cid: str,
    name: str,
    description: str,
    weight: float = 1.0,
    negate: bool = False,
    optional: bool = False,
) -> None:
    lines.append("[[criterion]]")
    lines.append(f'id = "{toml_escape(cid)}"')
    lines.append(f'name = "{toml_escape(name)}"')
    lines.append(f'description = "{toml_escape(description)}"')
    lines.append('type = "binary"')
    lines.append(f"weight = {weight}")
    if negate:
        lines.append("negate = true")
    if optional:
        lines.append("optional = true")
    lines.append("")


def append_checklist_criteria(lines: list[str], checklist: list[dict]) -> list[str]:
    """Append one positive HLI [[criterion]] per verifier_checklist.json item."""
    emitted: list[str] = []
    for item in checklist:
        if "id" not in item or "title" not in item:
            raise ValueError(f"checklist item missing id/title: {item!r}")
        cid = checklist_criterion_id(item["id"])
        emit_criterion_lines(
            lines,
            cid=cid,
            name=checklist_criterion_name(item["id"]),
            description=item["title"],
            weight=1.0,
        )
        emitted.append(cid)
    return emitted


def rubric_to_tomls(
    rubric: list[dict], checklist: list[dict] | None = None
) -> dict[str, str]:
    """Emit judge-only dimension TOMLs covering every rubric HLI (no programmatic checks).

    Core Features also expands authoring verifier_checklist.json into one
    [[criterion]] per checklist item (ids checklist-{{id}}), in addition to
    rubric HLIs (including any aggregate checklist-pass row).
    """
    by_dim: dict[str, list[dict]] = {v: [] for v in CRITERION_MAP.values()}
    for item in rubric:
        crit = item["annotations"]["criterion"]
        if crit not in CRITERION_MAP:
            raise ValueError(f"unknown rubric criterion {crit!r} for id={item.get('id')!r}")
        dim = CRITERION_MAP[crit]
        by_dim[dim].append(item)

    checklist = checklist or []
    mcp_block = judge_mcp_servers_block().rstrip()
    out: dict[str, str] = {}
    checklist_ids: list[str] = []
    for dim, items in by_dim.items():
        lines = [
            "[judge]",
            'judge = "claude-code"',
            'prompt_template = "../system_prompt.md"',
            'cwd = "/app"',
            'mode = "batched"',
            "timeout = 3000",
            "",
            mcp_block,
            "",
            "[scoring]",
            'aggregation = "weighted_mean"',
            "",
        ]
        for item in items:
            ann = item["annotations"]
            is_neg = "negative" in ann["type"].lower()
            optional = "nice" in ann.get("importance", "").lower()
            weight = 0.5 if optional else 1.0
            cid = item["id"]
            # Criterion.name must match ^[a-zA-Z0-9_-]{1,64}$ — use id with underscores
            safe_name = cid.replace(".", "_")
            emit_criterion_lines(
                lines,
                cid=cid,
                name=safe_name,
                description=item["title"],
                weight=weight,
                negate=is_neg,
                optional=optional,
            )
        if dim == "core_features" and checklist:
            checklist_ids = append_checklist_criteria(lines, checklist)
        out[dim] = "\n".join(lines)

    # Fail fast if any rubric HLI was dropped (empty dims still get a header-only TOML).
    # Checklist-derived criteria are expected extras on core_features only.
    emitted_ids: list[str] = []
    for body in out.values():
        emitted_ids.extend(re.findall(r'^id\s*=\s*"([^"]+)"', body, re.M))
    rubric_ids = [item["id"] for item in rubric]
    expected_ids = set(rubric_ids) | set(checklist_ids)
    if len(emitted_ids) != len(expected_ids) or set(emitted_ids) != expected_ids:
        missing = sorted(expected_ids - set(emitted_ids))
        extra = sorted(set(emitted_ids) - expected_ids)
        raise ValueError(
            f"rubric/checklist→TOML criterion mismatch: rubric={len(rubric_ids)} "
            f"checklist={len(checklist_ids)} toml={len(emitted_ids)} "
            f"missing={missing} extra={extra}"
        )
    if checklist and not checklist_ids:
        raise ValueError("verifier_checklist.json provided but no checklist criteria emitted")
    return out


def verify_polarity(rubric: list[dict]) -> list[str]:
    errors: list[str] = []
    for label, dim in CRITERION_MAP.items():
        items = [i for i in rubric if i["annotations"]["criterion"] == label]
        pos = sum(1 for i in items if "negative" not in i["annotations"]["type"].lower())
        neg = sum(1 for i in items if "negative" in i["annotations"]["type"].lower())
        if pos < 1 or neg < 1:
            errors.append(f"{dim}: pos={pos} neg={neg}")
    return errors


def write_dimension_tomls(
    task_dir: Path, rubric: list[dict], checklist: list[dict] | None = None
) -> None:
    """Write judge [[criterion]] TOMLs for every rubric HLI (+ checklist) into task_dir/tests/."""
    for dim in CRITERION_MAP.values():
        (task_dir / "tests" / dim).mkdir(parents=True, exist_ok=True)
    for dim, body in rubric_to_tomls(rubric, checklist=checklist).items():
        (task_dir / "tests" / dim / f"{dim}.toml").write_text(body)


def authoring_source_dir(slug: str) -> Path:
    """Resolve authoring-folder path for a packaged task slug."""
    sources_path = ROOT / "schemas" / "webmcp-task-sources.json"
    if sources_path.is_file():
        sources = json.loads(sources_path.read_text())
        entry = sources.get(slug)
        if entry and entry.get("source"):
            return ROOT / entry["source"]
    return ROOT / TASK_SPECS[slug]["source"]


def authoring_rubric_path(slug: str) -> Path:
    """Resolve authoring-folder rubric.json for a packaged task slug.

    Prefer schemas/webmcp-task-sources.json source paths; fall back to TASK_SPECS.
    Packaged tasks/frontend-* trees do not keep a copy of rubric.json.
    """
    return authoring_source_dir(slug) / "rubric.json"


def authoring_checklist_path(slug: str) -> Path:
    """Resolve authoring-folder verifier_checklist.json for a packaged task slug."""
    return authoring_source_dir(slug) / "verifier_checklist.json"


def load_authoring_checklist(slug: str) -> list[dict]:
    """Load authoring-folder verifier_checklist.json; empty list only when absent.

    Packaged tasks/frontend-* trees do not keep a copy — checklist items are
    emitted into tests/core_features/core_features.toml as checklist-* criteria.
    """
    path = authoring_checklist_path(slug)
    if not path.is_file():
        return []
    data = json.loads(path.read_text())
    if not isinstance(data, list):
        raise ValueError(f"{path}: expected JSON array of checklist items")
    return data


def sync_criteria_from_task_rubrics() -> dict[str, list[str]]:
    """Rewrite dimension TOMLs from authoring rubric.json + verifier_checklist.json."""
    errors: dict[str, list[str]] = {}
    for slug in sorted(TASK_SPECS):
        task_dir = TASKS / slug
        rubric_path = authoring_rubric_path(slug)
        if not rubric_path.is_file():
            errors[slug] = [f"missing authoring rubric {rubric_path}"]
            continue
        rubric = json.loads(rubric_path.read_text())
        pol = verify_polarity(rubric)
        if pol:
            errors[slug] = [f"polarity fail: {pol}"]
            continue
        try:
            checklist = load_authoring_checklist(slug)
            if not checklist:
                errors[slug] = [f"missing authoring checklist {authoring_checklist_path(slug)}"]
                continue
            write_dimension_tomls(task_dir, rubric, checklist=checklist)
        except ValueError as exc:
            errors[slug] = [str(exc)]
    return errors


def verify_task_criteria_coverage(task_dir: Path, *, slug: str | None = None) -> list[str]:
    """Assert rubric HLIs + checklist items match tests/*/[[criterion]]."""
    errors: list[str] = []
    task_slug = slug or task_dir.name
    if task_slug not in TASK_SPECS:
        return [f"unknown task slug {task_slug}"]
    rubric_path = authoring_rubric_path(task_slug)
    if not rubric_path.is_file():
        return [f"missing authoring rubric {rubric_path}"]
    rubric = json.loads(rubric_path.read_text())
    try:
        checklist = load_authoring_checklist(task_slug)
    except ValueError as exc:
        return [str(exc)]
    if not checklist:
        return [f"missing authoring checklist {authoring_checklist_path(task_slug)}"]
    expected_ids = {item["id"] for item in rubric} | {
        checklist_criterion_id(item["id"]) for item in checklist
    }
    toml_ids: set[str] = set()
    for dim in CRITERION_MAP.values():
        toml_path = task_dir / "tests" / dim / f"{dim}.toml"
        if not toml_path.is_file():
            errors.append(f"missing {toml_path.relative_to(task_dir)}")
            continue
        text = toml_path.read_text()
        blocks = text.split("[[criterion]]")[1:]
        pos = neg = 0
        for block in blocks:
            mid = re.search(r'^id\s*=\s*"([^"]+)"', block, re.M)
            if mid:
                toml_ids.add(mid.group(1))
            if re.search(r"^\s*negate\s*=\s*true", block, re.M):
                neg += 1
            else:
                pos += 1
        if pos < 1 or neg < 1:
            errors.append(f"{dim} polarity +{pos} -{neg}")
    cf_text = (task_dir / "tests" / "core_features" / "core_features.toml").read_text()
    for item in checklist:
        cid = checklist_criterion_id(item["id"])
        if f'id = "{cid}"' not in cf_text:
            errors.append(f"core_features missing checklist criterion {cid}")
        elif item["title"] not in cf_text:
            errors.append(f"core_features checklist {cid} title mismatch")
    if len(toml_ids) != len(expected_ids) or toml_ids != expected_ids:
        errors.append(
            f"criterion coverage expected={len(expected_ids)} toml={len(toml_ids)} "
            f"missing={sorted(expected_ids - toml_ids)} extra={sorted(toml_ids - expected_ids)}"
        )
    return errors


JUDGE_SYSTEM_PROMPT = textwrap.dedent(
    """\
    A web app is running at http://localhost:3000. Grade it ONLY by what you observe in a real
    browser via the Playwright MCP browser (already present) — do NOT read or rely on the
    source code.

    What you are grading: the app under test was rebuilt from scratch by an agent that could
    only observe an opaque reference application through its browser UI. That reference
    application is NOT available during grading — do not look for it, and do not treat its
    absence as missing evidence. Each criterion below encodes behavior that was observed in
    the reference; the criterion text is the full specification. Grade the rebuilt app
    against the criterion text alone.

    Behavioral equivalence (implementation-agnostic grading): judge only externally
    observable behavior in the browser. Never penalize internal structure, code
    organization, or chosen component patterns; never penalize divergence from any imagined
    "original" beyond what the criterion states; and never demand pixel-perfection a
    criterion does not ask for. Do not penalize harmless differences in decorative copy,
    placeholder imagery, icon glyphs, minor spacing, or debranded names/logos unless the
    criterion makes those exact details material.

    PASS rule (applies to every criterion, so individual criteria need not repeat it): Score a
    criterion "yes" ONLY if you directly observe it fully satisfied in the browser; when unsure
    or unable to observe it, score "no".

    Negated criteria (phrased as a bad condition to detect): "satisfied" means the described
    bad condition IS present. Answer "yes" only if you directly observed that condition;
    answer "no" if you did not find it. Before finalizing a negated criterion's answer,
    re-read the reasoning you just wrote and confirm the yes/no matches that reasoning —
    if your reasoning concludes the app is clean of the described condition, the answer is
    "no", never "yes".

    Render gate: if the app fails to serve, renders a blank or error page, or is so broken
    that NO meaningful UI can be reached at all, score EVERY criterion "no". A crash confined
    to one workflow does not zero unrelated criteria you already observed working.

    How to grade reliably:
    1. `browser_navigate` to http://localhost:3000, wait for load, then `browser_snapshot`.
    2. Interact with `browser_click` / `browser_type`; take a fresh snapshot after changes.
    3. Prefer `browser_evaluate` for objective DOM/style checks.
    4. Screenshot decisive end states per criterion.
    5. Reset shared session state when a criterion needs a fresh start.

    WebMCP tools (when registered via Stagehand list/invoke): may accelerate actions
    declared in the instruction's <webmcp_action_contract>, but NEVER replace visible
    Playwright browser evidence and NEVER affect scoring — there is no WebMCP criterion.
    If WebMCP is missing or fails, fall back to Playwright; that is not a scoring failure.

    {criteria}
    """
)

DOCKERFILE = textwrap.dedent(
    """\
    FROM mcr.microsoft.com/playwright:v1.61.0-noble
    ENV DEBIAN_FRONTEND=noninteractive

    RUN curl -LsSf https://astral.sh/uv/install.sh | sh \\
     && install -m 0755 /root/.local/bin/uv /usr/local/bin/uv \\
     && install -m 0755 /root/.local/bin/uvx /usr/local/bin/uvx

    RUN apt-get update && apt-get install -y --no-install-recommends build-essential \\
     && rm -rf /var/lib/apt/lists/*

    RUN npm install -g \\
          @anthropic-ai/claude-code@2.1.183 \\
          serve@14.2.4

    WORKDIR /app
    EXPOSE 3000
    """
)

TEST_SH = textwrap.dedent(
    f"""\
    #!/usr/bin/env bash
    set -u
    mkdir -p /logs/verifier
    echo '{{"reward": 0.0}}' > /logs/verifier/reward.json

    # Test-only deps (pins: tasks/_pins.py). Not baked into the image.
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm install -g \\
      start-server-and-test@3.0.11 \\
      playwright@1.61.0
    npx -y @playwright/mcp@0.0.76 install-browser chrome-for-testing
    mkdir -p /root/.cache && ln -sfn /ms-playwright /root/.cache/ms-playwright
    npx -y playwright@1.61.0 install chromium
    uv tool install "{HARBOR_REWARDKIT_PACKAGE}" \\
     && ln -sf /root/.local/bin/rewardkit /usr/local/bin/rewardkit

    npm run verify:build || {{ echo "[test] build failed; leaving safety reward" >&2; exit 0; }}
    exec start-server-and-test 'npm start' tcp:localhost:3000 \\
      'rewardkit /tests --workspace /app --output /logs/verifier/reward.json'
    """
)

SOLVE_SH = textwrap.dedent(
    """\
    #!/usr/bin/env bash
    set -euo pipefail
    shopt -s dotglob nullglob
    for path in /app/* /app/.[!.]* /app/..?*; do
      rm -rf -- "$path"
    done
    cp -a /solution/app/. /app/
    if [[ ! -f /app/package.json ]]; then
      cat > /app/package.json <<'EOF'
    {
      "name": "oracle-static",
      "private": true,
      "scripts": {
        "verify:build": "node -e \\"require('fs').accessSync(require('fs').existsSync('Dashboard.html')?'Dashboard.html':'index.html')\\"",
        "start": "npx --yes serve -l 3000 -n"
      }
    }
    EOF
    fi
    if [[ -f /app/Dashboard.html && ! -f /app/index.html ]]; then
      printf '%s\\n' '<!DOCTYPE html><meta http-equiv="refresh" content="0; url=Dashboard.html">' > /app/index.html
    fi
    """
)

REWARD_TOML = textwrap.dedent(
    """\
    # Aggregate scores. WebMCP is never a scoring dimension.
    [[reward]]
    name = "reward"
    aggregation = "weighted_mean"

    [[reward]]
    name = "pass"
    aggregation = "threshold"
    threshold = 0.7
    """
)

TASK_TOML_TMPL = textwrap.dedent(
    """\
    schema_version = "1.3"

    [task]
    name = "local/{slug}"
    description = "{description}"
    keywords = ["frontend", "good-app", "playwright", "rewardkit", "webmcp"]

    [metadata]
    difficulty = "hard"
    category = "frontend"
    tags = ["frontend", "good-app", "webmcp", "rewardkit"]
    source_folder = "{source}"

    [agent]
    timeout_sec = 3600.0

    [verifier]
    timeout_sec = 14400.0

    [verifier.env]
    ANTHROPIC_API_KEY = "${{ANTHROPIC_API_KEY}}"
    CLAUDE_CODE_OAUTH_TOKEN = "${{CLAUDE_CODE_OAUTH_TOKEN}}"

    [environment]
    workdir = "/app"
    build_timeout_sec = 1200.0
    memory_mb = 8192
    cpus = 4

    [[artifacts]]
    source = "/app"
    destination = "app"
    exclude = [
        "node_modules",
        ".cache",
        "dist",
        "build",
        "out",
        ".DS_Store",
        ".git",
    ]
    """
)


def should_skip(name: str, *, is_daisy_parent: bool) -> bool:
    if name in SKIP_NAMES:
        return True
    if any(name.startswith(p) for p in SKIP_PREFIXES):
        return True
    if name in SKIP_DIRS:
        if name == "theme-generator" and is_daisy_parent:
            return True
        if name != "theme-generator":
            return True
    return False


def copy_solution_app(src: Path, dest: Path, *, is_daisy_parent: bool) -> None:
    dest.mkdir(parents=True, exist_ok=True)
    for entry in src.iterdir():
        if should_skip(entry.name, is_daisy_parent=is_daisy_parent):
            continue
        target = dest / entry.name
        if entry.is_dir():
            shutil.copytree(entry, target, dirs_exist_ok=True, ignore=shutil.ignore_patterns(
                "__pycache__", "*.pyc", ".DS_Store"
            ))
        else:
            shutil.copy2(entry, target)

    # Ensure package.json for static oracle serve
    pkg = dest / "package.json"
    if not pkg.exists():
        entry = "Dashboard.html" if (dest / "Dashboard.html").exists() else "index.html"
        pkg.write_text(
            json.dumps(
                {
                    "name": "oracle-static",
                    "private": True,
                    "scripts": {
                        "verify:build": f"node -e \"require('fs').accessSync('{entry}')\"",
                        "start": "npx --yes serve -l 3000 -n",
                    },
                },
                indent=2,
            )
            + "\n"
        )
    if (dest / "Dashboard.html").exists() and not (dest / "index.html").exists():
        (dest / "index.html").write_text(
            '<!DOCTYPE html><meta http-equiv="refresh" content="0; url=Dashboard.html">\n'
        )


def package_task(slug: str, spec: dict) -> list[str]:
    src = ROOT / spec["source"]
    errors: list[str] = []
    if not (src / "instruction.md").exists():
        return [f"missing instruction.md in {src}"]
    if not (src / "rubric.json").exists():
        return [f"missing rubric.json in {src}"]

    rubric = json.loads((src / "rubric.json").read_text())
    pol = verify_polarity(rubric)
    if pol:
        errors.append(f"polarity fail: {pol}")
        return errors

    out = TASKS / slug
    if out.exists():
        shutil.rmtree(out)
    (out / "environment").mkdir(parents=True)
    (out / "solution" / "app").mkdir(parents=True)
    (out / "tests").mkdir(parents=True)
    for dim in CRITERION_MAP.values():
        (out / "tests" / dim).mkdir()

    instruction = (src / "instruction.md").read_text()
    readme = (src / "README.md").read_text() if (src / "README.md").exists() else None
    section = webmcp_h3.render_instruction_webmcp_section(assignment_for_slug(slug))
    if "Baseline Quality Bar" in section or "/opt/webmcp-contracts" in section:
        raise ValueError("instruction WebMCP section must not include Baseline or /opt path")
    readme, instruction = attach_webmcp(readme, instruction, section)
    if "Baseline Quality Bar" in instruction:
        raise ValueError(f"{slug}: instruction must not include Baseline Quality Bar")
    if "/opt/webmcp-contracts" in instruction:
        raise ValueError(f"{slug}: instruction must not reference /opt/webmcp-contracts")

    (out / "instruction.md").write_text(instruction)
    if readme is not None:
        (out / "README.md").write_text(readme)

    # Authoring verifier_checklist.json is the source for core_features
    # checklist-* criteria; it is NOT copied into tasks/frontend-*.
    # rubric.json likewise stays in the authoring folder only — both are
    # emitted into tests/**/*.toml at package/sync time.
    checklist_path = src / "verifier_checklist.json"
    if not checklist_path.is_file():
        errors.append(f"missing authoring verifier_checklist.json in {src}")
        return errors
    checklist = json.loads(checklist_path.read_text())
    if not isinstance(checklist, list) or not checklist:
        errors.append("authoring verifier_checklist.json must be a non-empty JSON array")
        return errors

    (out / "task.toml").write_text(
        TASK_TOML_TMPL.format(
            slug=slug,
            description=toml_escape(spec["description"]),
            source=spec["source"],
        )
    )

    is_daisy_parent = spec["source"] == "DaisyUI"
    copy_solution_app(src, out / "solution" / "app", is_daisy_parent=is_daisy_parent)

    dockerfile_path = out / "environment" / "Dockerfile"
    dockerfile_path.write_text(DOCKERFILE)
    if "/opt/webmcp-contracts" in DOCKERFILE or "webmcp-contracts" in DOCKERFILE:
        raise ValueError("Dockerfile must not vendor /opt/webmcp-contracts")

    solve = out / "solution" / "solve.sh"
    solve.write_text(SOLVE_SH)
    solve.chmod(0o755)

    test_sh = out / "tests" / "test.sh"
    test_sh.write_text(TEST_SH)
    test_sh.chmod(0o755)

    (out / "tests" / "reward.toml").write_text(REWARD_TOML)
    judge_prompt = _read_canonical_prompt("system_prompt.md", JUDGE_SYSTEM_PROMPT)
    if "Baseline Quality Bar" in judge_prompt:
        raise ValueError("judge system_prompt must not include Baseline Quality Bar")
    (out / "tests" / "system_prompt.md").write_text(judge_prompt)

    # MCP servers are inlined into dimension TOMLs via judge_mcp_servers_block()
    # from scripts/canonical/mcp/reward_mcp_servers.toml — no task-local tests/mcp/.

    try:
        write_dimension_tomls(out, rubric, checklist=checklist)
    except ValueError as exc:
        errors.append(str(exc))
        return errors

    coverage = verify_task_criteria_coverage(out, slug=slug)
    if coverage:
        errors.extend(coverage)
    return errors


def write_assignment_map() -> None:
    """Refresh legacy map; prefer schemas/webmcp-assignments.json when present."""
    schema_map = ROOT / "schemas" / "webmcp-assignment-map.json"
    if schema_map.is_file():
        entries = json.loads(schema_map.read_text())
        if len(entries) != 23:
            raise ValueError(f"expected 23 assignment entries, got {len(entries)}")
    else:
        entries = []
        for slug, spec in TASK_SPECS.items():
            entries.append(
                {
                    "task": slug,
                    "modules": spec["modules"],
                    "bindings": spec["bindings"],
                    "mechanics_exclusions": spec.get("mechanics_exclusions") or [],
                }
            )
    path = ROOT / "scripts" / "canonical" / "webmcp-assignment-map.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(entries, indent=2) + "\n")


def _read_canonical_prompt(name: str, fallback: str) -> str:
    """Prefer authored canonical judge prompt under scripts/canonical/."""
    path = ROOT / "scripts" / "canonical" / name
    if path.is_file():
        return path.read_text()
    return fallback


def write_canonical_prompts() -> None:
    canon = ROOT / "scripts" / "canonical"
    canon.mkdir(parents=True, exist_ok=True)
    # Judge prompt only — builder agent system prompt retired; policy lives in instruction.md.
    judge_path = canon / "system_prompt.md"
    if not judge_path.exists():
        judge_path.write_text(JUDGE_SYSTEM_PROMPT)
    builder_path = canon / "agent_system_prompt.md"
    if builder_path.exists():
        builder_path.unlink()
    (canon / "reward.toml").write_text(REWARD_TOML)
    (canon / "test.sh").write_text(TEST_SH)
    env_dir = canon / "environment"
    env_dir.mkdir(parents=True, exist_ok=True)
    (env_dir / "Dockerfile").write_text(DOCKERFILE)
    vendored = env_dir / "webmcp-contracts"
    if vendored.exists():
        shutil.rmtree(vendored)
    # Ensure ephemeral MCP templates exist (authored by m5; copy stubs only if missing).
    mcp_dir = canon / "mcp"
    mcp_dir.mkdir(parents=True, exist_ok=True)
    for name in (
        "builder.mcp.json",
        "judge.mcp.json",
        "allowed_tools.json",
        "reward_mcp_servers.toml",
    ):
        if not (mcp_dir / name).exists():
            raise FileNotFoundError(
                f"missing scripts/canonical/mcp/{name} — restore m5 MCP templates"
            )


def _verify_all_tasks(order: list[str], *, check_webmcp: bool) -> dict[str, list[str]]:
    all_errors: dict[str, list[str]] = {}
    print("\n=== polarity + criterion coverage ===")
    for slug in order:
        task_dir = TASKS / slug
        if not task_dir.exists():
            all_errors[slug] = ["task dir missing"]
            continue
        for dim in CRITERION_MAP.values():
            toml_path = task_dir / "tests" / dim / f"{dim}.toml"
            if not toml_path.is_file():
                all_errors.setdefault(slug, []).append(f"missing {dim}.toml")
                print(f"{slug}/{dim}: MISSING [FAIL]")
                continue
            text = toml_path.read_text()
            blocks = text.split("[[criterion]]")[1:]
            pos = neg = 0
            for b in blocks:
                if re.search(r"^\s*negate\s*=\s*true", b, re.M):
                    neg += 1
                else:
                    pos += 1
            status = "PASS" if pos >= 1 and neg >= 1 else "FAIL"
            print(f"{slug}/{dim}: +{pos} -{neg} [{status}]")
            if status == "FAIL":
                all_errors.setdefault(slug, []).append(f"{dim} polarity")
        for err in verify_task_criteria_coverage(task_dir, slug=slug):
            # polarity already printed above; keep coverage / missing-id errors
            if "polarity" in err and slug in all_errors and err in all_errors[slug]:
                continue
            if "polarity" in err:
                continue
            all_errors.setdefault(slug, []).append(err)
            print(f"{slug}/coverage: FAIL ({err})")
        if check_webmcp:
            instr = task_dir / "instruction.md"
            text = instr.read_text() if instr.exists() else ""
            xml_ok = (
                "<webmcp_action_contract>" in text
                and "</webmcp_action_contract>" in text
                and "<module_spec" in text
                and "Implementation:" in text
                and "## Delivery and integrity" in text
                and "### WebMCP Action Contract" not in text
                and "## Product Requirements" not in text
                and "Baseline Quality Bar" not in text
                and "/opt/webmcp-contracts" not in text
            )
            print(f"{slug}/webmcp_action_contract: {'PASS' if xml_ok else 'FAIL'}")
            if not xml_ok:
                all_errors.setdefault(slug, []).append(
                    "missing/stale inlined WebMCP contract on instruction.md"
                )
            df_path = task_dir / "environment" / "Dockerfile"
            df_text = df_path.read_text() if df_path.exists() else ""
            df_ok = (
                df_path.exists()
                and "/opt/webmcp-contracts" not in df_text
                and "webmcp-contracts" not in df_text
            )
            print(f"{slug}/dockerfile_no_webmcp_pkg: {'PASS' if df_ok else 'FAIL'}")
            if not df_ok:
                all_errors.setdefault(slug, []).append(
                    "Dockerfile still references webmcp-contracts /opt path"
                )
            if (task_dir / "environment" / "webmcp-contracts").exists():
                all_errors.setdefault(slug, []).append(
                    "environment/webmcp-contracts tree still present"
                )
                print(f"{slug}/no_vendored_webmcp: FAIL")
            else:
                print(f"{slug}/no_vendored_webmcp: PASS")
            judge_prompt = (task_dir / "tests" / "system_prompt.md").read_text()
            if "Baseline Quality Bar" in judge_prompt:
                all_errors.setdefault(slug, []).append(
                    "judge system_prompt must not include Baseline Quality Bar"
                )
            for dim in CRITERION_MAP.values():
                toml_text = (task_dir / "tests" / dim / f"{dim}.toml").read_text()
                has_sh = 'name = "stagehand-webmcp"' in toml_text
                has_pw = 'name = "playwright"' in toml_text
                mcp_ok = has_sh and has_pw
                print(f"{slug}/{dim}/mcp: {'PASS' if mcp_ok else 'FAIL'}")
                if not mcp_ok:
                    all_errors.setdefault(slug, []).append(f"{dim} missing stagehand/playwright MCP")
    return all_errors


def main(argv: list[str] | None = None) -> int:
    args = list(sys.argv[1:] if argv is None else argv)
    sync_only = "--sync-criteria" in args

    order = ["frontend-daisyui-admin-dashboard"] + [
        s for s in TASK_SPECS if s != "frontend-daisyui-admin-dashboard"
    ]
    all_errors: dict[str, list[str]] = {}
    polarity_ok: list[str] = []

    if sync_only:
        # Non-destructive: rewrite judge TOMLs from authoring rubric + checklist.
        print("syncing criteria TOMLs from authoring */rubric.json + verifier_checklist.json ...")
        sync_errors = sync_criteria_from_task_rubrics()
        all_errors.update(sync_errors)
        for slug in order:
            if slug in sync_errors:
                print(f"  {slug}: ERROR {sync_errors[slug]}")
            else:
                polarity_ok.append(slug)
                print(f"  {slug}: ok")
        coverage_errors = _verify_all_tasks(order, check_webmcp=False)
        for slug, errs in coverage_errors.items():
            all_errors.setdefault(slug, []).extend(errs)
        print(f"\nsynced: {len(polarity_ok)}/{len(TASK_SPECS)}")
    else:
        write_canonical_prompts()
        write_assignment_map()
        TASKS.mkdir(exist_ok=True)

        for slug in order:
            print(f"packaging {slug} ...")
            errs = package_task(slug, TASK_SPECS[slug])
            if errs:
                all_errors[slug] = errs
                print(f"  ERROR: {errs}")
            else:
                polarity_ok.append(slug)
                print(f"  ok")

        coverage_errors = _verify_all_tasks(order, check_webmcp=True)
        for slug, errs in coverage_errors.items():
            all_errors.setdefault(slug, []).extend(errs)
        print(f"\npackaged: {len(polarity_ok)}/{len(TASK_SPECS)}")

    if all_errors:
        print("errors:", json.dumps(all_errors, indent=2))
        return 1
    print("all 23 tasks OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
