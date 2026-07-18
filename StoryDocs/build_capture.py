#!/usr/bin/env python3
"""Transform the StoryBoom SavePage capture into a debranded local StoryDocs page."""

from __future__ import annotations

import base64
import html as html_lib
import re
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / "_source-capture.html"
OUT_HTML = ROOT / "index.html"
OUT_CSS = ROOT / "assets" / "app.css"
OUT_JS = ROOT / "assets" / "app.js"
SCENES_DIR = ROOT / "assets" / "scenes"
FONTS_DIR = ROOT / "assets" / "fonts"
FAVICON = ROOT / "assets" / "favicon.svg"

# Generic product mark (clapperboard-inspired square mark — not StoryBoom)
GENERIC_LOGO_SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <rect width="64" height="64" rx="14" fill="#1a1a1a"/>
  <path d="M12 20h40v8H12z" fill="#f5c542"/>
  <path d="M18 12l6 8H18V12zm12 0l6 8h-6V12zm12 0l6 8h-6V12z" fill="#f5c542"/>
  <rect x="14" y="32" width="36" height="20" rx="3" stroke="#f5c542" stroke-width="2.5" fill="none"/>
  <circle cx="32" cy="42" r="3" fill="#f5c542"/>
</svg>"""

GENERIC_FAVICON_SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="7" fill="#1a1a1a"/>
  <path d="M6 10h20v4H6z" fill="#f5c542"/>
  <rect x="8" y="16" width="16" height="10" rx="2" stroke="#f5c542" stroke-width="1.5" fill="none"/>
</svg>"""


DEBRAND_REPLACEMENTS = [
    (r"Welcome to StoryBoom!", "Welcome to Docs!"),
    (r"how StoryBoom works", "how the product works"),
    (r"Build StoryBoom Projects", "Demo Projects"),
    (r"1\. Getting Started - StoryBoom", "1. Getting Started — Docs"),
    (r"Getting Started - StoryBoom", "Getting Started — Docs"),
    (r"StoryBoom", "Product"),
    (r"storyboom\.co", "example.com"),
    (r"storyboom\.app", "example.com"),
    (r"app\.storyboom", "app.example"),
    (r"img\.storyboom", "img.example"),
    (r"www\.storyboom", "www.example"),
]


def strip_bom(text: str) -> str:
    return text[1:] if text.startswith("\ufeff") else text


def fix_css_urls(css: str) -> str:
    """Restore empty SavePage url() stubs that still have data: in comments, keep data URLs."""

    def repl_empty(m: re.Match) -> str:
        comment_url = m.group(1).strip()
        # Prefer keeping comment for debugging but use empty — fonts already have data in next url()
        return m.group(0)

    # Pattern: /*savepage-url=...*/ url()  with empty — leave as-is if followed by data elsewhere
    # Extract Gabarito fonts to files
    def extract_font(m: re.Match) -> str:
        b64 = m.group(1)
        weight_hint = "latin" if "IzHLeME" in m.group(0) or len(b64) < 15000 else "latin-ext"
        # Actually two faces both weight 400 — use size
        name = "gabarito-400.woff2" if len(b64) < 15000 else "gabarito-400-ext.woff2"
        path = FONTS_DIR / name
        if not path.exists():
            path.write_bytes(base64.b64decode(b64))
        return f'url("./fonts/{name}")'

    css = re.sub(
        r"url\(data:font/woff2;base64,([A-Za-z0-9+/=]+)\)",
        extract_font,
        css,
        count=2,
    )
    return css


def replace_logo_var(css: str) -> str:
    b64 = base64.b64encode(GENERIC_LOGO_SVG.encode("utf-8")).decode("ascii")
    data_url = f"url(data:image/svg+xml;base64,{b64})"
    css = re.sub(
        r"(--savepage-url-6:\s*)url\([^)]+\)",
        rf"\1{data_url}",
        css,
        count=1,
    )
    return css


def extract_styles(html: str) -> tuple[str, str]:
    styles: list[str] = []

    def collect(m: re.Match) -> str:
        attrs, body = m.group(1), m.group(2)
        styles.append(body)
        return ""

    html2 = re.sub(r"<style([^>]*)>(.*?)</style>", collect, html, flags=re.I | re.S)
    css = "\n\n".join(styles)
    css = fix_css_urls(css)
    css = replace_logo_var(css)
    css += POLISH_CSS
    return html2, css


POLISH_CSS = """

/* ── Capture polish: inert nav + microinteractions ── */
button.inert-nav {
  appearance: none;
  -webkit-appearance: none;
  background: transparent;
  border: 0;
  padding: 0;
  margin: 0;
  font: inherit;
  color: inherit;
  cursor: pointer;
  text-align: inherit;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
}

a.router-link-active.inert-nav,
button.inert-nav.router-link-active {
  cursor: default;
}

button.inert-nav:focus-visible {
  outline: 2px solid #f5c542;
  outline-offset: 2px;
  border-radius: 6px;
}

.scene-item {
  transition: transform 180ms ease, box-shadow 180ms ease, opacity 180ms ease;
  will-change: transform;
}

.scene-item:hover {
  transform: translateY(-3px);
}

.scene-item .scene-image {
  transition: filter 220ms ease, transform 220ms ease;
}

.scene-item:hover .scene-image {
  filter: brightness(1.03);
}

.scene-actions {
  transition: opacity 160ms ease, transform 160ms ease;
}

.view-mode-btn.is-active,
button[aria-pressed="true"] {
  opacity: 1;
}

.storyboard-page .scenes-grid {
  transition: opacity 200ms ease;
}

.scenes-grid.is-list .scene-column {
  flex: 0 0 100% !important;
  max-width: 100% !important;
}

.scenes-grid.is-slide .scene-column {
  display: none !important;
}

.scenes-grid.is-slide .scene-column.is-slide-active {
  display: flex !important;
  flex: 0 0 100% !important;
  max-width: 720px !important;
  margin-inline: auto;
}

#capture-toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%) translateY(120%);
  background: #1a1a1a;
  color: #fff;
  padding: 10px 18px;
  border-radius: 999px;
  font-family: Gabarito, system-ui, sans-serif;
  font-size: 14px;
  letter-spacing: 0.01em;
  box-shadow: 0 8px 28px rgba(0,0,0,.25);
  z-index: 99999;
  opacity: 0;
  pointer-events: none;
  transition: transform 280ms cubic-bezier(.2,.8,.2,1), opacity 280ms ease;
}

#capture-toast.show {
  transform: translateX(-50%) translateY(0);
  opacity: 1;
}

#preloader {
  display: none !important;
}

.top .icon-sb-logo {
  transition: transform 200ms ease, filter 200ms ease;
}

.top button.inert-nav:hover .icon-sb-logo,
.top .inert-nav:hover .icon-sb-logo {
  transform: scale(1.04);
  filter: drop-shadow(0 2px 6px rgba(245, 197, 66, 0.35));
}

.v-btn {
  transition: background-color 140ms ease, transform 140ms ease, box-shadow 140ms ease;
}

.v-btn:active:not(:disabled) {
  transform: scale(0.97);
}

.scene-description {
  transition: background-color 160ms ease;
}

.scene-description:focus-within,
.scene-description.is-editing {
  background: rgba(245, 197, 66, 0.08);
  border-radius: 6px;
  outline: 1px dashed rgba(245, 197, 66, 0.45);
}
"""


def download_scenes(html: str) -> str:
    """Vendor scene thumbnails; SavePage often leaves src="" and puts the URL in data-savepage-src."""
    SCENES_DIR.mkdir(parents=True, exist_ok=True)

    def img_url(attrs: str) -> str | None:
        for pat in (
            r'data-savepage-src=(["\'])(https?://[^"\']+)\1',
            r'(?<![\w-])src=(["\'])(https?://[^"\']+)\1',
        ):
            m = re.search(pat, attrs, re.I)
            if m:
                return m.group(2)
        return None

    urls: list[str] = []
    for m in re.finditer(r"<img([^>]+)>", html, re.I):
        u = img_url(m.group(1))
        if u and u not in urls:
            urls.append(u)

    mapping: dict[str, str] = {}
    for i, url in enumerate(urls, start=1):
        ext = ".webp"
        if ".png" in url:
            ext = ".png"
        elif ".jpg" in url or ".jpeg" in url:
            ext = ".jpg"
        local_name = f"scene-{i:02d}{ext}"
        local_path = SCENES_DIR / local_name
        if not local_path.exists():
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=30) as resp:
                local_path.write_bytes(resp.read())
            print(f"  downloaded {local_name}")
        else:
            print(f"  cached {local_name}")
        mapping[url] = f"./assets/scenes/{local_name}"

    def rewrite_img(m: re.Match) -> str:
        attrs = m.group(1)
        url = img_url(attrs)
        if not url or url not in mapping:
            return m.group(0)
        local = mapping[url]
        attrs = re.sub(r'\s*data-savepage-src=(["\']).*?\1', "", attrs, flags=re.I)
        if re.search(r'(?<![\w-])src=(["\'])', attrs, re.I):
            attrs = re.sub(
                r'(?<![\w-])src=(["\'])(.*?)\1',
                f'src="{local}"',
                attrs,
                count=1,
                flags=re.I,
            )
        else:
            attrs += f' src="{local}"'
        return f"<img{attrs}>"

    return re.sub(r"<img([^>]+)>", rewrite_img, html, flags=re.I)


def debrand_text(text: str) -> str:
    for pat, repl in DEBRAND_REPLACEMENTS:
        text = re.sub(pat, repl, text, flags=re.I)
    # Case-sensitive leftovers
    text = text.replace("StoryBoom", "Product")
    text = text.replace("storyboom", "product")
    return text


def neutralize_anchors(html: str) -> str:
    """Replace anchors innermost-first so nested <a> trees stay intact."""

    def to_button(attrs_s: str, inner: str) -> str:
        attrs_s = re.sub(
            r'\s*(?:href|data-savepage-href|target|rel|download)=(["\']).*?\1',
            "",
            attrs_s,
            flags=re.I,
        )
        attrs_s = re.sub(r"\s*data-savepage-[\w-]+=([\"']).*?\1", "", attrs_s, flags=re.I)
        attrs_s = re.sub(r"\s*on\w+=([\"']).*?\1", "", attrs_s, flags=re.I)
        if re.search(r'\bclass=(["\'])', attrs_s):
            attrs_s = re.sub(
                r'\bclass=(["\'])(.*?)\1',
                lambda cm: f'class="{html_lib.escape(cm.group(2), quote=True)} inert-nav"',
                attrs_s,
                count=1,
            )
        else:
            attrs_s += ' class="inert-nav"'
        return f'<button type="button"{attrs_s}>{inner}</button>'

    # Match only anchors whose inner HTML contains no nested <a ...>
    pattern = re.compile(
        r"<a(\s[^>]*)>((?:(?!</?a\b).)*)</a>",
        flags=re.I | re.S,
    )
    for _ in range(50):
        html2, n = pattern.subn(lambda m: to_button(m.group(1), m.group(2)), html, count=20)
        html = html2
        if n == 0:
            break
    # Any leftover opening <a> (should be none) — demote to span
    if re.search(r"<a\b", html, re.I):
        html = re.sub(
            r"<a(\s[^>]*)>",
            lambda m: '<span class="inert-nav"'
            + re.sub(
                r'\s*(?:href|data-savepage-href|target|rel|download)=(["\']).*?\1',
                "",
                m.group(1),
                flags=re.I,
            )
            + ">",
            html,
            flags=re.I,
        )
        html = re.sub(r"</a>", "</span>", html, flags=re.I)
    return html


def clean_app_attrs(html: str) -> str:
    def repl_app(m: re.Match) -> str:
        return '<div id="app" data-app-theme="light" data-v-app="">'

    html = re.sub(r'<div id="app"[^>]*>', repl_app, html, count=1, flags=re.I)
    return html


def strip_scripts_and_savepage_meta(html: str) -> str:
    html = re.sub(r"<script\b[^>]*>.*?</script>", "", html, flags=re.I | re.S)
    html = re.sub(
        r'<meta[^>]+name=["\']savepage-[^"\']+["\'][^>]*>',
        "",
        html,
        flags=re.I,
    )
    # Only strip comments that contain "savepage" *inside* the comment bounds
    # (naive <!--.*?savepage.*?--> eats from the first <!-- through later savepage text)
    html = re.sub(
        r"<!--(?:(?!-->)[\s\S])*?savepage(?:(?!-->)[\s\S])*?-->",
        "",
        html,
        flags=re.I,
    )
    # Drop empty/broken icon links without href
    html = re.sub(
        r'<link[^>]+rel=["\'](?:mask-icon|apple-touch-icon|manifest)["\'][^>]*>',
        "",
        html,
        flags=re.I,
    )
    html = re.sub(r'<link[^>]+rel=["\']icon["\'][^>]*>', "", html, flags=re.I)
    html = re.sub(r'<link[^>]+rel=["\']shortcut icon["\'][^>]*>', "", html, flags=re.I)
    return html


def strip_savepage_attrs(html: str) -> str:
    html = re.sub(r"\s+data-savepage-[\w-]+=([\"']).*?\1", "", html)
    return html


def build_head() -> str:
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>1. Getting Started — Docs</title>
  <meta name="description" content="Getting started guide for a storyboard product. Learn scenes, view modes, and collaboration tools.">
  <meta name="theme-color" content="#ffffff">
  <meta property="og:type" content="website">
  <meta property="og:title" content="1. Getting Started — Docs">
  <meta property="og:description" content="Getting started guide for a storyboard product.">
  <meta property="og:site_name" content="Docs">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="1. Getting Started — Docs">
  <meta name="twitter:description" content="Getting started guide for a storyboard product.">
  <link rel="icon" type="image/svg+xml" href="./assets/favicon.svg">
  <link rel="stylesheet" href="./assets/app.css">
  <script src="./assets/app.js" defer></script>
</head>
"""


APP_JS = r"""(() => {
  "use strict";

  const toast = document.createElement("div");
  toast.id = "capture-toast";
  toast.setAttribute("role", "status");
  toast.setAttribute("aria-live", "polite");
  document.body.appendChild(toast);

  let toastTimer = 0;
  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("show"), 1600);
  }

  // Block any residual navigation
  document.addEventListener(
    "click",
    (event) => {
      const a = event.target.closest("a[href]");
      if (!a) return;
      const href = a.getAttribute("href") || "";
      if (href.startsWith("#") && href.length > 1) return;
      event.preventDefault();
      event.stopPropagation();
      showToast("Navigation disabled in this demo");
    },
    true
  );

  document.addEventListener("click", (event) => {
    const btn = event.target.closest("button.inert-nav");
    if (!btn) return;
    const label =
      btn.getAttribute("aria-label") ||
      btn.textContent.replace(/\s+/g, " ").trim().slice(0, 48) ||
      "Action";
    showToast(`${label} — demo only`);
  });

  // View mode toggles (Tile / List / Slide)
  const grid = document.querySelector(".scenes-grid");
  const viewButtons = Array.from(
    document.querySelectorAll(
      "button.inert-nav .icon-tiles, button .icon-tiles, button .icon-list, button .icon-slides"
    )
  )
    .map((icon) => icon.closest("button"))
    .filter(Boolean);

  // Fallback: find buttons near storyboard-nav by icon class on children
  const nav = document.querySelector(".storyboard-nav");
  if (nav && grid) {
    const modeButtons = Array.from(nav.querySelectorAll("button")).filter((b) =>
      b.querySelector(".icon-tiles, .icon-list, .icon-slides")
    );

    function setMode(mode) {
      grid.classList.remove("is-list", "is-slide");
      if (mode === "list") grid.classList.add("is-list");
      if (mode === "slide") {
        grid.classList.add("is-slide");
        const cols = Array.from(grid.querySelectorAll(".scene-column"));
        cols.forEach((c, i) => c.classList.toggle("is-slide-active", i === 0));
      }
      modeButtons.forEach((b) => {
        const isTiles = b.querySelector(".icon-tiles");
        const isList = b.querySelector(".icon-list");
        const isSlide = b.querySelector(".icon-slides");
        const active =
          (mode === "tile" && isTiles) ||
          (mode === "list" && isList) ||
          (mode === "slide" && isSlide);
        b.setAttribute("aria-pressed", active ? "true" : "false");
        b.classList.toggle("is-active", !!active);
      });
      showToast(
        mode === "tile" ? "Tile mode" : mode === "list" ? "List mode" : "Slide mode"
      );
    }

    modeButtons.forEach((b) => {
      b.addEventListener("click", (e) => {
        e.stopPropagation();
        if (b.querySelector(".icon-tiles")) setMode("tile");
        else if (b.querySelector(".icon-list")) setMode("list");
        else if (b.querySelector(".icon-slides")) setMode("slide");
      });
    });
    // default pressed state
    modeButtons.forEach((b) => {
      if (b.querySelector(".icon-tiles")) {
        b.setAttribute("aria-pressed", "true");
        b.classList.add("is-active");
      }
    });
  }

  // Scene description "edit" affordance
  document.querySelectorAll(".scene-description").forEach((el) => {
    el.setAttribute("tabindex", "0");
    el.addEventListener("focus", () => el.classList.add("is-editing"));
    el.addEventListener("blur", () => el.classList.remove("is-editing"));
    el.addEventListener("click", () => {
      el.classList.add("is-editing");
      showToast("Scene description — demo only");
    });
  });

  // Subtle enter animation for scenes
  const cols = document.querySelectorAll(".scene-column .scene-item");
  cols.forEach((card, i) => {
    card.style.opacity = "0";
    card.style.transform = "translateY(8px)";
    requestAnimationFrame(() => {
      setTimeout(() => {
        card.style.transition = "opacity 320ms ease, transform 320ms ease";
        card.style.opacity = "1";
        card.style.transform = "";
      }, 40 + i * 45);
    });
  });
})();
"""


def extract_body(html: str) -> str:
    m = re.search(r"(<body\b[^>]*>)(.*)(</body>)", html, flags=re.I | re.S)
    if not m:
        raise SystemExit("No <body> found in capture")
    return m.group(1) + m.group(2) + m.group(3)


def main() -> None:
    FONTS_DIR.mkdir(parents=True, exist_ok=True)
    SCENES_DIR.mkdir(parents=True, exist_ok=True)
    FAVICON.write_text(GENERIC_FAVICON_SVG, encoding="utf-8")

    raw = strip_bom(SOURCE.read_text(encoding="utf-8", errors="replace"))
    print("Extracting styles…")
    html, css = extract_styles(raw)
    OUT_CSS.write_text(css, encoding="utf-8")
    print(f"  wrote {OUT_CSS.relative_to(ROOT)} ({len(css):,} bytes)")

    print("Downloading scene images…")
    html = download_scenes(html)

    print("Cleaning HTML…")
    html = strip_scripts_and_savepage_meta(html)
    body = extract_body(html)
    body = clean_app_attrs(body)
    body = strip_savepage_attrs(body)
    body = neutralize_anchors(body)
    body = debrand_text(body)

    # Safety: remove any remaining auth/token-looking blobs in attributes
    body = re.sub(r'\sdata-token="[^"]*"', "", body)
    body = re.sub(r'\sdata-url-[a-z-]+="[^"]*"', "", body)

    out = build_head() + body + "\n</html>\n"
    out = debrand_text(out)

    # Final brand sweep on whole document
    if re.search(r"storyboom", out, re.I):
        # Keep CSS class icon-sb-logo (not user-visible); scrub everything else
        leftovers = sorted(set(re.findall(r".{0,30}[Ss]tory[Bb]oom.{0,30}", out)))
        for hit in leftovers:
            if "icon-sb-logo" in hit or "icon-sb-" in hit:
                continue
            print("WARNING leftover:", repr(hit)[:120])

    OUT_HTML.write_text(out, encoding="utf-8")
    OUT_JS.write_text(APP_JS, encoding="utf-8")
    print(f"  wrote {OUT_HTML.relative_to(ROOT)} ({len(out):,} bytes)")
    print(f"  wrote {OUT_JS.relative_to(ROOT)}")

    # Replace vendored thumbnails with debranded instructional art
    # (original CDN frames contain product wordmarks / mascot marks)
    print("Generating debranded scene art…")
    import generate_scenes

    generate_scenes.main()

    # Verify no user-visible StoryBoom in text nodes roughly
    visible = re.sub(r"<[^>]+>", " ", out)
    if re.search(r"storyboom", visible, re.I):
        print("FAIL: visible StoryBoom remains")
        for m in re.finditer(r".{0,40}[Ss]tory[Bb]oom.{0,40}", visible):
            print(" ", m.group(0))
        raise SystemExit(1)
    print("OK: no visible StoryBoom strings")


if __name__ == "__main__":
    main()
