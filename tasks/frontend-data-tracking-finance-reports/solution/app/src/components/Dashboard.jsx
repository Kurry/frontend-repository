import { h } from 'preact';
import { displayTotals, displayCurrency } from '../state.js';
import { Icon } from '@iconify/react';
import { ChartPanel } from './ChartPanel.jsx';
import { ThresholdsPanel } from './ThresholdsPanel.jsx';

export function Dashboard() {
  const currencySymbols = { USD: '$', EUR: '€', GBP: '£' };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: displayCurrency.value,
      minimumFractionDigits: 2
    }).format(val);
  };

  const totals = displayTotals.value;

  return (
    <div class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="card bg-base-100 shadow-sm border border-base-200">
          <div class="card-body p-4">
            <div class="flex items-center gap-2 text-base-content/70 mb-2">
              <Icon icon="mdi:arrow-down-circle" class="text-success text-xl" />
              <h3 class="font-medium text-sm">Total Income</h3>
            </div>
            <div class="text-2xl font-bold text-success">{formatCurrency(totals.income)}</div>
          </div>
        </div>

        <div class="card bg-base-100 shadow-sm border border-base-200">
          <div class="card-body p-4">
            <div class="flex items-center gap-2 text-base-content/70 mb-2">
              <Icon icon="mdi:arrow-up-circle" class="text-error text-xl" />
              <h3 class="font-medium text-sm">Total Spending</h3>
            </div>
            <div class="text-2xl font-bold text-error">{formatCurrency(totals.expenses)}</div>
          </div>
        </div>

        <div class="card bg-base-100 shadow-sm border border-base-200">
          <div class="card-body p-4">
            <div class="flex items-center gap-2 text-base-content/70 mb-2">
              <Icon icon="mdi:scale-balance" class="text-info text-xl" />
              <h3 class="font-medium text-sm">Net Balance</h3>
            </div>
            <div class="text-2xl font-bold">{formatCurrency(totals.net)}</div>
          </div>
        </div>

        <div class="card bg-base-100 shadow-sm border border-base-200">
          <div class="card-body p-4">
            <div class="flex items-center gap-2 text-base-content/70 mb-2">
              <Icon icon="mdi:format-list-checks" class="text-warning text-xl" />
              <h3 class="font-medium text-sm">Transactions</h3>
            </div>
            <div class="text-2xl font-bold">{totals.count}</div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 card bg-base-100 shadow-sm border border-base-200">
           <ChartPanel />
        </div>
        <div class="lg:col-span-1 card bg-base-100 shadow-sm border border-base-200">
           <ThresholdsPanel formatCurrency={formatCurrency} />
        </div>
      </div>
    </div>
  );
}
