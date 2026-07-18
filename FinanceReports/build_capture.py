#!/usr/bin/env python3
"""Transform Monarch Reports SavePage captures into a debranded FinanceReports demo."""

from __future__ import annotations

import hashlib
import html as html_lib
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / "_source-capture.html"
SOURCE_PIE = ROOT / "_source-capture-pie.html"
SOURCE_ALT = ROOT / "_source-capture-alt.html"
OUT_HTML = ROOT / "index.html"
OUT_INLINE_CSS = ROOT / "css" / "capture-inline.css"
OUT_CSS = ROOT / "css" / "styles.css"
OUT_JS = ROOT / "js" / "app.js"
ASSETS = ROOT / "assets"
FAVICON = ASSETS / "favicon.svg"
LOGO = ASSETS / "logo.svg"

# Only match style-tag *attributes* / savepage hrefs — never CSS body text
# (app CSS legitimately mentions words like "stripe" as class fragments).
SKIP_STYLE_ATTR_HINTS = [
    "googleidentityservice",
    "osano-cm-window",  # full Osano CMP stylesheet (style 0 has no href)
    "js.stripe.com",
    "stripecdn.com",
    "hcaptcha.com",
    "recaptcha",
    "plaid.com",
    "boq-payments",
    "instantbuyfrontend",
    "fingerprinted/css",
]

# Exact string replacements (order matters — longer / specific first)
TEXT_REPLACEMENTS: list[tuple[str, str]] = [
    # Brand / product
    ("Monarch | Reports", "Ledger | Reports"),
    ("Shared via monarch.com", "Shared demo report"),
    ("shared via monarch.com", "shared demo report"),
    ("Invite a friend, get $15", "Invite teammates (demo)"),
    ("Free trial", "Demo mode"),
    ("7 days left", "Sample data"),
    ("Ask AI Assistant", "Ask Assistant (demo)"),
    ("AI Assistant", "Assistant"),
    ("Help & Support", "Help (demo)"),
    ("Help &amp; Support", "Help (demo)"),
    ("Add your bank", "Link account (demo)"),
    ("You need to enable JavaScript to run this app.", "Finance reports demo"),
    ("Select filters and/or a date range to save a report.", "Select filters or a date range to save this demo report."),
    ("This site uses technologies such as cookies to enable essential functionality, as well as for analytics (including by way of session replay technology), personalization, and advertising.", ""),
    ("More information can be found in our", ""),
    ("Privacy Policy", ""),
    ("Close Cookie Preferences", ""),
    ("Close this dialog", "Close"),
    ("Opens in a new window", ""),
    ("Opens an external website in a new window", ""),
    ("Opens an external website", ""),
    ("monarch-sankey-diagram", "ledger-sankey-diagram"),
    ("monarch-icon", "ledger-icon"),
    ("Icon__MonarchIcon", "Icon__LedgerIcon"),
    ("app.monarch.com", "app.example.com"),
    ("static.monarch.com", "static.example.com"),
    ("events-cdn.monarch.com", "events.example.com"),
    ("monarch.com", "example.com"),
    ("Monarch", "Ledger"),
    ("monarch", "ledger"),
    # PII / merchants / accounts
    ("Kurry", "Alex Rivera"),
    ("Mercor.io", "Northwind Labs"),
    ("Mercor", "Northwind"),
    ("Adv Plus Banking (...2692)", "Primary Checking (…4821)"),
    ("Adv Plus Banking", "Primary Checking"),
    ("DoorDash", "QuickBite Delivery"),
    ("Apple Pay", "Wallet Pay"),
    ("Apple", "Summit Devices"),
    ("Uber", "CityRide"),
    ("Amazon", "Marketplace Co"),
    ("Target", "Harbor Market"),
    ("CVS", "Corner Pharmacy"),
    ("Anthropic", "Brightline AI"),
    ("HBO Max", "Streamhouse"),
    ("OpenAI", "Orbit Models"),
    ("Transfer", "Internal Transfer"),
    ("MonarchIcons", "LedgerIcons"),
    # Category labels stay finance-generic but scrub any brand-adjacent wording
    ("View merchant", "View payee"),
    ("Download CSV", "Export CSV (demo)"),
    ("Edit multiple", "Bulk edit (demo)"),
    # Dates → demo window (keep relative shape)
    ("July 16, 2026", "Mar 16, 2025"),
    ("July 15, 2026", "Mar 15, 2025"),
    ("July 14, 2026", "Mar 14, 2025"),
    ("July 13, 2026", "Mar 13, 2025"),
    ("Jul 16, 2026", "Mar 16, 2025"),
    ("Jan 31, 2025", "Jan 05, 2024"),
]

# Known headline amounts → coherent fake demo figures (preserve rough ratios)
AMOUNT_MAP: dict[str, str] = {
    "$145,073.27": "$128,450.00",
    "$35,270.93": "$31,820.40",
    "$109,802.34": "$96,629.60",
    "75.7%": "75.2%",
    "75.69%": "75.23%",
    "$59,820.07": "$52,400.00",
    "41.23%": "40.79%",
    "$7,963.16": "$6,850.00",
    "5.49%": "5.33%",
    "$54.21": "$48.10",
    "0.04%": "0.04%",
    "$880.21": "$760.00",
    "2.5%": "2.39%",
    "$129.79": "$118.40",
    "0.37%": "0.37%",
    "$2,117.18": "$1,940.00",
    "6%": "6.10%",
    "1.46%": "1.51%",
    "$4,159.17": "$3,720.00",
    "11.79%": "11.69%",
    "2.87%": "2.90%",
    "$9,954.75": "$8,640.00",
    "28.22%": "27.15%",
    "$198.02": "$175.00",
    "0.56%": "0.55%",
    "$65.00": "$60.00",
    "0.18%": "0.19%",
    "$532.52": "$490.00",
    "1.51%": "1.54%",
    "$660.20": "$585.00",
    "1.87%": "1.84%",
    "$1,803.59": "$1,620.00",
    "5.11%": "5.09%",
    "1.24%": "1.26%",
    "$84.97": "$75.00",
    "0.24%": "0.24%",
    "$98.63": "$90.00",
    "0.28%": "0.28%",
    "$3,721.00": "$3,200.00",
    "10.55%": "10.06%",
    "$334.12": "$298.00",
    "0.95%": "0.94%",
    "$1,348.32": "$1,210.00",
    "3.82%": "3.80%",
    "$2,612.40": "$2,350.00",
    "7.41%": "7.38%",
    "$48.90": "$42.00",
    "0.14%": "0.13%",
    "$31.85": "$28.50",
    "0.09%": "0.09%",
    "$89.50": "$82.00",
    "0.25%": "0.26%",
    "$117.07": "$105.00",
    "0.33%": "0.33%",
    "$205.43": "$188.00",
    "0.58%": "0.59%",
    "$6,078.31": "$5,420.00",
    "17.23%": "17.03%",
    "$3,609.68": "$3,220.00",
    "2.49%": "2.51%",
    "$463.91": "$416.40",
    "0.32%": "0.32%",
    "$10,820.38": "$9,413.00",
    "7.46%": "7.33%",
    "$282.99": "$250.00",
    "0.2%": "0.19%",
    "$1,495.85": "$1,342.00",
    "1.03%": "1.04%",
    "$3,875.50": "$3,480.00",
    "2.67%": "2.71%",
    "$6,642.68": "$5,938.50",
    "4.58%": "4.62%",
    "$77,235.83": "$68,750.00",
    "53.24%": "53.52%",
    "+$10,163.00": "+$9,250.00",
    "+$10,005.06": "+$9,100.00",
    "+$22,630.00": "+$18,400.00",
    "+$16.98": "+$42.15",
    "+$145,073.27": "+$128,450.00",
    "+$1.00": "+$1.00",
    "$1,000.00": "$850.00",
    "$157.94": "$142.00",
    "$215.96": "$198.50",
    "$34.39": "$31.20",
    "$100.00": "$88.00",
    "$81.57": "$74.00",
    "$500.00": "$450.00",
    "$548.26": "$495.00",
    "$36.80": "$33.00",
    "$20.00": "$18.00",
    "$50.00": "$45.00",
    "-$13K": "-$11K",
    "960": "842",
}


def strip_bom(text: str) -> str:
    return text[1:] if text.startswith("\ufeff") else text


def fix_savepage_css_urls(css: str) -> str:
    def repl(m: re.Match) -> str:
        url = m.group(1).strip()
        if url.startswith("//"):
            url = "https:" + url
        # Point brand hosts at empty / local — keep data: urls intact elsewhere
        if "monarch.com" in url or "stripe.com" in url or "plaid.com" in url:
            return 'url("")'
        return f'url("{url}")'

    css = re.sub(r"/\*savepage-url=([^*]+)\*/\s*url\(\)", repl, css)
    css = re.sub(
        r"url\(\s*(https?://(?:static\.)?monarch\.com[^)]*)\s*\)",
        'url("")',
        css,
        flags=re.I,
    )
    return css


def extract_inline_styles(html: str) -> tuple[str, str]:
    chunks: list[str] = []

    def collect(m: re.Match) -> str:
        attrs, body = m.group(1), m.group(2)
        attrs_l = attrs.lower()
        # Decode common SavePage entity-encoding in attrs for skip checks
        attrs_decoded = (
            attrs_l.replace("&quot;", '"')
            .replace("&amp;", "&")
            .replace("&amp;quot;", '"')
        )
        if any(h in attrs_decoded for h in SKIP_STYLE_ATTR_HINTS):
            return ""
        # First Osano CMP window stylesheet (no href; identifiable by selector)
        if body.lstrip().startswith(".osano-cm-window"):
            return ""
        if "savepage-cssvariables" in attrs_decoded and len(body.strip()) < 40:
            return ""
        # Skip tiny font-face local stubs from nested iframes
        if "data-savepage-fontface" in attrs_decoded and len(body) < 200:
            return ""
        fixed = fix_savepage_css_urls(body)
        fixed = re.sub(r"https?://[^\"')\s]*monarch\.com[^\"')\s]*", "", fixed, flags=re.I)
        if fixed.strip():
            chunks.append(fixed)
        return ""

    html2 = re.sub(r"<style([^>]*)>(.*?)</style>", collect, html, flags=re.I | re.S)
    return html2, "\n\n".join(chunks)


def strip_scripts(html: str) -> str:
    html = re.sub(r"<script\b[^>]*>.*?</script>", "", html, flags=re.I | re.S)
    html = re.sub(r"<noscript\b[^>]*>.*?</noscript>", "", html, flags=re.I | re.S)
    return html


def strip_junk_widgets(html: str) -> str:
    html = re.sub(r"<iframe\b[^>]*>.*?</iframe>", "", html, flags=re.I | re.S)
    html = re.sub(r"<iframe\b[^>]*/?>", "", html, flags=re.I)
    # Remove nodes before #root (cookie CMP / lit shells) and after main app when possible
    root = re.search(r'<div id="root"[^>]*>', html, re.I)
    if root:
        # Keep from root onward; drop preceding CMP chrome
        pre = html[: root.start()]
        # Preserve opening body tag if present in pre
        body_open = re.search(r"<body[^>]*>", pre, re.I)
        prefix = body_open.group(0) if body_open else ""
        html = prefix + html[root.start() :]
    # Strip trailing widget debris after </div></div> chains following root — remove osano/zendesk by class
    html = re.sub(
        r'<button[^>]*osano[^>]*>.*?</button>',
        "",
        html,
        flags=re.I | re.S,
    )
    html = re.sub(
        r'<div[^>]*(?:osano-cm|StripeM|grecaptcha|hcaptcha)[^>]*>.*?</div>',
        "",
        html,
        flags=re.I | re.S,
    )
    return html


def element_start(html: str, marker: str, search_from: int = 0) -> int:
    """Index of the opening <div that contains marker (not mid-attribute cuts)."""
    pos = html.find(marker, search_from)
    if pos < 0:
        return -1
    open_div = html.rfind("<div", 0, pos)
    return open_div if open_div >= 0 else pos


def extract_between(html: str, start_marker: str, end_marker: str) -> str:
    open_div = element_start(html, start_marker)
    if open_div < 0:
        return ""
    end = element_start(html, end_marker, open_div + 1)
    if end < 0:
        return html[open_div:]
    return html[open_div:end]


def inject_pie_panel(primary_html: str, pie_html: str) -> str:
    """Insert Trends pie chart (from secondary capture) next to Sankey; hide by default."""
    pie = extract_between(
        pie_html,
        "ReportsPieChart__Root",
        "Reports__TransactionsSummaryRefContainer",
    )
    if not pie or "ReportsPieChart__Root" not in pie:
        print("WARNING: pie panel not found in secondary capture")
        return primary_html

    pie = (
        '<div id="demo-trends-panel" class="demo-chart-panel" hidden '
        'data-demo-panel="trends">'
        + pie
        + "</div>"
    )

    open_div = element_start(primary_html, "ReportsSankey__Content")
    end = element_start(primary_html, "Reports__TransactionsSummaryRefContainer", open_div + 1)
    if open_div < 0 or end < 0:
        print("WARNING: sankey bounds incomplete — skipping pie inject")
        return primary_html

    sankey_block = primary_html[open_div:end]
    if "ReportsSankey__Content" not in sankey_block:
        print("WARNING: sankey block empty — skipping pie inject")
        return primary_html

    wrapped = (
        '<div id="demo-breakdown-panel" class="demo-chart-panel" data-demo-panel="breakdown">'
        + sankey_block
        + "</div>"
        + pie
    )
    return primary_html[:open_div] + wrapped + primary_html[end:]


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

    pattern = re.compile(r"<a(\s[^>]*)>((?:(?!</?a\b).)*)</a>", flags=re.I | re.S)
    for _ in range(120):
        html2, n = pattern.subn(lambda m: to_button(m.group(1), m.group(2)), html, count=50)
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


def fake_amount(original: str) -> str:
    """Deterministic remapping for leftover dollar amounts not in AMOUNT_MAP."""
    if original in AMOUNT_MAP:
        return AMOUNT_MAP[original]
    sign = ""
    body = original
    if body.startswith("+") or body.startswith("-"):
        sign = body[0]
        body = body[1:]
    m = re.fullmatch(r"\$([\d,]+)(?:\.(\d{2}))?", body)
    if not m:
        return original
    whole = int(m.group(1).replace(",", ""))
    cents = int(m.group(2) or "0")
    total = whole * 100 + cents
    # scramble while keeping magnitude
    h = int(hashlib.md5(original.encode()).hexdigest()[:8], 16)
    factor = 0.82 + (h % 30) / 100.0  # 0.82–1.11
    new_total = max(100, int(total * factor))
    # avoid accidental identity
    if new_total == total:
        new_total = max(100, total - 137)
    nw, nc = divmod(new_total, 100)
    return f"{sign}${nw:,}.{nc:02d}"


def replace_amounts(text: str) -> str:
    """Map known amounts, then deterministically rewrite leftovers (once)."""
    protected: dict[str, str] = {}

    def protect(value: str) -> str:
        token = f"@@AMT{len(protected)}@@"
        protected[token] = value
        return token

    # Known map first (longer keys first) → protect outputs
    for old in sorted(AMOUNT_MAP.keys(), key=len, reverse=True):
        if old in text:
            text = text.replace(old, protect(AMOUNT_MAP[old]))

    def repl(m: re.Match) -> str:
        return protect(fake_amount(m.group(0)))

    text = re.sub(r"[+-]?\$\d{1,3}(?:,\d{3})*(?:\.\d{2})?", repl, text)

    for token, value in protected.items():
        text = text.replace(token, value)
    return text


def anonymize_text(text: str) -> str:
    for old, new in TEXT_REPLACEMENTS:
        # Prefer word-ish boundaries for short tokens that can nest after prior replaces
        if old in {"Transfer", "Apple", "Target", "Uber", "Amazon", "CVS"}:
            text = re.sub(rf"(?<![A-Za-z]){re.escape(old)}(?![A-Za-z])", new, text)
        else:
            text = text.replace(old, new)
    text = replace_amounts(text)
    # Scrub residual brand hosts
    text = re.sub(
        r"https?://[^\"'\s<>]*monarch\.com[^\"'\s<>]*",
        "https://example.com",
        text,
        flags=re.I,
    )
    text = re.sub(r"\bmonarch\b", "ledger", text, flags=re.I)
    return text


def replace_logos(html: str) -> str:
    def repl_img(m: re.Match) -> str:
        attrs = m.group(1)
        blob = attrs.lower()
        if any(k in blob for k in ("logo", "favicon", "monarch", "ledger", "avatar")):
            attrs = re.sub(r'\s*src=(["\']).*?\1', "", attrs, flags=re.I)
            attrs = re.sub(r"\s*data-savepage-[\w-]+=([\"']).*?\1", "", attrs, flags=re.I)
            attrs = re.sub(r'\s*srcset=(["\']).*?\1', "", attrs, flags=re.I)
            if not re.search(r"\balt=", attrs, re.I):
                attrs += ' alt="Ledger"'
            else:
                attrs = re.sub(r'\balt=(["\']).*?\1', 'alt="Ledger"', attrs, count=1, flags=re.I)
            return f'<img{attrs} src="./assets/logo.svg">'
        return m.group(0)

    html = re.sub(r"<img([^>]+)>", repl_img, html, flags=re.I)
    # Sidebar brand mark is an inline butterfly SVG (28×28 / viewBox 0 0 28 24)
    brand_img = (
        '<img src="./assets/logo.svg" width="28" height="28" alt="Ledger" '
        'class="demo-brand-mark">'
    )
    html = re.sub(
        r'<svg[^>]*viewBox="0 0 28 24"[^>]*>.*?</svg>',
        brand_img,
        html,
        flags=re.I | re.S,
        count=2,
    )
    # Breadcrumb role=link → inert button semantics
    html = re.sub(
        r'\brole=["\']link["\']',
        'role="button"',
        html,
        flags=re.I,
    )
    return html


def restore_image_srcs(html: str) -> str:
    def rewrite(m: re.Match) -> str:
        attrs = m.group(1)
        sm = re.search(r'(?<![\w-])src=(["\'])(.*?)\1', attrs, re.I)
        src = sm.group(2) if sm else ""
        sp = re.search(r'data-savepage-src=(["\'])(.*?)\1', attrs, re.I)
        sp_src = sp.group(2) if sp else ""
        cur = re.search(r'data-savepage-currentsrc=(["\'])(.*?)\1', attrs, re.I)
        cur_src = cur.group(2) if cur else ""

        chosen = src
        if (not chosen or chosen.startswith("about:") or chosen == "") and cur_src.startswith(
            ("http", "data:")
        ):
            chosen = cur_src
        elif (not chosen or chosen.startswith("about:")) and sp_src.startswith(("http", "data:")):
            chosen = sp_src

        if chosen and "monarch.com" in chosen:
            chosen = "./assets/logo.svg"

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
        r"\s+data-savepage-[\w-]+=&quot;.*?&quot;",
        "",
        html,
    )
    return html


def strip_head_to_body(html: str) -> str:
    m = re.search(r"<body([^>]*)>(.*)</body>", html, re.I | re.S)
    if not m:
        raise SystemExit("No <body> found in capture")
    return f"<body{m.group(1)}>{m.group(2)}</body>"


STYLES_CSS = """
/* FinanceReports — demo chrome + inert nav + chart panel toggles */

html, body {
  margin: 0;
  min-height: 100%;
}

button.inert-nav,
span.inert-nav {
  appearance: none;
  -webkit-appearance: none;
  background: none;
  border: 0;
  padding: 0;
  margin: 0;
  font: inherit;
  color: inherit;
  text-align: inherit;
  cursor: pointer;
  display: inline;
  text-decoration: none;
}

button.inert-nav:focus-visible {
  outline: 2px solid #0F3D3E;
  outline-offset: 2px;
}

#demo-toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%) translateY(120%);
  background: #0F3D3E;
  color: #E8F3F1;
  padding: 10px 16px;
  border-radius: 8px;
  font: 14px/1.3 system-ui, sans-serif;
  z-index: 99999;
  opacity: 0;
  transition: transform 0.25s ease, opacity 0.25s ease;
  pointer-events: none;
  box-shadow: 0 8px 24px rgba(15, 61, 62, 0.25);
}

#demo-toast.is-visible {
  transform: translateX(-50%) translateY(0);
  opacity: 1;
}

.demo-chart-panel[hidden] {
  display: none !important;
}

#demo-trends-panel,
#demo-breakdown-panel {
  width: 100%;
  max-width: 100%;
  min-width: 0;
}

#demo-trends-panel .recharts-wrapper,
#demo-trends-panel .recharts-surface {
  max-width: 480px !important;
  max-height: 480px !important;
}

/* Hide residual CMP / captcha / trial noise if any survives scrub */
[aria-label="Cookie Consent Banner"],
[aria-label="Cookie Preferences"],
.osano-cm-window,
.osano-cm-widget,
iframe[title="reCAPTCHA"],
iframe[title="Plaid Link"],
div[data-product="web_widget"] {
  display: none !important;
}

/* Active pill tab affordance when JS toggles */
.PillTab-sc-19p75th-0.demo-tab-active {
  font-weight: 600;
}

img.demo-brand-mark {
  display: block;
  width: 28px;
  height: 28px;
  border-radius: 6px;
}

/* Hide broken merchant/account cloud logo plates; keep layout chips */
.AccountLogo__Root-ysfizm-0,
.MerchantLogo__Root-i5okkh-0 {
  background-image: none !important;
}
"""

APP_JS = r"""
(() => {
  const toast = document.createElement("div");
  toast.id = "demo-toast";
  toast.setAttribute("role", "status");
  toast.textContent = "Demo only";
  document.body.appendChild(toast);

  let toastTimer = 0;
  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 1600);
  }

  // Inert navigation feedback
  document.addEventListener("click", (event) => {
    const btn = event.target.closest("button.inert-nav");
    if (!btn) return;
    event.preventDefault();
    const label =
      (btn.getAttribute("aria-label") || btn.textContent || "Action")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 48) || "Action";
    showToast(`${label} — demo only`);
  });

  // Breakdown / Trends chart toggle
  const breakdown = document.getElementById("demo-breakdown-panel");
  const trends = document.getElementById("demo-trends-panel");

  function setTab(mode) {
    if (!breakdown || !trends) return;
    const showBreakdown = mode === "breakdown";
    breakdown.hidden = !showBreakdown;
    trends.hidden = showBreakdown;

    document.querySelectorAll(".PillTab-sc-19p75th-0").forEach((tab) => {
      const text = (tab.textContent || "").trim();
      const active =
        (showBreakdown && text === "Breakdown") ||
        (!showBreakdown && text === "Trends");
      tab.classList.toggle("demo-tab-active", active);
      // Swap hashed active/inactive classes if present
      if (active) {
        tab.classList.add("dBCgfg");
        tab.classList.remove("jFvwXN");
      } else if (text === "Breakdown" || text === "Trends") {
        tab.classList.add("jFvwXN");
        tab.classList.remove("dBCgfg");
      }
    });
  }

  document.addEventListener("click", (event) => {
    const tab = event.target.closest(".PillTab-sc-19p75th-0");
    if (!tab) return;
    const text = (tab.textContent || "").trim();
    if (text === "Breakdown") {
      setTab("breakdown");
      showToast("Breakdown view");
    } else if (text === "Trends") {
      setTab("trends");
      showToast("Trends view");
    }
  });

  // Filters / Save / Sort / Columns / Export — demo toasts
  document.addEventListener("click", (event) => {
    const el = event.target.closest("button, [role='button']");
    if (!el || el.classList.contains("inert-nav")) return;
    if (el.closest(".PillTab-sc-19p75th-0")) return;
    const label = (el.textContent || el.getAttribute("aria-label") || "")
      .replace(/\s+/g, " ")
      .trim();
    if (
      /^(Filters|Save|Sort|Columns|Export CSV|Bulk edit|Date|All time|By category)/i.test(
        label
      )
    ) {
      showToast(`${label.slice(0, 40)} — demo only`);
    }
  });

  setTab("breakdown");
})();
"""


def build_head() -> str:
    return """<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ledger | Reports</title>
  <meta name="description" content="Anonymized personal finance reports demo — income, spending breakdown, trends, and transaction summary.">
  <meta name="theme-color" content="#0F3D3E">
  <meta property="og:type" content="website">
  <meta property="og:title" content="Ledger | Reports">
  <meta property="og:description" content="Personal finance reports demo with spending breakdown and trends.">
  <meta property="og:site_name" content="Ledger">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="Ledger | Reports">
  <meta name="twitter:description" content="Personal finance reports demo with spending breakdown and trends.">
  <link rel="icon" type="image/svg+xml" href="./assets/favicon.svg">
  <link rel="stylesheet" href="./css/capture-inline.css">
  <link rel="stylesheet" href="./css/styles.css">
  <script src="./js/app.js" defer></script>
</head>
"""


def main() -> None:
    print("Primary source:", SOURCE.name)
    print("Pie source:", SOURCE_PIE.name)
    print("Alt source (reference only):", SOURCE_ALT.name)

    html = strip_bom(SOURCE.read_text(encoding="utf-8", errors="replace"))
    pie_html = strip_bom(SOURCE_PIE.read_text(encoding="utf-8", errors="replace"))

    print("Injecting Trends pie panel from secondary capture…")
    html = inject_pie_panel(html, pie_html)

    print("Extracting inline styles…")
    html, inline_css = extract_inline_styles(html)

    print("Stripping scripts / widgets…")
    html = strip_scripts(html)
    html = strip_junk_widgets(html)

    print("Restoring images + logos…")
    html = restore_image_srcs(html)
    html = replace_logos(html)

    print("Neutralizing anchors…")
    html = neutralize_anchors(html)

    print("Anonymizing text + amounts…")
    html = anonymize_text(html)
    html = strip_savepage_attrs(html)

    # Drop residual head link/meta/title inside document
    html = re.sub(r"<link\b[^>]*>", "", html, flags=re.I)
    html = re.sub(r"<meta\b[^>]*>", "", html, flags=re.I)
    html = re.sub(r"<title\b[^>]*>.*?</title>", "", html, flags=re.I | re.S)
    html = re.sub(r"<base\b[^>]*>", "", html, flags=re.I)

    body_html = strip_head_to_body(html)
    # Text already anonymized on full html; light host scrub only
    body_html = re.sub(r"\bmonarch\b", "ledger", body_html, flags=re.I)

    # Scrub brand hosts / icon font family from CSS (avoid re-running amount fuzzer)
    inline_css = inline_css.replace("MonarchIcons", "LedgerIcons")
    inline_css = re.sub(r"Monarch", "Ledger", inline_css)
    inline_css = re.sub(r"\bmonarch\b", "ledger", inline_css, flags=re.I)
    inline_css = re.sub(
        r"https?://[^\"')\s]*monarch\.com[^\"')\s]*",
        "",
        inline_css,
        flags=re.I,
    )
    # cloudinary brand bucket leftovers after Monarch→Ledger rename
    inline_css = inline_css.replace("ledger-money", "example-demo")
    inline_css = fix_savepage_css_urls(inline_css)

    OUT_INLINE_CSS.parent.mkdir(parents=True, exist_ok=True)
    OUT_INLINE_CSS.write_text(inline_css + "\n", encoding="utf-8")
    OUT_CSS.write_text(STYLES_CSS, encoding="utf-8")
    OUT_JS.parent.mkdir(parents=True, exist_ok=True)
    OUT_JS.write_text(APP_JS, encoding="utf-8")

    if not FAVICON.exists() or not LOGO.exists():
        raise SystemExit("missing logo/favicon assets")

    out = build_head() + body_html + "\n</html>\n"
    # Final brand scrub
    if re.search(r"monarch", out, re.I):
        print("WARNING: residual monarch strings — scrubbing…")
        out = re.sub(r"monarch\.com", "example.com", out, flags=re.I)
        out = re.sub(r"Monarch", "Ledger", out)
        out = re.sub(r"monarch", "ledger", out)

    # Scrub obvious leftover personal tokens
    for bad in ("Kurry", "Mercor", "DoorDash", "2692"):
        if bad in out:
            print(f"WARNING: residual {bad!r}")

    OUT_HTML.write_text(out, encoding="utf-8")
    print(f"Wrote {OUT_HTML} ({OUT_HTML.stat().st_size:,} bytes)")
    print(f"CSS {OUT_INLINE_CSS.stat().st_size:,} bytes")
    print("Remaining <a>:", len(re.findall(r"<a\b", out, re.I)))
    print("Monarch mentions:", len(re.findall(r"monarch", out, re.I)))
    print("Kurry/Mercor:", out.count("Kurry"), out.count("Mercor"))


if __name__ == "__main__":
    main()
