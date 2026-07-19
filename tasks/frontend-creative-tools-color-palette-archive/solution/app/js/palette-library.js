(function () {
  function isLight(hex) {
    var h = String(hex || "").replace("#", "");
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var r = parseInt(h.substring(0, 2), 16);
    var g = parseInt(h.substring(2, 4), 16);
    var b = parseInt(h.substring(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 160;
  }

  function hueSort(hex) {
    var h = String(hex || "").replace("#", "");
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    if (h.length !== 6) return 2000;
    var r = parseInt(h.substring(0, 2), 16) / 255;
    var g = parseInt(h.substring(2, 4), 16) / 255;
    var b = parseInt(h.substring(4, 6), 16) / 255;
    var max = Math.max(r, g, b);
    var min = Math.min(r, g, b);
    var l = (max + min) / 2;
    if (max === min) return 1000 + (1 - l) * 100;
    var d = max - min;
    var s = d / (1 - Math.abs(2 * l - 1));
    var hue;
    if (max === r) hue = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) hue = ((b - r) / d + 2) / 6;
    else hue = ((r - g) / d + 4) / 6;
    if (s < 0.12 || l < 0.12) return 1000 + (1 - l) * 100;
    return hue * 360;
  }

  function normalizeHex(hex) {
    var h = String(hex || "").trim();
    if (!h) return "";
    if (h.charAt(0) !== "#") h = "#" + h;
    return h.toLowerCase();
  }

  function copyHex(hex, el) {
    var value = normalizeHex(hex);
    if (!value) return;
    var done = function () {
      el.classList.add("copied");
      setTimeout(function () {
        el.classList.remove("copied");
      }, 1000);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(value).then(done).catch(function () {
        fallbackCopy(value);
        done();
      });
    } else {
      fallbackCopy(value);
      done();
    }
  }

  function fallbackCopy(hex) {
    var ta = document.createElement("textarea");
    ta.value = hex;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function buildNomenclatureRows(palettes) {
    var rows = [];
    var seen = Object.create(null);
    palettes.forEach(function (card) {
      (card.hexes || []).forEach(function (hex) {
        var key = String(hex).toLowerCase();
        if (seen[key]) return;
        seen[key] = true;
        rows.push({
          hex: key,
          period: card.period,
          title: card.title,
          artist: card.artist,
        });
      });
    });
    rows.sort(function (a, b) {
      return hueSort(a.hex) - hueSort(b.hex);
    });
    return rows;
  }

  function renderNomenclature(container, rows) {
    var header =
      '<div class="nomenclature-row nomenclature-row--header">' +
      "<span></span><span>Hex</span><span>Name</span><span>Notes</span><span>Painting</span>" +
      "</div>";

    var body = rows
      .map(function (row) {
        return (
          '<div class="nomenclature-row" data-hex="' +
          escapeHtml(row.hex) +
          '" data-period="' +
          escapeHtml(row.period) +
          '">' +
          '<button type="button" class="nomenclature-swatch" style="background-color:' +
          escapeHtml(row.hex) +
          ';" data-hex="' +
          escapeHtml(row.hex) +
          '" title="Click to copy ' +
          escapeHtml(row.hex) +
          '"></button>' +
          '<span class="nomenclature-hex">' +
          escapeHtml(row.hex) +
          "</span>" +
          '<span class="nomenclature-name" data-color-name></span>' +
          '<span class="nomenclature-note" data-color-note></span>' +
          '<div class="nomenclature-source">' +
          '<button type="button" class="nomenclature-source__title inert-nav">' +
          escapeHtml(row.title) +
          "</button>" +
          '<span class="nomenclature-source__artist">' +
          escapeHtml(row.artist) +
          "</span>" +
          "</div></div>"
        );
      })
      .join("");

    container.innerHTML = header + body;
  }

  function renderPalette(container, palettes) {
    container.innerHTML = palettes
      .map(function (card) {
        var swatches = (card.hexes || [])
          .map(function (hex) {
            return (
              '<button type="button" class="palette-card__swatch" style="background-color:' +
              escapeHtml(hex) +
              ';" data-hex="' +
              escapeHtml(hex) +
              '" title="' +
              escapeHtml(hex) +
              '">' +
              '<span class="palette-card__swatch-hex">' +
              escapeHtml(hex) +
              "</span></button>"
            );
          })
          .join("");

        return (
          '<article class="palette-card" data-period="' +
          escapeHtml(card.period) +
          '">' +
          '<div class="palette-card__swatches">' +
          swatches +
          "</div>" +
          '<div class="palette-card__meta">' +
          '<div class="palette-card__meta-row"><span class="palette-card__meta-label">title</span>' +
          '<button type="button" class="palette-card__meta-title inert-nav">' +
          escapeHtml(card.title) +
          "</button></div>" +
          '<div class="palette-card__meta-row"><span class="palette-card__meta-label">artist</span>' +
          '<span class="palette-card__meta-artist">' +
          escapeHtml(card.artist) +
          "</span></div>" +
          "</div></article>"
        );
      })
      .join("");
  }

  function renderSwatches(container, palettes) {
    var tiles = [];
    palettes.forEach(function (card) {
      (card.hexes || []).forEach(function (hex) {
        tiles.push({
          hex: hex,
          period: card.period,
          title: card.title,
        });
      });
    });

    container.innerHTML = tiles
      .map(function (tile) {
        var textColor = isLight(tile.hex)
          ? "rgba(0,0,0,0.6)"
          : "rgba(255,255,255,0.82)";
        return (
          '<button type="button" class="swatch-tile" data-hex="' +
          escapeHtml(tile.hex) +
          '" data-period="' +
          escapeHtml(tile.period) +
          '" style="background-color:' +
          escapeHtml(tile.hex) +
          ';">' +
          '<span class="swatch-tile__inner"></span>' +
          '<span class="swatch-tile__hex" style="color:' +
          textColor +
          ';">' +
          escapeHtml(tile.hex) +
          "</span>" +
          '<span class="swatch-tile__name" style="color:' +
          textColor +
          ';"></span>' +
          '<span class="swatch-tile__title" style="color:' +
          textColor +
          ';">' +
          escapeHtml(tile.title) +
          "</span></button>"
        );
      })
      .join("");
  }

  function bindCopy(root) {
    root.querySelectorAll(".nomenclature-swatch, .palette-card__swatch, .swatch-tile").forEach(function (el) {
      el.addEventListener("click", function (e) {
        // Nested nav-like controls should not trigger copy; overlay labels may.
        if (e.target.closest("a[href], button.inert-nav")) return;
        var hex = el.getAttribute("data-hex");
        if (!hex) return;
        e.preventDefault();
        copyHex(hex, el);
      });
    });
  }

  function populateNames(nomView, swatchView) {
    if (typeof oaColorName !== "function") return;
    var cache = Object.create(null);

    nomView.querySelectorAll(".nomenclature-row[data-hex]").forEach(function (row) {
      var hex = row.dataset.hex;
      if (!hex) return;
      if (!cache[hex]) cache[hex] = oaColorName(hex);
      var result = cache[hex];
      var nameEl = row.querySelector("[data-color-name]");
      var noteEl = row.querySelector("[data-color-note]");
      if (nameEl) nameEl.textContent = result.name || "";
      if (noteEl) noteEl.textContent = result.note || "";
    });

    swatchView.querySelectorAll(".swatch-tile").forEach(function (tile) {
      var hex = tile.dataset.hex;
      if (!hex) return;
      if (!cache[hex]) cache[hex] = oaColorName(hex);
      var nameEl = tile.querySelector(".swatch-tile__name");
      if (nameEl) nameEl.textContent = cache[hex].name || "";
    });
  }

  function bindToggle(toggleEl, viewMap) {
    if (!toggleEl) return;
    toggleEl.querySelectorAll(".palette-library__toggle-option").forEach(function (opt) {
      opt.addEventListener("click", function () {
        var view = opt.dataset.view;
        toggleEl.querySelectorAll(".palette-library__toggle-option").forEach(function (o) {
          o.classList.remove("active");
          o.setAttribute("aria-selected", "false");
          var circle = o.querySelector(".palette-library__toggle-indicator svg circle");
          if (circle) circle.setAttribute("fill", "transparent");
        });
        opt.classList.add("active");
        opt.setAttribute("aria-selected", "true");
        var activeCircle = opt.querySelector(".palette-library__toggle-indicator svg circle");
        if (activeCircle) activeCircle.setAttribute("fill", "currentColor");
        Object.keys(viewMap).forEach(function (key) {
          if (viewMap[key]) viewMap[key].classList.toggle("active", key === view);
        });
      });
    });
  }

  function bindFilter(selectEl, nomView, paletteView, swatchView) {
    if (!selectEl) return;
    selectEl.addEventListener("change", function () {
      var selected = selectEl.value;
      nomView.querySelectorAll(".nomenclature-row:not(.nomenclature-row--header)").forEach(function (row) {
        row.hidden = selected !== "" && row.dataset.period !== selected;
      });
      paletteView.querySelectorAll(".palette-card").forEach(function (card) {
        card.hidden = selected !== "" && card.dataset.period !== selected;
      });
      swatchView.querySelectorAll(".swatch-tile").forEach(function (tile) {
        tile.hidden = selected !== "" && tile.dataset.period !== selected;
      });
    });
  }

  function init() {
    var root = document.getElementById("PaletteLibrary");
    if (!root) return;

    var nomView = document.getElementById("nomenclature-view");
    var paletteView = document.getElementById("palette-view");
    var swatchView = document.getElementById("swatch-view");
    if (!nomView || !paletteView || !swatchView) return;

    Promise.all([
      fetch("./data/palettes.json").then(function (r) {
        if (!r.ok) throw new Error("palettes load failed");
        return r.json();
      }),
      typeof loadColorNames === "function" ? loadColorNames() : Promise.resolve([]),
    ])
      .then(function (results) {
        var palettes = results[0] || [];
        var rows = buildNomenclatureRows(palettes);
        renderNomenclature(nomView, rows);
        renderPalette(paletteView, palettes);
        renderSwatches(swatchView, palettes);
        bindCopy(root);
        populateNames(nomView, swatchView);
        bindToggle(document.getElementById("PaletteToggle"), {
          nomenclature: nomView,
          palette: paletteView,
          swatch: swatchView,
        });
        bindFilter(document.getElementById("PeriodFilter"), nomView, paletteView, swatchView);
      })
      .catch(function (err) {
        console.error(err);
        nomView.innerHTML =
          '<p class="nomenclature-note">Unable to load palette archive data.</p>';
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
