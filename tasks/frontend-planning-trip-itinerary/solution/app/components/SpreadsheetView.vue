<template>
  <div class="flex-1 flex flex-col min-w-0 p-4 md:p-6 overflow-y-auto">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold">Spreadsheet</h2>
    </div>

    <!-- Toolbar: Inject, CSV, Sandbox, Receipt, Factory Reset -->
    <div class="flex flex-wrap gap-2 mb-6 p-4 bg-white dark:bg-slate-800 rounded shadow-sm border border-slate-200 dark:border-slate-700">
      <button @click="injectTemplate" class="px-3 py-1.5 bg-indigo-500 text-white text-sm rounded hover:bg-indigo-600">Inject Template</button>
      <button @click="showCsvWizard = true" class="px-3 py-1.5 bg-green-500 text-white text-sm rounded hover:bg-green-600">CSV Wizard</button>
      <button @click="showParsingSandbox = true" class="px-3 py-1.5 bg-purple-500 text-white text-sm rounded hover:bg-purple-600">Text Parser</button>
      <button @click="showReceiptScanner = true" class="px-3 py-1.5 bg-pink-500 text-white text-sm rounded hover:bg-pink-600">Receipt Scanner</button>
      <div class="flex-1"></div>
      <button @click="store.undo" :disabled="store.historyStack.length === 0" class="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm rounded disabled:opacity-50">Undo</button>
      <button @click="store.redo" :disabled="store.redoStack.length === 0" class="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm rounded disabled:opacity-50">Redo</button>
      <button @click="handleFactoryReset" class="px-3 py-1.5 bg-red-500 text-white text-sm rounded hover:bg-red-600">Factory Reset</button>
    </div>

    <!-- Spreadsheet Matrix -->
    <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col flex-1 min-h-[400px]">
      <div class="p-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex gap-2">
        <input v-model="formula" @keyup.enter="computeFormula" placeholder="Enter formula (e.g. =SUM(E2:E5))" class="flex-1 p-1 border rounded text-sm dark:bg-slate-800 dark:border-slate-600" />
        <span class="p-1 px-3 bg-white dark:bg-slate-800 rounded text-sm font-mono border dark:border-slate-600 flex items-center">{{ formulaResult }}</span>
      </div>
      <div class="overflow-auto flex-1 p-0 relative" tabindex="0" @keydown="handleKeydown">
        <table class="w-full text-sm border-collapse">
          <thead>
            <tr>
               <th class="w-10 border-b border-r dark:border-slate-700 bg-slate-100 dark:bg-slate-900"></th>
               <th class="p-2 border-b border-r dark:border-slate-700 bg-slate-100 dark:bg-slate-900 font-normal w-12 text-center text-xs">A</th>
               <th class="p-2 border-b border-r dark:border-slate-700 bg-slate-100 dark:bg-slate-900 font-normal w-32 text-xs">B (Day)</th>
               <th class="p-2 border-b border-r dark:border-slate-700 bg-slate-100 dark:bg-slate-900 font-normal w-64 text-xs">C (Title)</th>
               <th class="p-2 border-b border-r dark:border-slate-700 bg-slate-100 dark:bg-slate-900 font-normal w-32 text-xs">D (Category)</th>
               <th class="p-2 border-b border-r dark:border-slate-700 bg-slate-100 dark:bg-slate-900 font-normal w-32 text-xs">E (Amount)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, rowIdx) in combinedItems" :key="item.id" :class="{'bg-blue-50 dark:bg-blue-900/30': isSelected(rowIdx)}">
              <td class="border-b border-r dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-center text-xs text-slate-400">
                <input type="checkbox" :checked="isSelected(rowIdx)" @change="toggleSelection(rowIdx)" />
              </td>
              <td class="border-b border-r dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-center text-xs text-slate-400">{{ rowIdx + 2 }}</td>
              <td class="border-b border-r dark:border-slate-700 relative p-0" :class="{'ring-2 ring-blue-500 z-10': isActiveCell(rowIdx, 1)}">
                <input v-if="isActiveCell(rowIdx, 1) && isEditing" v-model="editValue" @blur="commitEdit(item, 'day')" @keyup.enter="commitEdit(item, 'day')" @keyup.esc="cancelEdit" class="absolute inset-0 w-full h-full p-2 bg-white dark:bg-slate-800 outline-none" autofocus />
                <div v-else class="p-2 truncate cursor-cell min-h-[36px]" @click="activateCell(rowIdx, 1)" @dblclick="startEdit(item, 'day')">{{ item.day }}</div>
              </td>
              <td class="border-b border-r dark:border-slate-700 relative p-0" :class="{'ring-2 ring-blue-500 z-10': isActiveCell(rowIdx, 2)}">
                <input v-if="isActiveCell(rowIdx, 2) && isEditing" v-model="editValue" @blur="commitEdit(item, 'title')" @keyup.enter="commitEdit(item, 'title')" @keyup.esc="cancelEdit" class="absolute inset-0 w-full h-full p-2 bg-white dark:bg-slate-800 outline-none" autofocus />
                <div v-else class="p-2 truncate cursor-cell min-h-[36px]" @click="activateCell(rowIdx, 2)" @dblclick="startEdit(item, 'title')">{{ item.title }}</div>
              </td>
              <td class="border-b border-r dark:border-slate-700 relative p-0" :class="{'ring-2 ring-blue-500 z-10': isActiveCell(rowIdx, 3)}">
                <input v-if="isActiveCell(rowIdx, 3) && isEditing" v-model="editValue" @blur="commitEdit(item, 'category')" @keyup.enter="commitEdit(item, 'category')" @keyup.esc="cancelEdit" class="absolute inset-0 w-full h-full p-2 bg-white dark:bg-slate-800 outline-none" autofocus />
                <div v-else class="p-2 truncate cursor-cell min-h-[36px]" @click="activateCell(rowIdx, 3)" @dblclick="startEdit(item, 'category')">{{ item.category }}</div>
              </td>
              <td class="border-b border-r dark:border-slate-700 relative p-0 text-right" :class="{'ring-2 ring-blue-500 z-10': isActiveCell(rowIdx, 4)}">
                <input v-if="isActiveCell(rowIdx, 4) && isEditing && item._type === 'expense'" v-model="editValue" type="number" step="0.01" @blur="commitEdit(item, 'amount')" @keyup.enter="commitEdit(item, 'amount')" @keyup.esc="cancelEdit" class="absolute inset-0 w-full h-full p-2 text-right bg-white dark:bg-slate-800 outline-none" autofocus />
                <div v-else class="p-2 truncate cursor-cell min-h-[36px]" @click="activateCell(rowIdx, 4)" @dblclick="item._type === 'expense' && startEdit(item, 'amount')">{{ item.amount !== undefined ? Number(item.amount).toFixed(2) : '-' }}</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Bulk mutations tray -->
      <transition name="slide-up">
        <div v-if="selectedRows.size > 1" class="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-4 z-30">
          <span class="font-bold">{{ selectedRows.size }} selected</span>
          <div class="h-4 w-px bg-slate-600"></div>
          <button @click="bulkDelete" class="hover:text-red-400 text-sm font-semibold">Delete</button>
          <button @click="bulkRecategorize" class="hover:text-blue-400 text-sm font-semibold">Recategorize</button>
          <button @click="bulkReassignDay" class="hover:text-blue-400 text-sm font-semibold">Reassign Day</button>
          <button @click="selectedRows.clear()" class="ml-2 hover:text-slate-300"><IconX class="w-4 h-4" /></button>
        </div>
      </transition>
    </div>

    <!-- Modals -->
    <Dialog v-model:visible="showParsingSandbox" header="Text Parsing Sandbox" modal class="w-full max-w-2xl">
      <div class="space-y-4">
        <textarea v-model="sandboxText" class="w-full h-32 p-3 border rounded font-mono text-sm dark:bg-slate-900" placeholder="Paste confirmation here..."></textarea>
        <button @click="parseSandboxText" class="px-4 py-2 bg-primary text-white rounded">Extract</button>
        <div v-if="extractedDrafts.length > 0" class="space-y-3">
          <div v-for="(draft, idx) in extractedDrafts" :key="idx" class="p-3 bg-slate-50 dark:bg-slate-700 rounded border border-slate-200">
             <p class="font-bold text-sm mb-2 text-primary">Draft Item extracted:</p>
             <p class="text-sm">Date: <span class="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">{{ draft.day }}</span></p>
             <p class="text-sm">Title: {{ draft.title }}</p>
             <p class="text-sm" v-if="draft.amount">Amount: <span class="bg-green-200 dark:bg-green-800 px-1 rounded">{{ draft.amount }}</span></p>
             <div class="flex gap-2 mt-3">
               <button @click="acceptDraft(idx)" class="px-3 py-1 bg-green-500 text-white rounded text-sm">Accept</button>
               <button @click="discardDraft(idx)" class="px-3 py-1 bg-slate-300 text-slate-800 rounded text-sm">Discard</button>
             </div>
          </div>
        </div>
        <p v-else-if="didParse" class="text-sm text-slate-500">No items detected.</p>
      </div>
    </Dialog>

    <Dialog v-model:visible="showCsvWizard" header="CSV Import Wizard" modal class="w-full max-w-2xl">
      <div v-if="csvStep === 1" class="space-y-4">
        <p class="text-sm">Paste CSV Data (Day, Description, Amount, Category)</p>
        <textarea v-model="csvText" class="w-full h-32 p-3 border rounded font-mono text-sm dark:bg-slate-900"></textarea>
        <div class="flex justify-end">
          <button @click="processCsvStep1" class="px-4 py-2 bg-primary text-white rounded">Next</button>
        </div>
      </div>
      <div v-else class="space-y-4">
        <p class="text-sm font-bold text-red-500" v-if="csvErrors.length > 0">Diagnostics: Please fix errors before committing.</p>
        <div class="max-h-64 overflow-y-auto border rounded p-2">
           <div v-for="(row, i) in csvRows" :key="i" class="flex gap-2 mb-2 items-center p-2 rounded" :class="row.error ? 'bg-red-50 dark:bg-red-900/20' : 'bg-slate-50 dark:bg-slate-800'">
              <input v-model="row.day" class="w-24 p-1 border rounded text-sm" />
              <input v-model="row.desc" class="flex-1 p-1 border rounded text-sm" />
              <input v-model="row.amount" class="w-20 p-1 border rounded text-sm" />
              <input v-model="row.category" class="w-24 p-1 border rounded text-sm" />
              <span v-if="row.error" class="text-xs text-red-500 w-24">{{ row.error }}</span>
              <span v-else class="text-xs text-green-500 w-24">OK</span>
           </div>
        </div>
        <div class="flex justify-between items-center">
           <button @click="validateCsv" class="px-3 py-1 bg-slate-200 text-slate-800 rounded text-sm">Re-validate</button>
           <button @click="commitCsv" class="px-4 py-2 bg-green-500 text-white rounded flex items-center gap-2" :disabled="csvErrors.length > 0 || isBusy">
             <IconLoader2 v-if="isBusy" class="w-4 h-4 animate-spin" /> Commit
           </button>
        </div>
      </div>
    </Dialog>

    <Dialog v-model:visible="showReceiptScanner" header="Receipt Scanner" modal class="w-full max-w-lg">
      <div class="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-8 text-center bg-slate-50 dark:bg-slate-800 relative min-h-[200px] flex items-center justify-center">
         <div v-if="!isBusy && !receiptDraft" class="flex flex-col items-center justify-center">
           <IconCamera class="w-12 h-12 text-slate-400 mb-2" />
           <p class="text-sm text-slate-500">Drop an image placeholder here</p>
           <button @click="scanReceipt" class="mt-4 px-4 py-2 bg-primary text-white rounded text-sm">Simulate Scan</button>
         </div>
         <div v-else-if="isBusy" class="flex flex-col items-center justify-center">
           <IconLoader2 class="w-12 h-12 text-primary animate-spin mb-2" />
           <p class="text-sm text-slate-500">Extracting data...</p>
         </div>
         <div v-else-if="receiptDraft" class="text-left w-full z-10">
            <p class="font-bold text-sm mb-4">Extracted Expense:</p>
            <div class="space-y-2 mb-4">
              <div><label class="text-xs text-slate-500">Date</label><input v-model="receiptDraft.day" class="w-full p-1 border rounded text-sm" /></div>
              <div><label class="text-xs text-slate-500">Amount (EUR)</label><input v-model="receiptDraft.amount" class="w-full p-1 border rounded text-sm" /></div>
            </div>
            <div class="flex gap-2">
               <button @click="acceptReceipt" class="px-4 py-2 bg-green-500 text-white rounded text-sm">Confirm & Join Ledger</button>
               <button @click="receiptDraft = null" class="px-4 py-2 bg-slate-300 text-slate-800 rounded text-sm">Discard</button>
            </div>
         </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { useTripStore } from '~/stores/trip'
import { IconX, IconLoader2, IconCamera } from '@tabler/icons-vue'

const store = useTripStore()

// Spreadsheet Matrix State
const formula = ref('')
const formulaResult = ref<number | string>('')
const activeRow = ref(0)
const activeCol = ref(1)
const isEditing = ref(false)
const editValue = ref('')
const selectedRows = ref<Set<number>>(new Set())

const combinedItems = computed(() => {
  const stops = store.stops.map(s => ({ ...s, _type: 'stop', title: s.title }))
  const expenses = store.expenses.map(e => ({ ...e, _type: 'expense', title: e.description }))
  return [...stops, ...expenses].sort((a, b) => a.day.localeCompare(b.day))
})

const isActiveCell = (row: number, col: number) => activeRow.value === row && activeCol.value === col
const isSelected = (row: number) => selectedRows.value.has(row)

const activateCell = (row: number, col: number) => {
  if (isEditing.value) return
  activeRow.value = row
  activeCol.value = col
}

const toggleSelection = (row: number) => {
  if (selectedRows.value.has(row)) {
    selectedRows.value.delete(row)
  } else {
    selectedRows.value.add(row)
  }
}

const startEdit = (item: any, field: string) => {
  isEditing.value = true
  editValue.value = String(item[field] || '')
  nextTick(() => {
    // Focus handled by autofocus on the v-if input
  })
}

const commitEdit = (item: any, field: string) => {
  if (!isEditing.value) return
  isEditing.value = false

  if (item._type === 'stop') {
    store.updateStop(item.id, { [field]: editValue.value })
  } else {
    store.updateExpense(item.id, { [field]: field === 'amount' ? parseFloat(editValue.value) || 0 : editValue.value })
  }
}

const cancelEdit = () => {
  isEditing.value = false
}

const handleKeydown = (e: KeyboardEvent) => {
  if (isEditing.value) return

  if (e.key === 'ArrowDown') { e.preventDefault(); activeRow.value = Math.min(activeRow.value + 1, combinedItems.value.length - 1) }
  if (e.key === 'ArrowUp') { e.preventDefault(); activeRow.value = Math.max(activeRow.value - 1, 0) }
  if (e.key === 'ArrowRight') { e.preventDefault(); activeCol.value = Math.min(activeCol.value + 1, 4) }
  if (e.key === 'ArrowLeft') { e.preventDefault(); activeCol.value = Math.max(activeCol.value - 1, 1) }
  if (e.key === 'Enter') {
     e.preventDefault()
     const item = combinedItems.value[activeRow.value]
     const fieldMap = { 1: 'day', 2: 'title', 3: 'category', 4: 'amount' }
     if (activeCol.value === 4 && item._type === 'stop') return
     startEdit(item, fieldMap[activeCol.value as keyof typeof fieldMap])
  }
  if (e.key === 'Escape') {
      cancelEdit()
  }
}

const computeFormula = () => {
  const match = formula.value.match(/^=(SUM|AVERAGE)\(([A-E])(\d+):([A-E])(\d+)\)$/i)
  if (match) {
    const [_, func, startColLetter, startRowStr, endColLetter, endRowStr] = match

    // Only support column E (amount) for simplicity in demo
    if (startColLetter.toUpperCase() === 'E' && endColLetter.toUpperCase() === 'E') {
        const startRow = parseInt(startRowStr, 10) - 2
        const endRow = parseInt(endRowStr, 10) - 2

        let validAmounts: number[] = []
        for (let i = Math.max(0, startRow); i <= Math.min(endRow, combinedItems.value.length - 1); i++) {
           const item = combinedItems.value[i]
           if (item._type === 'expense' && typeof item.amount === 'number') {
               validAmounts.push(item.amount)
           }
        }

        const sum = validAmounts.reduce((a, b) => a + b, 0)

        if (func.toUpperCase() === 'SUM') {
            formulaResult.value = sum.toFixed(2)
        } else if (func.toUpperCase() === 'AVERAGE') {
            formulaResult.value = validAmounts.length ? (sum / validAmounts.length).toFixed(2) : 0
        }
        return
    }
  }

  formulaResult.value = 'ERR'
}

// Bulk Actions
const bulkDelete = () => {
  if (!confirm('Delete selected items?')) return
  store.pushHistory()
  const toDelete = Array.from(selectedRows.value).map(idx => combinedItems.value[idx])
  toDelete.forEach(item => {
    if (item._type === 'stop') store.stops = store.stops.filter(s => s.id !== item.id)
    else store.expenses = store.expenses.filter(e => e.id !== item.id)
  })
  selectedRows.value.clear()
}

const bulkRecategorize = () => {
  const cat = prompt('Enter new category:')
  if (!cat) return
  store.pushHistory()
  const toUpdate = Array.from(selectedRows.value).map(idx => combinedItems.value[idx])
  toUpdate.forEach(item => {
    if (item._type === 'stop') store.updateStop(item.id, { category: cat as any })
    else store.updateExpense(item.id, { category: cat as any })
  })
  selectedRows.value.clear()
}

const bulkReassignDay = () => {
  const day = prompt('Enter new day (e.g. 2025-07-06):')
  if (!day) return
  store.pushHistory()
  const toUpdate = Array.from(selectedRows.value).map(idx => combinedItems.value[idx])
  toUpdate.forEach(item => {
    if (item._type === 'stop') store.updateStop(item.id, { day })
    else store.updateExpense(item.id, { day })
  })
  selectedRows.value.clear()
}

// Sandbox, CSV, Template, Scanner, Reset
const showParsingSandbox = ref(false)
const sandboxText = ref('')
const extractedDrafts = ref<any[]>([])
const didParse = ref(false)

const parseSandboxText = () => {
  didParse.value = true
  extractedDrafts.value = []

  // Real regex parsing matching dates and prices
  const dateRegex = /2025-07-0[5-9]|2025-07-1[0-1]/g
  const priceRegex = /(?:EUR|€|\$|USD)\s*(\d+(?:\.\d{2})?)/g
  const codeRegex = /[A-Z0-9]{6}/g

  const dates = [...sandboxText.value.matchAll(dateRegex)].map(m => m[0])
  const prices = [...sandboxText.value.matchAll(priceRegex)].map(m => parseFloat(m[1]))
  const codes = [...sandboxText.value.matchAll(codeRegex)].map(m => m[0])

  if (dates.length > 0) {
      const item: any = { day: dates[0], title: 'Parsed Item ' + (codes[0] || ''), category: 'other' }
      if (prices.length > 0) {
          item.amount = prices[0]
      }
      extractedDrafts.value.push(item)
  }
}

const acceptDraft = (idx: number) => {
  const draft = extractedDrafts.value[idx]
  if (draft.amount) {
      store.addExpense({
          day: draft.day,
          description: draft.title,
          amount: draft.amount,
          category: 'Activities',
          currency: 'EUR',
          payer: 'Ava',
          splitMode: 'per-capita'
      })
  } else {
      store.addStop({
          day: draft.day,
          title: draft.title,
          category: 'other'
      })
  }
  discardDraft(idx)
  store.showToast('Parsed item added to itinerary')
}

const discardDraft = (idx: number) => {
  extractedDrafts.value.splice(idx, 1)
  if (extractedDrafts.value.length === 0) {
      showParsingSandbox.value = false
  }
}

const showCsvWizard = ref(false)
const csvStep = ref(1)
const csvText = ref("2025-07-06,Train Ticket,45.00,Transit\n2025-07-06,Lunch,XYZ,Food")
const csvRows = ref<any[]>([])
const csvErrors = ref<string[]>([])
const isBusy = ref(false)

const processCsvStep1 = () => {
  const lines = csvText.value.split('\n').filter(l => l.trim())
  csvRows.value = lines.map(l => {
    const parts = l.split(',')
    return { day: parts[0] || '', desc: parts[1] || '', amount: parts[2] || '', category: parts[3] || '', error: '' }
  })
  validateCsv()
  csvStep.value = 2
}

const validateCsv = () => {
  csvErrors.value = []
  csvRows.value.forEach(row => {
    row.error = ''
    if (!row.day.startsWith('2025-07-')) row.error = 'Invalid date'
    else if (isNaN(parseFloat(row.amount))) row.error = 'Invalid amount'
    else if (!['Lodging', 'Food', 'Transit', 'Activities'].includes(row.category)) row.error = 'Invalid category'

    if (row.error) csvErrors.value.push(row.error)
  })
}

const commitCsv = () => {
  if (csvErrors.value.length > 0) return
  isBusy.value = true
  setTimeout(() => {
    store.pushHistory()
    csvRows.value.forEach(row => {
      store.addExpense({
        day: row.day,
        description: row.desc,
        amount: parseFloat(row.amount),
        category: row.category,
        currency: 'EUR',
        payer: 'Ava',
        splitMode: 'per-capita'
      })
    })
    isBusy.value = false
    showCsvWizard.value = false
    csvStep.value = 1
    store.showToast('CSV items committed')
  }, 600)
}

const injectTemplate = () => {
  if (!confirm('Inject sample template?')) return
  isBusy.value = true
  store.showToast('Injecting template...')
  setTimeout(() => {
    store.pushHistory()
    store.addStop({ title: 'Template Stop', day: '2025-07-06', category: 'sightseeing' })
    store.addExpense({ description: 'Template Expense', amount: 50, currency: 'EUR', day: '2025-07-06', category: 'Activities', payer: 'Dan', splitMode: 'per-capita' })
    isBusy.value = false
  }, 400)
}

const showReceiptScanner = ref(false)
const receiptDraft = ref<any>(null)

const scanReceipt = () => {
  isBusy.value = true
  setTimeout(() => {
    isBusy.value = false
    receiptDraft.value = { day: '2025-07-07', amount: 89.50, description: 'Scanned Receipt' }
  }, 800)
}

const acceptReceipt = () => {
  store.addExpense({
    day: receiptDraft.value.day,
    amount: parseFloat(receiptDraft.value.amount),
    description: receiptDraft.value.description,
    currency: 'EUR',
    category: 'Food',
    payer: 'Ava',
    splitMode: 'per-capita'
  })
  receiptDraft.value = null
  showReceiptScanner.value = false
  store.showToast('Receipt added to ledger')
}

const handleFactoryReset = () => {
  if (confirm('Are you sure you want to reset all data to initial seed?')) {
    store.factoryReset()
    store.showToast('App reset to factory defaults')
  }
}
</script>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.2s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translate(-50%, 20px);
}
</style>
