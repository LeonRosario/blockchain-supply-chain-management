import { Link } from 'react-router-dom';
import { Package2, QrCode } from 'lucide-react';
import { Button } from '@/components/ui';
import { useAuth } from '@/hooks';

/**
 * Navbar — top bar shown on public (marketing) pages only.
 */
export default function Navbar() {
  const { isAuthenticated } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2 font-bold text-lg text-primary">
          <Package2 className="h-6 w-6" />
          <span>SupplyChain</span>
        </Link>

        {/* Nav links */}
        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          <Link to="/" className="text-muted-foreground transition-colors hover:text-foreground">
            Home
          </Link>
          <Link
            to="/verify"
            className="flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
          >
            <QrCode className="h-4 w-4" />
            Verify Product
          </Link>
        </nav>

        {/* CTA */}
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="md:hidden">
            <Link to="/verify">
              <QrCode className="mr-1 h-4 w-4" />
              Verify
            </Link>
          </Button>

          {isAuthenticated ? (
            <Button asChild size="sm">
              <Link to="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/auth/login">Sign In</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/auth/register">Get Started</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}