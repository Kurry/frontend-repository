(() => {
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
