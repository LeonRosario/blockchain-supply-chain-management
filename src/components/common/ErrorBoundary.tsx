import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message?: string;
}

/**
 * Last-resort UI guard. Keeps a broken render from leaving a blank screen.
 * Does not alter routing, data flow, or auth.
 */
export default class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled application error:', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-16">
        <div className="surface-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />
        <div className="relative w-full max-w-lg rounded-3xl border border-border/70 bg-card/80 p-8 text-center shadow-float backdrop-blur-xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-danger/10 text-danger ring-1 ring-danger/20">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Application error
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">
            Something interrupted this view
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            The rest of the application is still available. Reload this view, or
            return to the dashboard.
          </p>
          {this.state.message && (
            <pre className="mt-4 max-h-28 overflow-auto rounded-xl border bg-muted/50 p-3 text-left font-mono text-xs text-muted-foreground">
              {this.state.message}
            </pre>
          )}
          <div className="mt-7 flex flex-col justify-center gap-2 sm:flex-row">
            <Button onClick={() => window.location.reload()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Reload view
            </Button>
            <Button variant="outline" onClick={() => { window.location.href = '/'; }}>
              <Home className="mr-2 h-4 w-4" />
              Back to home
            </Button>
          </div>
        </div>
      </div>
    );
  }
}