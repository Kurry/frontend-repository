import { useEffect, useState } from 'react';

export function setupToasts() {
  let toastTimer: number = 0;

  if (typeof window !== 'undefined' && !document.getElementById('capture-toast')) {
    const toast = document.createElement("div");
    toast.id = "capture-toast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");

    // Simple toast styling directly in injected DOM element
    toast.style.position = 'fixed';
    toast.style.bottom = '-100px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.backgroundColor = '#1e293b';
    toast.style.color = '#fff';
    toast.style.padding = '8px 16px';
    toast.style.borderRadius = '20px';
    toast.style.transition = 'bottom 0.3s ease';
    toast.style.zIndex = '9999';
    toast.style.opacity = '0';

    document.body.appendChild(toast);

    window.showToast = (message: string) => {
      toast.textContent = message;
      toast.style.bottom = '24px';
      toast.style.opacity = '1';
      clearTimeout(toastTimer);
      toastTimer = window.setTimeout(() => {
        toast.style.bottom = '-100px';
        toast.style.opacity = '0';
      }, 1600);
    };
  }
}

// Global declaration
declare global {
  interface Window {
    showToast: (msg: string) => void;
  }
}

export function ToastProvider() {
  useEffect(() => {
    setupToasts();

    // Prevent inert navigation and show toast
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      const btn = target.closest("button.inert-nav, a.inert-nav");
      if (btn) {
        e.preventDefault();
        e.stopPropagation();
        const label =
          btn.getAttribute("aria-label") ||
          btn.textContent?.replace(/\s+/g, " ").trim().slice(0, 48) ||
          "Action";
        window.showToast(`${label} — demo only`);
        return;
      }

      const a = target.closest("a[href]");
      if (a) {
        const href = a.getAttribute("href") || "";
        if (!href.startsWith("#") && !href.startsWith("javascript")) {
          e.preventDefault();
          e.stopPropagation();
          window.showToast("Navigation disabled in this demo");
        }
      }
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, []);

  return null;
}
