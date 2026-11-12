import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { AlertCircle, Check, Copy } from 'lucide-react';
import { Button, type ButtonProps } from '@/components/ui';

type CopyState = 'idle' | 'copied' | 'error';

interface CopyButtonProps extends Omit<ButtonProps, 'onClick' | 'children'> {
  value: string;
  /** Static accessible name for the action. */
  label?: string;
  /** Visible text when `showText` is enabled. */
  text?: string;
  showText?: boolean;
}

/**
 * Copy control with an animated copied / failed state and a polite live
 * announcement. Clipboard access is best-effort and never blocks the UI.
 */
export default function CopyButton({
  value,
  label = 'Copy to clipboard',
  text = 'Copy',
  showText = false,
  className,
  variant = 'ghost',
  size,
  ...props
}: CopyButtonProps) {
  const reduce = useReducedMotion();
  const [state, setState] = useState<CopyState>('idle');
  const timer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  const copy = async () => {
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error('Clipboard API unavailable');
      }
      await navigator.clipboard.writeText(value);
      setState('copied');
    } catch {
      setState('error');
    }

    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setState('idle'), 1800);
  };

  const Icon = state === 'copied' ? Check : state === 'error' ? AlertCircle : Copy;
  const iconColor =
    state === 'copied'
      ? 'text-success'
      : state === 'error'
        ? 'text-danger'
        : undefined;

  return (
    <Button
      type="button"
      variant={variant}
      size={size ?? (showText ? 'sm' : 'icon')}
      onClick={() => void copy()}
      aria-label={label}
      title={label}
      className={className}
      {...props}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={state}
          initial={reduce ? false : { opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={reduce ? undefined : { opacity: 0, scale: 0.6 }}
          transition={{ duration: 0.16, ease: 'easeOut' }}
          className="inline-flex items-center justify-center"
        >
          <Icon className={iconColor} aria-hidden="true" />
        </motion.span>
      </AnimatePresence>
      {showText && (
        <span className="ml-2">
          {state === 'copied' ? 'Copied' : state === 'error' ? 'Copy failed' : text}
        </span>
      )}
      <span className="sr-only" aria-live="polite">
        {state === 'copied'
          ? 'Copied to clipboard'
          : state === 'error'
            ? 'Could not copy to clipboard'
            : ''}
      </span>
    </Button>
  );
}