import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import {
  Button,
  Input,
  Label,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui';
import { ErrorMessage } from '@/components/common';
import AuthLayout from '@/layouts/AuthLayout';
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
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect destination after successful login
  const from =
    (location.state as { from?: Location })?.from?.pathname ?? '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<LoginFormErrors>({});
  const [touched, setTouched] = useState({ email: false, password: false });

  // Live validation after first blur
  const errors =
    touched.email || touched.password ? validate(email, password) : {};
  const emailError = errors.email ?? fieldErrors.email;
  const passwordError = errors.password ?? fieldErrors.password;

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
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Invalid email or password. Please try again.';
      setApiError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Card className="border-border/70 bg-card/90 shadow-card backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">Sign in to your account</CardTitle>
          <p className="text-sm text-muted-foreground">
            Use the credentials issued by your organisation.
          </p>
        </CardHeader>

        <CardContent>
          {apiError && <ErrorMessage message={apiError} className="mb-4" />}

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
                aria-invalid={Boolean(emailError)}
                aria-describedby={emailError ? 'login-email-error' : undefined}
                className={cn(
                  emailError &&
                    'border-danger focus-visible:border-danger focus-visible:ring-danger/20'
                )}
                disabled={isLoading}
              />
              {emailError && (
                <p id="login-email-error" role="alert" className="text-xs text-danger">
                  {emailError}
                </p>
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
                  aria-invalid={Boolean(passwordError)}
                  aria-describedby={
                    passwordError ? 'login-password-error' : undefined
                  }
                  className={cn(
                    'pr-10',
                    passwordError &&
                      'border-danger focus-visible:border-danger focus-visible:ring-danger/20'
                  )}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={showPwd ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPwd ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {passwordError && (
                <p
                  id="login-password-error"
                  role="alert"
                  className="text-xs text-danger"
                >
                  {passwordError}
                </p>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              Password resets are handled by your administrator.
            </p>

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
            <Link
              to="/auth/register"
              className="font-medium text-primary hover:underline"
            >
              Create one
            </Link>
          </p>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}