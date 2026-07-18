/**
 * Interactive camera exposure simulator.
 * Controls: aperture (DOF blur), shutter speed (motion frames), ISO (noise + brightness).
 */
(function () {
  "use strict";

  const container = document.getElementById("image-container");
  const depthImage = document.getElementById("depth-image");
  const motionContainer = document.getElementById("motion-container");
  const motionFrames = document.querySelectorAll(".motion-image");
  const noiseOverlay = document.getElementById("noise-overlay");
  const exposureDot = document.getElementById("exposure-dot");
  const apertureValue = document.getElementById("aperture-value");
  const shutterValue = document.getElementById("shutter-value");
  const isoValue = document.getElementById("iso-value");

  const baseAperture = 16;
  const baseShutter = 60;
  const baseISO = 100;

  let aperture = baseAperture;
  let shutterSpeed = baseShutter;
  let iso = baseISO;
  let netDotClicks = 0;
  let helpOpen = false;

  const apertureStops = [22, 16, 11, 8, 5.6, 4, 2.8, 1.8];
  const shutterStops = [2, 4, 8, 15, 30, 60, 125, 250, 500, 1000];
  const isoStops = [50, 100, 200, 400, 800, 1600, 3200];

  const MAX_BLUR = 20;
  const NOISE_MULTIPLIER = 0.1;
  const MAX_NOISE_OPACITY = 0.5;
  const BRIGHTNESS_MULTIPLIER = 1.2;
  const BASE_BRIGHTNESS = 120;
  const DISPLAY_MAX_STEPS = 5;
  const BASE_POSITION = 50;
  const DOT_STEP_PERCENT = 10;

  const controls = [
    {
      id: "aperture",
      stops: apertureStops,
      getValue: () => aperture,
      setValue: (v) => {
        aperture = v;
      },
      valueElement: apertureValue,
      inverted: true,
    },
    {
      id: "shutter",
      stops: shutterStops,
      getValue: () => shutterSpeed,
      setValue: (v) => {
        shutterSpeed = v;
      },
      valueElement: shutterValue,
    },
    {
      id: "iso",
      stops: isoStops,
      getValue: () => iso,
      setValue: (v) => {
        iso = v;
      },
      valueElement: isoValue,
    },
  ];

  function initializeButtonStyles() {
    controls.forEach((control) => {
      ["up", "down"].forEach((dir) => {
        const btn = document.getElementById(`${control.id}-${dir}`);
        if (!btn) return;
        btn.style.transition = "opacity 0.3s ease-in-out";
        btn.style.cursor = "pointer";
      });
    });
  }

  function updateButtonVisibility(control, value) {
    const up = document.getElementById(`${control.id}-up`);
    const down = document.getElementById(`${control.id}-down`);
    const index = control.stops.indexOf(value);

    if (control.inverted) {
      if (up) {
        up.style.opacity = index === 0 ? "0" : "1";
        up.style.pointerEvents = index === 0 ? "none" : "auto";
      }
      if (down) {
        down.style.opacity = index === control.stops.length - 1 ? "0" : "1";
        down.style.pointerEvents =
          index === control.stops.length - 1 ? "none" : "auto";
      }
    } else {
      if (up) {
        up.style.opacity = index === control.stops.length - 1 ? "0" : "1";
        up.style.pointerEvents =
          index === control.stops.length - 1 ? "none" : "auto";
      }
      if (down) {
        down.style.opacity = index === 0 ? "0" : "1";
        down.style.pointerEvents = index === 0 ? "none" : "auto";
      }
    }
  }

  function updateControlValues() {
    apertureValue.textContent = `f/${aperture}`;
    shutterValue.textContent = `1/${shutterSpeed}`;
    isoValue.textContent = `${iso}`;
  }

  function updateDepthOfField() {
    const blur = Math.max(0.2, MAX_BLUR / aperture ** 1.1);
    depthImage.style.filter = `blur(${blur}px)`;
    // Opaque motion frames cover the depth layer; mirror DOF onto them so aperture reads.
    if (motionContainer) {
      motionContainer.style.filter = `blur(${blur}px)`;
    }
  }

  function updateBrightness() {
    const stops =
      2 * Math.log2(baseAperture / aperture) +
      Math.log2(baseShutter / shutterSpeed) +
      Math.log2(iso / baseISO);
    const brightness = BASE_BRIGHTNESS * Math.pow(BRIGHTNESS_MULTIPLIER, stops);
    container.style.filter = `brightness(${brightness}%)`;
  }

  function updateMotionBlur() {
    const index = shutterStops.indexOf(shutterSpeed);
    if (index === -1) return;
    motionFrames.forEach((frame, i) => {
      frame.style.transition = "opacity 0.2s ease-in-out";
      frame.style.opacity = i === index ? "1" : "0";
    });
  }

  function updateNoise() {
    const opacity = Math.log2(iso / 100) * NOISE_MULTIPLIER;
    noiseOverlay.style.opacity = Math.min(
      MAX_NOISE_OPACITY,
      Math.max(0, opacity)
    );
  }

  function updateExposureBar() {
    const clamped = Math.max(
      -DISPLAY_MAX_STEPS,
      Math.min(DISPLAY_MAX_STEPS, netDotClicks)
    );
    let top = BASE_POSITION - clamped * DOT_STEP_PERCENT;
    top = Math.max(5, Math.min(95, top));
    if (typeof gsap !== "undefined") {
      gsap.to(exposureDot, { duration: 0.5, top: `${top}%` });
    } else {
      exposureDot.style.top = `${top}%`;
    }
  }

  function adjustSetting(current, direction, stops, setValue, valueElement) {
    const index = stops.indexOf(current);
    const nextIndex =
      direction === "up"
        ? Math.min(index + 1, stops.length - 1)
        : Math.max(index - 1, 0);
    const next = stops[nextIndex];
    setValue(next);

    if (valueElement.id.includes("aperture")) {
      valueElement.textContent = `f/${next}`;
    } else if (valueElement.id.includes("shutter")) {
      valueElement.textContent = `1/${next}`;
    } else {
      valueElement.textContent = `${next}`;
    }
    return next;
  }

  function updateUI() {
    updateControlValues();
    updateDepthOfField();
    updateBrightness();
    updateMotionBlur();
    updateNoise();
    updateExposureBar();
    controls.forEach((control) => {
      updateButtonVisibility(control, control.getValue());
    });
  }

  function bindControls() {
    controls.forEach((control) => {
      ["up", "down"].forEach((dir) => {
        const btn = document.getElementById(`${control.id}-${dir}`);
        if (!btn) return;
        btn.addEventListener("click", (event) => {
          event.preventDefault();
          let effectiveDir = dir;
          if (control.inverted) {
            effectiveDir = dir === "up" ? "down" : "up";
          }
          adjustSetting(
            control.getValue(),
            effectiveDir,
            control.stops,
            control.setValue,
            control.valueElement
          );
          if (control.id === "iso") {
            netDotClicks += dir === "up" ? 1 : -1;
          } else {
            netDotClicks += dir === "up" ? -1 : 1;
          }
          updateUI();
        });
      });
    });
  }

  function bindHelp() {
    const panel = document.querySelector(".help-content");
    const triggers = document.querySelectorAll(
      ".helper-trigger, .helper-trigger-mob"
    );
    if (!panel || !triggers.length) return;

    const setOpen = (open) => {
      helpOpen = open;
      panel.classList.toggle("is-open", open);
      triggers.forEach((t) => t.classList.toggle("is-open", open));
      triggers.forEach((t) =>
        t.setAttribute("aria-expanded", open ? "true" : "false")
      );
    };

    triggers.forEach((trigger) => {
      trigger.setAttribute("role", "button");
      trigger.setAttribute("tabindex", "0");
      trigger.setAttribute("aria-expanded", "false");
      trigger.setAttribute("aria-controls", "help-content");
      trigger.addEventListener("click", () => setOpen(!helpOpen));
      trigger.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          setOpen(!helpOpen);
        }
      });
    });
  }

  initializeButtonStyles();
  bindControls();
  bindHelp();
  updateUI();
})();
