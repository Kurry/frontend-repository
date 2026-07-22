import React from 'react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            <header className="bg-green-700 text-white p-4 shadow-md flex justify-between items-center z-10">
                <h1 className="text-xl font-semibold tracking-tight">Community Garden Workday Planner</h1>
                <div className="text-sm opacity-90">Spatial Composer Workbench</div>
            </header>

            <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
                {children}
            </main>
        </div>
    );
};
