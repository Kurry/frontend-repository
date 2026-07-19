(function (global) {
  var COLOR_NAMES = null;
  var readyPromise = null;

  function parseHex(hex) {
    var h = String(hex || "").replace("#", "").trim();
    if (h.length === 3) {
      h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    }
    if (h.length !== 6) return null;
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
    };
  }

  function nearestName(hex) {
    if (!COLOR_NAMES || !COLOR_NAMES.length) {
      return { name: "", note: "" };
    }
    var rgb = parseHex(hex);
    if (!rgb) return { name: "", note: "" };

    var bestName = "";
    var bestNote = "";
    var bestDist = Infinity;

    for (var i = 0; i < COLOR_NAMES.length; i++) {
      var entry = COLOR_NAMES[i];
      var cr = parseInt(entry[0].slice(0, 2), 16);
      var cg = parseInt(entry[0].slice(2, 4), 16);
      var cb = parseInt(entry[0].slice(4, 6), 16);
      var d =
        (rgb.r - cr) * (rgb.r - cr) +
        (rgb.g - cg) * (rgb.g - cg) +
        (rgb.b - cb) * (rgb.b - cb);
      if (d < bestDist) {
        bestDist = d;
        bestName = entry[1];
        bestNote = entry[2];
      }
    }

    return { name: bestName, note: bestNote };
  }

  function loadColorNames() {
    if (readyPromise) return readyPromise;
    readyPromise = fetch("./data/color-names.json")
      .then(function (res) {
        if (!res.ok) throw new Error("color-names load failed");
        return res.json();
      })
      .then(function (rows) {
        COLOR_NAMES = rows;
        return rows;
      })
      .catch(function () {
        COLOR_NAMES = [];
        return COLOR_NAMES;
      });
    return readyPromise;
  }

  global.oaColorName = function (hex) {
    return nearestName(hex);
  };

  global.loadColorNames = loadColorNames;
})(window);
