# Material-UI Theme Creator — Product Requirements Document (PRD)

This PRD specifies the **exact** static Material-UI Theme Creator page delivered in this folder (`index.html`, vendored Gatsby/webpack assets, `theme-creator.css`, `theme-creator.js`). An implementer or AI given only this document must be able to recreate the same page: layout, copy, theme tooling, Monaco editor, previews, component gallery, saved themes, microinteractions, and the **no-navigation** constraint.

**Visual / behavioral reference:** [https://bareynol.github.io/mui-theme-creator/](https://bareynol.github.io/mui-theme-creator/)  
**Upstream project:** [https://github.com/bareynol/mui-theme-creator](https://github.com/bareynol/mui-theme-creator) (Gatsby static export on `gh-pages`)  
**Capture provenance:** SavePage snapshot originally saved as `Material UI Theme Creator.html` (meta `savepage-url` = the live URL above). The working local build is restored from the live `gh-pages` assets because SavePage left scripts as non-executable `type="text/plain"` and broke webpack chunk loading.  
**Local acceptance target:** the files in this directory after path-prefix rewrite, CSS extraction, nav removal, and polish (single-page shell; not a multi-route product site).

---

## 1. Goal

Build a single-page **Material-UI (v4) theme design tool** that lets a developer:

1. Edit `ThemeOptions` in a Monaco editor with IntelliSense for Material-UI theme types.
2. Configure palette / fonts / typography / snippets via side tools that stay in sync with the editor.
3. Preview the theme on sample site templates (phone / tablet / desktop) and on a full component gallery.
4. Persist multiple themes in `localStorage` and switch / load templates.
5. Copy / export theme code.

Every control that looks like an external or marketing link MUST remain interactive in appearance (hover, focus, cursor, MUI ripple where applicable) but **must not navigate** anywhere.

---

## 2. Non-goals

- No real multi-page routing away from this tool (Preview / Components / Saved Themes are in-app tabs only).
- No authentication, backend APIs, or server-side theme persistence.
- No outbound navigation to Material-UI docs, GitHub, Google Fonts marketing pages, Monaco docs, Web Font Loader docs, or GitLab issues.
- Do not reset or touch any database.
- Do not depend on the parallel DaisyUI / theme-generator work in sibling folders.

---

## 3. Hard constraint: no navigational links

### MUST

- At runtime the document MUST contain **zero** `<a>` elements used as navigational affordances (including MUI `<Link>` rendered as `<a>` with or without `href`).
- Allowed `href` / `src` usages are limited to **resource loads**:
  - `<link rel="stylesheet" href="...">` (local CSS + Google Fonts CSS)
  - `<link rel="icon|manifest|apple-touch-icon" href="...">`
  - `<link rel="preload" as="script|fetch|style" href="...">`
  - `<script src="...">` for local webpack bundles and `theme-creator.js`
  - `<img src>` / font files under `./static/`, `./icons/`, etc.
- Replace every former navigational link with a non-navigating control that preserves look and feel:
  - Header version chip `@material-ui/core@^4.11.0` → `<button type="button" class="... inert-nav">`
  - Header GitHub icon button → `<button type="button" class="MuiIconButton-root ... inert-nav">`
  - Inline text links (Google Fonts, Monaco Editor, Web Font Loader, “Check out the Tutorial!”, “Open an issue on Gitlab!”, per-component “Docs”) → `<button type="button" class="MuiLink-root ... inert-nav">` (or demoted at runtime)
- Clicks on these controls MUST NOT change `location` to an external origin, open new tabs, or load other HTML pages.
- Same-document hash updates used by the in-app component drawer (e.g. `#Accordion`) MAY update `location.hash` without leaving the page.

### Runtime enforcement (required)

Ship `theme-creator.js` that:

1. Uses a capturing `click` listener to `preventDefault` on navigational anchors.
2. Overrides `history.pushState` / `history.replaceState` to ignore URLs that leave the current origin+pathname.
3. Uses a `MutationObserver` to demote every `<a>` (including href-less MUI Links) to `<button type="button" class="… inert-nav">`, copying classes/attrs (except `href` / `target` / `rel` / `download`).
4. Unregisters any service workers left over from the upstream Gatsby PWA.

### CSS support for inert controls

`theme-creator.css` MUST reset UA button chrome for `button.inert-nav` / demoted MUI links so hover underline and IconButton layout still match Material-UI:

- `appearance: none`, transparent background, no border, inherit font/color, `cursor: pointer`
- IconButton demotions keep `inline-flex` centering
- Subtle hover brightness on `.MuiButtonBase-root` and accordion summary hover wash

---

## 4. Tech stack & file layout

| Path | Role |
|------|------|
| `index.html` | Gatsby shell: meta, CSS/JS preloads, `#___gatsby` mount, chunk mapping |
| `theme-creator.css` | Local polish + inert-nav styles |
| `theme-creator.js` | No-nav guard + MutationObserver demotion |
| `styles.f7f68e4b072c4ce653c4.css` | Extracted Monaco / app static CSS (was inlined `style[data-href]` in upstream HTML) |
| `styles-*.js`, `app-*.js`, `framework-*.js`, `webpack-runtime-*.js`, `component---src-pages-index-tsx-*.js`, hashed chunks | Vendored Gatsby/webpack runtime (Material-UI v4 app + Monaco) |
| `page-data/` | Gatsby `app-data.json` + `index/page-data.json` |
| `static/`, `icons/`, favicons, `manifest.webmanifest` | Images, codicon font, PWA icons |
| `_source-capture.html` | Original SavePage capture copied from Downloads (reference only; not the runtime entry) |

### Stack (normative)

- **UI library:** `@material-ui/core@^4.11.0` (JSS runtime styles)
- **App shell:** Gatsby 2.x client runtime (`___gatsby`, `window.___chunkMapping`, `window.pagePath="/"`)
- **Editor:** Monaco Editor with Material-UI `ThemeOptions` IntelliSense
- **Fonts:** Google Fonts CSS for Roboto; Web Font Loader for user-added fonts from the Fonts tool
- **Persistence:** `localStorage` for saved themes
- **Path prefix:** upstream used `/mui-theme-creator/`; local build MUST rewrite publicPath / `withPrefix` / chunk URLs so assets resolve from the folder root when served over HTTP

### External resource URLs allowed

- `https://fonts.googleapis.com/css?family=Roboto&display=swap` (and Web Font Loader–requested Google Fonts CSS)
- Preview sample media from `https://material-ui.com/static/images/...` (avatars, card media) as used by upstream demos

Prefer **relative** local paths (`./styles….css`, `./theme-creator.js`, `./app-….js`).

Serve via local HTTP when verifying (webpack chunks + modules):

```bash
cd MaterialUI && python3 -m http.server 8877
# open http://127.0.0.1:8877/
```

Do **not** rely on `file://` — chunk loading and Google Fonts will fail.

---

## 5. Document shell

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
  <title>Material UI Theme Creator</title>
  <meta name="description" content="Kick off your next, great Material-UI project with a customized theme." />
  <link rel="stylesheet" href="./styles.f7f68e4b072c4ce653c4.css" />
  <link rel="stylesheet" href="./theme-creator.css" />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto&display=swap" />
  <!-- favicons / manifest / webpack preloads / page-data preloads -->
  <script src="./theme-creator.js" defer></script>
</head>
<body>
  <div id="___gatsby"></div>
  <!-- gatsby-script-loader, gatsby-chunk-mapping, webpack entry scripts -->
</body>
</html>
```

- Root mount is empty until React hydrates (SSR body is not required).
- `window.pagePath` MUST be `"/"`.
- Webpack `publicPath` MUST be `"/"` when this folder is the HTTP server root.

---

## 6. Layout architecture

Full viewport app (`body` / `#___gatsby` height 100%; `overflow: hidden` on body per upstream CSS).

### 6.1 App header (top)

Left:

- Title: **Material-UI Theme Creator** (`Typography` h6)
- Subline: `└─` + version affordance **@material-ui/core@^4.11.0** (inert; was external link to material-ui.com)

Right:

- **Tutorial** text button (opens in-app tutorial modal / flow — not an external nav)
- GitHub icon `IconButton` (inert; was repo link)

### 6.2 Main tab bar

Under the header, Material logo + tabs:

| Tab | Purpose |
|-----|---------|
| **Preview** | Device-framed site templates showing the live theme |
| **Components** | Scrollable gallery of Material-UI components + left drawer jump list |
| **Saved Themes** | Switch between saved themes / templates |

Tabs use MUI `Tabs` / `Tab` with primary-colored indicator. Selecting a tab MUST NOT leave the page.

### 6.3 Preview tab layout

Three-column / split composition matching the live product:

1. **Left — preview stage**
   - Device chrome toggles: Phone / Tablet / Desktop
   - Nested sample site with its own AppBar, search, and sample tabs: Instructions · Sign Up · Dashboard · Blog · Pricing · Checkout
   - Instructions content includes “Editor Usage”, Theme Tools list (Palette / Fonts / Typography), Tabs explanation, Features (Monaco, Saved Themes, Web Font Loader, Snippets)
2. **Right-top — Monaco editor**
   - Shows generated TypeScript `ThemeOptions` module
   - Toolbar: Editor Settings, **Copy theme code**, undo / redo, save
   - Status: “All changes saved” when in sync
3. **Right-bottom — Theme tools panel**
   - Bottom nav: **Palette** · **Fonts** · **Typography** · **Snippets**
   - Active tool renders accordion-style editors (see §8)

### 6.4 Components tab layout

- Left drawer: searchable list of component sections (open drawer control + Search…)
- Main column: stacked component demos with “Docs” affordances (inert buttons)
- Hash deep-links (e.g. `#Accordion`) scroll/select sections without leaving the document

### 6.5 Saved Themes tab

- List of themes stored in `localStorage`
- Ability to load templates / switch active theme
- Persists across reloads in the same browser profile

---

## 7. Theme APIs & editor contract

### 7.1 Editor output shape (normative example)

The Monaco model MUST present Material-UI v4 `ThemeOptions` TypeScript of the form:

```ts
import { ThemeOptions } from '@material-ui/core/styles/createMuiTheme';

export const themeOptions: ThemeOptions = {
  palette: {
    type: 'light', // or 'dark'
    primary: { main: '#3f51b5' },
    secondary: { main: '#f50057' },
    // …additional palette / typography / overrides as edited
  },
};
```

### 7.2 Bidirectional sync

- Edits in Palette / Fonts / Typography / Snippets tools MUST update the Monaco model.
- Valid edits in Monaco MUST update the live `MuiThemeProvider` preview and tool controls.
- Invalid editor content MUST surface Monaco diagnostics without crashing the shell.

### 7.3 Copy / export

- **Copy theme code** MUST copy the current editor contents to the clipboard (or show the upstream copy success UX).
- Undo / redo MUST track editor history; disabled states when history is empty.

### 7.4 IntelliSense

- Ctrl/Cmd+Space suggestions MUST include Material-UI `ThemeOptions` fields (upstream packed type data).

---

## 8. Theme tools (right panel)

### 8.1 Palette

Accordion rows (expand/collapse with chevron), each showing color swatches:

| Row | Behavior |
|-----|----------|
| **Type** | Light / Dark switch; toggles `palette.type` and preview surfaces |
| **Background** | default / paper (and related) swatches + color pickers when expanded |
| **Text** | primary / secondary / disabled / hint swatches |
| **primary** | main / light / dark / contrastText |
| **secondary** | main / light / dark / contrastText |
| **error** | status palette |
| **warning** | status palette |
| **info** | status palette |
| **success** | status palette |
| **Divider** | divider color |

Color pickers MUST open on expand and update preview + editor live. Hover on accordion summaries SHOULD show a subtle highlight.

### 8.2 Fonts

- Add Google Fonts by name via Web Font Loader.
- Loaded fonts become available to Typography controls and preview text.

### 8.3 Typography

- Configure font families, sizes, and related typography options for preview typography variants.

### 8.4 Snippets

- Apply built-in global style / default-option snippets to the theme.
- Snippet marketing CTAs (e.g. “Open an issue on Gitlab!”) are inert.

---

## 9. Component gallery inventory (Components tab)

The Components drawer / page MUST include sections for at least:

Accordion · App Bar · Avatar · Badge · Bottom Navigation · Buttons · Card · Checkboxes · Chip · Dialog · Floating Action Button · Icon · List · Menu · Progress · Radio · Select · Slider · Snackbar · Stepper · Switch · Table · Tabs · TextField · Tooltip · Typography

Each section shows representative Material-UI demos themed by the current `ThemeOptions`. “Docs” controls are inert (no navigation to material-ui.com).

---

## 10. Microinteractions & polish

- MUI ButtonBase ripples on press where upstream provides them.
- Tab indicator animation when switching Preview / Components / Saved Themes.
- Accordion expand/collapse for palette rows.
- Device frame switching (Phone / Tablet / Desktop) updates preview chrome without reload.
- Hover tooltips / overlay info on preview components (upstream “hover for information” behavior).
- Tutorial button opens the in-app tutorial experience without leaving the page.
- After nav demotion, inert controls MUST still show pointer cursor and MUI hover/focus styles.

---

## 11. SavePage / offline repair requirements

If starting from a browser “Save Page” HTML capture, the implementer MUST:

1. Identify the canonical URL from `meta[name=savepage-url]` / comments / `data-savepage-href` (here: `https://bareynol.github.io/mui-theme-creator/`).
2. Reject non-executable scripts (`type="text/plain"`, empty `data-savepage-src` bodies) as insufficient for a working app.
3. Vendor the matching Gatsby `gh-pages` runtime (webpack chunks, `page-data`, static assets) OR restore equivalent CDN URLs that match the live site hashes.
4. Extract large inlined `style[data-href]` CSS into `styles.*.css` and link it relatively.
5. Rewrite `/mui-theme-creator` path prefixes for local root serving.
6. Keep a copy of the original capture in-folder (`_source-capture.html`) without deleting the user’s Downloads original.
7. Apply the no-nav constraint (§3) on both SSR HTML (if any) and React-rendered DOM.

---

## 12. Acceptance criteria

1. `python3 -m http.server` from `MaterialUI/` loads `http://127.0.0.1:<port>/` with title **Material UI Theme Creator**.
2. Monaco editor visible with `ThemeOptions` source; **Copy theme code** works.
3. Palette **Type** Light/Dark switch updates preview surfaces and editor (`palette.type`).
4. Expanding primary/secondary (etc.) reveals color controls that update the preview.
5. Preview tab shows sample site; Components tab shows Accordion and other demos; Saved Themes tab is reachable.
6. Runtime `document.querySelectorAll('a').length === 0` after hydration + observer settle (resource `<link>`/`<script>` only).
7. Clicking former external affordances (version string, GitHub icon, Google Fonts, Docs, Gitlab CTA) does not navigate away.
8. Google Fonts Roboto loads (network permitting); layout matches the live reference closely.
9. Folder is independent of `DaisyUI/` — no shared write conflicts.
10. `README.md` (this PRD) is present; no extra unsolicited documentation files.

---

## 13. Verify steps

```bash
cd /Users/kurrytran/frontend-repository/MaterialUI
python3 -m http.server 8877
# Browser: http://127.0.0.1:8877/
# Check: tabs, dark toggle, color expand, copy, Components → Accordion
# DevTools: document.querySelectorAll('a').length === 0
```
