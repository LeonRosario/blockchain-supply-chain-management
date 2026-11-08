import { Outlet } from 'react-router-dom';

/**
 * MainLayout — wraps public-facing pages (e.g. landing).
 * Add a Navbar and Footer here when UI is ready.
 */
export default function MainLayout() {
  return (
    <div>
      {/* <Navbar /> */}
      <main>
        <Outlet />
      </main>
      {/* <Footer /> */}
    </div>
  );
}
