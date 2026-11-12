import { useEffect, useId, useRef, type ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui';
import { cn } from '@/utils';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive' | 'warning';
  isLoading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

const variantStyles = {
  default: {
    tile: 'bg-info/10 text-info ring-1 ring-inset ring-info/20',
  },
  warning: {
    tile: 'bg-warning/10 text-warning ring-1 ring-inset ring-warning/20',
  },
  destructive: {
    tile: 'bg-danger/10 text-danger ring-1 ring-inset ring-danger/20',
  },
} as const;

/**
 * Animated confirmation dialog. Focus starts on the safe action (cancel),
 * Escape is ignored while a request is in flight, and focus returns to the
 * trigger when the dialog closes.
 */
export default function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  isLoading = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const reduce = useReducedMotion();
  const titleId = useId();
  const descriptionId = useId();
  const cancelRef = useRef<HTMLButtonElement | null>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    previousFocus.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    const frame = window.requestAnimationFrame(() => cancelRef.current?.focus());

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isLoading) {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = overflow;
      previousFocus.current?.focus?.();
    };
  }, [isOpen, isLoading, onClose]);

  const tone = variantStyles[variant];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="confirm-backdrop"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduce ? undefined : { opacity: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
          onClick={() => !isLoading && onClose()}
          role="presentation"
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            initial={reduce ? false : { opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? undefined : { opacity: 0, y: 8, scale: 0.99 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-md rounded-2xl border border-border/70 bg-card p-6 text-card-foreground shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <span
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                  tone.tile
                )}
              >
                <AlertTriangle className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h2
                  id={titleId}
                  className="text-lg font-semibold tracking-tight"
                >
                  {title}
                </h2>
                <div
                  id={descriptionId}
                  className="mt-2 text-sm leading-relaxed text-muted-foreground"
                >
                  {description}
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                ref={cancelRef}
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                {cancelLabel}
              </Button>
              <Button
                variant={variant === 'destructive' ? 'destructive' : 'default'}
                onClick={onConfirm}
                disabled={isLoading}
              >
                {isLoading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                )}
                {confirmLabel}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}