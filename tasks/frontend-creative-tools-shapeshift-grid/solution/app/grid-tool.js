(() => {
  const gridPainterPage = document.querySelector('#grid-painter-page');
  if (!gridPainterPage) return;

  document.documentElement.style.setProperty('--bgColor', '#0000FF');

  // Toolbar drag (desktop only)
  if (window.matchMedia('(min-width: 1025px)').matches) {
    (function () {
      const gpDragBox = document.querySelector('.gp-drag-box');
      if (!gpDragBox) return;
      const handle = gpDragBox.querySelector('.gp-drag-handle');
      if (!handle) return;
      let isDragging = false;
      let offset = { x: 0, y: 0 };

      handle.addEventListener('mousedown', (e) => {
        e.preventDefault();
        startDrag(e);
      });
      handle.addEventListener('dragstart', (e) => e.preventDefault());

      function startDrag(e) {
        const clientX = e.clientX;
        const clientY = e.clientY;
        const parent = gpDragBox.offsetParent || gpDragBox.parentElement;
        const parentRect = parent.getBoundingClientRect();
        const boxRect = gpDragBox.getBoundingClientRect();
        offset.x = clientX - boxRect.left;
        offset.y = clientY - boxRect.top;
        const initialLeft = boxRect.left - parentRect.left;
        const initialTop = boxRect.top - parentRect.top;
        gpDragBox.style.position = 'absolute';
        gpDragBox.style.left = `${initialLeft}px`;
        gpDragBox.style.top = `${initialTop}px`;
        gpDragBox.style.right = 'auto';
        gpDragBox.style.bottom = 'auto';
        gpDragBox.style.margin = '0';
        gpDragBox.style.transform = 'none';
        isDragging = true;
        gpDragBox.classList.add('dragging');
      }

      document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const parent = gpDragBox.offsetParent || gpDragBox.parentElement;
        const parentRect = parent.getBoundingClientRect();
        const boxRect = gpDragBox.getBoundingClientRect();
        let newX = e.clientX - parentRect.left - offset.x;
        let newY = e.clientY - parentRect.top - offset.y;
        const section = gpDragBox.closest('section');
        if (section) {
          const sectionRect = section.getBoundingClientRect();
          const minX = sectionRect.left - parentRect.left;
          const minY = sectionRect.top - parentRect.top;
          const maxX = sectionRect.right - parentRect.left - boxRect.width;
          const maxY = sectionRect.bottom - parentRect.top - boxRect.height;
          newX = Math.max(minX, Math.min(newX, maxX));
          newY = Math.max(minY, Math.min(newY, maxY));
        }
        gpDragBox.style.left = `${newX}px`;
        gpDragBox.style.top = `${newY}px`;
      });

      document.addEventListener('mouseup', () => {
        if (isDragging) gpDragBox.classList.remove('dragging');
        isDragging = false;
      });
    })();
  }

  const view = document.getElementById('gp-view');
  if (!view) return;
  const vx = view.getContext('2d', { willReadFrequently: true });
  vx.imageSmoothingEnabled = false;

  const fileInput = document.getElementById('gp-fileInput');
  const btnQR = document.getElementById('modeQR');
  const btnColor = document.getElementById('modeColor');
  const btnEraser = document.getElementById('modeEraser');
  const btnGrid = document.getElementById('toggleGrid');
  const cellSlider = document.getElementById('cellSize');
  const uploadBtn = document.getElementById('uploadBtn');
  const clearBtn = document.getElementById('clearBtn');
  const saveBtn = document.getElementById('saveBtn');

  let gpMode = 'qr';
  let showGrid = true;
  if (window.innerWidth < 1025) {
    cellSlider.min = 36;
    cellSlider.max = 48;
    cellSlider.value = 42;
  }
  let gpCell = +cellSlider.value;
  let gpColor = '#000000';
  let gpDrawing = false;
  const GP_BASE = 1024;
  let cols = Math.floor(GP_BASE / gpCell);
  let rows = Math.floor(GP_BASE / gpCell);
  let gpW = cols * gpCell;
  let gpH = rows * gpCell;
  view.width = gpW;
  view.height = gpH;

  let board = Array(rows)
    .fill(0)
    .map(() => Array(cols).fill(null));

  const qrMask = document.createElement('canvas');
  qrMask.width = 64;
  qrMask.height = 64;

  function buildQRMask() {
    const tmp = document.createElement('canvas');
    tmp.width = qrMask.width;
    tmp.height = qrMask.height;
    new QRious({
      element: tmp,
      size: qrMask.width,
      value: 'SHAPESHIFTFESTIVAL.COM',
      level: 'H',
      background: '#ffffff',
      foreground: '#000000',
    });
    const tctx = tmp.getContext('2d');
    const src = tctx.getImageData(0, 0, qrMask.width, qrMask.height);
    const dst = qrMask.getContext('2d').createImageData(qrMask.width, qrMask.height);
    for (let i = 0; i < src.data.length; i += 4) {
      const r = src.data[i];
      const g = src.data[i + 1];
      const b = src.data[i + 2];
      const y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      const a = y < 128 ? 255 : 0;
      dst.data[i] = 0;
      dst.data[i + 1] = 0;
      dst.data[i + 2] = 0;
      dst.data[i + 3] = a;
    }
    qrMask.getContext('2d').putImageData(dst, 0, 0);
  }

  function loadQRiousAndBuildMask() {
    if (typeof QRious !== 'undefined') {
      buildQRMask();
      return;
    }
    const script = document.createElement('script');
    script.src = 'vendor/qrious.min.js';
    script.onload = () => buildQRMask();
    document.head.appendChild(script);
  }
  loadQRiousAndBuildMask();

  function rebuildGrid() {
    cols = Math.floor(GP_BASE / gpCell);
    rows = Math.floor(GP_BASE / gpCell);
    gpW = cols * gpCell;
    gpH = rows * gpCell;
    view.width = gpW;
    view.height = gpH;
    vx.imageSmoothingEnabled = false;
    const old = board;
    const or2 = old.length;
    const oc = old[0].length;
    board = Array(rows)
      .fill(0)
      .map(() => Array(cols).fill(null));
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const ox = Math.floor((x * oc) / cols);
        const oy = Math.floor((y * or2) / rows);
        board[y][x] = old[Math.min(oy, or2 - 1)][Math.min(ox, oc - 1)];
      }
    }
    gpRender();
  }

  function gpRender() {
    vx.fillStyle = '#ffffff';
    vx.fillRect(0, 0, gpW, gpH);

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const cellData = board[y][x];
        if (!cellData) continue;
        const px = x * gpCell;
        const py = y * gpCell;
        if (cellData.type === 'color') {
          vx.fillStyle = cellData.color;
          vx.fillRect(px, py, gpCell, gpCell);
        } else if (cellData.type === 'qr') {
          const tmp = document.createElement('canvas');
          tmp.width = gpCell;
          tmp.height = gpCell;
          const t = tmp.getContext('2d');
          t.imageSmoothingEnabled = false;
          const isWhite = cellData.color === '#ffffff';
          const isBlack = cellData.color === '#000000';
          const qrColor = isWhite ? '#000000' : isBlack ? '#ffffff' : cellData.color;
          const bgColor = isWhite ? '#ffffff' : isBlack ? '#000000' : '#ffffff';
          t.fillStyle = qrColor;
          t.fillRect(0, 0, gpCell, gpCell);
          t.globalCompositeOperation = 'destination-in';
          t.drawImage(qrMask, 0, 0, qrMask.width, qrMask.height, 0, 0, gpCell, gpCell);
          t.globalCompositeOperation = 'destination-over';
          t.fillStyle = bgColor;
          t.fillRect(0, 0, gpCell, gpCell);
          t.globalCompositeOperation = 'source-over';
          vx.drawImage(tmp, px, py);
        }
      }
    }

    if (showGrid) {
      vx.strokeStyle = '#0003';
      vx.lineWidth = 1;
      vx.beginPath();
      for (let x = 0; x <= gpW; x += gpCell) {
        vx.moveTo(x, 0);
        vx.lineTo(x, gpH);
      }
      for (let y = 0; y <= gpH; y += gpCell) {
        vx.moveTo(0, y);
        vx.lineTo(gpW, y);
      }
      vx.stroke();
    }
  }

  function posToCell(evt) {
    const rect = view.getBoundingClientRect();
    const cx =
      ((evt.touches ? evt.touches[0].clientX : evt.clientX) - rect.left) *
      (gpW / rect.width);
    const cy =
      ((evt.touches ? evt.touches[0].clientY : evt.clientY) - rect.top) *
      (gpH / rect.height);
    return {
      gx: Math.min(cols - 1, Math.max(0, Math.floor(cx / gpCell))),
      gy: Math.min(rows - 1, Math.max(0, Math.floor(cy / gpCell))),
    };
  }

  const gpHistory = [];
  function pushHistory() {
    gpHistory.push(JSON.stringify(board));
    if (gpHistory.length > 100) gpHistory.shift();
  }
  function gpUndo() {
    if (!gpHistory.length) return;
    board = JSON.parse(gpHistory.pop());
    gpRender();
  }

  let gpHasPainted = false;
  function gpDisableSlider() {
    if (!gpHasPainted) {
      gpHasPainted = true;
      cellSlider.disabled = true;
      cellSlider.closest('.gp-ctrl').classList.add('disabled');
    }
  }

  function gpPaint(evt) {
    const { gx, gy } = posToCell(evt);
    const prev = board[gy][gx];
    let next = null;
    if (gpMode === 'qr') next = { type: 'qr', color: gpColor };
    else if (gpMode === 'color') next = { type: 'color', color: gpColor };
    else if (gpMode === 'erase') next = null;
    if (JSON.stringify(prev) !== JSON.stringify(next)) {
      gpDisableSlider();
      pushHistory();
      board[gy][gx] = next;
      gpRender();
    }
  }

  uploadBtn.onclick = () => fileInput.click();
  fileInput.onchange = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const img = new Image();
    img.onload = () => {
      const tmp = document.createElement('canvas');
      tmp.width = cols;
      tmp.height = rows;
      const t = tmp.getContext('2d', { willReadFrequently: true });
      t.imageSmoothingEnabled = false;
      const scale = Math.max(cols / img.naturalWidth, rows / img.naturalHeight);
      const nw = img.naturalWidth * scale;
      const nh = img.naturalHeight * scale;
      t.drawImage(img, (cols - nw) / 2, (rows - nh) / 2, nw, nh);
      pushHistory();
      gpDisableSlider();
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const p = t.getImageData(x, y, 1, 1).data;
          board[y][x] = {
            type: 'color',
            color: `rgb(${p[0]},${p[1]},${p[2]})`,
          };
        }
      }
      gpRender();
      cellSlider.disabled = true;
      cellSlider.closest('.gp-ctrl').classList.add('disabled');
    };
    img.src = URL.createObjectURL(f);
  };

  const cameraBtn = document.getElementById('cameraBtn');
  const cameraOverlay = document.getElementById('cameraOverlay');
  const cameraFeed = document.getElementById('cameraFeed');
  const captureBtn = document.getElementById('captureBtn');
  const cancelCameraBtn = document.getElementById('cancelCameraBtn');
  let cameraStream = null;

  function stopCamera() {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      cameraStream = null;
    }
    cameraFeed.srcObject = null;
    cameraOverlay.classList.remove('show');
  }

  function pixelizeFromVideo() {
    const vw = cameraFeed.videoWidth;
    const vh = cameraFeed.videoHeight;
    const side = Math.min(vw, vh);
    const sx = (vw - side) / 2;
    const sy = (vh - side) / 2;
    const tmp = document.createElement('canvas');
    tmp.width = cols;
    tmp.height = rows;
    const t = tmp.getContext('2d', { willReadFrequently: true });
    t.imageSmoothingEnabled = false;
    t.drawImage(cameraFeed, sx, sy, side, side, 0, 0, cols, rows);
    pushHistory();
    gpDisableSlider();
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const p = t.getImageData(x, y, 1, 1).data;
        board[y][x] = {
          type: 'color',
          color: `rgb(${p[0]},${p[1]},${p[2]})`,
        };
      }
    }
    gpRender();
    cellSlider.disabled = true;
    cellSlider.closest('.gp-ctrl').classList.add('disabled');
    gpHasPainted = true;
  }

  cameraBtn.onclick = async () => {
    try {
      cameraStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1024 },
          height: { ideal: 1024 },
        },
        audio: false,
      });
      cameraFeed.srcObject = cameraStream;
      cameraOverlay.classList.add('show');
    } catch (err) {
      console.error('Camera access denied:', err);
    }
  };
  captureBtn.onclick = () => {
    pixelizeFromVideo();
    stopCamera();
  };
  cancelCameraBtn.onclick = () => {
    stopCamera();
  };

  gridPainterPage.querySelectorAll('.gp-swatch').forEach((btn) => {
    btn.onclick = () => {
      gridPainterPage.querySelectorAll('.gp-swatch').forEach((b) => {
        b.classList.remove('active');
      });
      gpColor = btn.dataset.color;
      btn.classList.add('active');
    };
  });

  btnQR.onclick = () => {
    gpMode = 'qr';
    btnQR.classList.add('on');
    btnColor.classList.remove('on');
    btnEraser.classList.remove('on');
  };
  btnColor.onclick = () => {
    gpMode = 'color';
    btnColor.classList.add('on');
    btnQR.classList.remove('on');
    btnEraser.classList.remove('on');
  };
  btnEraser.onclick = () => {
    gpMode = 'erase';
    btnEraser.classList.add('on');
    btnQR.classList.remove('on');
    btnColor.classList.remove('on');
  };
  btnGrid.onclick = () => {
    showGrid = !showGrid;
    btnGrid.textContent = showGrid ? 'Grid On' : 'Grid Off';
    gpRender();
  };
  cellSlider.oninput = (e) => {
    gpCell = +e.target.value;
    rebuildGrid();
  };

  document.getElementById('undoBtn').onclick = () => {
    gpUndo();
  };
  clearBtn.onclick = () => {
    pushHistory();
    board = Array(rows)
      .fill(0)
      .map(() => Array(cols).fill(null));
    gpRender();
    gpHasPainted = false;
    cellSlider.disabled = false;
    cellSlider.closest('.gp-ctrl').classList.remove('disabled');
  };

  function mergeWithLogo(gridCanvas) {
    return new Promise((resolve) => {
      const footerHeight = 48;
      const padding = 16;
      const merged = document.createElement('canvas');
      merged.width = gridCanvas.width;
      merged.height = gridCanvas.height + footerHeight;
      const ctx = merged.getContext('2d');
      ctx.drawImage(gridCanvas, 0, 0);
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, gridCanvas.height, gridCanvas.width, footerHeight);
      ctx.fillStyle = '#ffffff';
      ctx.font = '16px Hoves';
      ctx.textBaseline = 'middle';
      const leftText = '/MADE WITH SHAPESHIFT GRID TOOL';
      ctx.fillText(leftText, padding, gridCanvas.height + footerHeight / 2);
      const rightText = '<SHAPESHIFTFESTIVAL.COM>';
      const rightTextWidth = ctx.measureText(rightText).width;
      ctx.fillText(
        rightText,
        gridCanvas.width - rightTextWidth - padding,
        gridCanvas.height + footerHeight / 2
      );
      merged.toBlob((blob) => resolve(blob), 'image/png');
    });
  }

  saveBtn.onclick = async () => {
    try {
      const blob = await mergeWithLogo(view);
      const a = document.createElement('a');
      a.download = 'shapeshift_grid.png';
      a.href = URL.createObjectURL(blob);
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (err) {
      console.error('Save failed:', err);
    }
  };

  const shareBtn = document.getElementById('shareBtn');
  function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  }
  async function shareCanvas() {
    try {
      const blob = await mergeWithLogo(view);
      const file = new File([blob], 'shapeshift_grid.png', { type: 'image/png' });
      if (
        isMobileDevice() &&
        navigator.share &&
        navigator.canShare &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({
          title: 'SHAPESHIFT Grid Painter',
          text: 'Check out my grid art made with SHAPESHIFT Grid Painter!',
          files: [file],
        });
      } else {
        const a = document.createElement('a');
        a.download = 'shapeshift_grid.png';
        a.href = URL.createObjectURL(blob);
        a.click();
        URL.revokeObjectURL(a.href);
      }
    } catch (err) {
      if (err.name !== 'AbortError') console.error('Share failed:', err);
    }
  }
  shareBtn.onclick = (e) => {
    e.preventDefault();
    shareCanvas();
  };

  view.addEventListener('mousedown', (e) => {
    gpDrawing = true;
    gpPaint(e);
  });
  view.addEventListener('mousemove', (e) => {
    if (gpDrawing) gpPaint(e);
  });
  window.addEventListener('mouseup', () => {
    gpDrawing = false;
  });
  view.addEventListener(
    'touchstart',
    (e) => {
      e.preventDefault();
      gpDrawing = true;
      gpPaint(e);
    },
    { passive: false }
  );
  view.addEventListener(
    'touchmove',
    (e) => {
      e.preventDefault();
      if (gpDrawing) gpPaint(e);
    },
    { passive: false }
  );
  window.addEventListener('touchend', () => {
    gpDrawing = false;
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'q' || e.key === 'Q') btnQR.click();
    if (e.key === 'b' || e.key === 'B') btnColor.click();
    if (e.key === 'e' || e.key === 'E') btnEraser.click();
    if (e.key === 'g' || e.key === 'G') btnGrid.click();
    if (e.key === 'Backspace') gpUndo();
    const map = {
      1: '#000000',
      2: '#ffffff',
      3: '#ff0000',
      4: '#ffff00',
      5: '#00ff00',
      6: '#0000ff',
      7: '#ff0098',
    };
    if (map[e.key]) {
      gpColor = map[e.key];
      gridPainterPage.querySelectorAll('.gp-swatch').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.color === gpColor);
      });
    }
  });

  gpRender();
})();
