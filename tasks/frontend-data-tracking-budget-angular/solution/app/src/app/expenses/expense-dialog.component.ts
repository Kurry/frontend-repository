import { Component, Inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { selectCategories } from '../store/budget.selectors';
import { Expense } from '../models/models';
import { ExpenseFormSchema } from '../models/schemas';

export interface ExpenseDialogResult {
  value: number;
  datetime: string;
  categoryId: string;
  counterparty: string;
}

export interface ExpenseDialogData {
  mode: 'add' | 'edit';
  expense?: Expense;
}

@Component({
  selector: 'app-expense-dialog',
  templateUrl: './expense-dialog.component.html',
})
export class ExpenseDialogComponent {
  categories$;
  form;

  constructor(
    private fb: FormBuilder,
    private store: Store,
    private dialogRef: MatDialogRef<ExpenseDialogComponent, ExpenseDialogResult>,
    @Inject(MAT_DIALOG_DATA) public data: ExpenseDialogData
  ) {
    this.categories$ = this.store.select(selectCategories);
    this.form = this.fb.group({
      value: [this.data.expense?.value ?? null, [Validators.required, Validators.min(0.01)]],
      datetime: [this.data.expense?.datetime ?? '', [Validators.required, Validators.pattern(/^\d{4}-\d{2}-\d{2}$/)]],
      categoryId: [this.data.expense?.categoryId ?? '', [Validators.required]],
      counterparty: [this.data.expense?.counterparty ?? ''],
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    const parsed = ExpenseFormSchema.safeParse({
      value: Number(raw.value),
      datetime: String(raw.datetime),
      categoryId: String(raw.categoryId),
      counterparty: raw.counterparty,
    });
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        const control = this.form.get(String(issue.path[0]));
        control?.setErrors({ ...control.errors, schema: issue.message });
      });
      this.form.markAllAsTouched();
      return;
    }
    this.dialogRef.close({
      value: parsed.data.value,
      datetime: parsed.data.datetime,
      categoryId: parsed.data.categoryId,
      counterparty: String(parsed.data.counterparty ?? ''),
    });
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
