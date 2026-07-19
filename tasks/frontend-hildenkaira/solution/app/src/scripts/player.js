// Custom video players: background loops + full in-card player UI.
// Progressive MP4 sources are served locally with HTTP range support, so
// seeking/scrubbing works natively through the <video> element.

const fmt = (t) => {
  if (!Number.isFinite(t)) return "00:00";
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

function activate(el, video) {
  if (el.getAttribute("data-player-activated") === "true") return;
  el.setAttribute("data-player-activated", "true");
  const src = el.getAttribute("data-player-src") || "";
  // Prefer VP9/WebM with progressive MP4 (H.264) fallback. Some Chromium
  // builds ship without the H.264 decoder, so an mp4-only <video> never
  // reaches readyState >= 2 there; the webm source keeps it playable.
  video.removeAttribute("src");
  while (video.firstChild) video.removeChild(video.firstChild);
  if (src) {
    const webm = src.replace(/\.mp4(\?.*)?$/i, (_m, q) => `.webm${q || ""}`);
    if (webm !== src) {
      const s = document.createElement("source");
      s.src = webm;
      s.type = "video/webm";
      video.appendChild(s);
    }
    const m = document.createElement("source");
    m.src = src;
    m.type = "video/mp4";
    video.appendChild(m);
  }
  video.load();
}

function initBackground(el) {
  const video = el.querySelector("video");
  if (!video) return;
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          activate(el, video);
          video.play().then(() => el.setAttribute("data-player-status", "playing")).catch(() => {});
        } else {
          video.pause();
        }
      });
    },
    { rootMargin: "100px" }
  );
  io.observe(el);
  video.addEventListener("playing", () => el.setAttribute("data-player-status", "playing"));
}

function initPlayer(el) {
  const video = el.querySelector(".bunny-player__video");
  if (!video) return;
  const progressEl = el.querySelector("[data-player-progress]");
  const bufferedEl = el.querySelector("[data-player-buffered]");
  const handle = el.querySelector("[data-player-timeline-handle]");
  const timeline = el.querySelector("[data-player-timeline]");
  const timeProgress = el.querySelector("[data-player-time-progress]");
  const timeDuration = el.querySelector("[data-player-time-duration]");
  const playSvgs = el.querySelectorAll(".bunny-player__play-svg");
  const pauseSvgs = el.querySelectorAll(".bunny-player__pause-svg");

  const setStatus = (s) => el.setAttribute("data-player-status", s);
  const syncIcons = () => {
    const playing = !video.paused;
    playSvgs.forEach((s) => (s.style.display = playing ? "none" : "block"));
    pauseSvgs.forEach((s) => (s.style.display = playing ? "block" : "none"));
  };

  const toggle = () => {
    activate(el, video);
    if (video.paused) {
      video.play().then(() => setStatus("playing")).catch(() => {});
    } else {
      video.pause();
      setStatus("paused");
    }
  };

  el.querySelectorAll('[data-player-control="playpause"], [data-player-control="big-playpause"]').forEach((btn) =>
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggle();
    })
  );

  const muteBtn = el.querySelector('[data-player-control="mute"]');
  muteBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    video.muted = !video.muted;
    el.setAttribute("data-player-muted", String(video.muted));
    const up = el.querySelector(".bunny-player__volume-up-svg");
    const mute = el.querySelector(".bunny-player__volume-mute-svg");
    if (up && mute) {
      up.style.display = video.muted ? "none" : "block";
      mute.style.display = video.muted ? "block" : "none";
    }
  });

  const fsBtn = el.querySelector('[data-player-control="fullscreen"]');
  fsBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    if (document.fullscreenElement) {
      document.exitFullscreen();
      el.setAttribute("data-player-fullscreen", "false");
    } else {
      (el.requestFullscreen ? el : video).requestFullscreen?.();
      el.setAttribute("data-player-fullscreen", "true");
    }
  });

  video.addEventListener("timeupdate", () => {
    const r = video.duration ? video.currentTime / video.duration : 0;
    if (progressEl) progressEl.style.transform = `scaleX(${r})`;
    if (handle) handle.style.left = `${r * 100}%`;
    if (timeProgress) timeProgress.textContent = fmt(video.currentTime);
  });
  video.addEventListener("progress", () => {
    if (bufferedEl && video.buffered.length && video.duration) {
      bufferedEl.style.transform = `scaleX(${video.buffered.end(video.buffered.length - 1) / video.duration})`;
    }
  });
  video.addEventListener("loadedmetadata", () => {
    if (timeDuration) timeDuration.textContent = fmt(video.duration);
  });
  video.addEventListener("play", syncIcons);
  video.addEventListener("pause", syncIcons);

  if (timeline) {
    const seekTo = (clientX) => {
      const rect = timeline.getBoundingClientRect();
      const r = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      if (video.duration) video.currentTime = r * video.duration;
    };
    let dragging = false;
    timeline.addEventListener("pointerdown", (e) => {
      dragging = true;
      timeline.classList.add("is-dragging");
      timeline.setPointerCapture(e.pointerId);
      seekTo(e.clientX);
    });
    timeline.addEventListener("pointermove", (e) => dragging && seekTo(e.clientX));
    timeline.addEventListener("pointerup", () => {
      dragging = false;
      timeline.classList.remove("is-dragging");
    });
  }

  el.addEventListener("mouseenter", () => el.classList.add("is-hover-active"));
  el.addEventListener("mouseleave", () => el.classList.remove("is-hover-active"));

  // Lazy: attach src when scrolled near.
  const io = new IntersectionObserver(
    (entries) => entries.forEach((entry) => entry.isIntersecting && activate(el, video)),
    { rootMargin: "200px" }
  );
  io.observe(el);
  setStatus("paused");
  syncIcons();
}

export function initPlayers() {
  document.querySelectorAll("[data-bunny-background-init]").forEach(initBackground);
  document.querySelectorAll("[data-bunny-player-init]").forEach(initPlayer);
}
