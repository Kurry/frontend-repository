import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { combineLatest, Observable } from 'rxjs';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { CheckboxModule } from 'primeng/checkbox';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AppState, Transaction } from '../../store/app.state';
import * as AppActions from '../../store/app.actions';
import { selectToast, selectDrawerOpen, selectCommandPaletteOpen, selectFilteredTransactions, selectFilters, selectBurnRateCeiling } from '../../store/app.selectors';
import { transactionSchema } from '../../utils/validators';
import { ArtifactService } from '../../services/artifact.service';

@Component({
  selector: 'app-modals',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DialogModule, InputTextModule, InputNumberModule, ButtonModule, DropdownModule, CheckboxModule, ToastModule],
  providers: [MessageService],
  templateUrl: './modals.component.html'
})
export class ModalsComponent implements OnInit {
  toast$: Observable<any>;
  drawerOpen$: Observable<boolean>;
  cmdPaletteOpen$: Observable<boolean>;
  transactions$: Observable<Transaction[]>;
  filters$: Observable<AppState['filters']>;
  burnRateCeiling$: Observable<number>;
  currentFilters: AppState['filters'] = { category: null, type: null, dateRange: null, payee: null };
  currentBurnRateCeiling = 0;

  txDialogVisible = false;
  txForm!: FormGroup;
  formErrors: Record<string, string> = {};
  isSubmitting = false;

  exportFormat: 'json' | 'markdown' = 'json';
  exportPreview = '';
  importText = '';

  categories = ['Salary', 'Food & Dining', 'Housing', 'Utilities', 'Health & Fitness', 'Shopping', 'Entertainment'];
  accounts = ['Checking', 'Savings', 'Credit Card'];

  constructor(private store: Store<{ app: AppState }>, private fb: FormBuilder, private messageService: MessageService, private artifact: ArtifactService) {
    this.toast$ = this.store.select(selectToast);
    this.drawerOpen$ = this.store.select(selectDrawerOpen);
    this.cmdPaletteOpen$ = this.store.select(selectCommandPaletteOpen);
    this.transactions$ = this.store.select(selectFilteredTransactions);
    this.filters$ = this.store.select(selectFilters);
    this.burnRateCeiling$ = this.store.select(selectBurnRateCeiling);
  }

  ngOnInit() {
    this.txForm = this.fb.group({
      date: [''],
      payee: [''],
      category: [''],
      account: [''],
      amount: [null],
      income: [false]
    });

    this.toast$.subscribe(t => {
      if (t?.show) {
        this.messageService.add({ severity: 'success', summary: 'Notice', detail: t.message });
        setTimeout(() => this.store.dispatch(AppActions.hideToast()), 3000);
      }
    });

    combineLatest([this.transactions$, this.filters$, this.burnRateCeiling$]).subscribe(([txs, filters, ceiling]) => {
       this.currentFilters = filters;
       this.currentBurnRateCeiling = ceiling;
       this.updateExportPreview(txs);
    });
  }

  openCreateDialog() {
    this.txForm.reset({ income: false });
    this.formErrors = {};
    this.isSubmitting = false;
    this.txDialogVisible = true;
  }

  closeDrawer() {
    this.store.dispatch(AppActions.toggleDrawer({ open: false }));
  }

  closeCmdPalette() {
    this.store.dispatch(AppActions.toggleCommandPalette({ open: false }));
  }

  updateExportPreview(txs: Transaction[]) {
    if (this.exportFormat === 'json') {
      this.exportPreview = this.artifact.generateJsonExport(txs, this.currentFilters, this.currentBurnRateCeiling);
    } else {
      this.exportPreview = this.artifact.generateMarkdownExport(txs);
    }
  }

  setExportFormat(format: 'json' | 'markdown') {
    this.exportFormat = format;
    this.transactions$.subscribe(txs => this.updateExportPreview(txs)).unsubscribe();
  }

  copyExport() {
    navigator.clipboard.writeText(this.exportPreview).then(() => {
      this.store.dispatch(AppActions.showToast({ message: 'Copied' }));
    });
  }

  handleImport() {
    const result = this.artifact.parseCsvImport(this.importText);
    if (result.valid.length > 0) {
      if (confirm(`Import ${result.valid.length} valid transactions? This will REPLACE ALL existing transactions.`)) {
         this.store.dispatch(AppActions.importTransactions({ transactions: result.valid }));
         this.store.dispatch(AppActions.showToast({ message: `Imported ${result.valid.length} transactions` }));
         this.closeCmdPalette();
      }
    } else {
      this.store.dispatch(AppActions.showToast({ message: 'No valid rows to commit.' }));
    }
  }

  onSubmit() {
    if (this.isSubmitting) return;

    const rawData = this.txForm.value;
    const validationResult = transactionSchema.safeParse({
      ...rawData,
      status: 'cleared',
      amount: typeof rawData.amount === 'number' ? rawData.amount : 0
    });

    if (!validationResult.success) {
      this.formErrors = {};
      validationResult.error.issues.forEach(issue => {
        if (issue.path[0]) {
          this.formErrors[issue.path[0].toString()] = issue.message;
        }
      });
      return;
    }

    this.isSubmitting = true;
    const newTx: Transaction = {
      ...validationResult.data,
      id: Date.now().toString(),
      status: 'cleared'
    };

    this.store.dispatch(AppActions.createTransaction({ transaction: newTx }));
    this.store.dispatch(AppActions.showToast({ message: 'Transaction created' }));
    this.txDialogVisible = false;
  }
}
