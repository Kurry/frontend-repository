
(() => {
  const toast = document.createElement("div");
  toast.id = "demo-toast";
  toast.setAttribute("role", "status");
  toast.textContent = "Demo only";
  document.body.appendChild(toast);

  let toastTimer = 0;
  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 1600);
  }

  // Inert navigation feedback
  document.addEventListener("click", (event) => {
    const btn = event.target.closest("button.inert-nav");
    if (!btn) return;
    event.preventDefault();
    const label =
      (btn.getAttribute("aria-label") || btn.textContent || "Action")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 48) || "Action";
    showToast(`${label} — demo only`);
  });

  // Breakdown / Trends chart toggle
  const breakdown = document.getElementById("demo-breakdown-panel");
  const trends = document.getElementById("demo-trends-panel");

  function setTab(mode) {
    if (!breakdown || !trends) return;
    const showBreakdown = mode === "breakdown";
    breakdown.hidden = !showBreakdown;
    trends.hidden = showBreakdown;

    document.querySelectorAll(".PillTab-sc-19p75th-0").forEach((tab) => {
      const text = (tab.textContent || "").trim();
      const active =
        (showBreakdown && text === "Breakdown") ||
        (!showBreakdown && text === "Trends");
      tab.classList.toggle("demo-tab-active", active);
      // Swap hashed active/inactive classes if present
      if (active) {
        tab.classList.add("dBCgfg");
        tab.classList.remove("jFvwXN");
      } else if (text === "Breakdown" || text === "Trends") {
        tab.classList.add("jFvwXN");
        tab.classList.remove("dBCgfg");
      }
    });
  }

  document.addEventListener("click", (event) => {
    const tab = event.target.closest(".PillTab-sc-19p75th-0");
    if (!tab) return;
    const text = (tab.textContent || "").trim();
    if (text === "Breakdown") {
      setTab("breakdown");
      showToast("Breakdown view");
    } else if (text === "Trends") {
      setTab("trends");
      showToast("Trends view");
    }
  });

  // Filters / Save / Sort / Columns / Export — demo toasts
  document.addEventListener("click", (event) => {
    const el = event.target.closest("button, [role='button']");
    if (!el || el.classList.contains("inert-nav")) return;
    if (el.closest(".PillTab-sc-19p75th-0")) return;
    const label = (el.textContent || el.getAttribute("aria-label") || "")
      .replace(/\s+/g, " ")
      .trim();
    if (
      /^(Filters|Save|Sort|Columns|Export CSV|Bulk edit|Date|All time|By category)/i.test(
        label
      )
    ) {
      showToast(`${label.slice(0, 40)} — demo only`);
    }
  });

  setTab("breakdown");
})();
