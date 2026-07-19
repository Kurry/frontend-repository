/**
 * WebMCP surface for the Wolverine Worldwide homepage oracle.
 * Contract: zto-webmcp-v1 — module: browse-query-v1 (browse_open only).
 *
 * Every handler drives the SAME code path as the visible UI:
 *  - section destinations scroll the real section element into view (what a
 *    user scroll does), which trips the same IntersectionObserver reveals.
 *  - mobile-menu / responsibility-dropdown dispatch a real click() on the
 *    actual header toggler button, running the component's own handler.
 * No arbitrary URLs, selectors, or routes are accepted — only the bounded
 * destination enum below.
 */
(function () {
  "use strict";

  var reduce = false;
  try {
    reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (e) {}

  function byText(sel, text) {
    var nodes = document.querySelectorAll(sel);
    for (var i = 0; i < nodes.length; i++) {
      if ((nodes[i].textContent || "").indexOf(text) !== -1) return nodes[i];
    }
    return null;
  }

  function card(text) {
    var el = byText(".c-card_title, .c-card_eyebrow", text);
    return el ? el.closest(".c-card") || el : null;
  }

  // Section destinations → resolver returning the real DOM element to reveal.
  var SECTIONS = {
    hero: function () {
      return document.querySelector(".c-hero-home");
    },
    "brand-portfolio": function () {
      return document.querySelector(".c-standout-image-galaxy");
    },
    "annual-report": function () {
      return document.querySelector(".c-large-card");
    },
    "culture-statement": function () {
      return byText("h2", "one shared culture") || document.querySelector(".c-two-cols");
    },
    "market-snapshot": function () {
      return document.querySelector(".c-market-snapshot");
    },
    "latest-news": function () {
      return document.querySelector("c-carousel") || document.querySelector(".c-cards-carousel");
    },
    "culture-stats": function () {
      return card("96% of employees");
    },
    awards: function () {
      return card("Company of the Year");
    },
    "careers-cta": function () {
      return document.querySelector(".c-push");
    },
  };

  // Chrome overlay destinations → click the real header control.
  var TOGGLERS = {
    "mobile-menu": function () {
      return document.querySelector('[data-mobile-menu="toggler"]');
    },
    "responsibility-dropdown": function () {
      return (
        document.querySelector("[data-header-dropdown-toggler]") ||
        document.querySelector(".c-header_nav-dropdown-toggler")
      );
    },
  };

  var DESTINATIONS = Object.keys(SECTIONS).concat(Object.keys(TOGGLERS));

  // Sticky header height — scroll sections just below it so the section heading
  // lands in the viewport (block:"start" alone tucks it under the fixed header,
  // and smooth scroll can be sampled mid-flight; land the target deterministically).
  var HEADER_OFFSET = 96;

  function openDestination(destination) {
    if (SECTIONS[destination]) {
      var el = SECTIONS[destination]();
      if (!el) return { ok: false, error: "section-not-found", destination: destination };
      var y = el.getBoundingClientRect().top + window.pageYOffset - HEADER_OFFSET;
      if (y < 0) y = 0;
      // Instant scroll (same target element a UI nav click resolves to) so the
      // section is settled in view the moment the call returns. Instant scrolls
      // land synchronously, so verify the section is actually in the viewport
      // before reporting success; fall back through the primitive scroll APIs
      // if the options-object form was ignored.
      window.scrollTo({ top: y, left: 0, behavior: "auto" });
      if (Math.abs(window.pageYOffset - y) > 2) window.scrollTo(0, y);
      if (Math.abs(window.pageYOffset - y) > 2) {
        document.documentElement.scrollTop = y;
        document.body.scrollTop = y;
      }
      if (Math.abs(window.pageYOffset - y) > 2) {
        el.scrollIntoView(true);
        window.scrollBy(0, -HEADER_OFFSET);
      }
      var top = el.getBoundingClientRect().top;
      var landed = top > -2 && top < window.innerHeight;
      if (!landed) {
        return {
          ok: false,
          error: "scroll-failed",
          destination: destination,
          expected_scroll_y: y,
          scroll_y: window.pageYOffset,
        };
      }
      return {
        ok: true,
        destination: destination,
        action: "scroll-into-view",
        scroll_y: window.pageYOffset,
      };
    }
    if (TOGGLERS[destination]) {
      var btn = TOGGLERS[destination]();
      if (!btn) return { ok: false, error: "control-not-found", destination: destination };
      // Open-only / idempotent: repeated browse_open must never close an already
      // open overlay (a toggle would desync a subsequent manual grading pass).
      var root = document.documentElement;
      var isOpen =
        destination === "mobile-menu"
          ? root.classList.contains("has-menu-opened")
          : btn.getAttribute("aria-expanded") === "true" ||
            root.classList.contains("has-dropdown-opened");
      if (!isOpen) btn.click();
      return { ok: true, destination: destination, action: isOpen ? "already-open" : "click-toggler" };
    }
    return { ok: false, error: "unknown-destination", destination: destination };
  }

  var TOOLS = [
    {
      name: "browse_open",
      description:
        "Reveal a homepage section or open a header overlay by activating the same control the UI exposes. destination is one of the bounded values in the enum.",
      module: "browse-query-v1",
      input_schema: {
        type: "object",
        properties: {
          destination: { type: "string", enum: DESTINATIONS },
        },
        required: ["destination"],
      },
    },
  ];

  function sessionInfo() {
    return {
      contract_version: "zto-webmcp-v1",
      app: "wolverineworldwide-home",
      modules: ["browse-query-v1"],
      bindings: {
        browsable_entity: "homepage-section",
        destinations: DESTINATIONS,
      },
      tools: TOOLS.map(function (t) {
        return t.name;
      }),
    };
  }

  function listTools() {
    return TOOLS;
  }

  function invokeTool(name, args) {
    args = args || {};
    if (name !== "browse_open") {
      return { ok: false, error: "unknown-tool", name: name };
    }
    var destination = args.destination;
    if (DESTINATIONS.indexOf(destination) === -1) {
      return { ok: false, error: "invalid-destination", destination: destination, allowed: DESTINATIONS };
    }
    return openDestination(destination);
  }

  window.webmcp_session_info = sessionInfo;
  window.webmcp_list_tools = listTools;
  window.webmcp_invoke_tool = invokeTool;

  // Optional navigator.modelContext mirror (additive; contract surface is the window.* trio).
  try {
    if (navigator && !navigator.modelContext) {
      navigator.modelContext = {
        listTools: listTools,
        callTool: function (name, args) {
          return invokeTool(name, args);
        },
      };
    }
  } catch (e) {}
})();
