# TravelItineraryPlanner — PRD

Clean-room static demo of a multi-day **French Riviera — Côte d'Azur** trip planner.

## Goal

Single-page itinerary planner with sidebar (Explore / Notes / Places / Budget + day list), plan body (hero, title, guides, recommended places, day sections), and a right map pane with place detail tabs (About / Book / Reviews / Photos / Mentions). Branding is generic **Trip** / **Travel Planner**.

## Non-goals

No backend, auth, booking APIs, Google Maps JS API, chat widgets, analytics, or original host branding.

## Hard constraints

- Zero navigational `<a href>` elements; controls are `button.inert-nav` (or demo buttons) with toast feedback (`#capture-toast`).
- No case-insensitive `wanderlog` substrings.
- Local assets only for logo/favicon; Source Sans Pro via Google Fonts allowed.

## Stack / layout

| Path | Role |
|---|---|
| `index.html` | Page shell |
| `css/styles.css` | Layout + polish |
| `js/app.js` | Itinerary data, map pins, place detail, toast, inert nav |
| `assets/logo.svg` / `favicon.svg` | Generic Trip marks |
| `README.md` | This PRD |

Serve:

```bash
cd variants/TravelItineraryPlanner && python3 -m http.server 9310
# open http://127.0.0.1:9310/
```

## Acceptance

1. Page renders sidebar + plan + map on port 9310.
2. Day nav / map pins / place rows open place detail; tabs switch content.
3. Inert controls show toast; URL does not navigate away.
4. French Riviera places (Nice, Monaco, Cannes, Antibes / Musée Picasso, Èze, Saint-Tropez, Menton) remain visible.
