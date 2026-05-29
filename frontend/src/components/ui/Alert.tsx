'use client';

interface AlertProps {
  type: 'error' | 'success' | 'info' | 'warning';
  message: string;
  onDismiss?: () => void;
  className?: string;
}

const styles: Record<AlertProps['type'], { bg: string; border: string; text: string; icon: string }> = {
  error:   { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', icon: 'text-red-500' },
  success: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', icon: 'text-emerald-500' },
  info:    { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', icon: 'text-blue-500' },
  warning: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', icon: 'text-amber-500' },
};

export function Alert({ type, message, onDismiss, className = '' }: AlertProps) {
  const s = styles[type];
  return (
    <div className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm ${s.bg} ${s.border} ${s.text} ${className}`} role="alert">
      <svg className={`mt-0.5 h-4 w-4 shrink-0 ${s.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span className="flex-1">{message}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="shrink-0 opacity-60 hover:opacity-100 transition-opacity" aria-label="Dismiss">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
