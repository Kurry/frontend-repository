(function () {
  document.addEventListener(
    "click",
    function (e) {
      var a = e.target.closest && e.target.closest("a[href]");
      if (!a) return;
      var href = a.getAttribute("href") || "";
      if (href.startsWith("#") && href.length > 1) return;
      e.preventDefault();
    },
    true
  );

  document.addEventListener(
    "submit",
    function (e) {
      e.preventDefault();
    },
    true
  );

  function syncHeaderHeight() {
    var header = document.getElementById("SiteHeader") || document.querySelector("header");
    if (!header) return;
    document.documentElement.style.setProperty("--header-height", header.offsetHeight + "px");
  }

  function syncFooterReveal() {
    var footer = document.querySelector(".shopify-section-group-footer-group");
    var main = document.getElementById("MainContent");
    if (!footer || !main) return;
    main.style.setProperty("padding-bottom", footer.offsetHeight + "px", "important");
  }

  syncHeaderHeight();
  syncFooterReveal();
  window.addEventListener("resize", function () {
    syncHeaderHeight();
    syncFooterReveal();
  });
  window.addEventListener("load", syncFooterReveal);
})();
