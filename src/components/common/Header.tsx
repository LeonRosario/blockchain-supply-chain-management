import { Menu, Bell, LogOut, User as UserIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button, Avatar, AvatarFallback, Badge } from '@/components/ui';
import { useAuth } from '@/hooks';

interface HeaderProps {
  onMenuClick: () => void;
  pageTitle?: string;
}

/**
 * Dashboard top-bar: hamburger toggle, page title, user menu.
 */
export default function Header({ onMenuClick, pageTitle }: HeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/auth/login', { replace: true });
  };

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '??';

  const roleLabel = user?.role.replace('_', ' ') ?? '';

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-4 border-b bg-background px-4 md:px-6">
      {/* Hamburger (mobile) */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onMenuClick}
        className="md:hidden"
        aria-label="Open sidebar"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Page title */}
      {pageTitle && (
        <h1 className="hidden text-base font-semibold md:block">{pageTitle}</h1>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Notifications placeholder */}
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="h-5 w-5" />
        </Button>

        {/* User avatar + role badge */}
        <div className="flex items-center gap-2 pl-2">
          <div className="hidden flex-col items-end md:flex">
            <span className="text-sm font-medium leading-tight">{user?.name}</span>
            <Badge variant="secondary" className="text-[10px] capitalize">
              {roleLabel}
            </Badge>
          </div>
          <Avatar>
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Profile link */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/dashboard/settings')}
          aria-label="Profile settings"
        >
          <UserIcon className="h-5 w-5" />
        </Button>

        {/* Logout */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          aria-label="Sign out"
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}

