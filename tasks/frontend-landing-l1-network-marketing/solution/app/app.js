(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // —— Theme ——
  const root = document.documentElement;
  const saved = localStorage.getItem("ridge-theme");
  root.setAttribute("data-theme", saved === "dark" ? "dark" : "light");

  document.getElementById("themeToggle")?.addEventListener("click", () => {
    const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    localStorage.setItem("ridge-theme", next);
  });

  // —— Clock ——
  const clockEl = document.getElementById("clock");
  function tickClock() {
    if (!clockEl) return;
    const now = new Date();
    clockEl.textContent = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  tickClock();
  setInterval(tickClock, 1000);

  // —— Load entrance (one-shot mount) ——
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (reduceMotion) {
        root.classList.add("is-mounted");
        // Instant final clips already handled by CSS reduce rules
        return;
      }
      root.classList.add("is-mounted");
    });
  });

  // —— Get started trio in-view ——
  const trio = document.getElementById("trio");
  if (trio) {
    if (reduceMotion) {
      trio.classList.add("is-visible");
    } else {
      const io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              trio.classList.add("is-visible");
              io.disconnect();
            }
          }
        },
        { threshold: 0.25 }
      );
      io.observe(trio);
    }
  }

  // —— Global Events: scramble + line masks ——
  const HEADLINE = "RIDGE GLOBAL EVENTS";
  const BLURB =
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Placeholder events pitch for the decode lab.";
  const DECOYS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  const headlineEl = document.getElementById("eventsHeadline");
  const blurbEl = document.getElementById("eventsBlurb");
  const eventsSection = document.getElementById("events");

  function randomDecoy() {
    return DECOYS[Math.floor(Math.random() * DECOYS.length)];
  }

  function buildHeadline() {
    if (!headlineEl) return [];
    headlineEl.replaceChildren();
    const chars = [];
    let index = 0;
    HEADLINE.split(" ").forEach((word) => {
      const wordWrap = document.createElement("span");
      wordWrap.className = "word";
      wordWrap.setAttribute("aria-hidden", "true");
      [...word].forEach((glyph) => {
        const span = document.createElement("span");
        span.className = "char";
        span.dataset.final = glyph;
        span.dataset.d0 = randomDecoy();
        span.dataset.d1 = randomDecoy();
        span.dataset.d2 = randomDecoy();
        span.textContent = reduceMotion ? glyph : span.dataset.d0;
        span.style.setProperty("--char-delay", `${index * 60}ms`);
        span.style.setProperty("--char-dur", `${50 + (index + 1) * 75}ms`);
        wordWrap.appendChild(span);
        chars.push({ span, index, final: glyph });
        index += 1;
      });
      headlineEl.appendChild(wordWrap);
    });
    return chars;
  }

  function buildBlurbLines() {
    if (!blurbEl) return;
    blurbEl.replaceChildren();
    // Approximate two lines for mask demo
    const mid = Math.ceil(BLURB.length / 2);
    let split = BLURB.lastIndexOf(" ", mid);
    if (split < 0) split = mid;
    const lines = [BLURB.slice(0, split).trim(), BLURB.slice(split).trim()];
    lines.forEach((text, i) => {
      const mask = document.createElement("span");
      mask.className = "line-mask";
      const inner = document.createElement("span");
      inner.className = "line-inner";
      inner.style.setProperty("--li", String(i));
      inner.textContent = text;
      mask.appendChild(inner);
      blurbEl.appendChild(mask);
    });
  }

  function runScramble(chars) {
    if (reduceMotion) {
      chars.forEach(({ span, final }) => {
        span.textContent = final;
        span.style.color = "var(--ridge-ink)";
      });
      return;
    }

    chars.forEach(({ span, index, final }) => {
      const delay = index * 60;
      const duration = 50 + (index + 1) * 75;
      const steps = 4;
      const stepMs = duration / steps;

      setTimeout(() => {
        let step = 0;
        const iv = setInterval(() => {
          if (step < steps - 1) {
            span.textContent = span.dataset[`d${step}`] || randomDecoy();
            span.style.color = `color-mix(in srgb, var(--ridge-ink) ${30 + step * 20}%, transparent)`;
            step += 1;
          } else {
            clearInterval(iv);
            span.textContent = final;
            span.style.color = "var(--ridge-ink)";
          }
        }, stepMs);
      }, delay);
    });
  }

  const chars = buildHeadline();
  buildBlurbLines();

  if (eventsSection) {
    if (reduceMotion) {
      eventsSection.classList.add("is-visible");
      runScramble(chars);
    } else {
      const io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              eventsSection.classList.add("is-visible");
              runScramble(chars);
              io.disconnect();
            }
          }
        },
        { threshold: 0.35 }
      );
      io.observe(eventsSection);
    }
  }
})();
