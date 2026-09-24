// SaaS Platform Admin Control Plane Types

export type TenantStatus = 
  | 'TRIAL' 
  | 'ONBOARDING' 
  | 'ACTIVE' 
  | 'PAST_DUE' 
  | 'SUSPENDED' 
  | 'CANCELLED' 
  | 'ARCHIVED';

export type EntitlementKey = 
  | 'restaurant.pos'
  | 'restaurant.kds'
  | 'restaurant.coursing'
  | 'restaurant.reservations'
  | 'restaurant.host_stand'
  | 'restaurant.crm'
  | 'restaurant.online_ordering'
  | 'restaurant.loyalty'
  | 'inventory.basic'
  | 'inventory.predictive'
  | 'inventory.commissary'
  | 'hotel.pms'
  | 'hotel.housekeeping'
  | 'finance.accounting'
  | 'finance.etims'
  | 'platform.api'
  | 'platform.multi_property';

export interface TenantQuota {
  maxProperties: number;
  maxOutlets: number;
  maxTerminals: number;
  maxUsers: number;
  monthlyOrderLimit: number;
}

export interface Tenant {
  id: string;
  name: string;
  legalName: string;
  country: string;
  currency: string;
  timezone: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  status: TenantStatus;
  planId: string;
  planName: string;
  mrr: number; // Monthly Recurring Revenue in KES
  entitlements: EntitlementKey[];
  quotas: TenantQuota;
  activePropertiesCount: number;
  activeOutletsCount: number;
  activeTerminalsCount: number;
  createdAt: string;
  trialEndsAt?: string;
  lastActiveAt: string;
  healthStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL';
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  code: 'STARTER' | 'PRO' | 'ENTERPRISE' | 'CUSTOM';
  priceMonthlyKes: number;
  priceAnnualKes: number;
  entitlements: EntitlementKey[];
  quotas: TenantQuota;
  description: string;
  isPopular?: boolean;
}

export interface HardwareFleetDevice {
  id: string;
  tenantId: string;
  tenantName: string;
  propertyId: string;
  propertyName: string;
  deviceName: string;
  deviceType: 'POS_TERMINAL' | 'THERMAL_PRINTER' | 'BAR_SCALE_BRIDGE' | 'MPESA_POS_DEVICE' | 'KDS_DISPLAY';
  serialNumber: string;
  edgeVersion: string;
  ipAddress: string;
  isOnline: boolean;
  lastSeenAt: string;
  queuedJobsCount: number;
  status: 'OPTIMAL' | 'DEGRADED' | 'OFFLINE' | 'FIRMWARE_OUTDATED';
}

export interface SupportImpersonationLog {
  id: string;
  platformAdminEmail: string;
  tenantId: string;
  tenantName: string;
  reason: string;
  startedAt: string;
  expiresAt: string;
  isActive: boolean;
}

export interface SupportCase {
  id: string;
  ticketNumber: string;
  tenantId: string;
  tenantName: string;
  title: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  category: 'POS' | 'FISCAL_ETIMS' | 'PAYMENT' | 'HARDWARE' | 'INVENTORY' | 'BILLING';
  status: 'OPEN' | 'IN_PROGRESS' | 'WAITING_ON_TENANT' | 'RESOLVED';
  createdAt: string;
  assignedToAdmin?: string;
}

export interface IntegrationHealth {
  id: string;
  providerName: string;
  category: 'PAYMENT' | 'FISCAL' | 'SMS' | 'EMAIL' | 'OTA_PMS' | 'ACCOUNTING';
  status: 'OPTIMAL' | 'DEGRADED' | 'DISCONNECTED';
  tenantCount: number;
  secretMask: string;
  lastSuccessAt: string;
  failureCount24h: number;
}

export interface PlatformAuditLog {
  id: string;
  actorEmail: string;
  action: string;
  tenantId?: string;
  tenantName?: string;
  entityType: string;
  reason?: string;
  timestamp: string;
  ipAddress: string;
}

export interface PlatformIncident {
  id: string;
  incidentNumber: string;
  title: string;
  severity: 'SEV-1' | 'SEV-2' | 'SEV-3';
  impactedServices: string[];
  status: 'INVESTIGATING' | 'IDENTIFIED' | 'MONITORING' | 'RESOLVED';
  startedAt: string;
  resolvedAt?: string;
  summary: string;
}

export interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  category: 'POS' | 'INVENTORY' | 'HOTEL' | 'PAYMENT' | 'PLATFORM';
  enabledGlobally: boolean;
  tenantOverrideCount: number;
}

export interface SaaSModuleAddon {
  id: string;
  name: string;
  code: EntitlementKey;
  priceMonthlyKes: number;
  description: string;
  category: string;
  isPopular?: boolean;
}

