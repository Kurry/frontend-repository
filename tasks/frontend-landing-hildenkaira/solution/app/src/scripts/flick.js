// Flick-card deck: elastic reshuffle on prev/next.
// Position table relative to the active index:
//   0: x 0,  y 0, rot 0,  scale 1, opacity 1, z 5 (active)
//  ±1: x ±25, y 1, rot ±10, scale .9, opacity 1, z 4
//  ±2: x ±45, y 5, rot ±15, scale .8, opacity 1, z 3
//  else: x ±55, y 5, rot ±20, scale .6, opacity 0, z 2 (hidden)
const POSITIONS = (rel) => {
  const abs = Math.abs(rel);
  const sign = Math.sign(rel) || 1;
  if (rel === 0) return { x: 0, y: 0, rot: 0, scale: 1, opacity: 1, z: 5, status: "active" };
  if (abs === 1) return { x: 25 * sign, y: 1, rot: 10 * sign, scale: 0.9, opacity: 1, z: 4, status: sign > 0 ? "2-after" : "2-before" };
  if (abs === 2) return { x: 45 * sign, y: 5, rot: 15 * sign, scale: 0.8, opacity: 1, z: 3, status: sign > 0 ? "3-after" : "3-before" };
  return { x: 55 * sign, y: 5, rot: 20 * sign, scale: 0.6, opacity: 0, z: 2, status: "hidden" };
};

export function initFlickGroups(gsap) {
  document.querySelectorAll("[data-flick-cards-init]").forEach((group) => {
    const items = Array.from(group.querySelectorAll("[data-flick-cards-item]"));
    if (!items.length) return;
    let active = 0;
    let busy = false;

    const relFor = (i) => {
      let rel = i - active;
      const n = items.length;
      if (rel > n / 2) rel -= n;
      if (rel < -n / 2) rel += n;
      return rel;
    };

    const layout = (animate) => {
      items.forEach((item, i) => {
        const p = POSITIONS(relFor(i));
        item.setAttribute("data-flick-cards-item-status", p.status);
        const vars = {
          xPercent: p.x * 2.2,
          yPercent: p.y,
          rotation: p.rot,
          scale: p.scale,
          opacity: p.opacity,
          zIndex: p.z,
        };
        if (animate) {
          gsap.to(item, { ...vars, duration: 0.6, ease: "elastic.out(1.2, 1)" });
        } else {
          gsap.set(item, vars);
        }
        // Only the active card's player is interactive.
        const player = item.querySelector(".bunny-player");
        if (player) player.style.pointerEvents = p.status === "active" ? "auto" : "none";
        // Caption chips slide in for the active card.
        const chips = item.querySelectorAll(".flick-card_data");
        if (p.status === "active") {
          chips.forEach((chip, ci) => {
            gsap.fromTo(
              chip,
              { yPercent: animate ? 110 : 0 },
              { yPercent: 0, duration: 0.5, delay: 0.2 + 0.1 * ci, ease: "power2.out" }
            );
          });
        } else {
          gsap.set(chips, { yPercent: 110 });
        }
      });
    };

    const step = (dir) => {
      if (busy) return;
      busy = true;
      setTimeout(() => (busy = false), 700);
      active = (active + dir + items.length) % items.length;
      layout(true);
    };

    layout(false);
    group.querySelector("[data-flick-next]")?.addEventListener("click", () => step(1));
    group.querySelector("[data-flick-prev]")?.addEventListener("click", () => step(-1));
    items.forEach((item, i) => {
      item.addEventListener("click", () => {
        if (i !== active && Math.abs(relFor(i)) <= 2) step(relFor(i) > 0 ? 1 : -1);
      });
    });

    // Exposed so external code (e.g. discovery-brief import) can jump this
    // deck directly to an index, keeping the closure's `active` index and
    // the visible card layout in sync.
    group._flickSetIndex = (index) => {
      const n = items.length;
      if (!n) return;
      const clamped = ((index % n) + n) % n;
      if (clamped === active) return;
      active = clamped;
      layout(false);
    };
  });
}
