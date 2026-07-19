import Lenis from "lenis";

let lenis: Lenis | undefined;

export function initLenis() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (window.innerWidth <= 1024) return;

  window.scrollTo({ left: 0, top: 0, behavior: "instant" as ScrollBehavior });
  const navOffset = (document.querySelector("nav")?.clientHeight || 0) - 1;

  lenis = new Lenis({
    duration: 0.8,
    smoothWheel: true,
    autoRaf: true,
    prevent: (t) => (t as HTMLElement).id === "tags-items" || (t as HTMLElement).id === "categories-items",
  });

  document.documentElement.classList.add("lenis");

  window.addEventListener("disableScroll", () => {
    lenis?.stop();
    document.documentElement.classList.add("scroll-disabled");
  });
  window.addEventListener("enableScroll", () => {
    lenis?.start();
    document.documentElement.classList.remove("scroll-disabled");
  });

  lenis.scrollTo(0, { immediate: true });

  document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      if (window.innerWidth <= 1024) return;
      e.preventDefault();
      const href = a.getAttribute("href");
      if (!href || href === "#") return;
      lenis?.scrollTo(href, {
        duration: 2,
        force: true,
        offset: href === "#contact" || href === "#contact-us" ? 0 : -navOffset,
        easing: (r) => Math.min(1, 1.001 - Math.pow(2, -10 * r)),
      });
    });
  });
}

export function getLenis() {
  return lenis;
}
