
(function () {
  // Block accidental navigation from any leftover anchors / forms
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href') || '';
    if (href.startsWith('#') && href.length > 1) return; // allow in-page
    e.preventDefault();
  }, true);

  document.addEventListener('submit', function (e) {
    e.preventDefault();
  }, true);

  // Header height CSS var
  function syncHeaderHeight() {
    var header = document.querySelector('sticky-header, .header-wrapper, header');
    if (!header) return;
    document.documentElement.style.setProperty('--header-height', header.offsetHeight + 'px');
  }
  syncHeaderHeight();
  window.addEventListener('resize', syncHeaderHeight);
})();
