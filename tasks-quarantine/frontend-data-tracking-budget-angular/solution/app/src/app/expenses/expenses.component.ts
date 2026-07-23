import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { animate, style, transition, trigger } from '@angular/animations';
import { combineLatest, map } from 'rxjs';
import * as BudgetActions from '../store/budget.actions';
import {
  selectCategories,
  selectFilterCategoryId,
  selectFilteredExpensesSorted,
  selectSelectedExpenseIds,
} from '../store/budget.selectors';
import { isDerivedExpenseId } from '../store/budget.reducer';
import { ExpenseDialogComponent, ExpenseDialogResult } from './expense-dialog.component';
import { Expense } from '../models/models';

@Component({
  selector: 'app-expenses',
  templateUrl: './expenses.component.html',
  styleUrl: './expenses.component.scss',
  animations: [
    trigger('rowFly', [
      transition(':enter', [style({ opacity: 0, transform: 'translateY(-8px)' }), animate('300ms cubic-bezier(0.2,0.7,0.2,1)', style({ opacity: 1, transform: 'translateY(0)' }))]),
      transition(':leave', [animate('240ms ease-in', style({ opacity: 0, transform: 'translateX(24px)' }))]),
    ]),
    trigger('tray', [
      transition(':enter', [style({ opacity: 0, transform: 'translateY(16px)' }), animate('220ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))]),
      transition(':leave', [animate('180ms ease-in', style({ opacity: 0, transform: 'translateY(16px)' }))]),
    ]),
  ],
})
export class ExpensesComponent {
  displayedColumns = ['select', 'date', 'counterparty', 'category', 'value', 'actions'];
  expenses$;
  categories$;
  filterCategoryId$;
  selectedIds$;
  selectionCount$;
  allSelected$;

  bulkCategoryId: string | null = null;

  constructor(private store: Store, private dialog: MatDialog, private snackBar: MatSnackBar) {
    this.expenses$ = this.store.select(selectFilteredExpensesSorted);
    this.categories$ = this.store.select(selectCategories);
    this.filterCategoryId$ = this.store.select(selectFilterCategoryId);
    this.selectedIds$ = this.store.select(selectSelectedExpenseIds);
    this.selectionCount$ = this.selectedIds$.pipe(map((ids) => ids.length));
    this.allSelected$ = combineLatest([this.expenses$, this.selectedIds$]).pipe(
      map(([expenses, ids]) => expenses.length > 0 && expenses.every((e) => ids.includes(e.id)))
    );
  }

  trackById(_index: number, row: Expense): string {
    return row.id;
  }

  isDerived(row: Expense): boolean {
    return Boolean(row.recurring) || isDerivedExpenseId(row.id);
  }

  onFilterChange(categoryId: string | null): void {
    this.store.dispatch(BudgetActions.setFilterCategory({ categoryId: categoryId || null }));
  }

  categoryName(categories: { id: string; name: string }[] | null, categoryId: string): string {
    return categories?.find((c) => c.id === categoryId)?.name ?? categoryId;
  }

  isSelected(id: string, selected: string[]): boolean {
    return selected.includes(id);
  }

  toggleRow(row: Expense, selected: string[]): void {
    const ids = selected.includes(row.id) ? selected.filter((x) => x !== row.id) : [...selected, row.id];
    this.store.dispatch(BudgetActions.setSelection({ ids }));
  }

  toggleAll(expenses: Expense[], selected: string[]): void {
    const allSelected = expenses.length > 0 && expenses.every((e) => selected.includes(e.id));
    this.store.dispatch(BudgetActions.setSelection({ ids: allSelected ? [] : expenses.map((e) => e.id) }));
  }

  bulkCategorize(): void {
    if (!this.bulkCategoryId) return;
    this.selectedIds$.subscribe((ids) => {
      if (ids.length === 0) return;
      this.store.dispatch(BudgetActions.bulkCategorize({ ids, categoryId: this.bulkCategoryId! }));
      this.snackBar.open(`Categorized ${ids.length} expenses`, undefined, { duration: 2000 });
    }).unsubscribe();
  }

  bulkDelete(): void {
    this.selectedIds$.subscribe((ids) => {
      if (ids.length === 0) return;
      this.store.dispatch(BudgetActions.bulkDelete({ ids }));
      this.snackBar.open(`Deleted ${ids.length} expenses`, undefined, { duration: 2000 });
    }).unsubscribe();
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
      if (this.isDerived(expense)) {
        // Materialise the rule-generated instance into a standalone manual expense.
        this.store.dispatch(BudgetActions.detachRecurringInstance({ syntheticId: expense.id }));
        this.store.dispatch(
          BudgetActions.addExpense({
            value: result.value,
            datetime: result.datetime,
            categoryId: result.categoryId,
            counterparty: result.counterparty,
          })
        );
      } else {
        this.store.dispatch(
          BudgetActions.updateExpense({
            id: expense.id,
            value: result.value,
            datetime: result.datetime,
            categoryId: result.categoryId,
            counterparty: result.counterparty,
          })
        );
      }
      this.snackBar.open('Expense updated', undefined, { duration: 2000 });
    });
  }

  deleteExpense(expense: Expense): void {
    if (this.isDerived(expense)) {
      this.store.dispatch(BudgetActions.detachRecurringInstance({ syntheticId: expense.id }));
    } else {
      this.store.dispatch(BudgetActions.deleteExpense({ id: expense.id }));
    }
    this.snackBar.open('Expense deleted', undefined, { duration: 2000 });
  }
}
