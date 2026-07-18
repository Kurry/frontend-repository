#!/usr/bin/env python3
"""Transform Wanderlog SavePage capture into a debranded local TripItinerary page."""

from __future__ import annotations

import base64
import html as html_lib
import re
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / "_source-capture.html"
OUT_HTML = ROOT / "index.html"
OUT_CSS = ROOT / "css" / "styles.css"
OUT_INLINE_CSS = ROOT / "css" / "capture-inline.css"
OUT_JS = ROOT / "js" / "app.js"
VENDOR_CSS = ROOT / "vendor" / "css"
ASSETS = ROOT / "assets"
FAVICON = ASSETS / "favicon.svg"
LOGO = ASSETS / "logo.svg"

UA = {"User-Agent": "Mozilla/5.0 (compatible; TripItineraryBuild/1.0)"}

DEBRAND_REPLACEMENTS = [
    (r"Trip to the French Riviera - Cote d'Azur – Wanderlog", "Trip to the French Riviera — Côte d'Azur"),
    (r"Trip to the French Riviera - Cote d'Azur – Wanderlog", "Trip to the French Riviera — Côte d'Azur"),
    (r"Trip to the French Riviera - Cote d'Azur - Wanderlog", "Trip to the French Riviera — Côte d'Azur"),
    (r"Popular guide by a Wanderlog community member", "Popular community travel guide"),
    (r"I'm Harry, co-founder of Wanderlog: how can I help\?", "Travel support demo — how can I help?"),
    (r"Wanderlog support", "Travel support"),
    (r"Or get in touch with the Wanderlog team at", "Or get in touch at"),
    (r"support@wanderlog\.com", "support@example.com"),
    (r"wanderlog\.com", "example.com"),
    (r"Wanderlog", "Trip"),
    (r"wanderlog", "trip"),
]

SKIP_STYLE_HREF_PATTERNS = [
    r"tiledesk",
    r"widget\.tiledesk",
]

SKIP_INLINE_STYLE_HINTS = [
    "tiledesk",
    "chat21",
    "c21-",
    "eye-catcher",
    "messagePreviewHeight",
    "LGLeeN-keyboard-shortcuts",
]


def strip_bom(text: str) -> str:
    return text[1:] if text.startswith("\ufeff") else text


def fetch(url: str, dest: Path) -> bool:
    if dest.exists() and dest.stat().st_size > 0:
        print(f"  cached {dest.name}")
        return True
    try:
        req = urllib.request.Request(url, headers=UA)
        with urllib.request.urlopen(req, timeout=45) as resp:
            dest.write_bytes(resp.read())
        print(f"  downloaded {dest.name} ({dest.stat().st_size} bytes)")
        return True
    except Exception as exc:  # noqa: BLE001
        print(f"  FAIL {url}: {exc}")
        return False


def fix_savepage_css_urls(css: str) -> str:
    """Restore /*savepage-url=...*/ url() stubs to real url(...)."""

    def repl(m: re.Match) -> str:
        url = m.group(1).strip()
        if url.startswith("//"):
            url = "https:" + url
        return f'url("{url}")'

    css = re.sub(r"/\*savepage-url=([^*]+)\*/\s*url\(\)", repl, css)
    # Also handle url(/*savepage-url=...*/) empty patterns already covered
    return css


def download_vendor_css(html: str) -> list[str]:
    VENDOR_CSS.mkdir(parents=True, exist_ok=True)
    local_hrefs: list[str] = []
    seen: set[str] = set()

    for m in re.finditer(r"<link([^>]+)>", html, re.I):
        attrs = m.group(1)
        if not re.search(r'rel=["\']stylesheet["\']', attrs, re.I):
            continue
        hm = re.search(r'href=["\']([^"\']+)["\']', attrs, re.I)
        if not hm:
            continue
        href = hm.group(1)
        if href.startswith("data:"):
            continue
        if any(re.search(p, href, re.I) for p in SKIP_STYLE_HREF_PATTERNS):
            continue
        if "fonts.googleapis.com" in href:
            # Keep as remote font CSS (resolved later as dedicated link)
            continue
        if "itin-compiled.azureedge.net" not in href and not href.endswith(".css"):
            continue
        if href in seen:
            continue
        seen.add(href)
        name = href.rstrip("/").split("/")[-1].split("?")[0]
        if not name.endswith(".css"):
            name = re.sub(r"[^a-zA-Z0-9._-]+", "_", name) + ".css"
        dest = VENDOR_CSS / name
        if href.startswith("http"):
            fetch(href, dest)
            local_hrefs.append(f"./vendor/css/{name}")
    return local_hrefs


def extract_inline_styles(html: str) -> tuple[str, str]:
    chunks: list[str] = []

    def collect(m: re.Match) -> str:
        attrs, body = m.group(1), m.group(2)
        blob = (attrs + body).lower()
        if any(h in blob for h in SKIP_INLINE_STYLE_HINTS):
            return ""
        if "savepage-cssvariables" in attrs and not body.strip():
            return ""
        # Skip huge empty-broken google-sans face blocks; fonts loaded via link
        if "font-family: 'Google Sans'" in body or 'font-family: "Google Sans"' in body:
            if "savepage-url" in body and "url()" in body:
                return ""
        if "font-family: 'Google Sans Text'" in body and "url()" in body:
            return ""
        if "font-family: 'Source Sans Pro'" in body and "url()" in body:
            # Prefer google fonts link
            return ""
        if "font-family: 'Roboto'" in body and "url()" in body:
            return ""
        fixed = fix_savepage_css_urls(body)
        if fixed.strip():
            chunks.append(fixed)
        return ""

    html2 = re.sub(r"<style([^>]*)>(.*?)</style>", collect, html, flags=re.I | re.S)
    return html2, "\n\n".join(chunks)


def strip_scripts(html: str) -> str:
    html = re.sub(r"<script\b[^>]*>.*?</script>", "", html, flags=re.I | re.S)
    html = re.sub(r"<noscript\b[^>]*>.*?</noscript>", "", html, flags=re.I | re.S)
    return html


def strip_chat_and_tracking(html: str) -> str:
    # Tiledesk / chat21 widgets (support chat)
    html = re.sub(
        r'<div[^>]*(?:tiledesk|chat21|c21-launcher|Chat21)[^>]*>.*?</div>',
        "",
        html,
        flags=re.I | re.S,
    )
    # iframe trackers
    html = re.sub(r"<iframe\b[^>]*>.*?</iframe>", "", html, flags=re.I | re.S)
    html = re.sub(r"<iframe\b[^>]*/>", "", html, flags=re.I)
    return html


def strip_head_junk(html: str) -> str:
    # Remove existing head link/meta/title — we rebuild head
    # Keep body only
    m = re.search(r"<body([^>]*)>(.*)</body>", html, re.I | re.S)
    if not m:
        raise SystemExit("No <body> found in capture")
    body_attrs, body = m.group(1), m.group(2)
    return f"<body{body_attrs}>{body}</body>"


def neutralize_anchors(html: str) -> str:
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

    pattern = re.compile(
        r"<a(\s[^>]*)>((?:(?!</?a\b).)*)</a>",
        flags=re.I | re.S,
    )
    for _ in range(80):
        html2, n = pattern.subn(lambda m: to_button(m.group(1), m.group(2)), html, count=40)
        html = html2
        if n == 0:
            break
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


def debrand_text(text: str) -> str:
    for pat, repl in DEBRAND_REPLACEMENTS:
        text = re.sub(pat, repl, text, flags=re.I)
    return text


def replace_logos(html: str) -> str:
    """Swap Wanderlog logo imgs for local SVG."""

    def repl_img(m: re.Match) -> str:
        attrs = m.group(1)
        src_m = re.search(r'\ssrc=(["\'])(.*?)\1', attrs, flags=re.I)
        src = src_m.group(2) if src_m else ""
        # Navbar Logo__* and alt Trip/Wanderlog, plus hotel-card "Site icon" W mark
        is_brand = (
            re.search(r'alt=["\'](?:Wanderlog|Trip)["\']', attrs, re.I)
            or "Logo__logo" in attrs
            or (
                re.search(r'alt=["\']Site icon["\']', attrs, re.I)
                and "ImageBubble" in attrs
                and src.startswith("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAMAAAD04JH5")
            )
        )
        if is_brand:
            attrs = re.sub(r'\s*src=(["\']).*?\1', "", attrs, flags=re.I)
            attrs = re.sub(r"\s*data-savepage-[\w-]+=([\"']).*?\1", "", attrs, flags=re.I)
            attrs = re.sub(r'\s*srcset=(["\']).*?\1', "", attrs, flags=re.I)
            if not re.search(r'\balt=', attrs, re.I):
                attrs += ' alt="Trip"'
            elif re.search(r'alt=["\'](?:Wanderlog|Trip)["\']', attrs, re.I):
                attrs = re.sub(r'\balt=(["\']).*?\1', 'alt="Trip"', attrs, count=1, flags=re.I)
            return f'<img{attrs} src="./assets/logo.svg">'
        return m.group(0)

    html = re.sub(r"<img([^>]+)>", repl_img, html, flags=re.I)
    return html


def restore_image_srcs(html: str) -> str:
    """Prefer data: src; else restore http from data-savepage-src when src empty."""

    def rewrite(m: re.Match) -> str:
        attrs = m.group(1)
        sm = re.search(r'(?<![\w-])src=(["\'])(.*?)\1', attrs, re.I)
        src = sm.group(2) if sm else ""
        sp = re.search(r'data-savepage-src=(["\'])(.*?)\1', attrs, re.I)
        sp_src = sp.group(2) if sp else ""
        cur = re.search(r'data-savepage-currentsrc=(["\'])(.*?)\1', attrs, re.I)
        cur_src = cur.group(2) if cur else ""

        chosen = src
        if (not chosen or chosen.startswith("about:")) and cur_src.startswith("http"):
            chosen = cur_src
        elif (not chosen or chosen.startswith("about:")) and sp_src.startswith("http"):
            chosen = sp_src
        elif (not chosen or chosen.startswith("about:")) and sp_src.startswith("/"):
            # relative wanderlog assets — skip brand assets
            if "logo" not in sp_src.lower() and "favicon" not in sp_src.lower():
                chosen = "https://wanderlog.com" + sp_src

        if not chosen:
            return m.group(0)

        attrs = re.sub(r"\s*data-savepage-[\w-]+=([\"']).*?\1", "", attrs, flags=re.I)
        if sm:
            attrs = re.sub(
                r'(?<![\w-])src=(["\'])(.*?)\1',
                f'src="{html_lib.escape(chosen, quote=True)}"',
                attrs,
                count=1,
                flags=re.I,
            )
        else:
            attrs += f' src="{html_lib.escape(chosen, quote=True)}"'
        return f"<img{attrs}>"

    return re.sub(r"<img([^>]+)>", rewrite, html, flags=re.I)


def strip_savepage_attrs(html: str) -> str:
    html = re.sub(r"\s+data-savepage-[\w-]+=([\"']).*?\1", "", html)
    html = re.sub(
        r"<!--(?:(?!-->)[\s\S])*?savepage(?:(?!-->)[\s\S])*?-->",
        "",
        html,
        flags=re.I,
    )
    html = re.sub(r'<meta[^>]+name=["\']savepage-[^"\']+["\'][^>]*>', "", html, flags=re.I)
    return html


def hide_support_widgets_css() -> str:
    return """
/* ── Capture polish + debrand chrome ── */
button.inert-nav,
span.inert-nav {
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
  display: inline;
  max-width: 100%;
}

a.SiteNavbarBrand.inert-nav,
button.SiteNavbarBrand.inert-nav,
button.navbar-brand.inert-nav {
  display: inline-flex;
  align-items: center;
}

button.inert-nav:focus-visible {
  outline: 2px solid #1B4D6E;
  outline-offset: 2px;
  border-radius: 6px;
}

button.inert-nav:hover {
  opacity: 0.92;
}

button.Button:active:not(:disabled),
button.inert-nav:active {
  transform: scale(0.98);
  transition: transform 120ms ease;
}

.Logo__logoMd,
img[alt="Trip"].Logo__logoMd {
  height: 28px;
  width: auto;
  max-width: 120px;
  object-fit: contain;
}

/* Hide chat / support / marketing chrome that is brand-heavy or non-functional offline */
[class*="tiledesk"],
[class*="Tiledesk"],
[class*="chat21"],
[class*="Chat21"],
[id*="tiledesk"],
[id*="chat21"],
[class*="assistantFloating"],
.PlanPageOrPlacesList__assistantFloatingButtonContainer,
iframe,
#c21-launcher-button,
.start-animation {
  display: none !important;
}

#capture-toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%) translateY(120%);
  background: #1B4D6E;
  color: #fff;
  padding: 10px 18px;
  border-radius: 999px;
  font-family: "Source Sans Pro", system-ui, sans-serif;
  font-size: 14px;
  letter-spacing: 0.01em;
  box-shadow: 0 8px 28px rgba(27, 77, 110, 0.35);
  z-index: 99999;
  opacity: 0;
  pointer-events: none;
  transition: transform 280ms cubic-bezier(.2,.8,.2,1), opacity 280ms ease;
}

#capture-toast.show {
  transform: translateX(-50%) translateY(0);
  opacity: 1;
}

/* Soften map empty tiles when Google Maps JS is absent */
.gm-style {
  background: linear-gradient(160deg, #d7e8ef 0%, #f4f7f9 55%, #e8f0f4 100%) !important;
}

/* Demote paywall / PRO marketing chrome in the static demo */
.Badge__yellowWithWhiteText,
[class*="ProBadge"],
[class*="proBadge"],
[class*="Upgrade"],
.Badge__pro {
  display: none !important;
}

@media (prefers-reduced-motion: reduce) {
  #capture-toast,
  button.Button,
  button.inert-nav {
    transition: none !important;
  }
}
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

  document.addEventListener(
    "click",
    (event) => {
      const a = event.target.closest("a[href]");
      if (!a) return;
      const href = a.getAttribute("href") || "";
      if (href.startsWith("#") && href.length > 1) {
        const id = href.slice(1);
        const el = document.getElementById(id);
        if (el) {
          event.preventDefault();
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        return;
      }
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

  // Tab-like itinerary chrome: soft active state on sidebar buttons when clicked
  document.addEventListener("click", (event) => {
    const btn = event.target.closest(
      ".PlanPageSidebar button, .Sidebar button, button[role='tab']"
    );
    if (!btn || btn.classList.contains("inert-nav") === false && !btn.closest(".PlanPageSidebar, .Sidebar")) {
      // still allow
    }
    if (!btn) return;
    const group = btn.closest(".PlanPageSidebar, .Sidebar, [role='tablist']");
    if (!group) return;
    group.querySelectorAll("button").forEach((b) => {
      b.classList.remove("is-demo-active");
      b.setAttribute("aria-pressed", "false");
    });
    btn.classList.add("is-demo-active");
    btn.setAttribute("aria-pressed", "true");
  });

  // Smooth hover lift on place cards
  const style = document.createElement("style");
  style.textContent = `
    .PlaceCard, .place-card, [class*="CarouselCard"], [class*="PlaceListItem"] {
      transition: transform 180ms ease, box-shadow 180ms ease;
    }
    .PlaceCard:hover, [class*="CarouselCard"]:hover, [class*="PlaceListItem"]:hover {
      transform: translateY(-2px);
    }
    button.is-demo-active {
      opacity: 1;
      font-weight: 700;
    }
    .PlanPageHeader__title.HoverTextInput__input,
    input.PlanPageHeader__title {
      text-align: left !important;
      text-indent: 0 !important;
    }
  `;
  document.head.appendChild(style);

  // Ensure trip title input shows from the start (SavePage often leaves it scrolled)
  document.querySelectorAll("input.PlanPageHeader__title").forEach((input) => {
    input.scrollLeft = 0;
    input.setSelectionRange(0, 0);
  });
})();
"""


def build_head(vendor_css: list[str]) -> str:
    links = "\n".join(f'  <link rel="stylesheet" href="{href}">' for href in vendor_css)
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Trip to the French Riviera — Côte d'Azur | Travel Planner</title>
  <meta name="description" content="A debranded travel itinerary planner demo for a French Riviera trip — places, map, budgeting, and day planning.">
  <meta name="theme-color" content="#1B4D6E">
  <meta property="og:type" content="website">
  <meta property="og:title" content="Trip to the French Riviera — Côte d'Azur">
  <meta property="og:description" content="Travel itinerary planner demo for the French Riviera.">
  <meta property="og:site_name" content="Travel Planner">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="Trip to the French Riviera — Côte d'Azur">
  <meta name="twitter:description" content="Travel itinerary planner demo for the French Riviera.">
  <link rel="icon" type="image/svg+xml" href="./assets/favicon.svg">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Source+Sans+Pro:400,700,900&display=swap">
{links}
  <link rel="stylesheet" href="./css/capture-inline.css">
  <link rel="stylesheet" href="./css/styles.css">
  <script src="./js/app.js" defer></script>
</head>
"""


def main() -> None:
    print("Reading source…")
    html = strip_bom(SOURCE.read_text(encoding="utf-8", errors="replace"))

    print("Downloading vendor CSS…")
    vendor_hrefs = download_vendor_css(html)

    print("Extracting inline styles…")
    html, inline_css = extract_inline_styles(html)
    inline_css = fix_savepage_css_urls(inline_css)

    print("Stripping scripts / chat / tracking…")
    html = strip_scripts(html)
    html = strip_chat_and_tracking(html)

    print("Restoring images + logos…")
    html = restore_image_srcs(html)
    html = replace_logos(html)

    print("Neutralizing anchors…")
    html = neutralize_anchors(html)

    print("Debranding…")
    html = debrand_text(html)
    html = strip_savepage_attrs(html)

    # Drop leftover stylesheet / icon / canonical links inside whatever remains of head
    html = re.sub(r"<link\b[^>]*>", "", html, flags=re.I)
    html = re.sub(r"<meta\b[^>]*>", "", html, flags=re.I)
    html = re.sub(r"<title\b[^>]*>.*?</title>", "", html, flags=re.I | re.S)
    html = re.sub(r"<base\b[^>]*>", "", html, flags=re.I)

    body_html = strip_head_junk(html)

    # Extra debrand pass on body only for authorName leftovers
    body_html = debrand_text(body_html)
    body_html = body_html.replace('alt="Wanderlog"', 'alt="Trip"')

    OUT_INLINE_CSS.parent.mkdir(parents=True, exist_ok=True)
    OUT_INLINE_CSS.write_text(inline_css + "\n", encoding="utf-8")
    OUT_CSS.write_text(hide_support_widgets_css(), encoding="utf-8")
    OUT_JS.parent.mkdir(parents=True, exist_ok=True)
    OUT_JS.write_text(APP_JS, encoding="utf-8")

    # Ensure favicon/logo exist
    if not FAVICON.exists():
        raise SystemExit("missing favicon.svg")
    if not LOGO.exists():
        raise SystemExit("missing logo.svg")

    out = build_head(vendor_hrefs) + body_html + "\n</html>\n"
    # Final safety: no wanderlog brand strings in output
    leftover = len(re.findall(r"wanderlog", out, re.I))
    if leftover:
        print(f"WARNING: {leftover} wanderlog string(s) remain — scrubbing…")
        out = re.sub(r"wanderlog\.com", "example.com", out, flags=re.I)
        out = re.sub(r"Wanderlog", "Trip", out)
        out = re.sub(r"wanderlog", "trip", out)

    OUT_HTML.write_text(out, encoding="utf-8")
    print(f"Wrote {OUT_HTML} ({OUT_HTML.stat().st_size} bytes)")
    print(f"Vendor CSS files: {len(list(VENDOR_CSS.glob('*.css')))}")
    print(f"Remaining <a :", len(re.findall(r'<a\b', out, re.I)))
    print(f"Wanderlog mentions:", len(re.findall(r"wanderlog", out, re.I)))


if __name__ == "__main__":
    main()
