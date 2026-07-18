/**
 * Exposure Control Lab — aperture / shutter / ISO interactive preview.
 */
(function () {
  "use strict";

  var preview = document.getElementById("image-container");
  var depthPlate = document.getElementById("depth-image");
  var motionStack = document.getElementById("motion-container");
  var motionFrames = document.querySelectorAll(".motion-frame");
  var noiseOverlay = document.getElementById("noise-overlay");
  var exposureDot = document.getElementById("exposure-dot");
  var apertureEl = document.getElementById("aperture-value");
  var shutterEl = document.getElementById("shutter-value");
  var isoEl = document.getElementById("iso-value");
  var helpPanel = document.getElementById("help-panel");

  var BASE_APERTURE = 16;
  var BASE_SHUTTER = 60;
  var BASE_ISO = 100;

  var apertureStops = [22, 16, 11, 8, 5.6, 4, 2.8, 1.8];
  var shutterStops = [2, 4, 8, 15, 30, 60, 125, 250, 500, 1000];
  var isoStops = [50, 100, 200, 400, 800, 1600, 3200];

  var aperture = BASE_APERTURE;
  var shutter = BASE_SHUTTER;
  var iso = BASE_ISO;
  var helpOpen = false;

  var MAX_BLUR = 20;
  var NOISE_MULTIPLIER = 0.1;
  var MAX_NOISE = 0.5;
  var BRIGHTNESS_MULT = 1.2;
  var BASE_BRIGHTNESS = 120;
  var DISPLAY_MAX = 5;
  var BASE_DOT = 50;
  var DOT_STEP = 10;

  var channels = [
    {
      id: "aperture",
      stops: apertureStops,
      inverted: true,
      get: function () {
        return aperture;
      },
      set: function (v) {
        aperture = v;
      },
      label: apertureEl,
      format: function (v) {
        return "f/" + v;
      },
    },
    {
      id: "shutter",
      stops: shutterStops,
      inverted: false,
      get: function () {
        return shutter;
      },
      set: function (v) {
        shutter = v;
      },
      label: shutterEl,
      format: function (v) {
        return "1/" + v;
      },
    },
    {
      id: "iso",
      stops: isoStops,
      inverted: false,
      get: function () {
        return iso;
      },
      set: function (v) {
        iso = v;
      },
      label: isoEl,
      format: function (v) {
        return String(v);
      },
    },
  ];

  function setEdgeButtons(channel) {
    var idx = channel.stops.indexOf(channel.get());
    var up = document.getElementById(channel.id + "-up");
    var down = document.getElementById(channel.id + "-down");
    var atStart = idx === 0;
    var atEnd = idx === channel.stops.length - 1;

    if (channel.inverted) {
      toggleBtn(up, !atStart);
      toggleBtn(down, !atEnd);
    } else {
      toggleBtn(up, !atEnd);
      toggleBtn(down, !atStart);
    }
  }

  function toggleBtn(el, enabled) {
    if (!el) return;
    el.disabled = !enabled;
    el.setAttribute("aria-disabled", enabled ? "false" : "true");
    el.style.opacity = enabled ? "1" : "0";
    el.style.pointerEvents = enabled ? "auto" : "none";
  }

  function exposureStops() {
    return (
      2 * Math.log2(BASE_APERTURE / aperture) +
      Math.log2(BASE_SHUTTER / shutter) +
      Math.log2(iso / BASE_ISO)
    );
  }

  function updateDepth() {
    var blur = Math.max(0.2, MAX_BLUR / Math.pow(aperture, 1.1));
    depthPlate.style.filter = "blur(" + blur + "px)";
    if (motionStack) {
      motionStack.style.filter = "blur(" + blur + "px)";
    }
  }

  function updateBrightness() {
    var brightness =
      BASE_BRIGHTNESS * Math.pow(BRIGHTNESS_MULT, exposureStops());
    preview.style.filter = "brightness(" + brightness + "%)";
  }

  function updateMotion() {
    var index = shutterStops.indexOf(shutter);
    if (index < 0) return;
    motionFrames.forEach(function (frame, i) {
      frame.classList.toggle("is-active", i === index);
      frame.style.opacity = i === index ? "1" : "0";
    });
  }

  function updateNoise() {
    var opacity = Math.log2(iso / 100) * NOISE_MULTIPLIER;
    noiseOverlay.style.opacity = String(
      Math.min(MAX_NOISE, Math.max(0, opacity))
    );
  }

  function updateMeter() {
    var clamped = Math.max(-DISPLAY_MAX, Math.min(DISPLAY_MAX, exposureStops()));
    var top = Math.max(5, Math.min(95, BASE_DOT - clamped * DOT_STEP));
    exposureDot.style.top = top + "%";
  }

  function refresh() {
    channels.forEach(function (ch) {
      ch.label.textContent = ch.format(ch.get());
      setEdgeButtons(ch);
    });
    updateDepth();
    updateBrightness();
    updateMotion();
    updateNoise();
    updateMeter();
  }

  function stepChannel(channel, uiDir) {
    var effective = uiDir;
    if (channel.inverted) {
      effective = uiDir === "up" ? "down" : "up";
    }
    var idx = channel.stops.indexOf(channel.get());
    if (idx < 0) return;
    var next =
      effective === "up"
        ? Math.min(idx + 1, channel.stops.length - 1)
        : Math.max(idx - 1, 0);
    if (next === idx) return;
    channel.set(channel.stops[next]);
    refresh();
  }

  function bindControls() {
    channels.forEach(function (channel) {
      ["up", "down"].forEach(function (dir) {
        var btn = document.getElementById(channel.id + "-" + dir);
        if (!btn) return;
        btn.addEventListener("click", function (event) {
          event.preventDefault();
          stepChannel(channel, dir);
        });
      });
    });
  }

  function setHelp(open) {
    helpOpen = open;
    helpPanel.classList.toggle("is-open", open);
    helpPanel.setAttribute("aria-hidden", open ? "false" : "true");
    [document.getElementById("help-btn"), document.getElementById("help-btn-mob")].forEach(
      function (trigger) {
        if (!trigger) return;
        trigger.classList.toggle("is-open", open);
        trigger.setAttribute("aria-expanded", open ? "true" : "false");
      }
    );
  }

  function bindHelp() {
    [document.getElementById("help-btn"), document.getElementById("help-btn-mob")].forEach(
      function (trigger) {
        if (!trigger) return;
        trigger.addEventListener("click", function () {
          setHelp(!helpOpen);
        });
        trigger.addEventListener("keydown", function (event) {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setHelp(!helpOpen);
          }
        });
      }
    );
  }

  bindControls();
  bindHelp();
  refresh();
})();
