# Terminal Portfolio — PRD

CLI-themed single-page designer portfolio demo rebuilt under `variants/TerminalPortfolio/`.

## Goal

Boot a terminal window, accept slash-commands, show case studies / skills / themes, and keep all link-like controls inert (no navigation).

## Constraints

- Zero navigational `<a href>` elements
- Debranded placeholders (`Your Name`, `designer@portfolio`, `hello@example.com`)
- Title updates only — no History API route rewriting
- No GTM/GA required for the demo to function

## Stack

| Path | Role |
|---|---|
| `index.html` | Shell: wallpaper, close overlay, terminal, SEO fallback |
| `assets/app.css` | Themes, chrome, cards, boot, inert-nav polish |
| `assets/app.js` | Boot, commands, easter eggs, canvas effects |
| `assets/fonts/jetbrains-mono.woff2` | Monospace face |
| `dark-theme*` | Wallpaper assets |
| `favicon.svg` | Generic YN mark |

## Serve

```bash
cd variants/TerminalPortfolio && python3 -m http.server 9306
# open http://127.0.0.1:9306/
```

## Acceptance

- Boot → Enter → ASCII name + welcome
- `/help`, `/work`, `/about`, `/themes`, minimize/maximize, close/reopen
- No `Vlad` / `Burca` / `Product Rocket` in user-facing copy
