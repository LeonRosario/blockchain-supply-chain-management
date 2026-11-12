export { default as authService } from './auth.service';
export { default as productService } from './product.service';
export { default as shipmentService } from './shipment.service';
export { default as blockchainService } from './blockchain.service';
export { default as inventoryService } from './inventory.service';
export { default as warehouseService } from './warehouse.service';
export { default as distributorService } from './distributor.service';
export { default as ownershipService } from './ownership.service';
export { default as userService } from './user.service';
export { default as analyticsService } from './analytics.service';
export { default as apiClient } from './apiClient';

export { getVerificationHistory, addVerificationHistoryRecord, clearVerificationHistory } from './verificationHistory.service';
export {
  getNotificationPreferences,
  saveNotificationPreferences,
  getAppPreferences,
  saveAppPreferences,
  applyThemePreference,
  initializeAppPreferences,
  DEFAULT_NOTIFICATION_PREFERENCES,
  DEFAULT_APP_PREFERENCES,
} from './settings.service';
export { parseProductIdentifier } from './serviceHelpers';