import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';
import { Button, Input, Label, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { ErrorMessage } from '@/components/common';
import { useAuth } from '@/hooks';
import { cn } from '@/utils';

// ─── Validation ───────────────────────────────────────────────────────────────
interface LoginFormErrors {
  email?: string;
  password?: string;
}

function validate(email: string, password: string): LoginFormErrors {
  const errors: LoginFormErrors = {};
  if (!email.trim()) {
    errors.email = 'Email is required.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Enter a valid email address.';
  }
  if (!password) {
    errors.password = 'Password is required.';
  } else if (password.length < 6) {
    errors.password = 'Password must be at least 6 characters.';
  }
  return errors;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const { login } = useAuth();
  const navigate   = useNavigate();
  const location   = useLocation();

  // Redirect destination after successful login
  const from = (location.state as { from?: Location })?.from?.pathname ?? '/dashboard';

  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [showPwd,     setShowPwd]     = useState(false);
  const [isLoading,   setIsLoading]   = useState(false);
  const [apiError,    setApiError]    = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<LoginFormErrors>({});
  const [touched,     setTouched]     = useState({ email: false, password: false });

  // Live validation after first blur
  const errors = touched.email || touched.password ? validate(email, password) : {};

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    const errs = validate(email, password);
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setIsLoading(true);
    setApiError(null);
    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Invalid email or password. Please try again.';
      setApiError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold">SupplyChain</h1>
          <p className="text-sm text-muted-foreground">Blockchain-Powered Supply Chain</p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Sign in to your account</CardTitle>
          </CardHeader>

          <CardContent>
            {apiError && (
              <ErrorMessage message={apiError} className="mb-4" />
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                  aria-invalid={!!(errors.email ?? fieldErrors.email)}
                  className={cn((errors.email ?? fieldErrors.email) && 'border-destructive focus-visible:ring-destructive')}
                  disabled={isLoading}
                />
                {(errors.email ?? fieldErrors.email) && (
                  <p className="text-xs text-destructive">{errors.email ?? fieldErrors.email}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPwd ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                    aria-invalid={!!(errors.password ?? fieldErrors.password)}
                    className={cn(
                      'pr-10',
                      (errors.password ?? fieldErrors.password) && 'border-destructive focus-visible:ring-destructive'
                    )}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPwd ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                  >
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {(errors.password ?? fieldErrors.password) && (
                  <p className="text-xs text-destructive">{errors.password ?? fieldErrors.password}</p>
                )}
              </div>

              {/* Forgot password */}
              <div className="flex justify-end">
                <Link
                  to="/auth/forgot-password"
                  className="text-xs text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit */}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>

            {/* Register link */}
            <p className="mt-5 text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link to="/auth/register" className="font-medium text-primary hover:underline">
                Create one
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
