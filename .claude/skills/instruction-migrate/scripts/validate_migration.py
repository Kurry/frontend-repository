#!/usr/bin/env python3
"""Validate a migrated instruction.md against the extended-kit corpus shape.

Usage:
  validate_migration.py NEW.md --original OLD.md --slug task-slug
Exit 0 if no FAIL lines; prints PASS/FAIL/INFO lines.
"""
import argparse, re, sys, pathlib

CANONICAL = ["summary", "reference_screenshots", "core_features", "user_flows",
             "edge_cases", "visual_design", "motion", "responsiveness",
             "accessibility", "performance", "writing", "innovation",
             "requirements", "integrity", "delivery", "webmcp_action_contract"]
PROTECTED = ["integrity", "delivery", "webmcp_action_contract"]
BEHAVIORAL = ["core_features", "visual_design", "motion", "user_flows", "edge_cases"]
# Library names that must not appear inside behavioral sections
LIB_NAMES = [
    "zustand", "pinia", "redux", "jotai", "ngrx", "signals store",
    "daisyui", "shadcn", "radix", "mui ", "material ui", "ant design", "chakra",
    "mantine", "headless ui", "react aria", "ark ui", "primevue", "naive ui",
    "vuetify", "reka", "bits ui", "skeleton labs", "flowbite", "melt", "kobalte",
    "primeng", "autoanimate", "auto-animate", "framer motion", "motion for react",
    "motion for vue", "@vueuse/motion", "svelte-motion", "gsap", "lenis",
    "lottie", "rive", "tsparticles", "canvas-confetti", "neoconfetti",
    "tanstack", "virtua", "recharts", "layerchart", "echarts", "chart.js",
    "tiptap", "prosekit", "prosemirror", "lexical", "codemirror",
    "react hook form", "vee-validate", "veevalidate", "formkit", "felte",
    "superforms", "formsnap", "modular forms", "zod", "valibot",
    "phosphor", "tabler", "iconify", "heroicons", "lucide",
]


def lib_hits(body_lower, libs):
    """Word-boundary library-name matching ('rive' must not match 'derives')."""
    hits = []
    for lib in libs:
        pat = r"(?<![a-z0-9])" + re.escape(lib.strip()) + r"(?![a-z0-9])"
        if re.search(pat, body_lower):
            hits.append(lib.strip())
    return sorted(set(hits))

def sections(text):
    out = {}
    for name in CANONICAL:
        m = re.search(rf"<{name}>(.*?)</{name}>", text, re.S)
        if m:
            out[name] = m.group(1)
    return out

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("new")
    ap.add_argument("--original", required=True)
    ap.add_argument("--slug", default="")
    args = ap.parse_args()
    new = pathlib.Path(args.new).read_text()
    old = pathlib.Path(args.original).read_text()
    fails = 0
    def report(ok, msg, level="FAIL"):
        nonlocal fails
        if ok:
            print(f"PASS  {msg}")
        else:
            fails += 1 if level == "FAIL" else 0
            print(f"{level}  {msg}")

    # tag closure
    extractable = set(sections(new))
    mentioned = {t for t in re.findall(r"<([a-z_]+)>", new) if t in CANONICAL}
    unclosed = sorted(mentioned - extractable - {"summary"} if "summary" in extractable else mentioned - extractable)
    # a section counts as closed if the <tag>...</tag> pair extracts; inline mentions in prose are fine
    unclosed = sorted({t for t in mentioned if t not in extractable})
    report(not unclosed, f"every opened section closes (unextractable: {unclosed})")

    # canonical order (by position of each extractable section's opening tag)
    order = sorted(extractable, key=lambda t: new.index(f"<{t}>"))
    idx = [CANONICAL.index(t) for t in order]
    report(idx == sorted(idx), f"sections in canonical order: {order}")

    secs = sections(new)
    old_secs = sections(old)

    # protected sections byte-identical
    for p in PROTECTED:
        if p in old_secs:
            report(secs.get(p) == old_secs.get(p), f"protected <{p}> unchanged")

    # no markdown inside sections
    for name, body in secs.items():
        if name in PROTECTED or name == "webmcp_action_contract":
            continue  # protected/plumbing sections keep their fixed contract text verbatim
        bad = [ln.strip()[:60] for ln in body.splitlines()
               if re.search(r"\*\*|^#{1,6} |`", ln)]
        report(not bad, f"no markdown in <{name}>" + (f" — offenders: {bad[:3]}" if bad else ""))

    # Tailwind 4.3.2 named
    head = secs.get("summary", "") + secs.get("requirements", "")
    report("4.3.2" in head and re.search(r"tailwind", head, re.I) is not None,
           "Tailwind CSS 4.3.2 named in summary or requirements")

    # no library names in behavioral sections
    for name in BEHAVIORAL:
        body = secs.get(name, "").lower()
        hits = lib_hits(body, LIB_NAMES)
        report(not hits, f"no library names in <{name}>" + (f" — found: {hits}" if hits else ""))

    # npm-local rule mentioned
    req = secs.get("requirements", "").lower()
    report("cdn" in req or "bundled locally" in req or "installed via npm" in req,
           "requirements state npm-local / no-CDN rule")

    # informational: forms-with-schema contract phrasing
    report("schema" in req, "requirements mention schema-driven form validation", level="WARN")

    print(f"\n{'OK' if fails == 0 else 'FAILED'}: {fails} failing check(s)")
    sys.exit(0 if fails == 0 else 1)

if __name__ == "__main__":
    main()
