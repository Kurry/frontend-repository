(() => {
  const page = document.querySelector("#grid-painter-page");
  if (!page) return;

  document.documentElement.style.setProperty("--bgColor", "#0000FF");

  if (window.matchMedia("(min-width: 1025px)").matches) {
    const dragBox = document.querySelector(".gp-drag-box");
    const handle = dragBox && dragBox.querySelector(".gp-drag-handle");
    if (dragBox && handle) {
      let dragging = false;
      let offset = { x: 0, y: 0 };

      handle.addEventListener("mousedown", (e) => {
        e.preventDefault();
        const parent = dragBox.offsetParent || dragBox.parentElement;
        const parentRect = parent.getBoundingClientRect();
        const boxRect = dragBox.getBoundingClientRect();
        offset.x = e.clientX - boxRect.left;
        offset.y = e.clientY - boxRect.top;
        dragBox.style.position = "absolute";
        dragBox.style.left = `${boxRect.left - parentRect.left}px`;
        dragBox.style.top = `${boxRect.top - parentRect.top}px`;
        dragBox.style.right = "auto";
        dragBox.style.bottom = "auto";
        dragBox.style.margin = "0";
        dragBox.style.transform = "none";
        dragging = true;
        dragBox.classList.add("dragging");
      });
      handle.addEventListener("dragstart", (e) => e.preventDefault());

      document.addEventListener("mousemove", (e) => {
        if (!dragging) return;
        e.preventDefault();
        const parent = dragBox.offsetParent || dragBox.parentElement;
        const parentRect = parent.getBoundingClientRect();
        const boxRect = dragBox.getBoundingClientRect();
        let newX = e.clientX - parentRect.left - offset.x;
        let newY = e.clientY - parentRect.top - offset.y;
        const section = dragBox.closest("section");
        if (section) {
          const sectionRect = section.getBoundingClientRect();
          const minX = sectionRect.left - parentRect.left;
          const minY = sectionRect.top - parentRect.top;
          const maxX = sectionRect.right - parentRect.left - boxRect.width;
          const maxY = sectionRect.bottom - parentRect.top - boxRect.height;
          newX = Math.max(minX, Math.min(newX, maxX));
          newY = Math.max(minY, Math.min(newY, maxY));
        }
        dragBox.style.left = `${newX}px`;
        dragBox.style.top = `${newY}px`;
      });

      document.addEventListener("mouseup", () => {
        if (dragging) dragBox.classList.remove("dragging");
        dragging = false;
      });
    }
  }

  const view = document.getElementById("gp-view");
  if (!view) return;
  const ctx = view.getContext("2d", { willReadFrequently: true });
  ctx.imageSmoothingEnabled = false;

  const fileInput = document.getElementById("gp-fileInput");
  const btnQR = document.getElementById("modeQR");
  const btnColor = document.getElementById("modeColor");
  const btnEraser = document.getElementById("modeEraser");
  const btnGrid = document.getElementById("toggleGrid");
  const cellSlider = document.getElementById("cellSize");
  const uploadBtn = document.getElementById("uploadBtn");
  const clearBtn = document.getElementById("clearBtn");
  const saveBtn = document.getElementById("saveBtn");
  const shareBtn = document.getElementById("shareBtn");
  const undoBtn = document.getElementById("undoBtn");

  let mode = "qr";
  let showGrid = true;
  if (window.innerWidth < 1025) {
    cellSlider.min = 36;
    cellSlider.max = 48;
    cellSlider.value = 42;
  }

  let cell = +cellSlider.value;
  let color = "#000000";
  let drawing = false;
  const BASE = 1024;
  let cols = Math.floor(BASE / cell);
  let rows = Math.floor(BASE / cell);
  let width = cols * cell;
  let height = rows * cell;
  view.width = width;
  view.height = height;

  let board = Array.from({ length: rows }, () => Array(cols).fill(null));
  const history = [];
  let hasPainted = false;
  let strokePushed = false;

  const qrMask = document.createElement("canvas");
  qrMask.width = 64;
  qrMask.height = 64;

  function buildQRMask() {
    if (typeof QRious === "undefined") return;
    const tmp = document.createElement("canvas");
    tmp.width = qrMask.width;
    tmp.height = qrMask.height;
    new QRious({
      element: tmp,
      size: qrMask.width,
      value: "GRIDPAINT.STUDIO",
      level: "H",
      background: "#ffffff",
      foreground: "#000000",
    });
    const src = tmp.getContext("2d").getImageData(0, 0, qrMask.width, qrMask.height);
    const dst = qrMask.getContext("2d").createImageData(qrMask.width, qrMask.height);
    for (let i = 0; i < src.data.length; i += 4) {
      const y = 0.2126 * src.data[i] + 0.7152 * src.data[i + 1] + 0.0722 * src.data[i + 2];
      dst.data[i] = 0;
      dst.data[i + 1] = 0;
      dst.data[i + 2] = 0;
      dst.data[i + 3] = y < 128 ? 255 : 0;
    }
    qrMask.getContext("2d").putImageData(dst, 0, 0);
  }

  buildQRMask();

  function emptyBoard() {
    return Array.from({ length: rows }, () => Array(cols).fill(null));
  }

  function rebuildGrid() {
    cols = Math.floor(BASE / cell);
    rows = Math.floor(BASE / cell);
    width = cols * cell;
    height = rows * cell;
    view.width = width;
    view.height = height;
    ctx.imageSmoothingEnabled = false;
    const old = board;
    const oldRows = old.length;
    const oldCols = old[0].length;
    board = emptyBoard();
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const ox = Math.floor((x * oldCols) / cols);
        const oy = Math.floor((y * oldRows) / rows);
        board[y][x] = old[Math.min(oy, oldRows - 1)][Math.min(ox, oldCols - 1)];
      }
    }
    render();
  }

  function drawBoard(targetCtx, includeGrid) {
    targetCtx.imageSmoothingEnabled = false;
    targetCtx.fillStyle = "#ffffff";
    targetCtx.fillRect(0, 0, width, height);

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const cellData = board[y][x];
        if (!cellData) continue;
        const px = x * cell;
        const py = y * cell;
        if (cellData.type === "color") {
          targetCtx.fillStyle = cellData.color;
          targetCtx.fillRect(px, py, cell, cell);
        } else if (cellData.type === "qr") {
          const tmp = document.createElement("canvas");
          tmp.width = cell;
          tmp.height = cell;
          const t = tmp.getContext("2d");
          t.imageSmoothingEnabled = false;
          const isWhite = cellData.color === "#ffffff";
          const isBlack = cellData.color === "#000000";
          const qrColor = isWhite ? "#000000" : isBlack ? "#ffffff" : cellData.color;
          const bgColor = isWhite ? "#ffffff" : isBlack ? "#000000" : "#ffffff";
          t.fillStyle = qrColor;
          t.fillRect(0, 0, cell, cell);
          t.globalCompositeOperation = "destination-in";
          t.drawImage(qrMask, 0, 0, qrMask.width, qrMask.height, 0, 0, cell, cell);
          t.globalCompositeOperation = "destination-over";
          t.fillStyle = bgColor;
          t.fillRect(0, 0, cell, cell);
          t.globalCompositeOperation = "source-over";
          targetCtx.drawImage(tmp, px, py);
        }
      }
    }

    if (includeGrid) {
      targetCtx.strokeStyle = "#0003";
      targetCtx.lineWidth = 1;
      targetCtx.beginPath();
      for (let x = 0; x <= width; x += cell) {
        targetCtx.moveTo(x, 0);
        targetCtx.lineTo(x, height);
      }
      for (let y = 0; y <= height; y += cell) {
        targetCtx.moveTo(0, y);
        targetCtx.lineTo(width, y);
      }
      targetCtx.stroke();
    }
  }

  function render() {
    drawBoard(ctx, showGrid);
  }

  function exportCanvas() {
    const out = document.createElement("canvas");
    out.width = width;
    out.height = height;
    const outCtx = out.getContext("2d");
    drawBoard(outCtx, false);
    return out;
  }

  function posToCell(evt) {
    const rect = view.getBoundingClientRect();
    const point = evt.touches ? evt.touches[0] : evt;
    const cx = (point.clientX - rect.left) * (width / rect.width);
    const cy = (point.clientY - rect.top) * (height / rect.height);
    return {
      gx: Math.min(cols - 1, Math.max(0, Math.floor(cx / cell))),
      gy: Math.min(rows - 1, Math.max(0, Math.floor(cy / cell))),
    };
  }

  function pushHistory() {
    history.push(JSON.stringify(board));
    if (history.length > 100) history.shift();
  }

  function undo() {
    if (!history.length) return;
    board = JSON.parse(history.pop());
    render();
  }

  function disableSlider() {
    if (hasPainted) return;
    hasPainted = true;
    cellSlider.disabled = true;
    cellSlider.closest(".gp-ctrl").classList.add("disabled");
  }

  function paint(evt) {
    const { gx, gy } = posToCell(evt);
    const prev = board[gy][gx];
    let next = null;
    if (mode === "qr") next = { type: "qr", color };
    else if (mode === "color") next = { type: "color", color };
    else if (mode === "erase") next = null;
    if (JSON.stringify(prev) !== JSON.stringify(next)) {
      disableSlider();
      if (!strokePushed) {
        pushHistory();
        strokePushed = true;
      }
      board[gy][gx] = next;
      render();
    }
  }

  function pixelizeImage(img, sx, sy, sw, sh) {
    const tmp = document.createElement("canvas");
    tmp.width = cols;
    tmp.height = rows;
    const t = tmp.getContext("2d", { willReadFrequently: true });
    t.imageSmoothingEnabled = false;
    t.drawImage(img, sx, sy, sw, sh, 0, 0, cols, rows);
    pushHistory();
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const p = t.getImageData(x, y, 1, 1).data;
        board[y][x] = { type: "color", color: `rgb(${p[0]},${p[1]},${p[2]})` };
      }
    }
    render();
    cellSlider.disabled = true;
    cellSlider.closest(".gp-ctrl").classList.add("disabled");
    hasPainted = true;
  }

  uploadBtn.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const img = new Image();
    img.onload = () => {
      const scale = Math.max(cols / img.naturalWidth, rows / img.naturalHeight);
      const nw = img.naturalWidth * scale;
      const nh = img.naturalHeight * scale;
      const tmp = document.createElement("canvas");
      tmp.width = cols;
      tmp.height = rows;
      const t = tmp.getContext("2d", { willReadFrequently: true });
      t.imageSmoothingEnabled = false;
      t.drawImage(img, (cols - nw) / 2, (rows - nh) / 2, nw, nh);
      pushHistory();
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const p = t.getImageData(x, y, 1, 1).data;
          board[y][x] = { type: "color", color: `rgb(${p[0]},${p[1]},${p[2]})` };
        }
      }
      render();
      cellSlider.disabled = true;
      cellSlider.closest(".gp-ctrl").classList.add("disabled");
      hasPainted = true;
      URL.revokeObjectURL(img.src);
      fileInput.value = "";
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      fileInput.value = "";
    };
    img.src = URL.createObjectURL(file);
  });

  const cameraBtn = document.getElementById("cameraBtn");
  const cameraOverlay = document.getElementById("cameraOverlay");
  const cameraFeed = document.getElementById("cameraFeed");
  const captureBtn = document.getElementById("captureBtn");
  const cancelCameraBtn = document.getElementById("cancelCameraBtn");
  let cameraStream = null;

  function stopCamera() {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      cameraStream = null;
    }
    cameraFeed.srcObject = null;
    cameraOverlay.classList.remove("show");
  }

  cameraBtn.addEventListener("click", async () => {
    try {
      cameraStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1024 },
          height: { ideal: 1024 },
        },
        audio: false,
      });
      cameraFeed.srcObject = cameraStream;
      cameraOverlay.classList.add("show");
    } catch (err) {
      console.error("Camera access denied:", err);
    }
  });

  captureBtn.addEventListener("click", () => {
    const vw = cameraFeed.videoWidth;
    const vh = cameraFeed.videoHeight;
    if (vw && vh) {
      const side = Math.min(vw, vh);
      pixelizeImage(cameraFeed, (vw - side) / 2, (vh - side) / 2, side, side);
    }
    stopCamera();
  });
  cancelCameraBtn.addEventListener("click", stopCamera);

  page.querySelectorAll(".gp-swatch").forEach((btn) => {
    btn.addEventListener("click", () => {
      page.querySelectorAll(".gp-swatch").forEach((b) => b.classList.remove("active"));
      color = btn.dataset.color;
      btn.classList.add("active");
    });
  });

  function setMode(next, activeBtn) {
    mode = next;
    [btnQR, btnColor, btnEraser].forEach((b) => b.classList.remove("on"));
    activeBtn.classList.add("on");
  }

  btnQR.addEventListener("click", () => setMode("qr", btnQR));
  btnColor.addEventListener("click", () => setMode("color", btnColor));
  btnEraser.addEventListener("click", () => setMode("erase", btnEraser));
  btnGrid.addEventListener("click", () => {
    showGrid = !showGrid;
    btnGrid.textContent = showGrid ? "Grid On" : "Grid Off";
    render();
  });
  cellSlider.addEventListener("input", (e) => {
    cell = +e.target.value;
    rebuildGrid();
  });

  undoBtn.addEventListener("click", undo);
  clearBtn.addEventListener("click", () => {
    pushHistory();
    board = emptyBoard();
    render();
    hasPainted = false;
    cellSlider.disabled = false;
    cellSlider.closest(".gp-ctrl").classList.remove("disabled");
  });

  function mergeWithFooter(gridCanvas) {
    return new Promise((resolve) => {
      const footerHeight = 48;
      const padding = 16;
      const merged = document.createElement("canvas");
      merged.width = gridCanvas.width;
      merged.height = gridCanvas.height + footerHeight;
      const m = merged.getContext("2d");
      m.drawImage(gridCanvas, 0, 0);
      m.fillStyle = "#000000";
      m.fillRect(0, gridCanvas.height, gridCanvas.width, footerHeight);
      m.fillStyle = "#ffffff";
      m.font = '16px "Arial Narrow", Arial, sans-serif';
      m.textBaseline = "middle";
      const leftText = "/MADE WITH GRID PAINT STUDIO";
      m.fillText(leftText, padding, gridCanvas.height + footerHeight / 2);
      const rightText = "<GRIDPAINT.STUDIO>";
      const rightWidth = m.measureText(rightText).width;
      m.fillText(
        rightText,
        gridCanvas.width - rightWidth - padding,
        gridCanvas.height + footerHeight / 2
      );
      merged.toBlob((blob) => resolve(blob), "image/png");
    });
  }

  async function downloadCanvas() {
    try {
      const blob = await mergeWithFooter(exportCanvas());
      const a = document.createElement("a");
      a.download = "grid_paint.png";
      a.href = URL.createObjectURL(blob);
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (err) {
      console.error("Save failed:", err);
    }
  }

  function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  }

  async function shareCanvas() {
    try {
      const blob = await mergeWithFooter(exportCanvas());
      const file = new File([blob], "grid_paint.png", { type: "image/png" });
      if (
        isMobileDevice() &&
        navigator.share &&
        navigator.canShare &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({
          title: "Grid Paint Studio",
          text: "Check out my grid art made with Grid Paint Studio!",
          files: [file],
        });
      } else {
        await downloadCanvas();
      }
    } catch (err) {
      if (err.name !== "AbortError") console.error("Share failed:", err);
    }
  }

  saveBtn.addEventListener("click", downloadCanvas);
  shareBtn.addEventListener("click", (e) => {
    e.preventDefault();
    shareCanvas();
  });

  function endStroke() {
    drawing = false;
    strokePushed = false;
  }

  view.addEventListener("mousedown", (e) => {
    drawing = true;
    strokePushed = false;
    paint(e);
  });
  view.addEventListener("mousemove", (e) => {
    if (drawing) paint(e);
  });
  window.addEventListener("mouseup", endStroke);
  view.addEventListener(
    "touchstart",
    (e) => {
      e.preventDefault();
      drawing = true;
      strokePushed = false;
      paint(e);
    },
    { passive: false }
  );
  view.addEventListener(
    "touchmove",
    (e) => {
      e.preventDefault();
      if (drawing) paint(e);
    },
    { passive: false }
  );
  window.addEventListener("touchend", endStroke);
  window.addEventListener("touchcancel", endStroke);

  window.addEventListener("keydown", (e) => {
    if (e.key === "q" || e.key === "Q") btnQR.click();
    if (e.key === "b" || e.key === "B") btnColor.click();
    if (e.key === "e" || e.key === "E") btnEraser.click();
    if (e.key === "g" || e.key === "G") btnGrid.click();
    if (e.key === "Backspace") {
      e.preventDefault();
      undo();
    }
    const map = {
      1: "#000000",
      2: "#ffffff",
      3: "#ff0000",
      4: "#ffff00",
      5: "#00ff00",
      6: "#0000ff",
      7: "#ff0098",
    };
    if (map[e.key]) {
      color = map[e.key];
      page.querySelectorAll(".gp-swatch").forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.color === color);
      });
    }
  });

  render();
})();
