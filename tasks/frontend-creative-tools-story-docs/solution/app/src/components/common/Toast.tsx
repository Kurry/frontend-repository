import React from 'react';
import { useStore } from '@nanostores/react';
import { activeToastStore } from '@/store/ui';

export function Toast() {
    const activeToast = useStore(activeToastStore);

    if (!activeToast) return null;

    return (
        <div
            id="capture-toast"
            role="status"
            aria-live="polite"
            className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg z-[100] text-sm font-medium animate-fade-in-up"
        >
            {activeToast.message}
        </div>
    );
}
