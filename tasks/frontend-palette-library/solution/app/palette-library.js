
(function () {
  var sid = 'template--27515259093026__palette_library_GpBcQB';

  function isLight(hex) {
    var h = hex.replace('#', '');
    if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
    var r = parseInt(h.substring(0,2),16);
    var g = parseInt(h.substring(2,4),16);
    var b = parseInt(h.substring(4,6),16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 160;
  }

  function hueSort(hex) {
    var h = hex.replace('#','');
    var r = parseInt(h.substring(0,2),16) / 255;
    var g = parseInt(h.substring(2,4),16) / 255;
    var b = parseInt(h.substring(4,6),16) / 255;
    var max = Math.max(r,g,b), min = Math.min(r,g,b);
    var l = (max + min) / 2;
    if (max === min) return 1000 + (1 - l) * 100;
    var d = max - min;
    var s = d / (1 - Math.abs(2*l - 1));
    var hue;
    if (max === r) hue = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) hue = ((b - r) / d + 2) / 6;
    else hue = ((r - g) / d + 4) / 6;
    if (s < 0.12 || l < 0.12) return 1000 + (1 - l) * 100;
    return hue * 360;
  }

  function copyHex(hex, el) {
    var done = function () {
      el.classList.add('copied');
      setTimeout(function () { el.classList.remove('copied'); }, 1000);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(hex).then(done).catch(function () {
        var ta = document.createElement('textarea');
        ta.value = hex;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        done();
      });
    } else {
      var ta = document.createElement('textarea');
      ta.value = hex;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      done();
    }
  }

  function init() {
    var root = document.getElementById('PaletteLibrary-' + sid);
    if (!root) return;

    // Unhide SavePage-captured items
    root.querySelectorAll('.nomenclature-row[data-hex], .palette-card, .swatch-tile').forEach(function (el) {
      el.hidden = false;
      el.removeAttribute('hidden');
    });

    document.querySelectorAll('#PaletteLibrary-' + sid + ' .palette-card__swatch').forEach(function (swatch) {
      var hex = swatch.dataset.hex;
      if (!hex) return;
      swatch.addEventListener('click', function (e) {
        if (e.target.closest('a,button.inert-nav')) return;
        copyHex(hex, swatch);
      });
    });

    var tiles = document.querySelectorAll('#PaletteLibrary-' + sid + ' .swatch-tile');
    tiles.forEach(function (tile) {
      var hex = tile.dataset.hex;
      if (!hex) return;
      var light = isLight(hex);
      var textColor = light ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.82)';
      var hexEl = tile.querySelector('.swatch-tile__hex');
      var nameEl = tile.querySelector('.swatch-tile__name');
      var titleEl = tile.querySelector('.swatch-tile__title');
      if (hexEl) hexEl.style.color = textColor;
      if (nameEl) nameEl.style.color = textColor;
      if (titleEl) titleEl.style.color = textColor;
      tile.addEventListener('click', function (e) {
        if (e.target.closest('a,button.inert-nav')) return;
        copyHex(hex, tile);
      });
    });

    var nomView = document.getElementById('nomenclature-view-' + sid);
    if (!nomView) return;

    nomView.querySelectorAll('.nomenclature-swatch').forEach(function (swatch) {
      var hex = swatch.dataset.hex;
      if (!hex) return;
      swatch.addEventListener('click', function () { copyHex(hex, swatch); });
    });

    var header = nomView.querySelector('.nomenclature-row--header');
    var rows = Array.from(nomView.querySelectorAll('.nomenclature-row:not(.nomenclature-row--header)'));
    rows.sort(function (a, b) {
      return hueSort(a.dataset.hex || '') - hueSort(b.dataset.hex || '');
    });
    var seenHex = {};
    rows = rows.filter(function (row) {
      var hex = (row.dataset.hex || '').toLowerCase();
      if (seenHex[hex]) { row.parentNode && row.parentNode.removeChild(row); return false; }
      seenHex[hex] = true;
      return true;
    });
    rows.forEach(function (row) { nomView.appendChild(row); });
    if (header) nomView.insertBefore(header, nomView.firstChild);

    var filterSelect = document.getElementById('PeriodFilter-' + sid);
    if (filterSelect) {
      filterSelect.addEventListener('change', function () {
        var selected = this.value;
        nomView.querySelectorAll('.nomenclature-row:not(.nomenclature-row--header)').forEach(function (row) {
          row.hidden = selected !== '' && row.dataset.period !== selected;
        });
        document.querySelectorAll('#palette-view-' + sid + ' .palette-card').forEach(function (card) {
          card.hidden = selected !== '' && card.dataset.period !== selected;
        });
        tiles.forEach(function (tile) {
          tile.hidden = selected !== '' && tile.dataset.period !== selected;
        });
      });
    }

    function populateNames() {
      if (typeof oaColorName !== 'function') return;
      var nameCache = {};
      nomView.querySelectorAll('.nomenclature-row[data-hex]').forEach(function (row) {
        var hex = row.dataset.hex;
        if (!hex) return;
        if (!nameCache[hex]) nameCache[hex] = oaColorName(hex);
        var result = nameCache[hex];
        var nameEl = row.querySelector('[data-color-name]');
        var noteEl = row.querySelector('[data-color-note]');
        if (nameEl) nameEl.textContent = result.name;
        if (noteEl) noteEl.textContent = result.note;
      });
      tiles.forEach(function (tile) {
        var hex = tile.dataset.hex;
        if (!hex) return;
        var nameEl = tile.querySelector('.swatch-tile__name');
        if (!nameEl) return;
        if (!nameCache[hex]) nameCache[hex] = oaColorName(hex);
        nameEl.textContent = nameCache[hex].name;
      });
    }

    if (typeof oaColorName === 'function') populateNames();
    else {
      var tries = 0;
      var t = setInterval(function () {
        tries += 1;
        if (typeof oaColorName === 'function') { populateNames(); clearInterval(t); }
        if (tries > 40) clearInterval(t);
      }, 50);
    }

    var toggleEl = document.getElementById('PaletteToggle-' + sid);
    var viewMap = {
      nomenclature: nomView,
      palette: document.getElementById('palette-view-' + sid),
      swatch: document.getElementById('swatch-view-' + sid)
    };

    if (toggleEl) {
      toggleEl.querySelectorAll('.palette-library__toggle-option').forEach(function (opt) {
        opt.addEventListener('click', function () {
          var view = this.dataset.view;
          toggleEl.querySelectorAll('.palette-library__toggle-option').forEach(function (o) {
            o.classList.remove('active');
            var circle = o.querySelector('.palette-library__toggle-indicator svg circle');
            if (circle) circle.setAttribute('fill', 'transparent');
          });
          this.classList.add('active');
          var activeCircle = this.querySelector('.palette-library__toggle-indicator svg circle');
          if (activeCircle) activeCircle.setAttribute('fill', 'currentColor');
          Object.keys(viewMap).forEach(function (k) {
            if (viewMap[k]) viewMap[k].classList.toggle('active', k === view);
          });
        });
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
