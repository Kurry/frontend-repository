/*
 * units-gr oracle — WebMCP surface + real menu wiring.
 * Contract: zto-webmcp-v1, module browse-query-v1 (browse_open only).
 * Every tool handler calls the SAME code path a visible control uses.
 * Runs after the app bundle's DOMContentLoaded init (script is last in <body>).
 * In-memory only: no localStorage / sessionStorage.
 * The live units.gr homepage has no theme toggle and no in-page locale switch,
 * so none are added here — the "English" control stays inert, non-navigating chrome.
 */
(function () {
  "use strict";

  /* ---- Real control: menu overlay (backs the hamburger) ------------------ */
  var overlay = null;
  function buildOverlay() {
    overlay = document.createElement("div");
    overlay.className = "nav-overlay";
    overlay.setAttribute("aria-hidden", "true");
    var inner =
      '<div class="nav-overlay__inner"><button type="button" class="nav-overlay__close" aria-label="Κλείσιμο μενού">&times;</button><ul class="nav-overlay__list no-list">';
    document.querySelectorAll(".main-menu .menu-item a").forEach(function (a) {
      var t = a.querySelector(".f-ab-16-120");
      inner += '<li><a href="' + a.getAttribute("href") + '">' + (t ? t.textContent : a.textContent.trim()) + "</a></li>";
    });
    inner += '<li><a href="/book">Book your Unit</a></li></ul></div>';
    overlay.innerHTML = inner;
    document.body.appendChild(overlay);
    overlay.querySelector(".nav-overlay__close").addEventListener("click", closeMenu);
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) closeMenu();
    });
  }
  function openMenu() {
    if (!overlay) buildOverlay();
    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");
    document.body.classList.add("menu-open");
    return true;
  }
  function closeMenu() {
    if (!overlay) return true;
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
    document.body.classList.remove("menu-open");
    return true;
  }

  /* ---- Real control: scroll to a homepage section ------------------------ */
  var SECTION_SELECTORS = {
    "home-hero": "section.hero",
    locations: "section.locations",
    living: "section.living",
    "typical-unit": "section.typical_unit",
    community: "section.community",
    "what-we-stand-for": "section.what-we-stand-for",
    "insta-feed": "section.insta-feed",
    "book-cta": "section.arrows-header.background-orange"
  };
  function scrollToEl(el) {
    if (!el) return false;
    if (window.lenis && typeof window.lenis.scrollTo === "function") {
      window.lenis.scrollTo(el, { offset: 0, duration: 1.1 });
    } else {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    return true;
  }
  function browseOpen(destination) {
    if (destination === "menu") return openMenu();
    var sel = SECTION_SELECTORS[destination];
    if (!sel) return false;
    return scrollToEl(document.querySelector(sel));
  }

  /* ---- Wire the hamburger to the real menu ------------------------------- */
  function injectControls() {
    var burger = document.querySelector(".hamburger");
    if (burger) {
      burger.addEventListener("click", function (e) {
        e.preventDefault();
        if (document.body.classList.contains("menu-open")) closeMenu();
        else openMenu();
      });
    }
  }

  /* ---- Neutralize outbound navigation (chrome stays non-navigating) ------ */
  function neutralizeNavigation() {
    // capture phase so we run before the bundle's data-href click handler
    document.addEventListener(
      "click",
      function (e) {
        var el = e.target.closest && e.target.closest("a[href],[data-href]");
        if (!el) return;
        var href = el.getAttribute("href") || "";
        if (href.indexOf("mailto:") === 0 || href.indexOf("tel:") === 0) return; // contact facts
        // Every other homepage anchor/button (nav, Book, socials, the "English"
        // language control) is out-of-scope, inert chrome: keep on page.
        e.preventDefault();
        e.stopImmediatePropagation();
        var logo = el.closest(".logo");
        if (logo) scrollToEl(document.querySelector("section.hero"));
      },
      true
    );
  }

  /* ---- WebMCP registry --------------------------------------------------- */
  var TOOLS = {
    browse_open: {
      description: "Scroll to / activate a homepage section, or open the menu.",
      enum: { destination: Object.keys(SECTION_SELECTORS).concat(["menu"]) },
      handler: function (args) {
        var d = (args && args.destination) || "";
        var ok = browseOpen(d);
        return { ok: !!ok, destination: d };
      }
    }
  };

  window.webmcp_session_info = function () {
    return {
      contract_version: "zto-webmcp-v1",
      modules: ["browse-query-v1"],
      title: "Units — homepage browse/query",
      browsable_entity: "sections",
      tool_count: Object.keys(TOOLS).length
    };
  };
  window.webmcp_list_tools = function () {
    return Object.keys(TOOLS).map(function (name) {
      return { name: name, description: TOOLS[name].description, args: TOOLS[name].enum };
    });
  };
  window.webmcp_invoke_tool = function (name, args) {
    var t = TOOLS[name];
    if (!t) return { ok: false, error: "unknown_tool: " + name };
    try {
      return t.handler(args || {});
    } catch (err) {
      return { ok: false, error: String((err && err.message) || err) };
    }
  };

  // Optional navigator.modelContext mirror
  try {
    if (typeof navigator !== "undefined") {
      navigator.modelContext = navigator.modelContext || {};
      navigator.modelContext.units = {
        session_info: window.webmcp_session_info,
        list_tools: window.webmcp_list_tools,
        invoke_tool: window.webmcp_invoke_tool
      };
    }
  } catch (e) {}

  function boot() {
    injectControls();
    neutralizeNavigation();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
