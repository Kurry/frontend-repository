# FinanceReports — Product Requirements Document (PRD)

This PRD specifies the **exact** static anonymized personal-finance reports page delivered in this folder. An implementer or AI given only this document must be able to recreate the same page: sidebar + summary cards + sankey/pie charts + transaction list, SavePage repairs, inert navigation, and the **debrand / full-text-replace** contract.

**Behavioral / visual reference:** personal-finance “Reports” UIs with income/expense summary, category breakdown (sankey), trends (pie), filters, and a transaction table (original SavePage sources were branded Monarch Money reports captures).  
**Local acceptance target:** the files in this directory after anonymization, CSS extraction, and SavePage repair (not a live SaaS app).

**Primary source file:** `Monarch _ Reports.html` (largest; Breakdown + Sankey + richest statistic cards).  
**Borrowed from:** `Monarch _ Reports (1).html` (Trends pie chart DOM).  
**Reference only:** `Monarch _ Reports (2).html` (smaller pie/trends variant).

---

## 1. Goal

Build a single-page **personal finance reports** demo branded as **Ledger**. Users can view summary metrics, toggle **Breakdown** (sankey) vs **Trends** (pie), scan category flows, and browse a sample transaction list. Every former outbound link must be removed or replaced with a non-navigating control. Product branding must be generic (**Ledger**), never the original host brand. All visible copy and demo amounts must be synthetic.

---

## 2. Non-goals

- No live backend, auth, bank linking (Plaid), payments (Stripe), or AI assistant APIs.
- No cookie CMP, Zendesk, reCAPTCHA, analytics, or AppsFlyer.
- No multi-page routing or dependency on `monarch.com` / original brand assets.
- Do not reset or touch any database.
- Do not modify sibling folders (`TripItinerary`, `CameraExposure`, `DaisyUI`, etc.).

---

## 3. Hard constraint: no navigational links

### MUST

- The document MUST contain **zero** navigational `<a href="...">` elements.
- Allowed `href` / `src` usages are resource loads only: stylesheets, scripts, fonts, images, favicon.
- Former links MUST become `<button type="button" class="… inert-nav">` (or inert spans).
- Clicks MUST NOT change `location`, open new tabs, trigger `mailto:` / `tel:`, or load other HTML pages.
- Demo feedback: clicking inert controls MAY show a short toast (`#demo-toast`).

---

## 4. Debrand & anonymization requirements (critical)

### MUST neutralize / replace

| Original identity cue | Local placeholder |
|---|---|
| Brand name Monarch | `Ledger` |
| Title `Monarch \| Reports` | `Ledger \| Reports` |
| Logo / favicon from brand host | `./assets/logo.svg`, `./assets/favicon.svg` |
| `og:site_name` / Twitter | `Ledger` (no original brand or OG image hosts) |
| `monarch.com` / `static.monarch.com` | `example.com` / removed |
| User display name (capture PII) | `Alex Rivera` |
| Employer / merchant `Mercor.io` | `Northwind Labs` |
| Bank label `Adv Plus Banking (...2692)` | `Primary Checking (…4821)` |
| Merchants (DoorDash, Uber, Apple, …) | Generic demo payees (QuickBite Delivery, CityRide, Summit Devices, …) |
| Real dollar amounts / percentages | Coherent fake demo figures (see `AMOUNT_MAP` in `build_capture.py`) |
| “Invite a friend, get $15” / free trial | Demo-mode copy |
| SavePage meta (`savepage-*`) | Removed |
| Cookie / Stripe / Plaid / captcha chrome | Removed |

### MUST preserve

- Reports layout: left sidebar nav, top page chrome, summary statistic cards, chart card with Breakdown/Trends pills, sankey (breakdown) + pie (trends), transaction table + summary strip.
- Interactive polish that can work offline: Breakdown/Trends panel toggle, inert-nav toasts for Filters/Save/Sort/Columns/Export.

### Analysis integrity

Values and labels in the delivered page MUST come from the capture transform pipeline (`build_capture.py`), not hand-pasted secrets from the live product. Static “cheat” JSON is out of scope; this is an HTML demo.

---

## 5. Tech stack & file layout

| Path | Role |
|---|---|
| `index.html` | Single page markup (anonymized capture body + new head) |
| `css/capture-inline.css` | Extracted SavePage / styled-components / app CSS |
| `css/styles.css` | Demo chrome: inert-nav, toast, chart panels, hide CMP residue |
| `js/app.js` | Breakdown/Trends toggle + inert-nav toasts |
| `assets/logo.svg` | Generic Ledger mark |
| `assets/favicon.svg` | Favicon |
| `build_capture.py` | Regenerates `index.html` + CSS/JS from source captures |
| `_source-capture.html` | Copy of **primary** Downloads file `Monarch _ Reports.html` |
| `_source-capture-pie.html` | Copy of `Monarch _ Reports (1).html` (Trends pie DOM) |
| `_source-capture-alt.html` | Copy of `Monarch _ Reports (2).html` (reference only) |

Serve locally:

```bash
cd FinanceReports && python3 -m http.server 8770
# open http://127.0.0.1:8770/
```

Regenerate after updating sources:

```bash
cd FinanceReports && python3 build_capture.py
```

---

## 6. Document shell

- Title: **Ledger | Reports**
- Meta description / OG / Twitter: generic finance-reports wording (no brand names, no personal names, no original site URLs or OG images).
- Body: captured app shell under `#root`, scripts stripped (SavePage `type="text/plain"` JS is discarded; demo behavior lives in `js/app.js`).

---

## 7. Layout architecture

1. **Sidebar** — nav items (Dashboard, Accounts, Transactions, Cash Flow, Reports, Budget, …) as inert controls; profile shows `Alex Rivera`.
2. **Summary cards** — Total Income, Total Expenses, Total Net Income, Savings Rate (fake amounts).
3. **Chart card** — subtitle “By category & group”; pills **Breakdown** / **Trends**.
   - Breakdown → `#demo-breakdown-panel` (sankey from primary capture).
   - Trends → `#demo-trends-panel` (pie from capture (1); hidden by default).
4. **Transactions** — sample rows with anonymized payees/amounts + summary (total transactions, largest, averages, date range).
5. **Chrome controls** — Filters, Save, Sort, Columns, Export → demo toasts only.

---

## 8. Build pipeline requirements

`build_capture.py` MUST:

1. Read `_source-capture.html` as base; inject pie panel from `_source-capture-pie.html`.
2. Extract `<style>` blocks into `css/capture-inline.css` (skip CMP/Stripe/captcha stylesheets by **attribute/href**, not by CSS body keywords).
3. Strip all `<script>` / `<noscript>` / `<iframe>` (fixes SavePage `text/plain` non-execution).
4. Drop pre-`#root` cookie CMP chrome.
5. Convert every `<a>` to inert `<button type="button">` / span.
6. Replace brand, PII, merchants, dates, and amounts per the maps in the script.
7. Write new document head + `css/styles.css` + `js/app.js`.
8. Assert zero `monarch` / personal-name leftovers in stdout warnings.

---

## 9. Verification checklist

- [ ] `python3 -m http.server` from `FinanceReports/` loads without console hard failures for missing local assets.
- [ ] Title is `Ledger | Reports`; no Monarch logo, meta, or copy.
- [ ] No `Kurry`, `Mercor`, real account digits, or original merchant names.
- [ ] No navigational `<a href>` in `index.html`.
- [ ] Breakdown shows sankey; Trends toggles to pie; toast appears.
- [ ] Sidebar / Filters / Save clicks show demo toasts and do not navigate away.
- [ ] Summary cards and transaction rows show synthetic amounts/labels.

---

## 10. Acceptance

Done when the folder serves a polished anonymized reports UI from the primary capture, Trends pie borrowed from capture (1), full text/PII scrub, inert navigation, and this PRD matches the delivered files.
