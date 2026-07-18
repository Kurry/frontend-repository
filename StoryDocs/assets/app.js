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

  // Block any residual navigation
  document.addEventListener(
    "click",
    (event) => {
      const a = event.target.closest("a[href]");
      if (!a) return;
      const href = a.getAttribute("href") || "";
      if (href.startsWith("#") && href.length > 1) return;
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

  // View mode toggles (Tile / List / Slide)
  const grid = document.querySelector(".scenes-grid");
  const viewButtons = Array.from(
    document.querySelectorAll(
      "button.inert-nav .icon-tiles, button .icon-tiles, button .icon-list, button .icon-slides"
    )
  )
    .map((icon) => icon.closest("button"))
    .filter(Boolean);

  // Fallback: find buttons near storyboard-nav by icon class on children
  const nav = document.querySelector(".storyboard-nav");
  if (nav && grid) {
    const modeButtons = Array.from(nav.querySelectorAll("button")).filter((b) =>
      b.querySelector(".icon-tiles, .icon-list, .icon-slides")
    );

    function setMode(mode) {
      grid.classList.remove("is-list", "is-slide");
      if (mode === "list") grid.classList.add("is-list");
      if (mode === "slide") {
        grid.classList.add("is-slide");
        const cols = Array.from(grid.querySelectorAll(".scene-column"));
        cols.forEach((c, i) => c.classList.toggle("is-slide-active", i === 0));
      }
      modeButtons.forEach((b) => {
        const isTiles = b.querySelector(".icon-tiles");
        const isList = b.querySelector(".icon-list");
        const isSlide = b.querySelector(".icon-slides");
        const active =
          (mode === "tile" && isTiles) ||
          (mode === "list" && isList) ||
          (mode === "slide" && isSlide);
        b.setAttribute("aria-pressed", active ? "true" : "false");
        b.classList.toggle("is-active", !!active);
      });
      showToast(
        mode === "tile" ? "Tile mode" : mode === "list" ? "List mode" : "Slide mode"
      );
    }

    modeButtons.forEach((b) => {
      b.addEventListener("click", (e) => {
        e.stopPropagation();
        if (b.querySelector(".icon-tiles")) setMode("tile");
        else if (b.querySelector(".icon-list")) setMode("list");
        else if (b.querySelector(".icon-slides")) setMode("slide");
      });
    });
    // default pressed state
    modeButtons.forEach((b) => {
      if (b.querySelector(".icon-tiles")) {
        b.setAttribute("aria-pressed", "true");
        b.classList.add("is-active");
      }
    });
  }

  // Scene description "edit" affordance
  document.querySelectorAll(".scene-description").forEach((el) => {
    el.setAttribute("tabindex", "0");
    el.addEventListener("focus", () => el.classList.add("is-editing"));
    el.addEventListener("blur", () => el.classList.remove("is-editing"));
    el.addEventListener("click", () => {
      el.classList.add("is-editing");
      showToast("Scene description — demo only");
    });
  });

  // Subtle enter animation for scenes
  const cols = document.querySelectorAll(".scene-column .scene-item");
  cols.forEach((card, i) => {
    card.style.opacity = "0";
    card.style.transform = "translateY(8px)";
    requestAnimationFrame(() => {
      setTimeout(() => {
        card.style.transition = "opacity 320ms ease, transform 320ms ease";
        card.style.opacity = "1";
        card.style.transform = "";
      }, 40 + i * 45);
    });
  });
})();
