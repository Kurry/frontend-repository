'use strict';
/* Original Avery Vale vector emblem rendered by the locally vendored Rive 2.39.0 runtime. */
(function () {
  const canvas = document.getElementById('riveMotifCanvas');
  const wrapper = document.querySelector('[data-rive-motif]');
  if (!canvas || !wrapper || !window.rive) return;

  window.rive.RuntimeLoader.setWasmUrl('/rive/rive.wasm');
  let motif;
  motif = new window.rive.Rive({
    src: '/rive/avery-apex.riv',
    canvas,
    autoplay: true,
    onLoad: () => {
      motif.resizeDrawingSurfaceToCanvas();
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      canvas.width = Math.max(canvas.width, Math.ceil(canvas.clientWidth * dpr));
      canvas.height = Math.max(canvas.height, Math.ceil(canvas.clientHeight * dpr));
      wrapper.classList.add('is-ready');
      wrapper.dataset.riveStatus = 'ready';
    },
    onLoadError: () => {
      wrapper.dataset.riveStatus = 'error';
    },
  });

  window.addEventListener('resize', () => motif.resizeDrawingSurfaceToCanvas(), { passive: true });
}());
