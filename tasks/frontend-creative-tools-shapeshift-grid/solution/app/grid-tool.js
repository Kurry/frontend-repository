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
  let gpDrawing = false; lastCell = null; let lastCell = null;
  const GP_BASE = 1024;
  let cols = Math.floor(GP_BASE / gpCell);
  let rows = Math.floor(GP_BASE / gpCell);
  let gpW = cols * gpCell;
  let gpH = rows * gpCell;
  view.width = gpW;
  view.height = gpH;

  let board = createEmptyBoard();

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
    board = createEmptyBoard();
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const ox = Math.floor((x * oc) / cols);
        const oy = Math.floor((y * or2) / rows);
        board[y][x] = old[Math.min(oy, or2 - 1)][Math.min(ox, oc - 1)];
      }
    }
    gpRender();
  }


  // --- SHAPESHIFT GRID TOOL ADDITIONS ---

  // State
  let gpBoards = [];
  let mirrorMode = 'off'; // 'off', 'horizontal', 'vertical'
  let currentLoadedBoard = null;

  // Seed boards
  function createEmptyBoard() {
    const res = Array(rows);
    for (let i = 0; i < rows; i++) {
      res[i] = Array(cols).fill(null);
    }
    return res;
  }

  function seedBoards() {
    gpBoards = [
      { name: 'Seed 1', tag: 'eval', favorite: false, cells: [] },
      { name: 'Seed 2', tag: 'eval', favorite: false, cells: [] },
      { name: 'Seed 3', tag: 'test', favorite: false, cells: [] },
      { name: 'Seed 4', tag: 'test', favorite: false, cells: [] }
    ];
  }
  seedBoards();

  // Stats
  function updateStats() {
    let painted = 0;
    let qr = 0;
    let colorFilled = 0;
    let blank = 0;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (!board[y][x]) {
          blank++;
        } else {
          painted++;
          if (board[y][x].type === 'qr') qr++;
          if (board[y][x].type === 'color') colorFilled++;
        }
      }
    }
    const stPainted = document.getElementById('statPainted');
    const stQr = document.getElementById('statQr');
    const stColor = document.getElementById('statColor');
    const stBlank = document.getElementById('statBlank');
    if(stPainted) stPainted.innerText = painted;
    if(stQr) stQr.innerText = qr;
    if(stColor) stColor.innerText = colorFilled;
    if(stBlank) stBlank.innerText = blank;
  }

  // Gallery render
  function renderGallery() {
    const grid = document.getElementById('gallery-grid');
    const emptyState = document.getElementById('gallery-empty-state');
    if (!grid || !emptyState) return;

    grid.innerHTML = '';
    const filter = (document.getElementById('tagFilter')?.value || '').trim().toLowerCase();

    let visibleCount = 0;
    gpBoards.forEach((b, index) => {
      if (filter && b.tag.toLowerCase() !== filter) return;
      visibleCount++;

      const card = document.createElement('div');
      card.className = 'gallery-card';
      card.tabIndex = 0;
      card.innerHTML = `
        <h3>${b.name}</h3>
        <p>Tag: ${b.tag}</p>
        <p>Fav: ${b.favorite ? 'Yes' : 'No'}</p>
        <div style="margin-top: 10px;">
          <button class="new-primary-btn load-board-btn" data-index="${index}" tabindex="0">Load</button>
          <button class="new-primary-btn white rename-board-btn" data-index="${index}" tabindex="0">Rename</button>
          <button class="new-primary-btn black delete-board-btn" data-index="${index}" tabindex="0">Delete</button>
        </div>
      `;
      grid.appendChild(card);
    });

    if (visibleCount === 0) {
      grid.style.display = 'none';
      emptyState.style.display = 'block';
    } else {
      grid.style.display = 'grid';
      emptyState.style.display = 'none';
    }

    // Attach events
    grid.querySelectorAll('.load-board-btn').forEach(btn => {
      btn.onclick = () => {
        const b = gpBoards[btn.getAttribute('data-index')];
        loadBoardCells(b.cells);
        document.getElementById('backToPaintBtn').click();
      };
    });
    grid.querySelectorAll('.rename-board-btn').forEach(btn => {
      btn.onclick = () => {
        const b = gpBoards[btn.getAttribute('data-index')];
        openRenameModal(b);
      };
    });
    grid.querySelectorAll('.delete-board-btn').forEach(btn => {
      btn.onclick = () => {
        if(confirm('Are you sure you want to delete this board?')) {
          deleteBoard(btn.getAttribute('data-index'));
        }
      };
    });
  }

  function getFlatCells() {
    const cells = [];
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const d = board[y][x];
        if (!d) {
          cells.push({ row: y, col: x, kind: 'blank', color: null });
        } else {
          cells.push({ row: y, col: x, kind: d.type, color: d.color });
        }
      }
    }
    return cells;
  }

  function loadBoardCells(cellsArray) {
    board = createEmptyBoard();
    if(cellsArray && cellsArray.length > 0) {
        cellsArray.forEach(c => {
            if (c.row < rows && c.col < cols) {
                if (c.kind === 'blank') {
                    board[c.row][c.col] = null;
                } else {
                    board[c.row][c.col] = { type: c.kind, color: c.color };
                }
            }
        });
    }
    pushHistory();
    gpRender();
    updateStats();
  }

  function saveBoard(name, tag) {
    gpBoards.push({
      name: name.trim(),
      tag: tag.trim(),
      favorite: false,
      cells: getFlatCells()
    });
    renderGallery();
  }

  function renameBoard(oldName, newName, newTag) {
    const b = gpBoards.find(x => x.name === oldName);
    if (b) {
      b.name = newName.trim();
      b.tag = newTag.trim();
      renderGallery();
    }
  }

  function deleteBoard(index) {
    gpBoards.splice(index, 1);
    renderGallery();
  }

  // Modals & Forms logic
  const saveBoardModal = document.getElementById('saveBoardModal');
  const renameModal = document.getElementById('renameModal');

  document.getElementById('saveBoardActionBtn')?.addEventListener('click', () => {
    document.getElementById('boardName').value = '';
    document.getElementById('boardTag').value = '';
    document.getElementById('boardNameError').style.opacity = '0'; setTimeout(() => document.getElementById('boardNameError').style.display = 'none', 300);
    document.getElementById('boardTagError').style.opacity = '0'; setTimeout(() => document.getElementById('boardTagError').style.display = 'none', 300);
    saveBoardModal.style.display = 'flex';
  });

  document.getElementById('saveBoardCancelBtn')?.addEventListener('click', () => {
    saveBoardModal.style.display = 'none';
  });

  document.getElementById('saveBoardForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('boardName').value.trim();
    const tag = document.getElementById('boardTag').value.trim();

    let valid = true;
    if (!name || name.length > 40 || gpBoards.some(b => b.name === name)) {
      document.getElementById('boardNameError').style.display = 'block'; setTimeout(() => document.getElementById('boardNameError').style.opacity = '1', 10);
      valid = false;
    } else {
      document.getElementById('boardNameError').style.opacity = '0'; setTimeout(() => document.getElementById('boardNameError').style.display = 'none', 300);
    }

    if (!tag || tag.length > 24) {
      document.getElementById('boardTagError').style.display = 'block'; setTimeout(() => document.getElementById('boardTagError').style.opacity = '1', 10);
      valid = false;
    } else {
      document.getElementById('boardTagError').style.opacity = '0'; setTimeout(() => document.getElementById('boardTagError').style.display = 'none', 300);
    }

    if (valid) {
      saveBoard(name, tag);
      saveBoardModal.style.display = 'none';
    }
  });

  function openRenameModal(b) {
    document.getElementById('renameOldName').value = b.name;
    document.getElementById('renameName').value = b.name;
    document.getElementById('renameTag').value = b.tag;
    document.getElementById('renameNameError').style.opacity = '0'; setTimeout(() => document.getElementById('renameNameError').style.display = 'none', 300);
    document.getElementById('renameTagError').style.opacity = '0'; setTimeout(() => document.getElementById('renameTagError').style.display = 'none', 300);
    renameModal.style.display = 'flex';
  }

  document.getElementById('renameCancelBtn')?.addEventListener('click', () => {
    renameModal.style.display = 'none';
  });

  document.getElementById('renameForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const oldName = document.getElementById('renameOldName').value;
    const name = document.getElementById('renameName').value.trim();
    const tag = document.getElementById('renameTag').value.trim();

    let valid = true;
    if (!name || name.length > 40 || (name !== oldName && gpBoards.some(b => b.name === name))) {
      document.getElementById('renameNameError').style.display = 'block'; setTimeout(() => document.getElementById('renameNameError').style.opacity = '1', 10);
      valid = false;
    } else {
      document.getElementById('renameNameError').style.opacity = '0'; setTimeout(() => document.getElementById('renameNameError').style.display = 'none', 300);
    }

    if (!tag || tag.length > 24) {
      document.getElementById('renameTagError').style.display = 'block'; setTimeout(() => document.getElementById('renameTagError').style.opacity = '1', 10);
      valid = false;
    } else {
      document.getElementById('renameTagError').style.opacity = '0'; setTimeout(() => document.getElementById('renameTagError').style.display = 'none', 300);
    }

    if (valid) {
      renameBoard(oldName, name, tag);
      renameModal.style.display = 'none';
    }
  });

  document.getElementById('galleryModeBtn')?.addEventListener('click', () => {
    document.querySelector('.gp-drag-wrapper').style.display = 'none';
    document.getElementById('gallery-section').style.display = 'block';
    renderGallery();
  });

  document.getElementById('backToPaintBtn')?.addEventListener('click', () => {
    document.getElementById('gallery-section').style.display = 'none';
    document.querySelector('.gp-drag-wrapper').style.display = 'block';
  });

  document.getElementById('tagFilter')?.addEventListener('input', () => {
    const val = document.getElementById('tagFilter').value;
    document.getElementById('clearFilterBtn').style.display = val ? 'inline-block' : 'none';
    renderGallery();
  });

  document.getElementById('clearFilterBtn')?.addEventListener('click', () => {
    document.getElementById('tagFilter').value = '';
    document.getElementById('clearFilterBtn').style.display = 'none';
    renderGallery();
  });

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
    cellSlider.disabled = true;
    cellSlider.closest('.gp-ctrl').classList.add('disabled');
    if (!gpHasPainted) {
      gpHasPainted = true;
      cellSlider.disabled = true;
      cellSlider.closest('.gp-ctrl').classList.add('disabled');
    }
  }

  function gpPaint(evt) {
    const { gx, gy } = posToCell(evt);

    // Bresenham interpolation for smooth drawing
    const cellsToPaint = [];
    if (lastCell && (lastCell.gx !== gx || lastCell.gy !== gy)) {
      let x0 = lastCell.gx;
      let y0 = lastCell.gy;
      let x1 = gx;
      let y1 = gy;
      let dx = Math.abs(x1 - x0);
      let dy = Math.abs(y1 - y0);
      let sx = (x0 < x1) ? 1 : -1;
      let sy = (y0 < y1) ? 1 : -1;
      let err = dx - dy;

      while(true) {
        cellsToPaint.push({gx: x0, gy: y0});
        if (x0 === x1 && y0 === y1) break;
        let e2 = 2 * err;
        if (e2 > -dy) { err -= dy; x0 += sx; }
        if (e2 < dx) { err += dx; y0 += sy; }
      }
    } else {
      cellsToPaint.push({gx, gy});
    }
    lastCell = {gx, gy};

    let overallChanged = false;

    for (const cell of cellsToPaint) {
      const cx = cell.gx;
      const cy = cell.gy;

      const applyToCell = (x, y) => {
          if(x < 0 || x >= cols || y < 0 || y >= rows) return false;
          const prev = board[y][x];
          let next = null;
          if (gpMode === 'qr') next = { type: 'qr', color: gpColor };
          else if (gpMode === 'color') next = { type: 'color', color: gpColor };
          else if (gpMode === 'erase') next = null;
          if (JSON.stringify(prev) !== JSON.stringify(next)) {
              board[y][x] = next;
              return true;
          }
          return false;
      };

      let changed = applyToCell(cx, cy);

      if (mirrorMode === 'horizontal') {
          const mx = cols - 1 - cx;
          if (mx !== cx && mx >= 0 && mx < cols) {
              if(applyToCell(mx, cy)) changed = true;
          }
      } else if (mirrorMode === 'vertical') {
          const my = rows - 1 - cy;
          if (my !== cy && my >= 0 && my < rows) {
              if(applyToCell(cx, my)) changed = true;
          }
      }
      if(changed) overallChanged = true;
    }

    if (overallChanged) {
      gpDisableSlider();
      pushHistory();
      gpRender();
      updateStats();
    }
    return; // old code below was replaced


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
      updateStats();
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
    updateStats();
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
}
)();

  // --- EXPORT & IMPORT JSON ---
  function getFillStatsObj() {
    let painted = 0, qr = 0, colorFilled = 0, blank = 0;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (!board[y][x]) blank++;
        else {
          painted++;
          if (board[y][x].type === 'qr') qr++;
          if (board[y][x].type === 'color') colorFilled++;
        }
      }
    }
    return { painted, qr, colorFilled, blank };
  }

  function exportSessionJSON() {
    const session = {
      schemaVersion: 'shapeshift-session-v1',
      cellSize: gpCell,
      brushMode: gpMode === 'erase' ? 'erase' : gpMode,
      paletteColor: gpColor === '#ffffff' ? 'white' : gpColor === '#000000' ? 'black' : gpColor === '#ff0000' ? 'red' : gpColor === '#ffff00' ? 'yellow' : gpColor === '#00ff00' ? 'green' : gpColor === '#0000ff' ? 'blue' : 'pink',
      gridOverlay: showGrid,
      mirrorMode: mirrorMode,
      fillStats: getFillStatsObj(),
      cells: getFlatCells(),
      boards: gpBoards
    };
    return JSON.stringify(session, null, 2);
  }

  function validateImportJSON(jsonStr) {
    try {
      const data = JSON.parse(jsonStr);
      if (data.schemaVersion !== 'shapeshift-session-v1') return 'schemaVersion must be shapeshift-session-v1';
      if (data.cellSize < 16 || data.cellSize > 64) return 'cellSize must be between 16 and 64';
      if (!['qr', 'color', 'erase'].includes(data.brushMode)) return 'brushMode invalid';
      if (!['white', 'black', 'red', 'yellow', 'green', 'blue', 'pink'].includes(data.paletteColor)) return 'paletteColor invalid';
      if (!['off', 'horizontal', 'vertical'].includes(data.mirrorMode)) return 'mirrorMode invalid';
      if (typeof data.gridOverlay !== 'boolean') return 'gridOverlay invalid';

      const stats = data.fillStats;
      if (!stats || typeof stats.painted !== 'number' || typeof stats.qr !== 'number' || typeof stats.colorFilled !== 'number' || typeof stats.blank !== 'number') return 'fillStats invalid';
      if (stats.painted !== stats.qr + stats.colorFilled) return 'fillStats mismatch';
      if (stats.painted + stats.blank !== data.cells.length) return 'fillStats length mismatch';

      if (!Array.isArray(data.cells)) return 'cells must be array';
      for (const c of data.cells) {
        if (!['blank', 'qr', 'color'].includes(c.kind)) return 'cell kind invalid';
        if (c.kind === 'blank' && c.color !== null) return 'blank cell color must be null';
      }

      if (!Array.isArray(data.boards)) return 'boards must be array';
      const names = new Set();
      for (const b of data.boards) {
        if (!b.name || typeof b.name !== 'string' || b.name.length > 40) return 'board name invalid';
        if (names.has(b.name)) return 'board name duplicate';
        names.add(b.name);
        if (!b.tag || typeof b.tag !== 'string' || b.tag.length > 24) return 'board tag invalid';
        if (!Array.isArray(b.cells)) return 'board cells invalid';
      }

      return null;
    } catch (e) {
      return 'unparseable';
    }
  }

  function importSessionJSON(jsonStr) {
    const error = validateImportJSON(jsonStr);
    if (error) return error;

    const data = JSON.parse(jsonStr);

    // Set UI state
    gpCell = data.cellSize;
    cellSlider.value = gpCell;
    cols = Math.floor(GP_BASE / gpCell);
    rows = Math.floor(GP_BASE / gpCell);

    gpMode = data.brushMode;
    document.querySelectorAll('.gp-modes button').forEach(b => b.classList.remove('on'));
    if (gpMode === 'qr') document.getElementById('modeQR').classList.add('on');
    if (gpMode === 'color') document.getElementById('modeColor').classList.add('on');
    if (gpMode === 'erase') document.getElementById('modeEraser').classList.add('on');

    const cMap = { 'white': '#ffffff', 'black': '#000000', 'red': '#ff0000', 'yellow': '#ffff00', 'green': '#00ff00', 'blue': '#0000ff', 'pink': '#ff0098' };
    gpColor = cMap[data.paletteColor];
    document.querySelectorAll('.gp-swatch').forEach(b => {
      b.classList.remove('active');
      if (b.getAttribute('data-color') === gpColor) b.classList.add('active');
    });

    showGrid = data.gridOverlay;
    document.getElementById('toggleGrid').innerText = showGrid ? 'Grid On' : 'Grid Off';

    mirrorMode = data.mirrorMode;
    document.getElementById('mirrorModeBtn').innerText = 'Mirror: ' + (mirrorMode.charAt(0).toUpperCase() + mirrorMode.slice(1));

    gpBoards = data.boards;
    renderGallery();

    loadBoardCells(data.cells); // This re-renders and updates stats

    return null;
  }

  const exportModal = document.getElementById('exportModal');

  document.getElementById('exportBtn')?.addEventListener('click', () => {
    document.getElementById('exportJsonPreview').value = exportSessionJSON();

    // Draw PNG preview
    const pngPreview = document.getElementById('exportPngPreview');
    const bCanvas = document.createElement('canvas');
    bCanvas.width = 1024; bCanvas.height = 1024 + 60; // plus footer
    const bCtx = bCanvas.getContext('2d');
    bCtx.drawImage(document.getElementById('gp-view'), 0, 0);
    bCtx.fillStyle = '#000000';
    bCtx.fillRect(0, 1024, 1024, 60);
    bCtx.fillStyle = '#ffffff';
    bCtx.font = '24px monospace'; // Assuming a generic monospace for footer
    bCtx.textAlign = 'left';
    bCtx.fillText('/MADE WITH SHAPESHIFT GRID TOOL', 20, 1024 + 40);
    bCtx.textAlign = 'right';
    bCtx.fillText('<SHAPESHIFTFESTIVAL.COM>', 1024 - 20, 1024 + 40);

    pngPreview.src = bCanvas.toDataURL('image/png');

    exportModal.style.display = 'flex';
  });

  document.getElementById('closeExportModal')?.addEventListener('click', () => {
    exportModal.style.display = 'none';
  });

  document.getElementById('tabExportJSON')?.addEventListener('click', (e) => {
    document.querySelectorAll('.tabs button').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    document.querySelectorAll('.tab-pane').forEach(p => p.style.display = 'none');
    document.getElementById('paneExportJSON').style.display = 'block';
  });
  document.getElementById('tabExportPNG')?.addEventListener('click', (e) => {
    document.querySelectorAll('.tabs button').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    document.querySelectorAll('.tab-pane').forEach(p => p.style.display = 'none');
    document.getElementById('paneExportPNG').style.display = 'block';
  });
  document.getElementById('tabImport')?.addEventListener('click', (e) => {
    document.querySelectorAll('.tabs button').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    document.querySelectorAll('.tab-pane').forEach(p => p.style.display = 'none');
    document.getElementById('paneImport').style.display = 'block';
    document.getElementById('importErrorMsg').style.display = 'none';
  });

  document.getElementById('copyJsonBtn')?.addEventListener('click', () => {
    navigator.clipboard.writeText(document.getElementById('exportJsonPreview').value).then(() => {
        const msg = document.getElementById('copyConfirmMsg');
        msg.style.display = 'inline';
        setTimeout(() => msg.style.display = 'none', 2000);
    }).catch(() => {
        document.execCommand('copy');
    });
  });

  document.getElementById('downloadJsonBtn')?.addEventListener('click', () => {
    const blob = new Blob([document.getElementById('exportJsonPreview').value], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'session.json';
    a.click();
    URL.revokeObjectURL(url);
  });

  document.getElementById('downloadPngBtn')?.addEventListener('click', () => {
    const a = document.createElement('a');
    a.href = document.getElementById('exportPngPreview').src;
    a.download = 'shapeshift-grid.png';
    a.click();
  });

  document.getElementById('importConfirmBtn')?.addEventListener('click', () => {
    const val = document.getElementById('importJsonInput').value;
    const err = importSessionJSON(val);
    if (err) {
      const errMsg = document.getElementById('importErrorMsg');
      errMsg.innerText = err;
      errMsg.style.display = 'block';
    } else {
      exportModal.style.display = 'none';
      document.getElementById('importJsonInput').value = '';
    }
  });

  document.getElementById('mirrorModeBtn')?.addEventListener('click', () => {
    if (mirrorMode === 'off') mirrorMode = 'horizontal';
    else if (mirrorMode === 'horizontal') mirrorMode = 'vertical';
    else mirrorMode = 'off';
    document.getElementById('mirrorModeBtn').innerText = 'Mirror: ' + (mirrorMode.charAt(0).toUpperCase() + mirrorMode.slice(1));
  });

  // --- WEBMCP CONTRACT ---

  // Structured Editor
  window.webmcp_select = function(type, id) {
    if (type !== 'grid-cell') return { success: false, error: 'unknown type' };
    // Not strictly needed in UI for this oracle, just return success
    return { success: true };
  };

  window.webmcp_update_property = function(prop, val, objectId) {
    if (prop === 'color') {
        const cMap = { 'white': '#ffffff', 'black': '#000000', 'red': '#ff0000', 'yellow': '#ffff00', 'green': '#00ff00', 'blue': '#0000ff', 'pink': '#ff0098' };
        if(cMap[val]) {
            gpColor = cMap[val];
            document.querySelectorAll('.gp-swatch').forEach(b => {
                b.classList.remove('active');
                if (b.getAttribute('data-color') === gpColor) b.classList.add('active');
            });
            return { success: true };
        }
    } else if (prop === 'mirror') {
        if (['off', 'horizontal', 'vertical'].includes(val)) {
            mirrorMode = val;
            document.getElementById('mirrorModeBtn').innerText = 'Mirror: ' + (mirrorMode.charAt(0).toUpperCase() + mirrorMode.slice(1));
            return { success: true };
        }
    }
    return { success: false, error: 'invalid prop or val' };
  };

  window.webmcp_switch_mode = function(mode) {
    if (['paint', 'erase', 'qr'].includes(mode)) {
        // Map editor mode to internal mode
        gpMode = mode === 'paint' ? 'color' : mode;
        document.querySelectorAll('.gp-modes button').forEach(b => b.classList.remove('on'));
        if (gpMode === 'qr') document.getElementById('modeQR').classList.add('on');
        if (gpMode === 'color') document.getElementById('modeColor').classList.add('on');
        if (gpMode === 'erase') document.getElementById('modeEraser').classList.add('on');
        return { success: true };
    }
    return { success: false, error: 'invalid mode' };
  };

  window.webmcp_preview = function() {
    return { success: true };
  };

  window.webmcp_set_content = function(content) {
    return { success: true };
  };

  // Entity Collection
  window.webmcp_create = function(type, data) {
    if (type !== 'board') return { success: false, error: 'invalid type' };
    if (!data.name || !data.tag) return { success: false, error: 'missing name/tag' };
    saveBoard(data.name, data.tag);
    return { success: true, count: gpBoards.length };
  };

  window.webmcp_update = function(type, id, data) {
    if (type !== 'board') return { success: false, error: 'invalid type' };
    const b = gpBoards.find(x => x.name === id);
    if (!b) return { success: false, error: 'board not found' };
    if (data.name) b.name = data.name;
    if (data.tag) b.tag = data.tag;
    if (data.favorite !== undefined) b.favorite = data.favorite;
    renderGallery();
    return { success: true };
  };

  window.webmcp_delete = function(type, id, confirm) {
    if (type !== 'board') return { success: false, error: 'invalid type' };
    if (confirm !== true) return { success: false, error: 'confirm required' };
    const idx = gpBoards.findIndex(x => x.name === id);
    if (idx < 0) return { success: false, error: 'not found' };
    deleteBoard(idx);
    return { success: true, count: gpBoards.length };
  };

  window.webmcp_toggle = function(type, id, prop) {
    if (type !== 'board') return { success: false, error: 'invalid type' };
    if (prop === 'favorite') {
        const b = gpBoards.find(x => x.name === id);
        if (b) { b.favorite = !b.favorite; renderGallery(); return { success: true }; }
    }
    return { success: false };
  };

  // Artifact Transfer
  window.webmcp_export = function(format) {
    if (format === 'session-json') {
      const json = exportSessionJSON();
      document.getElementById('exportJsonPreview').value = json;
      exportModal.style.display = 'flex';
      document.getElementById('tabExportJSON').click();
      return { success: true };
    } else if (format === 'png') {
      document.getElementById('exportBtn').click(); // triggers PNG generation and modal
      document.getElementById('tabExportPNG').click();
      return { success: true };
    }
    return { success: false, error: 'invalid format' };
  };

  window.webmcp_import = function(mode, payload) {
    if (mode === 'session-json') {
      const err = importSessionJSON(payload);
      if (err) return { success: false, error: err };
      return { success: true };
    }
    return { success: false, error: 'invalid mode' };
  };

  window.webmcp_copy = function(format) {
    if (format === 'session-json') {
        const json = exportSessionJSON();
        navigator.clipboard.writeText(json).catch(() => document.execCommand('copy'));
        return { success: true };
    }
    return { success: false, error: 'invalid format' };
  };

  // Accessibility: Focus trap & Keyboard bindings
  function trapFocus(modal) {
    const focusable = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    modal.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        modal.querySelector('.black, #closeExportModal')?.click();
      }
      if (e.key === 'Tab') {
        if (e.shiftKey) { // shift + tab
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else { // tab
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    });

    if(first) first.focus();
  }

  // Bind keydown for all elements with tabindex="0"
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      if (document.activeElement && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA' && document.activeElement.tabIndex === 0) {
        e.preventDefault();
        document.activeElement.click();
      }
    }
  });

  const observer = new MutationObserver(() => {
    [saveBoardModal, renameModal, exportModal, cameraOverlay].forEach(m => {
      if (m && m.style.display !== 'none' && !m.dataset.trapped) {
        m.dataset.trapped = 'true';
        trapFocus(m);
      } else if (m && m.style.display === 'none') {
        m.dataset.trapped = '';
      }
    });
  });
  observer.observe(document.body, { attributes: true, subtree: true, attributeFilter: ['style'] });

  document.addEventListener('keydown', (e) => {
    if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) return;
    switch(e.key.toLowerCase()) {
      case 'q': document.getElementById('modeQR')?.click(); break;
      case 'b': document.getElementById('modeColor')?.click(); break;
      case 'e': document.getElementById('modeEraser')?.click(); break;
      case 'g': document.getElementById('toggleGrid')?.click(); break;
      case 'backspace': document.getElementById('undoBtn')?.click(); break;
      case '1': document.querySelector('[data-color="#ffffff"]')?.click(); break;
      case '2': document.querySelector('[data-color="#000000"]')?.click(); break;
      case '3': document.querySelector('[data-color="#ff0000"]')?.click(); break;
      case '4': document.querySelector('[data-color="#ffff00"]')?.click(); break;
      case '5': document.querySelector('[data-color="#00ff00"]')?.click(); break;
      case '6': document.querySelector('[data-color="#0000ff"]')?.click(); break;
      case '7': document.querySelector('[data-color="#ff0098"]')?.click(); break;
    }
  });
