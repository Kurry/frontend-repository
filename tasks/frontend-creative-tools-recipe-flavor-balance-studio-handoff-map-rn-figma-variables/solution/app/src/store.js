import { create } from 'zustand'
import { z } from 'zod'

export const statusEnum = z.enum(["empty", "draft", "ready", "changed", "archived", "conflict", "resolved"])

export const flavorComponentSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, "Name is required").max(100, "Name must be 100 characters or less"),
  description: z.string().optional(),
  sweetness: z.number().min(0, "Sweetness must be between 0 and 10").max(10),
  acidity: z.number().min(0, "Acidity must be between 0 and 10").max(10),
  saltiness: z.number().min(0, "Saltiness must be between 0 and 10").max(10),
  bitterness: z.number().min(0, "Bitterness must be between 0 and 10").max(10),
  umami: z.number().min(0, "Umami must be between 0 and 10").max(10),
  status: statusEnum,
  handoffOwner: z.string().nullable().optional()
})

export const RecipeFlavorBalanceStudioSessionSchema = z.object({
  schemaVersion: z.literal("v1"),
  exportedAt: z.string().datetime(),
  records: z.array(flavorComponentSchema),
  derived: z.object({
    summary: z.string()
  }),
  history: z.array(z.any())
})

const initialRecords = [
  { id: '1', name: 'Lemon Glaze', description: 'Bright and acidic', sweetness: 7, acidity: 8, saltiness: 1, bitterness: 2, umami: 0, status: 'ready', handoffOwner: 'pastry-chef' },
  { id: '2', name: 'Dark Chocolate Ganache', description: 'Rich and bitter', sweetness: 4, acidity: 2, saltiness: 3, bitterness: 8, umami: 4, status: 'draft', handoffOwner: null },
  { id: '3', name: 'Salted Caramel', description: 'Sweet and salty', sweetness: 9, acidity: 1, saltiness: 7, bitterness: 3, umami: 2, status: 'changed', handoffOwner: 'baker' },
  { id: '4', name: 'Miso Butter', description: 'Umami bomb', sweetness: 1, acidity: 2, saltiness: 8, bitterness: 1, umami: 9, status: 'archived', handoffOwner: null },
  { id: '5', name: 'New Component', description: '', sweetness: 0, acidity: 0, saltiness: 0, bitterness: 0, umami: 0, status: 'empty', handoffOwner: null },
]

for(let i = 6; i <= 100; i++) {
    initialRecords.push({
        id: i.toString(),
        name: `Component ${i}`,
        description: `Description ${i}`,
        sweetness: Math.floor(Math.random() * 11),
        acidity: Math.floor(Math.random() * 11),
        saltiness: Math.floor(Math.random() * 11),
        bitterness: Math.floor(Math.random() * 11),
        umami: Math.floor(Math.random() * 11),
        status: ['draft', 'empty', 'ready', 'changed'][Math.floor(Math.random() * 4)],
        handoffOwner: null
    });
}

function computeDerived(records) {
  const readyCount = records.filter(r => r.status === 'ready').length
  const conflictCount = records.filter(r => r.status === 'conflict').length
  return {
    summary: `Total records: ${records.length}, Ready: ${readyCount}, Conflicts: ${conflictCount}`
  }
}

export const useStore = create((set, get) => ({
  records: initialRecords,
  derived: computeDerived(initialRecords),
  history: [],
  selectedRecordId: null,

  setSelectedRecordId: (id) => set({ selectedRecordId: id }),

  addRecord: (record) => set((state) => {
    const newRecords = [...state.records, record]
    return {
      records: newRecords,
      derived: computeDerived(newRecords),
      history: [...state.history, { type: 'records_update', records: state.records }]
    }
  }),

  updateRecord: (id, updates) => set((state) => {
    const newRecords = state.records.map(r => r.id === id ? { ...r, ...updates, status: updates.status || (r.status === 'empty' ? 'draft' : 'changed') } : r)
    return {
      records: newRecords,
      derived: computeDerived(newRecords),
      history: [...state.history, { type: 'records_update', records: state.records }]
    }
  }),

  deleteRecord: (id) => set((state) => {
    const newRecords = state.records.filter(r => r.id !== id)
    return {
      records: newRecords,
      derived: computeDerived(newRecords),
      history: [...state.history, { type: 'records_update', records: state.records }],
      selectedRecordId: state.selectedRecordId === id ? null : state.selectedRecordId
    }
  }),

  // Signature mutation
  connectOwnerAndUpdateReadiness: (id, owner) => set((state) => {
    const record = state.records.find(r => r.id === id)
    if (!record) return state

    // Boundary: conflicting or incomplete mutations rejected (e.g. no owner)
    if (!owner || owner.trim() === '') {
       const newRecords = state.records.map(r => r.id === id ? { ...r, status: 'conflict' } : r)
       return {
          records: newRecords,
          derived: computeDerived(newRecords),
          history: [...state.history, { type: 'records_update', records: state.records, selectedRecordId: state.selectedRecordId }]
       }
    }

    const newRecords = state.records.map(r => r.id === id ? { ...r, handoffOwner: owner, status: 'resolved' } : r)
    return {
      records: newRecords,
      derived: computeDerived(newRecords),
      history: [...state.history, { type: 'records_update', records: state.records, selectedRecordId: state.selectedRecordId }]
    }
  }),

  undo: () => set((state) => {
    if (state.history.length === 0) return state
    const previousState = state.history[state.history.length - 1]
    const newHistory = state.history.slice(0, -1)

    if (previousState.type === 'records_update') {
        return {
            records: previousState.records,
            derived: computeDerived(previousState.records),
            history: newHistory,
            selectedRecordId: previousState.selectedRecordId !== undefined ? previousState.selectedRecordId : state.selectedRecordId
        }
    }
    return state
  }),

  importSession: (sessionData) => {
    try {
        const parsed = RecipeFlavorBalanceStudioSessionSchema.parse(sessionData)

        // Ensure no duplicate IDs
        const ids = new Set()
        for (const r of parsed.records) {
            if (ids.has(r.id)) throw new Error("Duplicate ID")
            ids.add(r.id)
        }

        set({
            records: parsed.records,
            derived: parsed.derived,
            history: parsed.history,
            selectedRecordId: null
        })
        return true
    } catch (e) {
        console.error("Invalid import", e)
        return false // Rejects malformed schema without state change
    }
  },

  exportSession: () => {
    const state = get()
    return {
      schemaVersion: "v1",
      exportedAt: new Date().toISOString(),
      records: state.records,
      derived: state.derived,
      history: state.history
    }
  }
}))
