'use client';

import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

const DISMISSED_KEY = 'fsit.mobileInstallPrompt.dismissedAt';
const DISMISS_DAYS = 14;

function isRecentlyDismissed() {
  try {
    const dismissedAt = Number(localStorage.getItem(DISMISSED_KEY) || 0);
    if (!dismissedAt) return false;
    return Date.now() - dismissedAt < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

function isStandaloneApp() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
}

export function MobileAppInstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {});
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      if (isStandaloneApp() || isRecentlyDismissed()) return;
      setInstallEvent(event as BeforeInstallPromptEvent);
      setVisible(true);
    };

    const handleAppInstalled = () => {
      setVisible(false);
      setInstallEvent(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    } catch {}
    setVisible(false);
  };

  const install = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const choice = await installEvent.userChoice.catch(() => null);
    if (choice?.outcome !== 'accepted') dismiss();
    setVisible(false);
    setInstallEvent(null);
  };

  if (!visible || !installEvent) return null;

  return (
    <div className="fixed inset-x-3 bottom-3 z-[90] mx-auto max-w-md rounded-lg border border-gray-200 bg-white p-3 shadow-2xl md:bottom-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Download size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-950">Install FieldserviceIT</p>
          <p className="mt-1 text-xs leading-5 text-gray-600">Add the mobile app to your home screen for faster access to tickets and technician workflows.</p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={install}
              className="inline-flex min-h-10 items-center justify-center rounded-md bg-primary px-3 text-sm font-semibold text-white hover:bg-primary/90"
            >
              Install
            </button>
            <button
              type="button"
              onClick={dismiss}
              className="inline-flex min-h-10 items-center justify-center rounded-md border border-gray-300 px-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Not now
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100"
          aria-label="Dismiss install prompt"
        >
          <X size={17} />
        </button>
      </div>
    </div>
  );
}
