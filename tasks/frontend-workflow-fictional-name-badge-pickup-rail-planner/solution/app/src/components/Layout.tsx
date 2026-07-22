import { ExportButton } from "./ExportButton";
import { ImportButton } from "./ImportButton";
import type { ReactNode } from 'react';


export function Layout({ children }: { children: ReactNode }) {
    return (
        <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
            <header className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-2">
                <div className="flex items-center space-x-4">
                    <h1 className="text-lg font-semibold tracking-tight">Fictional Badge Rail Planner</h1>
                    <span className="rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
                        PLAN-01 Amber Welcome Rail
                    </span>
                </div>
                <ImportButton /><ExportButton />
            </header>
            <main className="flex flex-1 overflow-hidden">
                {children}
            </main>
        </div>
    );
}
