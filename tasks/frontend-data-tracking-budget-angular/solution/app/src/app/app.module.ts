import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { StoreModule } from '@ngrx/store';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';

import { AppComponent } from './app.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ExpensesComponent } from './expenses/expenses.component';
import { ExpenseDialogComponent } from './expenses/expense-dialog.component';
import { SettingsComponent } from './settings/settings.component';
import { ExportComponent } from './export/export.component';
import { budgetReducer } from './store/budget.reducer';
import { metaReducers } from './store/persistence';

import { NgxEchartsModule } from 'ngx-echarts';

@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    ExpensesComponent,
    ExpenseDialogComponent,
    SettingsComponent,
    ExportComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    StoreModule.forRoot({ budget: budgetReducer }, { metaReducers }),
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDialogModule,
    MatTabsModule,
    MatExpansionModule,
    MatSnackBarModule,
    MatProgressBarModule,
    MatCardModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDividerModule,
    NgxEchartsModule.forRoot({
      echarts: () => import('echarts'),
    }),
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
