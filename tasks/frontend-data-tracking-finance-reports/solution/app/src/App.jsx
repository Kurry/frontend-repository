import { exportDrawer, openExport, closeExport, shortcutLegend, undo, redo } from './state.js';
import { useGlobalShortcuts } from './hooks.jsx';
import { Layout } from './components/Layout.jsx';
import { SummaryCards } from './components/SummaryCards.jsx';
import { ChartPanel } from './components/ChartPanel.jsx';
import { ThresholdsPanel } from './components/ThresholdsPanel.jsx';
import { TransactionsTable } from './components/TransactionsTable.jsx';
import { SummaryStrip } from './components/SummaryStrip.jsx';
import { TransactionDialog } from './components/TransactionDialog.jsx';
import { ExportDrawer } from './components/ExportDrawer.jsx';
import { ImportPanel } from './components/ImportPanel.jsx';
import { ShortcutLegend } from './components/ShortcutLegend.jsx';
import { Toasts } from './components/Toasts.jsx';

export function App() {
  useGlobalShortcuts({
    onUndo: undo,
    onRedo: redo,
    onExport: () => (exportDrawer.value.open ? closeExport() : openExport('json')),
    onHelp: () => (shortcutLegend.value = !shortcutLegend.value),
  });

  return (
    <>
      <Layout>
        <SummaryCards />
        <ChartPanel />
        <ThresholdsPanel />
        <TransactionsTable />
        <SummaryStrip />
      </Layout>

      <TransactionDialog />
      <ExportDrawer />
      <ImportPanel />
      <ShortcutLegend />
      <Toasts />
    </>
  );
}
