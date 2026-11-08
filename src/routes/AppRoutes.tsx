import { Routes, Route, Navigate } from 'react-router-dom';

// Route guards
import ProtectedRoute from './ProtectedRoute';
import PublicRoute from './PublicRoute';

// Layouts
import MainLayout from '@/layouts/MainLayout';
import DashboardLayout from '@/layouts/DashboardLayout';

// Pages — Landing
import LandingPage from '@/pages/landing/LandingPage';

// Pages — Auth
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';

// Pages — Dashboard
import DashboardOverview from '@/pages/dashboard/DashboardOverview';
import ProductsPage from '@/pages/dashboard/ProductsPage';
import AddProductPage from '@/pages/dashboard/AddProductPage';
import ShipmentsPage from '@/pages/dashboard/ShipmentsPage';
import InventoryPage from '@/pages/dashboard/InventoryPage';
import BlockchainTransactionsPage from '@/pages/dashboard/BlockchainTransactionsPage';
import QrVerificationPage from '@/pages/dashboard/QrVerificationPage';
import AnalyticsPage from '@/pages/dashboard/AnalyticsPage';
import UserManagementPage from '@/pages/dashboard/UserManagementPage';
import SettingsPage from '@/pages/dashboard/SettingsPage';

// Pages — Customer
import CustomerProductHistoryPage from '@/pages/customer/CustomerProductHistoryPage';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public marketing routes */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<LandingPage />} />
      </Route>

      {/* Public auth routes (redirect if already logged in) */}
      <Route element={<PublicRoute />}>
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/register" element={<RegisterPage />} />
      </Route>

      {/* Protected dashboard routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardOverview />} />
          <Route path="/dashboard/products" element={<ProductsPage />} />
          <Route path="/dashboard/products/add" element={<AddProductPage />} />
          <Route path="/dashboard/shipments" element={<ShipmentsPage />} />
          <Route path="/dashboard/inventory" element={<InventoryPage />} />
          <Route path="/dashboard/blockchain" element={<BlockchainTransactionsPage />} />
          <Route path="/dashboard/qr-verification" element={<QrVerificationPage />} />
          <Route path="/dashboard/analytics" element={<AnalyticsPage />} />
          <Route path="/dashboard/users" element={<UserManagementPage />} />
          <Route path="/dashboard/settings" element={<SettingsPage />} />

          {/* Customer section */}
          <Route path="/customer/history" element={<CustomerProductHistoryPage />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
