export function initHeroSequencer() {
  const HUD_DELAY = 4000;
  const isSafari = () => /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  const layers =
    window.innerWidth < 1025
      ? document.querySelectorAll<HTMLElement>('[id^="layer-"]:nth-child(-n+5)')
      : document.querySelectorAll<HTMLElement>('[id^="layer-"]');

  if (!layers.length) return;

  let currentIndex = 0;
  let initialCycle = false;
  const safari = isSafari();

  function switchLayer() {
    let video = layers[currentIndex]?.querySelector("video");
    if (!video) return;

    layers[currentIndex].classList.add("invisible");
    video.pause();
    video.currentTime = 0;

    currentIndex = (currentIndex + 1) % layers.length;
    if (currentIndex === 0) currentIndex++;

    video = layers[currentIndex]?.querySelector("video");
    if (!video) return;

    video.currentTime = 0;
    void video.play();
    layers[currentIndex].classList.remove("invisible");

    const nextLayer = layers[currentIndex + 1]?.querySelector("video");
    if (!nextLayer) {
      initialCycle = true;
      return;
    }
    if (!safari) nextLayer.load();
    if (!initialCycle) nextLayer.preload = "auto";
  }

  layers.forEach((layer, index) => {
    if (index === 0) return;
    const video = layer.querySelector("video");
    video?.addEventListener("ended", switchLayer);
  });

  window.setTimeout(() => {
    const first = layers[0].querySelector("video");
    if (!first) return;
    void first.play();
    first.addEventListener("ended", switchLayer);
  }, 1500);

  document.querySelectorAll(".hud-videos").forEach((wrapper) => {
    window.setTimeout(() => {
      wrapper.querySelectorAll("video").forEach((video) => {
        video.currentTime = 0;
        void video.play();
      });
      wrapper.classList.add("loaded");
    }, HUD_DELAY);
  });
}

export function initHeroHeights() {
  const inner = document.getElementById("hero-inner");
  const left = document.getElementById("hero-left-inner");
  const right = document.getElementById("hero-right-inner");
  if (!inner || !left || !right) return;

  const measure = () => {
    inner.style.setProperty("--hero-left-height", `${left.clientHeight}px`);
    inner.style.setProperty("--hero-right-height", `${right.clientHeight}px`);
  };
  measure();
  window.addEventListener("resize", measure);
}

export function mountEntrance() {
  // Live Layout adds `mounted` on DOMContentLoaded; keep idempotent for Hero import order.
  if (!document.documentElement.classList.contains("mounted")) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        document.documentElement.classList.add("mounted");
      });
    } else {
      document.documentElement.classList.add("mounted");
    }
  }
}
