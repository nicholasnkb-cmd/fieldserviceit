'use client';
import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

interface Toast { id: number; type: 'success' | 'error' | 'info'; message: string; }

const ToastContext = createContext<any>(null);

export function useToast() { return useContext(ToastContext); }

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const recentToast = useRef<{ key: string; at: number } | null>(null);
  const addToast = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    const now = Date.now();
    const key = `${type}:${message}`;
    if (recentToast.current?.key === key && now - recentToast.current.at < 750) return;
    recentToast.current = { key, at: now };
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);
  useEffect(() => {
    const showApiError = (event: Event) => {
      const detail = (event as CustomEvent<{ message?: string }>).detail;
      addToast('error', detail?.message || 'The request could not be completed');
    };
    window.addEventListener('fieldserviceit:api-error', showApiError);
    return () => window.removeEventListener('fieldserviceit:api-error', showApiError);
  }, [addToast]);
  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className="fixed right-4 top-4 z-[100] flex flex-col gap-2" aria-live="polite" aria-atomic="false">
        {toasts.map(t => (
          <div key={t.id} role={t.type === 'error' ? 'alert' : 'status'} className={`px-4 py-3 rounded-lg shadow-lg text-sm text-white flex items-center gap-2 min-w-[280px] animate-slide-in ${
            t.type === 'success' ? 'bg-green-600' : t.type === 'error' ? 'bg-red-600' : 'bg-blue-600'
          }`}>
            <span className="flex-1">{t.message}</span>
            <button type="button" aria-label="Dismiss notification" onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))} className="text-white/80 hover:text-white">&times;</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
