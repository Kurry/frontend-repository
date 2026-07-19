from __future__ import annotations

import json
import re

from corpuscheck.drift import DriftKind, detect_corpus_drift, detect_drift
from corpuscheck.validate import (
    FULL_DIMENSIONS,
    NEW_DIMENSIONS,
    validate_contract,
    validate_eval_validity,
    validate_instruction,
    validate_layout,
    validate_oracle,
    validate_rubric,
    validate_shared_shape,
    validate_task,
)


EVAL_SLUG = "frontend-data-tracking-eval-dashboard"
DOCUSEAL_SLUG = "frontend-workflow-docuseal"


def _dimension_toml(header: str, dim: str) -> str:
    judge_weight = (
        "weight = 0.5\n" if dim == "writing"
        else "weight = 0.25\n" if dim == "innovation"
        else ""
    )
    header = header.replace("[judge]\n", f"[judge]\n{judge_weight}", 1)
    aggregation = "all_pass" if dim == "anticheat" else "weighted_mean"
    if dim == "anticheat":
        criteria = f'''[[criterion]]
id = "{dim}.1"
name = "confirmed_deception"
description = "The rendered app contains fabricated success evidence intended to deceive grading."
type = "binary"
negate = true
weight = 1.0

[[criterion]]
id = "{dim}.catchall"
name = "{dim}_catchall"
description = "The app exhibits unambiguous deception not covered by any other criterion; name it and cite concrete browser evidence."
type = "binary"
negate = true
weight = 1.0
'''
    else:
        catchall_negate = "" if dim == "innovation" else "negate = true\n"
        criteria = f'''[[criterion]]
id = "{dim}.1"
name = "{dim}_positive"
description = "The browser-visible result satisfies the dimension's primary observable requirement."
type = "binary"
weight = 1.0

[[criterion]]
id = "{dim}.n1"
name = "{dim}_failure"
description = "The browser-visible result exhibits a significant defect in this dimension."
type = "binary"
negate = true
weight = 1.0

[[criterion]]
id = "{dim}.catchall"
name = "{dim}_catchall"
description = "The app exhibits a significant browser-observable {'enhancement' if dim == 'innovation' else 'defect'} not covered by any other criterion; name it and cite concrete browser evidence."
type = "binary"
{catchall_negate}weight = 1.0
'''
    return f'{header}[scoring]\naggregation = "{aggregation}"\n\n{criteria}'


def _add_new_dimensions(task):
    source = task / "tests/core_features/core_features.toml"
    header = source.read_text().split("[scoring]", 1)[0]
    for dim in NEW_DIMENSIONS:
        path = task / "tests" / dim / f"{dim}.toml"
        path.parent.mkdir(exist_ok=True)
        path.write_text(_dimension_toml(header, dim))


def test_missing_test_sh_fails_layout(copy_task, tmp_path):
    _, task = copy_task(EVAL_SLUG, tmp_path)
    (task / "tests/test.sh").unlink()

    result = validate_layout(task)

    assert not result.passed
    assert any("tests/test.sh" in message for message in result.messages)


def test_edited_test_sh_is_manual_drift_and_fails_shared_shape(copy_task, tmp_path):
    _, task = copy_task(EVAL_SLUG, tmp_path)
    with (task / "tests/test.sh").open("ab") as stream:
        stream.write(b"x")

    drift = detect_drift(task)
    result = validate_shared_shape(task)

    assert any(
        item.kind is DriftKind.MANUAL_EDIT and item.path == "tests/test.sh"
        for item in drift.items
    )
    assert not result.passed
    assert any("tests/test.sh" in message for message in result.messages)


def test_missing_webmcp_contract_fails_contract(copy_task, tmp_path):
    _, task = copy_task(EVAL_SLUG, tmp_path)
    instruction = (task / "instruction.md").read_text()
    instruction = re.sub(
        r"<webmcp_action_contract>.*?</webmcp_action_contract>\s*",
        "",
        instruction,
        flags=re.DOTALL,
    )
    (task / "instruction.md").write_text(instruction)

    result = validate_contract(task, instruction)

    assert not result.passed
    assert any("contract" in message.lower() for message in result.messages)


def test_missing_dimension_catchall_fails_rubric(copy_task, tmp_path):
    _, task = copy_task(EVAL_SLUG, tmp_path)
    path = task / "tests/core_features/core_features.toml"
    text = path.read_text()
    text, count = re.subn(
        r"\n\[\[criterion\]\]\nid = \"1\.catchall\".*\Z", "\n", text, flags=re.DOTALL
    )
    assert count == 1
    path.write_text(text)

    result = validate_rubric(task)

    assert not result.passed
    assert any("catch" in message.lower() for message in result.messages)


def test_all_15_valid_dimensions_pass_strict_validation(copy_task, tmp_path):
    _, task = copy_task(EVAL_SLUG, tmp_path)
    _add_new_dimensions(task)

    result = validate_task(task, strict_dimensions=True)

    assert len(FULL_DIMENSIONS) == 15
    assert result.passed, result.messages


def test_anticheat_non_negated_criterion_fails(copy_task, tmp_path):
    _, task = copy_task(EVAL_SLUG, tmp_path)
    _add_new_dimensions(task)
    path = task / "tests/anticheat/anticheat.toml"
    path.write_text(path.read_text().replace("negate = true\n", "", 1))

    result = validate_rubric(task)

    assert not result.passed
    assert any(
        "every criterion must set negate=true" in message
        for message in result.messages
    )


def test_innovation_positive_catchall_passes(copy_task, tmp_path):
    _, task = copy_task(EVAL_SLUG, tmp_path)
    _add_new_dimensions(task)

    result = validate_rubric(task)

    assert result.passed, result.messages


def test_stack_identity_description_fails_eval_validity(copy_task, tmp_path):
    _, task = copy_task(EVAL_SLUG, tmp_path)
    path = task / "tests/core_features/core_features.toml"
    text = path.read_text()
    text, count = re.subn(
        r'description = "[^"]+"',
        'description = "Implemented with React"',
        text,
        count=1,
    )
    assert count == 1
    path.write_text(text)

    result = validate_eval_validity(task)

    assert not result.passed
    assert any("stack-identity" in message for message in result.messages)


def test_catchalls_are_exempt_from_eval_validity_heuristics(copy_task, tmp_path):
    _, task = copy_task(EVAL_SLUG, tmp_path)
    path = task / "tests/core_features/core_features.toml"
    text = path.read_text().replace(
        "The app exhibits a significant, browser-observable defect",
        "Implemented with React and never exhibits a defect",
    )
    path.write_text(text)

    result = validate_eval_validity(task)

    assert result.passed, result.messages


def test_denied_brand_in_behavioral_instruction_fails(copy_task, tmp_path):
    _, task = copy_task(EVAL_SLUG, tmp_path)
    path = task / "instruction.md"
    instruction = path.read_text().replace("<core_features>", "<core_features>\nAether appears here.", 1)
    path.write_text(instruction)

    result = validate_instruction(instruction)

    assert not result.passed
    assert any("Aether" in message for message in result.messages)


def test_inventory_at_task_root_fails_layout(copy_task, tmp_path):
    _, task = copy_task(EVAL_SLUG, tmp_path)
    (task / "INVENTORY.md").write_text("authoring debris\n")

    result = validate_layout(task)

    assert not result.passed
    assert any("stray authoring artifact" in message for message in result.messages)


def test_missing_verify_build_fails_oracle(copy_task, tmp_path):
    _, task = copy_task(DOCUSEAL_SLUG, tmp_path)
    path = task / "solution/app/package.json"
    package = json.loads(path.read_text())
    del package["scripts"]["verify:build"]
    path.write_text(json.dumps(package))

    result = validate_oracle(task)

    assert not result.passed
    assert any("verify:build" in message for message in result.messages)


def test_unassigned_task_directory_is_orphan(tmp_path):
    tasks_root = tmp_path / "tasks"
    (tasks_root / "frontend-no-schema-assignment").mkdir(parents=True)

    report = detect_corpus_drift(tasks_root)

    assert any(
        item.kind is DriftKind.ORPHAN_DIR and item.path == "frontend-no-schema-assignment"
        for item in report.items
    )


def test_assigned_but_absent_task_directory_is_missing(copy_task, tmp_path):
    tasks_root, _ = copy_task(EVAL_SLUG, tmp_path)

    report = detect_corpus_drift(tasks_root)

    assert any(
        item.kind is DriftKind.MISSING_TASK_DIR
        and item.path == "frontend-workflow-docuseal"
        for item in report.items
    )
