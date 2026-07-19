import { createSignal, onMount, onCleanup, Show, For, createMemo, createEffect } from 'solid-js';
import { useAppStore, ToolType, Annotation, TextStyle, StrokeWidth } from './store';
import { drawAnnotation, applyBlurEffect, applyPixelateEffect, applySpotlightEffect } from './canvas';
import { registerWebMcp } from './webmcp';

const COLOR_SWATCHES = [
  '#FF0000', '#FF6600', '#FFCC00', '#00CC00', '#0066FF', '#9900CC',
  '#FF0066', '#00CCCC', '#FFFFFF', '#000000', '#666666', '#CC6600'
];

const TEXT_STYLES: { value: TextStyle; label: string }[] = [
  { value: 'plain', label: 'Plain' },
  { value: 'bold-caption', label: 'Bold caption' },
  { value: 'outline', label: 'Outline' },
  { value: 'highlight-box', label: 'Highlight box' },
  { value: 'shadow', label: 'Shadow' },
];

function ToolButton(props: { 
  tool: ToolType; 
  label: string; 
  icon: string; 
  activeTool: ToolType; 
  onClick: () => void;
}) {
  const isActive = () => props.activeTool === props.tool;
  return (
    <button
      class={`tool-button flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-lg 
        transition-all duration-150 min-w-[56px] min-h-[56px] text-xs font-medium
        focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]
        ${isActive() 
          ? 'bg-[var(--color-accent)] text-white shadow-lg' 
          : 'bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)]'
        }`}
      onClick={props.onClick}
      title={props.label}
      aria-label={props.label}
      aria-pressed={isActive()}
    >
      <span class="text-lg leading-none" aria-hidden="true">{isActive() ? '✓ ' : ''}{props.icon}</span>
      <span class="text-[10px] leading-tight">{props.label}</span>
    </button>
  );
}

function ColorSwatch(props: { color: string; active: boolean; onClick: () => void }) {
  return (
    <button
      class={`color-swatch w-12 h-12 rounded-md border-2 transition-all duration-150
        focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]
        ${props.active ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:border-[var(--color-border)]'}`}
      style={{ 'background-color': props.color }}
      onClick={props.onClick}
      aria-label={`Select color ${props.color}`}
      aria-pressed={props.active}
    >
      <span class="text-white font-bold" aria-hidden="true">{props.active ? '✓' : ''}</span>
    </button>
  );
}

function LayerRow(props: {
  annotation: Annotation;
  index: number;
  count: number;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onDragStart: (e: DragEvent, index: number) => void;
  onDragOver: (e: DragEvent, index: number) => void;
  onDrop: (e: DragEvent, index: number) => void;
  onDragEnd: (e: DragEvent) => void;
  onMove: (direction: -1 | 1) => void;
  isDragOver: boolean;
  isDragging: boolean;
}) {
  const typeLabel = () => {
    const labels: Record<string, string> = {
      rectangle: 'Rectangle',
      oval: 'Oval',
      line: 'Line',
      arrow: 'Arrow',
      text: 'Text',
      blur: 'Blur',
      pixelate: 'Pixelate',
      spotlight: 'Spotlight',
      loupe: 'Loupe',
      highlighter: 'Highlighter',
    };
    return labels[props.annotation.type] || props.annotation.type;
  };

  return (
    <div
      class={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all duration-150
        border group
        ${props.isSelected 
          ? 'bg-[var(--color-accent)]/20 border-[var(--color-accent)]' 
          : 'bg-transparent border-transparent hover:bg-[var(--color-surface)]'
        }
        ${props.isDragOver ? '!border-t-2 !border-t-[var(--color-accent)]' : ''}
        ${props.isDragging ? 'opacity-50 shadow-xl scale-[1.02]' : ''}`}
      draggable={true}
      onDragStart={(e) => props.onDragStart(e, props.index)}
      onDragOver={(e) => { e.preventDefault(); props.onDragOver(e, props.index); }}
      onDrop={(e) => props.onDrop(e, props.index)}
      onDragEnd={(e) => props.onDragEnd(e)}
      onClick={props.onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          props.onSelect();
        }
      }}
      tabIndex={0}
      role="listitem"
      aria-label={`Layer ${props.index + 1}: ${typeLabel()}`}
    >
      <div class="w-3 h-3 rounded-sm flex-shrink-0" style={{ 'background-color': props.annotation.color }} />
      <span class="layer-number text-xs text-[var(--color-text-secondary)] tabular-nums">#{props.index + 1}</span>
      <span class="flex-1 text-sm text-[var(--color-text-primary)] truncate select-none">
        {typeLabel()}
        {props.annotation.type === 'text' && props.annotation.text ? `: "${props.annotation.text.slice(0, 15)}"` : ''}
      </span>
      <button
        class="layer-action text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
        onClick={(e) => { e.stopPropagation(); props.onMove(-1); }}
        disabled={props.index === 0}
        aria-label={`Move ${typeLabel()} up`}
        title="Move up"
      >
        ↑
      </button>
      <button
        class="layer-action text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
        onClick={(e) => { e.stopPropagation(); props.onMove(1); }}
        disabled={props.index === props.count - 1}
        aria-label={`Move ${typeLabel()} down`}
        title="Move down"
      >
        ↓
      </button>
      <button
        class="layer-action opacity-70 group-hover:opacity-100 px-2 py-1 text-xs text-red-300 
          hover:text-red-200 rounded transition-all duration-150
          focus:outline-none focus:opacity-100 focus:ring-1 focus:ring-red-400"
        onClick={(e) => { e.stopPropagation(); props.onDelete(); }}
        aria-label={`Delete ${typeLabel()}`}
      >
        ✕
      </button>
    </div>
  );
}

export default function App() {
  const store = useAppStore();
  const { state, setState } = store;
  
  let canvasRef: HTMLCanvasElement | undefined;
  let overlayCanvasRef: HTMLCanvasElement | undefined;
  let fileInputRef: HTMLInputElement | undefined;
  let textInputRef: HTMLInputElement | undefined;

  const savedCollaboration = (() => {
    try {
      return JSON.parse(localStorage.getItem('markupflow-collaboration') ?? '{}') as {
        local?: string;
        remote?: string;
        merged?: string;
      };
    } catch {
      return {};
    }
  })();
  
  const [isDragging, setIsDragging] = createSignal(false);
  const [dragStart, setDragStart] = createSignal<{x: number, y: number} | null>(null);
  const [dragCurrent, setDragCurrent] = createSignal<{x: number, y: number} | null>(null);
  const [isCanvasDragOver, setIsCanvasDragOver] = createSignal(false);
  const [showTextInput, setShowTextInput] = createSignal(false);
  const [textInputPos, setTextInputPos] = createSignal<{x: number, y: number} | null>(null);
  const [textInputValue, setTextInputValue] = createSignal('');
  const [editingTextId, setEditingTextId] = createSignal<string | null>(null);
  const [statusMessage, setStatusMessage] = createSignal('Ready');
  const [viewMode, setViewMode] = createSignal<'edit' | 'preview'>('edit');
  const [projectName, setProjectName] = createSignal('');
  const [theme, setTheme] = createSignal<'dark' | 'light'>('dark');
  
  // Layer drag state
  const [dragLayerIndex, setDragLayerIndex] = createSignal<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = createSignal<number | null>(null);
  
  // Collaboration input
  const [sharedContent, setSharedContent] = createSignal(savedCollaboration.local ?? '');
  const [remoteContent, setRemoteContent] = createSignal(savedCollaboration.remote ?? '');
  const [sharedContentMerged, setSharedContentMerged] = createSignal(savedCollaboration.merged ?? '');
  const [mergeConflict, setMergeConflict] = createSignal<{ local: string; remote: string } | null>(null);
  
  // Loaded image reference for loupe tool
  const [loadedImage, setLoadedImage] = createSignal<HTMLImageElement | null>(null);
  
  const canvasWidth = createMemo(() => {
    if (!state.imageWidth) return 800;
    return Math.min(1200, state.imageWidth);
  });
  
  const canvasHeight = createMemo(() => {
    if (!state.imageWidth || !state.imageHeight) return 500;
    const ratio = state.imageHeight / state.imageWidth;
    return Math.round(canvasWidth() * ratio);
  });

  const canUndo = createMemo(() => state.undoStack.length > 0);
  const canRedo = createMemo(() => state.redoStack.length > 0);

  const announce = (message: string) => setStatusMessage(message);

  const combineChanges = (local: string, remote: string) => {
    const parts = [local.trim(), remote.trim()].filter(Boolean);
    return [...new Set(parts)].join(' | ');
  };

  const activateTool = (tool: ToolType) => {
    if (showTextInput() && !textInputValue().trim()) {
      const id = editingTextId();
      if (id) store.deleteAnnotation(id);
      announce('Empty text annotation discarded');
    }
    setShowTextInput(false);
    setEditingTextId(null);
    store.setActiveTool(tool);
  };

  const updateSelectedAnnotation = (updates: Partial<Annotation>) => {
    const selected = state.annotations.find(annotation => annotation.id === state.selectedAnnotationId);
    if (selected) {
      store.updateAnnotation(selected.id, updates);
      announce(`${selected.type} updated`);
      setTimeout(() => renderFullCanvas(), 20);
    }
  };

  const setActiveTextStyle = (style: TextStyle) => {
    store.setActiveTextStyle(style);
    const selected = state.annotations.find(annotation => annotation.id === state.selectedAnnotationId);
    if (selected?.type === 'text') updateSelectedAnnotation({ textStyle: style });
  };

  // Full canvas render: redraw image + all destructive effects + overlay annotations
  const renderFullCanvas = () => {
    if (!canvasRef || !state.imageDataUrl) return;
    
    const canvas = canvasRef;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = canvasWidth();
    canvas.height = canvasHeight();
    
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Apply destructive effects in order
      const scaleX = canvas.width / state.imageWidth;
      const scaleY = canvas.height / state.imageHeight;
      
      state.annotations.forEach(ann => {
        if (ann.type === 'blur') {
          const bx = (ann.x ?? 0) * scaleX;
          const by = (ann.y ?? 0) * scaleY;
          const bw = ((ann.x2 ?? ann.x ?? 0) - (ann.x ?? 0)) * scaleX;
          const bh = ((ann.y2 ?? ann.y ?? 0) - (ann.y ?? 0)) * scaleY;
          applyBlurEffect(ctx, bx, by, bw, bh, canvas.width, canvas.height);
        } else if (ann.type === 'pixelate') {
          const px = (ann.x ?? 0) * scaleX;
          const py = (ann.y ?? 0) * scaleY;
          const pw = ((ann.x2 ?? ann.x ?? 0) - (ann.x ?? 0)) * scaleX;
          const ph = ((ann.y2 ?? ann.y ?? 0) - (ann.y ?? 0)) * scaleY;
          applyPixelateEffect(ctx, px, py, pw, ph, canvas.width, canvas.height, ann.pixelSize ?? 8);
        } else if (ann.type === 'spotlight') {
          const ecx = ((ann.x ?? 0) + (ann.x2 ?? ann.x ?? 0)) / 2 * scaleX;
          const ecy = ((ann.y ?? 0) + (ann.y2 ?? ann.y ?? 0)) / 2 * scaleY;
          const rx = Math.abs((ann.x2 ?? ann.x ?? 0) - (ann.x ?? 0)) / 2 * scaleX;
          const ry = Math.abs((ann.y2 ?? ann.y ?? 0) - (ann.y ?? 0)) / 2 * scaleY;
          applySpotlightEffect(ctx, ecx, ecy, rx, ry, canvas.width, canvas.height);
        }
      });
      
      // Now render overlay annotations
      renderOverlayAnnotations();
    };
    img.src = state.imageDataUrl;
  };

  const renderOverlayAnnotations = () => {
    if (!overlayCanvasRef || !state.imageDataUrl) return;
    
    const canvas = overlayCanvasRef;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = canvasWidth();
    canvas.height = canvasHeight();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw annotations (skip blur/pixelate/spotlight as they modify the base image)
    // Render in reverse order so topmost layer panel entry is frontmost
    const overlayAnns = state.annotations.filter(ann => !['blur', 'pixelate', 'spotlight'].includes(ann.type));
    for (let i = overlayAnns.length - 1; i >= 0; i--) {
      const ann = overlayAnns[i];
      drawAnnotation(ctx, ann, ann.id === state.selectedAnnotationId, 
        state.imageWidth, state.imageHeight, canvas.width, canvas.height, loadedImage());
    }
    
    // Draw current drag preview
    const ds = dragStart();
    const dc = dragCurrent();
    if (isDragging() && ds && dc) {
      ctx.strokeStyle = state.activeColor;
      ctx.fillStyle = state.activeColor;
      const sw = state.activeStrokeWidth === 'thin' ? 1.5 : state.activeStrokeWidth === 'thick' ? 5 : 3;
      ctx.lineWidth = sw;
      ctx.lineCap = 'round';
      ctx.setLineDash([4, 4]);
      
      const px = ds.x;
      const py = ds.y;
      const cx = dc.x;
      const cy = dc.y;
      
      switch (state.activeTool) {
        case 'rectangle':
          ctx.strokeRect(px, py, cx - px, cy - py);
          break;
        case 'oval': {
          const ecx = (px + cx) / 2;
          const ecy = (py + cy) / 2;
          const erx = Math.abs(cx - px) / 2;
          const ery = Math.abs(cy - py) / 2;
          ctx.beginPath();
          ctx.ellipse(ecx, ecy, erx, ery, 0, 0, Math.PI * 2);
          ctx.stroke();
          break;
        }
        case 'line':
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(cx, cy);
          ctx.stroke();
          break;
        case 'arrow':
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(cx, cy);
          ctx.stroke();
          break;
        case 'highlighter':
          ctx.fillStyle = state.activeColor + '66';
          ctx.fillRect(px, py, cx - px, cy - py);
          break;
      }
      ctx.setLineDash([]);
    }
  };

  // Image loading
  const loadImage = (file: File) => {
    if (!file || !file.type.startsWith('image/')) {
      announce('Select a valid image file');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        store.setImage(dataUrl, img.width, img.height);
        setLoadedImage(img);
        setTimeout(renderFullCanvas, 100);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const loadSampleImage = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 500;
    const ctx = canvas.getContext('2d')!;
    
    // Draw a sample scene
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 300);
    skyGrad.addColorStop(0, '#87CEEB');
    skyGrad.addColorStop(1, '#E0F0FF');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, 800, 300);
    
    const groundGrad = ctx.createLinearGradient(0, 300, 0, 500);
    groundGrad.addColorStop(0, '#90EE90');
    groundGrad.addColorStop(1, '#228B22');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, 300, 800, 200);
    
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(650, 80, 50, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#FFFFFF';
    const drawCloud = (x: number, y: number) => {
      ctx.beginPath();
      ctx.arc(x, y, 30, 0, Math.PI * 2);
      ctx.arc(x + 25, y - 15, 25, 0, Math.PI * 2);
      ctx.arc(x + 50, y, 30, 0, Math.PI * 2);
      ctx.fill();
    };
    drawCloud(150, 80);
    drawCloud(400, 60);
    
    ctx.fillStyle = '#6B8E6B';
    ctx.beginPath();
    ctx.moveTo(0, 300);
    ctx.lineTo(150, 180);
    ctx.lineTo(300, 300);
    ctx.fill();
    
    ctx.fillStyle = '#5A7D5A';
    ctx.beginPath();
    ctx.moveTo(200, 300);
    ctx.lineTo(350, 150);
    ctx.lineTo(500, 300);
    ctx.fill();
    
    ctx.fillStyle = '#2D5F2D';
    const drawTree = (x: number, baseY: number) => {
      ctx.fillRect(x - 5, baseY - 40, 10, 40);
      ctx.beginPath();
      ctx.arc(x, baseY - 55, 25, 0, Math.PI * 2);
      ctx.fill();
    };
    drawTree(100, 320);
    drawTree(550, 310);
    drawTree(700, 330);
    
    ctx.fillStyle = '#DEB887';
    ctx.fillRect(300, 260, 100, 70);
    ctx.fillStyle = '#8B4513';
    ctx.beginPath();
    ctx.moveTo(290, 260);
    ctx.lineTo(350, 220);
    ctx.lineTo(410, 260);
    ctx.fill();
    
    ctx.fillStyle = '#654321';
    ctx.fillRect(340, 290, 20, 40);
    
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(310, 275, 20, 20);
    ctx.fillRect(370, 275, 20, 20);
    
    ctx.fillStyle = '#D2B48C';
    ctx.beginPath();
    ctx.moveTo(340, 330);
    ctx.lineTo(310, 400);
    ctx.lineTo(390, 400);
    ctx.lineTo(360, 330);
    ctx.fill();
    
    ctx.fillStyle = '#333';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('Sample Scene — Try annotating!', 250, 470);
    
    const dataUrl = canvas.toDataURL('image/png');
    const img2 = new Image();
    img2.onload = () => { setLoadedImage(img2); setTimeout(renderFullCanvas, 100); };
    img2.src = dataUrl;
    store.setImage(dataUrl, 800, 500);
  };

  // Canvas mouse handlers
  const getCanvasCoords = (e: MouseEvent) => {
    if (!overlayCanvasRef) return { x: 0, y: 0 };
    const rect = overlayCanvasRef.getBoundingClientRect();
    const scaleX = overlayCanvasRef.width / rect.width;
    const scaleY = overlayCanvasRef.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleCanvasMouseDown = (e: MouseEvent) => {
    if (!state.imageDataUrl) return;
    e.preventDefault();
    
    if (state.activeTool === 'text') {
      const coords = getCanvasCoords(e);
      const scaleX = state.imageWidth / canvasWidth();
      const scaleY = state.imageHeight / canvasHeight();
      const id = store.generateId();
      store.addAnnotation({
        id,
        type: 'text',
        x: coords.x / scaleX,
        y: coords.y / scaleY,
        color: state.activeColor,
        strokeWidth: state.activeStrokeWidth,
        text: 'Type here',
        textStyle: state.activeTextStyle,
        fontSize: state.activeFontSize,
      });
      store.setSelectedAnnotation(id);
      setEditingTextId(id);
      setTextInputPos(coords);
      setShowTextInput(true);
      setTextInputValue('');
      announce('Text annotation added; type to edit');
      setTimeout(() => renderFullCanvas(), 20);
      setTimeout(() => textInputRef?.focus(), 50);
      return;
    }
    
    if (state.activeTool === 'loupe') {
      const coords = getCanvasCoords(e);
      const scaleX = state.imageWidth / canvasWidth();
      const scaleY = state.imageHeight / canvasHeight();
      const ann: Annotation = {
        id: store.generateId(),
        type: 'loupe',
        x: coords.x / scaleX,
        y: coords.y / scaleY,
        x2: coords.x / scaleX,
        y2: coords.y / scaleY,
        color: state.activeColor,
        strokeWidth: state.activeStrokeWidth,
        loupeZoom: 2,
      };
      store.addAnnotation(ann);
      setTimeout(() => renderFullCanvas(), 20);
      return;
    }
    
    const coords = getCanvasCoords(e);
    setDragStart(coords);
    setDragCurrent(coords);
    setIsDragging(true);
  };

  const handleCanvasMouseMove = (e: MouseEvent) => {
    if (!isDragging()) return;
    const coords = getCanvasCoords(e);
    setDragCurrent(coords);
    renderOverlayAnnotations();
  };

  const handleCanvasMouseUp = (e: MouseEvent) => {
    if (!isDragging()) return;
    setIsDragging(false);
    
    const ds = dragStart();
    const dc = dragCurrent();
    if (!ds || !dc) return;
    
    const minSize = 5;
    if (Math.abs(dc.x - ds.x) < minSize && Math.abs(dc.y - ds.y) < minSize) {
      setDragStart(null);
      setDragCurrent(null);
      renderOverlayAnnotations();
      announce('Drag farther to add an annotation');
      return;
    }
    
    const scaleX = state.imageWidth / canvasWidth();
    const scaleY = state.imageHeight / canvasHeight();
    
    const x1 = Math.min(ds.x, dc.x);
    const y1 = Math.min(ds.y, dc.y);
    const x2 = Math.max(ds.x, dc.x);
    const y2 = Math.max(ds.y, dc.y);
    
    const ann: Annotation = {
      id: store.generateId(),
      type: state.activeTool,
      x: x1 / scaleX,
      y: y1 / scaleY,
      x2: x2 / scaleX,
      y2: y2 / scaleY,
      color: state.activeColor,
      strokeWidth: state.activeStrokeWidth,
      highlightColor: state.activeColor,
      pixelSize: 8,
      blurRadius: 8,
    };
    
    store.addAnnotation(ann);
    announce(`${state.activeTool} annotation added`);
    setDragStart(null);
    setDragCurrent(null);
    setTimeout(() => renderFullCanvas(), 20);
  };

  // Text tool
  const handleTextSubmit = () => {
    const text = textInputValue().trim();
    const id = editingTextId();
    if (!id) {
      setShowTextInput(false);
      return;
    }
    if (!text) {
      store.deleteAnnotation(id);
      announce('Empty text annotation discarded');
    } else {
      store.updateAnnotation(id, { text }, false);
      announce('Text annotation updated');
    }
    setShowTextInput(false);
    setEditingTextId(null);
    setTextInputValue('');
    setTimeout(() => renderFullCanvas(), 20);
  };

  // Shared default-placement command: used by keyboard (Enter/Space) placement
  // and by the WebMCP editor_add tool. Places the annotation at a fixed
  // position derived from the image size — no caller-supplied coordinates.
  const placeAnnotationAtDefault = (tool: ToolType): string | null => {
    if (!state.imageDataUrl) return null;
    const width = state.imageWidth;
    const height = state.imageHeight;
    const x = width * 0.35;
    const y = height * 0.35;
    const id = store.generateId();
    if (tool === 'text') {
      store.addAnnotation({
        id,
        type: 'text',
        x,
        y,
        color: state.activeColor,
        strokeWidth: state.activeStrokeWidth,
        text: 'Keyboard annotation',
        textStyle: state.activeTextStyle,
        fontSize: state.activeFontSize,
      });
      announce('Text annotation added');
    } else {
      store.addAnnotation({
        id,
        type: tool,
        x,
        y,
        x2: tool === 'loupe' ? x : x + width * 0.25,
        y2: tool === 'loupe' ? y : y + height * 0.2,
        color: state.activeColor,
        strokeWidth: state.activeStrokeWidth,
        highlightColor: state.activeColor,
        pixelSize: 8,
        blurRadius: 8,
        loupeZoom: 2,
      });
      announce(`${tool} annotation added`);
    }
    setTimeout(() => renderFullCanvas(), 20);
    return id;
  };

  const handleCanvasKeyDown = (e: KeyboardEvent) => {
    if (!state.imageDataUrl || !['Enter', ' '].includes(e.key)) return;
    e.preventDefault();
    placeAnnotationAtDefault(state.activeTool);
  };

  // File handlers
  const handleDropZoneClick = () => {
    fileInputRef?.click();
  };

  const handleFileInput = (e: Event) => {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      loadImage(input.files[0]);
      input.value = '';
    }
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsCanvasDragOver(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    // Only reset if actually leaving the drop zone
    const target = e.relatedTarget as HTMLElement | null;
    if (!target || !target.closest('[data-dropzone]')) {
      setIsCanvasDragOver(false);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsCanvasDragOver(false);
    if (e.dataTransfer?.files && e.dataTransfer.files[0]) {
      loadImage(e.dataTransfer.files[0]);
    }
  };

  // Layer drag handlers
  const handleLayerDragStart = (e: DragEvent, index: number) => {
    setDragLayerIndex(index);
    e.dataTransfer?.setData('text/plain', String(index));
    e.dataTransfer!.effectAllowed = 'move';
  };

  const handleLayerDragOver = (_e: DragEvent, index: number) => {
    if (dragLayerIndex() !== null && dragLayerIndex() !== index) {
      setDragOverIndex(index);
    }
  };

  const handleLayerDrop = (e: DragEvent, index: number) => {
    e.preventDefault();
    const from = dragLayerIndex();
    const to = index;
    if (from !== null && to !== null && from !== to) {
      store.reorderAnnotations(from, to);
      announce('Layer order updated');
      requestAnimationFrame(() => renderOverlayAnnotations());
    }
    setDragLayerIndex(null);
    setDragOverIndex(null);
  };

  const handleLayerDragEnd = (_e: DragEvent) => {
    setDragLayerIndex(null);
    setDragOverIndex(null);
  };

  const moveLayer = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= state.annotations.length) return;
    store.reorderAnnotations(index, target);
    announce(`Layer moved ${direction < 0 ? 'up' : 'down'}`);
    requestAnimationFrame(() => renderOverlayAnnotations());
  };

  // Export PNG
  const handleExportPNG = () => {
    if (!state.imageDataUrl) {
      announce('Load an image before exporting');
      return;
    }
    
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = state.imageWidth;
    exportCanvas.height = state.imageHeight;
    const ctx = exportCanvas.getContext('2d')!;
    
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      
      // Apply destructive effects
      state.annotations.forEach(ann => {
        if (ann.type === 'blur') {
          applyBlurEffect(ctx, ann.x ?? 0, ann.y ?? 0,
            (ann.x2 ?? ann.x ?? 0) - (ann.x ?? 0),
            (ann.y2 ?? ann.y ?? 0) - (ann.y ?? 0),
            exportCanvas.width, exportCanvas.height);
        } else if (ann.type === 'pixelate') {
          applyPixelateEffect(ctx, ann.x ?? 0, ann.y ?? 0,
            (ann.x2 ?? ann.x ?? 0) - (ann.x ?? 0),
            (ann.y2 ?? ann.y ?? 0) - (ann.y ?? 0),
            exportCanvas.width, exportCanvas.height, ann.pixelSize ?? 8);
        } else if (ann.type === 'spotlight') {
          const cx = ((ann.x ?? 0) + (ann.x2 ?? ann.x ?? 0)) / 2;
          const cy = ((ann.y ?? 0) + (ann.y2 ?? ann.y ?? 0)) / 2;
          const rx = Math.abs((ann.x2 ?? ann.x ?? 0) - (ann.x ?? 0)) / 2;
          const ry = Math.abs((ann.y2 ?? ann.y ?? 0) - (ann.y ?? 0)) / 2;
          applySpotlightEffect(ctx, cx, cy, rx, ry, exportCanvas.width, exportCanvas.height);
        }
      });
      
      // Draw non-destructive annotations
      // Render in reverse order for proper stacking
      const exportAnns = state.annotations.filter(ann => !['blur', 'pixelate', 'spotlight'].includes(ann.type));
      for (let i = exportAnns.length - 1; i >= 0; i--) {
        const ann = exportAnns[i];
        drawAnnotation(ctx, ann, false,
          state.imageWidth, state.imageHeight, exportCanvas.width, exportCanvas.height, img);
      }
      
      exportCanvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'markupflow-export.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        announce('PNG exported');
      }, 'image/png');
    };
    img.src = state.imageDataUrl;
  };

  // Init
  onMount(() => {
    if (state.imageDataUrl) {
      const img = new Image();
      img.onload = () => {
        setLoadedImage(img);
        setTimeout(renderFullCanvas, 200);
      };
      img.src = state.imageDataUrl;
    }
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showTextInput()) return; // Don't capture keys when text input is open
      if (e.key === 'Escape' && dragLayerIndex() !== null) {
        setDragLayerIndex(null);
        setDragOverIndex(null);
        announce('Layer move cancelled');
        return;
      }
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          store.undo();
          setTimeout(() => renderFullCanvas(), 20);
        } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
          e.preventDefault();
          store.redo();
          setTimeout(() => renderFullCanvas(), 20);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    onCleanup(() => window.removeEventListener('keydown', handleKeyDown));

    // WebMCP surface — each handler drives the same store command a visible
    // control uses. Reload of a project's image mirrors the Open button path.
    const openProjectById = (id: string): boolean => {
      const project = state.savedProjects.find((p) => p.id === id);
      if (!project) return false;
      const ok = store.loadProject(id);
      if (!ok) return false;
      setProjectName(project.name);
      if (project.imageDataUrl) {
        const image = new Image();
        image.onload = () => {
          setLoadedImage(image);
          setTimeout(renderFullCanvas, 20);
        };
        image.src = project.imageDataUrl;
      }
      announce(`${project.name} opened`);
      return true;
    };
    registerWebMcp({
      listAnnotations: () => state.annotations.map((a) => ({ id: a.id, type: a.type })),
      selectedId: () => state.selectedAnnotationId,
      imageLoaded: () => Boolean(state.imageDataUrl),
      viewMode: () => viewMode(),
      listProjects: () => state.savedProjects.map((p) => ({ id: p.id, name: p.name })),
      placeAnnotation: (tool) => placeAnnotationAtDefault(tool),
      selectAnnotation: (id) => {
        if (id !== null && !state.annotations.some((a) => a.id === id)) return false;
        store.setSelectedAnnotation(id);
        return true;
      },
      deleteAnnotation: (id) => {
        if (!state.annotations.some((a) => a.id === id)) return false;
        store.deleteAnnotation(id);
        announce('annotation deleted');
        setTimeout(() => renderFullCanvas(), 20);
        return true;
      },
      updateSelectedProperty: (key, value) => {
        if (!state.selectedAnnotationId) return false;
        updateSelectedAnnotation({ [key]: value } as Partial<Annotation>);
        return true;
      },
      setViewMode: (mode) => { setViewMode(mode); announce(`${mode === 'edit' ? 'Edit' : 'Preview'} view active`); },
      renderPreview: () => renderFullCanvas(),
      saveProject: (name) => store.saveProject(name),
      loadProject: (id) => openProjectById(id),
      deleteProject: (id) => {
        if (!state.savedProjects.some((p) => p.id === id)) return false;
        store.deleteProject(id);
        return true;
      },
    });
  });

  // Re-render when annotations change
  createEffect(() => {
    const _len = state.annotations.length;
    const _ids = state.annotations.map(a => a.id).join(',');
    if (state.imageDataUrl) {
      setTimeout(() => renderFullCanvas(), 20);
    }
  });

  createEffect(() => {
    localStorage.setItem('markupflow-collaboration', JSON.stringify({
      local: sharedContent(),
      remote: remoteContent(),
      merged: sharedContentMerged(),
    }));
  });

  createEffect(() => {
    document.documentElement.dataset.theme = theme();
  });

  // Re-render when selection changes  
  createEffect(() => {
    const _sel = state.selectedAnnotationId;
    if (state.imageDataUrl) {
      renderOverlayAnnotations();
    }
  });

  return (
    <div class="app-shell h-screen w-screen flex flex-col bg-[var(--color-bg)] overflow-hidden"
      style={{ "font-family": "'Segoe UI', -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif" }}
    >
      <div class="app-status" role="status" aria-live="polite">{statusMessage()}</div>
      {/* Header */}
      <header class="app-header flex items-center justify-between px-4 py-2 bg-[var(--color-surface)] border-b border-[var(--color-border)] flex-shrink-0">
        <div class="flex items-center gap-3">
          <h1 class="text-lg font-bold text-[var(--color-text-primary)]">MarkupFlow</h1>
          <span class="text-xs text-[var(--color-text-secondary)] hidden sm:inline">Image annotation tool</span>
        </div>
        <div class="flex items-center gap-2">
          <button
            class={`header-action ${viewMode() === 'edit' ? 'is-active' : ''}`}
            onClick={() => { setViewMode('edit'); announce('Edit view active'); }}
            aria-pressed={viewMode() === 'edit'}
          >
            Open edit view
          </button>
          <button
            class={`header-action ${viewMode() === 'preview' ? 'is-active' : ''}`}
            onClick={() => { setViewMode('preview'); announce('Preview view active'); }}
            aria-pressed={viewMode() === 'preview'}
          >
            Open preview view
          </button>
          <button
            class="header-action"
            onClick={() => {
              store.clearState();
              setLoadedImage(null);
              setSharedContent('');
              setRemoteContent('');
              setSharedContentMerged('');
              setMergeConflict(null);
              setProjectName('');
              announce('Workspace reset');
            }}
          >
            Reset workspace
          </button>
          <button
            class="header-action"
            onClick={() => setTheme(current => current === 'dark' ? 'light' : 'dark')}
            aria-label={`Switch to ${theme() === 'dark' ? 'light' : 'dark'} theme`}
          >
            {theme() === 'dark' ? 'Use light theme' : 'Use dark theme'}
          </button>
          <button
            class={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150
              focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]
              ${!canUndo() 
                ? 'bg-[var(--color-surface)] text-[var(--color-text-secondary)]/40 cursor-not-allowed opacity-50' 
                : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-border)]'}`}
            onClick={() => { store.undo(); setTimeout(() => renderFullCanvas(), 20); }}
            disabled={!canUndo()}
            aria-label="Undo"
          >
            ↩ Undo
          </button>
          <button
            class={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150
              focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]
              ${!canRedo() 
                ? 'bg-[var(--color-surface)] text-[var(--color-text-secondary)]/40 cursor-not-allowed opacity-50' 
                : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-border)]'}`}
            onClick={() => { store.redo(); setTimeout(() => renderFullCanvas(), 20); }}
            disabled={!canRedo()}
            aria-label="Redo"
          >
            ↪ Redo
          </button>
          <button
            class="px-4 py-1.5 rounded-lg text-sm font-semibold bg-[var(--color-primary)] text-white 
              hover:bg-blue-700 transition-all duration-150
              focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            onClick={handleExportPNG}
            aria-label="Export PNG"
          >
            Export PNG
          </button>
        </div>
      </header>

      {/* Main content */}
      <div class="app-layout flex flex-1 overflow-hidden flex-col lg:flex-row">
        {/* Toolbar */}
        <aside class={`tool-panel flex flex-row lg:flex-col gap-2 p-3 bg-[var(--color-surface)] border-b lg:border-b-0 lg:border-r border-[var(--color-border)] 
          overflow-x-auto overflow-y-hidden lg:overflow-x-hidden lg:overflow-y-auto 
          lg:w-[88px] flex-shrink-0 items-start ${viewMode() === 'preview' ? 'preview-hidden' : ''}`}>
          
          {/* Shapes section */}
          <div class="flex flex-row lg:flex-col gap-1 flex-shrink-0">
            <h2 class="toolbar-heading hidden lg:block text-[11px] font-semibold text-[var(--color-text-secondary)] tracking-wider px-1 mb-1">Shapes</h2>
            <ToolButton tool="rectangle" label="Draw rectangle" icon="▭" activeTool={state.activeTool} onClick={() => activateTool('rectangle')} />
            <ToolButton tool="oval" label="Draw oval" icon="◯" activeTool={state.activeTool} onClick={() => activateTool('oval')} />
            <ToolButton tool="line" label="Draw line" icon="╱" activeTool={state.activeTool} onClick={() => activateTool('line')} />
            <ToolButton tool="arrow" label="Draw arrow" icon="➜" activeTool={state.activeTool} onClick={() => activateTool('arrow')} />
          </div>

          {/* Separator */}
          <div class="hidden lg:block w-full h-px bg-[var(--color-border)] my-1 flex-shrink-0" />
          <div class="lg:hidden w-px h-10 bg-[var(--color-border)] mx-1 flex-shrink-0" />

          {/* Effects section */}
          <div class="flex flex-row lg:flex-col gap-1 flex-shrink-0">
            <h2 class="toolbar-heading hidden lg:block text-[11px] font-semibold text-[var(--color-text-secondary)] tracking-wider px-1 mb-1">Effects</h2>
            <ToolButton tool="text" label="Add text" icon="T" activeTool={state.activeTool} onClick={() => activateTool('text')} />
            <ToolButton tool="blur" label="Apply blur" icon="◌" activeTool={state.activeTool} onClick={() => activateTool('blur')} />
            <ToolButton tool="pixelate" label="Apply pixelate" icon="▦" activeTool={state.activeTool} onClick={() => activateTool('pixelate')} />
            <ToolButton tool="spotlight" label="Apply spotlight" icon="◎" activeTool={state.activeTool} onClick={() => activateTool('spotlight')} />
            <ToolButton tool="loupe" label="Add loupe" icon="🔍" activeTool={state.activeTool} onClick={() => activateTool('loupe')} />
            <ToolButton tool="highlighter" label="Add highlighter" icon="▬" activeTool={state.activeTool} onClick={() => activateTool('highlighter')} />
          </div>

          {/* Separator */}
          <div class="hidden lg:block w-full h-px bg-[var(--color-border)] my-1 flex-shrink-0" />
          <div class="lg:hidden w-px h-10 bg-[var(--color-border)] mx-1 flex-shrink-0" />

          {/* Style section */}
          <div class="flex flex-row lg:flex-col gap-1 flex-wrap flex-shrink-0">
            <h2 class="toolbar-heading hidden lg:block text-[11px] font-semibold text-[var(--color-text-secondary)] tracking-wider px-1 mb-1">Style</h2>
            
            {/* Color swatches */}
            <div class="flex flex-row lg:flex-col gap-1 flex-wrap">
              <For each={COLOR_SWATCHES}>
                {(color) => (
                  <ColorSwatch 
                    color={color} 
                    active={state.activeColor === color} 
                    onClick={() => {
                      store.setActiveColor(color);
                      updateSelectedAnnotation({ color });
                    }}
                  />
                )}
              </For>
              {/* Custom color */}
              <label class="custom-color-control relative flex flex-col items-center gap-1">
                <span class="text-[10px] text-[var(--color-text-secondary)]">Custom color</span>
                <input
                  type="color"
                  value={state.activeColor}
                  class="custom-color-input w-12 h-12 rounded-md cursor-pointer"
                  onInput={(e) => {
                    store.setActiveColor(e.target.value);
                    updateSelectedAnnotation({ color: e.target.value });
                  }}
                  aria-label="Custom color picker"
                />
              </label>
            </div>

            {/* Stroke width */}
            <div class="flex flex-row lg:flex-col gap-1 mt-1">
              {(['thin', 'medium', 'thick'] as StrokeWidth[]).map((sw) => (
                <button
                  class={`stroke-button px-2 py-1 rounded text-[11px] font-medium transition-all duration-150
                    focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]
                    ${state.activeStrokeWidth === sw 
                      ? 'bg-[var(--color-accent)] text-white' 
                      : 'bg-[var(--color-bg)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}
                  onClick={() => {
                    store.setActiveStrokeWidth(sw);
                    updateSelectedAnnotation({ strokeWidth: sw });
                  }}
                  aria-label={`Use ${sw} stroke`}
                >
                  {state.activeStrokeWidth === sw ? '✓ ' : ''}Use {sw}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Canvas area */}
        <main class="canvas-region flex-1 overflow-auto p-4 flex items-center justify-center bg-[var(--color-bg)] relative"
          data-dropzone="true">
          <Show when={state.imageDataUrl} fallback={
            <div 
              data-dropzone="true"
              class={`flex flex-col items-center justify-center gap-6 p-8 sm:p-12 rounded-2xl border-2 border-dashed 
                transition-all duration-200 max-w-lg w-full cursor-pointer
                ${isCanvasDragOver() 
                  ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10' 
                  : 'border-[var(--color-border)] bg-[var(--color-surface)]/50'}`}
              onClick={handleDropZoneClick}
              onDragOver={(e) => { e.preventDefault(); setIsCanvasDragOver(true); }}
              onDragLeave={() => setIsCanvasDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsCanvasDragOver(false);
                if (e.dataTransfer?.files && e.dataTransfer.files[0]) {
                  loadImage(e.dataTransfer.files[0]);
                }
              }}
            >
              <div class="text-5xl sm:text-6xl" aria-hidden="true">🖼️</div>
              <div class="text-center">
                <h2 class="text-lg sm:text-xl font-semibold text-[var(--color-text-primary)] mb-2">
                  Drop an image here
                </h2>
                <p class="text-sm text-[var(--color-text-secondary)] mb-4">
                  or click to browse files
                </p>
              </div>
              <div class="flex flex-col sm:flex-row gap-3">
                <button
                  class="px-6 py-2.5 rounded-lg bg-[var(--color-primary)] text-white font-semibold
                    hover:bg-blue-700 transition-all duration-150
                    focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                  onClick={(e) => { e.stopPropagation(); handleDropZoneClick(); }}
                >
                  Choose image
                </button>
                <button
                  class="px-6 py-2.5 rounded-lg bg-[var(--color-surface)] text-[var(--color-text-primary)] font-semibold
                    border border-[var(--color-border)] hover:bg-[var(--color-border)] transition-all duration-150
                    focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                  onClick={(e) => { e.stopPropagation(); loadSampleImage(); }}
                >
                  Try sample image
                </button>
              </div>
              <input
                ref={fileInputRef}
                aria-label="Choose image file"
                type="file"
                accept="image/*"
                class="hidden"
                onChange={handleFileInput}
              />
            </div>
          }>
            <div
              class="canvas-wrapper relative shadow-2xl rounded-lg overflow-hidden"
              style={{ width: `${canvasWidth()}px`, "aspect-ratio": `${canvasWidth()} / ${canvasHeight()}` }}
            >
              <canvas
                ref={canvasRef}
                class="base-canvas block"
                style={{ "image-rendering": "auto" }}
                role="img"
                aria-label="Loaded image with rendered annotations"
              />
              <canvas
                ref={overlayCanvasRef}
                class="absolute top-0 left-0 block cursor-crosshair"
                role="application"
                aria-label="Annotation canvas. Select a tool, then press Enter or Space to place an annotation."
                tabIndex={0}
                onKeyDown={handleCanvasKeyDown}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={() => {
                  if (isDragging()) {
                    setIsDragging(false);
                    setDragStart(null);
                    setDragCurrent(null);
                    renderOverlayAnnotations();
                  }
                }}
              />
              
              {/* Text input overlay */}
              <Show when={showTextInput() && textInputPos()}>
                <div 
                  class="absolute z-50"
                  style={{ 
                    left: `${Math.min(textInputPos()!.x / (canvasWidth() / (canvasRef?.width || 800)), canvasWidth() - 260)}px`, 
                    top: `${Math.max(0, textInputPos()!.y / (canvasHeight() / (canvasRef?.height || 500)) - 50)}px` 
                  }}
                >
                  <div class="flex items-center gap-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-2 shadow-xl">
                    <input
                      ref={textInputRef}
                      type="text"
                      value={textInputValue()}
                      onInput={(e) => {
                        const value = e.target.value;
                        setTextInputValue(value);
                        const id = editingTextId();
                        if (id) {
                          store.updateAnnotation(id, { text: value || 'Type here' }, false);
                          renderOverlayAnnotations();
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleTextSubmit();
                        if (e.key === 'Escape') {
                          const id = editingTextId();
                          if (id && !textInputValue().trim()) store.deleteAnnotation(id);
                          setShowTextInput(false);
                          setEditingTextId(null);
                          announce('Text editing closed');
                        }
                      }}
                      class="bg-[var(--color-bg)] text-[var(--color-text-primary)] px-3 py-1.5 rounded-md 
                        border border-[var(--color-border)] text-sm w-48
                        focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                      placeholder="Enter text..."
                      aria-label="Text annotation input"
                    />
                    <button
                      class="px-3 py-1.5 rounded-md bg-[var(--color-accent)] text-white text-sm font-medium
                        hover:bg-blue-600 transition-all duration-150"
                      onClick={handleTextSubmit}
                    >
                      Done
                    </button>
                    <button
                      class="px-2 py-1.5 rounded-md text-[var(--color-text-secondary)] text-sm
                        hover:text-[var(--color-text-primary)] transition-all duration-150"
                      onClick={() => {
                        const id = editingTextId();
                        if (id && !textInputValue().trim()) store.deleteAnnotation(id);
                        setShowTextInput(false);
                        setEditingTextId(null);
                        announce('Text editing closed');
                      }}
                      aria-label="Cancel text"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </Show>

              {/* Text style controls */}
              <Show when={state.activeTool === 'text'}>
                <div class="absolute bottom-2 left-2 bg-[var(--color-surface)]/95 backdrop-blur-sm border border-[var(--color-border)] rounded-lg p-2 shadow-lg z-40">
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <span class="text-[10px] font-semibold text-[var(--color-text-secondary)]">Style:</span>
                    <For each={TEXT_STYLES}>
                      {(style) => (
                        <button
                          class={`px-2 py-1 rounded text-[10px] font-medium transition-all duration-150
                            ${state.activeTextStyle === style.value 
                              ? 'bg-[var(--color-accent)] text-white' 
                              : 'bg-[var(--color-bg)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}
                            onClick={() => setActiveTextStyle(style.value)}
                        >
                          Use {style.label.toLowerCase()}
                        </button>
                      )}
                    </For>
                    <span class="text-[10px] font-semibold text-[var(--color-text-secondary)] ml-2">Size:</span>
                    <input
                      type="range"
                      min="10"
                      max="72"
                      value={state.activeFontSize}
                      onInput={(e) => {
                        const size = Number(e.target.value);
                        store.setActiveFontSize(size);
                        const selected = state.annotations.find(annotation => annotation.id === state.selectedAnnotationId);
                        if (selected?.type === 'text') {
                          store.updateAnnotation(selected.id, { fontSize: size }, false);
                          renderOverlayAnnotations();
                        }
                      }}
                      class="w-16 accent-[var(--color-accent)]"
                      aria-label="Font size"
                    />
                    <span class="text-[10px] text-[var(--color-text-secondary)] min-w-[24px]">{state.activeFontSize}px</span>
                  </div>
                </div>
              </Show>
            </div>
          </Show>
        </main>

        {/* Layer Panel */}
        <aside class="layer-panel w-full lg:w-64 xl:w-72 bg-[var(--color-surface)] border-t lg:border-t-0 lg:border-l border-[var(--color-border)] 
          flex-shrink-0 flex flex-col max-h-[280px] lg:max-h-none overflow-hidden">
          <div class="px-4 py-3 border-b border-[var(--color-border)] flex-shrink-0">
            <h2 class="text-base font-bold text-[var(--color-text-primary)]">Layers</h2>
          </div>
          
          <div class="flex-1 overflow-y-auto p-2 space-y-1" role="list" aria-label="Annotation layers">
            <Show when={state.annotations.length > 0} fallback={
              <div class="flex flex-col items-center justify-center py-8 text-[var(--color-text-secondary)]">
                <span class="text-2xl mb-2">📋</span>
                <p class="text-sm text-center px-4">No annotations yet.<br/>Use the tools to start annotating!</p>
              </div>
            }>
              <For each={state.annotations}>
                {(ann, i) => (
                  <LayerRow
                    annotation={ann}
                    index={i()}
                    count={state.annotations.length}
                    isSelected={ann.id === state.selectedAnnotationId}
                    onSelect={() => {
                      store.setSelectedAnnotation(ann.id === state.selectedAnnotationId ? null : ann.id);
                    }}
                    onDelete={() => {
                      store.deleteAnnotation(ann.id);
                      announce(`${ann.type} annotation deleted`);
                      setTimeout(() => renderFullCanvas(), 20);
                    }}
                    onDragStart={handleLayerDragStart}
                    onDragOver={handleLayerDragOver}
                    onDrop={handleLayerDrop}
                    onDragEnd={handleLayerDragEnd}
                    onMove={(direction) => moveLayer(i(), direction)}
                    isDragOver={dragOverIndex() === i() && dragLayerIndex() !== null && dragLayerIndex() !== i()}
                    isDragging={dragLayerIndex() === i()}
                  />
                )}
              </For>
            </Show>
          </div>

          <section class="saved-projects border-t border-[var(--color-border)] p-3 flex-shrink-0" aria-labelledby="saved-projects-heading">
            <h3 id="saved-projects-heading" class="text-xs font-semibold text-[var(--color-text-secondary)] mb-2">Saved projects</h3>
            <label class="text-[10px] text-[var(--color-text-secondary)] block mb-1" for="project-name">Project name</label>
            <div class="flex gap-2 mb-2">
              <input
                id="project-name"
                value={projectName()}
                onInput={(e) => setProjectName(e.target.value)}
                class="project-name-input flex-1 min-w-0 bg-[var(--color-bg)] text-[var(--color-text-primary)] text-xs px-2 rounded-md"
                placeholder="Annotation project"
              />
              <button
                class="project-action bg-[var(--color-primary)] text-white rounded-md px-2 text-xs"
                onClick={() => {
                  if (store.saveProject(projectName())) {
                    announce('Project saved');
                  } else {
                    announce('Add a name and image before saving');
                  }
                }}
              >
                Save project
              </button>
            </div>
            <div class="saved-project-list space-y-1" role="list" aria-label="Saved projects">
              <For each={state.savedProjects}>
                {(project) => (
                  <div class="saved-project-row flex items-center gap-1" role="listitem">
                    <span class="flex-1 truncate text-xs text-[var(--color-text-primary)]">{project.name}</span>
                    <button
                      class="project-action"
                      onClick={() => {
                        store.loadProject(project.id);
                        setProjectName(project.name);
                        const image = new Image();
                        image.onload = () => {
                          setLoadedImage(image);
                          setTimeout(renderFullCanvas, 20);
                        };
                        if (project.imageDataUrl) image.src = project.imageDataUrl;
                        announce(`${project.name} opened`);
                      }}
                    >
                      Open
                    </button>
                    <button
                      class="project-action"
                      onClick={() => {
                        setProjectName(project.name);
                        store.saveProject(project.name);
                        announce(`${project.name} updated`);
                      }}
                    >
                      Update
                    </button>
                    <button
                      class="project-action destructive-action"
                      onClick={() => {
                        store.deleteProject(project.id);
                        announce(`${project.name} deleted`);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </For>
            </div>
          </section>

          {/* Collaboration Section */}
          <div class="border-t border-[var(--color-border)] p-3 flex-shrink-0">
            <h3 class="text-xs font-semibold text-[var(--color-text-secondary)] mb-2">Collaboration scenario</h3>
            <div class="flex gap-2 mb-2">
              <button
                class={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-all duration-150
                  ${state.collaborationState === 'offline' 
                    ? 'bg-yellow-600 text-white' 
                    : 'bg-[var(--color-bg)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}
                onClick={() => {
                  if (state.collaborationState === 'online') {
                    store.goOffline();
                    announce('Offline editing enabled');
                  }
                }}
                aria-label="Go offline"
              >
                Go offline
              </button>
              <button
                class={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-all duration-150
                  ${state.collaborationState === 'online' 
                    ? 'bg-green-600 text-white' 
                    : state.collaborationState === 'syncing'
                      ? 'bg-green-600/50 text-white/50'
                      : 'bg-[var(--color-bg)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}
                onClick={() => {
                  if (state.collaborationState === 'offline') {
                    setState('collaborationState', 'syncing');
                    setTimeout(() => {
                      if (!mergeConflict()) {
                        setSharedContentMerged(current => current || combineChanges(sharedContent(), remoteContent()));
                      }
                      store.goOnline();
                      announce('Changes synced');
                    }, 500);
                  }
                }}
                aria-label="Go online"
              >
                Go online
              </button>
            </div>
            
            <div class="mb-2">
              <label class="text-[10px] text-[var(--color-text-secondary)] block mb-1" for="shared-editor">Shared editor</label>
              <textarea
                id="shared-editor"
                value={sharedContent()}
                onInput={(e) => {
                  const value = e.target.value;
                  setSharedContent(value);
                  if (state.collaborationState === 'online') {
                    setSharedContentMerged(combineChanges(value, remoteContent()));
                  } else {
                    store.queueOfflineAction('local-edit', value);
                  }
                }}
                class="w-full h-16 bg-[var(--color-bg)] text-[var(--color-text-primary)] text-xs px-2 py-1.5 rounded-md 
                  form-control-border border resize-none
                  focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                placeholder="Type shared content..."
                aria-label="Shared editor"
              />
            </div>

            <div class="mb-2">
              <label class="text-[10px] text-[var(--color-text-secondary)] block mb-1" for="remote-editor">Remote editor</label>
              <textarea
                id="remote-editor"
                value={remoteContent()}
                onInput={(e) => setRemoteContent(e.target.value)}
                class="w-full h-12 bg-[var(--color-bg)] text-[var(--color-text-primary)] text-xs px-2 py-1.5 rounded-md form-control-border border resize-none"
                placeholder="Type an independent remote change"
              />
              <div class="flex gap-1 mt-1">
                <button
                  class="project-action flex-1"
                  onClick={() => {
                    setSharedContentMerged(combineChanges(sharedContent(), remoteContent()));
                    announce('Remote change applied');
                  }}
                >
                  Apply remote change
                </button>
                <button
                  class="project-action destructive-action flex-1"
                  onClick={() => {
                    const remote = remoteContent() || `${sharedContent()} (remote revision)`;
                    setMergeConflict({ local: sharedContent(), remote });
                    announce('Conflict detected; choose a resolution');
                  }}
                >
                  Create conflict
                </button>
              </div>
            </div>
            
            <div class="bg-[var(--color-bg)] rounded-md p-2">
              <label class="text-[10px] text-[var(--color-text-secondary)] block mb-1">Shared content</label>
              <p class="text-xs text-[var(--color-text-primary)] break-words">
                {sharedContentMerged() || sharedContent() || '(empty)'}
              </p>
              <Show when={mergeConflict()}>
                <div class="mt-1 p-1.5 bg-yellow-900/30 rounded text-[10px]">
                  <p class="text-yellow-400 font-medium">Conflict detected</p>
                  <p class="text-[var(--color-text-secondary)] mt-0.5">Local: {mergeConflict()!.local || '(empty)'}</p>
                  <p class="text-[var(--color-text-secondary)]">Remote: {mergeConflict()!.remote || '(empty)'}</p>
                  <div class="flex gap-1 mt-1">
                    <button 
                      class="px-2 py-0.5 bg-yellow-600 text-white text-[10px] rounded"
                      onClick={() => {
                        setSharedContentMerged(mergeConflict()!.local);
                        setMergeConflict(null);
                      }}
                    >Keep local</button>
                    <button 
                      class="px-2 py-0.5 bg-yellow-600 text-white text-[10px] rounded"
                      onClick={() => {
                        setSharedContent(mergeConflict()!.remote);
                        setSharedContentMerged(mergeConflict()!.remote);
                        setMergeConflict(null);
                      }}
                    >Keep remote</button>
                    <button 
                      class="px-2 py-0.5 bg-green-600 text-white text-[10px] rounded"
                      onClick={() => {
                        setSharedContentMerged(combineChanges(mergeConflict()!.local, mergeConflict()!.remote));
                        setMergeConflict(null);
                      }}
                    >Merge both</button>
                  </div>
                </div>
              </Show>
              <Show when={state.offlineQueue.length > 0 && !mergeConflict()}>
                <p class="text-[10px] text-yellow-400 mt-1">
                  {state.offlineQueue.length} pending change(s)
                </p>
              </Show>
              <Show when={state.collaborationState === 'syncing'}>
                <p class="text-[10px] text-green-400 mt-1 animate-pulse">
                  Syncing...
                </p>
              </Show>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
