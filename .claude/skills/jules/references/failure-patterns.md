# Jules Fleet Failure Patterns

Use these patterns as a pre-flight checklist before dispatch and as a triage guide after failures.

## Delegated Critical-Path Interface

Failure: the driver identifies a tiny interface precondition, dispatches it to Jules, then waits while all downstream work remains blocked.

Correct behavior: if the blocker is small, fully specified, and unlocks fanout, the driver implements and merges it locally. Jules receives the downstream wave only after the interface is on `main`.

Example: CE-delta was the interface precondition for FC harvesters/consumers. Delegating it caused idle time; the driver should have landed it directly.

## Fanout Before Contract Lands

Failure: downstream agents import code from an unmerged keystone PR. They no-op, ask questions, or build incompatible local versions.

Correct behavior: collapse chain to fanout with one local/driver-owned interface-only PR:

- schema and literals
- typed stubs
- signature-only skeletons
- fixtures
- append-only extension points

Then freeze it on `main` before dispatch.

## Shared-File Parallelism

Failure: two or more Jules sessions edit the same registry, barrel export, test fixture, workflow, or shared module.

Correct behavior: create per-task plugin files and entry-point registration, or merge the coupled work into a single task. Shared-file edits are driver-owned serial unless the whole coupled change is one PR.

## Duplicate Issue Waves

Failure: many sessions target the same issue/root cause or overlapping file scopes. This burns quota without increasing throughput.

Correct behavior: dedupe by issue number, root cause, and file ownership before dispatch. If duplicates already exist, keep the best PR/session and close or ignore the rest.

## Prompt Missing The Frozen Contract

Failure: Jules asks for clarification about fixtures, schemas, expected output, or how to build tests even though the driver knows the answer.

Correct behavior: rewrite the ticket. Inline the contract, fixture shapes, exact files, tests, and acceptance criteria. A Jules task should not need repo archaeology for decisions the driver already made.

## Scratch Or Root Files

Failure: sessions create root-level scratch scripts (`test_script.py`, `test_check.py`) or unrelated files while probing.

Correct behavior: prompts must ban scratch/root artifacts and state where exploratory fixtures/tests belong. Driver review should reject PRs with stray files.

## Scope Drift After A Strict Task

Failure: a deletion-only or workflow-only task drifts into unrelated test/style/source changes because CI exposed adjacent failures.

Correct behavior: if adjacent failures appear, the driver decides whether to create a new serial fix or a separate Jules ticket. The current task must keep its file scope.

## Misreading Jules Completion

Failure: Jules says it cannot push, then keeps asking for help even though AUTO_CREATE_PR handles PR creation.

Correct behavior: “commit is the finish line.” Do not ask Jules to push by hand. Use the Jules API/PR URL and GitHub-side iteration.
