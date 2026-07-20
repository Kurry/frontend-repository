import { h } from 'preact';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { addTransaction, updateTransaction, showToast } from '../state.js';
import { Icon } from '@iconify/react';
import FocusTrap from 'focus-trap-react';
import { useEffect, useState } from 'preact/hooks';

const schema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be a valid ISO date (YYYY-MM-DD)'),
  label: z.string().min(1, 'Payee is required').max(100),
  category: z.string().min(1, 'Category is required'),
  account: z.string().min(1, 'Account is required'),
  amount: z.number({invalid_type_error: "Amount is required"}).refine(v => v !== 0, 'Amount cannot be zero').refine(v => Math.abs(v) <= 1000000, 'Amount must be <= 1,000,000'),
  status: z.string(),
  note: z.string().optional()
}).refine(data => {
  if (data.category === 'Income' && data.amount < 0) {
      return false;
  }
  return true;
}, { message: 'Salary amount must be positive', path: ['amount'] });

export function TransactionForm({ transaction, onClose }) {
  const isEdit = !!transaction;
  const categories = ['Books', 'Groceries', 'Income', 'Utilities', 'Dining', 'Entertainment', 'Transportation', 'Housing'];
  const [liveError, setLiveError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: isEdit ? {
        ...transaction,
        amount: isEdit && transaction.category !== 'Income' ? -transaction.amount : transaction.amount
    } : {
        date: new Date().toISOString().split('T')[0],
        label: '',
        category: 'Groceries',
        account: 'Checking',
        amount: undefined,
        status: 'cleared',
        note: ''
    }
  });

  useEffect(() => {
      const errorKeys = Object.keys(errors);
      if (errorKeys.length > 0) {
          const firstError = errors[errorKeys[0]];
          setLiveError(`Error in ${errorKeys[0]}: ${firstError.message}`);
      } else {
          setLiveError('');
      }
  }, [errors]);

  const onSubmit = (data) => {
    let finalAmount = data.amount;
    if (data.category !== 'Income' && finalAmount > 0) {
        finalAmount = -finalAmount;
    }

    const record = { ...data, amount: finalAmount };

    if (isEdit) {
      updateTransaction(transaction.id, record);
      showToast('Transaction updated');
    } else {
      addTransaction(record);
      showToast('Transaction added');
    }
    onClose();
  };

  const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
  };

  return (
    <FocusTrap active={true}>
      <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-base-300/50 backdrop-blur-sm"
        onKeyDown={handleEsc}
      >
        <div class="card w-full max-w-md bg-base-100 shadow-xl" role="dialog" aria-modal="true" aria-labelledby="form-title">
          <div class="card-body">
            <div class="flex justify-between items-center mb-4">
                <h2 id="form-title" class="card-title text-xl">{isEdit ? 'Edit Transaction' : 'New Transaction'}</h2>
                <button class="btn btn-sm btn-ghost btn-square" onClick={onClose} aria-label="Close dialog">
                    <Icon icon="mdi:close" class="text-xl" />
                </button>
            </div>

            <div aria-live="polite" class="sr-only">{liveError}</div>

            <form onSubmit={handleSubmit(onSubmit)} class="space-y-4">
              <div class="form-control">
                <label class="label"><span class="label-text">Date</span></label>
                <input type="date" class={`input input-bordered ${errors.date ? 'input-error' : ''}`} {...register('date')} />
                {errors.date && <span class="text-error text-xs mt-1">{errors.date.message}</span>}
              </div>

              <div class="form-control">
                <label class="label"><span class="label-text">Payee</span></label>
                <input type="text" class={`input input-bordered ${errors.label ? 'input-error' : ''}`} {...register('label')} placeholder="Who did you pay?" />
                {errors.label && <span class="text-error text-xs mt-1">{errors.label.message}</span>}
              </div>

              <div class="grid grid-cols-2 gap-4">
                  <div class="form-control">
                    <label class="label"><span class="label-text">Category</span></label>
                    <select class={`select select-bordered ${errors.category ? 'select-error' : ''}`} {...register('category')}>
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div class="form-control">
                    <label class="label"><span class="label-text">Account</span></label>
                    <select class={`select select-bordered ${errors.account ? 'select-error' : ''}`} {...register('account')}>
                      <option value="Checking">Checking</option>
                      <option value="Credit Card">Credit Card</option>
                      <option value="Savings">Savings</option>
                    </select>
                  </div>
              </div>

              <div class="form-control">
                <label class="label"><span class="label-text">Amount</span></label>
                <input type="number" step="0.01" class={`input input-bordered ${errors.amount ? 'input-error' : ''}`} {...register('amount', { valueAsNumber: true })} placeholder="0.00" />
                {errors.amount && <span class="text-error text-xs mt-1">{errors.amount.message}</span>}
              </div>

              <div class="modal-action mt-6">
                <button type="button" class="btn btn-ghost" onClick={onClose}>Cancel</button>
                <button type="submit" class="btn btn-primary" disabled={isSubmitting}>{isEdit ? 'Save Changes' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </FocusTrap>
  );
}
