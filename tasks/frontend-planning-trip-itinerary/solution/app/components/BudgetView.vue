<template>
  <div class="flex-1 flex flex-col min-w-0 p-4 md:p-6 overflow-y-auto">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold">Budget & Ledger</h2>
      <button @click="isCreating = true" class="px-4 py-2 bg-primary text-white rounded shadow-md hover:bg-primary/90 flex items-center gap-2">
        <IconPlus class="w-4 h-4" /> Add Expense
      </button>
    </div>

    <transition name="slide-down">
      <div v-if="isCreating" class="mb-8">
        <ExpenseForm @submit="handleCreate" @cancel="isCreating = false" />
      </div>
    </transition>

    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
      <!-- Ledger Grid -->
      <div class="xl:col-span-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
        <div class="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <h3 class="font-bold text-lg">Ledger</h3>
          <p class="text-sm font-semibold text-slate-500">Total: {{ totalEur.toFixed(2) }} EUR</p>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm text-left">
            <thead class="bg-slate-50 dark:bg-slate-900 text-slate-500 uppercase">
              <tr>
                <th class="px-4 py-3">Date</th>
                <th class="px-4 py-3">Description</th>
                <th class="px-4 py-3">Category</th>
                <th class="px-4 py-3">Amount</th>
                <th class="px-4 py-3">Paid By</th>
                <th class="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="expense in store.visibleExpenses" :key="expense.id">
                <tr v-if="editingId === expense.id" class="border-b dark:border-slate-700">
                  <td colspan="6" class="p-4">
                    <ExpenseForm :expense="expense" @submit="handleUpdate(expense.id, $event)" @cancel="editingId = null" />
                  </td>
                </tr>
                <tr v-else class="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <td class="px-4 py-3">{{ formatShortDay(expense.day) }}</td>
                  <td class="px-4 py-3 font-medium">{{ expense.description }}</td>
                  <td class="px-4 py-3"><span class="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-xs">{{ expense.category }}</span></td>
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-1">
                      {{ expense.amount.toFixed(2) }}
                      <select v-model="expense.currency" @change="store.updateExpense(expense.id, { currency: expense.currency })" class="bg-transparent border-none text-xs font-semibold focus:ring-0">
                        <option value="EUR">EUR</option>
                        <option value="USD">USD</option>
                        <option value="GBP">GBP</option>
                        <option value="CHF">CHF</option>
                      </select>
                    </div>
                    <div v-if="expense.currency !== 'EUR'" class="text-xs text-slate-400">≈ {{ convertToEur(expense.amount, expense.currency).toFixed(2) }} EUR</div>
                  </td>
                  <td class="px-4 py-3">{{ expense.payer }}</td>
                  <td class="px-4 py-3 flex gap-2">
                    <button @click="editingId = expense.id" class="text-blue-500 hover:text-blue-700"><IconEdit class="w-4 h-4" /></button>
                    <button @click="handleDelete(expense.id)" class="text-red-500 hover:text-red-700"><IconTrash class="w-4 h-4" /></button>
                  </td>
                </tr>
              </template>
              <tr v-if="store.visibleExpenses.length === 0">
                <td colspan="6" class="px-4 py-8 text-center text-slate-500">No expenses yet.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Balances and FX -->
      <div class="space-y-6">
        <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
          <h3 class="font-bold text-lg mb-4">Settle Up</h3>
          <div class="mb-4">
             <p class="text-sm text-slate-500 mb-2">Transactions count: {{ outstandingSettlements.length }}</p>
             <div class="space-y-2">
               <div v-for="(tx, idx) in settlements" :key="idx" class="flex justify-between items-center text-sm p-2 rounded bg-slate-50 dark:bg-slate-700">
                  <span :class="{'line-through opacity-50': store.settledTransactions.includes(tx.id)}">
                    <strong>{{ tx.from }}</strong> owes <strong>{{ tx.to }}</strong> €{{ tx.amount.toFixed(2) }}
                  </span>
                  <button
                    @click="toggleSettled(tx.id)"
                    class="text-xs px-2 py-1 rounded"
                    :class="store.settledTransactions.includes(tx.id) ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-300'"
                  >
                    {{ store.settledTransactions.includes(tx.id) ? 'Settled' : 'Mark settled' }}
                  </button>
               </div>
               <div v-if="outstandingSettlements.length === 0" class="text-sm text-slate-500">All settled up!</div>
             </div>
          </div>
        </div>

        <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
          <h3 class="font-bold text-lg mb-4">FX Rates (to 1 EUR)</h3>
          <ul class="text-sm space-y-2">
            <li class="flex justify-between"><span>USD</span> <span>{{ fxRates.USD }}</span></li>
            <li class="flex justify-between"><span>GBP</span> <span>{{ fxRates.GBP }}</span></li>
            <li class="flex justify-between"><span>CHF</span> <span>{{ fxRates.CHF }}</span></li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Charts -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
      <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 h-80">
        <h3 class="font-bold text-lg mb-4">Burn Rate</h3>
        <Line :data="burnRateData" :options="burnRateOptions" />
      </div>
      <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 h-80 flex flex-col">
        <h3 class="font-bold text-lg mb-4">Category Allocation</h3>
        <div class="flex-1 min-h-0">
          <Pie :data="pieData" :options="pieOptions" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTripStore } from '~/stores/trip'
import { format, parseISO } from 'date-fns'
import { IconPlus, IconEdit, IconTrash } from '@tabler/icons-vue'
import { Line, Pie } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

const store = useTripStore()
const isCreating = ref(false)
const editingId = ref<string | null>(null)

const fxRates = {
  EUR: 1,
  USD: 1.10,
  GBP: 0.85,
  CHF: 0.95
}

const convertToEur = (amount: number, currency: string) => {
  return amount / (fxRates[currency as keyof typeof fxRates] || 1)
}

const formatShortDay = (dateStr: string) => {
  return format(parseISO(dateStr), 'M/d')
}

const totalEur = computed(() => {
  return store.expenses.reduce((sum, exp) => sum + convertToEur(exp.amount, exp.currency), 0)
})

const handleCreate = (values: any) => {
  store.addExpense(values)
  isCreating.value = false
}

const handleUpdate = (id: string, values: any) => {
  store.updateExpense(id, values)
  editingId.value = null
}

const handleDelete = (id: string) => {
  if (confirm('Are you sure you want to delete this expense?')) {
    store.deleteExpense(id)
  }
}

// Settlement logic
const settlements = computed(() => {
  const travelers = ['Ava', 'Ben', 'Chloe', 'Dan']
  const balances: Record<string, number> = { Ava: 0, Ben: 0, Chloe: 0, Dan: 0 }

  store.expenses.forEach(exp => {
    const eurAmt = convertToEur(exp.amount, exp.currency)
    balances[exp.payer] += eurAmt

    if (exp.splitMode === 'per-capita') {
      const split = eurAmt / 4
      travelers.forEach(t => balances[t] -= split)
    } else if (exp.splitMode === 'weighted' && exp.weights) {
      const totalWeight = Object.values(exp.weights).reduce((a: any, b: any) => a + b, 0) as number
      if (totalWeight > 0) {
        travelers.forEach(t => {
          const weight = (exp.weights as any)[t] || 0
          balances[t] -= eurAmt * (weight / totalWeight)
        })
      } else {
        // Guard against a zero weight sum (would divide by zero and produce NaN
        // balances); fall back to an equal split so balances stay consistent
        const split = eurAmt / travelers.length
        travelers.forEach(t => balances[t] -= split)
      }
    }
  })

  const debtors = Object.keys(balances).filter(t => balances[t] < -0.01).map(t => ({ name: t, amount: -balances[t] }))
  const creditors = Object.keys(balances).filter(t => balances[t] > 0.01).map(t => ({ name: t, amount: balances[t] }))

  debtors.sort((a, b) => b.amount - a.amount)
  creditors.sort((a, b) => b.amount - a.amount)

  const txs = []
  let i = 0, j = 0
  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i]
    const creditor = creditors[j]
    const amount = Math.min(debtor.amount, creditor.amount)

    if (amount > 0.01) {
      // Id is keyed by the debtor/creditor pair only (not the computed amount) so a
      // ledger edit that changes balances doesn't regenerate the id and desync
      // previously marked-settled transactions from the recomputed settlement list.
      txs.push({
        id: `${debtor.name}-${creditor.name}`,
        from: debtor.name,
        to: creditor.name,
        amount
      })
    }

    debtor.amount -= amount
    creditor.amount -= amount

    if (debtor.amount < 0.01) i++
    if (creditor.amount < 0.01) j++
  }

  return txs
})

const outstandingSettlements = computed(() => {
  return settlements.value.filter(tx => !store.settledTransactions.includes(tx.id))
})

const toggleSettled = (id: string) => {
  const idx = store.settledTransactions.indexOf(id)
  if (idx > -1) {
    store.settledTransactions.splice(idx, 1)
  } else {
    store.settledTransactions.push(id)
  }
}

// Chart Data
const burnRateData = computed(() => {
  const dates = ['2025-07-05', '2025-07-06', '2025-07-07', '2025-07-08', '2025-07-09', '2025-07-10', '2025-07-11']
  const cumulative = []
  let sum = 0
  for (const d of dates) {
    const dayTotal = store.expenses.filter(e => e.day === d).reduce((s, e) => s + convertToEur(e.amount, e.currency), 0)
    sum += dayTotal
    cumulative.push(sum)
  }

  return {
    labels: dates.map(formatShortDay),
    datasets: [
      {
        label: 'Cumulative Spend (EUR)',
        data: cumulative,
        borderColor: '#1B4D6E',
        backgroundColor: 'rgba(27, 77, 110, 0.1)',
        fill: true,
        tension: 0.1
      },
      {
        label: 'Budget Ceiling',
        data: Array(7).fill(4500),
        borderColor: '#ef4444',
        borderDash: [5, 5],
        pointRadius: 0,
        fill: false
      }
    ]
  }
})

const burnRateOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom' as const }
  }
}

const pieData = computed(() => {
  const cats = ['Lodging', 'Food', 'Transit', 'Activities']
  const data = cats.map(c => store.expenses.filter(e => e.category === c).reduce((s, e) => s + convertToEur(e.amount, e.currency), 0))
  return {
    labels: cats,
    datasets: [
      {
        data,
        backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6']
      }
    ]
  }
})

const pieOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'right' as const }
  }
}
</script>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>
