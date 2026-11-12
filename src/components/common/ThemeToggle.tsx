import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Button } from '@/components/ui';
import {
  getAppPreferences,
  saveAppPreferences,
} from '@/services/settings.service';

/**
 * Persisted light/dark toggle. Shares the existing `sc_app_preferences`
 * storage used by the Settings page, so both controls stay in sync.
 */
export default function ThemeToggle() {
  const reduce = useReducedMotion();
  const [isDark, setIsDark] = useState(
    () => typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  );

  useEffect(() => {
    const sync = () =>
      setIsDark(document.documentElement.classList.contains('dark'));
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  const toggle = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    saveAppPreferences({
      ...getAppPreferences(),
      theme: nextDark ? 'dark' : 'light',
    });
  };

  const label = isDark ? 'Switch to light theme' : 'Switch to dark theme';

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={label}
      title={label}
      className="rounded-full text-muted-foreground hover:text-foreground"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={isDark ? 'sun' : 'moon'}
          initial={reduce ? false : { opacity: 0, rotate: -35, scale: 0.7 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={reduce ? undefined : { opacity: 0, rotate: 35, scale: 0.7 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="flex items-center justify-center"
        >
          {isDark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
        </motion.span>
      </AnimatePresence>
    </Button>
  );
}