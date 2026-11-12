import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { CheckCircle2, Info, X, XCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/utils';

type ToastVariant = 'default' | 'success' | 'error' | 'warning';

interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastItem extends ToastOptions {
  id: string;
}

interface ToastContextValue {
  toast: (options: ToastOptions) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const variantStyles: Record<ToastVariant, string> = {
  default: 'border-border bg-card text-card-foreground',
  success: 'border-green-200 bg-green-50 text-green-900',
  error: 'border-red-200 bg-red-50 text-red-900',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
};

const variantIcons: Record<ToastVariant, ReactNode> = {
  default: <Info className="h-5 w-5 text-blue-600" />,
  success: <CheckCircle2 className="h-5 w-5 text-green-600" />,
  error: <XCircle className="h-5 w-5 text-red-600" />,
  warning: <AlertTriangle className="h-5 w-5 text-amber-600" />,
};

let toastCounter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const toast = useCallback(
    (options: ToastOptions) => {
      toastCounter += 1;
      const item: ToastItem = {
        ...options,
        id: `toast-${toastCounter}-${Date.now()}`,
        variant: options.variant ?? 'default',
        duration: options.duration ?? 4500,
      };
      setToasts((current) => [...current, item]);
      if ((item.duration ?? 0) > 0) {
        window.setTimeout(() => dismiss(item.id), item.duration);
      }
    },
    [dismiss]
  );

  const success = useCallback(
    (title: string, description?: string) =>
      toast({ title, description, variant: 'success' }),
    [toast]
  );
  const error = useCallback(
    (title: string, description?: string) =>
      toast({ title, description, variant: 'error' }),
    [toast]
  );
  const warning = useCallback(
    (title: string, description?: string) =>
      toast({ title, description, variant: 'warning' }),
    [toast]
  );

  const value = useMemo(
    () => ({ toast, success, error, warning, dismiss }),
    [toast, success, error, warning, dismiss]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2"
      >
        {toasts.map((item) => (
          <div
            key={item.id}
            role="status"
            className={cn(
              'pointer-events-auto flex items-start gap-3 rounded-lg border p-4 shadow-lg',
              variantStyles[item.variant ?? 'default']
            )}
          >
            <div className="mt-0.5 shrink-0">
              {variantIcons[item.variant ?? 'default']}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{item.title}</p>
              {item.description && (
                <p className="mt-1 text-sm opacity-80">{item.description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismiss(item.id)}
              className="shrink-0 rounded p-1 opacity-60 transition-opacity hover:opacity-100"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a <ToastProvider>');
  }
  return context;
}