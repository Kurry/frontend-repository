/**
 * Oracle header controls — wires the real header buttons to the class hooks the
 * compiled stylesheet keys on. This is the single code path that both the
 * visible controls and the WebMCP browse_open handlers invoke (webmcp.js calls
 * button.click(), which lands here).
 *
 *  - [data-mobile-menu="toggler"] click  → toggle html.has-menu-opened
 *  - [data-mobile-menu="close"] / logo   → close
 *  - Escape                              → close menu / dropdown
 *  - [data-header-dropdown-toggler] click → toggle html.has-dropdown-opened
 */
(function () {
  "use strict";
  var root = document.documentElement;

  function indexMenuItems() {
    var items = document.querySelectorAll(
      ".c-mobile-menu_main-item, .c-mobile-menu_secondary-item"
    );
    items.forEach(function (el, i) {
      el.style.setProperty("--index", String(i));
    });
  }

  function openMenu() {
    indexMenuItems();
    root.classList.add("has-menu-opened");
    var t = document.querySelector('[data-mobile-menu="toggler"]');
    if (t) t.setAttribute("aria-expanded", "true");
  }
  function closeMenu() {
    root.classList.remove("has-menu-opened");
    var t = document.querySelector('[data-mobile-menu="toggler"]');
    if (t) t.setAttribute("aria-expanded", "false");
  }
  function toggleMenu() {
    if (root.classList.contains("has-menu-opened")) closeMenu();
    else openMenu();
  }

  function toggleDropdown(btn) {
    var expanded = btn.getAttribute("aria-expanded") === "true";
    // close sibling togglers
    document.querySelectorAll("[data-header-dropdown-toggler]").forEach(function (b) {
      if (b !== btn) b.setAttribute("aria-expanded", "false");
    });
    btn.setAttribute("aria-expanded", expanded ? "false" : "true");
    root.classList.toggle("has-dropdown-opened", !expanded);
  }
  function closeDropdown() {
    root.classList.remove("has-dropdown-opened");
    document.querySelectorAll("[data-header-dropdown-toggler]").forEach(function (b) {
      b.setAttribute("aria-expanded", "false");
    });
  }

  document.addEventListener("click", function (e) {
    var toggler = e.target.closest && e.target.closest('[data-mobile-menu="toggler"]');
    if (toggler) {
      e.preventDefault();
      toggleMenu();
      return;
    }
    var closeBtn =
      e.target.closest &&
      (e.target.closest('[data-mobile-menu="close"]') ||
        e.target.closest('[data-mobile-menu="logo"]'));
    if (closeBtn) {
      closeMenu();
      return;
    }
    var dd = e.target.closest && e.target.closest("[data-header-dropdown-toggler]");
    if (dd) {
      e.preventDefault();
      toggleDropdown(dd);
      return;
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      closeMenu();
      closeDropdown();
    }
  });

  indexMenuItems();
})();
