import type {
  BlockchainTransaction,
  Distributor,
  Inventory,
  InventoryMovement,
  OwnershipTransfer,
  Shipment,
  UserRecord,
  Warehouse,
} from '@/types';
import {
  demoDistributors,
  demoInventory,
  demoInventoryMovements,
  demoOwnershipTransfers,
  demoShipments,
  demoTransactions,
  demoUsers,
  demoWarehouses,
} from './mockSupplyChain';

const STORAGE_KEY = 'sc_demo_database_v1';
const DB_VERSION = 1;

export interface DemoDatabase {
  version: number;
  warehouses: Warehouse[];
  distributors: Distributor[];
  shipments: Shipment[];
  inventory: Inventory[];
  movements: InventoryMovement[];
  transfers: OwnershipTransfer[];
  users: UserRecord[];
  transactions: BlockchainTransaction[];
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function createSeedDatabase(): DemoDatabase {
  return {
    version: DB_VERSION,
    warehouses: clone(demoWarehouses),
    distributors: clone(demoDistributors),
    shipments: clone(demoShipments),
    inventory: clone(demoInventory),
    movements: clone(demoInventoryMovements),
    transfers: clone(demoOwnershipTransfers),
    users: clone(demoUsers),
    transactions: clone(demoTransactions),
  };
}

let cached: DemoDatabase | null = null;

export function getDemoDatabase(): DemoDatabase {
  if (cached) return cached;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DemoDatabase;
      if (parsed.version === DB_VERSION) {
        cached = parsed;
        return parsed;
      }
    }
  } catch {
    // Storage may be unavailable or corrupted — fall back to seed data.
  }

  cached = createSeedDatabase();
  persistDemoDatabase(cached);
  return cached;
}

export function persistDemoDatabase(database: DemoDatabase = getDemoDatabase()): void {
  cached = database;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(database));
  } catch {
    // Persistence is best-effort (e.g. private mode / quota exceeded).
  }
}

export function resetDemoDatabase(): DemoDatabase {
  cached = createSeedDatabase();
  persistDemoDatabase(cached);
  return cached;
}

export function generateDemoId(prefix: string): string {
  const time = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 7);
  return `${prefix}-${time}-${random}`;
}