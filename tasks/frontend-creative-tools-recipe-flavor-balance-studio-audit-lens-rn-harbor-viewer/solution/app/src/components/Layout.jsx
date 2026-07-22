import { useFlavorStore } from '../store';
import { Collection } from './Collection';
import { AuditLens } from './AuditLens';
import { ExportImport } from './ExportImport';

export function Layout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row">
      {/* Main Surface - Collection */}
      <main className="flex-1 p-6 overflow-y-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Recipe Flavor Balance Studio</h1>
          <p className="text-slate-500">Audit Lens Viewer</p>
        </header>
        <Collection />
      </main>

      {/* Secondary Surface - Audit Lens & Tools (Sidebar on desktop, stacked on mobile) */}
      <aside className="w-full md:w-96 bg-white border-l border-slate-200 p-6 flex flex-col gap-8 overflow-y-auto shadow-sm">
        <AuditLens />
        <ExportImport />
      </aside>
    </div>
  );
}
