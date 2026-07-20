import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const usePaletteStore = defineStore('palette', () => {
  // Seed data
  const seedPalettes = [
    { id: 'p1', name: 'Werner\'s Greens', period: 'Historical', swatches: ['#4A5D23', '#8F9779', '#4B5320', '#665D1E', '#355E3B'], favorite: false },
    { id: 'p2', name: 'Baroque Shadows', period: 'Baroque to Neoclassical', swatches: ['#2A2C2B', '#483C32', '#7E5A5A', '#A1856C', '#CDB599'], favorite: false },
    { id: 'p3', name: 'Fauvism Burst', period: 'Fauvism', swatches: ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF'], favorite: false },
    { id: 'p4', name: 'Tonalist Mist', period: 'Tonalism', swatches: ['#8A9A9A', '#7A8B8B', '#6B7A7A', '#5B6969', '#4C5858'], favorite: false },
    { id: 'p5', name: 'Realist Earth', period: 'Realism', swatches: ['#8B4513', '#A0522D', '#CD853F', '#DEB887', '#D2B48C'], favorite: false },
    { id: 'p6', name: 'Symbolist Dream', period: 'Symbolism', swatches: ['#483D8B', '#4B0082', '#800080', '#9932CC', '#BA55D3'], favorite: false }
  ];

  const palettes = ref([...seedPalettes]);
  const activeView = ref('nomenclature'); // nomenclature | palette | swatch
  const periodFilter = ref(''); // '' means All Periods
  const undoStack = ref([]);
  const redoStack = ref([]);
  const cartItems = ref([]);
  const popupDismissed = ref(false);
  const layoutSimulatorSelection = ref([]);

  const harmonyMode = ref('Analogous');
  const copyFeedback = ref(null);

  // Selection/detail
  const selectedPaletteId = ref(null);
  const selectedPalette = computed(() => palettes.value.find(p => p.id === selectedPaletteId.value) || null);

  // Derived state
  const visiblePalettes = computed(() => {
    if (!periodFilter.value) return palettes.value;
    return palettes.value.filter(p => p.period === periodFilter.value);
  });

  const allSwatches = computed(() => {
     let swatches = [];
     visiblePalettes.value.forEach(p => {
        p.swatches.forEach(s => {
           swatches.push({ hex: s, paletteId: p.id, paletteName: p.name, period: p.period });
        });
     });
     return swatches;
  });

  function saveState() {
    undoStack.value.push(JSON.parse(JSON.stringify(palettes.value)));
    redoStack.value = [];
  }

  function addPalette(palette) {
    saveState();
    palettes.value.push({
      ...palette,
      id: `p_${Date.now()}`
    });
  }

  function updatePalette(id, updates) {
    const idx = palettes.value.findIndex(p => p.id === id);
    if (idx !== -1) {
      saveState();
      palettes.value[idx] = { ...palettes.value[idx], ...updates };
    }
  }

  function deletePalette(id) {
    const idx = palettes.value.findIndex(p => p.id === id);
    if (idx !== -1) {
      saveState();
      palettes.value.splice(idx, 1);
      if (selectedPaletteId.value === id) selectedPaletteId.value = null;
      // Remove from cart if present
      cartItems.value = cartItems.value.filter(item => item.paletteId !== id);
    }
  }

  function toggleFavorite(id) {
     const idx = palettes.value.findIndex(p => p.id === id);
     if (idx !== -1) {
       saveState();
       palettes.value[idx].favorite = !palettes.value[idx].favorite;
     }
  }

  function undo() {
    if (undoStack.value.length > 0) {
      redoStack.value.push(JSON.parse(JSON.stringify(palettes.value)));
      palettes.value = undoStack.value.pop();
    }
  }

  function redo() {
    if (redoStack.value.length > 0) {
      undoStack.value.push(JSON.parse(JSON.stringify(palettes.value)));
      palettes.value = redoStack.value.pop();
    }
  }

  function addToCart(item) {
    const existing = cartItems.value.find(i => i.paletteName === item.paletteName);
    if (existing) {
       existing.quantity += item.quantity;
    } else {
       cartItems.value.push(item);
    }
  }

  function resetState() {
     palettes.value = [...seedPalettes];
     activeView.value = 'nomenclature';
     periodFilter.value = '';
     undoStack.value = [];
     redoStack.value = [];
     cartItems.value = [];
     selectedPaletteId.value = null;
  }

  return {
    palettes,
    activeView,
    periodFilter,
    undoStack,
    redoStack,
    cartItems,
    popupDismissed,
    layoutSimulatorSelection,
    harmonyMode,
    copyFeedback,
    selectedPaletteId,
    selectedPalette,
    visiblePalettes,
    allSwatches,
    addPalette,
    updatePalette,
    deletePalette,
    toggleFavorite,
    undo,
    redo,
    addToCart,
    resetState
  }
})
