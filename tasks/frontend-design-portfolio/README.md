# Design Portfolio (Terminal UI) — Product Requirements Document (PRD)

This PRD specifies the **exact** static debranded portfolio page delivered in this folder (`index.html`, `assets/app.css`, `assets/app.js`, wallpaper assets, fonts, favicon). An implementer or AI given only this document must be able to recreate the same page: terminal chrome, boot sequence, command system, themes, microinteractions, case-study structure, and the **no-navigation** + **debrand** constraints.

**Visual / behavioral reference (upstream):** [https://vladburca.com/](https://vladburca.com/)  
**Capture provenance:** SavePage snapshot originally saved as `Vlad Burca _ Product Designer & Design Systems Lead.html` (broken `type="text/plain"` scripts, empty `/assets/app.js`, broken font `url()`). Working local build restored from live `app.css` / `app.js` / wallpaper / font assets, then debranded.  
**Local acceptance target:** the files in this directory after path fixes, debranding, and nav removal (single-page demo; not a multi-route personal site).

---

## 1. Goal

Build a single-page **CLI-themed product designer portfolio** that:

1. Boots with a terminal boot sequence, then shows ASCII name art, welcome box, and a command input.
2. Supports slash-commands (`/help`, `/about`, `/work`, `/clients`, `/skills`, `/philosophy`, `/social`, `/articles`, `/testimonials`, `/awards`, `/contact`, `/clear`, project shortcuts, theme switches, easter eggs).
3. Preserves hover polish, titlebar window chrome (close / minimize / maximize), matrix rain, confetti, autocomplete, and theme switching.
4. Uses **generic identity placeholders** (not a real person’s branding).

Every control that looks like an external link MUST remain interactive in appearance but **must not navigate** anywhere.

---

## 2. Non-goals

- No real multi-page routing away from `index.html`.
- No authentication, backend APIs, analytics (GTM/GA), or outbound social/mail/tel navigation.
- Do not reset or touch any database.
- Do not depend on DaisyUI / MaterialUI / Shapeshift / LibreChat / other sibling folders.

---

## 3. Hard constraint: no navigational links

### MUST

- The document MUST contain **zero** navigational `<a href="...">` elements.
- Allowed `href` / `src` usages are limited to **resource loads**:
  - `<link rel="stylesheet" href="./assets/app.css">`
  - `<link rel="icon|preload" href="...">` for local assets
  - `<script src="./assets/app.js">`
  - `<img>` / `<source srcset>` wallpaper assets
  - font file under `./assets/fonts/`
- Replace former navigational links with `<button type="button" class="… inert-nav">` (or demoted social rows) that preserve look and feel.
- Clicks MUST NOT change `location` to an external origin, open new tabs, trigger `mailto:` / `tel:`, or load other HTML pages.
- Browser History URL rewriting for `/about`, `/work`, etc. MUST be disabled in the local build (title updates only) so `python3 -m http.server` keeps serving `index.html`.

### CSS support for inert controls

`assets/app.css` MUST reset UA button chrome for `button.inert-nav`, `button.close-btn`, and `button.social-link` so social rows and close-overlay CTAs still match the original link styling.

---

## 4. Debrand requirements (critical)

### MUST neutralize / replace

| Original identity cue | Local placeholder |
|---|---|
| Personal name (ASCII + titles + bios) | `Your Name` |
| Titlebar host `vlad@burca` | `designer@portfolio` |
| Email | `hello@example.com` |
| Phone | `+1 (555) 000-0000` |
| Location | `Your City, Country` |
| Agency Product Rocket / productrocket.ro | `Design Studio` / `designstudio.example` |
| Personal social URLs / handles | `#` targets demoted to buttons; handles `@yourname` / `/in/yourname` |
| Meta / OG / Twitter titles & site_name | `Your Name \| Product Designer & Design Systems Lead` |
| Personal JSON-LD Person schema | Removed |
| Personal favicons / OG image | Generic `favicon.svg` (terminal “YN” mark); no personal OG image |
| Testimonials naming the person | Quotes rewritten to “the designer” / “they”; relation lines anonymized |
| Matrix rain charset containing personal name | `DESIGNER` |
| Easter eggs (`sudo hire vlad`, `ping vlad`, …) | `sudo hire designer`, `ping designer`, … |

### MUST preserve

- Visual design system (dark terminal window, JetBrains Mono, CSS variables, themes).
- Case-study **structure** (project cards, stats, tags) — project titles may remain as generic portfolio case studies.
- Boot animation, autocomplete, history arrows, minimize/maximize wallpaper swap, confetti / matrix easter eggs.
- Command surface and interaction polish.

### Analysis integrity

Values and layout MUST be derived from the restored portfolio implementation; a static empty page is invalid. Static identity placeholders are intentional for debranding and are normative.

---

## 5. Tech stack & file layout

| Path | Role |
|---|---|
| `index.html` | Page shell: wallpaper, close overlay, terminal window, SEO fallback (visually hidden when JS runs) |
| `assets/app.css` | Full stylesheet + `@font-face` + inert-nav polish |
| `assets/app.js` | Boot, commands, themes, easter eggs, chrome interactions |
| `assets/fonts/jetbrains-mono.woff2` | Primary monospace face |
| `dark-theme-blur.{avif,webp}`, `dark-theme.{avif,webp,png}` | Wallpaper (blur = LCP; sharp lazy-loaded on minimize) |
| `favicon.svg` | Generic brand-neutral icon |
| `_source-capture.html` | Original SavePage capture (reference only; not the runtime entry) |

### Relative paths (normative)

```html
<link rel="stylesheet" href="./assets/app.css">
<script src="./assets/app.js" defer></script>
<link rel="preload" as="font" href="./assets/fonts/jetbrains-mono.woff2" crossorigin>
```

Font URLs inside CSS MUST be `url('./fonts/jetbrains-mono.woff2')` (relative to `assets/app.css`).

Serve via local HTTP:

```bash
cd DesignPortfolio && python3 -m http.server 8766
# open http://127.0.0.1:8766/
```

---

## 6. Document shell & chrome

### Wallpaper

- Fixed full-viewport `.wallpaper` with blur picture (eager) and sharp picture (lazy via `data-src` / `data-srcset`).
- Body `.minimized` swaps blur ↔ sharp; `.maximized` expands the terminal window.

### Terminal window

- macOS-style titlebar dots: red = close → show `#closeOverlay`; yellow = minimize; green = maximize.
- Title text: `designer@portfolio ~ /portfolio` (overlay: `… ~ /exit`).
- Close overlay CTAs: inert `LinkedIn` / `Instagram` buttons + `Reopen terminal`.

### Boot

- While `.booting`, show sequential boot lines ending with `designer.portfolio v10.0 — ready.`
- Enter / click / touch dismisses boot; ASCII `YOUR NAME` art appears; cookie-consent banner may appear (local-only; no GTM load).

### Input

- Prompt `>` + `#cmdInput` with autocomplete overlay.
- Slash commands executed from `assets/app.js` command tables.

---

## 7. Command surface (minimum)

MUST implement at least:

- Navigation-style: `/help`, `/about`, `/work`, `/clients`, `/skills`, `/philosophy`, `/social`, `/articles`, `/testimonials`, `/awards`, `/contact`, `/clear`
- Quick info: `/linkedin`, `/facebook`, `/instagram`, `/phone`, `/email`, `/agency`, `/location`, `/privacy` (all non-navigating)
- Project shortcuts matching the 12 featured projects
- Theme commands (`/themes` family as in upstream)
- Hidden commands / easter eggs with debranded copy (`sudo hire designer`, `ping designer`, Konami, etc.)

`/about` bio MUST use generic career framing (no personal spouse/university/agency identity).

---

## 8. SEO fallback block

`#seoFallback` remains in the DOM for crawlers / noscript, visually hidden when JS runs. Content MUST use the same debranded placeholders and MUST NOT contain navigational anchors (use inert buttons).

---

## 9. Acceptance checklist

- [ ] `python3 -m http.server` serves the page; JetBrains Mono loads; wallpaper visible
- [ ] Boot → Enter → ASCII “YOUR NAME” + welcome box
- [ ] `/help`, `/work`, `/about`, theme switch, minimize/maximize, close/reopen work
- [ ] Zero navigational `<a>` in `index.html`; social/email/phone/award rows are buttons
- [ ] No visible `Vlad`, `Burca`, `vladburca`, or `Product Rocket` strings in HTML/CSS/JS user-facing content
- [ ] Document title / meta use `Your Name | Product Designer & Design Systems Lead`
- [ ] No GTM/GA scripts required for the demo to function
