import { useEffect, useId, useMemo, useRef } from 'preact/hooks';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { transactionSchema, CATEGORIES, ACCOUNTS, STATUSES, CATEGORY_META, isIncomeCategory } from '../schemas.js';
import { Icon } from './Icon.jsx';

function Field({ id, label, error, hint, required, children }) {
  return (
    <div class="flex flex-col gap-1">
      <label for={id} class="text-xs font-semibold uppercase tracking-wide text-[#4a6460]">
        {label}
        {required && <span class="ml-0.5 text-[#c2410c]">*</span>}
      </label>
      {children}
      {error ? (
        <p class="flex items-center gap-1 text-xs font-medium text-[#c2410c]">
          <Icon name="lucide:circle-alert" decorative size={13} />
          {error}
        </p>
      ) : (
        hint && <p class="text-xs text-[#7e958f]">{hint}</p>
      )}
    </div>
  );
}

const inputBase =
  'w-full rounded-lg border bg-white px-3 py-2 text-sm text-[#102a2a] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2c8a85]/40 disabled:cursor-not-allowed disabled:bg-[#f2faf7] disabled:text-[#7e958f]';
const okBorder = 'border-[#d7eae3] focus:border-[#2c8a85]';
const errBorder = 'border-[#c2410c] bg-[#fff1e9]';

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function TransactionForm({ mode, initial, onSubmit }) {
  const isEdit = mode === 'edit';
  const defaults = useMemo(() => {
    if (isEdit && initial) {
      return {
        date: initial.date,
        label: initial.label,
        category: initial.category,
        account: initial.account,
        amount: String(initial.amount),
        status: initial.status || '',
        note: initial.note || '',
      };
    }
    return { date: todayISO(), label: '', category: 'Groceries', account: 'Checking', amount: '', status: '', note: '' };
  }, [isEdit, initial && initial.id]);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
    control,
    watch,
    trigger,
    reset,
  } = useForm({
    resolver: zodResolver(transactionSchema),
    mode: 'onChange',
    defaultValues: defaults,
  });

  const category = watch('category');
  const submitLock = useRef(false);

  useEffect(() => {
    reset(defaults);
    submitLock.current = false;
    requestAnimationFrame(() => trigger());
  }, [isEdit, initial && initial.id]);

  useEffect(() => {
    trigger('amount');
  }, [category]);

  const onValid = (values) => {
    if (submitLock.current) return;
    submitLock.current = true;
    onSubmit({ ...values, amount: Number(values.amount) });
    setTimeout(() => {
      submitLock.current = false;
    }, 400);
  };

  const liveErrors = Object.values(errors).filter(Boolean).map((e) => e.message).join('; ');
  const uid = useId();
  const fid = (n) => `${uid}-${n}`;
  const income = isIncomeCategory(category);

  return (
    <form noValidate onSubmit={handleSubmit(onValid)} class="flex flex-col gap-4">
      <div aria-live="polite" role="status" class="sr-only">
        {liveErrors ? `Validation: ${liveErrors}` : ''}
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field id={fid('date')} label="Date" required error={errors.date?.message}>
          <input id={fid('date')} type="text" inputMode="numeric" class={`${inputBase} ${errors.date ? errBorder : okBorder}`} {...register('date')} />
        </Field>
        <Field id={fid('label')} label="Payee / label" required error={errors.label?.message}>
          <input id={fid('label')} type="text" class={`${inputBase} ${errors.label ? errBorder : okBorder}`} {...register('label')} />
        </Field>
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field id={fid('category')} label="Category" required error={errors.category?.message}>
          <Controller
            name="category"
            control={control}
            render={({ field }) => (
              <select
                id={fid('category')}
                class={`${inputBase} ${errors.category ? errBorder : okBorder}`}
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                onBlur={field.onBlur}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_META[c].emoji} {c}
                  </option>
                ))}
              </select>
            )}
          />
        </Field>
        <Field id={fid('account')} label="Account" required error={errors.account?.message}>
          <Controller
            name="account"
            control={control}
            render={({ field }) => (
              <select
                id={fid('account')}
                class={`${inputBase} ${errors.account ? errBorder : okBorder}`}
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                onBlur={field.onBlur}
              >
                {ACCOUNTS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}
          />
        </Field>
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          id={fid('amount')}
          label="Amount (USD)"
          required
          error={errors.amount?.message}
          hint={income ? 'Income categories expect a positive amount.' : 'Expense categories expect a negative amount.'}
        >
          <input id={fid('amount')} type="text" inputMode="decimal" class={`${inputBase} tnum ${errors.amount ? errBorder : okBorder}`} {...register('amount')} />
        </Field>
        <Field id={fid('status')} label="Status" error={errors.status?.message} hint="Optional clearing status.">
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <select
                id={fid('status')}
                class={`${inputBase} ${errors.status ? errBorder : okBorder}`}
                value={field.value || ''}
                onChange={(e) => field.onChange(e.target.value)}
                onBlur={field.onBlur}
              >
                <option value="">No status</option>
                {STATUSES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}
          />
        </Field>
      </div>

      <Field id={fid('note')} label="Note" error={errors.note?.message} hint="Optional context, up to 200 characters.">
        <textarea id={fid('note')} rows={2} class={`${inputBase} resize-none ${errors.note ? errBorder : okBorder}`} {...register('note')} />
      </Field>

      <div class="mt-1 flex items-center justify-end gap-2">
        <button type="submit" disabled={!isValid || isSubmitting} class="btn btn-sm bg-[#0f3d3e] text-white hover:bg-[#175250] disabled:bg-[#cfe2db] disabled:text-white/80">
          <Icon name={isEdit ? 'lucide:save' : 'lucide:plus'} decorative size={16} />
          {isEdit ? 'Save changes' : 'Add transaction'}
        </button>
      </div>
    </form>
  );
}
