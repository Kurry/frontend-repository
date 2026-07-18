# Ridge shape/motion lab rubric

Grades the Ridge demo (`index.html` + `styles.css` + `app.js`) against the live visual reference (L1 network marketing homepage — URL in README / https://www.avax.network/) and against `instruction.md` signature shape/motion contracts. Content is placeholder-tolerant; geometry, voids, radii, clips, sticky stack, pull-in, trio rise, and events decode are not.

---

## Scoring

| Band | Meaning | Guide |
|------|---------|-------|
| **Pass** | Matches live + instruction contract for this criterion | Full weight |
| **Partial** | Present but visibly weaker / wrong scale / wrong corner / wrong easing | 40–70% of weight |
| **Fail** | Missing, inverted, or clearly wrong family of treatment | 0; apply listed deduct |

**Suggested total:** 100 pts. Start at 100; apply **Fail / Deduct** amounts. Cap Partial awards as noted.

| Severity | Typical deduct |
|----------|----------------|
| Signature device broken (stack, scramble, load ease, pull-in) | −8 to −12 |
| Geometry scale wrong (notch depth, radii, peeks) | −5 to −8 |
| Atmosphere / composition weaker but related | −3 to −5 |
| Polish / hover / density | −2 to −4 |

**Hard fails (any one → overall Fail for the lab):** no load entrance; Why pillars are a flat non-sticky list at ≥768px; Global Events title is static/opacity-only with no per-character decode; ≥1024px pillars stay full-bleed single column with no asymmetric pull-in.

---

## Gap inventory (Ridge demo vs live)

Observed side-by-side (desktop ~900–1280px + local `http://127.0.0.1:8765/`).

### First viewport / chrome
1. **Chrome is one continuous bar** — live splits wordmark cell and theme/hamburger cell with a visible void seam; Ridge uses a single `chrome-inner` flex row.
2. **Theme control is a weak glyph pill** — live uses a clear sun/moon toggle pill; Ridge uses a generic ◐ button.
3. **Hamburger is inert** — no full-screen / drawer mega-menu; live opens a dense panel system.
4. **Mission cell is headline + short lorem** — live is a dense multi-sentence mission paragraph (no fake “Headline” display line).
5. **Clock cell incomplete** — live has brand mark + time + weekday/date + large diagonal SCROLL arrow (“SCROLL / to explore page”); Ridge has time + small “SCROLL ↓” only.
6. **Hero plane wrong family** — live is a **paper/white** full-bleed shell with sculptural brand marks + sparse technical ornaments; Ridge is a **dark blue-gray gradient** faux terrain with a wireframe box + hatch (reads as placeholder atmosphere, not the live white plane).
7. **Load entrance weaker** — live nav: `translateY(-100%)` → 0 over ~2000ms with ~1000ms delay, `ease-in-out-quart`; hero cells use aggressive **clip-path inset** expansion into large bowls. Ridge runs related timing/easing but starts from softer opacity+translate insets; first paint can read as a black void for ~1s before chrome/bentos settle.
8. **Bento gutters** — live mission/clock seam is ~1px void; Ridge uses ~8px (`gap: 0.5rem`), so the bento row feels looser / less “laser cut.”

### Black voids / radii / corner clips
9. **Module radii undersized** — live primary shells ≈ `rounded-2xl`–`rounded-4xl` fluid (~27–32px+); Ridge chrome/chapters often land ~16–26px depending on viewport — bowls read smaller.
10. **Notch depth far too small** — live primary shell cuts use `corner-size` ≈ **clamp(4.5rem … 8.5rem)** (~72–136px) with dual language (large radius + architectural cut). Ridge `--notch-sm: 18px` / `--notch-lg: 40px` — peeks of void are timid.
11. **Wrong corner on Why stack** — live Why chapter + pillar shells cut **top-right** (`corner="tr"`); Ridge notches **bottom-right** only on cards; **Why chapter shell has no clip** (`clip-path: none`) — missing the signature TR void bite on the chapter.
12. **Clip implementation flatter** — live uses shaped shells (`wm-shape` dual radius/corner); Ridge uses a simple 5-point `polygon` chamfer. Acceptable technique if scale/corner match; currently neither scale nor corner match.
13. **CTA notches compete with `border-radius`** — buttons keep radius + small BR polygon; live notched buttons read as sharper industrial cuts (~18–36px cut family on controls).

### Why sticky stack + peeks + ≥1024 pull-in
14. **Sticky tops exist (~28px peek)** — close to live ~29.5px offsets; stack mechanism is directionally correct.
15. **Peek silhouette weak** — because notches are tiny BR cuts (not huge TR cuts), the pile does not read as architectural layered cards against the void the way live does.
16. **Pull-in structure present at ≥1024** — Ridge gets `2fr / 1.2fr` + bordered copy + large right padding; **media column is an empty gray slab** — live companion column carries marks / ornaments / identity, not a blank filler.
17. **Pillar chrome nesting** — Ridge nests a white bordered copy module inside a gray sticky card; live’s lg shell is a single bordered flex row with `lg:pr-4xl` — Ridge’s double-box reads busier and less “pulled-in module.”
18. **Cobalt/ink field weaker** — live saturated pillar fills the shaped shell with a TR cut; Ridge ink card still feels like a tinted card with a small BR notch.
19. **Missing featured-initiative band** before Why — live’s black logo-density + paper pitch strip (with notched Learn more) sets the void language; Ridge jumps hero → Why.

### Get started trio
20. **Rise contract implemented on sub-`lg`** — `translateY(50%)`, ease-out `cubic-bezier(0.165, 0.84, 0.44, 1)`, ~2.0 / 2.4 / 2.8s — matches live timings.
21. **At ≥1024 rise correctly suppressed** — OK per instruction.
22. **Visual weaker** — live cards: `rounded-4xl`, `p-md` + **`pr-2xl` (~96px right pad at mid widths)**, hairline `gap-px`, notched arrow CTAs on void seam grid. Ridge right pad ~51px at 900px; CTAs less notched; copy is stub “Card 01” density.
23. **Hover weaker** — live brightens notched control + nudges arrow without healing the chamfer; Ridge mainly recolors background to accent.

### Global Events scramble / line mask
24. **Scramble + line masks exist** — per-char decoys, ~`index * 60ms` / `50 + (index+1)*75ms`, line `translateY(-100%)` ~2s ease — family matches live `heading-char` flash.
25. **Word-gap artifact** — scramble can read as broken words (e.g. visible gap inside “RIDGE” → “RI DGE”) because word wrappers add flex gap; live split-heading keeps tighter glyph advance.
26. **Events card sparse** — live featured summit: dark field, tags, dates/city, large title, notched Learn more, imagery, View all events control; Ridge is gray block + “Featured / Summit” + “Headline.”
27. **Section shell clip undersized** — live Global Events shell uses large BR `corner-size` (~4.5–8.5rem); Ridge chapter is mostly large-radius paper without that bite.

### Spacing / typography / hover / scroll / density
28. **Display face** — live Aeonik; Ridge Space Grotesk (allowed by instruction) but tracking/weight feel softer than live all-caps chapters.
29. **Section density** — lab omits trust marquee, build letter cards, network-in-action, news carousel, solutions grid, community tiles, conversion forms, multi-column footer (acceptable for a shape/motion lab) but the **kept** sections still under-deliver geometry/motion fidelity listed above.
30. **Scroll physics** — live Lenis-smooth + sticky insight heights feel heavier; Ridge native sticky with shorter cards — stack releases faster / less “pinned chapter” weight.
31. **Reduced-motion** — Ridge CSS mostly respects `prefers-reduced-motion` for load/trio/events/stack; still grade if broken.

---

## Criteria

### LM-01 — Initial load entrance (ease-in / ease-in-out)
- **Weight:** 10
- **Pass:** On first mount (not scroll IO), sticky chrome + both bento cells + hero plane ease in with ease-in or ease-in-out; primary moves ~1500–2000ms; chrome/bentos lead (~800–1000ms delay); plane trails; reduced-motion skips choreography.
- **Partial:** Entrance exists but feels ease-out-led, too short (&lt;1s), simultaneous hard cut, or only opacity fades without clip/translate family.
- **Fail / Deduct:** −10 if first viewport paints fully settled; −8 if ease-out-only / linear-only on primary moves; −6 if reduced-motion still runs the full stagger.
- **Gap observed:** Ridge delays correctly with `--ease-in-out` but early frames are empty black; inset/clip expansion is milder than live’s aggressive hero inset reveal; chrome is one bar sliding down rather than the live split-nav settle.

### LM-02 — Black void framing
- **Weight:** 8
- **Pass:** Near-black canvas; major modules read as paper floating on void; visible gutters / corner reveals; at least one full-width ink field (initiative, trust, get-started, or footer band).
- **Partial:** Dark background present but gutters too wide/soft, or modules still feel like a normal white page with a tinted body bg.
- **Fail / Deduct:** −8 if no structural void; −5 if gutters are only borders/shadows without ink fields.
- **Gap observed:** Void canvas is present; bento seam (~8px) is looser than live’s ~1px cut; missing black featured-initiative band before Why weakens the void rhythm.

### LM-03 — Large module radii
- **Weight:** 6
- **Pass:** Primary shells (chrome, bentos, hero plane, chapters, trio cards) use large intentional radii (~16–32px+ / `rounded-2xl`–`4xl` scale); tokens `--ridge-radius-module` + `--ridge-radius-control` exist; dense controls stay small-radius.
- **Partial:** Some modules large, others default to 8–12px; or radii OK but inconsistent across chapters.
- **Fail / Deduct:** −6 if primary layout is uniform small radius; −3 if tokens missing.
- **Gap observed:** Tokens exist; computed chrome/chapter radii often sit below live’s ~27px+ bowls — silhouette feels tighter/less inflated.

### LM-04 — Dual corner language (radius + architectural notch)
- **Weight:** 10
- **Pass:** Asymmetric corners: large bowls + straight ≈45° chamfer revealing void; applied on header/hamburger, ≥1 bento, hero plane/shell, primary CTAs, ≥2 Why pillars; notch depth readable at desktop (controls ~12–24px; full-width shells proportionally larger — live-scale primary shell cuts often ≫40px, commonly ~72–136px).
- **Partial:** Notches exist but tiny, on wrong corners only, or healed by soft radius; chapter shells unclipped.
- **Fail / Deduct:** −10 if only uniform `border-radius`; −8 if notches ≤~20px on full-width shells where live uses ~72px+; −6 if Why chapter never shows a large TR/architectural bite.
- **Gap observed:** Ridge BR polygons at 18/40px vs live `corner-size` ~72–136px; Why uses BR on cards while live Why uses **TR**; Why chapter shell unclipped.

### LM-05 — Why sticky card pile + peeks (≥768px)
- **Weight:** 12
- **Pass:** Four pillars `position: sticky` with progressive `top` (~24–32px peek); z-index ascending; later cards cover earlier; pile releases after 04; peeks preserve corner language; mobile / reduced-motion → vertical list.
- **Partial:** Sticky works but peeks &lt;16px or &gt;40px, full occlusion, or flat list feel despite sticky CSS.
- **Fail / Deduct:** −12 if pillars are a normal scrolling list at desktop; −8 if no progressive peek offsets; −6 if reduced-motion still pins/stacks.
- **Gap observed:** Sticky tops ~28px (close to live ~29.5px) but peek silhouette is weak because notch language/scale is wrong; cards feel shorter / less “pinned chapter weight” than live.

### LM-06 — Why ≥1024 horizontal pull-in
- **Weight:** 10
- **Pass:** At ≥1024px each pillar is asymmetric ~2fr + ~1.2fr: bordered large-radius copy module with fluid oversized right padding (`pr-4xl` / up to ~8–10rem) beside companion media/mark column; below 1024 single-column fuller width.
- **Partial:** Two columns exist but equal padding, no bordered copy module, or media column missing/collapsed.
- **Fail / Deduct:** −10 if ≥1024 stays full-bleed single column; −6 if only max-width centering fakes inset without 2fr/1.2fr split.
- **Gap observed:** Grid + copy border + large right pad present at 1280; **media column is empty gray** — pull-in reads half-finished vs live mark/ornament column.

### LM-07 — Get started trio rise (sub-`lg`)
- **Weight:** 10
- **Pass:** In-view on &lt;1024px: each card rises from `translateY(50%)` with ease-out ≈ `cubic-bezier(0.165, 0.84, 0.44, 1)`, durations ≈2.0 / 2.4 / 2.8s; `gap-px` void seams; large radii; asymmetric right padding; notched CTAs; ≥1024 may suppress translate; reduced-motion static.
- **Partial:** Staggered fade/slide without half-height rise, or timings far off; seams wider than 1px.
- **Fail / Deduct:** −10 if static three-up on sub-`lg`; −6 if opacity-only; −4 if rise runs (or fails) incorrectly at ≥1024 vs contract.
- **Gap observed:** Motion timings/easing match; visual padding/CTA notch/hover weaker than live (`pr` ~51px vs ~96px).

### LM-08 — Global Events character scramble
- **Weight:** 10
- **Pass:** In-view one-shot per-character decoy flash → final glyphs; stagger ≈ `index * 60ms`, duration ≈ `50ms + (index+1)*75ms`; accessible name on heading; not a whole-line fade; reduced-motion shows final text immediately.
- **Partial:** Per-character opacity without decoy cycling, or scramble too slow/fast/looping, or word breaks destroy readability mid-decode.
- **Fail / Deduct:** −10 if static title / opacity-only / whole-line slide; −6 if reduced-motion still scrambles; −4 if decode leaves broken word spacing (e.g. “RI DGE”).
- **Gap observed:** Scramble runs but flex word-gap can split “RIDGE” visually during/after decode; feels less tight than live `heading-char` flash.

### LM-09 — Global Events blurb line masks
- **Weight:** 6
- **Pass:** Blurb lines in overflow-hidden wrappers; start `translateY(-100%)` (or equiv.); ease to 0 over ~2s with soft ease-out; per-line delay ~0.15s×(i+1); no opacity-only substitute; reduced-motion static.
- **Partial:** Clip present but short duration, weak travel, or single-line only when copy wraps to more.
- **Fail / Deduct:** −6 if blurb paints settled with no mask; −3 if fade-only.
- **Gap observed:** Two-line masks exist; companion event card/layout richness far below live, so the decode section still feels sparse.

### LM-10 — Hero composition (brand-first plane)
- **Weight:** 6
- **Pass:** Brand-first first viewport: mission + clock/scroll over dominant edge-to-edge visual plane; plane is paper/atmospheric with technical accents (not a small inset card); brand mark survives “remove the nav” test.
- **Partial:** Plane exists but wrong surface family (e.g. dark gradient stub) or missing scroll/clock affordances.
- **Fail / Deduct:** −6 if no dominant plane; −4 if hero is a card stack / inset media collage.
- **Gap observed:** Ridge plane is dark gradient stub vs live white sculptural plane; clock cell missing date + large diagonal arrow; mission typography hierarchy off.

### LM-11 — Hover / microinteraction fidelity on signature chrome
- **Weight:** 4
- **Pass:** Notched CTAs brighten + arrow nudge without healing chamfer; clipped shells keep notch on hover; theme toggle has short swap; focus-visible rings present.
- **Partial:** Color change only; notch disappears on hover; no focus rings.
- **Fail / Deduct:** −4 if hover removes diagonal cut; −2 if no interactive feedback on primary CTAs.
- **Gap observed:** CTA hover mostly accent fill; little/no arrow nudge; hamburger does not open a menu.

### LM-12 — Scroll physics / chapter weight
- **Weight:** 4
- **Pass:** Why chapter feels pin-heavy (sticky title + tall insight cards); stack peeks readable while scrolling; release into next section is clean; no janky jump of sticky tops.
- **Partial:** Sticky works but cards too short / peek unreadable / title doesn’t pin with pile.
- **Fail / Deduct:** −4 if scroll feels like a flat marketing page with fade-ins only.
- **Gap observed:** Shorter cards + weak TR silhouette make the pile feel lighter than live’s insight stack.

### LM-13 — Instruction stack / debrand / lab scope honesty
- **Weight:** 4
- **Pass:** Lab files are the graded surface; Ridge naming (no real-network proper nouns in UI); shape/motion contracts above are attempted in vanilla HTML/CSS/JS even if full React/Zustand PRD is out of lab scope.
- **Partial:** Minor brand leaks or missing tokens.
- **Fail / Deduct:** −4 if real-network names appear in UI; −2 if lab claims full homepage parity while omitting all signature devices.
- **Gap observed:** Debrand OK; lab correctly scopes to shape/motion but under-delivers clip scale, Why TR language, hero plane family, and events card density versus live.

---

## Quick grade sheet

| ID | Topic | W | Notes |
|----|-------|---|-------|
| LM-01 | Load entrance | 10 | |
| LM-02 | Black voids | 8 | |
| LM-03 | Radii | 6 | |
| LM-04 | Corner clips | 10 | |
| LM-05 | Why sticky peeks | 12 | |
| LM-06 | Why ≥1024 pull-in | 10 | |
| LM-07 | Trio rise | 10 | |
| LM-08 | Events scramble | 10 | |
| LM-09 | Events line masks | 6 | |
| LM-10 | Hero composition | 6 | |
| LM-11 | Hover fidelity | 4 | |
| LM-12 | Scroll weight | 4 | |
| LM-13 | Scope / debrand | 4 | |
| | **Total** | **100** | |

**Current Ridge demo (baseline from this review):** expect heavy deducts on **LM-04** (notch scale + TR), **LM-10** (dark plane), **LM-06** (empty media), **LM-02/08** (void rhythm + scramble word-gap), with **LM-05/07/01** closer to Partial than Pass.
