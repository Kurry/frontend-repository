import { z } from 'zod';

export const transactionSchema = z.object({
  id: z.string().optional(),
  date: z.string().nonempty('Date is required'),
  payee: z.string().nonempty('Payee is required'),
  category: z.string().nonempty('Category is required'),
  account: z.string().nonempty('Account is required'),
  amount: z.number().positive('Amount must be positive'),
  income: z.boolean(),
  status: z.enum(['cleared', 'pending']).default('cleared')
}).superRefine((data, ctx) => {
  if (data.income && data.category !== 'Salary') {
    // Optional extra check, skipped for now to avoid too much constraint
  }
});
