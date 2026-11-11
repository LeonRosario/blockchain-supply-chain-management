import { Routes, Route, Navigate } from 'react-router-dom';

// Guards
import ProtectedRoute  from './ProtectedRoute';
import PublicRoute     from './PublicRoute';
import RoleRoute       from './RoleRoute';

// Layouts
import MainLayout      from '@/layouts/MainLayout';
import DashboardLayout from '@/layouts/DashboardLayout';

// ── Public pages ──────────────────────────────────────────────────────────────
import LandingPage     from '@/pages/landing/LandingPage';
import LoginPage       from '@/pages/auth/LoginPage';
import RegisterPage    from '@/pages/auth/RegisterPage';

// ── Dashboard pages ───────────────────────────────────────────────────────────
import DashboardOverview          from '@/pages/dashboard/DashboardOverview';
import ProductsPage               from '@/pages/dashboard/ProductsPage';
import AddProductPage             from '@/pages/dashboard/AddProductPage';
import ShipmentsPage              from '@/pages/dashboard/ShipmentsPage';
import InventoryPage              from '@/pages/dashboard/InventoryPage';
import EditProductPage            from '@/pages/dashboard/EditProductPage';
import BlockchainTransactionsPage from '@/pages/dashboard/BlockchainTransactionsPage';
import QrVerificationPage         from '@/pages/dashboard/QrVerificationPage';
import AnalyticsPage              from '@/pages/dashboard/AnalyticsPage';
import UserManagementPage         from '@/pages/dashboard/UserManagementPage';
import SettingsPage               from '@/pages/dashboard/SettingsPage';

// ── Customer pages ────────────────────────────────────────────────────────────
import CustomerProductHistoryPage from '@/pages/customer/CustomerProductHistoryPage';

export default function AppRoutes() {
  return (
    <Routes>

      {/* ── Marketing (public) ─────────────────────────────────────── */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<LandingPage />} />
      </Route>

      {/* ── Auth (redirects when already signed in) ────────────────── */}
      <Route element={<PublicRoute />}>
        <Route path="/auth/login"    element={<LoginPage />} />
        <Route path="/auth/register" element={<RegisterPage />} />
      </Route>

      {/* ── Authenticated shell ────────────────────────────────────── */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>

          {/* All authenticated roles */}
          <Route path="/dashboard"              element={<DashboardOverview />} />
          <Route path="/dashboard/qr-verification" element={<QrVerificationPage />} />
          <Route path="/dashboard/settings"    element={<SettingsPage />} />

          {/* Staff roles (everyone except customer) */}
          <Route element={<RoleRoute allowedRoles={['admin','manufacturer','distributor','warehouse_manager','retailer']} />}>
            <Route path="/dashboard/products"        element={<ProductsPage />} />
            <Route path="/dashboard/products/add"    element={<AddProductPage />} />
            <Route path="/dashboard/products/edit/:id" element={<EditProductPage />} />
            <Route path="/dashboard/shipments"       element={<ShipmentsPage />} />
            <Route path="/dashboard/inventory"       element={<InventoryPage />} />
            <Route path="/dashboard/analytics"       element={<AnalyticsPage />} />
          </Route>

          {/* Blockchain — supply chain actors only */}
          <Route element={<RoleRoute allowedRoles={['admin','manufacturer','distributor']} />}>
            <Route path="/dashboard/blockchain" element={<BlockchainTransactionsPage />} />
          </Route>

          {/* Admin only */}
          <Route element={<RoleRoute allowedRoles={['admin']} />}>
            <Route path="/dashboard/users" element={<UserManagementPage />} />
          </Route>

          {/* Customer only */}
          <Route element={<RoleRoute allowedRoles={['customer']} redirectTo="/dashboard" />}>
            <Route path="/customer/history" element={<CustomerProductHistoryPage />} />
          </Route>

        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
