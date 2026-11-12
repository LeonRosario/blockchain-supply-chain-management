import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Home,
  LayoutDashboard,
  SearchX,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { useAuth } from '@/hooks';

export default function NotFoundPage() {
  const { isAuthenticated } = useAuth();
  const previousPath = typeof window !== 'undefined' ? window.location.pathname : '/';

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden bg-background px-4 py-16">
      <div
        aria-hidden="true"
        className="surface-grid pointer-events-none absolute inset-0 opacity-40"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-teal-400/[0.07] blur-3xl"
      />

      <div className="relative w-full max-w-xl animate-in text-center fade-in-0 slide-in-from-bottom-2 duration-500">
        <div className="relative mx-auto mb-7 flex w-fit items-center justify-center">
          <span
            aria-hidden="true"
            className="select-none bg-gradient-to-br from-primary via-indigo-500 to-teal-500 bg-clip-text text-[7rem] font-black leading-none tracking-tighter text-transparent opacity-20 sm:text-[8.5rem]"
          >
            404
          </span>
          <span className="absolute flex h-16 w-16 items-center justify-center rounded-2xl border border-border/70 bg-card text-muted-foreground shadow-card">
            <SearchX className="h-7 w-7" aria-hidden="true" />
          </span>
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-muted/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Page not found
        </span>

        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
          This page does not exist
        </h1>
        <p className="mx-auto mt-3 max-w-md leading-relaxed text-muted-foreground">
          We could not find{' '}
          <span className="whitespace-nowrap rounded-md border border-border/70 bg-muted/50 px-1.5 py-0.5 font-mono text-xs text-foreground">
            {previousPath}
          </span>
          . It may have moved, been removed, or the link may be incorrect.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-2 sm:flex-row">
          <Button asChild>
            <Link to={isAuthenticated ? '/dashboard' : '/'}>
              {isAuthenticated ? (
                <>
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Go to dashboard
                </>
              ) : (
                <>
                  <Home className="mr-2 h-4 w-4" />
                  Back to home
                </>
              )}
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/verify">
              <ShieldCheck className="mr-2 h-4 w-4" />
              Verify a product
            </Link>
          </Button>
          <Button variant="ghost" onClick={() => window.history.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go back
          </Button>
        </div>

        <p className="mx-auto mt-8 max-w-lg text-xs leading-relaxed text-muted-foreground">
          Looking for a different module? Sign in and use the sidebar to reach
          products, shipments, inventory, warehouses, distributors, ownership
          transfers, blockchain records, analytics, users, or settings.
        </p>
      </div>
    </div>
  );
}