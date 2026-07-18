# Material Theme Studio — PRD

Clean-room rebuild of the Material-UI Theme Creator demo for local static serving.

## Goal

Single-page Material theme design tool: edit `ThemeOptions`, sync palette / fonts / typography / snippets with a Monaco editor, preview on device-framed sample sites, browse a component gallery, and persist themes in `localStorage`.

## Stack

- `index.html` + `css/studio.css` + `js/theme.js` + `js/studio.js` + `js/nav-guard.js`
- Monaco Editor (CDN), Web Font Loader (CDN), Google Fonts (Roboto + Material Icons)
- No Gatsby/webpack vendor trees

## Hard constraint

Zero navigational `<a>` affordances. Former external controls are inert buttons. `nav-guard.js` demotes anchors and blocks outbound history changes. Same-document hashes for component jump links are allowed.

## Layout

1. Header — title, version chip (inert), Tutorial, GitHub (inert)
2. Tabs — Preview · Components · Saved Themes
3. Preview — device toggles, sample site tabs, Monaco + theme tools (Palette / Fonts / Typography / Snippets)
4. Components — searchable drawer + demos (Accordion through Typography)
5. Saved Themes — localStorage list, new theme, load template

## Serve

```bash
cd variants/MaterialThemeStudio && python3 -m http.server 9303
# open http://127.0.0.1:9303/
```

## Acceptance

- Title **Material UI Theme Creator**
- Monaco shows ThemeOptions; Copy theme code works
- Palette Type Light/Dark updates preview + editor
- Color expand updates preview
- Components and Saved Themes tabs work
- `document.querySelectorAll('a').length === 0` after settle
- Inert controls do not navigate away
