/**
 * Three.js scroll hero.
 *
 * Loads the Draco-compressed GLB scene, drives its baked camera animation
 * from scroll progress across the 500vh scroll stage, applies desktop mouse
 * parallax, and hands the viewport over to the hero fold once the sequence
 * completes. Runtime parameter values follow the PRD's normative ThreeHero
 * config (Components → ThreeHero).
 */
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";

const CONFIG = {
  glbPath:
    window.innerWidth < 768
      ? "/assets/3d/Sprint_mobile.glb"
      : "/assets/3d/Sprint.glb",
  showDebug: false,
  targetCamera: "DutchCamera001",
  parallax: {
    enabled: true,
    horizontalIntensityMin: 0.2,
    horizontalIntensityMax: 1.4,
    verticalIntensity: 0.15,
    rotationIntensity: 0.04,
    smoothness: 0.06,
  },
  mobile: {
    breakpoint: 768,
    cameraOffsetX: 0.35,
    disableParallax: true,
    parallaxBreakpoint: 768,
  },
};

const lerp = (a, b, t) => a + (b - a) * t;

export function initHero() {
  const stage = document.querySelector(".threejs-scroll-section");
  const container = document.getElementById("canvas-container");
  const progressBar = document.getElementById("progress-bar");
  const heroFold = document.getElementById("Hero");
  if (!stage || !container || !heroFold) return;

  const isMobile = window.innerWidth < CONFIG.mobile.breakpoint;
  const stageBottom = stage.offsetHeight;
  let viewportH = window.innerHeight;

  // Pin the hero fold behind the canvas until the sequence releases it.
  const foldSpacer = document.createElement("div");
  foldSpacer.style.cssText = `height:${heroFold.offsetHeight}px;width:100%;`;
  foldSpacer.className = "hero-fold-spacer";
  heroFold.parentNode.insertBefore(foldSpacer, heroFold.nextSibling);
  const pinFold = () => {
    heroFold.style.cssText +=
      "position:fixed;top:0;left:0;width:100%;height:100vh;z-index:1;";
    foldSpacer.style.display = "block";
  };
  const releaseFold = () => {
    heroFold.style.position = "";
    heroFold.style.top = "";
    heroFold.style.left = "";
    heroFold.style.width = "";
    heroFold.style.height = "";
    heroFold.style.zIndex = "";
    heroFold.style.opacity = "1";
    foldSpacer.style.display = "none";
  };
  pinFold();
  heroFold.style.opacity = "0";
  let foldPinned = true;

  const maxScroll = () => {
    const v = stage.offsetHeight - viewportH;
    return v > 100 ? v : Math.max(document.body.scrollHeight - viewportH, 1);
  };

  // Pointer parallax input
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener(
    "mousemove",
    (e) => {
      pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.ty = -(e.clientY / window.innerHeight) * 2 + 1;
    },
    { passive: true }
  );
  window.addEventListener("mouseleave", () => {
    pointer.tx = 0;
    pointer.ty = 0;
  });

  // Renderer / scene
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#0039FF");
  const renderer = new THREE.WebGLRenderer({
    antialias: !isMobile,
    powerPreference: isMobile ? "low-power" : "high-performance",
    failIfMajorPerformanceCaveat: false,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.0 : 1.5));
  renderer.shadowMap.enabled = false;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.75;
  container.appendChild(renderer.domElement);
  renderer.domElement.addEventListener("webglcontextlost", (e) => e.preventDefault());

  let camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  let glbCamera = null;
  let mixer = null;
  let clipDuration = 0;
  let stopped = false;
  let noReentry = false;

  const draco = new DRACOLoader();
  draco.setDecoderPath("/assets/draco/");
  const loader = new GLTFLoader();
  loader.setDRACOLoader(draco);

  function disableStage() {
    stopped = true;
    if (isMobile) noReentry = true;
    container.style.display = "none";
    stage.style.display = "none";
    releaseFold();
    foldPinned = false;
    window.scrollTo(0, 0);
    window.dispatchEvent(new CustomEvent("glbLoaded"));
    window.dispatchEvent(new CustomEvent("threeJsCanvas", { detail: { active: false } }));
    window.addEventListener("loaderExited", function onceReveal() {
      window.removeEventListener("loaderExited", onceReveal);
      requestAnimationFrame(() => {
        window.dispatchEvent(new Event("scroll"));
        window.dispatchEvent(new Event("resize"));
      });
    });
  }

  // Mobile: give the GLB six seconds, then degrade gracefully.
  let mobileTimeout = null;
  if (isMobile) {
    mobileTimeout = setTimeout(() => {
      if (!mixer) disableStage();
    }, 6000);
  }

  loader.load(
    CONFIG.glbPath,
    (gltf) => {
      if (stopped) return;
      if (mobileTimeout) clearTimeout(mobileTimeout);
      scene.add(gltf.scene);
      gltf.scene.traverse((node) => {
        if (
          node.name === CONFIG.targetCamera ||
          node.name.includes(CONFIG.targetCamera)
        ) {
          if (node.isCamera) glbCamera = node;
          else
            node.traverse((sub) => {
              if (sub.isCamera) glbCamera = sub;
            });
        }
        if (node.isCamera && !glbCamera) glbCamera = node;
        if (node.isMesh) {
          if (node.material) node.material.side = THREE.DoubleSide;
          node.frustumCulled = false;
        }
      });
      if (!glbCamera && gltf.cameras.length > 0) {
        glbCamera =
          gltf.cameras.find((c) => c.name.includes(CONFIG.targetCamera)) ||
          gltf.cameras[0];
      }
      if (glbCamera) {
        glbCamera.aspect = window.innerWidth / window.innerHeight;
        glbCamera.near = 0.01;
        glbCamera.far = 1000;
        glbCamera.updateProjectionMatrix();
        camera = glbCamera;
      }
      if (gltf.animations.length > 0) {
        mixer = new THREE.AnimationMixer(gltf.scene);
        for (const clip of gltf.animations) {
          const action = mixer.clipAction(clip);
          action.setLoop(THREE.LoopOnce);
          action.clampWhenFinished = true;
          action.play();
        }
        clipDuration = Math.max(...gltf.animations.map((a) => a.duration));
      }
      window.dispatchEvent(new CustomEvent("glbLoaded"));
      window.dispatchEvent(new CustomEvent("threeJsCanvas", { detail: { active: true } }));
      setTimeout(() => {
        const nudge = document.getElementById("scroll-nudge");
        if (nudge) nudge.style.opacity = "0";
      }, 3000);
    },
    undefined,
    () => {
      if (mobileTimeout) clearTimeout(mobileTimeout);
      disableStage();
    }
  );

  // Scroll progress + completion snap
  let progress = 0;
  let targetProgress = 0;
  let autoScrolling = false;
  let introDone = false;
  let completed = false;
  let lastCompletionAt = 0;

  function glide(toY, duration, done) {
    autoScrolling = true;
    const fromY = window.scrollY;
    const dist = toY - fromY;
    const t0 = performance.now();
    (function step(now) {
      const t = Math.min((now - t0) / duration, 1);
      const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      window.scrollTo(0, fromY + dist * eased);
      if (t < 1) requestAnimationFrame(step);
      else {
        autoScrolling = false;
        done && done();
      }
    })(t0);
  }

  requestAnimationFrame(() => {
    if (!introDone && window.scrollY === 0) {
      glide(maxScroll() * 0.02, 1200, () => (introDone = true));
    }
  });

  window.addEventListener(
    "scroll",
    () => {
      targetProgress = Math.max(0, Math.min(1, window.scrollY / maxScroll()));
      // Re-enter the stage when scrolling back up (desktop only after skip).
      if (stopped && !noReentry && window.scrollY < stageBottom) {
        stopped = false;
        if (isMobile) {
          completed = true;
          setTimeout(() => (completed = false), 2500);
        } else {
          completed = false;
        }
        const snap = maxScroll() * 0.7;
        window.scrollTo(0, snap);
        targetProgress = progress = 0.7;
        container.style.opacity = "1";
        container.style.pointerEvents = "";
        if (progressBar) progressBar.style.opacity = "1";
        if (!foldPinned) {
          pinFold();
          foldPinned = true;
        }
        window.dispatchEvent(new CustomEvent("threeJsCanvas", { detail: { active: true } }));
        requestAnimationFrame(tick);
      }
      if (window.scrollY <= stageBottom) {
        if (completed && targetProgress < 0.6) completed = false;
        if (!completed && !noReentry && targetProgress >= (isMobile ? 0.85 : 0.98)) {
          const now = Date.now();
          if (now - lastCompletionAt > 2500) {
            lastCompletionAt = now;
            completed = true;
            glide(stageBottom, 1500);
          }
        }
      }
    },
    { passive: true }
  );

  const savedPos = new THREE.Vector3();
  const savedRot = new THREE.Euler();
  let lastFrame = 0;

  function tick(now) {
    if (stopped) return;
    requestAnimationFrame(tick);
    try {
      const gl = renderer.getContext();
      if (gl && gl.isContextLost()) return;
    } catch {
      return;
    }
    if (now - lastFrame < 16) return;
    lastFrame = now;

    progress = lerp(progress, targetProgress, 0.05);
    if (Math.abs(progress - targetProgress) < 0.005) progress = targetProgress;

    if (mixer && clipDuration > 0) {
      mixer.setTime(Math.min(progress * clipDuration, clipDuration - 0.01));
      if (glbCamera) {
        glbCamera.near = 0.001;
        glbCamera.far = 1000;
        glbCamera.updateProjectionMatrix();
      }
    }

    const y = window.scrollY;
    if (y >= stageBottom) {
      if (foldPinned) {
        releaseFold();
        foldPinned = false;
      }
      container.style.opacity = "0";
      container.style.pointerEvents = "none";
      if (progressBar) progressBar.style.opacity = "0";
      stopped = true;
      window.dispatchEvent(new CustomEvent("threeJsCanvas", { detail: { active: false } }));
      return;
    }
    if (!foldPinned) {
      pinFold();
      foldPinned = true;
    }
    container.style.pointerEvents = "";
    if (progress >= 0.99) {
      const f = Math.min((progress - 0.99) / 0.01, 1);
      container.style.opacity = String(1 - f);
      heroFold.style.opacity = String(f);
      if (progressBar) progressBar.style.opacity = String(1 - f);
    } else {
      container.style.opacity = "1";
      heroFold.style.opacity = "0";
      if (progressBar) progressBar.style.opacity = "1";
    }

    savedPos.copy(camera.position);
    savedRot.copy(camera.rotation);
    const intensity = lerp(
      CONFIG.parallax.horizontalIntensityMin,
      CONFIG.parallax.horizontalIntensityMax,
      Math.min(progress / 0.3, 1)
    );
    const parallaxOff =
      CONFIG.mobile.disableParallax &&
      window.innerWidth < CONFIG.mobile.parallaxBreakpoint;
    if (CONFIG.parallax.enabled && !parallaxOff && glbCamera && mixer) {
      pointer.x = lerp(pointer.x, pointer.tx, CONFIG.parallax.smoothness);
      pointer.y = lerp(pointer.y, pointer.ty, CONFIG.parallax.smoothness);
      camera.position.x += pointer.x * intensity;
      camera.position.y += pointer.y * CONFIG.parallax.verticalIntensity;
      camera.position.y = Math.min(camera.position.y, 0.6);
      camera.rotation.y -= pointer.x * CONFIG.parallax.rotationIntensity;
    }
    if (window.innerWidth < CONFIG.mobile.breakpoint) {
      camera.position.x += CONFIG.mobile.cameraOffsetX;
    }
    if (progressBar) progressBar.style.width = `${progress * 100}%`;
    renderer.render(scene, camera);
    camera.position.copy(savedPos);
    camera.rotation.copy(savedRot);
  }
  tick(0);

  // Resize
  let resizeTimer;
  let lastW = window.innerWidth;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (stopped) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      if (w !== lastW || Math.abs(h - viewportH) > 100) {
        viewportH = h;
        lastW = w;
      }
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }, 100);
  });

  // Keyboard scroll affordance
  window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown" || e.key === " ") window.scrollBy(0, 200);
    if (e.key === "ArrowUp") window.scrollBy(0, -200);
  });
}
