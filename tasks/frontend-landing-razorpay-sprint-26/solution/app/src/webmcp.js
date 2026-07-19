/**
 * WebMCP surface for the Razorpay Sprint 26 microsite (contract zto-webmcp-v1).
 *
 * Every tool drives the SAME visible control the human UI uses — it locates the
 * real DOM element (segment nav anchor, play button, hamburger toggle, modal
 * close) and dispatches the identical click/handler path. There is no success
 * path here that the UI itself lacks.
 *
 *   window.webmcp_session_info()
 *   window.webmcp_list_tools()
 *   window.webmcp_invoke_tool(name, args)
 *
 * Modules:
 *   browse-query-v1   (prefix "browse")   — operation: open
 *   command-session-v1 (prefix "session") — operations: start, stop, trigger_demo
 */

// destination key -> in-page hash of the matching segment nav anchor
const DESTINATIONS = {
  hero: "#Hero",
  "agentic-stack": "#agentic-stack",
  international: "#international",
  "payment-gateway": "#payment-gateway",
  d2c: "#D2C",
  marketing: "#Marketers",
  "business-banking": "#finance",
};

const DEMOS = ["mobile-menu"];

export function initWebmcp() {
  const tools = {
    // ---- browse-query-v1 -------------------------------------------------
    browse_open: {
      description:
        "Open (scroll to) a page section: hero, agentic-stack, international, " +
        "payment-gateway, d2c, marketing, business-banking. Clicks the same " +
        "segment nav link a user would, scrolling the section into view and " +
        "marking it active.",
      handler(args) {
        args = args || {};
        const dest = args.destination;
        const hash = DESTINATIONS[dest];
        if (!hash) {
          return {
            ok: false,
            error:
              "Unknown destination; use one of " +
              Object.keys(DESTINATIONS).join(", "),
          };
        }
        // The identical control the UI exposes: the segment nav anchor.
        const cell = document.querySelector('a.seg-cell[href="' + hash + '"]');
        if (!cell) return { ok: false, error: "Nav control not found for " + dest };
        cell.click();
        return {
          ok: true,
          destination: dest,
          hash,
          active: cell.classList.contains("is-active"),
        };
      },
    },

    // ---- command-session-v1 ---------------------------------------------
    session_start: {
      description:
        "Start the executive video session: opens the video modal and locks " +
        "body scroll (same as clicking a play control).",
      handler() {
        const play = document.querySelector("[data-video]");
        if (!play) return { ok: false, error: "No play control found" };
        play.click();
        const modal = document.querySelector(".video-modal");
        return {
          ok: true,
          session: "video",
          open: !!(modal && modal.style.opacity === "1"),
          scrollLocked: document.body.style.overflow === "hidden",
        };
      },
    },
    session_stop: {
      description:
        "Stop the video session: closes the video modal and unlocks body " +
        "scroll (same as clicking the modal close control).",
      handler() {
        const close = document.querySelector(".video-close-button");
        if (!close) return { ok: false, error: "No close control found" };
        close.click();
        const modal = document.querySelector(".video-modal");
        return {
          ok: true,
          session: "video",
          open: !!(modal && modal.style.opacity === "1"),
        };
      },
    },
    session_trigger_demo: {
      description:
        "Trigger a page demo. demo=mobile-menu toggles the mobile hamburger " +
        "menu (same as tapping the hamburger/close icon).",
      handler(args) {
        args = args || {};
        const demo = args.demo;
        if (demo !== "mobile-menu") {
          return { ok: false, error: "Unknown demo; use one of " + DEMOS.join(", ") };
        }
        const toggle = document.getElementById("menu-toggle");
        if (!toggle) return { ok: false, error: "Mobile menu toggle not found" };
        toggle.click();
        const menu = document.getElementById("mobile-menu");
        return {
          ok: true,
          demo,
          menuOpen: !!(menu && menu.classList.contains("is-open")),
        };
      },
    },
  };

  window.webmcp_session_info = function () {
    return {
      contract_version: "zto-webmcp-v1",
      app: "razorpay-sprint-26",
      modules: ["browse-query-v1", "command-session-v1"],
      destinations: Object.keys(DESTINATIONS),
      session_operations: ["start", "stop", "trigger_demo"],
      demos: DEMOS.slice(),
      tool_count: Object.keys(tools).length,
    };
  };
  window.webmcp_list_tools = function () {
    return Object.keys(tools).map(function (name) {
      return { name: name, description: tools[name].description };
    });
  };
  window.webmcp_invoke_tool = function (name, args) {
    if (!tools[name]) throw new Error("Unknown WebMCP tool: " + name);
    return tools[name].handler(args || {});
  };
}
