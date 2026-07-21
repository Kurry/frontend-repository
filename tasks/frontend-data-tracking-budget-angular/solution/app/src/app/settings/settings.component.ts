import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { MatSnackBar } from '@angular/material/snack-bar';
import * as BudgetActions from '../store/budget.actions';
import { selectCategories, selectDisplayName, selectRecurringRules, selectThresholdPercent } from '../store/budget.selectors';
import { RecurringRuleState } from '../store/budget.reducer';
import { ExpenseCategory } from '../models/models';
import { CategoryNameSchema, DisplayNameSchema, RecurringRuleSchema, ThresholdSchema } from '../models/schemas';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent {
  categories$;
  displayName$;
  thresholdPercent$;
  recurringRules$;

  newCategoryName = '';
  newCategoryError = '';
  editingId: string | null = null;
  editingName = '';
  editingError = '';

  displayNameForm;
  thresholdForm;
  ruleForm;
  editingRuleKey: string | null = null;
  displayNameSubmitted = false;
  thresholdSubmitted = false;
  ruleSubmitted = false;

  constructor(private store: Store, private fb: FormBuilder, private snackBar: MatSnackBar) {
    this.categories$ = this.store.select(selectCategories);
    this.displayName$ = this.store.select(selectDisplayName);
    this.thresholdPercent$ = this.store.select(selectThresholdPercent);
    this.recurringRules$ = this.store.select(selectRecurringRules);

    this.displayNameForm = this.fb.group({
      displayName: ['', [Validators.required, Validators.maxLength(60)]],
    });
    this.thresholdForm = this.fb.group({
      thresholdPercent: [80, [Validators.required, this.thresholdValidator()]],
    });
    this.ruleForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(60)]],
      value: [null as number | null, [Validators.required, Validators.min(0.01)]],
      categoryId: ['', [Validators.required]],
      dayOfMonth: [null as number | null, [Validators.required, Validators.min(1), Validators.max(28)]],
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

  thresholdValidator() {
    return (control: any) => {
      const res = ThresholdSchema.safeParse(Number(control.value));
      return res.success ? null : { threshold: res.error.issues[0]?.message || 'Threshold must be an integer from 0 to 100' };
    };
  }

  displayNameError(): string {
    const control = this.displayNameForm.get('displayName');
    if (!control || (!control.touched && !this.displayNameSubmitted)) return '';
    const res = DisplayNameSchema.safeParse(control.value ?? '');
    return res.success ? '' : res.error.issues[0]?.message || '';
  }

  saveDisplayName(): void {
    this.displayNameSubmitted = true;
    const control = this.displayNameForm.get('displayName');
    control?.markAsTouched();
    const res = DisplayNameSchema.safeParse((control?.value ?? '').toString());
    if (!res.success) return;
    this.store.dispatch(BudgetActions.setDisplayName({ name: res.data }));
    this.displayNameForm.markAsPristine();
    this.displayNameSubmitted = false;
    this.snackBar.open('Display name updated', undefined, { duration: 2000 });
  }

  saveThreshold(): void {
    this.thresholdSubmitted = true;
    this.thresholdForm.markAllAsTouched();
    if (this.thresholdForm.invalid) return;
    const val = Number(this.thresholdForm.value.thresholdPercent);
    const res = ThresholdSchema.safeParse(val);
    if (res.success) {
      this.store.dispatch(BudgetActions.setThresholdPercent({ thresholdPercent: res.data }));
      this.thresholdForm.markAsPristine();
      this.thresholdSubmitted = false;
      this.snackBar.open('Threshold saved', undefined, { duration: 2000 });
    }
  }

  addCategoryError(): string {
    const res = CategoryNameSchema.safeParse(this.newCategoryName);
    if (!res.success) return res.error.issues[0]?.message || '';
    return this.newCategoryError;
  }

  addCategory(): void {
    const name = this.newCategoryName.trim();
    const res = CategoryNameSchema.safeParse(name);
    if (!res.success) {
      this.newCategoryError = res.error.issues[0]?.message || 'Invalid category name';
      return;
    }
    let duplicate = false;
    this.categories$.subscribe((cats: ExpenseCategory[]) => {
      duplicate = cats.some((c) => c.name.trim().toLowerCase() === name.toLowerCase());
    }).unsubscribe();
    if (duplicate) {
      this.newCategoryError = 'A category with this name already exists';
      return;
    }
    this.newCategoryError = '';
    this.store.dispatch(BudgetActions.addCategory({ name }));
    this.newCategoryName = '';
    this.snackBar.open('Category added', undefined, { duration: 2000 });
  }

  startEdit(category: ExpenseCategory): void {
    this.editingId = category.id;
    this.editingName = category.name;
    this.editingError = '';
  }

  editCategoryError(): string {
    const res = CategoryNameSchema.safeParse(this.editingName);
    if (!res.success) return res.error.issues[0]?.message || '';
    return this.editingError;
  }

  saveEdit(id: string): void {
    const name = this.editingName.trim();
    const res = CategoryNameSchema.safeParse(name);
    if (!res.success) {
      this.editingError = res.error.issues[0]?.message || 'Invalid category name';
      return;
    }
    let duplicate = false;
    this.categories$.subscribe((cats: ExpenseCategory[]) => {
      duplicate = cats.some((c) => c.id !== id && c.name.trim().toLowerCase() === name.toLowerCase());
    }).unsubscribe();
    if (duplicate) {
      this.editingError = 'A category with this name already exists';
      return;
    }
    this.editingError = '';
    this.store.dispatch(BudgetActions.renameCategory({ id, name }));
    this.editingId = null;
    this.snackBar.open('Category renamed', undefined, { duration: 2000 });
  }

  deleteCategory(id: string): void {
    this.store.dispatch(BudgetActions.deleteCategory({ id }));
    if (this.editingId === id) this.editingId = null;
    this.snackBar.open('Category deleted', undefined, { duration: 2000 });
  }

  ruleFieldError(field: 'name' | 'value' | 'categoryId' | 'dayOfMonth'): string {
    const control = this.ruleForm.get(field);
    if (!control || (!control.touched && !this.ruleSubmitted)) return '';
    const raw = this.ruleForm.getRawValue();
    const partial: any = {
      name: (raw.name ?? '').toString(),
      value: raw.value === null || raw.value === undefined ? NaN : Number(raw.value),
      categoryId: raw.categoryId || '',
      dayOfMonth: raw.dayOfMonth === null || raw.dayOfMonth === undefined ? NaN : Number(raw.dayOfMonth),
    };
    const res = RecurringRuleSchema.safeParse(partial);
    if (res.success) return '';
    const issue = res.error.issues.find((i) => i.path[0] === field);
    return issue?.message || '';
  }

  resetRuleForm(): void {
    this.editingRuleKey = null;
    this.ruleForm.reset({ name: '', value: null, categoryId: '', dayOfMonth: null });
    this.ruleForm.markAsPristine();
    this.ruleSubmitted = false;
  }

  startEditRule(rule: RecurringRuleState): void {
    this.editingRuleKey = rule.key;
    this.ruleForm.patchValue({ name: rule.name, value: rule.value, categoryId: rule.categoryId, dayOfMonth: rule.dayOfMonth }, { emitEvent: false });
    this.ruleForm.markAsPristine();
  }

  saveRule(): void {
    this.ruleSubmitted = true;
    this.ruleForm.markAllAsTouched();
    const raw = this.ruleForm.getRawValue();
    const parsed = RecurringRuleSchema.safeParse({
      name: (raw.name ?? '').toString(),
      value: Number(raw.value),
      categoryId: raw.categoryId,
      dayOfMonth: Number(raw.dayOfMonth),
    });
    if (!parsed.success) return;
    if (this.editingRuleKey) {
      this.store.dispatch(BudgetActions.updateRecurringRule({ key: this.editingRuleKey, rule: parsed.data }));
      this.snackBar.open('Recurring rule updated', undefined, { duration: 2000 });
    } else {
      this.store.dispatch(BudgetActions.addRecurringRule({ rule: parsed.data }));
      this.snackBar.open('Recurring rule added', undefined, { duration: 2000 });
    }
    this.resetRuleForm();
  }

  deleteRule(key: string): void {
    this.store.dispatch(BudgetActions.deleteRecurringRule({ key }));
    if (this.editingRuleKey === key) this.resetRuleForm();
    this.snackBar.open('Recurring rule deleted', undefined, { duration: 2000 });
  }

  ruleCategoryName(categories: ExpenseCategory[] | null, id: string): string {
    return categories?.find((c) => c.id === id)?.name ?? id;
  }
}
