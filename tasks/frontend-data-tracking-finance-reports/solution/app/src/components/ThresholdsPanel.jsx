import { h } from 'preact';
import { useState } from 'preact/hooks';
import { computedThresholds, displayCurrency, fxRates, updateThresholdCeiling, showToast } from '../state.js';
import { Icon } from '@iconify/react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const schema = z.object({
    ceiling: z.number().positive('Ceiling must be a positive number')
});

export function ThresholdsPanel({ formatCurrency }) {
  const thresholds = computedThresholds.value;
  const rate = fxRates[displayCurrency.value];
  const [editingCategory, setEditingCategory] = useState(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
      resolver: zodResolver(schema)
  });

  const handleEditClick = (th) => {
      setEditingCategory(th.category);
      reset({ ceiling: Number((th.ceiling * rate).toFixed(2)) });
  };

  const onSubmit = (data, category) => {
      const newBaseValue = data.ceiling / rate;
      updateThresholdCeiling(category, newBaseValue);
      setEditingCategory(null);
      showToast(`Threshold updated for ${category}`);
  };

  return (
    <div class="p-6 h-96 flex flex-col">
      <h2 class="text-lg font-bold mb-4">Budget Thresholds</h2>
      <div class="flex-1 overflow-y-auto space-y-4">
        {thresholds.map(th => {
          const mtd = th.monthToDate * rate;
          const ceil = th.ceiling * rate;
          const pct = Math.min((mtd / ceil) * 100, 100);
          const isOver = th.status === 'over';

          return (
            <div key={th.category} class="flex flex-col gap-1">
              <div class="flex justify-between items-center text-sm">
                <span class="font-medium">{th.category}</span>
                {editingCategory === th.category ? (
                    <form onSubmit={handleSubmit((d) => onSubmit(d, th.category))} class="flex items-center gap-2">
                        <div class="flex flex-col">
                            <input type="number" step="0.01" class={`input input-xs input-bordered w-24 ${errors.ceiling ? 'input-error' : ''}`} {...register('ceiling', { valueAsNumber: true })} />
                            {errors.ceiling && <span class="text-error text-[10px] mt-1">{errors.ceiling.message}</span>}
                        </div>
                        <button type="submit" class="btn btn-xs btn-primary">Save</button>
                    </form>
                ) : (
                    <div class="flex items-center gap-2">
                        <span class={`font-bold ${isOver ? 'text-error' : ''}`}>
                            {formatCurrency(mtd)} / {formatCurrency(ceil)}
                        </span>
                        <button class="btn btn-xs btn-ghost btn-square" onClick={() => handleEditClick(th)} aria-label={`Edit ${th.category} threshold`}>
                            <Icon icon="mdi:pencil" />
                        </button>
                    </div>
                )}
              </div>
              <progress class={`progress w-full ${isOver ? 'progress-error' : 'progress-primary'}`} value={pct} max="100"></progress>
              {isOver && <span class="text-xs text-error text-right flex items-center justify-end gap-1"><Icon icon="mdi:alert-circle" /> {th.category} budget exceeded</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
