#!/usr/bin/env python3
"""Validate a task's dimension tomls for rubrics-skill conventions.

Usage: validate_rubric.py <task>/tests
       (checks each canonical <dim>/<dim>.toml found; all 13 are required)
"""
import pathlib, re, sys, tomllib

DIMS = [
    "core_features", "visual_design", "motion", "technical",
    "user_flows", "edge_cases", "responsiveness", "accessibility", "performance",
    "writing", "innovation", "design_fidelity", "behavioral",
]
ABSENCE_OPENERS = re.compile(
    r"^(the app |the page |it )?(does not|doesn't|never|no longer|fails to)\b", re.I)
IMPL_PHRASES = re.compile(
    r"\b(uses|using|implemented with|built with|via) (zustand|pinia|redux|jotai|ngrx|"
    r"react|vue|svelte|solid|preact|angular|qwik|tailwind|daisyui|shadcn|radix|mui|"
    r"mantine|chakra|primevue|primeng|naive ui|kobalte|bits ui|melt|tanstack|gsap|"
    r"motion|autoanimate|tiptap|prosekit|codemirror|recharts|layerchart|echarts|"
    r"chart\.js|zod|valibot)\b", re.I)
CATCHALL_REQUIRED = ["not covered", "evidence"]
# A description that asserts a FAILURE/bad condition but is not negated rewards
# the failure (the annotation-studio class). Heuristic: failure verbs without
# negate=true, excluding catch-alls (which carry their own "significant defect"
# language legitimately) and self-scoping writing phrasings.
FAILURE_LANGUAGE = re.compile(
    r"\b(fails to|is broken|is unreachable|cannot be (dismissed|reached|closed|reopened)|"
    r"throws an? (error|exception)|is not (reachable|operable|dismissible)|"
    r"silently (fails|reverts|drops))\b",
    re.I)

def check_file(path):
    fails = []
    warns = []
    try:
        data = tomllib.loads(path.read_text())
    except Exception as e:
        return [f"{path.name}: TOML parse error: {e}"], []
    crits = data.get("criterion", [])
    if not crits:
        return [f"{path.name}: no [[criterion]] entries"], []
    ids = [c.get("id") or c.get("name") for c in crits]
    if len(set(ids)) != len(ids):
        dupes = sorted({i for i in ids if ids.count(i) > 1})
        fails.append(f"{path.name}: duplicate ids {dupes}")
    pos = [c for c in crits if not c.get("negate")]
    dim = path.stem
    if not pos:
        fails.append(f"{path.name}: no positive criterion")
    # Negative (negate=true) criteria are allowed but never required. Catch-alls
    # are required only for innovation (the one dimension the corpus ships them in).
    catchalls = [c for c in crits
                 if "catchall" in str(c.get("id", "")) or "catchall" in str(c.get("name", ""))
                 or "not covered by any other criterion" in c.get("description", "").lower()]
    if dim == "innovation":
        if len(catchalls) != 1:
            fails.append(f"{path.name}: expected exactly 1 catch-all criterion, found {len(catchalls)}")
        else:
            ca = catchalls[0]
            d = ca.get("description", "").lower()
            if ca.get("negate"):
                fails.append(f"{path.name}: innovation catch-all must be positive")
            for token in CATCHALL_REQUIRED:
                if token not in d:
                    fails.append(f"{path.name}: catch-all description missing '{token}' clause")
    numeric_names = [c.get("id") for c in crits
                     if re.fullmatch(r"\d+([._]\d+)*", str(c.get("name", "")))]
    if catchalls and re.fullmatch(r"\d+([._]\d+)*", str(catchalls[0].get("name", ""))):
        fails.append(f"{path.name}: catch-all name must be descriptive snake_case, not numeric")
    if numeric_names:
        warns.append(f"{path.name}: {len(numeric_names)} criteria still have numeric names "
                     f"(new/rewritten ones must use descriptive snake_case): {numeric_names[:5]}")
    for c in crits:
        d = c.get("description", "")
        cid = c.get("id") or c.get("name")
        if c.get("negate") and ABSENCE_OPENERS.search(d.strip()):
            fails.append(f"{path.name}:{cid}: negated criterion phrased as an absence (double-inverts)")
        # Failure-language without negate=true rewards the failure. Skip catch-alls
        # (legit "significant defect" wording) and writing's self-scoping "has no ... text".
        if (not c.get("negate")
                and not str(cid).endswith("catchall")
                and dim != "writing"
                and FAILURE_LANGUAGE.search(d)):
            warns.append(f"{path.name}:{cid}: positive criterion uses failure language "
                         f"— should this be negate=true? ('{FAILURE_LANGUAGE.search(d).group(0)}')")
        m = IMPL_PHRASES.search(d)
        if m:
            fails.append(f"{path.name}:{cid}: internal-implementation phrasing: '{m.group(0)}'")
        if not d.strip():
            fails.append(f"{path.name}:{cid}: empty description")
    return fails, warns

def main():
    args = [arg for arg in sys.argv[1:] if not arg.startswith("--")]
    if len(args) != 1:
        print("Usage: validate_rubric.py <task>/tests", file=sys.stderr)
        sys.exit(2)
    root = pathlib.Path(args[0])
    total_fails = 0
    for dim in DIMS:
        f = root / dim / f"{dim}.toml"
        if not f.exists():
            print(f"FAIL  {dim} (no file)")
            total_fails += 1
            continue
        fails, warns = check_file(f)
        for w in warns:
            print(f"WARN  {w}")
        if fails:
            for x in fails:
                print(f"FAIL  {x}")
            total_fails += len(fails)
        else:
            print(f"PASS  {dim}")
    print(f"\n{'OK' if total_fails == 0 else 'FAILED'}: {total_fails} failing check(s)")
    sys.exit(0 if total_fails == 0 else 1)

if __name__ == "__main__":
    main()
