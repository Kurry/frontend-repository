import { onMount, onCleanup, createEffect, createMemo } from "solid-js";
import {
  brightnessPct, blurPx, motionIndex, noiseAlpha,
} from "./store";
import { setPreviewCanvas } from "./utils/export";

const BG = "/assets/background.jpg";
const NOISE = "/assets/iso-noise.jpg";
const motionSrc = (i) => `/assets/motion-${String(i + 1).padStart(2, "0")}.jpg`;

const cache = new Map();
function loadImg(src) {
  if (cache.has(src)) return cache.get(src);
  const p = new Promise((res) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => res(img);
    img.onerror = () => res(null);
    img.src = src;
  });
  cache.set(src, p);
  return p;
}

export default function CanvasPreview(props) {
  let canvas, wrap;
  let raf = 0;
  let fadeFrom = null, fadeTo = null, fadeStart = 0, lastIdx = -1;
  let bgImg = null, noiseImg = null;
  const motionImgs = [];

  const st = createMemo(() => props.state);
  const srcIdx = createMemo(() => motionIndex(st()));
  const bgFilter = createMemo(() => {
    const s = st();
    const bright = brightnessPct(s.ev);
    const contrast = Math.max(40, Math.min(180, 100 + s.contrast * 0.55 + s.highlights * 0.18 - s.shadows * 0.12));
    const gray = s.gray ? "grayscale(1) " : "";
    return `${gray}brightness(${bright.toFixed(1)}%) contrast(${contrast.toFixed(1)}%) blur(${blurPx(s.aperture).toFixed(2)}px)`;
  });
  const fgFilter = createMemo(() => {
    const s = st();
    const bright = brightnessPct(s.ev);
    const contrast = Math.max(40, Math.min(180, 100 + s.contrast * 0.55 + s.highlights * 0.18 - s.shadows * 0.12));
    const gray = s.gray ? "grayscale(1) " : "";
    return `${gray}brightness(${bright.toFixed(1)}%) contrast(${contrast.toFixed(1)}%) blur(${(blurPx(s.aperture) * 0.45).toFixed(2)}px)`;
  });

  const drawFrame = (img, filter, alpha) => {
    if (!img) return;
    const ctx = canvas.getContext("2d");
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.filter = filter;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    ctx.restore();
  };

  const draw = () => {
    const ctx = canvas.getContext("2d");
    const s = st();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.filter = "none";
    ctx.globalAlpha = 1;
    drawFrame(bgImg, bgFilter(), 1);
    if (fadeFrom && fadeTo && fadeStart) {
      const t = Math.min(1, (performance.now() - fadeStart) / 220);
      drawFrame(fadeFrom, fgFilter(), 1 - t);
      drawFrame(fadeTo, fgFilter(), t);
      if (t < 1) raf = requestAnimationFrame(draw);
    } else if (fadeTo) {
      drawFrame(fadeTo, fgFilter(), 1);
    }
    const ga = noiseAlpha(s.iso);
    if (noiseImg && ga > 0.004) {
      ctx.save();
      ctx.globalAlpha = ga;
      ctx.globalCompositeOperation = "soft-light";
      ctx.filter = "none";
      const pat = ctx.createPattern(noiseImg, "repeat");
      if (pat) { ctx.fillStyle = pat; ctx.fillRect(0, 0, canvas.width, canvas.height); }
      ctx.restore();
    }
    if (s.peak && canvas.width > 4 && canvas.height > 4) {
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.globalAlpha = 0.28;
      ctx.filter = "contrast(180%) brightness(130%)";
      ctx.drawImage(canvas, 1, 0, canvas.width, canvas.height);
      ctx.restore();
    }
    ctx.filter = "none";
    ctx.globalAlpha = 1;
  };

  const resize = () => {
    if (!wrap) return;
    const r = wrap.getBoundingClientRect();
    const w = Math.max(2, Math.round(r.width));
    const h = Math.max(2, Math.round(r.height));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    draw();
  };

  onMount(async () => {
    [bgImg, noiseImg] = await Promise.all([loadImg(BG), loadImg(NOISE)]);
    for (let i = 0; i < 10; i++) motionImgs[i] = await loadImg(motionSrc(i));
    lastIdx = srcIdx();
    fadeTo = motionImgs[lastIdx];
    if (props.register) setPreviewCanvas(canvas);
    resize();
    window.addEventListener("resize", resize);
  });
  onCleanup(() => {
    window.removeEventListener("resize", resize);
    cancelAnimationFrame(raf);
    if (props.register) setPreviewCanvas(null);
  });

  createEffect(() => {
    const idx = srcIdx();
    if (lastIdx !== -1 && idx !== lastIdx) {
      fadeFrom = motionImgs[lastIdx];
      fadeTo = motionImgs[idx];
      fadeStart = performance.now();
    } else {
      fadeTo = motionImgs[idx];
    }
    lastIdx = idx;
    void bgFilter(); void fgFilter(); void st().iso; void st().peak;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(draw);
  });

  return (
    <div ref={wrap} class="absolute inset-0">
      <canvas ref={canvas} class="w-full h-full block" aria-hidden="true" />
    </div>
  );
}
