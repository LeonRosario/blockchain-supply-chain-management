import { Outlet } from 'react-router-dom';

/**
 * DashboardLayout — wraps all authenticated dashboard pages.
 * Add a Sidebar, TopBar, and notification area here when UI is ready.
 */
export default function DashboardLayout() {
  return (
    <div>
      {/* <Sidebar /> */}
      <div>
        {/* <TopBar /> */}
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
