import React from 'react';
import BooksList from './components/BooksList';
import BatchReconciler from './components/BatchReconciler';
import ArtifactManager from './components/ArtifactManager';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col p-4 md:p-8 gap-6 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Home Library Ledger</h1>
          <p className="text-gray-500">Manage and reconcile your collection.</p>
        </div>
        <div className="mt-4 md:mt-0">
          <ArtifactManager />
        </div>
      </header>

      <main className="flex flex-col lg:flex-row gap-6 flex-1">
        <section className="flex-1 border rounded-lg p-4 bg-white shadow-sm overflow-auto">
          <h2 className="text-xl font-semibold mb-4">Books Collection</h2>
          <BooksList />
        </section>

        <aside className="w-full lg:w-96 flex flex-col gap-6">
          <div className="border rounded-lg p-4 bg-white shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Batch Reconciler</h2>
            <BatchReconciler />
          </div>
        </aside>
      </main>
    </div>
  );
}
