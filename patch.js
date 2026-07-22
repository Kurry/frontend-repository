const fs = require('fs');

// 1. Fix Escape trapping
let main = fs.readFileSync('tasks/frontend-landing-razorpay-sprint-26/solution/app/src/main.js', 'utf8');

main = main.replace(
  'document.addEventListener("keydown", (e) => {',
  `document.addEventListener("keydown", (e) => {`
);

// We will add handleEsc to the modals
let paletteTrapCode = `  if (!paletteTrap) paletteTrap = makeTrap($("#command-palette-inner"));`;
let newPaletteTrapCode = `  if (!paletteTrap) {
    const inner = $("#command-palette-inner");
    paletteTrap = makeTrap(inner);
    const onEsc = (e) => { if (e.key === "Escape") { e.stopPropagation(); closePalette(); } };
    inner.addEventListener("keydown", onEsc);
    inner._onEsc = onEsc;
  }`;
main = main.replace(paletteTrapCode, newPaletteTrapCode);

let closePaletteCode = `  if (paletteTrap) { paletteTrap(); paletteTrap = null; }`;
let newClosePaletteCode = `  if (paletteTrap) { paletteTrap(); paletteTrap = null; const inner = $("#command-palette-inner"); if (inner && inner._onEsc) inner.removeEventListener("keydown", inner._onEsc); }`;
main = main.replace(closePaletteCode, newClosePaletteCode);

let briefTrapCode = `  if (!briefTrap) briefTrap = makeTrap(inner);`;
let newBriefTrapCode = `  if (!briefTrap) {
    briefTrap = makeTrap(inner);
    const onEsc = (e) => { if (e.key === "Escape") { e.stopPropagation(); closeBrief(); } };
    inner.addEventListener("keydown", onEsc);
    inner._onEsc = onEsc;
  }`;
main = main.replace(briefTrapCode, newBriefTrapCode);

let closeBriefCode = `  if (briefTrap) { briefTrap(); briefTrap = null; }`;
let newCloseBriefCode = `  if (briefTrap) { briefTrap(); briefTrap = null; const inner = $("#brief-panel-inner"); if (inner && inner._onEsc) inner.removeEventListener("keydown", inner._onEsc); }`;
main = main.replace(closeBriefCode, newCloseBriefCode);

let trayTrapCode = `  if (!trayTrap) trayTrap = makeTrap(tray);`;
let newTrayTrapCode = `  if (!trayTrap) {
    trayTrap = makeTrap(tray);
    const onEsc = (e) => { if (e.key === "Escape") { e.stopPropagation(); closeTray(); } };
    tray.addEventListener("keydown", onEsc);
    tray._onEsc = onEsc;
  }`;
main = main.replace(trayTrapCode, newTrayTrapCode);

let closeTrayCode = `  if (trayTrap) { trayTrap(); trayTrap = null; }`;
let newCloseTrayCode = `  if (trayTrap) { trayTrap(); trayTrap = null; const tray = $("#trays-ui"); if (tray && tray._onEsc) tray.removeEventListener("keydown", tray._onEsc); }`;
main = main.replace(closeTrayCode, newCloseTrayCode);


// 2. Fix webGL fallback
let hero = fs.readFileSync('tasks/frontend-landing-razorpay-sprint-26/solution/app/src/hero.js', 'utf8');

const isWebGLAvailable = `function isWebGLAvailable() {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
  } catch (e) {
    return false;
  }
}
`;
hero = isWebGLAvailable + hero.replace('if (navigator.webdriver) { fallback(); return; }', 'if (navigator.webdriver || !isWebGLAvailable()) { fallback(); return; }');
fs.writeFileSync('tasks/frontend-landing-razorpay-sprint-26/solution/app/src/hero.js', hero);

// 3. Fix nav click flash and scroll spy element
main = main.replace(
`      cells.forEach((c) => { c.classList.remove("is-active", "is-clicked"); c.removeAttribute("aria-current"); });
      cell.classList.add("is-clicked");
      cell.setAttribute("aria-current", "true");`,
`      cells.forEach((c) => { c.classList.remove("is-active", "is-clicked"); c.removeAttribute("aria-current"); });
      cell.classList.add("is-active", "is-clicked");
      cell.setAttribute("aria-current", "true");
      setTimeout(() => cell.classList.remove("is-clicked"), 300);
`
);
// replace clickLock clear
main = main.replace(
`        clickTimer = setTimeout(() => {
          clickLock = false; cell.classList.remove("is-clicked");
          window.removeEventListener("scroll", settle); spy();
        }, 4500);`,
`        clickTimer = setTimeout(() => {
          clickLock = false;
          window.removeEventListener("scroll", settle); spy();
        }, 4500);`
);

let spyFunc = `    if (active) { active.classList.add("is-active"); active.setAttribute("aria-current", "true"); }`;
let newSpyFunc = `    if (active) {
      active.classList.add("is-active"); active.setAttribute("aria-current", "true");
      const spyEl = document.getElementById("scroll-spy");
      if (spyEl) {
        spyEl.style.transform = \`translateX(\${active.offsetLeft}px)\`;
        spyEl.style.width = \`\${active.offsetWidth}px\`;
        spyEl.style.opacity = "1";
      }
    } else {
      const spyEl = document.getElementById("scroll-spy");
      if (spyEl) spyEl.style.opacity = "0";
    }`;
main = main.replace(spyFunc, newSpyFunc);

// Word reveal logic
let wordRevealCode = `  headings.forEach((h) => {
    const text = h.textContent.trim();
    h.setAttribute("aria-label", text);
    h.innerHTML = text.split(" ").map((w) => \`<span class="wr-outer" aria-hidden="true"><span class="wr-word">\${w}</span></span>\`).join(" ");
  });

  if (isRM()) return;`;

let newWordRevealCode = `  headings.forEach((h) => {
    const text = h.textContent.trim();
    h.setAttribute("aria-label", text);
    h.innerHTML = text.split(" ").map((w) => \`<span class="wr-outer" aria-hidden="true" style="overflow:hidden; display:inline-block; vertical-align:bottom;"><span class="wr-word">\${w}</span></span>\`).join(" ");
  });

  if (isRM()) {
    headings.forEach((h) => h.classList.add("is-revealed"));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("is-revealed");
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });
  headings.forEach(h => observer.observe(h));`;
main = main.replace(wordRevealCode, newWordRevealCode);

// Video Modal logic
main = main.replace(
  `modal.setAttribute("aria-hidden", "false");`,
  `modal.setAttribute("aria-hidden", "false");\n    try { video.currentTime = 0; } catch {}`
);

fs.writeFileSync('tasks/frontend-landing-razorpay-sprint-26/solution/app/src/main.js', main);


// Now style.css
let style = fs.readFileSync('tasks/frontend-landing-razorpay-sprint-26/solution/app/src/style.css', 'utf8');

// Preloader fade in
style = style.replace('.loader-logo { width', '.loader-logo { animation: loaderFadeIn 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.3s forwards; width');
style = style.replace('.loader-track { width', '.loader-track { animation: loaderFadeIn 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.5s forwards; width');
style = style.replace('opacity: 1;', 'opacity: 0;'); // for loader-logo
style = style.replace('opacity: 1;', 'opacity: 0;'); // for loader-track

// Access rail hover
style = style.replace('transition: background-color 0.3s ease;', 'transition: background-color 0.3s;');

// Breakpoint 768
style = style.replace(/max-width: 768px/g, 'max-width: 767.98px');

// Feature Card Hover Scale
style = style.replace(
  '.feature-card:hover { transform: translateY(-4px);',
  '.feature-card:hover { transform: translateY(-4px) scale(1.03);'
);
style = style.replace(
  '.mini-card:hover { transform: translateY(-4px);',
  '.mini-card:hover { transform: translateY(-4px) scale(1.03);'
);


// Add Word Reveal animation CSS
const wordRevealCSS = `
.wr-word {
  display: inline-block;
  transform: translateY(100%);
  opacity: 0;
  transition: transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
.is-revealed .wr-outer:nth-child(1) .wr-word { transition-delay: 0s; transform: translateY(0); opacity: 1; }
.is-revealed .wr-outer:nth-child(2) .wr-word { transition-delay: 0.1s; transform: translateY(0); opacity: 1; }
.is-revealed .wr-outer:nth-child(3) .wr-word { transition-delay: 0.2s; transform: translateY(0); opacity: 1; }
.is-revealed .wr-outer:nth-child(4) .wr-word { transition-delay: 0.3s; transform: translateY(0); opacity: 1; }
.is-revealed .wr-outer:nth-child(5) .wr-word { transition-delay: 0.4s; transform: translateY(0); opacity: 1; }
`;

style += wordRevealCSS;

// Fix Seg Cell active colors and scroll spy
style = style.replace(
  '.seg-cell.is-clicked { background-color: var(--blue-click); }',
  '.seg-cell.is-clicked { background-color: var(--blue-click) !important; }'
);
style = style.replace(
  '.seg-cell.is-active { background-color: var(--blue-spy); }',
  '.seg-cell.is-active { /* background handled by scroll-spy indicator */ }'
);

// We need to make .seg-cell transparent and add transition
style = style.replace(
  '.seg-cell {',
  '.seg-cell { background-color: transparent; transition: background-color 0.3s;'
);

fs.writeFileSync('tasks/frontend-landing-razorpay-sprint-26/solution/app/src/style.css', style);


// Index.html
let html = fs.readFileSync('tasks/frontend-landing-razorpay-sprint-26/solution/app/index.html', 'utf8');

if (!html.includes('id="scroll-spy"')) {
  html = html.replace(
    '<nav class="seg-nav" aria-label="Sections (desktop)">',
    '<nav class="seg-nav" aria-label="Sections (desktop)">\n      <div id="scroll-spy" style="position: absolute; top:0; left:0; height:100%; background-color: var(--blue-spy); transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94), width 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94); z-index: -1; opacity: 0;"></div>'
  );
  fs.writeFileSync('tasks/frontend-landing-razorpay-sprint-26/solution/app/index.html', html);
}
