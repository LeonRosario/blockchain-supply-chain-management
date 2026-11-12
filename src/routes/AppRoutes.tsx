import { Routes, Route, Navigate } from 'react-router-dom';

// Guards
import ProtectedRoute from './ProtectedRoute';
import PublicRoute from './PublicRoute';
import RoleRoute from './RoleRoute';

// Layouts
import MainLayout from '@/layouts/MainLayout';
import DashboardLayout from '@/layouts/DashboardLayout';

// ── Public pages ──────────────────────────────────────────────────────────────
import LandingPage from '@/pages/landing/LandingPage';
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import PublicVerificationPage from '@/pages/verification/PublicVerificationPage';
import NotFoundPage from '@/pages/NotFoundPage';

// ── Dashboard / core pages ────────────────────────────────────────────────────
import DashboardOverview from '@/pages/dashboard/DashboardOverview';
import ProductsPage from '@/pages/dashboard/ProductsPage';
import AddProductPage from '@/pages/dashboard/AddProductPage';
import EditProductPage from '@/pages/dashboard/EditProductPage';

// ── Phase 3 modules ───────────────────────────────────────────────────────────
import ShipmentsPage from '@/pages/shipments/ShipmentsPage';
import CreateShipmentPage from '@/pages/shipments/CreateShipmentPage';
import ShipmentDetailsPage from '@/pages/shipments/ShipmentDetailsPage';
import ShipmentHistoryPage from '@/pages/shipments/ShipmentHistoryPage';
import InventoryPage from '@/pages/inventory/InventoryPage';
import WarehousesPage from '@/pages/warehouses/WarehousesPage';
import WarehouseDetailsPage from '@/pages/warehouses/WarehouseDetailsPage';
import DistributorsPage from '@/pages/distributors/DistributorsPage';
import OwnershipTransfersPage from '@/pages/ownership/OwnershipTransfersPage';

// ── Phase 4 modules ───────────────────────────────────────────────────────────
import BlockchainDashboardPage from '@/pages/blockchain/BlockchainDashboardPage';
import BlockchainTransactionsPage from '@/pages/blockchain/BlockchainTransactionsPage';
import BlockchainTransactionDetailsPage from '@/pages/blockchain/BlockchainTransactionDetailsPage';
import BlockchainVerificationPage from '@/pages/blockchain/BlockchainVerificationPage';
import CustomerProductHistoryPage from '@/pages/customer/CustomerProductHistoryPage';
import AnalyticsPage from '@/pages/analytics/AnalyticsPage';
import UserManagementPage from '@/pages/users/UserManagementPage';
import SettingsPage from '@/pages/settings/SettingsPage';

// Roles that can access operational supply-chain modules.
const STAFF_ROLES = [
  'admin',
  'manufacturer',
  'distributor',
  'warehouse_manager',
  'retailer',
] as const;

// Roles that can access the internal blockchain ledger views.
const BLOCKCHAIN_ROLES = ['admin', 'manufacturer', 'distributor'] as const;

export default function AppRoutes() {
  return (
    <Routes>
      {/* ── Public site, public verification, and 404 ───────────────── */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/verify" element={<PublicVerificationPage />} />
        <Route path="/verify/:productId" element={<PublicVerificationPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* ── Auth (redirects when already signed in) ─────────────────── */}
      <Route element={<PublicRoute />}>
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/register" element={<RegisterPage />} />
      </Route>

      {/* ── Authenticated shell ─────────────────────────────────────── */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          {/* All authenticated roles */}
          <Route path="/dashboard" element={<DashboardOverview />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/blockchain/verify" element={<BlockchainVerificationPage />} />
          <Route path="/customer/history" element={<CustomerProductHistoryPage />} />

          {/* Products */}
          <Route
            element={<RoleRoute allowedRoles={[...STAFF_ROLES]} />}
          >
            <Route path="/dashboard/products" element={<ProductsPage />} />
            <Route path="/dashboard/products/add" element={<AddProductPage />} />
            <Route
              path="/dashboard/products/edit/:id"
              element={<EditProductPage />}
            />

            {/* Shipments */}
            <Route path="/shipments" element={<ShipmentsPage />} />
            <Route path="/shipments/create" element={<CreateShipmentPage />} />
            <Route path="/shipments/:id" element={<ShipmentDetailsPage />} />
            <Route path="/shipment-history" element={<ShipmentHistoryPage />} />

            {/* Inventory and facilities */}
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/warehouses" element={<WarehousesPage />} />
            <Route path="/warehouses/:id" element={<WarehouseDetailsPage />} />
            <Route path="/distributors" element={<DistributorsPage />} />

            {/* Ownership and analytics */}
            <Route
              path="/ownership-transfers"
              element={<OwnershipTransfersPage />}
            />
            <Route path="/analytics" element={<AnalyticsPage />} />
          </Route>

          {/* Blockchain ledger — supply-chain actors only */}
          <Route
            element={<RoleRoute allowedRoles={[...BLOCKCHAIN_ROLES]} />}
          >
            <Route path="/blockchain" element={<BlockchainDashboardPage />} />
            <Route
              path="/blockchain/transactions"
              element={<BlockchainTransactionsPage />}
            />
            <Route
              path="/blockchain/transactions/:id"
              element={<BlockchainTransactionDetailsPage />}
            />
          </Route>

          {/* Admin only */}
          <Route element={<RoleRoute allowedRoles={['admin']} />}>
            <Route path="/users" element={<UserManagementPage />} />
          </Route>
        </Route>
      </Route>

      {/* ── Legacy redirects from the original dashboard routes ─────── */}
      <Route path="/dashboard/shipments" element={<Navigate to="/shipments" replace />} />
      <Route
        path="/dashboard/shipments/create"
        element={<Navigate to="/shipments/create" replace />}
      />
      <Route
        path="/dashboard/shipments/:id"
        element={<Navigate to="/shipments" replace />}
      />
      <Route
        path="/dashboard/shipment-history"
        element={<Navigate to="/shipment-history" replace />}
      />
      <Route path="/dashboard/inventory" element={<Navigate to="/inventory" replace />} />
      <Route path="/dashboard/warehouses" element={<Navigate to="/warehouses" replace />} />
      <Route
        path="/dashboard/warehouses/:id"
        element={<Navigate to="/warehouses" replace />}
      />
      <Route
        path="/dashboard/distributors"
        element={<Navigate to="/distributors" replace />}
      />
      <Route
        path="/dashboard/ownership-transfers"
        element={<Navigate to="/ownership-transfers" replace />}
      />
      <Route path="/dashboard/analytics" element={<Navigate to="/analytics" replace />} />
      <Route path="/dashboard/blockchain" element={<Navigate to="/blockchain" replace />} />
      <Route
        path="/dashboard/blockchain/transactions"
        element={<Navigate to="/blockchain/transactions" replace />}
      />
      <Route
        path="/dashboard/blockchain/transactions/:id"
        element={<Navigate to="/blockchain/transactions" replace />}
      />
      <Route
        path="/dashboard/blockchain/verify"
        element={<Navigate to="/blockchain/verify" replace />}
      />
      <Route
        path="/dashboard/qr-verification"
        element={<Navigate to="/blockchain/verify" replace />}
      />
      <Route path="/dashboard/verify" element={<Navigate to="/blockchain/verify" replace />} />
      <Route path="/dashboard/users" element={<Navigate to="/users" replace />} />
      <Route path="/dashboard/settings" element={<Navigate to="/settings" replace />} />
    </Routes>
  );
}