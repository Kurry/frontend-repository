(() => {
  "use strict";

  /* ── French Riviera itinerary pins (Leaflet / OSM) ── */
  const PLACES = [
    { id: "old-nice", name: "old nice", day: 1, lat: 43.6970, lng: 7.2756, color: "#46cdcf" },
    { id: "promenade", name: "La promenade des anglais", day: 1, lat: 43.6950, lng: 7.2656, color: "#46cdcf" },
    { id: "castle-hill", name: "Colline du Château", day: 1, lat: 43.6956, lng: 7.2797, color: "#46cdcf" },
    { id: "st-jacques", name: "Église Saint-Jacques-le-Majeur de Nice", day: 1, lat: 43.6968, lng: 7.2769, color: "#46cdcf" },
    { id: "ste-reparata", name: "Cathédrale Sainte-Réparate de Nice", day: 1, lat: 43.6972, lng: 7.2759, color: "#46cdcf" },
    { id: "palace", name: "Prince's Palace of Monaco", day: 2, lat: 43.7311, lng: 7.4210, color: "#7045af" },
    { id: "casino", name: "Casino de Monte-Carlo", day: 2, lat: 43.7392, lng: 7.4270, color: "#7045af" },
    { id: "oceanographic", name: "Musée océanographique de Monaco", day: 2, lat: 43.7308, lng: 7.4253, color: "#7045af" },
    { id: "jardin-animalier", name: "Jardin Animalier de Monaco", day: 2, lat: 43.7316, lng: 7.4185, color: "#7045af" },
    { id: "naval-museum", name: "Monaco Naval Museum", day: 2, lat: 43.7338, lng: 7.4205, color: "#7045af" },
    { id: "croisette", name: "La Croisette - Cannes", day: 3, lat: 43.5495, lng: 7.0210, color: "#3498db" },
    { id: "festival-palace", name: "Palace of Festivals and Congresses of Cannes", day: 3, lat: 43.5510, lng: 7.0174, color: "#3498db" },
    { id: "hotel-ville-cannes", name: "Hôtel de Ville - Mairie de Cannes", day: 3, lat: 43.5525, lng: 7.0170, color: "#3498db" },
    { id: "vieux-port-cannes", name: "IGY Vieux-Port de Cannes", day: 3, lat: 43.5505, lng: 7.0145, color: "#3498db" },
    { id: "forville", name: "Marché Forville", day: 3, lat: 43.5528, lng: 7.0148, color: "#3498db" },
    { id: "picasso", name: "Musée Picasso", day: 4, lat: 43.5808, lng: 7.1283, color: "#f75940" },
    { id: "cap-antibes", name: "Cap d'Antibes", day: 4, lat: 43.5550, lng: 7.1300, color: "#f75940" },
    { id: "antibes-cathedral", name: "Antibes Cathedral", day: 4, lat: 43.5814, lng: 7.1275, color: "#f75940" },
    { id: "port-vauban", name: "Port Vauban Antibes", day: 4, lat: 43.5855, lng: 7.1288, color: "#f75940" },
    { id: "archeo-antibes", name: "musée d'archéologie d'Antibes", day: 4, lat: 43.5810, lng: 7.1268, color: "#f75940" },
    { id: "eze-village", name: "Èze Village", day: 5, lat: 43.7277, lng: 7.3617, color: "#17b978" },
    { id: "jardin-eze", name: "Jardin Exotique d’Èze", day: 5, lat: 43.7280, lng: 7.3612, color: "#17b978" },
    { id: "fragonard", name: "Parfumerie Fragonard - Usine Laboratoire de Èze", day: 5, lat: 43.7285, lng: 7.3605, color: "#17b978" },
    { id: "lices", name: "Place des Lices", day: 6, lat: 43.2690, lng: 6.6400, color: "#ec9b3b" },
    { id: "rolls-coffee", name: "Rolls coffee St-Tropez", day: 6, lat: 43.2720, lng: 6.6395, color: "#ec9b3b" },
    { id: "annonciade", name: "Annonciade Museum", day: 6, lat: 43.2735, lng: 6.6380, color: "#ec9b3b" },
    { id: "carnoles", name: "Fine Arts Museum / Carnolès Palace", day: 7, lat: 43.7745, lng: 7.4995, color: "#2c365d" },
    { id: "casino-menton", name: "Casino Barrière Menton", day: 7, lat: 43.7750, lng: 7.5045, color: "#2c365d" },
    { id: "chagall", name: "Marc Chagall National Museum", day: 0, lat: 43.7092, lng: 7.2615, color: "#3f52e3" },
    { id: "ephrussi", name: "Villa Ephrussi de Rothschild", day: 0, lat: 43.7050, lng: 7.3300, color: "#3f52e3" },
  ];

  const DAY_CENTERS = {
    1: { lat: 43.697, lng: 7.272, zoom: 14 },
    2: { lat: 43.732, lng: 7.422, zoom: 14 },
    3: { lat: 43.551, lng: 7.017, zoom: 14 },
    4: { lat: 43.575, lng: 7.128, zoom: 13 },
    5: { lat: 43.728, lng: 7.361, zoom: 15 },
    6: { lat: 43.271, lng: 6.640, zoom: 14 },
    7: { lat: 43.775, lng: 7.502, zoom: 14 },
  };

  const TRANSPARENT_GIF =
    "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

  /* ── Toast + inert navigation (source behavior) ── */
  let toast = document.getElementById("capture-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "capture-toast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    document.body.appendChild(toast);
  }

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
      // Allow in-page fragments; block outbound navigation (incl. OSM attribution)
      const href = a.getAttribute("href") || "";
      if (href.startsWith("#") && href.length > 1) {
        const el = document.getElementById(href.slice(1));
        if (el) {
          event.preventDefault();
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      if (!a.closest(".leaflet-control-attribution")) {
        showToast("Navigation disabled in this demo");
      }
    },
    true
  );

  document.addEventListener("click", (event) => {
    const btn = event.target.closest("button.inert-nav");
    if (!btn) return;
    if (btn.classList.contains("trip-place-hit")) return;
    if (btn.closest(".Tabs__tab, .nav-item[data-tab]")) return;
    const label =
      btn.getAttribute("aria-label") ||
      btn.textContent.replace(/\s+/g, " ").trim().slice(0, 48) ||
      "Action";
    showToast(`${label} — demo only`);
  });

  document.addEventListener("click", (event) => {
    const btn = event.target.closest(
      ".PlanPageSidebar button, .Sidebar button, button[role='tab'], .PlanNarrowNavSidebar__container button, .PlanWideNavSidebar__container button, .PlanNavSidebar__scrollable button"
    );
    if (!btn) return;
    const group = btn.closest(
      ".PlanPageSidebar, .Sidebar, [role='tablist'], .PlanNarrowNavSidebar__container, .PlanWideNavSidebar__container, .PlanNavSidebar__scrollable, .nav"
    );
    if (!group) return;
    group.querySelectorAll("button").forEach((b) => {
      b.classList.remove("is-demo-active");
      b.setAttribute("aria-pressed", "false");
    });
    btn.classList.add("is-demo-active");
    btn.setAttribute("aria-pressed", "true");
  });

  const style = document.createElement("style");
  style.textContent = `
    .PlaceCard, .place-card, [class*="CarouselCard"], [class*="PlaceListItem"], [class*="PictureViewItem"] {
      transition: transform 180ms ease, box-shadow 180ms ease;
    }
    .PlaceCard:hover, [class*="CarouselCard"]:hover, [class*="PlaceListItem"]:hover {
      transform: translateY(-2px);
    }
    button.is-demo-active { opacity: 1; font-weight: 700; }
    .PlanPageHeader__title.HoverTextInput__input,
    input.PlanPageHeader__title {
      text-align: left !important;
      text-indent: 0 !important;
    }
    .trip-place-hit.is-map-selected {
      outline: 2px solid #f75940;
      outline-offset: 2px;
      border-radius: 8px;
      background: rgba(247, 89, 64, 0.08);
    }
  `;
  document.head.appendChild(style);

  document.querySelectorAll("input.PlanPageHeader__title").forEach((input) => {
    input.scrollLeft = 0;
    try {
      input.setSelectionRange(0, 0);
    } catch (_) {
      /* ignore */
    }
  });

  /* ── Asset repair: mangled SavePage / quoted data-URI images ── */
  function repairBrokenImages() {
    document.querySelectorAll("img").forEach((img) => {
      const raw = img.getAttribute("src") || "";
      let decoded = raw;
      try {
        decoded = decodeURIComponent(raw);
      } catch (_) {
        decoded = raw;
      }
      const stripped = decoded.replace(/^["'%22]+|["'%22]+$/g, "");

      // Drop chat/support host assets (hidden chrome; often mangled srcs)
      if (/tiledesk|chat21/i.test(stripped) || /tiledesk|chat21/i.test(raw)) {
        img.setAttribute("src", TRANSPARENT_GIF);
        return;
      }

      if (!raw || raw === '""' || raw === "''" || stripped === "") {
        const fallback =
          img.getAttribute("data-savepage-src") ||
          img.getAttribute("data-savepage-currentsrc") ||
          TRANSPARENT_GIF;
        img.setAttribute("src", fallback.startsWith("http") || fallback.startsWith("data:") ? fallback : TRANSPARENT_GIF);
        return;
      }

      // src accidentally wrapped in quotes: "data:image/..." or "https://..."
      if (stripped.startsWith("data:image")) {
        img.setAttribute("src", stripped);
      } else if (stripped !== raw && (stripped.startsWith("http") || stripped.startsWith("data:"))) {
        // Prefer transparent placeholder for remote non-data (offline demo)
        img.setAttribute("src", stripped.startsWith("data:") ? stripped : TRANSPARENT_GIF);
      }

      img.addEventListener(
        "error",
        () => {
          if (img.dataset.repaired === "1") return;
          img.dataset.repaired = "1";
          img.src = TRANSPARENT_GIF;
        },
        { once: true }
      );
    });
  }

  /* ── Leaflet map ── */
  let map = null;
  const markersById = new Map();
  let activePlaceId = null;
  let resizeObserver = null;

  function pinIcon(label, color, active) {
    const size = active ? 36 : 28;
    const html = `
      <div class="trip-map-pin${active ? " is-active" : ""}" style="--pin:${color};width:${size}px;height:${size}px;">
        <span>${label}</span>
      </div>`;
    return L.divIcon({
      className: "trip-map-pin-wrap",
      html,
      iconSize: [size, size],
      iconAnchor: [size / 2, size],
      popupAnchor: [0, -size + 4],
    });
  }

  function findMapHost() {
    const gm = document.querySelector(".gm-style");
    if (gm && gm.parentElement) return gm.parentElement;

    const fixed = document.querySelector(".FixedPlanSidebar .position-relative.w-100.flex-grow-1.h-100");
    if (fixed) return fixed;

    const zoom = document.querySelector(".GoogleMapWithMarkers__zoomButtons");
    if (zoom) {
      let node = zoom.parentElement;
      while (node && node !== document.body) {
        const cs = window.getComputedStyle(node);
        if (
          (cs.position === "absolute" || cs.position === "relative") &&
          node.clientHeight > 160 &&
          node.clientWidth > 160
        ) {
          return node;
        }
        node = node.parentElement;
      }
    }
    return document.querySelector(".FixedPlanSidebar .SidebarPanel") || null;
  }

  function selectPlace(placeId, { fly = true, scrollList = true, openCard = true } = {}) {
    const place = PLACES.find((p) => p.id === placeId);
    if (!place) return;
    activePlaceId = placeId;

    markersById.forEach((marker, id) => {
      const p = PLACES.find((x) => x.id === id);
      if (!p) return;
      const dayLabel = p.day > 0 ? String(p.day) : "•";
      marker.setIcon(pinIcon(dayLabel, p.color, id === placeId));
      marker.setZIndexOffset(id === placeId ? 1000 : 0);
    });

    if (fly && map) {
      map.flyTo([place.lat, place.lng], Math.max(map.getZoom(), 14), { duration: 0.55 });
      const marker = markersById.get(placeId);
      if (marker) marker.openPopup();
    }

    document.querySelectorAll(".trip-place-hit").forEach((el) => {
      el.classList.toggle("is-map-selected", el.dataset.placeId === placeId);
    });

    if (openCard) {
      const card = document.querySelector(".PlanMapPlaceOverlay__selectedCard");
      if (card) card.classList.remove("d-none");
    }

    if (scrollList) {
      const hit = document.querySelector(`.trip-place-hit[data-place-id="${placeId}"]`);
      if (hit) hit.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  function focusDay(dayNum) {
    const center = DAY_CENTERS[dayNum];
    if (!center || !map) return;
    map.flyTo([center.lat, center.lng], center.zoom, { duration: 0.65 });
    const first = PLACES.find((p) => p.day === dayNum);
    if (first) selectPlace(first.id, { fly: false, scrollList: true });
  }

  function wirePlaceListHits() {
    const candidates = document.querySelectorAll(
      "button, [role='button'], strong, .PictureViewItem__text, .PlaceSnippet, [class*='PlaceSection']"
    );
    candidates.forEach((el) => {
      const text = (el.textContent || "").replace(/\s+/g, " ").trim();
      if (!text || text.length > 90) return;
      const place = PLACES.find(
        (p) => text === p.name || text.startsWith(p.name) || p.name.startsWith(text)
      );
      if (!place || el.dataset.placeId) return;
      el.dataset.placeId = place.id;
      el.classList.add("trip-place-hit");
      el.style.cursor = "pointer";
      el.addEventListener("click", (event) => {
        event.stopPropagation();
        selectPlace(place.id, { fly: true, scrollList: false });
        showToast(`${place.name} — on map`);
      });
    });
  }

  function wireDayNav() {
    const dayLabels = [
      [/sunday|jul(?:y)?\s*5|sun,?\s*jul/i, 1],
      [/monday|jul(?:y)?\s*6|mon,?\s*jul/i, 2],
      [/tuesday|jul(?:y)?\s*7|tue,?\s*jul/i, 3],
      [/wednesday|jul(?:y)?\s*8|wed,?\s*jul/i, 4],
      [/thursday|jul(?:y)?\s*9|thu,?\s*jul/i, 5],
      [/friday|jul(?:y)?\s*10|fri,?\s*jul/i, 6],
      [/saturday|jul(?:y)?\s*11|sat,?\s*jul/i, 7],
    ];
    document
      .querySelectorAll(
        ".PlanNarrowNavSidebarItem, .PlanWideNavSidebarItem, .PlanNarrowNavSidebar__container button, .PlanWideNavSidebar__container button, .day-item"
      )
      .forEach((el) => {
        const text = (el.textContent || "").replace(/\s+/g, " ").trim();
        for (const [re, day] of dayLabels) {
          if (re.test(text)) {
            el.addEventListener("click", () => {
              focusDay(day);
              showToast(`Day ${day} — map focused`);
            });
            break;
          }
        }
      });
  }

  function scheduleInvalidate() {
    if (!map) return;
    map.invalidateSize({ animate: false });
    window.setTimeout(() => map && map.invalidateSize({ animate: false }), 120);
    window.setTimeout(() => map && map.invalidateSize({ animate: false }), 400);
  }

  function initMap() {
    if (typeof L === "undefined") {
      console.warn("[trip] Leaflet failed to load");
      showToast("Map library failed to load");
      return;
    }

    // Prefer local marker assets if Leaflet ever falls back to defaults
    try {
      L.Icon.Default.imagePath = "./vendor/leaflet/images/";
    } catch (_) {
      /* ignore */
    }

    const host = findMapHost();
    if (!host) {
      console.warn("[trip] Map host not found");
      return;
    }

    host.querySelectorAll(".gm-style, .trip-leaflet-root").forEach((n) => n.remove());

    const root = document.createElement("div");
    root.className = "trip-leaflet-root";
    root.id = "trip-leaflet-map";
    root.setAttribute("role", "region");
    root.setAttribute("aria-label", "Interactive trip map — French Riviera");
    host.appendChild(root);

    const hostStyle = window.getComputedStyle(host);
    if (hostStyle.position === "static") host.style.position = "relative";
    if (!host.style.minHeight) host.style.minHeight = "240px";

    map = L.map(root, {
      zoomControl: true,
      attributionControl: true,
      scrollWheelZoom: true,
      tapTolerance: 15,
    }).setView([43.65, 7.15], 9);

    // No outbound Leaflet.org link in attribution (inert / offline demo)
    if (map.attributionControl) map.attributionControl.setPrefix("Leaflet");

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap",
    }).addTo(map);

    PLACES.forEach((place) => {
      const label = place.day > 0 ? String(place.day) : "•";
      const marker = L.marker([place.lat, place.lng], {
        icon: pinIcon(label, place.color, place.id === "picasso"),
        title: place.name,
        keyboard: true,
        riseOnHover: true,
      }).addTo(map);
      marker.bindPopup(
        `<strong>${place.name}</strong><br><span style="color:#6c757d;font-size:12px;">Day ${
          place.day || "idea"
        } · Côte d'Azur</span>`
      );
      marker.on("click", () => {
        selectPlace(place.id, { fly: false, scrollList: true });
        showToast(`${place.name} — selected`);
      });
      markersById.set(place.id, marker);
    });

    const bounds = L.latLngBounds(PLACES.map((p) => [p.lat, p.lng]));
    map.fitBounds(bounds.pad(0.12));
    scheduleInvalidate();

    window.addEventListener("resize", scheduleInvalidate);
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(scheduleInvalidate);
      resizeObserver.observe(host);
      const sidebar = document.querySelector(".FixedPlanSidebar");
      if (sidebar) resizeObserver.observe(sidebar);
    }

    selectPlace("picasso", { fly: true, scrollList: false });
  }

  document.addEventListener("click", (event) => {
    const toggle = event.target.closest(".PlaceDetailsIconRows__showHideTimes");
    if (!toggle) return;
    event.preventDefault();
    const row = toggle.closest(".IconRow, .col, .minw-0") || toggle.parentElement;
    const collapses = row ? row.querySelectorAll(".collapse") : [];
    if (collapses.length >= 2) {
      collapses.forEach((c) => c.classList.toggle("show"));
    }
    toggle.textContent = /hide/i.test(toggle.textContent) ? "Show times" : "Hide times";
  });

  const dismiss = document.getElementById("placeCardDismissButton");
  if (dismiss) {
    dismiss.addEventListener("click", () => {
      const card = document.querySelector(".PlanMapPlaceOverlay__selectedCard");
      if (card) card.classList.add("d-none");
      showToast("Place detail closed — demo only");
      scheduleInvalidate();
    });
  }

  document.querySelectorAll(".Tabs__tab [data-tab], .nav-item[data-tab]").forEach((tab) => {
    tab.addEventListener("click", (event) => {
      event.preventDefault();
      const name = tab.getAttribute("data-tab");
      const nav = tab.closest(".Tabs__tab, .nav, ul");
      if (!nav) return;
      nav.querySelectorAll(".nav-link, button").forEach((b) => b.classList.remove("active"));
      const link = tab.querySelector(".nav-link") || tab;
      link.classList.add("active");

      const card =
        tab.closest(".PlaceCard, .bg-white.rounded-16") || document.querySelector(".PlaceCard");
      if (!card) return;
      const panels = card.querySelectorAll(
        ".PlaceCard__maxHeight.overflow-y-auto, .overflow-y-auto.PlaceCard__maxHeight"
      );
      const order = ["about", "book", "reviews", "photos", "mentions"];
      const idx = order.indexOf(name);
      if (panels.length && idx >= 0) {
        panels.forEach((p, i) => {
          p.classList.toggle("d-none", i !== idx);
          p.classList.toggle("d-block", i === idx);
        });
      }
      showToast(`${name} — demo only`);
    });
  });

  function boot() {
    repairBrokenImages();
    initMap();
    wirePlaceListHits();
    wireDayNav();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
