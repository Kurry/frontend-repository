
(function() {
  function boot() {
    var popup = document.getElementById('oa-popup');
    if (!popup) return;
    var form = document.getElementById('oa-popup-form');
    var successEl = document.getElementById('oa-popup-success');
    var closeBtn = popup.querySelector('.oa-popup__close');

    if (sessionStorage.getItem('oa-popup-dismissed')) return;
    if (document.body.classList.contains('title-links')) return;

    var shown = false;
    function showPopup() {
      if (shown) return;
      shown = true;
      popup.classList.add('is-visible');
    }

    var timer = setTimeout(showPopup, 45000);

    window.addEventListener('scroll', function() {
      var scrolled = window.scrollY / Math.max(1, (document.body.scrollHeight - window.innerHeight));
      if (scrolled > 0.5) showPopup();
    }, { passive: true });

    if (closeBtn) {
      closeBtn.addEventListener('click', function() {
        popup.classList.remove('is-visible');
        sessionStorage.setItem('oa-popup-dismissed', '1');
        clearTimeout(timer);
      });
    }

    if (form) {
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        form.style.display = 'none';
        if (successEl) successEl.classList.add('is-visible');
        sessionStorage.setItem('oa-popup-dismissed', '1');
        setTimeout(function() {
          popup.classList.remove('is-visible');
        }, 3000);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
