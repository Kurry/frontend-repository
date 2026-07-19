import { Component, Inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { selectCategories } from '../store/budget.selectors';
import { Expense } from '../models/models';

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
      datetime: [this.data.expense?.datetime ?? '', [Validators.required]],
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
    this.dialogRef.close({
      value: Number(raw.value),
      datetime: String(raw.datetime),
      categoryId: String(raw.categoryId),
      counterparty: String(raw.counterparty ?? ''),
    });
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
