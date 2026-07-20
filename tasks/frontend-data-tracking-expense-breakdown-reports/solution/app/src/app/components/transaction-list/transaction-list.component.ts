import { ModalsComponent } from "../modals/modals.component";

import { Component, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { TableModule } from 'primeng/table';
import autoAnimate from '@formkit/auto-animate';
import { Observable } from 'rxjs';
import { AppState, Transaction } from '../../store/app.state';
import { selectFilteredTransactions, selectTotals, selectSelection } from '../../store/app.selectors';
import * as AppActions from '../../store/app.actions';

@Component({
  selector: 'app-transaction-list',
  standalone: true,
  imports: [CommonModule, TableModule, CurrencyPipe, DatePipe, ModalsComponent],
  templateUrl: './transaction-list.component.html'
})

export class TransactionListComponent implements OnInit, AfterViewInit {
  @ViewChild(ModalsComponent) modals!: ModalsComponent;

  @ViewChild('listContainer') listContainer!: ElementRef;
  
  transactions$: Observable<Transaction[]>;
  totals$: Observable<any>;
  selection$: Observable<string[]>;

  constructor(private store: Store<{ app: AppState }>) {
    this.transactions$ = this.store.select(selectFilteredTransactions);
    this.totals$ = this.store.select(selectTotals);
    this.selection$ = this.store.select(selectSelection);
  }

  ngOnInit() {}

  ngAfterViewInit() {
    if (this.listContainer && this.listContainer.nativeElement) {
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        autoAnimate(this.listContainer.nativeElement);
      }
    }
  }

  deleteSelected() {
    this.selection$.subscribe(selection => {
      if (selection.length > 0) {
        if (confirm(`Are you sure you want to delete ${selection.length} transactions?`)) {
          this.store.dispatch(AppActions.deleteTransactions({ ids: selection }));
          this.store.dispatch(AppActions.showToast({ message: 'Deleted transactions' }));
        }
      }
    }).unsubscribe();
  }

  deleteAll() {
    if (confirm('Are you sure you want to delete all transactions?')) {
      this.store.dispatch(AppActions.deleteAllTransactions());
      this.store.dispatch(AppActions.showToast({ message: 'All transactions deleted' }));
    }
  }

  deleteTx(id: string) {
    if (confirm("Delete this transaction?")) {
      this.store.dispatch(AppActions.deleteTransaction({ id }));
      this.store.dispatch(AppActions.showToast({ message: "Transaction deleted" }));
    }
  }

  openCreate() {
    this.modals.openCreateDialog();
  }

  select(id: string) {
    this.store.dispatch(AppActions.toggleTransactionSelection({ id }));
  }
}
