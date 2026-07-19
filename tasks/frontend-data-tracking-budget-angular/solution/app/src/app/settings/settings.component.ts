import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import * as BudgetActions from '../store/budget.actions';
import { selectCategories, selectDisplayName } from '../store/budget.selectors';
import { ExpenseCategory } from '../models/models';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent {
  categories$;
  displayName$;

  newCategoryName = '';
  editingId: string | null = null;
  editingName = '';

  displayNameForm;

  constructor(private store: Store, private fb: FormBuilder) {
    this.categories$ = this.store.select(selectCategories);
    this.displayName$ = this.store.select(selectDisplayName);
    this.displayNameForm = this.fb.group({
      displayName: ['', [Validators.required]],
    });
    this.displayName$.subscribe((name) => {
      if (!this.displayNameForm.dirty) {
        this.displayNameForm.patchValue({ displayName: name }, { emitEvent: false });
      }
    });
  }

  saveDisplayName(): void {
    const name = this.displayNameForm.value.displayName?.trim();
    if (name) {
      this.store.dispatch(BudgetActions.setDisplayName({ name }));
    }
  }

  addCategory(): void {
    const name = this.newCategoryName.trim();
    if (!name) {
      return;
    }
    this.store.dispatch(BudgetActions.addCategory({ name }));
    this.newCategoryName = '';
  }

  startEdit(category: ExpenseCategory): void {
    this.editingId = category.id;
    this.editingName = category.name;
  }

  saveEdit(id: string): void {
    const name = this.editingName.trim();
    if (name) {
      this.store.dispatch(BudgetActions.renameCategory({ id, name }));
    }
    this.editingId = null;
  }

  deleteCategory(id: string): void {
    this.store.dispatch(BudgetActions.deleteCategory({ id }));
    if (this.editingId === id) {
      this.editingId = null;
    }
  }
}
