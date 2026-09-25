export type StaffRole = 'Admin' | 'Manager' | 'Server';
export type InstallationStage =
  | 'NEW'
  | 'INTAKE_IN_PROGRESS'
  | 'READY_FOR_ENROLLMENT'
  | 'ENROLLMENT_PENDING'
  | 'SETUP_REQUIRED'
  | 'READY_FOR_GO_LIVE'
  | 'LIVE';

export type Permission =
  | 'business.view' | 'business.configure' | 'business.tax.configure'
  | 'staff.view' | 'staff.create' | 'staff.update' | 'staff.deactivate' | 'staff.reset_pin' | 'staff.change_role'
  | 'pos.sell' | 'pos.open_tab' | 'pos.manage_table'
  | 'order.fire' | 'order.transfer' | 'order.merge' | 'order.void' | 'order.discount' | 'order.comp' | 'order.refund'
  | 'payment.record' | 'payment.split' | 'payment.reverse'
  | 'till.open' | 'till.close' | 'till.cash_movement' | 'till.override_variance'
  | 'mpesa.record' | 'mpesa.reconcile'
  | 'catalog.view' | 'catalog.manage' | 'pricing.manage'
  | 'inventory.view' | 'inventory.receive' | 'inventory.transfer' | 'inventory.waste' | 'inventory.count' | 'inventory.adjust'
  | 'procurement.view' | 'procurement.manage' | 'procurement.receive' | 'procurement.over_receive'
  | 'floorplan.view' | 'floorplan.manage'
  | 'kds.view' | 'kds.update'
  | 'accounting.view' | 'reports.view' | 'audit.view'
  | 'backup.create' | 'backup.restore' | 'sync.manual' | 'system.configure' | 'help.view';

export interface BusinessCommand {
  id: string;
  schemaVersion: 1;
  operation: string;
  targetVersion?: number;
  payload: Record<string, unknown>;
}
export interface CommandResult { commandId: string; recordIds: string[]; auditReference: string; sequence: number }
export interface RuntimeSession { token: string; staffId: string; name: string; role: StaffRole }
export interface RuntimeActor { id: string; name: string; role: StaffRole; permissions: Permission[] }
export interface StoredRecord { collection: string; id: string; version: number; data: Record<string, any>; archived: boolean }
export interface RuntimeSnapshot {
  records: StoredRecord[];
  pendingCount: number;
  lastSync: string | null;
  lastBackup: string | null;
  terminalId: string;
  installationStage: InstallationStage;
  actor: RuntimeActor;
}
export interface RuntimeStatus {
  enrolled: boolean;
  installationStage: InstallationStage;
  staff: Array<{ id: string; name: string; role: StaffRole }>;
  intakeProfile?: IntakeProfile | null;
}
export type PrinterJobState = 'SENT' | 'QUEUED' | 'DELIVERY_UNCERTAIN' | 'SENDING' | 'OS_DIALOG' | 'MANUAL';
export interface PrinterJobResult { jobId?: string; orderId?: string; state: PrinterJobState; message?: string; createdAt?: string }
export interface IntakeProfile {
  venueType: 'BAR' | 'PUB' | 'LOUNGE' | 'CLUB' | 'RESTAURANT_BAR' | 'OTHER';
  serviceModes: Array<'COUNTER' | 'TABS' | 'TABLES'>;
  operatingHours: string;
  lateNight: boolean;
  paymentMethods: Array<'CASH' | 'MPESA' | 'CARD'>;
  mpesaAccount?: string;
  salesStructure: string[];
  tracksSpiritsByMl: boolean;
  usesCocktailRecipes: boolean;
  serviceAreas: string[];
  stockAreas: string[];
  hasTables: boolean;
  estimatedTables: number;
  estimatedManagers: number;
  estimatedOperators: number;
  printerExpected: boolean;
  drawerExpected: boolean;
  barcodeScannerExpected: boolean;
  importMode: 'MANUAL' | 'CSV' | 'EMPTY';
  intendedGoLiveDate?: string;
}
export interface ManagerApproval { token: string; permission: Permission; target?: string | null; expiresAt: number; approvedBy: { id: string; name: string } }
export interface SyncOperation { sequence: number; commandId: string; operation: string; actorId: string; occurredAt: string; changes: StoredRecord[] }
export interface SyncBatch { terminalId: string; schemaVersion: 1; operations: SyncOperation[] }
export interface ManualMpesaInput { code: string; account: string; receivedAmount: number; receivedAt: string; confirmed: boolean; customerId?: string }
