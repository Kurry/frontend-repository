#!/usr/bin/env python3
"""Transform SavePage capture into a self-contained HTTP-servable static page."""

from __future__ import annotations

import html as html_lib
import re
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / "_source-capture.html"
OUT_HTML = ROOT / "index.html"
OUT_CSS = ROOT / "styles.css"
OUT_JS = ROOT / "app.js"
OUT_PALETTE_JS = ROOT / "palette-library.js"
OUT_SCROLL_JS = ROOT / "scroll-effects.js"
OUT_POPUP_JS = ROOT / "popup.js"

SKIP_SCRIPT_SRC_PATTERNS = [
    r"facebook\.net",
    r"fbevents",
    r"trekkie",
    r"klaviyo",
    r"googletagmanager",
    r"google-analytics",
    r"gtag",
    r"shop\.app",
    r"shopifycloud/(?:privacy|perf|shop-js|storefront)",
    r"web-pixels",
    r"checkouts/internal",
    r"shop_events_listener",
    r"wpm/",
    r"hulkapps",
    r"form-builder",
    r"standard-actions",
    r"oa-wishlist",
    r"cart-drawer",
    r"color-swatches",
    r"search-form",
    r"localization-form",
    r"captcha",
    r"origin_trials",
    r"load_feature",
    r"shopify_pay",
    r"compiled_assets/scripts",
]

FONT_URL_MAP = {
    "//objectandarchive.com/cdn/fonts/abril_fatface/abrilfatface_n4.002841dd08a4d39b2c2d7fe9d598d4782afb7225.woff2": "./vendor/fonts/abrilfatface.woff2",
    "//objectandarchive.com/cdn/fonts/abril_fatface/abrilfatface_n4.0d8f922831420cd750572c7a70f4c623018424d8.woff": "./vendor/fonts/abrilfatface.woff2",
    "/cdn/shop/files/HALTimezoneMonoUnlicensed-Regular.woff2?v=1774205764": "./vendor/fonts/HALTimezoneMono.woff2",
    "/cdn/shop/files/HALTimezoneUnlicensed-Book_1.woff2?v=1777034451": "./vendor/fonts/HALTimezone-Book.woff2",
    "/cdn/shop/files/HALTimezoneUnlicensed-BookItalic_1.woff2?v=1777034452": "./vendor/fonts/HALTimezone-BookItalic.woff2",
    "/cdn/shop/files/desmontilles.woff2?v=1775433773": "./vendor/fonts/desmontilles.woff2",
    "./sparkle.gif": "./assets/sparkle.gif",
}


def should_skip_script_src(src: str) -> bool:
    if not src:
        return True
    for pat in SKIP_SCRIPT_SRC_PATTERNS:
        if re.search(pat, src, re.I):
            return True
    return False


def fix_css_urls(css: str) -> str:
    def repl_savepage(m: re.Match) -> str:
        url = m.group(1).strip()
        mapped = FONT_URL_MAP.get(url)
        if not mapped and url.startswith("//"):
            mapped = FONT_URL_MAP.get(url)
        if mapped:
            return f'url("{mapped}")'
        if url.startswith("//"):
            return f'url("https:{url}")'
        if url.startswith("/cdn/"):
            return f'url("https://objectandarchive.com{url}")'
        return f'url("{url}")'

    css = re.sub(
        r"/\*savepage-url=([^*]+)\*/\s*url\(\)",
        repl_savepage,
        css,
    )
    # Fix vendor CSS absolute font paths when we inline/copy
    for old, new in FONT_URL_MAP.items():
        css = css.replace(f"url({old})", f'url("{new}")')
        css = css.replace(f"url('{old}')", f'url("{new}")')
        css = css.replace(f'url("{old}")', f'url("{new}")')
        bare = old.split("?")[0]
        if bare != old:
            css = css.replace(f"url({bare})", f'url("{new}")')
    return css


def extract_styles(html: str) -> tuple[str, str]:
    styles: list[str] = []

    def collect(m: re.Match) -> str:
        attrs, body = m.group(1), m.group(2)
        # Drop empty savepage css variable stubs
        if "savepage-cssvariables" in attrs and not body.strip():
            return ""
        styles.append(fix_css_urls(body))
        return ""

    html2 = re.sub(r"<style([^>]*)>(.*?)</style>", collect, html, flags=re.I | re.S)
    css = "\n\n".join(styles)
    css += """

/* ── Capture polish: inert nav controls ── */
button.inert-nav,
button.mega-menu__link,
button.header__menu-item,
button.header__icon,
button.header__heading-link,
button.oa-drawer__child-link,
button.oa-drawer__footer-link,
button.header__utility-sub-link,
button.nomenclature-source__title,
button.swatch-tile__title,
button.palette-card__title,
button.footer-block__details-content a,
button.list-menu__item,
button.link,
span.inert-nav {
  appearance: none;
  -webkit-appearance: none;
  background: none;
  border: none;
  padding: 0;
  margin: 0;
  font: inherit;
  color: inherit;
  text-align: inherit;
  cursor: pointer;
  text-decoration: none;
}

button.nomenclature-source__title:hover,
button.swatch-tile__title:hover,
button.palette-card__title:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}

button.header__menu-item:hover span,
button.mega-menu__link:hover {
  opacity: 0.7;
}

a[href].resource-only { /* reserved */ }

/* Ensure library items visible (SavePage captured them with hidden="") */
.nomenclature-row[data-hex],
.palette-card,
.swatch-tile {
  /* unhide handled in JS; keep CSS fallback for no-js */
}
"""
    return html2, css


class AnchorRewriter(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=False)
        self.out: list[str] = []
        self._skip_depth = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if self._skip_depth:
            if tag in {"iframe", "script", "noscript"}:
                self._skip_depth += 1
            return

        low = tag.lower()
        attr_dict = {k: v for k, v in attrs}

        # Drop tracking / pixel sandboxes
        if low == "iframe":
            src = attr_dict.get("src") or attr_dict.get("data-savepage-src") or ""
            name = attr_dict.get("name") or ""
            if "web-pixel" in src or "web-pixel" in name or "sandbox" in (attr_dict.get("id") or ""):
                self._skip_depth = 1
                return

        if low == "a":
            href = attr_dict.get("href") or ""
            # Keep only pure fragment jump as button
            classes = attr_dict.get("class") or ""
            # Build button/span
            new_attrs = []
            for k, v in attrs:
                if k in {"href", "data-savepage-href", "target", "rel", "download"}:
                    continue
                if k.startswith("on"):
                    continue
                new_attrs.append((k, v))
            # Prefer button for interactive-looking links
            interactive = bool(
                re.search(
                    r"menu|link|button|title|icon|drawer|footer|cart|account|source|swatch-tile__title|palette-card",
                    classes,
                    re.I,
                )
            ) or href not in {"", "#", "#MainContent"}
            tag_out = "button" if interactive else "span"
            if tag_out == "button":
                new_attrs.insert(0, ("type", "button"))
            # Ensure inert-nav class
            class_found = False
            rebuilt = []
            for k, v in new_attrs:
                if k == "class":
                    class_found = True
                    rebuilt.append((k, f"{v} inert-nav" if v else "inert-nav"))
                else:
                    rebuilt.append((k, v))
            if not class_found:
                rebuilt.append(("class", "inert-nav"))
            self.out.append(self._format_start(tag_out, rebuilt))
            self._pending_close = tag_out
            return

        # Strip savepage attrs from other tags; fix empty link/preconnect
        if low == "link":
            rel = (attr_dict.get("rel") or "").lower()
            href = attr_dict.get("href") or ""
            data_href = attr_dict.get("data-savepage-href") or ""
            if "stylesheet" in rel:
                # styles extracted — drop original stylesheet links that were empty
                return
            if rel in {"preconnect", "dns-prefetch", "prefetch", "preload"}:
                return
            if rel in {"canonical", "alternate"}:
                return
            if "icon" in rel:
                # keep data URI favicon if present
                cleaned = [(k, v) for k, v in attrs if k in {"rel", "type", "href", "sizes"} and v]
                if any(k == "href" and v for k, v in cleaned):
                    self.out.append(self._format_start("link", cleaned, void=True))
                return

        cleaned_attrs = []
        for k, v in attrs:
            if k.startswith("data-savepage"):
                continue
            if k == "integrity" and low == "script":
                continue
            cleaned_attrs.append((k, v))

        if low in {"meta"} and (attr_dict.get("name") or "").startswith("savepage"):
            return

        void = low in {
            "area", "base", "br", "col", "embed", "hr", "img", "input",
            "link", "meta", "param", "source", "track", "wbr",
        }
        self.out.append(self._format_start(low, cleaned_attrs, void=void))
        if low == "a":
            pass
        self._pending_close = None

    def handle_endtag(self, tag: str) -> None:
        if self._skip_depth:
            if tag.lower() in {"iframe", "script", "noscript"}:
                self._skip_depth -= 1
            return
        low = tag.lower()
        if low == "a":
            # Close with whatever we opened
            closer = getattr(self, "_last_a_replacement", "button")
            # Heuristic: last open was tracked via stack would be better; use button/span from out scan
            # Simpler: always close button — but span case exists. Use stack.
            if self._a_stack:
                self.out.append(f"</{self._a_stack.pop()}>")
            else:
                self.out.append("</button>")
            return
        if low in {
            "area", "base", "br", "col", "embed", "hr", "img", "input",
            "link", "meta", "param", "source", "track", "wbr",
        }:
            return
        self.out.append(f"</{low}>")

    def handle_startendtag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        self.handle_starttag(tag, attrs)

    def handle_data(self, data: str) -> None:
        if self._skip_depth:
            return
        self.out.append(data)

    def handle_comment(self, data: str) -> None:
        if self._skip_depth:
            return
        if "savepage" in data.lower():
            return
        self.out.append(f"<!--{data}-->")

    def handle_decl(self, decl: str) -> None:
        self.out.append(f"<!{decl}>")

    def handle_entityref(self, name: str) -> None:
        self.out.append(f"&{name};")

    def handle_charref(self, name: str) -> None:
        self.out.append(f"&#{name};")

    def _format_start(self, tag: str, attrs: list[tuple[str, str | None]], void: bool = False) -> str:
        if tag in {"button", "span"} and any(k == "type" or k == "class" for k, _ in attrs):
            # track a replacements via stack
            if not hasattr(self, "_a_stack"):
                self._a_stack = []
            # Only push when called from anchor rewrite — detected by inert-nav in class
            classes = ""
            for k, v in attrs:
                if k == "class" and v and "inert-nav" in v:
                    self._a_stack.append(tag)
                    break
        parts = [f"<{tag}"]
        for k, v in attrs:
            if v is None:
                parts.append(f" {k}")
            else:
                parts.append(f' {k}="{html_lib.escape(v, quote=True)}"')
        parts.append(" />" if void else ">")
        return "".join(parts)


def rewrite_anchors_regex(html: str) -> str:
    """Replace <a ...>...</a> with button/span preserving attrs (faster/safer for huge file)."""

    def repl(m: re.Match) -> str:
        attrs_s = m.group(1)
        inner = m.group(2)
        # parse attrs roughly
        href_m = re.search(r'\bhref=(["\'])(.*?)\1', attrs_s, re.I)
        href = href_m.group(2) if href_m else ""
        class_m = re.search(r'\bclass=(["\'])(.*?)\1', attrs_s, re.I)
        classes = class_m.group(2) if class_m else ""

        # strip nav attrs
        attrs_s = re.sub(r'\s*(?:href|data-savepage-href|target|rel|download)=(["\']).*?\1', "", attrs_s, flags=re.I)
        attrs_s = re.sub(r"\s*data-savepage-[\w-]+=([\"']).*?\1", "", attrs_s, flags=re.I)

        if class_m:
            attrs_s = re.sub(
                r'\bclass=(["\'])(.*?)\1',
                lambda mm: f'class="{mm.group(2)} inert-nav"',
                attrs_s,
                count=1,
                flags=re.I,
            )
        else:
            attrs_s = f'{attrs_s} class="inert-nav"'

        # Use button for most; span for skip-to-content style pure fragments with visually-hidden
        use_span = href.startswith("#") and "visually-hidden" in classes
        if use_span:
            return f"<span{attrs_s}>{inner}</span>"
        if not re.search(r'\btype=', attrs_s, re.I):
            attrs_s = f' type="button"{attrs_s}'
        return f"<button{attrs_s}>{inner}</button>"

    # Non-greedy match; allow nested tags inside anchors (common for logos)
    return re.sub(r"<a(\s[^>]*)>(.*?)</a>", repl, html, flags=re.I | re.S)


def strip_scripts(html: str) -> str:
    def repl(m: re.Match) -> str:
        attrs, body = m.group(1), m.group(2)
        src_m = re.search(r'data-savepage-src=(["\'])(.*?)\1', attrs, re.I)
        src = src_m.group(2) if src_m else ""
        typ_m = re.search(r'type=(["\'])(.*?)\1', attrs, re.I)
        typ = typ_m.group(2) if typ_m else ""
        # Drop savepage shadow loader
        if "savepage-shadowloader" in attrs or "savepage_ShadowLoader" in body:
            return ""
        # Drop empty text/plain stubs
        if "text/plain" in typ or 'type="text/plain"' in attrs:
            if should_skip_script_src(src) or not src:
                return ""
            # keep for remapping? we'll inject our own bundle — drop all savepage scripts
            return ""
        if src and should_skip_script_src(src):
            return ""
        # Drop application/json shopify blobs that are empty/plain
        if "application/json" in typ and not body.strip():
            return ""
        # Keep other inline scripts with real body (rare)
        if body.strip() and "text/plain" not in attrs:
            return m.group(0)
        return ""

    return re.sub(r"<script([^>]*)>(.*?)</script>", repl, html, flags=re.I | re.S)


def unhide_library_items(html: str) -> str:
    # Remove hidden="" / hidden from library item nodes only
    def unhide_tag(tag: str, chunk: str) -> str:
        pattern = rf"(<{tag}\b[^>]*?)\s+hidden(?:=\"\"|=''|=hidden)?([^>]*>)"
        return re.sub(pattern, r"\1\2", chunk, flags=re.I)

    # Operate on palette library section to avoid unhiding unrelated UI
    m = re.search(
        r'(<div class="palette-library\b.*?</div>\s*</div>\s*<script)',
        html,
        re.I | re.S,
    )
    if not m:
        # fallback: whole document for known classes
        for tag in ("div",):
            html = re.sub(
                r'(<(?:div)\b[^>]*\b(?:nomenclature-row|palette-card|swatch-tile)\b[^>]*?)\s+hidden(?:=\"\"|=\'\'|=hidden)?',
                r"\1",
                html,
                flags=re.I,
            )
        return html

    # broader: remove hidden from elements with those classes anywhere
    html = re.sub(
        r'(<[^>]*\bclass="[^"]*\b(?:nomenclature-row|palette-card|swatch-tile)\b[^"]*"[^>]*?)\s+hidden(?:=""|=\'\'|=hidden)?',
        r"\1",
        html,
        flags=re.I,
    )
    html = re.sub(
        r"\shidden(?=\s|>)",
        lambda m: "",
        # only on lines with those class names — already handled above
        html if False else html,
    )
    # Second pass for attribute-first ordering: hidden before class
    html = re.sub(
        r'(<(?:div|article)\b[^>]*?)\shidden(?:=""|=\'\'|=hidden)?([^>]*\b(?:nomenclature-row|palette-card|swatch-tile)\b)',
        r"\1\2",
        html,
        flags=re.I,
    )
    return html


def remove_pixel_containers(html: str) -> str:
    html = re.sub(
        r'<div[^>]*id="web-pixels-manager-sandbox-container"[^>]*>.*?</div>',
        "",
        html,
        flags=re.I | re.S,
    )
    html = re.sub(r"<shop-cart-sync[^>]*>.*?</shop-cart-sync>", "", html, flags=re.I | re.S)
    html = re.sub(r"<noscript\b[^>]*>.*?</noscript>", "", html, flags=re.I | re.S)
    return html


def inject_head_and_scripts(html: str) -> str:
    head_inject = """
<link rel="stylesheet" href="./styles.css" />
"""
    html = re.sub(r"</head>", head_inject + "</head>", html, count=1, flags=re.I)

    # Reset popup to live behavior (not force-visible)
    html = html.replace('id="oa-popup" class="is-visible"', 'id="oa-popup"')
    html = html.replace("id=\"oa-popup\" class=\"is-visible\"", 'id="oa-popup"')

    body_inject = """
<script src="./vendor/jquery-3.7.1.min.js" defer></script>
<script src="./vendor/constants.js" defer></script>
<script src="./vendor/pubsub.js" defer></script>
<script src="./vendor/global.js" defer></script>
<script src="./vendor/details-disclosure.js" defer></script>
<script src="./vendor/details-modal.js" defer></script>
<script src="./vendor/oa-color-library.js" defer></script>
<script src="./vendor/gsap.min.js" defer></script>
<script src="./vendor/ScrollTrigger.min.js" defer></script>
<script src="./vendor/lenis.min.js" defer></script>
<script src="./palette-library.js" defer></script>
<script src="./scroll-effects.js" defer></script>
<script src="./popup.js" defer></script>
<script src="./app.js" defer></script>
"""
    html = re.sub(r"</body>", body_inject + "</body>", html, count=1, flags=re.I)
    return html


def write_js_files() -> None:
    OUT_PALETTE_JS.write_text(
        r"""
(function () {
  var sid = 'template--27515259093026__palette_library_GpBcQB';

  function isLight(hex) {
    var h = hex.replace('#', '');
    if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
    var r = parseInt(h.substring(0,2),16);
    var g = parseInt(h.substring(2,4),16);
    var b = parseInt(h.substring(4,6),16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 160;
  }

  function hueSort(hex) {
    var h = hex.replace('#','');
    var r = parseInt(h.substring(0,2),16) / 255;
    var g = parseInt(h.substring(2,4),16) / 255;
    var b = parseInt(h.substring(4,6),16) / 255;
    var max = Math.max(r,g,b), min = Math.min(r,g,b);
    var l = (max + min) / 2;
    if (max === min) return 1000 + (1 - l) * 100;
    var d = max - min;
    var s = d / (1 - Math.abs(2*l - 1));
    var hue;
    if (max === r) hue = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) hue = ((b - r) / d + 2) / 6;
    else hue = ((r - g) / d + 4) / 6;
    if (s < 0.12 || l < 0.12) return 1000 + (1 - l) * 100;
    return hue * 360;
  }

  function copyHex(hex, el) {
    var done = function () {
      el.classList.add('copied');
      setTimeout(function () { el.classList.remove('copied'); }, 1000);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(hex).then(done).catch(function () {
        var ta = document.createElement('textarea');
        ta.value = hex;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        done();
      });
    } else {
      var ta = document.createElement('textarea');
      ta.value = hex;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      done();
    }
  }

  function init() {
    var root = document.getElementById('PaletteLibrary-' + sid);
    if (!root) return;

    // Unhide SavePage-captured items
    root.querySelectorAll('.nomenclature-row[data-hex], .palette-card, .swatch-tile').forEach(function (el) {
      el.hidden = false;
      el.removeAttribute('hidden');
    });

    document.querySelectorAll('#PaletteLibrary-' + sid + ' .palette-card__swatch').forEach(function (swatch) {
      var hex = swatch.dataset.hex;
      if (!hex) return;
      swatch.addEventListener('click', function (e) {
        if (e.target.closest('a,button.inert-nav')) return;
        copyHex(hex, swatch);
      });
    });

    var tiles = document.querySelectorAll('#PaletteLibrary-' + sid + ' .swatch-tile');
    tiles.forEach(function (tile) {
      var hex = tile.dataset.hex;
      if (!hex) return;
      var light = isLight(hex);
      var textColor = light ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.82)';
      var hexEl = tile.querySelector('.swatch-tile__hex');
      var nameEl = tile.querySelector('.swatch-tile__name');
      var titleEl = tile.querySelector('.swatch-tile__title');
      if (hexEl) hexEl.style.color = textColor;
      if (nameEl) nameEl.style.color = textColor;
      if (titleEl) titleEl.style.color = textColor;
      tile.addEventListener('click', function (e) {
        if (e.target.closest('a,button.inert-nav')) return;
        copyHex(hex, tile);
      });
    });

    var nomView = document.getElementById('nomenclature-view-' + sid);
    if (!nomView) return;

    nomView.querySelectorAll('.nomenclature-swatch').forEach(function (swatch) {
      var hex = swatch.dataset.hex;
      if (!hex) return;
      swatch.addEventListener('click', function () { copyHex(hex, swatch); });
    });

    var header = nomView.querySelector('.nomenclature-row--header');
    var rows = Array.from(nomView.querySelectorAll('.nomenclature-row:not(.nomenclature-row--header)'));
    rows.sort(function (a, b) {
      return hueSort(a.dataset.hex || '') - hueSort(b.dataset.hex || '');
    });
    var seenHex = {};
    rows = rows.filter(function (row) {
      var hex = (row.dataset.hex || '').toLowerCase();
      if (seenHex[hex]) { row.parentNode && row.parentNode.removeChild(row); return false; }
      seenHex[hex] = true;
      return true;
    });
    rows.forEach(function (row) { nomView.appendChild(row); });
    if (header) nomView.insertBefore(header, nomView.firstChild);

    var filterSelect = document.getElementById('PeriodFilter-' + sid);
    if (filterSelect) {
      filterSelect.addEventListener('change', function () {
        var selected = this.value;
        nomView.querySelectorAll('.nomenclature-row:not(.nomenclature-row--header)').forEach(function (row) {
          row.hidden = selected !== '' && row.dataset.period !== selected;
        });
        document.querySelectorAll('#palette-view-' + sid + ' .palette-card').forEach(function (card) {
          card.hidden = selected !== '' && card.dataset.period !== selected;
        });
        tiles.forEach(function (tile) {
          tile.hidden = selected !== '' && tile.dataset.period !== selected;
        });
      });
    }

    function populateNames() {
      if (typeof oaColorName !== 'function') return;
      var nameCache = {};
      nomView.querySelectorAll('.nomenclature-row[data-hex]').forEach(function (row) {
        var hex = row.dataset.hex;
        if (!hex) return;
        if (!nameCache[hex]) nameCache[hex] = oaColorName(hex);
        var result = nameCache[hex];
        var nameEl = row.querySelector('[data-color-name]');
        var noteEl = row.querySelector('[data-color-note]');
        if (nameEl) nameEl.textContent = result.name;
        if (noteEl) noteEl.textContent = result.note;
      });
      tiles.forEach(function (tile) {
        var hex = tile.dataset.hex;
        if (!hex) return;
        var nameEl = tile.querySelector('.swatch-tile__name');
        if (!nameEl) return;
        if (!nameCache[hex]) nameCache[hex] = oaColorName(hex);
        nameEl.textContent = nameCache[hex].name;
      });
    }

    if (typeof oaColorName === 'function') populateNames();
    else {
      var tries = 0;
      var t = setInterval(function () {
        tries += 1;
        if (typeof oaColorName === 'function') { populateNames(); clearInterval(t); }
        if (tries > 40) clearInterval(t);
      }, 50);
    }

    var toggleEl = document.getElementById('PaletteToggle-' + sid);
    var viewMap = {
      nomenclature: nomView,
      palette: document.getElementById('palette-view-' + sid),
      swatch: document.getElementById('swatch-view-' + sid)
    };

    if (toggleEl) {
      toggleEl.querySelectorAll('.palette-library__toggle-option').forEach(function (opt) {
        opt.addEventListener('click', function () {
          var view = this.dataset.view;
          toggleEl.querySelectorAll('.palette-library__toggle-option').forEach(function (o) {
            o.classList.remove('active');
            var circle = o.querySelector('.palette-library__toggle-indicator svg circle');
            if (circle) circle.setAttribute('fill', 'transparent');
          });
          this.classList.add('active');
          var activeCircle = this.querySelector('.palette-library__toggle-indicator svg circle');
          if (activeCircle) activeCircle.setAttribute('fill', 'currentColor');
          Object.keys(viewMap).forEach(function (k) {
            if (viewMap[k]) viewMap[k].classList.toggle('active', k === view);
          });
        });
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
""",
        encoding="utf-8",
    )

    OUT_SCROLL_JS.write_text(
        r"""
document.addEventListener('DOMContentLoaded', function () {
  if (typeof Lenis === 'undefined' || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  const lenis = window.lenis = new Lenis({
    duration: 1.4,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    smoothWheel: true,
  });

  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  document.addEventListener('modalOpen', () => lenis.stop());
  document.addEventListener('modalClose', () => lenis.start());

  const revealSections = document.querySelectorAll('[data-scroll-reveal]');
  revealSections.forEach((section) => {
    gsap.fromTo(section,
      { y: 120 },
      {
        y: 0,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: section,
          start: 'top 95%',
          end: 'top 10%',
          scrub: 1.2,
        }
      }
    );
  });

  const parallaxElements = document.querySelectorAll('[data-parallax]');
  parallaxElements.forEach((el) => {
    if (window.innerWidth < 750) return;
    gsap.to(el, {
      yPercent: 25,
      ease: 'none',
      scrollTrigger: {
        trigger: el,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      }
    });
  });

  gsap.utils.toArray('[data-reveal]').forEach((el) => {
    gsap.fromTo(el,
      { opacity: 0, filter: 'blur(8px)' },
      {
        opacity: 1,
        filter: 'blur(0px)',
        duration: 1.2,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          toggleActions: 'play none none none',
        }
      }
    );
  });

  gsap.utils.toArray('[data-reveal-group]').forEach((group) => {
    const children = group.children;
    gsap.fromTo(children,
      { opacity: 0, filter: 'blur(8px)' },
      {
        opacity: 1,
        filter: 'blur(0px)',
        duration: 1.2,
        ease: 'power2.out',
        stagger: 0.15,
        scrollTrigger: {
          trigger: group,
          start: 'top 88%',
          toggleActions: 'play none none none',
        }
      }
    );
  });

  function setFooterReveal() {
    const footerSection = document.querySelector('.shopify-section-group-footer-group');
    const mainContent = document.getElementById('MainContent');
    if (!footerSection || !mainContent) return;
    mainContent.style.setProperty('padding-bottom', footerSection.offsetHeight + 'px', 'important');
  }

  setFooterReveal();
  window.addEventListener('resize', setFooterReveal);
});
""",
        encoding="utf-8",
    )

    OUT_POPUP_JS.write_text(
        r"""
(function() {
  function boot() {
    var popup = document.getElementById('oa-popup');
    if (!popup) return;
    var form = document.getElementById('oa-popup-form');
    var successEl = document.getElementById('oa-popup-success');
    var closeBtn = popup.querySelector('.oa-popup__close');

    if (sessionStorage.getItem('oa-popup-dismissed')) return;
    if (document.body.classList.contains('title-links')) return;

    var shown = false;
    function showPopup() {
      if (shown) return;
      shown = true;
      popup.classList.add('is-visible');
    }

    var timer = setTimeout(showPopup, 45000);

    window.addEventListener('scroll', function() {
      var scrolled = window.scrollY / Math.max(1, (document.body.scrollHeight - window.innerHeight));
      if (scrolled > 0.5) showPopup();
    }, { passive: true });

    if (closeBtn) {
      closeBtn.addEventListener('click', function() {
        popup.classList.remove('is-visible');
        sessionStorage.setItem('oa-popup-dismissed', '1');
        clearTimeout(timer);
      });
    }

    if (form) {
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        form.style.display = 'none';
        if (successEl) successEl.classList.add('is-visible');
        sessionStorage.setItem('oa-popup-dismissed', '1');
        setTimeout(function() {
          popup.classList.remove('is-visible');
        }, 3000);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
""",
        encoding="utf-8",
    )

    OUT_JS.write_text(
        r"""
(function () {
  // Block accidental navigation from any leftover anchors / forms
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href') || '';
    if (href.startsWith('#') && href.length > 1) return; // allow in-page
    e.preventDefault();
  }, true);

  document.addEventListener('submit', function (e) {
    e.preventDefault();
  }, true);

  // Header height CSS var
  function syncHeaderHeight() {
    var header = document.querySelector('sticky-header, .header-wrapper, header');
    if (!header) return;
    document.documentElement.style.setProperty('--header-height', header.offsetHeight + 'px');
  }
  syncHeaderHeight();
  window.addEventListener('resize', syncHeaderHeight);
})();
""",
        encoding="utf-8",
    )


def main() -> None:
    print("Reading source…")
    html = SOURCE.read_text(encoding="utf-8-sig", errors="replace")
    html = re.sub(r"^(<!DOCTYPE html>\\s*)+", "<!DOCTYPE html>\\n", html, flags=re.I)

    print("Extracting CSS…")
    html, css = extract_styles(html)
    OUT_CSS.write_text(css, encoding="utf-8")
    print(f"  styles.css ({len(css):,} bytes)")

    print("Stripping SavePage scripts / pixels…")
    html = strip_scripts(html)
    html = remove_pixel_containers(html)

    print("Unhiding library items…")
    html = unhide_library_items(html)

    print("Rewriting anchors → inert controls…")
    before_a = len(re.findall(r"<a\b", html, re.I))
    html = rewrite_anchors_regex(html)
    after_a = len(re.findall(r"<a\b", html, re.I))
    print(f"  anchors {before_a} → {after_a}")

    # Remove any remaining href on non-resource tags (safety)
    # Keep none for <a>
    html = re.sub(r"<a\b[^>]*>", lambda m: m.group(0).replace("href=", "data-removed-href="), html, flags=re.I)

    print("Injecting local CSS/JS…")
    html = inject_head_and_scripts(html)

    # Clean leftover empty href on link tags
    html = re.sub(r'<link\b[^>]*href=""[^>]*>', "", html, flags=re.I)

    # DOCTYPE fix if parser stripped
    if not html.lstrip().lower().startswith("<!doctype"):
        html = "<!DOCTYPE html>\n" + html

    OUT_HTML.write_text(html, encoding="utf-8")
    print(f"  index.html ({len(html):,} bytes)")

    write_js_files()
    print("Wrote palette-library.js, scroll-effects.js, popup.js, app.js")

    # Final sanity
    remaining = len(re.findall(r'<a\s[^>]*href=', OUT_HTML.read_text(encoding="utf-8"), re.I))
    print(f"Remaining <a href>: {remaining}")
    print("Done.")


if __name__ == "__main__":
    main()
