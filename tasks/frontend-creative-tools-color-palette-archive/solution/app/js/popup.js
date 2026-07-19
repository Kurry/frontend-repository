(function () {
  function boot() {
    var popup = document.getElementById("oa-popup");
    if (!popup) return;
    var form = document.getElementById("oa-popup-form");
    var successEl = document.getElementById("oa-popup-success");
    var closeBtn = popup.querySelector(".oa-popup__close");

    if (sessionStorage.getItem("oa-popup-dismissed")) return;

    var shown = false;
    function showPopup() {
      if (shown) return;
      shown = true;
      popup.classList.add("is-visible");
      popup.setAttribute("aria-hidden", "false");
    }

    var timer = setTimeout(showPopup, 45000);

    function checkScrollProgress() {
      var scrolled =
        window.scrollY / Math.max(1, document.body.scrollHeight - window.innerHeight);
      if (scrolled > 0.5) showPopup();
    }

    window.addEventListener("scroll", checkScrollProgress, { passive: true });
    // Lenis may drive scroll without relying solely on native scroll listeners.
    if (window.lenis && typeof window.lenis.on === "function") {
      window.lenis.on("scroll", checkScrollProgress);
    } else {
      var lenisWait = setInterval(function () {
        if (window.lenis && typeof window.lenis.on === "function") {
          clearInterval(lenisWait);
          window.lenis.on("scroll", checkScrollProgress);
        }
      }, 200);
      setTimeout(function () {
        clearInterval(lenisWait);
      }, 5000);
    }

    if (closeBtn) {
      closeBtn.addEventListener("click", function () {
        popup.classList.remove("is-visible");
        popup.setAttribute("aria-hidden", "true");
        sessionStorage.setItem("oa-popup-dismissed", "1");
        clearTimeout(timer);
      });
    }

    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        form.style.display = "none";
        if (successEl) successEl.classList.add("is-visible");
        sessionStorage.setItem("oa-popup-dismissed", "1");
        setTimeout(function () {
          popup.classList.remove("is-visible");
          popup.setAttribute("aria-hidden", "true");
        }, 3000);
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
