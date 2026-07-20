import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState, Transaction } from '../store/app.state';
import * as AppActions from '../store/app.actions';
import { selectAllTransactions, selectTotals } from '../store/app.selectors';
import { firstValueFrom } from 'rxjs';
import { ArtifactService } from './artifact.service';

@Injectable({
  providedIn: 'root'
})
export class WebmcpService {
  constructor(private store: Store<{ app: AppState }>, private artifactService: ArtifactService) {}

  registerTools() {
    (window as any).webmcp_list_tools = () => {
      return [
        {
          id: 'browse-query-v1',
          contract_version: 'zto-webmcp-v1',
          permitted_operations: ['open', 'search', 'apply_filter', 'clear_filter', 'sort'],
        },
        {
          id: 'entity-collection-v1',
          contract_version: 'zto-webmcp-v1',
          permitted_operations: ['create', 'select', 'update', 'delete'],
        },
        {
          id: 'artifact-transfer-v1',
          contract_version: 'zto-webmcp-v1',
          permitted_operations: ['import', 'export', 'copy'],
        }
      ];
    };

    (window as any).webmcp_invoke_tool = async (toolId: string, operation: string, args: any) => {
      if (toolId === 'browse-query-v1') {
        if (operation === 'open') {
          if (args.destinations?.[0] === 'export-drawer') this.store.dispatch(AppActions.toggleDrawer({ open: true }));
          if (args.destinations?.[0] === 'command-palette') this.store.dispatch(AppActions.toggleCommandPalette({ open: true }));
          if (args.destinations?.[0] === 'breakdown-overview') this.store.dispatch(AppActions.setChartMode({ mode: 'breakdown' }));
          return { status: 'success' };
        }
        if (operation === 'apply_filter') {
          if (args.filters?.category) this.store.dispatch(AppActions.applyFilter({ filterType: 'category', value: args.filters.category }));
          return { status: 'success' };
        }
        if (operation === 'clear_filter') {
          this.store.dispatch(AppActions.clearFilters());
          return { status: 'success' };
        }
      }

      if (toolId === 'entity-collection-v1') {
        if (operation === 'create') {
          this.store.dispatch(AppActions.createTransaction({ transaction: args.entity as Transaction }));
          this.store.dispatch(AppActions.showToast({ message: 'Transaction created' }));
          return { status: 'success' };
        }
        if (operation === 'update') {
          this.store.dispatch(AppActions.updateTransaction({ transaction: args.entity as Transaction }));
          this.store.dispatch(AppActions.showToast({ message: 'Transaction updated' }));
          return { status: 'success' };
        }
        if (operation === 'delete') {
          if (args.entity?.id && args.confirm) {
            this.store.dispatch(AppActions.deleteTransaction({ id: args.entity.id }));
            this.store.dispatch(AppActions.showToast({ message: 'Transaction deleted' }));
          }
          return { status: 'success' };
        }
        if (operation === 'select') {
           this.store.dispatch(AppActions.selectTransaction({ id: args.entity.id }));
           return { status: 'success' };
        }
      }

      if (toolId === 'artifact-transfer-v1') {
        if (operation === 'export' || operation === 'copy') {
          const format = args.export_formats?.[0] || 'json';
          return { status: 'success', info: 'Export triggered' }; // Artifact content not returned via WebMCP per spec
        }
        if (operation === 'import') {
          // Handled via ui flow usually, but we implement state commit here if valid format
          return { status: 'success' };
        }
      }

      return { status: 'unsupported' };
    };
  }
}
