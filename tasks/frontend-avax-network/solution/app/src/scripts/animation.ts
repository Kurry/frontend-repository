import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(ScrollTrigger, SplitText);

const LETTERS = "abcdefghijklmnopqrstuvwxyz";
const DIGITS = "1234567890";
const SYMBOLS = ",-.=+~#*/";

const isNum = (r: string) => /^-?\d+(\.\d+)?$/.test(r);
const isSym = (r: string) => r.length === 1 && SYMBOLS.includes(r);
const pick = (pool: string) => pool[Math.floor(Math.random() * pool.length)];

export function splitLines(el: HTMLElement, delaySeconds?: number) {
  const split = new SplitText(el, {
    type: "lines",
    tag: "span",
    aria: "none",
    linesClass: "block split-line gpu-accelerate",
  });
  split.lines.forEach((line, i) => {
    const wrap = document.createElement("div");
    wrap.classList.add("overflow-y-clip");
    line.parentNode?.insertBefore(wrap, line);
    wrap.appendChild(line);
    if (delaySeconds) (line as HTMLElement).style.transitionDelay = `${delaySeconds}s`;
    el.style.transitionDelay = "0s";
    (line as HTMLElement).style.setProperty("--index", String(i));
  });
  return split;
}

function setupHeading(section: HTMLElement, heading: HTMLElement) {
  let split: SplitText | undefined;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Deterministic glyph pool index — live gold uses Math.random, which makes
  // mid-flight deep/footer captures non-reproducible across gold vs candidate.
  // Under reduced-motion (capture path), pin flash frames to the initial char so
  // color/outline transitions still run but pixel compare is stable.
  const pickDet = (pool: string, seed: number) => pool[Math.abs(seed) % pool.length];
  const run = () => {
    split = new SplitText(heading, {
      type: "chars, words",
      tag: "span",
      wordsClass: "inline-block",
      charsClass:
        "heading-char relative before:inline-block before:absolute before:z-[1] before:top-1/2 before:-translate-y-1/2 before:left-0 gpu-accelerate",
    });
    split.chars.forEach((char, i) => {
      const c = char as HTMLElement;
      const initial = c.textContent || "";
      c.setAttribute("data-char-initial", initial);
      c.style.setProperty("--index", String(i));
      const text = c.innerText;
      if (reduceMotion) {
        c.setAttribute("data-char-1", initial);
        c.setAttribute("data-char-2", initial);
        c.setAttribute("data-char-3", initial);
        c.setAttribute("data-char-4", initial);
      } else if (isNum(text)) {
        c.setAttribute("data-char-1", pickDet(DIGITS, i * 11 + 1));
        c.setAttribute("data-char-2", pickDet(DIGITS, i * 11 + 2));
        c.setAttribute("data-char-3", pickDet(DIGITS, i * 11 + 3));
        c.setAttribute("data-char-4", pickDet(DIGITS, i * 11 + 4));
      } else if (isSym(text)) {
        c.setAttribute("data-char-1", pickDet(SYMBOLS, i * 11 + 1));
        c.setAttribute("data-char-2", pickDet(SYMBOLS, i * 11 + 2));
        c.setAttribute("data-char-3", pickDet(SYMBOLS, i * 11 + 3));
        c.setAttribute("data-char-4", pickDet(SYMBOLS, i * 11 + 4));
      } else {
        c.setAttribute("data-char-1", pickDet(LETTERS, i * 11 + 1));
        c.setAttribute("data-char-2", pickDet(LETTERS, i * 11 + 2));
        c.setAttribute("data-char-3", pickDet(LETTERS, i * 11 + 3));
        c.setAttribute("data-char-4", pickDet(LETTERS, i * 11 + 4));
      }
    });
  };
  run();
  heading.style.opacity = "1";
  ScrollTrigger.create({
    trigger: section,
    end: "bottom top",
    onLeave: () => split?.revert(),
    onLeaveBack: () => split?.revert(),
  });
  return split;
}

function setupSection(section: HTMLElement) {
  section.querySelectorAll<HTMLElement>(".split-heading").forEach((h) => setupHeading(section, h));
  section.querySelectorAll<HTMLElement>(".split-text").forEach((el) => {
    const delay = parseFloat(getComputedStyle(el).transitionDelay) || 0;
    const split = splitLines(el, delay || undefined);
    el.style.opacity = "1";
    ScrollTrigger.create({
      trigger: section,
      end: "bottom top",
      onLeave: () => split.revert(),
      onLeaveBack: () => split.revert(),
    });
  });
}

export function initAnimateInView() {
  // Live under prefers-reduced-motion still ScrollTrigger-toggles `.visible` on
  // enter (CSS transitions keep running). Do NOT eagerly `.visible` every section
  // — that settles group-[.visible] translates immediately and diverges mid/deep
  // station screenshots from gold (which are mid-flight at settleMs).
  // Always split so glyph metrics match; only skip GSAP entrance *timelines*.
  document.querySelectorAll<HTMLElement>(".animate-in-view").forEach((section) => {
    let y = getComputedStyle(section).getPropertyValue("--y").replace(/,/g, "").trim();
    if (!y) y = window.innerWidth > 1024 ? "0" : "20";
    let done = false;

    ScrollTrigger.create({
      trigger: section,
      start: `top-=${y} bottom`,
      end: "bottom 80%",
      onEnter: () => {
        if (done) return;
        section.classList.add("visible");
        try {
          setupSection(section);
        } catch (err) {
          console.warn("[animate-in-view] setupSection failed", err);
        }
        done = true;
      },
      onEnterBack: () => {
        section.classList.add("visible");
      },
      onLeaveBack: () => {
        // Match live toggleActions reset: clear visible when scrolling back up
        // past start so re-entry re-plays entrance translates.
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        section.classList.remove("visible");
        done = false;
      },
    });
  });
}

export function initClockSplit(el: HTMLElement, delay = 2) {
  document.fonts.ready.then(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    splitLines(el, delay);
    el.style.opacity = "1";
  });
}
