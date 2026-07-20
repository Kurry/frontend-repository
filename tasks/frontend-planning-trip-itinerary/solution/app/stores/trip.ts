import { defineStore } from 'pinia'
import { v4 as uuidv4 } from 'uuid'

export interface Stop {
  id: string
  title: string
  day: string
  location?: string
  notes?: string
  startTime?: string
  endTime?: string
  category: 'sightseeing' | 'dining' | 'lodging' | 'transport' | 'other'
}

export interface Expense {
  id: string
  description: string
  amount: number
  currency: 'EUR' | 'USD' | 'GBP' | 'CHF'
  day: string
  category: 'Lodging' | 'Food' | 'Transit' | 'Activities'
  payer: 'Ava' | 'Ben' | 'Chloe' | 'Dan'
  splitMode: 'per-capita' | 'weighted'
  weights?: {
    Ava: number
    Ben: number
    Chloe: number
    Dan: number
  }
}

export type CustomFieldType = 'text' | 'number' | 'rating'
export interface CustomField {
  id: string
  name: string
  type: CustomFieldType
}

export interface PackingItem {
  id: string
  text: string
  packed: boolean
  category: string
}

export interface TripState {
  stops: Stop[]
  expenses: Expense[]
  selectedDay: string | null
  activeMode: 'Plan List' | 'Map' | 'Budget' | 'Spreadsheet'
  selectedStopId: string | null
  activeDetailTab: 'About' | 'Book' | 'Reviews' | 'Photos' | 'Mentions'
  theme: 'light' | 'dark'
  settledTransactions: string[]
  customFields: CustomField[]
  packingItems: PackingItem[]
  toasts: { id: string; message: string }[]
  historyStack: { stops: Stop[]; expenses: Expense[] }[]
  redoStack: { stops: Stop[]; expenses: Expense[] }[]
}

const tripDates = [
  '2025-07-05',
  '2025-07-06',
  '2025-07-07',
  '2025-07-08',
  '2025-07-09',
  '2025-07-10',
  '2025-07-11'
]

const getInitialState = (): TripState => {
  return {
    stops: [
      { id: uuidv4(), title: 'Nice Airport Arrival', day: '2025-07-05', category: 'transport', location: 'NCE' },
      { id: uuidv4(), title: 'Check-in Hotel Negresco', day: '2025-07-05', category: 'lodging' },
      { id: uuidv4(), title: 'Promenade des Anglais Walk', day: '2025-07-05', category: 'sightseeing' },
      { id: uuidv4(), title: 'Dinner at La Petite Maison', day: '2025-07-05', category: 'dining' },
      { id: uuidv4(), title: 'Monaco Day Trip', day: '2025-07-06', category: 'sightseeing' },
      { id: uuidv4(), title: 'Casino Monte Carlo', day: '2025-07-06', category: 'sightseeing' },
      { id: uuidv4(), title: 'Cannes Film Festival Palais', day: '2025-07-07', category: 'sightseeing' },
      { id: uuidv4(), title: 'Musee Picasso', day: '2025-07-08', category: 'sightseeing', location: 'Antibes' },
      { id: uuidv4(), title: 'Eze Village Tour', day: '2025-07-09', category: 'sightseeing' },
      { id: uuidv4(), title: 'Saint-Tropez Beach Day', day: '2025-07-10', category: 'other' },
      { id: uuidv4(), title: 'Menton Lemon Festival Area', day: '2025-07-11', category: 'sightseeing' },
      { id: uuidv4(), title: 'Departure NCE', day: '2025-07-11', category: 'transport' }
    ],
    expenses: [
      { id: uuidv4(), description: 'Flights', amount: 800, currency: 'USD', day: '2025-07-05', category: 'Transit', payer: 'Ava', splitMode: 'per-capita' },
      { id: uuidv4(), description: 'Hotel Negresco Deposit', amount: 1200, currency: 'EUR', day: '2025-07-05', category: 'Lodging', payer: 'Ben', splitMode: 'per-capita' },
      { id: uuidv4(), description: 'Dinner La Petite Maison', amount: 250, currency: 'EUR', day: '2025-07-05', category: 'Food', payer: 'Chloe', splitMode: 'per-capita' },
      { id: uuidv4(), description: 'Train to Monaco', amount: 45, currency: 'EUR', day: '2025-07-06', category: 'Transit', payer: 'Dan', splitMode: 'per-capita' },
      { id: uuidv4(), description: 'Casino Entry', amount: 100, currency: 'EUR', day: '2025-07-06', category: 'Activities', payer: 'Ava', splitMode: 'per-capita' },
      { id: uuidv4(), description: 'Lunch Cannes', amount: 180, currency: 'EUR', day: '2025-07-07', category: 'Food', payer: 'Ben', splitMode: 'per-capita' },
      { id: uuidv4(), description: 'Musee Picasso Tickets', amount: 60, currency: 'EUR', day: '2025-07-08', category: 'Activities', payer: 'Chloe', splitMode: 'per-capita' },
      { id: uuidv4(), description: 'Souvenirs Eze', amount: 85, currency: 'EUR', day: '2025-07-09', category: 'Activities', payer: 'Dan', splitMode: 'per-capita' },
      { id: uuidv4(), description: 'Beach Chairs St Tropez', amount: 150, currency: 'EUR', day: '2025-07-10', category: 'Activities', payer: 'Ava', splitMode: 'per-capita' },
      { id: uuidv4(), description: 'Dinner Menton', amount: 200, currency: 'EUR', day: '2025-07-11', category: 'Food', payer: 'Ben', splitMode: 'per-capita' }
    ],
    selectedDay: null,
    activeMode: 'Plan List',
    selectedStopId: null,
    activeDetailTab: 'About',
    theme: 'light',
    settledTransactions: [],
    customFields: [],
    packingItems: [],
    toasts: [],
    historyStack: [],
    redoStack: []
  }
}

export const useTripStore = defineStore('trip', {
  state: (): TripState => getInitialState(),

  getters: {
    visibleStops: (state) => {
      if (state.selectedDay) {
        return state.stops.filter(s => s.day === state.selectedDay)
      }
      return state.stops
    },
    visibleExpenses: (state) => {
      return state.expenses
    }
  },

  actions: {
    pushHistory() {
      this.historyStack.push({
        stops: JSON.parse(JSON.stringify(this.stops)),
        expenses: JSON.parse(JSON.stringify(this.expenses))
      })
      this.redoStack = []
    },

    undo() {
      if (this.historyStack.length === 0) return
      this.redoStack.push({
        stops: JSON.parse(JSON.stringify(this.stops)),
        expenses: JSON.parse(JSON.stringify(this.expenses))
      })
      const prevState = this.historyStack.pop()!
      this.stops = prevState.stops
      this.expenses = prevState.expenses
    },

    redo() {
      if (this.redoStack.length === 0) return
      this.historyStack.push({
        stops: JSON.parse(JSON.stringify(this.stops)),
        expenses: JSON.parse(JSON.stringify(this.expenses))
      })
      const nextState = this.redoStack.pop()!
      this.stops = nextState.stops
      this.expenses = nextState.expenses
    },

    addStop(stop: Omit<Stop, 'id'>) {
      this.pushHistory()
      this.stops.push({ ...stop, id: uuidv4() })
    },

    updateStop(id: string, updates: Partial<Stop>) {
      this.pushHistory()
      const index = this.stops.findIndex(s => s.id === id)
      if (index !== -1) {
        this.stops[index] = { ...this.stops[index], ...updates }
      }
    },

    deleteStop(id: string) {
      this.pushHistory()
      this.stops = this.stops.filter(s => s.id !== id)
      if (this.selectedStopId === id) {
        this.selectedStopId = null
      }
    },

    addExpense(expense: Omit<Expense, 'id'>) {
      this.pushHistory()
      this.expenses.push({ ...expense, id: uuidv4() })
    },

    updateExpense(id: string, updates: Partial<Expense>) {
      this.pushHistory()
      const index = this.expenses.findIndex(e => e.id === id)
      if (index !== -1) {
        this.expenses[index] = { ...this.expenses[index], ...updates }
      }
    },

    deleteExpense(id: string) {
      this.pushHistory()
      this.expenses = this.expenses.filter(e => e.id !== id)
    },

    factoryReset() {
      const initial = getInitialState()
      this.stops = initial.stops
      this.expenses = initial.expenses
      this.selectedDay = initial.selectedDay
      this.activeMode = initial.activeMode
      this.theme = initial.theme
      this.historyStack = []
      this.redoStack = []
      this.settledTransactions = []
    },

    setMode(mode: 'Plan List' | 'Map' | 'Budget' | 'Spreadsheet') {
      this.activeMode = mode
    },

    setDayFilter(day: string | null) {
      this.selectedDay = day
    },

    selectStop(id: string | null) {
      this.selectedStopId = id
    },

    setDetailTab(tab: 'About' | 'Book' | 'Reviews' | 'Photos' | 'Mentions') {
      this.activeDetailTab = tab
    },

    toggleTheme() {
      this.theme = this.theme === 'light' ? 'dark' : 'light'
      if (import.meta.client) {
        if (this.theme === 'dark') {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      }
    },

    showToast(message: string) {
      const id = uuidv4()
      this.toasts.push({ id, message })
      setTimeout(() => {
        this.toasts = this.toasts.filter(t => t.id !== id)
      }, 3000)
    }
  }
})
