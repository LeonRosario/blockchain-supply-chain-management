import { Link } from 'react-router-dom';
import { ArrowLeft, Home, LayoutDashboard, SearchX, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui';
import { useAuth } from '@/hooks';

export default function NotFoundPage() {
  const { isAuthenticated } = useAuth();
  const previousPath = typeof window !== 'undefined' ? window.location.pathname : '/';

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-50 px-4 py-16">
      <div className="w-full max-w-lg text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-200 text-slate-600">
          <SearchX className="h-8 w-8" />
        </div>
        <p className="mt-6 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          404 · Page not found
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          This page does not exist
        </h1>
        <p className="mt-3 text-muted-foreground">
          We could not find <span className="font-mono text-xs">{previousPath}</span>.
          It may have moved, been removed, or the link may be incorrect.
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

        <p className="mt-8 text-xs text-muted-foreground">
          Looking for a different module? Sign in and use the sidebar to reach products,
          shipments, inventory, warehouses, distributors, ownership transfers, blockchain
          records, analytics, users, or settings.
        </p>
      </div>
    </div>
  );
}