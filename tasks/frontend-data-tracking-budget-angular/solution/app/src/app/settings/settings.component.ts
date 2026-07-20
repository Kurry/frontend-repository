import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import * as BudgetActions from '../store/budget.actions';
import { selectCategories, selectDisplayName, selectThresholdPercent } from '../store/budget.selectors';
import { ExpenseCategory } from '../models/models';
import { ThresholdSchema } from '../models/schemas';
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent {
  categories$;
  displayName$;
  thresholdPercent$;

  newCategoryName = '';
  editingId: string | null = null;
  editingName = '';

  displayNameForm;
  thresholdForm;

  constructor(private store: Store, private fb: FormBuilder) {
    this.categories$ = this.store.select(selectCategories);
    this.displayName$ = this.store.select(selectDisplayName);
    this.thresholdPercent$ = this.store.select(selectThresholdPercent);
    this.displayNameForm = this.fb.group({
      displayName: ['', [Validators.required]],
    });
    this.thresholdForm = this.fb.group({
      thresholdPercent: [80, [Validators.required, this.thresholdValidator()]],
    });

    this.displayName$.subscribe((name) => {
      if (!this.displayNameForm.dirty) {
        this.displayNameForm.patchValue({ displayName: name }, { emitEvent: false });
      }
    });
    this.thresholdPercent$.subscribe((thresholdPercent) => {
      if (!this.thresholdForm.dirty) {
        this.thresholdForm.patchValue({ thresholdPercent }, { emitEvent: false });
      }
    });
  }

  thresholdValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const val = Number(control.value);
      const res = ThresholdSchema.safeParse(val);
      if (res.success) {
        return null;
      }
      return { threshold: res.error.issues[0]?.message || 'Threshold must be an integer from 0 to 100' };
    };
  }

  saveThreshold(): void {
    if (this.thresholdForm.invalid) {
      this.thresholdForm.markAllAsTouched();
      return;
    }
    const val = Number(this.thresholdForm.value.thresholdPercent);
    const res = ThresholdSchema.safeParse(val);
    if (res.success) {
      this.store.dispatch(BudgetActions.setThresholdPercent({ thresholdPercent: res.data }));
      this.thresholdForm.markAsPristine();
    }
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
