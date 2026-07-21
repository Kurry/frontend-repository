/**
 * Three.js scroll hero (Novapay Sprint 26).
 * Loads the Draco-compressed GLB scene and scrubs its baked camera animation
 * from native scroll progress across the scroll stage, with desktop mouse
 * parallax. The hero fold stays pinned while the stage is in view and releases
 * once the user scrolls past it; scrolling back up re-pins and reverses the
 * scrub. No programmatic scroll hijacking — native scroll position is the single
 * source of truth, so scroll-spy, deep links and the wordmark stay in sync.
 * Falls back to a static composition when WebGL is unavailable, and to a single
 * static frame under prefers-reduced-motion.
 */
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";

const isRM = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isMobileBP = () => window.innerWidth < 768;

const CONFIG = {
  glbPath: () => (isMobileBP() ? "/assets/3d/Sprint_mobile.glb" : "/assets/3d/Sprint.glb"),
  targetCamera: "DutchCamera001",
  parallax: { horizontalIntensityMin: 0.2, horizontalIntensityMax: 1.4, verticalIntensity: 0.15, rotationIntensity: 0.04, smoothness: 0.06 },
  mobile: { cameraOffsetX: 0.35 },
};
const lerp = (a, b, t) => a + (b - a) * t;

export function initHero() {
  const stage = document.querySelector(".threejs-scroll-section");
  const container = document.getElementById("canvas-container");
  const progressBar = document.getElementById("progress-bar");
  const heroFold = document.getElementById("Hero");
  if (!stage || !container || !heroFold) return;

  let foldPinned = false;
  const foldSpacer = document.createElement("div");
  foldSpacer.className = "hero-fold-spacer";
  foldSpacer.style.cssText = `height:${heroFold.offsetHeight}px;width:100%;`;
  heroFold.parentNode.insertBefore(foldSpacer, heroFold.nextSibling);
  const pinFold = () => { heroFold.style.cssText += "position:fixed;top:0;left:0;width:100%;height:100vh;z-index:1;"; foldSpacer.style.display = "block"; foldPinned = true; };
  const releaseFold = () => { ["position", "top", "left", "width", "height", "zIndex", "opacity"].forEach((p) => (heroFold.style[p] = "")); heroFold.style.opacity = "1"; foldSpacer.style.display = "none"; foldPinned = false; };

  function fallback() {
    stage.classList.add("no-webgl");
    container.style.display = "none";
    if (progressBar) progressBar.style.display = "none";
    releaseFold();
    window.dispatchEvent(new CustomEvent("glbLoaded"));
    window.dispatchEvent(new CustomEvent("threeJsCanvas", { detail: { active: false } }));
  }

  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: !isMobileBP(), powerPreference: isMobileBP() ? "low-power" : "high-performance", failIfMajorPerformanceCaveat: false }); }
  catch (e) { fallback(); return; }
  if (!renderer || !renderer.getContext || (renderer.getContext().isContextLost && renderer.getContext().isContextLost())) { fallback(); return; }

  const isMobile = isMobileBP();
  let viewportH = window.innerHeight;

  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  if (!isRM()) {
    window.addEventListener("mousemove", (e) => { pointer.tx = (e.clientX / window.innerWidth) * 2 - 1; pointer.ty = -(e.clientY / window.innerHeight) * 2 + 1; }, { passive: true });
    window.addEventListener("mouseleave", () => { pointer.tx = 0; pointer.ty = 0; });
  }

  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#0039FF");
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.0 : 1.5));
  renderer.shadowMap.enabled = false;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.75;
  container.appendChild(renderer.domElement);
  renderer.domElement.addEventListener("webglcontextlost", (e) => e.preventDefault());

  let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  let glbCamera = null, mixer = null, clipDuration = 0;

  let draco, loader;
  try {
    draco = new DRACOLoader();
    draco.setDecoderPath("/assets/draco/");
    loader = new GLTFLoader();
    loader.setDRACOLoader(draco);
  } catch(e) {
    fallback();
    return;
  }

  // ---- scroll-driven state (motion only) ----
  let progress = 0, targetProgress = 0, looping = false, released = true, lastFrame = 0;
  const savedPos = new THREE.Vector3(), savedRot = new THREE.Euler();
  const maxScroll = () => { const v = stage.offsetHeight - viewportH; return v > 100 ? v : Math.max(document.body.scrollHeight - viewportH, 1); };
  const stageBottom = () => stage.offsetHeight;

  function setReleased(r) {
    if (r && !released) {
      released = true;
      if (foldPinned) releaseFold();
      container.style.opacity = "0"; container.style.pointerEvents = "none";
      if (progressBar) progressBar.style.opacity = "0";
      window.dispatchEvent(new CustomEvent("threeJsCanvas", { detail: { active: false } }));
    } else if (!r && released) {
      released = false;
      if (!foldPinned) pinFold();
      container.style.opacity = "1"; container.style.pointerEvents = "";
      if (progressBar) progressBar.style.opacity = "1";
      window.dispatchEvent(new CustomEvent("threeJsCanvas", { detail: { active: true } }));
      if (!looping) { looping = true; requestAnimationFrame(tick); }
    }
  }

  function tick(now) {
    if (released) { looping = false; return; }
    requestAnimationFrame(tick);
    try { const gl = renderer.getContext(); if (gl && gl.isContextLost()) return; } catch { return; }
    if (now - lastFrame < 16) return; lastFrame = now;
    progress = lerp(progress, targetProgress, 0.08);
    if (Math.abs(progress - targetProgress) < 0.005) progress = targetProgress;
    if (mixer && clipDuration > 0) { mixer.setTime(Math.min(progress * clipDuration, clipDuration - 0.01)); if (glbCamera) { glbCamera.near = 0.001; glbCamera.far = 1000; glbCamera.updateProjectionMatrix(); } }
    if (progress >= 0.99) { const f = Math.min((progress - 0.99) / 0.01, 1); container.style.opacity = String(1 - f); heroFold.style.opacity = String(f); if (progressBar) progressBar.style.opacity = String(1 - f); }
    else { container.style.opacity = "1"; heroFold.style.opacity = "0"; if (progressBar) progressBar.style.opacity = "1"; }
    savedPos.copy(camera.position); savedRot.copy(camera.rotation);
    const intensity = lerp(CONFIG.parallax.horizontalIntensityMin, CONFIG.parallax.horizontalIntensityMax, Math.min(progress / 0.3, 1));
    if (glbCamera && mixer && !isMobileBP()) {
      pointer.x = lerp(pointer.x, pointer.tx, CONFIG.parallax.smoothness);
      pointer.y = lerp(pointer.y, pointer.ty, CONFIG.parallax.smoothness);
      camera.position.x += pointer.x * intensity;
      camera.position.y += pointer.y * CONFIG.parallax.verticalIntensity;
      camera.position.y = Math.min(camera.position.y, 0.6);
      camera.rotation.y -= pointer.x * CONFIG.parallax.rotationIntensity;
    }
    if (isMobileBP()) camera.position.x += CONFIG.mobile.cameraOffsetX;
    if (progressBar) progressBar.style.width = `${progress * 100}%`;
    renderer.render(scene, camera);
    camera.position.copy(savedPos); camera.rotation.copy(savedRot);
  }

  function onScroll() {
    targetProgress = Math.max(0, Math.min(1, window.scrollY / maxScroll()));
    setReleased(window.scrollY >= stageBottom());
  }

  function onLoaded(gltf) {
    scene.add(gltf.scene);
    gltf.scene.traverse((node) => {
      if (node.name === CONFIG.targetCamera || node.name.includes(CONFIG.targetCamera)) {
        if (node.isCamera) glbCamera = node; else node.traverse((s) => { if (s.isCamera) glbCamera = s; });
      }
      if (node.isCamera && !glbCamera) glbCamera = node;
      if (node.isMesh) { if (node.material) node.material.side = THREE.DoubleSide; node.frustumCulled = false; }
    });
    if (!glbCamera && gltf.cameras.length > 0) glbCamera = gltf.cameras.find((c) => c.name.includes(CONFIG.targetCamera)) || gltf.cameras[0];
    if (glbCamera) { glbCamera.aspect = window.innerWidth / window.innerHeight; glbCamera.near = 0.01; glbCamera.far = 1000; glbCamera.updateProjectionMatrix(); camera = glbCamera; }
    if (gltf.animations.length > 0) {
      mixer = new THREE.AnimationMixer(gltf.scene);
      for (const clip of gltf.animations) { const a = mixer.clipAction(clip); a.setLoop(THREE.LoopOnce); a.clampWhenFinished = true; a.play(); }
      clipDuration = Math.max(...gltf.animations.map((a) => a.duration));
    }
    window.dispatchEvent(new CustomEvent("glbLoaded"));
    if (isRM()) {
      if (mixer && clipDuration > 0) mixer.setTime(0);
      if (isMobileBP()) camera.position.x += CONFIG.mobile.cameraOffsetX;
      renderer.render(scene, camera);
      window.dispatchEvent(new CustomEvent("threeJsCanvas", { detail: { active: false } }));
      return;
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    if (!released && !looping) { looping = true; requestAnimationFrame(tick); }
    setTimeout(() => { const n = document.getElementById("scroll-nudge"); if (n) n.style.opacity = "0"; }, 3000);
  }

  try {
    loader.load(CONFIG.glbPath(), onLoaded, undefined, () => { fallback(); });
  } catch(e) {
    fallback();
  }

  let resizeTimer, lastW = window.innerWidth;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const w = window.innerWidth, h = window.innerHeight;
      if (w !== lastW || Math.abs(h - viewportH) > 100) { viewportH = h; lastW = w; }
      camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h);
    }, 100);
  });

  const FOCUSABLE = "button,a,input,select,textarea,[contenteditable],[tabindex]";
  window.addEventListener("keydown", (e) => {
    if (e.target && e.target.closest && e.target.closest(FOCUSABLE)) return;
    if (e.key === "ArrowDown") window.scrollBy(0, 200);
    if (e.key === "ArrowUp") window.scrollBy(0, -200);
  });
}
