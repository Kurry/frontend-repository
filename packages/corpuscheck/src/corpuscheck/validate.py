"""Read-only, layered validation for frontend task corpus entries."""

from __future__ import annotations

import importlib.util
import json
import re
import stat
import sys
import tomllib
from dataclasses import dataclass, field
from functools import lru_cache
from pathlib import Path
from types import ModuleType
from typing import Iterable

from .repo import canonical_dir, find_repo_root


EXISTING_DIMENSIONS = ("core_features", "visual_design", "motion", "technical")
NEW_DIMENSIONS = (
    "user_flows",
    "edge_cases",
    "responsiveness",
    "accessibility",
    "performance",
    "writing",
    "innovation",
    "design_fidelity",
    "behavioral",
)
FULL_DIMENSIONS = EXISTING_DIMENSIONS + NEW_DIMENSIONS
REQUIRED_FILES = (
    "instruction.md",
    "task.toml",
    "environment/Dockerfile",
    "tests/test.sh",
    "tests/system_prompt.md",
    "tests/reward.toml",
    "tests/playwright_rm_config.json",
    "tests/webmcp_stdio_server.mjs",
    *(f"tests/{dim}/{dim}.toml" for dim in EXISTING_DIMENSIONS),
)
ORACLE_PATHS = ("solution/app", "environment/reference-screenshots")
DEFAULT_BRAND_DENYLIST = (
    "Aether",
    "OpenRouter",
    "Mercor",
    "ProgramBench",
    "Anthropic",
    "OpenAI",
    "Harbor",
)
DOUBLE_NEGATION_RE = re.compile(r"\b(does not|do not|never)\b", re.I)
STACK_NAMES = (
    "React", "Vue", "Svelte", "Solid", "Preact", "Angular", "Qwik",
    "Zustand", "Pinia", "Redux", "Jotai", "NgRx", "Tailwind",
)
AUTHORING_ARTIFACTS = {"INVENTORY.md", "rubric.json", "verifier_checklist.json", ".DS_Store"}
QUANTIFIER_RE = re.compile(r"\b(several|many|some|a few)\b", re.I)
PROBE_SECRECY_RE = re.compile(r"\b(judge|verifier|probe|grading)\b", re.I)


@dataclass
class CheckResult:
    name: str
    passed: bool
    messages: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)


@dataclass
class TaskValidation:
    task_dir: str
    checks: list[CheckResult] = field(default_factory=list)
    waived_checks: set[str] = field(default_factory=set)

    @property
    def passed(self) -> bool:
        return all(check.passed or check.name in self.waived_checks for check in self.checks)

    @property
    def messages(self) -> list[str]:
        return [
            f"{check.name}: {message}"
            for check in self.checks
            for message in check.messages
        ]

    @property
    def warnings(self) -> list[str]:
        return [
            f"{check.name}: {warning}"
            for check in self.checks
            for warning in check.warnings
        ]


def resolve_repo_root(start: Path | None = None) -> Path:
    """Locate the repository without assuming the caller's working directory."""
    return find_repo_root(start)


@lru_cache(maxsize=None)
def _load_module(name: str, path: str) -> ModuleType:
    spec = importlib.util.spec_from_file_location(name, path)
    if spec is None or spec.loader is None:
        raise ImportError(f"cannot load {path}")
    module = importlib.util.module_from_spec(spec)
    sys.modules.setdefault(name, module)
    spec.loader.exec_module(module)
    return module


@lru_cache(maxsize=1)
def repository_sources() -> tuple[ModuleType, ModuleType, ModuleType, ModuleType]:
    root = resolve_repo_root()
    # Importing repository source-of-truth modules must remain read-only too.
    sys.dont_write_bytecode = True
    # webmcp_h3 and package_frontend_tasks are corpuscheck's own modules now;
    # the skill validators stay under .claude/skills (shared with the skills
    # themselves) and are loaded from the repository by file path.
    from . import package_frontend_tasks as package
    from . import webmcp_h3 as webmcp

    migration = _load_module(
        "corpuscheck_validate_migration",
        str(root / ".claude/skills/task-authoring/scripts/validate_migration.py"),
    )
    rubric = _load_module(
        "corpuscheck_validate_rubric",
        str(root / ".claude/skills/rubrics/scripts/validate_rubric.py"),
    )
    return webmcp, package, migration, rubric


def assignments_by_slug() -> dict[str, dict]:
    webmcp, _, _, _ = repository_sources()
    return {entry["task"]: entry for entry in webmcp.load_assignments()}


def source_metadata() -> dict[str, dict]:
    webmcp, _, _, _ = repository_sources()
    return webmcp.load_sources()


def validate_layout(
    task_dir: Path,
    *,
    strict_oracle: bool = False,
    strict_dimensions: bool = False,
) -> CheckResult:
    messages = [
        f"missing required file: {rel}"
        for rel in REQUIRED_FILES
        if not (task_dir / rel).is_file()
    ]
    missing_oracle = [rel for rel in ORACLE_PATHS if not (task_dir / rel).is_dir()]
    warnings: list[str] = []
    missing_new = [
        dim for dim in NEW_DIMENSIONS
        if not (task_dir / "tests" / dim / f"{dim}.toml").is_file()
    ]
    if missing_new:
        notice = f"missing new dimension tomls: {missing_new}"
        (messages if strict_dimensions else warnings).append(notice)
    if strict_oracle:
        messages.extend(f"missing oracle path: {rel}" for rel in missing_oracle)
    else:
        warnings.extend(f"missing optional oracle path: {rel}" for rel in missing_oracle)

    for path in task_dir.rglob("*"):
        relative = path.relative_to(task_dir).as_posix()
        if path.is_file() and path.name in AUTHORING_ARTIFACTS:
            messages.append(f"stray authoring artifact: {relative}")
        if path.is_dir() and path.name == "node_modules" and relative.startswith("solution/"):
            messages.append(f"vendored node_modules under solution: {relative}")

    test_sh = task_dir / "tests/test.sh"
    if test_sh.is_file() and not test_sh.stat().st_mode & (stat.S_IXUSR | stat.S_IXGRP | stat.S_IXOTH):
        messages.append("tests/test.sh is not executable")

    task_toml = task_dir / "task.toml"
    if task_toml.is_file():
        try:
            configured_name = str(tomllib.loads(task_toml.read_text())["task"]["name"])
        except (OSError, tomllib.TOMLDecodeError, KeyError, TypeError) as exc:
            messages.append(f"cannot read task.toml [task].name: {exc}")
        else:
            suffix = configured_name.removeprefix("mercor-intelligence/")
            if suffix != task_dir.name:
                messages.append(
                    f"task.toml [task].name suffix {suffix!r} does not match directory {task_dir.name!r}"
                )
    return CheckResult("layout", not messages, messages, warnings)


def validate_shared_shape(task_dir: Path) -> CheckResult:
    _, package, _, _ = repository_sources()
    canon = canonical_dir()
    messages: list[str] = []
    comparisons: dict[str, bytes] = {
        "tests/test.sh": (canon / "test.sh").read_bytes(),
        "tests/system_prompt.md": (canon / "system_prompt.md").read_bytes(),
        "tests/webmcp_stdio_server.mjs": (
            canon / "mcp/webmcp_stdio_server.mjs"
        ).read_bytes(),
        "environment/Dockerfile": package.DOCKERFILE.encode(),
    }
    sources = source_metadata()
    description = (sources.get(task_dir.name) or {}).get("description")
    if description is None:
        messages.append("no description in corpuscheck schemas/webmcp-task-sources.json")
    else:
        comparisons["task.toml"] = package.render_task_toml(
            task_dir.name, description
        ).encode()
        comparisons["README.md"] = package.render_task_readme(
            task_dir.name, description
        ).encode()
    assignment = assignments_by_slug().get(task_dir.name)
    if assignment is not None:
        comparisons["solution/app/README.md"] = package.render_oracle_readme(
            task_dir.name, assignment["modules"]
        ).encode()
    screenshot_copy = b"COPY reference-screenshots/ /reference-screenshots/\n"
    for rel, expected in comparisons.items():
        path = task_dir / rel
        if not path.is_file():
            continue  # layout owns missing-file reporting
        actual = path.read_bytes()
        if rel == "environment/Dockerfile" and (
            task_dir / "environment/reference-screenshots"
        ).is_dir():
            expected = expected + screenshot_copy
        if actual != expected:
            messages.append(f"{rel} differs from its canonical renderer/template")

    task_toml = task_dir / "task.toml"
    if task_toml.is_file():
        try:
            from harbor.models.task.config import TaskConfig
        except ImportError:
            pass
        else:
            try:
                model = TaskConfig.model_validate_toml(task_toml.read_text())
                TaskConfig.model_validate(model.model_dump())
            except Exception as exc:  # Harbor API/model errors are validation failures
                messages.append(f"Harbor TaskConfig round-trip failed: {exc}")
    return CheckResult("shared_shape", not messages, messages)


def validate_contract(task_dir: Path, instruction_text: str) -> CheckResult:
    webmcp, _, _, _ = repository_sources()
    assignment = assignments_by_slug().get(task_dir.name)
    if assignment is None:
        return CheckResult("contract", False, ["no WebMCP assignment for task slug"])
    messages: list[str] = []
    modules = assignment.get("modules") or []
    if not 1 <= len(modules) <= 4:
        messages.append(f"assignment must declare 1-4 modules (found {len(modules)})")
    try:
        expected = webmcp.render_instruction_webmcp_section(assignment)
        if not webmcp.contract_matches(instruction_text, expected):
            messages.append("instruction WebMCP contract does not match its assignment")
    except Exception as exc:
        messages.append(f"cannot render/compare WebMCP contract: {exc}")
    return CheckResult("contract", not messages, messages)


def _word_hits(text: str, words: Iterable[str]) -> list[str]:
    return sorted(
        word for word in words
        if re.search(rf"(?<![A-Za-z0-9]){re.escape(word)}(?![A-Za-z0-9])", text, re.I)
    )


def validate_instruction(
    instruction_text: str,
    *,
    brand_denylist: Iterable[str] = DEFAULT_BRAND_DENYLIST,
) -> CheckResult:
    webmcp, _, migration, _ = repository_sources()
    messages: list[str] = []
    warnings: list[str] = []
    sections = migration.sections(instruction_text)
    mentioned = {
        tag for tag in re.findall(r"<([a-z_]+)>", instruction_text)
        if tag in migration.CANONICAL
    }
    unclosed = sorted(mentioned - set(sections))
    if unclosed:
        messages.append(f"opened sections are not closed: {unclosed}")
    ordered = sorted(sections, key=lambda tag: instruction_text.index(f"<{tag}>"))
    indexes = [migration.CANONICAL.index(tag) for tag in ordered]
    if indexes != sorted(indexes):
        messages.append(f"sections are not in canonical order: {ordered}")
    for name, body in sections.items():
        if name in migration.PROTECTED:
            continue
        offenders = [
            line.strip()[:80] for line in body.splitlines()
            if re.search(r"\*\*|^#{1,6} |`", line)
        ]
        if offenders:
            messages.append(f"markdown found in <{name}>: {offenders[:3]}")
    head = sections.get("summary", "") + sections.get("requirements", "")
    if "4.3.2" not in head or re.search(r"tailwind", head, re.I) is None:
        messages.append("Tailwind CSS 4.3.2 is not named in summary or requirements")
    requirements = sections.get("requirements", "").lower()
    if not any(token in requirements for token in ("cdn", "bundled locally", "installed via npm")):
        messages.append("requirements do not state the npm-local/no-CDN rule")
    for name in migration.BEHAVIORAL:
        behavioral_body = sections.get(name, "")
        hits = migration.lib_hits(behavioral_body.lower(), migration.LIB_NAMES)
        if hits:
            messages.append(f"library names in <{name}>: {hits}")
        quantifiers = sorted({hit.casefold() for hit in QUANTIFIER_RE.findall(behavioral_body)})
        if quantifiers:
            warnings.append(f"unresolved quantifiers in <{name}>: {quantifiers}")
    contract = sections.get("webmcp_action_contract", "")
    if not contract.strip():
        messages.append("<webmcp_action_contract> is absent or empty")

    body_without_contract = webmcp.XML_BLOCK_RE.sub("", instruction_text)
    brand_hits = _word_hits(body_without_contract, brand_denylist)
    if brand_hits:
        messages.append(f"denied brand names outside WebMCP block: {brand_hits}")
    unprotected = "\n".join(body for name, body in sections.items() if name not in migration.PROTECTED)
    secrecy_hits = sorted({hit.casefold() for hit in PROBE_SECRECY_RE.findall(unprotected)})
    if secrecy_hits:
        messages.append(f"probe-secrecy words in non-protected sections: {secrecy_hits}")
    return CheckResult("instruction", not messages, messages, warnings)


def _read_dimension(path: Path) -> tuple[dict | None, str | None]:
    try:
        return tomllib.loads(path.read_text()), None
    except (OSError, tomllib.TOMLDecodeError) as exc:
        return None, str(exc)


def _judge_header(text: str) -> str:
    """Return the complete judge table and all judge.mcp_servers arrays."""
    match = re.search(r"(?m)^\[(?!\[?judge(?:\.|\]))", text)
    header = text[: match.start()] if match else text
    judge_table_end = re.search(r"(?m)^\[\[?judge\.", header)
    end = judge_table_end.start() if judge_table_end else len(header)
    judge_table = re.sub(
        r"(?m)^weight[ \t]*=[ \t]*[+-]?(?:\d+(?:\.\d*)?|\.\d+)[ \t]*\n?",
        "",
        header[:end],
    )
    return (judge_table + header[end:]).rstrip() + "\n"


def _present_dimensions(task_dir: Path) -> list[tuple[str, Path]]:
    return [
        (dim, path)
        for dim in FULL_DIMENSIONS
        if (path := task_dir / "tests" / dim / f"{dim}.toml").is_file()
    ]


def validate_rubric(task_dir: Path) -> CheckResult:
    _, _, _, rubric_validator = repository_sources()
    messages: list[str] = []
    warnings: list[str] = []
    headers: dict[str, str] = {}
    total_criteria = 0
    for dim, path in _present_dimensions(task_dir):
        failures, validator_warnings = rubric_validator.check_file(path)
        messages.extend(failures)
        warnings.extend(validator_warnings)
        data, error = _read_dimension(path)
        if error:
            if not any("TOML parse error" in item for item in failures):
                messages.append(f"{path.name}: TOML parse error: {error}")
            continue
        criteria = data.get("criterion", [])
        total_criteria += len(criteria)
        if not criteria:
            messages.append(f"{path.name}: dimension is empty")
        ids = [criterion.get("id") for criterion in criteria]
        if any(cid is None for cid in ids):
            messages.append(f"{path.name}: every criterion must have an id")
        duplicates = sorted({cid for cid in ids if cid is not None and ids.count(cid) > 1})
        if duplicates and not any("duplicate ids" in item for item in failures):
            messages.append(f"{path.name}: duplicate criterion ids {duplicates}")
        headers[dim] = _judge_header(path.read_text())
    if len(headers) > 1 and len(set(headers.values())) != 1:
        messages.append("[judge] header block is not byte-identical across dimensions")
    return CheckResult("rubric", not messages, messages, warnings)


def validate_eval_validity(task_dir: Path) -> CheckResult:
    messages: list[str] = []
    warnings: list[str] = []
    # Only flag a framework name in an IDENTITY context (a browser judge can't
    # verify the stack). A bare name is not enough: "solid" (border style), "react"
    # (English verb) etc. collide with ordinary criterion prose, so the name must
    # follow an identity verb. Mirrors the rubrics skill's IMPL_PHRASES gating.
    stack_pattern = re.compile(
        r"\b(?:uses|using|implemented with|built with|powered by|via)\s+(?:"
        + "|".join(re.escape(name) for name in STACK_NAMES)
        + r")\b",
        re.I,
    )
    for _, path in _present_dimensions(task_dir):
        data, error = _read_dimension(path)
        if error:
            continue  # rubric tier owns parse failures
        seen: dict[str, str] = {}
        for criterion in data.get("criterion", []):
            cid = str(criterion.get("id") or criterion.get("name") or "<unknown>")
            if cid.endswith(".catchall"):
                continue
            description = str(criterion.get("description") or "")
            if stack_pattern.search(description):
                messages.append(f"{path.name}:{cid}: stack-identity phrasing/name")
            if (
                criterion.get("negate") is True
                and DOUBLE_NEGATION_RE.search(description)
            ):
                warnings.append(f"{path.name}:{cid}: possible double-inverted negation")
            weight = criterion.get("weight")
            if weight not in {0.5, 1.0}:
                messages.append(f"{path.name}:{cid}: unsupported weight {weight!r}")
            normalized = " ".join(description.split()).casefold()
            if normalized in seen:
                messages.append(
                    f"{path.name}:{cid}: duplicate description (also {seen[normalized]})"
                )
            else:
                seen[normalized] = cid
    return CheckResult("eval_validity", not messages, messages, warnings)


def _read_json(path: Path) -> dict | None:
    try:
        value = json.loads(path.read_text())
        return value if isinstance(value, dict) else None
    except (OSError, UnicodeDecodeError, json.JSONDecodeError):
        return None


def _looks_binary(data: bytes) -> bool:
    return b"\0" in data[:8192]


def validate_oracle(
    task_dir: Path,
    *,
    brand_denylist: Iterable[str] = DEFAULT_BRAND_DENYLIST,
) -> CheckResult:
    """Validate a present oracle without executing or building it."""
    app_dir = task_dir / "solution/app"
    if not app_dir.is_dir():
        return CheckResult("oracle", True, warnings=["oracle tier skipped: solution/app absent"])

    messages: list[str] = []
    package_path = app_dir / "package.json"
    package = _read_json(package_path)
    if package is None:
        messages.append("solution/app/package.json is missing or invalid JSON")
    else:
        scripts = package.get("scripts")
        required_scripts = {"start", "verify:build"}
        if not isinstance(scripts, dict) or not required_scripts.issubset(scripts):
            keys = sorted(scripts) if isinstance(scripts, dict) else []
            messages.append(f"package.json scripts must include start+verify:build (found {keys})")
        start = str(scripts.get("start", "")) if isinstance(scripts, dict) else ""
        referenced_outputs: set[str] = set()
        if re.search(r"\b(?:dist|build)(?:/|\b)", start):
            referenced_outputs.update(re.findall(r"\b(dist|build)(?=/|\b)", start))
        if re.search(r"\bpreview\b", start) and not referenced_outputs:
            referenced_outputs.add("dist")
        for output in sorted(referenced_outputs):
            if not (app_dir / output).is_dir():
                messages.append(f"start references {output!r}, but solution/app/{output} is absent")

    denied: dict[str, list[str]] = {}
    html_texts: list[tuple[Path, str]] = []
    for path in sorted(item for item in app_dir.rglob("*") if item.is_file()):
        relative = path.relative_to(app_dir).as_posix()
        try:
            data = path.read_bytes()
        except OSError:
            continue
        if len(data) > 200 * 1024 and relative.startswith("dist/assets/"):
            continue
        if _looks_binary(data):
            continue
        try:
            text = data.decode("utf-8")
        except UnicodeDecodeError:
            continue
        hits = _word_hits(text, brand_denylist)
        if hits:
            denied[relative] = hits
        if path.suffix.casefold() in {".html", ".htm"}:
            html_texts.append((path, text))
    for relative, hits in denied.items():
        messages.append(f"denied brand names in solution/app/{relative}: {hits}")

    video_re = re.compile(r"<video\b[^>]*>(.*?)</video\s*>", re.I | re.S)
    source_re = re.compile(r"<source\b[^>]*?(?:src=[\"']([^\"']+)|type=[\"']([^\"']+))[^>]*>", re.I)
    for path, text in html_texts:
        for index, video in enumerate(video_re.findall(text), 1):
            sources = [next((part for part in match if part), "") for match in source_re.findall(video)]
            mp4_positions = [i for i, source in enumerate(sources) if "mp4" in source.casefold()]
            if mp4_positions and not any(
                "webm" in source.casefold() for source in sources[: min(mp4_positions)]
            ):
                messages.append(
                    f"{path.relative_to(app_dir)} video {index}: mp4 source lacks a preceding webm source"
                )
    return CheckResult("oracle", not messages, messages)


def validate_task(
    task_dir: str | Path,
    *,
    strict_oracle: bool = False,
    strict_dimensions: bool = False,
    brand_denylist: Iterable[str] = DEFAULT_BRAND_DENYLIST,
) -> TaskValidation:
    task_dir = Path(task_dir)
    result = TaskValidation(task_dir=str(task_dir))
    result.checks.append(
        validate_layout(
            task_dir,
            strict_oracle=strict_oracle,
            strict_dimensions=strict_dimensions,
        )
    )
    result.checks.append(validate_shared_shape(task_dir))
    instruction_path = task_dir / "instruction.md"
    try:
        instruction_text = instruction_path.read_text()
    except OSError as exc:
        instruction_text = ""
        result.checks.append(CheckResult("contract", False, [f"cannot read instruction: {exc}"]))
        result.checks.append(CheckResult("instruction", False, [f"cannot read instruction: {exc}"]))
    else:
        result.checks.append(validate_contract(task_dir, instruction_text))
        result.checks.append(
            validate_instruction(instruction_text, brand_denylist=brand_denylist)
        )
    result.checks.append(validate_rubric(task_dir))
    result.checks.append(validate_eval_validity(task_dir))
    result.checks.append(validate_oracle(task_dir, brand_denylist=brand_denylist))
    return result
