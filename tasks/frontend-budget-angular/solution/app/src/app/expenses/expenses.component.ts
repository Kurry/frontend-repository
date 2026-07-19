import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import * as BudgetActions from '../store/budget.actions';
import { selectCategories, selectFilterCategoryId, selectFilteredExpensesSorted } from '../store/budget.selectors';
import { ExpenseDialogComponent, ExpenseDialogResult } from './expense-dialog.component';
import { Expense } from '../models/models';

@Component({
  selector: 'app-expenses',
  templateUrl: './expenses.component.html',
  styleUrl: './expenses.component.scss',
})
export class ExpensesComponent {
  displayedColumns = ['date', 'counterparty', 'category', 'value', 'actions'];
  expenses$;
  categories$;
  filterCategoryId$;

  constructor(private store: Store, private dialog: MatDialog, private snackBar: MatSnackBar) {
    this.expenses$ = this.store.select(selectFilteredExpensesSorted);
    this.categories$ = this.store.select(selectCategories);
    this.filterCategoryId$ = this.store.select(selectFilterCategoryId);
  }

  onFilterChange(categoryId: string | null): void {
    this.store.dispatch(BudgetActions.setFilterCategory({ categoryId: categoryId || null }));
  }

  categoryName(categories: { id: string; name: string }[] | null, categoryId: string): string {
    return categories?.find((c) => c.id === categoryId)?.name ?? categoryId;
  }

  openAddDialog(): void {
    const ref = this.dialog.open(ExpenseDialogComponent, {
      width: '360px',
      data: { mode: 'add' },
    });
    ref.afterClosed().subscribe((result: ExpenseDialogResult | undefined) => {
      if (!result) {
        return;
      }
      this.store.dispatch(
        BudgetActions.addExpense({
          value: result.value,
          datetime: result.datetime,
          categoryId: result.categoryId,
          counterparty: result.counterparty,
        })
      );
      this.snackBar.open('Expense added', undefined, { duration: 2000 });
    });
  }

  openEditDialog(expense: Expense): void {
    const ref = this.dialog.open(ExpenseDialogComponent, {
      width: '360px',
      data: { mode: 'edit', expense },
    });
    ref.afterClosed().subscribe((result: ExpenseDialogResult | undefined) => {
      if (!result) {
        return;
      }
      this.store.dispatch(
        BudgetActions.updateExpense({
          id: expense.id,
          value: result.value,
          datetime: result.datetime,
          categoryId: result.categoryId,
          counterparty: result.counterparty,
        })
      );
      this.snackBar.open('Expense updated', undefined, { duration: 2000 });
    });
  }

  deleteExpense(expense: Expense): void {
    this.store.dispatch(BudgetActions.deleteExpense({ id: expense.id }));
    this.snackBar.open('Expense deleted', undefined, { duration: 2000 });
  }
}
