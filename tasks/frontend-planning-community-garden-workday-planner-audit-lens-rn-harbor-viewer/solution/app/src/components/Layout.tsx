import { ReactNode } from 'react';

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#333] font-sans flex flex-col md:flex-row">
      <header className="bg-forest text-white p-4 flex justify-between items-center md:hidden">
        <h1 className="text-xl font-bold">Garden Planner</h1>
      </header>

      <main className="flex-1 p-4 md:p-8 flex flex-col md:flex-row gap-6 overflow-hidden max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
