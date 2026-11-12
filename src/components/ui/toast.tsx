import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
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

const variantStyles: Record<
  ToastVariant,
  { card: string; icon: string; bar: string }
> = {
  default: {
    card: 'border-border/80',
    icon: 'bg-info/10 text-info ring-1 ring-inset ring-info/20',
    bar: 'bg-info/50',
  },
  success: {
    card: 'border-success/30',
    icon: 'bg-success/10 text-success ring-1 ring-inset ring-success/20',
    bar: 'bg-success/50',
  },
  error: {
    card: 'border-danger/30',
    icon: 'bg-danger/10 text-danger ring-1 ring-inset ring-danger/20',
    bar: 'bg-danger/50',
  },
  warning: {
    card: 'border-warning/30',
    icon: 'bg-warning/10 text-warning ring-1 ring-inset ring-warning/20',
    bar: 'bg-warning/50',
  },
};

const variantIcons: Record<ToastVariant, LucideIcon> = {
  default: Info,
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
};

let toastCounter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
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
        className="pointer-events-none fixed inset-x-4 bottom-4 z-[100] flex flex-col items-end gap-2 sm:left-auto sm:right-4 sm:w-full sm:max-w-sm"
      >
        <AnimatePresence initial={false} mode="popLayout">
          {toasts.map((item) => {
            const variant = item.variant ?? 'default';
            const styles = variantStyles[variant];
            const Icon = variantIcons[variant];
            const duration = item.duration ?? 0;

            return (
              <motion.div
                key={item.id}
                layout={!reduce}
                initial={reduce ? false : { opacity: 0, y: 16, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={
                  reduce
                    ? undefined
                    : { opacity: 0, x: 24, scale: 0.97 }
                }
                transition={{
                  duration: 0.24,
                  ease: [0.22, 1, 0.36, 1],
                  layout: { duration: 0.2 },
                }}
                role="status"
                className={cn(
                  'pointer-events-auto relative w-full overflow-hidden rounded-xl border bg-card/95 text-card-foreground shadow-lg backdrop-blur-md',
                  styles.card
                )}
              >
                <div className="flex items-start gap-3 p-4">
                  <span
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                      styles.icon
                    )}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="text-sm font-semibold">{item.title}</p>
                    {item.description && (
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {item.description}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => dismiss(item.id)}
                    className="-mr-1 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label="Dismiss notification"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>

                {duration > 0 && (
                  <motion.span
                    aria-hidden="true"
                    initial={reduce ? false : { scaleX: 1 }}
                    animate={reduce ? undefined : { scaleX: 0 }}
                    transition={{ duration: duration / 1000, ease: 'linear' }}
                    style={{ transformOrigin: 'left' }}
                    className={cn('absolute inset-x-0 bottom-0 h-0.5', styles.bar)}
                  />
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
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