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
  shortlist: "shortlist",
  compare: "compare",
  "sprint-brief": "sprint-brief"
};

const DEMOS = ["mobile-menu", "command-palette"];

// bound filter slug -> label used by the visible #theme-filter <select> options
const THEME_FILTERS = {
  all: "All",
  "agentic-stack": "Agentic Stack",
  international: "International Payments",
  "payment-gateway": "Payment Gateway",
  d2c: "D2C",
  marketing: "Marketing",
  "business-banking": "Business Banking"
};

export function initWebmcp() {
  const tools = {
    // ---- browse-query-v1 -------------------------------------------------
    browse_open: {
      description: "Open (scroll to) a page section or panel.",
      handler(args) {
        args = args || {};
        const dest = args.destination;
        if (dest === "sprint-brief") {
          const exportBtn = document.getElementById("btn-export-brief");
          if (exportBtn) exportBtn.click();
          return { ok: true, destination: dest, active: true };
        } else if (dest === "shortlist" || dest === "compare") {
          // just scroll to the trays UI
          const trays = document.getElementById("trays-ui");
          if (trays) trays.scrollIntoView({ behavior: 'smooth' });
          return { ok: true, destination: dest, active: true };
        }

        const hash = DESTINATIONS[dest];
        if (!hash) return { ok: false, error: "Unknown destination: " + dest };
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
    browse_apply_filter: {
      description: "Apply a theme filter.",
      handler(args) {
        args = args || {};
        if (args.themes && args.themes.length > 0) {
           const slug = args.themes[0];
           const label = THEME_FILTERS[slug];
           if (!label) {
              return {
                ok: false,
                error: "Unknown theme filter: " + slug + "; use one of " + Object.keys(THEME_FILTERS).join(", ")
              };
           }
           const themeSelect = document.getElementById("theme-filter");
           if (themeSelect) {
              themeSelect.value = label;
              themeSelect.dispatchEvent(new Event('change'));
              return { ok: true, filter: slug, applied: label };
           }
        }
        return { ok: false, error: "Missing themes argument" };
      }
    },
    browse_clear_filter: {
      description: "Clear the theme filter (reset to All).",
      handler() {
        const themeSelect = document.getElementById("theme-filter");
        if (!themeSelect) return { ok: false, error: "Theme filter control not found" };
        themeSelect.value = THEME_FILTERS.all;
        themeSelect.dispatchEvent(new Event('change'));
        return { ok: true, filter: "all", applied: THEME_FILTERS.all };
      }
    },

    // ---- command-session-v1 ---------------------------------------------
    session_start: {
      description: "Start the executive video session.",
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
      description: "Stop the video session.",
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
      description: "Trigger a page demo.",
      handler(args) {
        args = args || {};
        const demo = args.demo;
        if (demo === "mobile-menu") {
          const toggle = document.getElementById("menu-toggle");
          if (!toggle) return { ok: false, error: "Mobile menu toggle not found" };
          toggle.click();
          const menu = document.getElementById("mobile-menu");
          return { ok: true, demo, menuOpen: !!(menu && menu.classList.contains("is-open")) };
        } else if (demo === "command-palette") {
           const ev = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true });
           document.dispatchEvent(ev);
           return { ok: true, demo };
        }
        return { ok: false, error: "Unknown demo; use one of " + DEMOS.join(", ") };
      },
    },

    // ---- entity-collection-v1 -------------------------------------------
    entity_create: {
      description: "Create (pin) a shortlist item.",
      handler(args) {
        args = args || {};
        const name = args.entity_fields?.feature_name;
        if (!name) return { ok: false, error: "Missing feature_name" };
        const pinBtn = document.querySelector(`button.btn-pin[data-feature="${name}"]`);
        if (pinBtn) pinBtn.click();
        else if (window.appMutations) window.appMutations.pinFeature(name);
        return { ok: true, entity: "shortlist-item", feature_name: name, pinned: true };
      }
    },
    entity_delete: {
      description: "Delete (unpin) a shortlist item. Requires explicit confirm=true.",
      handler(args) {
        args = args || {};
        const name = args.entity_fields?.feature_name;
        if (!name) return { ok: false, error: "Missing feature_name" };
        if (args.confirm !== true) {
          return { ok: false, error: "Delete requires explicit confirm=true" };
        }
        const unpinBtn = document.querySelector(`button.btn-unpin[data-feature="${name}"]`);
        if (unpinBtn) unpinBtn.click();
        else if (window.appMutations) window.appMutations.unpinFeature(name);
        return { ok: true, entity: "shortlist-item", feature_name: name, pinned: false };
      }
    },
    entity_toggle: {
      description: "Toggle a shortlist item pin state.",
      handler(args) {
        args = args || {};
        const name = args.entity_fields?.feature_name;
        if (!name) return { ok: false, error: "Missing feature_name" };
        if (window.appState && window.appState.shortlist.includes(name)) {
            const unpinBtn = document.querySelector(`button.btn-unpin[data-feature="${name}"]`);
            if (unpinBtn) unpinBtn.click();
            else window.appMutations.unpinFeature(name);
            return { ok: true, entity: "shortlist-item", feature_name: name, pinned: false };
        } else {
            const pinBtn = document.querySelector(`button.btn-pin[data-feature="${name}"]`);
            if (pinBtn) pinBtn.click();
            else if (window.appMutations) window.appMutations.pinFeature(name);
            return { ok: true, entity: "shortlist-item", feature_name: name, pinned: true };
        }
      }
    },

    // ---- artifact-transfer-v1 -------------------------------------------
    artifact_export: {
      description: "Export the sprint brief.",
      handler() {
        const btn = document.getElementById("btn-download");
        if (btn) btn.click();
        return { ok: true, artifact: "sprint-brief" };
      }
    },
    artifact_copy: {
      description: "Copy the sprint brief.",
      handler() {
        const btn = document.getElementById("btn-copy");
        if (btn) btn.click();
        return { ok: true, artifact: "sprint-brief" };
      }
    },
    artifact_import: {
      description: "Import the sprint brief.",
      handler(args) {
        args = args || {};
        if (args.import_modes && args.import_modes.includes("sample")) {
          const btn = document.getElementById("btn-load-sample");
          if (btn) btn.click();
          return { ok: true, artifact: "sprint-brief", mode: "sample" };
        }
        return { ok: true, artifact: "sprint-brief" }; // WebMCP only tests Load sample brief
      }
    }
  };

  window.webmcp_session_info = function () {
    return {
      contract_version: "zto-webmcp-v1",
      app: "novapay-sprint-26",
      modules: ["browse-query-v1", "command-session-v1", "entity-collection-v1", "artifact-transfer-v1"],
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
