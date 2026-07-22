import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { hueSortValue, simulateVision, shiftHex } from '../colorUtils';
import { HEX_RE } from '../paletteSchema';

const SEED_PALETTES = [
  { id: 'seed-werners-greens', name: "Werner's Greens", period: 'Old Masters', swatches: ['#4A5D23', '#8F9779', '#4B5320', '#665D1E', '#355E3B'], favorite: false },
  { id: 'seed-baroque-shadows', name: 'Baroque Shadows', period: 'Baroque to Neoclassical', swatches: ['#2A2C2B', '#483C32', '#7E5A5A', '#A1856C', '#CDB599'], favorite: false },
  { id: 'seed-fauvism-burst', name: 'Fauvism Burst', period: 'Fauvism', swatches: ['#C1272D', '#F15A24', '#FBB03B', '#8CC63F', '#2B3990'], favorite: false },
  { id: 'seed-tonalist-mist', name: 'Tonalist Mist', period: 'Tonalism', swatches: ['#8A9A9A', '#7A8B8B', '#6B7A7A', '#5B6969', '#4C5858'], favorite: false },
  { id: 'seed-realist-earth', name: 'Realist Earth', period: 'Realism', swatches: ['#8B4513', '#A0522D', '#CD853F', '#DEB887', '#6E4B2A'], favorite: false },
  { id: 'seed-symbolist-dream', name: 'Symbolist Dream', period: 'Symbolism', swatches: ['#483D8B', '#4B0082', '#800080', '#9932CC', '#BA55D3'], favorite: true },
  { id: 'seed-impressionist-coast', name: 'Impressionist Coast', period: 'Post-Impressionism', swatches: ['#5B7FA6', '#9DB8C9', '#E8C040', '#C85A2A', '#3D5A80'], favorite: false },
];

const clone = (value) => JSON.parse(JSON.stringify(value));
let uidCounter = 0;
// CSPRNG-backed suffix (Wiz SAST: insecure randomness) — these ids are not
// security tokens, but crypto.getRandomValues is universally available and
// costs nothing over Math.random.
const uid = () =>
  `p${Date.now().toString(36)}${(uidCounter++).toString(36)}${Array.from(
    crypto.getRandomValues(new Uint8Array(4)),
    (b) => b.toString(16).padStart(2, '0'),
  ).join('')}`;

export const usePaletteStore = defineStore('palette', () => {
  // ---- Collection + browse facets -------------------------------------
  const palettes = ref(clone(SEED_PALETTES));
  const activeView = ref('nomenclature'); // nomenclature | palette | swatch
  const periodFilter = ref(''); // '' = All Periods

  // ---- Selection / Detail ---------------------------------------------
  const selectedPaletteId = ref(null);
  const detailOpen = ref(false);
  const lastOpenedPaletteId = ref(null); // session-only personalization

  // ---- Overlays ---------------------------------------------------------
  const menuOpen = ref(false);
  const cartOpen = ref(false);
  const exportOpen = ref(false);
  const exportFormat = ref('css');
  const simulatorOpen = ref(false);
  const simulatorPaletteId = ref(null); // '' = follow selection/first
  const subscribeVisible = ref(false);
  const subscribeDismissed = ref(false);

  // ---- Advanced tool state ----------------------------------------------
  const visionMode = ref('None'); // None | Protanopia | Deuteranopia
  const harmonyMode = ref('Analogous');
  const wheelHue = ref(24);
  const batchSelected = ref([]); // indices of multi-selected swatches in Detail
  const batchShift = ref({ h: 0, s: 0, l: 0 });

  // ---- History ----------------------------------------------------------
  const undoStack = ref([]);
  const redoStack = ref([]);

  // ---- Cart / feedback ----------------------------------------------------
  const cartItems = ref([]);
  const cartPrefill = ref(''); // palette name to prefill into the CartAdd form
  const copyFeedback = ref(null); // id of swatch showing its "Copied #hex" chip
  const liveMessage = ref(''); // polite announcer text
  const coachDismissed = ref(false); // session-only guided intro

  // ---- Derived ------------------------------------------------------------
  const visiblePalettes = computed(() =>
    periodFilter.value ? palettes.value.filter((p) => p.period === periodFilter.value) : palettes.value,
  );

  const nomenclatureRows = computed(() => {
    const rows = [];
    for (const p of visiblePalettes.value) {
      for (const hex of p.swatches) rows.push({ hex, paletteId: p.id, paletteName: p.name, period: p.period });
    }
    rows.sort((a, b) => hueSortValue(a.hex) - hueSortValue(b.hex) || a.hex.localeCompare(b.hex));
    const seen = new Set();
    return rows.filter((row) => {
      const key = row.hex.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  });

  const allSwatches = computed(() => {
    const items = [];
    for (const p of visiblePalettes.value) {
      p.swatches.forEach((hex, index) => items.push({ hex, index, paletteId: p.id, paletteName: p.name, period: p.period }));
    }
    return items;
  });

  const selectedPalette = computed(() => palettes.value.find((p) => p.id === selectedPaletteId.value) || null);
  const canUndo = computed(() => undoStack.value.length > 0);
  const canRedo = computed(() => redoStack.value.length > 0);
  const simulatorPalette = computed(
    () =>
      palettes.value.find((p) => p.id === simulatorPaletteId.value) ||
      palettes.value.find((p) => p.id === selectedPaletteId.value) ||
      palettes.value[0] ||
      null,
  );

  // ---- Rendering helper: vision simulation -----------------------------
  function displayHex(hex) {
    return visionMode.value === 'None' ? hex : simulateVision(hex, visionMode.value);
  }

  // ---- History-aware mutation (one undoable step) -----------------------
  function commit(mutator) {
    undoStack.value.push({ palettes: clone(palettes.value), cart: clone(cartItems.value) });
    redoStack.value = [];
    mutator();
  }

  function healSelection() {
    if (selectedPaletteId.value && !palettes.value.some((p) => p.id === selectedPaletteId.value)) {
      selectedPaletteId.value = null;
      detailOpen.value = false;
    }
  }

  function addPalette(data) {
    const palette = { id: uid(), name: data.name, period: data.period, swatches: [...data.swatches], favorite: data.favorite ?? false };
    commit(() => palettes.value.push(palette));
    return palette;
  }

  function updatePalette(id, patch) {
    commit(() => {
      const idx = palettes.value.findIndex((p) => p.id === id);
      if (idx === -1) return;
      const previous = palettes.value[idx];
      const next = { ...previous, ...patch };
      palettes.value[idx] = next;
      if (patch.name && patch.name !== previous.name) {
        cartItems.value = cartItems.value.map((item) =>
          item.paletteName === previous.name ? { ...item, paletteName: patch.name } : item,
        );
      }
    });
  }

  function deletePalette(id) {
    const target = palettes.value.find((p) => p.id === id);
    if (!target) return;
    const deletedName = target.name;
    commit(() => {
      palettes.value = palettes.value.filter((p) => p.id !== id);
      cartItems.value = cartItems.value.filter((item) => item.paletteName !== deletedName);
    });
    healSelection();
  }

  function toggleFavorite(id) {
    commit(() => {
      const palette = palettes.value.find((p) => p.id === id);
      if (palette) palette.favorite = !palette.favorite;
    });
  }

  /**
   * Batch H/S/L shift for selected swatch indices of one palette. One undoable step.
   * `baseSwatches` optionally supplies the shift's starting values for the selected
   * indices (the Detail editor passes its live draft so unsaved hex edits are honored);
   * unselected swatches always keep their committed values.
   */
  function applyBatchShift(id, selectedIndices, shift, baseSwatches) {
    const palette = palettes.value.find((p) => p.id === id);
    if (!palette) return { ok: false, error: 'Palette not found' };
    const base =
      Array.isArray(baseSwatches) && baseSwatches.length === palette.swatches.length
        ? baseSwatches
        : palette.swatches;
    const next = palette.swatches.map((hex, i) =>
      selectedIndices.includes(i) ? shiftHex(base[i], shift.h, shift.s, shift.l) : hex,
    );
    if (new Set(next.map((s) => s.toLowerCase())).size !== next.length) {
      return { ok: false, error: 'Swatches must stay unique — this shift collapses two selected swatches into the same hex. Nothing was changed.' };
    }
    if (!next.every((s) => HEX_RE.test(s))) return { ok: false, error: 'Swatches must remain valid #RRGGBB values' };
    commit(() => {
      const idx = palettes.value.findIndex((p) => p.id === id);
      palettes.value[idx] = { ...palettes.value[idx], swatches: next };
    });
    return { ok: true, swatches: next };
  }

  /** Replace a palette's swatches with the wheel's computed set. One undoable step. */
  function applyHarmonySet(id, hexes) {
    const unique = [...new Set(hexes.map((h) => h.toUpperCase()))];
    const minSwatches = harmonyMode.value === 'Complementary' ? 2 : 3;
    if (unique.length < minSwatches || unique.length > 8) {
      return {
        ok: false,
        error: `Swatches must contain ${minSwatches} to 8 unique hex values — this ${harmonyMode.value} set computes ${unique.length}. Nothing was changed.`,
      };
    }
    commit(() => {
      const idx = palettes.value.findIndex((p) => p.id === id);
      if (idx !== -1) palettes.value[idx] = { ...palettes.value[idx], swatches: unique };
    });
    return { ok: true, swatches: unique };
  }

  function replacePalettes(list) {
    commit(() => {
      palettes.value = list.map((p) => ({
        id: uid(),
        name: p.name,
        period: p.period,
        swatches: [...p.swatches],
        favorite: p.favorite ?? false,
      }));
      // Reconcile the cart against the imported library (same undoable step, so
      // Undo of an import restores the pre-import cart lines too).
      const names = new Set(palettes.value.map((p) => p.name));
      cartItems.value = cartItems.value.filter((item) => names.has(item.paletteName));
    });
    if (cartPrefill.value && !palettes.value.some((p) => p.name === cartPrefill.value)) {
      cartPrefill.value = '';
    }
    selectedPaletteId.value = null;
    detailOpen.value = false;
    batchSelected.value = [];
    batchShift.value = { h: 0, s: 0, l: 0 };
  }

  function undo() {
    if (!undoStack.value.length) return;
    redoStack.value.push({ palettes: clone(palettes.value), cart: clone(cartItems.value) });
    const snap = undoStack.value.pop();
    palettes.value = snap.palettes;
    cartItems.value = snap.cart;
    healSelection();
  }

  function redo() {
    if (!redoStack.value.length) return;
    undoStack.value.push({ palettes: clone(palettes.value), cart: clone(cartItems.value) });
    const snap = redoStack.value.pop();
    palettes.value = snap.palettes;
    cartItems.value = snap.cart;
    healSelection();
  }

  // ---- Cart -------------------------------------------------------------
  function addToCart({ paletteName, quantity }) {
    const existing = cartItems.value.find((item) => item.paletteName === paletteName);
    if (existing) existing.quantity = Math.min(5, existing.quantity + quantity);
    else cartItems.value.push({ paletteName, quantity });
    cartOpen.value = true;
  }

  function removeFromCart(paletteName) {
    cartItems.value = cartItems.value.filter((item) => item.paletteName !== paletteName);
  }

  // ---- Detail / overlays ---------------------------------------------------
  function openDetail(id) {
    const palette = palettes.value.find((p) => p.id === id);
    if (!palette) return;
    selectedPaletteId.value = id;
    lastOpenedPaletteId.value = id;
    batchSelected.value = [];
    batchShift.value = { h: 0, s: 0, l: 0 };
    detailOpen.value = true;
  }

  function closeDetail() {
    detailOpen.value = false;
  }

  // ---- Copy feedback + polite announcements --------------------------------
  let copyTimer = null;
  let liveTimer = null;

  function copyHex(hex, feedbackId) {
    copyFeedback.value = feedbackId;
    announce(`Copied ${hex} to the clipboard`);
    if (copyTimer) clearTimeout(copyTimer);
    copyTimer = setTimeout(() => {
      copyFeedback.value = null;
    }, 1000);
  }

  function announce(message) {
    liveMessage.value = '';
    requestAnimationFrame(() => {
      liveMessage.value = message;
    });
    if (liveTimer) clearTimeout(liveTimer);
    liveTimer = setTimeout(() => {
      liveMessage.value = '';
    }, 2500);
  }

  return {
    palettes,
    activeView,
    periodFilter,
    selectedPaletteId,
    detailOpen,
    lastOpenedPaletteId,
    menuOpen,
    cartOpen,
    exportOpen,
    exportFormat,
    simulatorOpen,
    simulatorPaletteId,
    subscribeVisible,
    subscribeDismissed,
    visionMode,
    harmonyMode,
    wheelHue,
    batchSelected,
    batchShift,
    undoStack,
    redoStack,
    cartItems,
    cartPrefill,
    copyFeedback,
    liveMessage,
    coachDismissed,
    visiblePalettes,
    nomenclatureRows,
    allSwatches,
    selectedPalette,
    canUndo,
    canRedo,
    simulatorPalette,
    displayHex,
    addPalette,
    updatePalette,
    deletePalette,
    toggleFavorite,
    applyBatchShift,
    applyHarmonySet,
    replacePalettes,
    undo,
    redo,
    addToCart,
    removeFromCart,
    openDetail,
    closeDetail,
    copyHex,
    announce,
  };
});
