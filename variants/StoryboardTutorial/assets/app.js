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
    if (btn.closest(".storyboard-nav") && btn.querySelector(".icon-tiles, .icon-list, .icon-slides")) {
      return;
    }
    const label =
      btn.getAttribute("aria-label") ||
      btn.textContent.replace(/\s+/g, " ").trim().slice(0, 48) ||
      "Action";
    showToast(`${label} — demo only`);
  });

  const grid = document.querySelector(".scenes-grid");
  const nav = document.querySelector(".storyboard-nav");
  const slideControls = document.querySelector(".slide-controls");
  const slideCounter = document.querySelector(".slide-counter");
  let slideIndex = 0;

  function slideColumns() {
    if (!grid) return [];
    return Array.from(grid.querySelectorAll(".scene-column")).filter((c) =>
      c.querySelector(".scene-item")
    );
  }

  function syncSlideNav() {
    const cols = slideColumns();
    cols.forEach((c, i) => c.classList.toggle("is-slide-active", i === slideIndex));
    if (slideCounter) {
      slideCounter.textContent = cols.length ? `${slideIndex + 1} / ${cols.length}` : "0 / 0";
    }
    if (slideControls) {
      const prev = slideControls.querySelector('[data-slide-dir="-1"]');
      const next = slideControls.querySelector('[data-slide-dir="1"]');
      if (prev) prev.disabled = slideIndex <= 0;
      if (next) next.disabled = slideIndex >= cols.length - 1;
    }
  }

  function stepSlide(delta) {
    const cols = slideColumns();
    if (!cols.length) return;
    const next = Math.max(0, Math.min(cols.length - 1, slideIndex + delta));
    if (next === slideIndex) return;
    slideIndex = next;
    syncSlideNav();
    showToast(`Scene ${slideIndex + 1}`);
  }

  if (nav && grid) {
    const modeButtons = Array.from(nav.querySelectorAll("button")).filter((b) =>
      b.querySelector(".icon-tiles, .icon-list, .icon-slides")
    );

    function setMode(mode) {
      grid.classList.remove("is-list", "is-slide");
      if (slideControls) slideControls.hidden = mode !== "slide";
      if (mode === "list") grid.classList.add("is-list");
      if (mode === "slide") {
        grid.classList.add("is-slide");
        slideIndex = 0;
        syncSlideNav();
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
        b.classList.toggle("active", !!active);
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

    modeButtons.forEach((b) => {
      if (b.querySelector(".icon-tiles")) {
        b.setAttribute("aria-pressed", "true");
        b.classList.add("is-active", "active");
      }
    });

    if (slideControls) {
      slideControls.addEventListener("click", (event) => {
        const btn = event.target.closest("[data-slide-dir]");
        if (!btn || btn.disabled) return;
        event.stopPropagation();
        stepSlide(Number(btn.getAttribute("data-slide-dir")) || 0);
      });
    }

    document.addEventListener("keydown", (event) => {
      if (!grid.classList.contains("is-slide")) return;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        stepSlide(-1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        stepSlide(1);
      }
    });
  }

  document.querySelectorAll(".scene-description").forEach((el) => {
    el.setAttribute("tabindex", "0");
    el.addEventListener("focus", () => el.classList.add("is-editing"));
    el.addEventListener("blur", () => el.classList.remove("is-editing"));
    el.addEventListener("click", (event) => {
      if (event.target.closest("button")) return;
      el.classList.add("is-editing");
      showToast("Scene description — demo only");
    });
  });

  const enterCards = document.querySelectorAll(".scene-column .scene-item");
  enterCards.forEach((card, i) => {
    card.classList.add("is-entering");
    requestAnimationFrame(() => {
      window.setTimeout(() => {
        card.classList.add("is-entered");
        card.classList.remove("is-entering");
      }, 40 + i * 45);
    });
  });
  window.setTimeout(() => {
    enterCards.forEach((card) => {
      card.classList.add("is-entered");
      card.classList.remove("is-entering");
    });
  }, 1200);

  const backTop = document.querySelector(".back-to-top");
  if (backTop) {
    const sync = () => {
      backTop.style.display = window.scrollY > 400 ? "inline-flex" : "none";
    };
    window.addEventListener("scroll", sync, { passive: true });
    backTop.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    sync();
  }
})();
