import "./wm-shape.js";
import { initAnimateInView } from "./animation";
import { initLenis } from "./lenis";

export function bootSite() {
  document.addEventListener("DOMContentLoaded", () => {
    initLenis();
  });
  document.fonts.ready.then(() => {
    initAnimateInView();
  });
}

bootSite();
