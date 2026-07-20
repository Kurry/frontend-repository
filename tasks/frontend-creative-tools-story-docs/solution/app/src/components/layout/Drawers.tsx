import React, { useEffect, useRef } from 'react';
import { useStore } from '@nanostores/react';
import { isNotificationsDrawerOpenStore, isAccountDrawerOpenStore } from '@/store/ui';

function Drawer({
    isOpen,
    onClose,
    title,
    children
}: {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode
}) {
    const drawerRef = useRef<HTMLDivElement>(null);
    const closeBtnRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => {
                closeBtnRef.current?.focus();
            }, 50);
        }
    }, [isOpen]);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) onClose();
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-gray-500/75 transition-opacity" aria-hidden="true" onClick={onClose}></div>
            <div className="fixed inset-y-0 right-0 max-w-sm w-full flex bg-white shadow-xl flex-col h-full animate-slide-in-right" ref={drawerRef}>
                <div className="px-4 py-6 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="text-lg font-medium text-gray-900" id="slide-over-title">{title}</h2>
                    <button
                        ref={closeBtnRef}
                        type="button"
                        className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
                        onClick={onClose}
                        aria-label="Close panel"
                    >
                        <span className="sr-only">Close panel</span>
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="relative flex-1 px-4 py-6 sm:px-6 overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
}

export function NotificationsDrawer() {
    const isOpen = useStore(isNotificationsDrawerOpenStore);
    return (
        <Drawer isOpen={isOpen} onClose={() => isNotificationsDrawerOpenStore.set(false)} title="Notifications">
            <div className="space-y-4">
                <div className="p-3 bg-blue-50 text-blue-800 rounded-md text-sm">Welcome to Story Docs!</div>
                <div className="p-3 bg-gray-50 text-gray-800 rounded-md text-sm border border-gray-100">Team member added a comment to Scene 2.</div>
            </div>
        </Drawer>
    );
}

export function AccountDrawer() {
    const isOpen = useStore(isAccountDrawerOpenStore);
    return (
        <Drawer isOpen={isOpen} onClose={() => isAccountDrawerOpenStore.set(false)} title="Account & Settings">
            <div className="space-y-6">
                <div>
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Profile</h3>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-yellow-100 text-yellow-700 flex items-center justify-center font-bold">JD</div>
                        <div>
                            <div className="font-medium">Jane Doe</div>
                            <div className="text-sm text-gray-500">jane@example.com</div>
                        </div>
                    </div>
                </div>
                <div className="border-t border-gray-200 pt-4">
                    <button className="text-sm text-gray-600 hover:text-gray-900 font-medium">Sign Out</button>
                </div>
            </div>
        </Drawer>
    );
}
