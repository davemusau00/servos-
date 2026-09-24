export type StaffRole = 'Admin' | 'Manager' | 'Server';
export interface BusinessCommand {
  id: string;
  schemaVersion: 1;
  operation: string;
  targetVersion?: number;
  payload: Record<string, unknown>;
}
export interface CommandResult {
  commandId: string;
  recordIds: string[];
  auditReference: string;
  sequence: number;
}
export interface RuntimeSession { token: string; staffId: string; name: string; role: StaffRole }
export interface StoredRecord { collection: string; id: string; version: number; data: Record<string, any>; archived: boolean }
export interface RuntimeSnapshot { records: StoredRecord[]; pendingCount: number; lastSync: string | null; terminalId: string }
export interface SyncOperation { sequence: number; commandId: string; operation: string; actorId: string; occurredAt: string; changes: StoredRecord[] }
export interface SyncBatch { terminalId: string; schemaVersion: 1; operations: SyncOperation[] }
export interface RemoteChangeRequest { id: string; authorId: string; expectedVersion: number; operation: string; payload: Record<string, unknown>; status: 'pending' | 'applied' | 'rejected' | 'conflict' }
export interface ManualMpesaInput { code: string; account: string; receivedAmount: number; receivedAt: string; confirmed: boolean }
