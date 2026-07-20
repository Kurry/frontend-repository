import {
  For,
  Show,
  batch,
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  onMount,
} from "solid-js";
import { createStore } from "solid-js/store";
import { createForm } from "@tanstack/solid-form";
import { Dialog, Select, Slider, Tabs, ToggleButton } from "@kobalte/core";
import QRious from "qrious";
import {
  IconArrowRight,
  IconArrowBackUp,
  IconBrush,
  IconCamera,
  IconCheck,
  IconChevronDown,
  IconCopy,
  IconDeviceFloppy,
  IconDownload,
  IconEraser,
  IconFileCode,
  IconFileTypePng,
  IconGripHorizontal,
  IconPhotoUp,
  IconPencil,
  IconPlayerPlay,
  IconQrcode,
  IconShare,
  IconStar,
  IconStarFilled,
  IconTrash,
  IconUpload,
  IconX,
} from "@tabler/icons-solidjs";
import {
  BOARD_PIXELS,
  BoardSchema,
  COLORS,
  SCHEMA_VERSION,
  SessionSchema,
  boardNameError,
  boardTagError,
  formatZodError,
  gridDimensions,
} from "./schemas";

const DEFAULT_CELL_SIZE = 32;
const FESTIVAL_URL = "SHAPESHIFTFESTIVAL.COM";
const COLOR_HEX = {
  white: "#ffffff",
  black: "#050505",
  red: "#f17779",
  yellow: "#f3f36f",
  green: "#72e77c",
  blue: "#7878e9",
  pink: "#e86fb8",
};

const qrUrlCache = new Map();
const qrCanvasCache = new Map();

function qrColors(color) {
  if (color === "white") return { foreground: "#050505", background: "#ffffff" };
  if (color === "black") return { foreground: "#ffffff", background: "#050505" };
  return { foreground: COLOR_HEX[color], background: "#ffffff" };
}

function makeQrCanvas(color, size = 160) {
  const key = `${color}:${size}`;
  if (qrCanvasCache.has(key)) return qrCanvasCache.get(key);
  const canvas = document.createElement("canvas");
  const colors = qrColors(color);
  new QRious({
    element: canvas,
    value: FESTIVAL_URL,
    size,
    level: "H",
    padding: 2,
    foreground: colors.foreground,
    background: colors.background,
  });
  qrCanvasCache.set(key, canvas);
  return canvas;
}

function qrDataUrl(color) {
  if (!qrUrlCache.has(color)) qrUrlCache.set(color, makeQrCanvas(color).toDataURL("image/png"));
  return qrUrlCache.get(color);
}

function blankCells(cellSize = DEFAULT_CELL_SIZE) {
  const { rows, cols } = gridDimensions(cellSize);
  return Array.from({ length: rows * cols }, (_, index) => ({
    row: Math.floor(index / cols),
    col: index % cols,
    kind: "blank",
    color: null,
  }));
}

function cloneCells(cells) {
  return cells.map((cell) => ({ row: cell.row, col: cell.col, kind: cell.kind, color: cell.color }));
}

function calculateStats(cells) {
  return cells.reduce((stats, cell) => {
    if (cell.kind === "blank") stats.blank += 1;
    if (cell.kind === "qr") { stats.qr += 1; stats.painted += 1; }
    if (cell.kind === "color") { stats.colorFilled += 1; stats.painted += 1; }
    return stats;
  }, { painted: 0, qr: 0, colorFilled: 0, blank: 0 });
}

function seedPattern(name) {
  const cells = blankCells();
  const { rows, cols } = gridDimensions(DEFAULT_CELL_SIZE);
  const paint = (row, col, kind, color) => {
    const index = row * cols + col;
    cells[index] = { row, col, kind, color };
  };
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      if (name === "Pulse Study" && (row === col || row + col === cols - 1)) {
        paint(row, col, row % 3 === 0 ? "qr" : "color", row % 2 ? "pink" : "blue");
      }
      if (name === "Sun Gate" && row > 4 && row < 15 && col > 4 && col < 15 && (row < 7 || row > 12 || col < 7 || col > 12)) {
        paint(row, col, (row + col) % 5 === 0 ? "qr" : "color", "yellow");
      }
      if (name === "Field Notes" && row % 4 === 1 && col % 3 === 1) {
        paint(row, col, col % 2 ? "color" : "qr", col % 2 ? "green" : "black");
      }
      if (name === "After Dark" && row > 2 && row < 17 && col > 2 && col < 17 && (row + col) % 4 === 0) {
        paint(row, col, (row + col) % 8 === 0 ? "qr" : "color", (row + col) % 3 ? "black" : "red");
      }
    }
  }
  return cells;
}

function seededBoards() {
  return [
    { name: "Pulse Study", tag: "Festival", favorite: true, cells: seedPattern("Pulse Study") },
    { name: "Sun Gate", tag: "Poster", favorite: false, cells: seedPattern("Sun Gate") },
    { name: "Field Notes", tag: "Archive", favorite: false, cells: seedPattern("Field Notes") },
    { name: "After Dark", tag: "Night", favorite: true, cells: seedPattern("After Dark") },
  ];
}

function inferDimensions(cells) {
  return {
    rows: Math.max(1, ...cells.map((cell) => cell.row + 1)),
    cols: Math.max(1, ...cells.map((cell) => cell.col + 1)),
  };
}

function resampleCells(cells, nextCellSize, sourceDimensions = inferDimensions(cells)) {
  const nextDimensions = gridDimensions(nextCellSize);
  const sourceMap = new Map(cells.map((cell) => [`${cell.row}:${cell.col}`, cell]));
  const next = [];
  for (let row = 0; row < nextDimensions.rows; row += 1) {
    for (let col = 0; col < nextDimensions.cols; col += 1) {
      const sourceRow = Math.min(sourceDimensions.rows - 1, Math.floor((row + 0.5) * sourceDimensions.rows / nextDimensions.rows));
      const sourceCol = Math.min(sourceDimensions.cols - 1, Math.floor((col + 0.5) * sourceDimensions.cols / nextDimensions.cols));
      const sampled = sourceMap.get(`${sourceRow}:${sourceCol}`) || { kind: "blank", color: null };
      next.push({ row, col, kind: sampled.kind, color: sampled.color });
    }
  }
  return next;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function resultText(value) {
  return { content: [{ type: "text", text: JSON.stringify(value) }] };
}

export default function App() {
  const initialCells = blankCells();
  const [state, setState] = createStore({
    cellSize: DEFAULT_CELL_SIZE,
    cells: initialCells,
    history: [],
    brushMode: "qr",
    paletteColor: "black",
    mirrorMode: "off",
    gridOverlay: true,
    fillStats: calculateStats(initialCells),
    boards: seededBoards(),
    tagFilter: "",
    activeMode: "paint",
    exportPreviewText: "",
    sliderLocked: false,
    selectedBoard: null,
    selectedCell: null,
  });

  const [saveOpen, setSaveOpen] = createSignal(false);
  const [exportOpen, setExportOpen] = createSignal(false);
  const [importOpen, setImportOpen] = createSignal(false);
  const [cameraOpen, setCameraOpen] = createSignal(false);
  const [exportTab, setExportTab] = createSignal("session-json");
  const [copyStatus, setCopyStatus] = createSignal("");
  const [cameraError, setCameraError] = createSignal("");
  const [sessionNotice, setSessionNotice] = createSignal("");
  const [deletingBoard, setDeletingBoard] = createSignal("");
  const [pngPreviewUrl, setPngPreviewUrl] = createSignal("");
  const [toolbarPosition, setToolbarPosition] = createSignal({ x: 0, y: 78 });
  let toolbarRef;
  let canvasRef;
  let uploadInputRef;
  let videoRef;
  let cameraStream = null;
  let activeStroke = null;
  let pointerPainting = false;
  let pngGeneration = 0;
  const registeredWebMcpTools = [];

  const dimensions = createMemo(() => gridDimensions(state.cellSize));
  const uniqueTags = createMemo(() => [...new Set(state.boards.map((board) => board.tag))].sort());
  const filteredBoards = createMemo(() => state.tagFilter
    ? state.boards.filter((board) => board.tag === state.tagFilter)
    : state.boards);

  function compileSession() {
    return {
      schemaVersion: SCHEMA_VERSION,
      cellSize: state.cellSize,
      brushMode: state.brushMode,
      paletteColor: state.paletteColor,
      gridOverlay: state.gridOverlay,
      mirrorMode: state.mirrorMode,
      fillStats: { ...state.fillStats },
      cells: cloneCells(state.cells),
      boards: state.boards.map((board) => ({
        name: board.name,
        tag: board.tag,
        favorite: board.favorite,
        cells: cloneCells(board.cells),
      })),
    };
  }

  createEffect(() => {
    setState("exportPreviewText", JSON.stringify(compileSession(), null, 2));
  });

  function replaceCells(cells, { history = [], locked = state.sliderLocked } = {}) {
    batch(() => {
      setState("cells", cloneCells(cells));
      setState("fillStats", calculateStats(cells));
      setState("history", history);
      setState("sliderLocked", locked);
    });
  }

  function brushCell(row, col) {
    if (state.brushMode === "erase") return { row, col, kind: "blank", color: null };
    return { row, col, kind: state.brushMode, color: state.paletteColor };
  }

  function sameCell(a, b) {
    return a.kind === b.kind && a.color === b.color;
  }

  function mirrorIndex(index) {
    const { rows, cols } = dimensions();
    const row = Math.floor(index / cols);
    const col = index % cols;
    if (state.mirrorMode === "horizontal") return (rows - 1 - row) * cols + col;
    if (state.mirrorMode === "vertical") return row * cols + (cols - 1 - col);
    return index;
  }

  function applyBrushAt(index) {
    if (!Number.isInteger(index) || index < 0 || index >= state.cells.length) return false;
    const targets = new Set([index]);
    if (state.mirrorMode !== "off") targets.add(mirrorIndex(index));
    let changed = false;
    for (const target of targets) {
      const current = state.cells[target];
      const next = brushCell(current.row, current.col);
      if (sameCell(current, next)) continue;
      if (activeStroke && !activeStroke.has(target)) activeStroke.set(target, { ...current });
      setState("cells", target, next);
      changed = true;
    }
    if (changed) {
      batch(() => {
        setState("fillStats", calculateStats(state.cells));
        setState("sliderLocked", true);
      });
    }
    return changed;
  }

  function beginStroke(index) {
    activeStroke = new Map();
    pointerPainting = true;
    applyBrushAt(index);
  }

  function finishStroke() {
    if (!pointerPainting) return;
    pointerPainting = false;
    if (activeStroke?.size) {
      const changes = [...activeStroke.entries()].map(([index, previous]) => ({ index, previous }));
      setState("history", (history) => [...history.slice(-199), changes]);
    }
    activeStroke = null;
  }

  function undo() {
    if (!state.history.length) return;
    const stroke = state.history[state.history.length - 1];
    batch(() => {
      for (const change of stroke) setState("cells", change.index, { ...change.previous });
      setState("history", (history) => history.slice(0, -1));
      setState("fillStats", calculateStats(state.cells));
    });
  }

  function clearBoard() {
    replaceCells(blankCells(state.cellSize), { history: [], locked: false });
    setState("selectedBoard", null);
    setSessionNotice("Canvas cleared — cell size unlocked");
    setTimeout(() => setSessionNotice(""), 1800);
  }

  function resizeGrid(nextCellSize) {
    const size = Math.max(16, Math.min(64, Math.round(nextCellSize)));
    if (size === state.cellSize) return;
    const source = dimensions();
    const next = resampleCells(state.cells, size, source);
    batch(() => {
      setState("cellSize", size);
      setState("cells", next);
      setState("fillStats", calculateStats(next));
      setState("history", []);
    });
  }

  function setBrush(mode) {
    if (["qr", "color", "erase"].includes(mode)) setState("brushMode", mode);
  }

  function setPalette(color) {
    if (COLORS.includes(color)) setState("paletteColor", color);
  }

  function setMirror(mode) {
    if (["off", "horizontal", "vertical"].includes(mode)) setState("mirrorMode", mode);
  }

  function saveBoard(payload) {
    const prepared = {
      name: String(payload.name ?? "").trim(),
      tag: String(payload.tag ?? "").trim(),
      favorite: Boolean(payload.favorite),
      cells: cloneCells(payload.cells ?? state.cells),
    };
    const nameIssue = boardNameError(prepared.name, state.boards);
    const tagIssue = boardTagError(prepared.tag);
    if (nameIssue || tagIssue) return { ok: false, error: nameIssue || tagIssue };
    const parsed = BoardSchema.safeParse(prepared);
    if (!parsed.success) return { ok: false, error: formatZodError(parsed.error) };
    setState("boards", (boards) => [...boards, parsed.data]);
    setState("selectedBoard", parsed.data.name);
    setSessionNotice(`Saved “${parsed.data.name}”`);
    setTimeout(() => setSessionNotice(""), 2200);
    return { ok: true, board: parsed.data };
  }

  function renameBoard(currentName, payload) {
    const index = state.boards.findIndex((board) => board.name === currentName);
    if (index < 0) return { ok: false, error: "name: board was not found" };
    const prepared = {
      name: String(payload.name ?? "").trim(),
      tag: String(payload.tag ?? "").trim(),
      favorite: Boolean(payload.favorite),
      cells: cloneCells(payload.cells),
    };
    const nameIssue = boardNameError(prepared.name, state.boards, currentName);
    const tagIssue = boardTagError(prepared.tag);
    if (nameIssue || tagIssue) return { ok: false, error: nameIssue || tagIssue };
    const parsed = BoardSchema.safeParse(prepared);
    if (!parsed.success) return { ok: false, error: formatZodError(parsed.error) };
    batch(() => {
      setState("boards", index, parsed.data);
      if (state.selectedBoard === currentName) setState("selectedBoard", parsed.data.name);
    });
    return { ok: true, board: parsed.data };
  }

  function removeBoard(name, animate = true) {
    const exists = state.boards.some((board) => board.name === name);
    if (!exists) return false;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (animate && !reduced) setDeletingBoard(name);
    const complete = () => batch(() => {
      setState("boards", (boards) => boards.filter((board) => board.name !== name));
      if (state.selectedBoard === name) setState("selectedBoard", null);
      setDeletingBoard("");
    });
    if (animate && !reduced) setTimeout(complete, 180); else complete();
    return true;
  }

  function toggleFavorite(name) {
    const index = state.boards.findIndex((board) => board.name === name);
    if (index < 0) return false;
    setState("boards", index, "favorite", (favorite) => !favorite);
    return true;
  }

  function loadBoard(name) {
    const board = state.boards.find((candidate) => candidate.name === name);
    if (!board) return false;
    const source = inferDimensions(board.cells);
    const next = source.rows === dimensions().rows && source.cols === dimensions().cols
      ? cloneCells(board.cells)
      : resampleCells(board.cells, state.cellSize, source);
    // Loading a board seeds art without locking — resize can still resample until the user paints.
    replaceCells(next, { history: [], locked: false });
    batch(() => {
      setState("selectedBoard", board.name);
      setState("activeMode", "paint");
    });
    setSessionNotice(`Loaded “${board.name}”`);
    setTimeout(() => setSessionNotice(""), 1800);
    return true;
  }

  async function imageToGrid(source) {
    const imageWidth = source.videoWidth || source.naturalWidth || source.width;
    const imageHeight = source.videoHeight || source.naturalHeight || source.height;
    if (!imageWidth || !imageHeight) throw new Error("image: no pixels were available");
    const side = Math.min(imageWidth, imageHeight);
    const sx = (imageWidth - side) / 2;
    const sy = (imageHeight - side) / 2;
    const sample = document.createElement("canvas");
    const { rows, cols } = dimensions();
    sample.width = cols;
    sample.height = rows;
    const context = sample.getContext("2d", { willReadFrequently: true });
    context.drawImage(source, sx, sy, side, side, 0, 0, cols, rows);
    const pixels = context.getImageData(0, 0, cols, rows).data;
    const rgbPalette = Object.entries(COLOR_HEX).map(([name, hex]) => ({
      name,
      rgb: [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)],
    }));
    const next = [];
    for (let index = 0; index < rows * cols; index += 1) {
      const pixel = index * 4;
      let nearest = rgbPalette[0];
      let distance = Infinity;
      for (const color of rgbPalette) {
        const nextDistance = color.rgb.reduce((sum, channel, channelIndex) => sum + ((channel - pixels[pixel + channelIndex]) ** 2), 0);
        if (nextDistance < distance) { distance = nextDistance; nearest = color; }
      }
      next.push({ row: Math.floor(index / cols), col: index % cols, kind: "color", color: nearest.name });
    }
    replaceCells(next, { history: [], locked: true });
  }

  async function handleUpload(file) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const image = new Image();
    try {
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = () => reject(new Error("image: choose a readable image file"));
        image.src = url;
      });
      await imageToGrid(image);
      setSessionNotice("Image pixelized onto the grid");
      setTimeout(() => setSessionNotice(""), 1800);
    } finally {
      URL.revokeObjectURL(url);
      if (uploadInputRef) uploadInputRef.value = "";
    }
  }

  async function startCamera() {
    setCameraError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("camera: this browser does not expose a camera");
      return;
    }
    try {
      cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      if (videoRef) {
        videoRef.srcObject = cameraStream;
        await videoRef.play();
      }
    } catch {
      setCameraError("camera: permission was denied or no camera is available");
    }
  }

  function stopCamera() {
    cameraStream?.getTracks().forEach((track) => track.stop());
    cameraStream = null;
    if (videoRef) videoRef.srcObject = null;
  }

  async function captureCamera() {
    if (!videoRef?.videoWidth) {
      setCameraError("camera: wait for the preview before capturing");
      return;
    }
    await imageToGrid(videoRef);
    setCameraOpen(false);
    stopCamera();
    setSessionNotice("Camera capture pixelized onto the grid");
    setTimeout(() => setSessionNotice(""), 1800);
  }

  function applySession(session) {
    batch(() => {
      setState("cellSize", session.cellSize);
      setState("brushMode", session.brushMode);
      setState("paletteColor", session.paletteColor);
      setState("gridOverlay", session.gridOverlay);
      setState("mirrorMode", session.mirrorMode);
      setState("fillStats", { ...session.fillStats });
      setState("cells", cloneCells(session.cells));
      setState("boards", session.boards.map((board) => ({ ...board, cells: cloneCells(board.cells) })));
      setState("history", []);
      setState("sliderLocked", session.fillStats.painted > 0);
      setState("selectedBoard", null);
      setState("tagFilter", "");
      setState("activeMode", "paint");
    });
  }

  function parseSessionText(text) {
    let value;
    try {
      value = JSON.parse(text);
    } catch {
      return { ok: false, error: "import: malformed JSON — check commas, quotes, and braces" };
    }
    const parsed = SessionSchema.safeParse(value);
    if (!parsed.success) return { ok: false, error: formatZodError(parsed.error) };
    return { ok: true, data: parsed.data };
  }

  async function buildBrandedPng() {
    const canvas = document.createElement("canvas");
    const artSize = 900;
    const footerHeight = 120;
    const { rows, cols } = dimensions();
    canvas.width = artSize;
    canvas.height = artSize + footerHeight;
    const context = canvas.getContext("2d");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, artSize, artSize);
    const cellWidth = artSize / cols;
    const cellHeight = artSize / rows;
    for (const cell of state.cells) {
      const x = cell.col * cellWidth;
      const y = cell.row * cellHeight;
      if (cell.kind === "color") {
        context.fillStyle = COLOR_HEX[cell.color];
        context.fillRect(x, y, cellWidth + 0.5, cellHeight + 0.5);
      }
      if (cell.kind === "qr") {
        context.drawImage(makeQrCanvas(cell.color), x, y, cellWidth + 0.5, cellHeight + 0.5);
      }
    }
    if (state.gridOverlay) {
      context.strokeStyle = "rgba(0, 0, 0, .17)";
      context.lineWidth = 1;
      for (let row = 0; row <= rows; row += 1) {
        context.beginPath();
        context.moveTo(0, row * cellHeight);
        context.lineTo(artSize, row * cellHeight);
        context.stroke();
      }
      for (let col = 0; col <= cols; col += 1) {
        context.beginPath();
        context.moveTo(col * cellWidth, 0);
        context.lineTo(col * cellWidth, artSize);
        context.stroke();
      }
    }
    context.fillStyle = "#000000";
    context.fillRect(0, artSize, artSize, footerHeight);
    context.fillStyle = "#ffffff";
    context.font = "800 28px ui-monospace, SFMono-Regular, Menlo, monospace";
    context.textBaseline = "middle";
    context.fillText("/MADE WITH SHAPESHIFT GRID TOOL", 24, artSize + footerHeight / 2);
    const right = "<SHAPESHIFTFESTIVAL.COM>";
    context.fillText(right, artSize - 24 - context.measureText(right).width, artSize + footerHeight / 2);
    return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("PNG rendering failed")), "image/png"));
  }

  async function refreshPngPreview() {
    const generation = ++pngGeneration;
    const blob = await buildBrandedPng();
    if (generation !== pngGeneration) return;
    const next = URL.createObjectURL(blob);
    const previous = pngPreviewUrl();
    setPngPreviewUrl(next);
    if (previous) URL.revokeObjectURL(previous);
  }

  createEffect(() => {
    state.exportPreviewText;
    if (exportOpen() && exportTab() === "png") refreshPngPreview();
  });

  async function copyExport() {
    setCopyStatus("");
    try {
      if (exportTab() === "session-json") {
        await navigator.clipboard.writeText(state.exportPreviewText);
        setCopyStatus("Session JSON copied");
      } else {
        const blob = await buildBrandedPng();
        if (!window.ClipboardItem || !navigator.clipboard?.write) throw new Error("unsupported");
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        setCopyStatus("PNG copied");
      }
    } catch {
      setCopyStatus("Clipboard unavailable — use Download");
    }
    setTimeout(() => setCopyStatus(""), 2200);
  }

  async function downloadExport(format = exportTab()) {
    if (format === "session-json") {
      downloadBlob(new Blob([state.exportPreviewText], { type: "application/json" }), "shapeshift-session.json");
      return;
    }
    downloadBlob(await buildBrandedPng(), "shapeshift-grid.png");
  }

  async function sharePng() {
    const blob = await buildBrandedPng();
    const file = new File([blob], "shapeshift-grid.png", { type: "image/png" });
    const mobile = window.matchMedia?.("(max-width: 700px)").matches;
    if (mobile && navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
      try {
        await navigator.share({ files: [file], title: "SHAPESHIFT Grid Tool" });
        return;
      } catch (error) {
        if (error?.name === "AbortError") return;
      }
    }
    downloadBlob(blob, "shapeshift-grid.png");
  }

  function handleCanvasPointerDown(event) {
    if (event.button !== 0 && event.pointerType !== "touch") return;
    const cell = event.target.closest("[data-cell-index]");
    if (!cell) return;
    event.preventDefault();
    canvasRef?.setPointerCapture?.(event.pointerId);
    beginStroke(Number(cell.dataset.cellIndex));
  }

  function handleCanvasPointerMove(event) {
    if (!pointerPainting) return;
    event.preventDefault();
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest?.("[data-cell-index]");
    if (target && canvasRef?.contains(target)) applyBrushAt(Number(target.dataset.cellIndex));
  }

  function handleToolbarDragStart(event) {
    if (window.innerWidth < 760 || event.button !== 0) return;
    const position = toolbarPosition();
    const pointerStart = { x: event.clientX, y: event.clientY };
    const move = (moveEvent) => {
      const maxX = Math.max(0, window.innerWidth - (toolbarRef?.offsetWidth || 480) - 16);
      setToolbarPosition({
        x: Math.max(-40, Math.min(maxX, position.x + moveEvent.clientX - pointerStart.x)),
        y: Math.max(0, position.y + moveEvent.clientY - pointerStart.y),
      });
    };
    const end = () => {
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerup", end);
    };
    document.addEventListener("pointermove", move);
    document.addEventListener("pointerup", end, { once: true });
  }

  function waitForUi() {
    return new Promise((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    });
  }

  function applyBrushToSelectedCell() {
    const selected = state.selectedCell;
    if (!selected) return false;
    const { cols } = dimensions();
    const index = selected.row * cols + selected.col;
    activeStroke = new Map();
    const changed = applyBrushAt(index);
    if (changed && activeStroke.size) {
      const changes = [...activeStroke.entries()].map(([cellIndex, previous]) => ({ index: cellIndex, previous }));
      setState("history", (history) => [...history.slice(-199), changes]);
    }
    activeStroke = null;
    return changed;
  }

  function registerTool(definition) {
    if (!registeredWebMcpTools.some((tool) => tool.name === definition.name)) registeredWebMcpTools.push(definition);
    const host = navigator.modelContext || window.webmcp;
    if (!host?.registerTool) return;
    try {
      host.registerTool(definition);
    } catch {
      try { host.registerTool(definition.name, definition); } catch { /* Browser does not expose WebMCP. */ }
    }
  }

  function pickArgs(args = {}) {
    const nested = args.data || args.entity_fields || args.payload || args.fields || {};
    return { ...nested, ...args };
  }

  function registerWebMcpTools() {
    const schemas = {
      cell: {
        type: "object", additionalProperties: true,
        properties: { row: { type: "integer", minimum: 0 }, col: { type: "integer", minimum: 0 }, objectType: { type: "string" }, id: { type: "string" } },
        required: ["row", "col"],
      },
      name: {
        type: "object", additionalProperties: true,
        properties: { name: { type: "string", minLength: 1, maxLength: 40 }, entity: { type: "string" }, id: { type: "string" } },
        required: ["name"],
      },
    };

    const handlers = {
      editor_select: async (raw = {}) => {
        const args = pickArgs(raw);
        const row = Number(args.row);
        const col = Number(args.col);
        const { rows, cols } = dimensions();
        if (!Number.isInteger(row) || !Number.isInteger(col) || row < 0 || col < 0 || row >= rows || col >= cols) {
          throw new Error("grid-cell is outside the current grid");
        }
        batch(() => {
          setState("activeMode", "paint");
          setState("selectedCell", { row, col });
        });
        await waitForUi();
        return resultText({ selected: { row, col }, objectType: "grid-cell", visible: true });
      },
      editor_update_property: async (raw = {}) => {
        const args = pickArgs(raw);
        const property = args.property;
        const value = String(args.value ?? "").toLowerCase();
        if (property === "color") {
          if (!COLORS.includes(value)) throw new Error("color value is outside its closed enum");
          setPalette(value);
          applyBrushToSelectedCell();
        } else if (property === "brush") {
          if (!["qr", "color", "erase"].includes(value)) throw new Error("brush value is outside its closed enum");
          setBrush(value);
          applyBrushToSelectedCell();
        } else if (property === "mirror") {
          if (!["off", "horizontal", "vertical"].includes(value)) throw new Error("mirror value is outside its closed enum");
          setMirror(value);
        } else {
          throw new Error(`${property} is not a bound editor property`);
        }
        await waitForUi();
        return resultText({
          property,
          value,
          brushMode: state.brushMode,
          paletteColor: state.paletteColor,
          mirrorMode: state.mirrorMode,
          visible: true,
        });
      },
      editor_switch_mode: async (raw = {}) => {
        const mode = String(pickArgs(raw).mode || "").toLowerCase();
        if (!["paint", "erase", "qr"].includes(mode)) throw new Error("mode is outside its closed enum");
        batch(() => {
          setState("activeMode", "paint");
          setBrush(mode === "paint" ? "color" : mode);
        });
        await waitForUi();
        return resultText({ mode, brushMode: state.brushMode, visible: true });
      },
      editor_preview: async () => {
        setExportTab("session-json");
        setExportOpen(true);
        await waitForUi();
        return resultText({ preview: "session-json", visible: true });
      },
      editor_set_content: async (raw = {}) => {
        const content = String(pickArgs(raw).content || "").toLowerCase();
        if (content !== "blank") throw new Error("content must be blank");
        clearBoard();
        await waitForUi();
        return resultText({ content: "blank", visible: true });
      },
      entity_create: async (raw = {}) => {
        const args = pickArgs(raw);
        if (args.entity && args.entity !== "board") throw new Error("entity must be board");
        const result = saveBoard({
          name: args.name,
          tag: args.tag,
          favorite: args.favorite,
          cells: state.cells,
        });
        if (!result.ok) throw new Error(result.error);
        setState("activeMode", "gallery");
        await waitForUi();
        return resultText({
          entity: "board",
          board: result.board.name,
          name: result.board.name,
          tag: result.board.tag,
          count: state.boards.length,
          boards: state.boards.map((board) => board.name),
          visible: true,
        });
      },
      entity_select: async (raw = {}) => {
        const args = pickArgs(raw);
        const name = args.name || args.id;
        if (!name || !loadBoard(name)) throw new Error("board was not found");
        await waitForUi();
        return resultText({ entity: "board", board: name, mode: "paint", visible: true });
      },
      entity_update: async (raw = {}) => {
        const args = pickArgs(raw);
        const name = args.name || args.id;
        const nextName = args.nextName || args.next_name || args.newName || args.name;
        const tag = args.tag;
        const board = state.boards.find((item) => item.name === name);
        if (!board) throw new Error("board was not found");
        const result = renameBoard(name, { ...board, name: nextName, tag: tag ?? board.tag });
        if (!result.ok) throw new Error(result.error);
        setState("activeMode", "gallery");
        await waitForUi();
        return resultText({ entity: "board", board: result.board.name, name: result.board.name, tag: result.board.tag, visible: true });
      },
      entity_delete: async (raw = {}) => {
        const args = pickArgs(raw);
        const name = args.name || args.id;
        if (args.confirm !== true) throw new Error("confirm=true is required");
        if (!name || !removeBoard(name, false)) throw new Error("confirmed board was not found");
        setState("activeMode", "gallery");
        await waitForUi();
        return resultText({
          entity: "board",
          deleted: name,
          count: state.boards.length,
          boards: state.boards.map((board) => board.name),
          visible: true,
        });
      },
      entity_toggle: async (raw = {}) => {
        const args = pickArgs(raw);
        const name = args.name || args.id;
        if (!name || !toggleFavorite(name)) throw new Error("board was not found");
        setState("activeMode", "gallery");
        await waitForUi();
        const board = state.boards.find((item) => item.name === name);
        return resultText({ entity: "board", board: name, favorite: board.favorite, field: "favorite", visible: true });
      },
      artifact_export: async (raw = {}) => {
        const format = pickArgs(raw).format || pickArgs(raw).export_formats;
        if (!["session-json", "png"].includes(format)) throw new Error("format must be session-json or png");
        setExportTab(format);
        setExportOpen(true);
        if (format === "png") await refreshPngPreview();
        await waitForUi();
        return resultText({ format, previewOpen: true, visible: true });
      },
      artifact_import: async (raw = {}) => {
        const mode = pickArgs(raw).mode || pickArgs(raw).import_modes || "session-json";
        if (mode !== "session-json") throw new Error("mode must be session-json");
        setImportOpen(true);
        await waitForUi();
        return resultText({ mode: "session-json", importOpen: true, visible: true });
      },
      artifact_copy: async (raw = {}) => {
        const format = pickArgs(raw).format || "session-json";
        if (!["session-json", "png"].includes(format)) throw new Error("format must be session-json or png");
        setExportTab(format);
        setExportOpen(true);
        if (format === "png") await refreshPngPreview();
        await waitForUi();
        await copyExport();
        await waitForUi();
        return resultText({ format, copyAttempted: true, visible: true });
      },
    };

    const toolMeta = [
      { name: "editor_select", module: "structured-editor-v1", description: "Select a grid-cell by its bounded row and column.", inputSchema: schemas.cell },
      { name: "editor_update_property", module: "structured-editor-v1", description: "Update the closed color, brush, or mirror property used by the visible editor.", inputSchema: { type: "object", additionalProperties: true, properties: { property: { enum: ["color", "brush", "mirror"] }, value: { type: "string" } }, required: ["property", "value"] } },
      { name: "editor_switch_mode", module: "structured-editor-v1", description: "Switch the visible editor among paint, erase, and qr modes.", inputSchema: { type: "object", additionalProperties: true, properties: { mode: { enum: ["paint", "erase", "qr"] } }, required: ["mode"] } },
      { name: "editor_preview", module: "structured-editor-v1", description: "Open the visible artifact preview for the current grid.", inputSchema: { type: "object", additionalProperties: true, properties: {} } },
      { name: "editor_set_content", module: "structured-editor-v1", description: "Set the grid content to the bounded blank preset using the visible Clear command.", inputSchema: { type: "object", additionalProperties: true, properties: { content: { enum: ["blank"] } }, required: ["content"] } },
      { name: "entity_create", module: "entity-collection-v1", description: "Create a board from the current cells with the same Save board domain command.", inputSchema: { type: "object", additionalProperties: true, properties: { name: { type: "string" }, tag: { type: "string" }, favorite: { type: "boolean" }, entity: { type: "string" } }, required: ["name", "tag"] } },
      { name: "entity_select", module: "entity-collection-v1", description: "Load a named board through the same Gallery Load command.", inputSchema: schemas.name },
      { name: "entity_update", module: "entity-collection-v1", description: "Rename or retag one board using the same API-shaped update command.", inputSchema: { type: "object", additionalProperties: true, properties: { name: { type: "string" }, nextName: { type: "string" }, tag: { type: "string" } }, required: ["name"] } },
      { name: "entity_delete", module: "entity-collection-v1", description: "Delete a board. Explicit confirm=true is required.", inputSchema: { type: "object", additionalProperties: true, properties: { name: { type: "string" }, confirm: { type: "boolean" } }, required: ["name", "confirm"] } },
      { name: "entity_toggle", module: "entity-collection-v1", description: "Toggle the favorite field of a named board.", inputSchema: schemas.name },
      { name: "artifact_export", module: "artifact-transfer-v1", description: "Open the visible Export surface in a bounded format without returning artifact contents.", inputSchema: { type: "object", additionalProperties: true, properties: { format: { enum: ["session-json", "png"] } }, required: ["format"] } },
      { name: "artifact_import", module: "artifact-transfer-v1", description: "Open the visible session-json Import surface. File and paste mechanics remain user-driven.", inputSchema: { type: "object", additionalProperties: true, properties: { mode: { const: "session-json" } }, required: ["mode"] } },
      { name: "artifact_copy", module: "artifact-transfer-v1", description: "Invoke the visible copy workflow for the selected export format without returning contents.", inputSchema: { type: "object", additionalProperties: true, properties: { format: { enum: ["session-json", "png"] } }, required: ["format"] } },
    ];

    registeredWebMcpTools.length = 0;
    for (const meta of toolMeta) {
      registerTool({ ...meta, execute: handlers[meta.name] });
    }

    window.webmcp_session_info = async () => ({
      contract_version: "zto-webmcp-v1",
      contractVersion: "zto-webmcp-v1",
      modules: ["structured-editor-v1", "entity-collection-v1", "artifact-transfer-v1"],
      tool_names: toolMeta.map((tool) => tool.name),
      toolNames: toolMeta.map((tool) => tool.name),
      tools: toolMeta.map((tool) => tool.name),
    });
    window.webmcp_list_tools = async () => toolMeta.map(({ name, module, description, inputSchema }) => ({ name, module, description, inputSchema }));
    window.webmcp_invoke_tool = async (request, separateArguments = {}) => {
      const name = typeof request === "string" ? request : request?.name;
      const args = typeof request === "string" ? (separateArguments || {}) : (request?.arguments || request?.args || request || {});
      const handler = handlers[name];
      if (!handler) throw new Error(`WebMCP tool ${name || "(missing name)"} is not registered`);
      return handler(args);
    };
    window.webmcp = {
      sessionInfo: window.webmcp_session_info,
      listTools: window.webmcp_list_tools,
      invokeTool: window.webmcp_invoke_tool,
    };
  }

  onMount(() => {
    registerWebMcpTools();
    const keydown = (event) => {
      const element = event.target;
      if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement || element?.isContentEditable) return;
      if (event.key === "Backspace" || event.code === "Backspace") { event.preventDefault(); undo(); return; }
      const codeMap = { KeyQ: "qr", KeyB: "color", KeyE: "erase" };
      if (codeMap[event.code]) { setBrush(codeMap[event.code]); return; }
      const key = event.key.toLowerCase();
      if (key === "q") setBrush("qr");
      else if (key === "b") setBrush("color");
      else if (key === "e") setBrush("erase");
      else if (key === "g" || event.code === "KeyG") setState("gridOverlay", (value) => !value);
      const digit = event.code.startsWith("Digit") ? Number(event.code.slice(5)) : Number(event.key);
      if (digit >= 1 && digit <= COLORS.length) setPalette(COLORS[digit - 1]);
    };
    window.addEventListener("keydown", keydown);
    onCleanup(() => window.removeEventListener("keydown", keydown));
  });

  onCleanup(() => {
    stopCamera();
    if (pngPreviewUrl()) URL.revokeObjectURL(pngPreviewUrl());
  });

  function StatReadout() {
    return (
      <div class="stats-readout" aria-live="polite" aria-label="Live fill statistics">
        <span><b>{state.fillStats.painted}</b> painted</span>
        <span><b>{state.fillStats.qr}</b> qr</span>
        <span><b>{state.fillStats.colorFilled}</b> colorFilled</span>
        <span><b>{state.fillStats.blank}</b> blank</span>
      </div>
    );
  }

  function SaveBoardDialog() {
    const [attempted, setAttempted] = createSignal(false);
    const [formError, setFormError] = createSignal("");
    const form = createForm(() => ({
      defaultValues: { name: "", tag: "", favorite: false, cells: cloneCells(state.cells) },
      onSubmit: async ({ value }) => {
        setAttempted(true);
        const result = saveBoard({ ...value, cells: state.cells });
        if (!result.ok) { setFormError(result.error); return; }
        form.reset();
        setAttempted(false);
        setFormError("");
        setSaveOpen(false);
      },
    }));
    const values = form.useSelector((formState) => formState.values);
    const nameIssue = () => boardNameError(values().name, state.boards);
    const tagIssue = () => boardTagError(values().tag);
    const valid = () => !nameIssue() && !tagIssue();
    return (
      <Dialog.Root open={saveOpen()} onOpenChange={(open) => { setSaveOpen(open); if (!open) { setAttempted(false); setFormError(""); } }}>
        <Dialog.Trigger class="action-button save-button" aria-label="Save current board">
          <IconDeviceFloppy size={17} /> Save board
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay class="dialog-overlay" />
          <div class="dialog-positioner">
            <Dialog.Content class="dialog-content compact-dialog">
              <div class="dialog-kicker">/CREATE BOARD RECORD</div>
              <Dialog.Title>Save board</Dialog.Title>
              <Dialog.Description>Snapshot the current cells into the shared gallery collection.</Dialog.Description>
              <form onSubmit={(event) => { event.preventDefault(); setAttempted(true); form.handleSubmit(); }} novalidate>
                <form.Field name="name">
                  {(field) => (
                    <label class="form-field">
                      <span>Name <em>required · max 40</em></span>
                      <input
                        name={field().name}
                        value={field().state.value}
                        onInput={(event) => field().handleChange(event.currentTarget.value)}
                        onBlur={field().handleBlur}
                        aria-invalid={Boolean((attempted() || field().state.meta.isTouched) && nameIssue())}
                      />
                      <Show when={(attempted() || field().state.meta.isTouched) && nameIssue()}>
                        <small class="field-error" role="alert">{nameIssue()}</small>
                      </Show>
                    </label>
                  )}
                </form.Field>
                <form.Field name="tag">
                  {(field) => (
                    <label class="form-field">
                      <span>Tag <em>required · max 24</em></span>
                      <input
                        name={field().name}
                        value={field().state.value}
                        onInput={(event) => field().handleChange(event.currentTarget.value)}
                        onBlur={field().handleBlur}
                        aria-invalid={Boolean((attempted() || field().state.meta.isTouched) && tagIssue())}
                      />
                      <Show when={(attempted() || field().state.meta.isTouched) && tagIssue()}>
                        <small class="field-error" role="alert">{tagIssue()}</small>
                      </Show>
                    </label>
                  )}
                </form.Field>
                <Show when={formError()}><div class="form-alert" role="alert">{formError()}</div></Show>
                <div class="dialog-actions">
                  <Dialog.CloseButton class="text-button">Cancel</Dialog.CloseButton>
                  <button class="primary-button" type="submit" disabled={!valid()}>Save board <IconArrowRight size={17} /></button>
                </div>
              </form>
              <Dialog.CloseButton class="icon-close" aria-label="Close Save board dialog"><IconX size={19} /></Dialog.CloseButton>
            </Dialog.Content>
          </div>
        </Dialog.Portal>
      </Dialog.Root>
    );
  }

  function ImportDialog() {
    const [attempted, setAttempted] = createSignal(false);
    const [importError, setImportError] = createSignal("");
    let fileRef;
    const form = createForm(() => ({
      defaultValues: { json: "" },
      onSubmit: async ({ value }) => {
        setAttempted(true);
        const result = parseSessionText(value.json);
        if (!result.ok) { setImportError(result.error); return; }
        applySession(result.data);
        setImportError("");
        setAttempted(false);
        form.reset();
        setImportOpen(false);
        setSessionNotice("Session imported — canvas, tools, and gallery replaced");
        setTimeout(() => setSessionNotice(""), 2400);
      },
    }));
    const values = form.useSelector((formState) => formState.values);
    const currentValidation = () => values().json.trim() ? parseSessionText(values().json) : { ok: false, error: "import: paste Session JSON or choose a file" };
    const handleFile = async (file) => {
      if (!file) return;
      const text = await file.text();
      form.setFieldValue("json", text);
      setImportError("");
    };
    return (
      <Dialog.Root open={importOpen()} onOpenChange={(open) => { setImportOpen(open); if (!open) { setImportError(""); setAttempted(false); } }}>
        <Dialog.Trigger class="tool-button secondary-tool"><IconUpload size={16} /> Import</Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay class="dialog-overlay" />
          <div class="dialog-positioner">
            <Dialog.Content class="dialog-content import-dialog">
              <div class="dialog-kicker">/SESSION TRANSFER</div>
              <Dialog.Title>Import Session JSON</Dialog.Title>
              <Dialog.Description>A valid document atomically replaces the canvas, tools, fill stats, and boards.</Dialog.Description>
              <form onSubmit={(event) => { event.preventDefault(); setAttempted(true); form.handleSubmit(); }} novalidate>
                <form.Field name="json">
                  {(field) => (
                    <label class="form-field json-field">
                      <span>Session JSON <em>schemaVersion {SCHEMA_VERSION}</em></span>
                      <textarea
                        name={field().name}
                        value={field().state.value}
                        onInput={(event) => { field().handleChange(event.currentTarget.value); setImportError(""); }}
                        onBlur={field().handleBlur}
                        placeholder={'{\n  "schemaVersion": "shapeshift-session-v1"\n}'}
                        aria-invalid={Boolean(importError())}
                      />
                    </label>
                  )}
                </form.Field>
                <div class="file-row">
                  <input ref={fileRef} type="file" accept="application/json,.json" onChange={(event) => handleFile(event.currentTarget.files?.[0])} />
                  <button type="button" class="outline-button" onClick={() => fileRef?.click()}><IconFileCode size={17} /> Choose JSON file</button>
                  <span>{values().json ? `${values().json.length.toLocaleString()} characters ready` : "No file selected"}</span>
                </div>
                <Show when={importError() || ((attempted() || values().json.trim()) && !currentValidation().ok)}>
                  <div class="form-alert" role="alert" aria-live="assertive">{importError() || currentValidation().error}</div>
                </Show>
                <div class="dialog-actions">
                  <Dialog.CloseButton class="text-button">Cancel</Dialog.CloseButton>
                  <button class="primary-button" type="submit" disabled={!currentValidation().ok}>Import session <IconArrowRight size={17} /></button>
                </div>
              </form>
              <Dialog.CloseButton class="icon-close" aria-label="Close Import dialog"><IconX size={19} /></Dialog.CloseButton>
            </Dialog.Content>
          </div>
        </Dialog.Portal>
      </Dialog.Root>
    );
  }

  function ExportDialog() {
    return (
      <Dialog.Root open={exportOpen()} onOpenChange={(open) => { setExportOpen(open); if (open && exportTab() === "png") refreshPngPreview(); }}>
        <Dialog.Trigger class="action-button export-button"><span>Export</span><IconArrowRight size={17} /></Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay class="dialog-overlay" />
          <div class="dialog-positioner">
            <Dialog.Content class="dialog-content export-dialog">
              <div class="dialog-kicker">/LIVE SESSION ARTIFACT</div>
              <Dialog.Title>Export</Dialog.Title>
              <Dialog.Description>Preview exactly what Copy and Download will produce from the current store.</Dialog.Description>
              <Tabs.Root value={exportTab()} onChange={(value) => { setExportTab(value); if (value === "png") refreshPngPreview(); }} class="export-tabs">
                <Tabs.List class="tab-list">
                  <Tabs.Trigger value="session-json"><IconFileCode size={17} /> Session JSON</Tabs.Trigger>
                  <Tabs.Trigger value="png"><IconFileTypePng size={17} /> PNG</Tabs.Trigger>
                  <Tabs.Indicator />
                </Tabs.List>
                <Tabs.Content value="session-json" class="export-content">
                  <pre aria-label="Session JSON preview">{state.exportPreviewText}</pre>
                </Tabs.Content>
                <Tabs.Content value="png" class="export-content png-content">
                  <Show when={pngPreviewUrl()} fallback={<div class="rendering">Rendering branded PNG…</div>}>
                    <img src={pngPreviewUrl()} alt="Branded PNG preview of the current SHAPESHIFT grid" />
                  </Show>
                </Tabs.Content>
              </Tabs.Root>
              <div class="export-footer">
                <p>Live preview · regenerated from shared canvas and gallery state.</p>
                <div class="dialog-actions">
                  <button class="outline-button" type="button" onClick={copyExport}><IconCopy size={17} /> Copy {exportTab() === "png" ? "PNG" : "JSON"}</button>
                  <button class="primary-button" type="button" onClick={() => downloadExport()}><IconDownload size={17} /> Download</button>
                </div>
                <Show when={copyStatus()}><div class="copy-status" role="status">{copyStatus()}</div></Show>
              </div>
              <Dialog.CloseButton class="icon-close" aria-label="Close Export dialog"><IconX size={19} /></Dialog.CloseButton>
            </Dialog.Content>
          </div>
        </Dialog.Portal>
      </Dialog.Root>
    );
  }

  function CameraDialog() {
    return (
      <Dialog.Root open={cameraOpen()} onOpenChange={(open) => {
        setCameraOpen(open);
        if (open) setTimeout(startCamera, 0); else stopCamera();
      }}>
        <Dialog.Trigger class="tool-button media-button"><span>Camera</span><IconCamera size={18} /></Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay class="dialog-overlay" />
          <div class="dialog-positioner">
            <Dialog.Content class="dialog-content camera-dialog">
              <div class="dialog-kicker">/FRONT CAMERA</div>
              <Dialog.Title>Capture image</Dialog.Title>
              <Dialog.Description>The center square will be pixelized into the seven-color palette.</Dialog.Description>
              <div class="camera-frame"><video ref={videoRef} playsinline muted /></div>
              <Show when={cameraError()}><div class="form-alert" role="alert">{cameraError()}</div></Show>
              <div class="dialog-actions">
                <Dialog.CloseButton class="text-button">Cancel</Dialog.CloseButton>
                <button class="primary-button" type="button" onClick={captureCamera}><IconCamera size={17} /> Capture</button>
              </div>
              <Dialog.CloseButton class="icon-close" aria-label="Close Camera dialog"><IconX size={19} /></Dialog.CloseButton>
            </Dialog.Content>
          </div>
        </Dialog.Portal>
      </Dialog.Root>
    );
  }

  function RenameDialog(props) {
    const [open, setOpen] = createSignal(false);
    const [attempted, setAttempted] = createSignal(false);
    const [formError, setFormError] = createSignal("");
    const form = createForm(() => ({
      defaultValues: { name: props.board.name, tag: props.board.tag, favorite: props.board.favorite, cells: cloneCells(props.board.cells) },
      onSubmit: async ({ value }) => {
        setAttempted(true);
        const result = renameBoard(props.board.name, value);
        if (!result.ok) { setFormError(result.error); return; }
        setOpen(false);
        setAttempted(false);
        setFormError("");
      },
    }));
    const values = form.useSelector((formState) => formState.values);
    const nameIssue = () => boardNameError(values().name, state.boards, props.board.name);
    const tagIssue = () => boardTagError(values().tag);
    return (
      <Dialog.Root open={open()} onOpenChange={setOpen}>
        <Dialog.Trigger class="card-icon-button" aria-label={`Rename ${props.board.name}`}><IconPencil size={16} /></Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay class="dialog-overlay" />
          <div class="dialog-positioner">
            <Dialog.Content class="dialog-content compact-dialog">
              <div class="dialog-kicker">/UPDATE BOARD RECORD</div>
              <Dialog.Title>Rename board</Dialog.Title>
              <Dialog.Description>The same record is updated; its cell snapshot and favorite state stay intact.</Dialog.Description>
              <form onSubmit={(event) => { event.preventDefault(); setAttempted(true); form.handleSubmit(); }} novalidate>
                <form.Field name="name">
                  {(field) => <label class="form-field"><span>Name <em>required · max 40</em></span><input value={field().state.value} onInput={(event) => field().handleChange(event.currentTarget.value)} onBlur={field().handleBlur} />
                    <Show when={(attempted() || field().state.meta.isTouched) && nameIssue()}><small class="field-error" role="alert">{nameIssue()}</small></Show></label>}
                </form.Field>
                <form.Field name="tag">
                  {(field) => <label class="form-field"><span>Tag <em>required · max 24</em></span><input value={field().state.value} onInput={(event) => field().handleChange(event.currentTarget.value)} onBlur={field().handleBlur} />
                    <Show when={(attempted() || field().state.meta.isTouched) && tagIssue()}><small class="field-error" role="alert">{tagIssue()}</small></Show></label>}
                </form.Field>
                <Show when={formError()}><div class="form-alert" role="alert">{formError()}</div></Show>
                <div class="dialog-actions"><Dialog.CloseButton class="text-button">Cancel</Dialog.CloseButton><button class="primary-button" type="submit" disabled={Boolean(nameIssue() || tagIssue())}>Update board</button></div>
              </form>
              <Dialog.CloseButton class="icon-close" aria-label="Close Rename dialog"><IconX size={19} /></Dialog.CloseButton>
            </Dialog.Content>
          </div>
        </Dialog.Portal>
      </Dialog.Root>
    );
  }

  function ToolPanel() {
    return (
      <aside ref={toolbarRef} class="tool-panel" style={{ left: `${toolbarPosition().x}px`, top: `${toolbarPosition().y}px` }} aria-label="SHAPESHIFT tools">
        <div class="tool-panel-header" onPointerDown={handleToolbarDragStart}>
          <span>/SHAPESHIFT TOOLS</span><IconGripHorizontal size={22} aria-hidden="true" />
        </div>
        <div class="tool-panel-body">
          <div class="mode-switch" role="group" aria-label="Workspace mode">
            <button type="button" class={state.activeMode === "paint" ? "is-active" : ""} aria-pressed={state.activeMode === "paint"} onClick={() => setState("activeMode", "paint")}>Paint</button>
            <button type="button" class={state.activeMode === "gallery" ? "is-active" : ""} aria-pressed={state.activeMode === "gallery"} onClick={() => setState("activeMode", "gallery")}>Gallery <span>{state.boards.length}</span></button>
          </div>

          <div class={`slider-wrap ${state.sliderLocked ? "is-locked" : ""}`}>
            <div class="control-label"><span>Cell size</span><b>{state.cellSize}px</b></div>
            <Slider.Root
              value={[state.cellSize]}
              onChange={(value) => resizeGrid(value[0])}
              minValue={16}
              maxValue={64}
              step={1}
              disabled={state.sliderLocked}
              class="cell-slider"
              aria-label="Cell size"
            >
              <Slider.Track><Slider.Fill /><Slider.Thumb aria-label="Cell size"><Slider.Input /></Slider.Thumb></Slider.Track>
            </Slider.Root>
            <span class="lock-note">{state.sliderLocked ? "Locked after paint · Clear to resize" : `${dimensions().cols} × ${dimensions().rows} cells`}</span>
          </div>

          <div class="control-label"><span>Brush</span><span class="shortcut-note">Q · B · E</span></div>
          <div class="brush-group" role="group" aria-label="Brush mode">
            <button type="button" class={state.brushMode === "qr" ? "is-active" : ""} aria-pressed={state.brushMode === "qr"} onClick={() => setBrush("qr")}><IconQrcode size={16} /> QR Brush</button>
            <button type="button" class={state.brushMode === "color" ? "is-active" : ""} aria-pressed={state.brushMode === "color"} onClick={() => setBrush("color")}><IconBrush size={16} /> Color Brush</button>
            <button type="button" class={state.brushMode === "erase" ? "is-active" : ""} aria-pressed={state.brushMode === "erase"} onClick={() => setBrush("erase")}><IconEraser size={16} /> Eraser</button>
          </div>

          <div class="control-label"><span>Mirror</span><span>same stroke</span></div>
          <div class="mirror-group" role="group" aria-label="Mirror mode">
            <button type="button" class={state.mirrorMode === "off" ? "is-active" : ""} aria-pressed={state.mirrorMode === "off"} aria-label="Mirror Off" onClick={() => setMirror("off")}>Off</button>
            <button type="button" class={state.mirrorMode === "horizontal" ? "is-active" : ""} aria-pressed={state.mirrorMode === "horizontal"} aria-label="Horizontal mirror" onClick={() => setMirror("horizontal")}>Horizontal</button>
            <button type="button" class={state.mirrorMode === "vertical" ? "is-active" : ""} aria-pressed={state.mirrorMode === "vertical"} aria-label="Vertical mirror" onClick={() => setMirror("vertical")}>Vertical</button>
          </div>

          <div class="palette-row" aria-label="Color palette">
            <div class="swatch-row" role="group" aria-label="Palette color">
              <For each={COLORS}>{(color, index) => (
                <button
                  type="button"
                  class={`swatch ${state.paletteColor === color ? "is-active" : ""}`}
                  style={{ "--swatch": COLOR_HEX[color] }}
                  aria-label={`${color} palette color, shortcut ${index() + 1}`}
                  aria-pressed={state.paletteColor === color}
                  title={`${color} (${index() + 1})`}
                  onClick={() => setPalette(color)}
                ><span class="sr-only">{color}</span></button>
              )}</For>
            </div>
          </div>

          <div class="toggle-row">
            <ToggleButton.Root class="tool-button" pressed={state.gridOverlay} onChange={(pressed) => setState("gridOverlay", pressed)} aria-label={state.gridOverlay ? "Turn grid overlay off" : "Turn grid overlay on"}>
              {state.gridOverlay ? "Grid On" : "Grid Off"}
            </ToggleButton.Root>
            <button class="tool-button" onClick={undo} disabled={!state.history.length}><IconArrowBackUp size={16} /> Undo</button>
            <button class="tool-button" onClick={clearBoard}>Clear</button>
          </div>

          <StatReadout />

          <div class="media-row">
            <label class="tool-button media-button">
              <span>Upload</span><IconPhotoUp size={18} />
              <input ref={uploadInputRef} type="file" accept="image/*" onChange={(event) => handleUpload(event.currentTarget.files?.[0])} />
            </label>
            <CameraDialog />
          </div>

          <div class="transfer-row"><SaveBoardDialog /><ImportDialog /></div>
          <div class="primary-actions"><ExportDialog /><button class="action-button share-button" onClick={sharePng}><span>Share PNG</span><IconShare size={17} /></button></div>
          <Show when={sessionNotice()}><div class="session-notice" role="status">{sessionNotice()}</div></Show>
        </div>
      </aside>
    );
  }

  function CellView(props) {
    const selected = () => state.selectedCell?.row === props.cell.row && state.selectedCell?.col === props.cell.col;
    return (
      <div
        class={`grid-cell kind-${props.cell.kind} ${selected() ? "is-selected" : ""}`}
        data-cell-index={props.index}
        style={props.cell.kind === "color"
          ? { "background-color": COLOR_HEX[props.cell.color] }
          : props.cell.kind === "qr"
            ? { "background-image": `url(${qrDataUrl(props.cell.color)})` }
            : {}}
        role="gridcell"
        aria-label={`Row ${props.cell.row + 1}, column ${props.cell.col + 1}: ${props.cell.kind}${props.cell.color ? ` ${props.cell.color}` : ""}`}
      />
    );
  }

  function PaintCanvas() {
    return (
      <section class="canvas-column" aria-label="Paint stage">
        <div class="canvas-meta"><span>/ACTIVE GRID</span><span>{dimensions().cols} × {dimensions().rows} · {state.cellSize}px source cells</span></div>
        <div
          ref={canvasRef}
          class={`paint-canvas ${state.gridOverlay ? "grid-on" : "grid-off"}`}
          style={{ "grid-template-columns": `repeat(${dimensions().cols}, 1fr)` }}
          role="grid"
          aria-label="SHAPESHIFT paint grid. Drag across cells to paint."
          onPointerDown={handleCanvasPointerDown}
          onPointerMove={handleCanvasPointerMove}
          onPointerUp={finishStroke}
          onPointerCancel={finishStroke}
          onLostPointerCapture={finishStroke}
          onContextMenu={(event) => event.preventDefault()}
        >
          <For each={state.cells}>{(cell, index) => <CellView cell={cell} index={index()} />}</For>
        </div>
        <div class="canvas-caption"><span>BRUSH / {state.brushMode.toUpperCase()}</span><span>COLOR / {state.paletteColor.toUpperCase()}</span><span>MIRROR / {state.mirrorMode.toUpperCase()}</span></div>
      </section>
    );
  }

  function drawThumbnail(canvas, cells) {
    if (!canvas) return;
    const context = canvas.getContext("2d");
    const { rows, cols } = inferDimensions(cells);
    const width = canvas.width;
    const height = canvas.height;
    const cellWidth = width / cols;
    const cellHeight = height / rows;
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    for (const cell of cells) {
      if (cell.kind === "blank") continue;
      if (cell.kind === "color") {
        context.fillStyle = COLOR_HEX[cell.color];
        context.fillRect(cell.col * cellWidth, cell.row * cellHeight, cellWidth + 0.4, cellHeight + 0.4);
      } else {
        context.drawImage(makeQrCanvas(cell.color, 64), cell.col * cellWidth, cell.row * cellHeight, cellWidth + 0.4, cellHeight + 0.4);
      }
    }
  }

  function BoardCard(props) {
    let thumb;
    createEffect(() => drawThumbnail(thumb, props.board.cells));
    const stats = createMemo(() => calculateStats(props.board.cells));
    return (
      <article class={`board-card ${deletingBoard() === props.board.name ? "is-deleting" : ""} ${state.selectedBoard === props.board.name ? "is-current" : ""}`}>
        <button class="thumb-button" onClick={() => loadBoard(props.board.name)} aria-label={`Load ${props.board.name}`}>
          <canvas ref={thumb} width="320" height="180" aria-hidden="true" />
          <span class="load-overlay"><IconPlayerPlay size={18} /> Load board</span>
        </button>
        <div class="board-card-body">
          <div class="board-card-heading">
            <div><span class="tag-chip">{props.board.tag}</span><h3>{props.board.name}</h3></div>
            <button class={`favorite-button ${props.board.favorite ? "is-favorite" : ""}`} onClick={() => toggleFavorite(props.board.name)} aria-label={`${props.board.favorite ? "Remove" : "Add"} ${props.board.name} ${props.board.favorite ? "from" : "to"} favorites`} aria-pressed={props.board.favorite}>
              <Show when={props.board.favorite} fallback={<IconStar size={18} />}><IconStarFilled size={18} /></Show>
            </button>
          </div>
          <div class="board-stats"><span>{stats().painted} painted</span><span>{stats().qr} qr</span><span>{stats().colorFilled} color</span></div>
          <div class="card-actions">
            <button class="load-button" onClick={() => loadBoard(props.board.name)}>Load</button>
            <RenameDialog board={props.board} />
            <button class="card-icon-button danger" onClick={() => removeBoard(props.board.name)} aria-label={`Delete ${props.board.name}`}><IconTrash size={16} /></button>
          </div>
        </div>
      </article>
    );
  }

  function Gallery() {
    const filterOptions = createMemo(() => {
      const tags = uniqueTags();
      return ["All tags", ...tags, ...(state.tagFilter && !tags.includes(state.tagFilter) ? [state.tagFilter] : [])];
    });
    return (
      <section class="gallery-column" aria-label="Saved boards gallery">
        <div class="gallery-header">
          <div><span>/SAVED BOARD COLLECTION</span><h2>{state.boards.length} board{state.boards.length === 1 ? "" : "s"}</h2></div>
          <Select.Root
            options={filterOptions()}
            value={state.tagFilter || "All tags"}
            onChange={(value) => setState("tagFilter", value === "All tags" ? "" : value)}
            itemComponent={(props) => (
              <Select.Item item={props.item} class="select-item">
                <Select.ItemLabel>{props.item.rawValue}</Select.ItemLabel>
                <Select.ItemIndicator><IconCheck size={15} /></Select.ItemIndicator>
              </Select.Item>
            )}
          >
            <Select.Trigger class="select-trigger" aria-label="Filter boards by tag">
              <Select.Value>{(selectState) => selectState.selectedOption()}</Select.Value>
              <Select.Icon><IconChevronDown size={16} /></Select.Icon>
            </Select.Trigger>
            <Select.Portal><Select.Content class="select-content"><Select.Listbox /></Select.Content></Select.Portal>
          </Select.Root>
        </div>
        <Show when={filteredBoards().length} fallback={
          <div class="empty-gallery">
            <div class="empty-mark">&lt;/&gt;</div>
            <h3>{state.boards.length ? "No boards match this tag" : "The gallery is empty"}</h3>
            <p>{state.boards.length ? "Clear the tag filter to restore the full collection." : "Switch to Paint, make a grid, then use Save board to add it here."}</p>
            <Show when={state.tagFilter}><button class="primary-button" onClick={() => setState("tagFilter", "")}>Clear filter</button></Show>
          </div>
        }>
          <div class="board-grid"><For each={filteredBoards()}>{(board) => <BoardCard board={board} />}</For></div>
        </Show>
      </section>
    );
  }

  return (
    <main class="app-shell">
      <div class="wash wash-one" aria-hidden="true" />
      <div class="wash wash-two" aria-hidden="true" />
      <header class="site-header">
        <h1>&lt;SHAPESHIFT GRID<br />TOOL&gt;</h1>
        <div class="intro-copy">
          <p class="type-line">Browser-based open canvas. Everything you touch becomes structured festival data.</p>
          <p><strong>Capture. Draw. Download. Share.</strong></p>
          <div class="key-hint">Q/B/E tools · G grid · Backspace undo · 1–7 color</div>
        </div>
      </header>
      <div class="stage-wrap">
        <ToolPanel />
        <Show when={state.activeMode === "paint"} fallback={<Gallery />}><PaintCanvas /></Show>
      </div>
      <footer class="site-footer"><span>/MADE WITH SHAPESHIFT GRID TOOL</span><span>&lt;SHAPESHIFTFESTIVAL.COM&gt;</span></footer>
    </main>
  );
}
