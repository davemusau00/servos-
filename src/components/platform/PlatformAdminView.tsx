import React, { useState } from 'react';
import { useServOS } from '../../context/ServOSContext';
import { 
  Tenant, 
  SubscriptionPlan, 
  HardwareFleetDevice, 
  EntitlementKey,
  SupportCase,
  SupportImpersonationLog,
  IntegrationHealth,
  PlatformAuditLog,
  PlatformIncident,
  FeatureFlag,
  SaaSModuleAddon,
  TenantStatus
} from '../../types/saas';
import { 
  Building2, 
  ShieldCheck, 
  Server, 
  CreditCard, 
  Plus, 
  Search, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Lock, 
  Activity, 
  Eye, 
  RefreshCw, 
  Printer, 
  Terminal, 
  Users, 
  Settings, 
  ArrowUpRight,
  LifeBuoy,
  Radio,
  FileSpreadsheet,
  Layers,
  Key,
  Cpu,
  Globe,
  Sliders,
  Download,
  Play,
  Check,
  X,
  ChevronRight,
  Clock,
  Send,
  Zap,
  AlertCircle,
  Database,
  Wifi,
  WifiOff,
  ShoppingBag
} from 'lucide-react';

const ALL_ENTITLEMENT_KEYS: { key: EntitlementKey; label: string; group: string }[] = [
  { key: 'restaurant.pos', label: 'POS Sales & Floorplan', group: 'Front-of-House' },
  { key: 'restaurant.kds', label: 'Multi-Station KDS Pass', group: 'Front-of-House' },
  { key: 'restaurant.coursing', label: 'Seat Ordering & Coursing', group: 'Front-of-House' },
  { key: 'restaurant.reservations', label: 'Reservations & Waitlist', group: 'Front-of-House' },
  { key: 'restaurant.host_stand', label: 'Host Stand Workspace', group: 'Front-of-House' },
  { key: 'restaurant.crm', label: 'Guest 360 CRM Hub', group: 'Growth & Loyalty' },
  { key: 'restaurant.online_ordering', label: 'Digital QR Self-Ordering', group: 'Growth & Loyalty' },
  { key: 'restaurant.loyalty', label: 'Tiered Loyalty Engine', group: 'Growth & Loyalty' },
  { key: 'inventory.basic', label: 'Stock Movement Ledger', group: 'Inventory & ERP' },
  { key: 'inventory.predictive', label: 'Predictive Stock AI', group: 'Inventory & ERP' },
  { key: 'inventory.commissary', label: 'Central Kitchen Batch Prep', group: 'Inventory & ERP' },
  { key: 'hotel.pms', label: 'Hotel PMS & Tape Chart', group: 'Hotel Operations' },
  { key: 'hotel.housekeeping', label: 'Housekeeping & Maintenance', group: 'Hotel Operations' },
  { key: 'finance.accounting', label: 'Double-Entry Ledger ERP', group: 'Finance & Tax' },
  { key: 'finance.etims', label: 'KRA eTIMS Fiscal VSC', group: 'Finance & Tax' },
  { key: 'platform.api', label: 'REST API & Webhooks Access', group: 'Platform Integrations' },
  { key: 'platform.multi_property', label: 'Multi-Property Operations', group: 'Platform Integrations' }
];

const INITIAL_TENANTS: Tenant[] = [
  {
    id: 't-001',
    name: 'Grand Nairobi Hotel & Towers',
    legalName: 'Grand Nairobi Hospitality Ltd',
    country: 'Kenya',
    currency: 'KES',
    timezone: 'Africa/Nairobi',
    ownerName: 'David Musau',
    ownerEmail: 'david@grandnairobi.co.ke',
    ownerPhone: '+254 700 000 111',
    status: 'ACTIVE',
    planId: 'plan-enterprise',
    planName: 'Enterprise Operating System',
    mrr: 285000,
    entitlements: [
      'restaurant.pos',
      'restaurant.kds',
      'restaurant.coursing',
      'restaurant.reservations',
      'restaurant.host_stand',
      'restaurant.crm',
      'restaurant.online_ordering',
      'restaurant.loyalty',
      'inventory.basic',
      'inventory.predictive',
      'inventory.commissary',
      'hotel.pms',
      'hotel.housekeeping',
      'finance.accounting',
      'finance.etims',
      'platform.api',
      'platform.multi_property'
    ],
    quotas: {
      maxProperties: 5,
      maxOutlets: 15,
      maxTerminals: 50,
      maxUsers: 200,
      monthlyOrderLimit: 100000
    },
    activePropertiesCount: 2,
    activeOutletsCount: 6,
    activeTerminalsCount: 18,
    createdAt: '2025-01-15',
    lastActiveAt: 'Just now',
    healthStatus: 'HEALTHY'
  },
  {
    id: 't-002',
    name: 'Westlands Rooftop Lounge & Grill',
    legalName: 'Westlands Food Group Ltd',
    country: 'Kenya',
    currency: 'KES',
    timezone: 'Africa/Nairobi',
    ownerName: 'Sarah Kamau',
    ownerEmail: 'sarah@westlandsrooftop.com',
    ownerPhone: '+254 722 111 222',
    status: 'ACTIVE',
    planId: 'plan-pro',
    planName: 'Pro Hospitality Suite',
    mrr: 120000,
    entitlements: [
      'restaurant.pos',
      'restaurant.kds',
      'restaurant.coursing',
      'restaurant.reservations',
      'restaurant.host_stand',
      'restaurant.crm',
      'restaurant.loyalty',
      'inventory.basic',
      'finance.etims'
    ],
    quotas: {
      maxProperties: 1,
      maxOutlets: 3,
      maxTerminals: 10,
      maxUsers: 30,
      monthlyOrderLimit: 30000
    },
    activePropertiesCount: 1,
    activeOutletsCount: 2,
    activeTerminalsCount: 6,
    createdAt: '2025-06-10',
    lastActiveAt: '4 mins ago',
    healthStatus: 'HEALTHY'
  },
  {
    id: 't-003',
    name: 'Kilimani Coastal Seafood & Bar',
    legalName: 'Kilimani Dining LLC',
    country: 'Kenya',
    currency: 'KES',
    timezone: 'Africa/Nairobi',
    ownerName: 'Ali Hassan',
    ownerEmail: 'ali@kilimaniseafood.co.ke',
    ownerPhone: '+254 733 888 999',
    status: 'PAST_DUE',
    planId: 'plan-starter',
    planName: 'Starter POS & Inventory',
    mrr: 45000,
    entitlements: [
      'restaurant.pos',
      'restaurant.kds',
      'inventory.basic',
      'finance.etims'
    ],
    quotas: {
      maxProperties: 1,
      maxOutlets: 1,
      maxTerminals: 3,
      maxUsers: 10,
      monthlyOrderLimit: 10000
    },
    activePropertiesCount: 1,
    activeOutletsCount: 1,
    activeTerminalsCount: 2,
    createdAt: '2026-02-01',
    lastActiveAt: '18 mins ago',
    healthStatus: 'WARNING'
  },
  {
    id: 't-004',
    name: 'Mombasa Beachfront Palms Resort',
    legalName: 'Coastal Hospitality Ventures Kenya',
    country: 'Kenya',
    currency: 'KES',
    timezone: 'Africa/Nairobi',
    ownerName: 'Grace Omondi',
    ownerEmail: 'grace@mombasapalms.co.ke',
    ownerPhone: '+254 711 444 555',
    status: 'TRIAL',
    trialEndsAt: '2026-10-05',
    planId: 'plan-enterprise',
    planName: 'Enterprise Operating System (Trial)',
    mrr: 0,
    entitlements: [
      'restaurant.pos',
      'restaurant.kds',
      'restaurant.coursing',
      'restaurant.reservations',
      'restaurant.crm',
      'hotel.pms',
      'hotel.housekeeping',
      'finance.accounting',
      'finance.etims'
    ],
    quotas: {
      maxProperties: 2,
      maxOutlets: 5,
      maxTerminals: 15,
      maxUsers: 50,
      monthlyOrderLimit: 50000
    },
    activePropertiesCount: 1,
    activeOutletsCount: 3,
    activeTerminalsCount: 8,
    createdAt: '2026-09-10',
    lastActiveAt: '1 hour ago',
    healthStatus: 'HEALTHY'
  }
];

const INITIAL_FLEET: HardwareFleetDevice[] = [
  {
    id: 'dev-01',
    tenantId: 't-001',
    tenantName: 'Grand Nairobi Hotel',
    propertyId: 'p-01',
    propertyName: 'Main Property',
    deviceName: 'POS-Cashier-01 (Main Bar)',
    deviceType: 'POS_TERMINAL',
    serialNumber: 'SN-99201-KE',
    edgeVersion: 'v2.4.1-edge',
    ipAddress: '192.168.1.102',
    isOnline: true,
    lastSeenAt: '12s ago',
    queuedJobsCount: 0,
    status: 'OPTIMAL'
  },
  {
    id: 'dev-02',
    tenantId: 't-001',
    tenantName: 'Grand Nairobi Hotel',
    propertyId: 'p-01',
    propertyName: 'Main Property',
    deviceName: 'Kitchen Thermal Printer (KOT-01)',
    deviceType: 'THERMAL_PRINTER',
    serialNumber: 'EPS-8080-LAN',
    edgeVersion: 'v2.4.1-edge',
    ipAddress: '192.168.1.150',
    isOnline: true,
    lastSeenAt: '2s ago',
    queuedJobsCount: 0,
    status: 'OPTIMAL'
  },
  {
    id: 'dev-03',
    tenantId: 't-002',
    tenantName: 'Westlands Lounge',
    propertyId: 'p-02',
    propertyName: 'Rooftop Bar',
    deviceName: 'Bar Scale Bridge (Spirit AvT)',
    deviceType: 'BAR_SCALE_BRIDGE',
    serialNumber: 'SCL-4421-RS232',
    edgeVersion: 'v2.3.9-edge',
    ipAddress: '192.168.2.88',
    isOnline: false,
    lastSeenAt: '24 mins ago',
    queuedJobsCount: 3,
    status: 'DEGRADED'
  },
  {
    id: 'dev-04',
    tenantId: 't-001',
    tenantName: 'Grand Nairobi Hotel',
    propertyId: 'p-01',
    propertyName: 'Terrace Grill',
    deviceName: 'M-Pesa Wireless PDQ Terminal',
    deviceType: 'MPESA_POS_DEVICE',
    serialNumber: 'PDQ-77102-SAF',
    edgeVersion: 'v2.4.1-edge',
    ipAddress: '192.168.1.205',
    isOnline: true,
    lastSeenAt: '5s ago',
    queuedJobsCount: 0,
    status: 'OPTIMAL'
  }
];

const INITIAL_INTEGRATIONS: IntegrationHealth[] = [
  {
    id: 'int-01',
    providerName: 'Safaricom M-Pesa Daraja C2B / Express',
    category: 'PAYMENT',
    status: 'OPTIMAL',
    tenantCount: 4,
    secretMask: 'daraja_sec_****9021',
    lastSuccessAt: 'Just now',
    failureCount24h: 0
  },
  {
    id: 'int-02',
    providerName: 'KRA eTIMS VSC Fiscal Connector',
    category: 'FISCAL',
    status: 'OPTIMAL',
    tenantCount: 4,
    secretMask: 'etims_vsc_****4481',
    lastSuccessAt: '1 min ago',
    failureCount24h: 1
  },
  {
    id: 'int-03',
    providerName: 'Twilio SMS Gateway (Reservation & Waitlist)',
    category: 'SMS',
    status: 'OPTIMAL',
    tenantCount: 3,
    secretMask: 'twilio_auth_****8812',
    lastSuccessAt: '12 mins ago',
    failureCount24h: 0
  },
  {
    id: 'int-04',
    providerName: 'PesaLink / Visa PDQ Payment Gateway',
    category: 'PAYMENT',
    status: 'DEGRADED',
    tenantCount: 2,
    secretMask: 'pesalink_key_****3302',
    lastSuccessAt: '45 mins ago',
    failureCount24h: 8
  }
];

const INITIAL_SUPPORT_CASES: SupportCase[] = [
  {
    id: 'case-101',
    ticketNumber: 'TICK-8841',
    tenantId: 't-003',
    tenantName: 'Kilimani Coastal Seafood',
    title: 'eTIMS VSC invoice transmission timeout under weak mobile data',
    severity: 'HIGH',
    category: 'FISCAL_ETIMS',
    status: 'OPEN',
    createdAt: '2026-09-23 06:30',
    assignedToAdmin: 'superadmin@servos.co.ke'
  },
  {
    id: 'case-102',
    ticketNumber: 'TICK-8839',
    tenantId: 't-002',
    tenantName: 'Westlands Rooftop Lounge',
    title: 'Bar scale RS232 telemetry disconnection alert on Station 2',
    severity: 'MEDIUM',
    category: 'HARDWARE',
    status: 'IN_PROGRESS',
    createdAt: '2026-09-22 18:15',
    assignedToAdmin: 'support@servos.co.ke'
  }
];

const INITIAL_AUDIT_LOGS: PlatformAuditLog[] = [
  {
    id: 'audit-001',
    actorEmail: 'superadmin@servos.co.ke',
    action: 'IMPERSONATION_SESSION_STARTED',
    tenantId: 't-001',
    tenantName: 'Grand Nairobi Hotel',
    entityType: 'TENANT',
    reason: 'Debugging eTIMS tax transmission timeout for INV-0028',
    timestamp: '2026-09-23 07:15:22',
    ipAddress: '197.232.12.84'
  },
  {
    id: 'audit-002',
    actorEmail: 'superadmin@servos.co.ke',
    action: 'ENTITLEMENT_OVERRIDE_ENABLED',
    tenantId: 't-002',
    tenantName: 'Westlands Lounge',
    entityType: 'ENTITLEMENT',
    reason: 'Granted temporary 30-day trial of Predictive Inventory AI',
    timestamp: '2026-09-22 14:10:05',
    ipAddress: '197.232.12.84'
  }
];

const INITIAL_INCIDENTS: PlatformIncident[] = [
  {
    id: 'inc-01',
    incidentNumber: 'INC-2026-004',
    title: 'PesaLink PDQ Bank Switch Latency Increase',
    severity: 'SEV-2',
    impactedServices: ['Card PDQ Gateway Adapter', 'Tender Settlement Switch'],
    status: 'MONITORING',
    startedAt: '2026-09-23 05:40',
    summary: 'Card payment authorization delays observed on PesaLink PDQ terminals. M-Pesa & Cash unaffected.'
  }
];

const INITIAL_FEATURE_FLAGS: FeatureFlag[] = [
  {
    key: 'ai_predictive_inventory_v2',
    name: 'Predictive Stock AI Engine v2 (Prophet Yield Model)',
    description: 'Advanced machine learning yield model for spirit depletion & cover forecasts',
    category: 'INVENTORY',
    enabledGlobally: true,
    tenantOverrideCount: 2
  },
  {
    key: 'mpesa_b2c_promoter_payouts',
    name: 'Automated M-Pesa B2C Promoter Payouts',
    description: 'Instant automated commission disbursements for nightlife event promoters',
    category: 'PAYMENT',
    enabledGlobally: true,
    tenantOverrideCount: 4
  },
  {
    key: 'hotel_keycard_rfid_bridge',
    name: 'Edge RFID Hotel Keycard Reader Integration',
    description: 'Direct USB/RS232 door keycard encoder bridge for front desk check-in',
    category: 'HOTEL',
    enabledGlobally: false,
    tenantOverrideCount: 1
  }
];

const MODULE_ADDONS: SaaSModuleAddon[] = [
  {
    id: 'mod-01',
    name: 'Predictive Stock AI Engine',
    code: 'inventory.predictive',
    priceMonthlyKes: 25000,
    description: 'Automated reorder point forecasting and AvT variance detection',
    category: 'Inventory & ERP',
    isPopular: true
  },
  {
    id: 'mod-02',
    name: 'Hotel PMS & Tape Chart Suite',
    code: 'hotel.pms',
    priceMonthlyKes: 50000,
    description: 'Visual reservation chart, housekeeping inspection & guest folio management',
    category: 'Hotel Operations'
  },
  {
    id: 'mod-03',
    name: 'Digital QR Table Self-Ordering',
    code: 'restaurant.online_ordering',
    priceMonthlyKes: 18000,
    description: 'Guest self-service QR code menus with instant KDS pass routing',
    category: 'Growth & Loyalty',
    isPopular: true
  },
  {
    id: 'mod-04',
    name: 'Central Kitchen Batch Prep Studio',
    code: 'inventory.commissary',
    priceMonthlyKes: 30000,
    description: 'Production run manufacturing, premix scaling & inter-outlet transfer',
    category: 'Inventory & ERP'
  }
];

export const PlatformAdminView: React.FC = () => {
  const { showToast } = useServOS();
  const [activeTab, setActiveTab] = useState<'TENANTS' | 'PLANS' | 'PROVISIONING' | 'FLEET' | 'INTEGRATIONS' | 'SUPPORT_AUDIT' | 'HEALTH_INCIDENTS'>('TENANTS');
  
  // State
  const [tenants, setTenants] = useState<Tenant[]>(INITIAL_TENANTS);
  const [fleet, setFleet] = useState<HardwareFleetDevice[]>(INITIAL_FLEET);
  const [integrations, setIntegrations] = useState<IntegrationHealth[]>(INITIAL_INTEGRATIONS);
  const [supportCases, setSupportCases] = useState<SupportCase[]>(INITIAL_SUPPORT_CASES);
  const [auditLogs, setAuditLogs] = useState<PlatformAuditLog[]>(INITIAL_AUDIT_LOGS);
  const [incidents, setIncidents] = useState<PlatformIncident[]>(INITIAL_INCIDENTS);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>(INITIAL_FEATURE_FLAGS);
  
  const [selectedTenantId, setSelectedTenantId] = useState<string>(INITIAL_TENANTS[0].id);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Impersonation Active State Banner
  const [activeImpersonation, setActiveImpersonation] = useState<SupportImpersonationLog | null>({
    id: 'imp-001',
    platformAdminEmail: 'superadmin@servos.co.ke',
    tenantId: 't-001',
    tenantName: 'Grand Nairobi Hotel & Towers',
    reason: 'Debugging eTIMS tax transmission timeout for INV-0028',
    startedAt: '10 mins ago',
    expiresAt: '50 mins remaining',
    isActive: true
  });

  // Modal States
  const [isImpersonationModalOpen, setIsImpersonationModalOpen] = useState(false);
  const [impersonationReason, setImpersonationReason] = useState('');
  
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusReason, setStatusReason] = useState('');
  
  const [isProvisionWizardOpen, setIsProvisionWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  
  // Provisioning Form State
  const [wizOrgName, setWizOrgName] = useState('');
  const [wizLegalName, setWizLegalName] = useState('');
  const [wizCountry, setWizCountry] = useState('Kenya');
  const [wizCurrency, setWizCurrency] = useState('KES');
  const [wizPlanId, setWizPlanId] = useState('plan-pro');
  const [wizOwnerName, setWizOwnerName] = useState('');
  const [wizOwnerEmail, setWizOwnerEmail] = useState('');
  const [wizOwnerPhone, setWizOwnerPhone] = useState('');
  const [wizEntitlements, setWizEntitlements] = useState<EntitlementKey[]>([
    'restaurant.pos',
    'restaurant.kds',
    'restaurant.coursing',
    'restaurant.reservations',
    'inventory.basic',
    'finance.etims'
  ]);
  const [wizSeedDemoData, setWizSeedDemoData] = useState(true);

  const selectedTenant = tenants.find(t => t.id === selectedTenantId) || tenants[0];

  const totalMrr = tenants.reduce((acc, t) => acc + (t.status === 'ACTIVE' ? t.mrr : 0), 0);
  const totalActiveTenants = tenants.filter(t => t.status === 'ACTIVE').length;

  // Toggle entitlement for selected tenant
  const handleToggleEntitlement = (key: EntitlementKey) => {
    setTenants(prev => prev.map(t => {
      if (t.id === selectedTenantId) {
        const has = t.entitlements.includes(key);
        const nextEnts = has ? t.entitlements.filter(e => e !== key) : [...t.entitlements, key];
        showToast(`Entitlement "${key}" ${has ? 'disabled' : 'enabled'} for "${t.name}"!`, 'info');
        
        // Log to Audit
        const newAudit: PlatformAuditLog = {
          id: `audit-${Date.now()}`,
          actorEmail: 'superadmin@servos.co.ke',
          action: has ? 'ENTITLEMENT_DISABLED' : 'ENTITLEMENT_ENABLED',
          tenantId: t.id,
          tenantName: t.name,
          entityType: 'ENTITLEMENT',
          reason: `Manual override of entitlement key ${key}`,
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
          ipAddress: '197.232.12.84'
        };
        setAuditLogs(logs => [newAudit, ...logs]);

        return { ...t, entitlements: nextEnts };
      }
      return t;
    }));
  };

  // Toggle tenant status (Active <-> Suspended / Extend Trial)
  const handleConfirmStatusChange = () => {
    if (!statusReason.trim()) {
      showToast('Please specify a justification reason for this action', 'error');
      return;
    }

    setTenants(prev => prev.map(t => {
      if (t.id === selectedTenantId) {
        const nextStatus: TenantStatus = t.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
        showToast(`Tenant "${t.name}" status updated to ${nextStatus}!`, 'success');
        
        const newAudit: PlatformAuditLog = {
          id: `audit-${Date.now()}`,
          actorEmail: 'superadmin@servos.co.ke',
          action: nextStatus === 'SUSPENDED' ? 'TENANT_SUSPENDED' : 'TENANT_REACTIVATED',
          tenantId: t.id,
          tenantName: t.name,
          entityType: 'TENANT',
          reason: statusReason,
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
          ipAddress: '197.232.12.84'
        };
        setAuditLogs(logs => [newAudit, ...logs]);

        return { ...t, status: nextStatus };
      }
      return t;
    }));

    setIsStatusModalOpen(false);
    setStatusReason('');
  };

  // Start Impersonation Session
  const handleStartImpersonation = () => {
    if (!impersonationReason.trim()) {
      showToast('Please enter a valid ticket or support reason for impersonation', 'error');
      return;
    }

    const newImp: SupportImpersonationLog = {
      id: `imp-${Date.now()}`,
      platformAdminEmail: 'superadmin@servos.co.ke',
      tenantId: selectedTenant.id,
      tenantName: selectedTenant.name,
      reason: impersonationReason,
      startedAt: 'Just now',
      expiresAt: '60 mins remaining',
      isActive: true
    };

    setActiveImpersonation(newImp);
    showToast(`Support impersonation session active for "${selectedTenant.name}". Fully logged in security audit trail.`, 'success');
    
    // Log to audit
    setAuditLogs(prev => [{
      id: `audit-${Date.now()}`,
      actorEmail: 'superadmin@servos.co.ke',
      action: 'SUPPORT_IMPERSONATION_STARTED',
      tenantId: selectedTenant.id,
      tenantName: selectedTenant.name,
      entityType: 'SUPPORT_SESSION',
      reason: impersonationReason,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      ipAddress: '197.232.12.84'
    }, ...prev]);

    setIsImpersonationModalOpen(false);
    setImpersonationReason('');
  };

  // Export Tenant Data Package
  const handleExportTenantPackage = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(selectedTenant, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `servos_tenant_${selectedTenant.id}_export.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    showToast(`Exported full configuration package for ${selectedTenant.name}`, 'info');
  };

  // Complete Provisioning Wizard
  const handleCompleteProvisioning = () => {
    if (!wizOrgName.trim() || !wizOwnerEmail.trim()) {
      showToast('Please fill in organization name and owner email', 'error');
      return;
    }

    const newTenant: Tenant = {
      id: `t-${Date.now()}`,
      name: wizOrgName,
      legalName: wizLegalName || `${wizOrgName} Ltd`,
      country: wizCountry,
      currency: wizCurrency,
      timezone: 'Africa/Nairobi',
      ownerName: wizOwnerName || 'Tenant Administrator',
      ownerEmail: wizOwnerEmail,
      ownerPhone: wizOwnerPhone || '+254 700 000 000',
      status: 'ACTIVE',
      planId: wizPlanId,
      planName: wizPlanId === 'plan-enterprise' ? 'Enterprise Operating System' : wizPlanId === 'plan-pro' ? 'Pro Hospitality Suite' : 'Starter POS',
      mrr: wizPlanId === 'plan-enterprise' ? 285000 : wizPlanId === 'plan-pro' ? 120000 : 45000,
      entitlements: wizEntitlements,
      quotas: {
        maxProperties: wizPlanId === 'plan-enterprise' ? 5 : 2,
        maxOutlets: wizPlanId === 'plan-enterprise' ? 12 : 4,
        maxTerminals: wizPlanId === 'plan-enterprise' ? 30 : 10,
        maxUsers: wizPlanId === 'plan-enterprise' ? 100 : 25,
        monthlyOrderLimit: 50000
      },
      activePropertiesCount: 1,
      activeOutletsCount: 2,
      activeTerminalsCount: 4,
      createdAt: new Date().toISOString().split('T')[0],
      lastActiveAt: 'Just now',
      healthStatus: 'HEALTHY'
    };

    setTenants(prev => [newTenant, ...prev]);
    setSelectedTenantId(newTenant.id);
    setIsProvisionWizardOpen(false);
    setWizardStep(1);
    
    showToast(`New Tenant "${newTenant.name}" provisioned and onboarded successfully!`, 'success');
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Impersonation Active Banner Alert */}
      {activeImpersonation && activeImpersonation.isActive && (
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-900 border-b border-purple-500/40 px-6 py-2 text-xs font-mono flex items-center justify-between text-purple-200 shadow-lg shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-400 animate-pulse" />
            <span className="font-bold text-amber-300">ACTIVE SUPPORT IMPERSONATION SESSION:</span>
            <span>Admin ({activeImpersonation.platformAdminEmail}) $\rightarrow$ Tenant ({activeImpersonation.tenantName})</span>
            <span className="text-purple-300 hidden md:inline">| Reason: "{activeImpersonation.reason}"</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 bg-purple-950/80 text-amber-300 rounded border border-purple-500/30 text-[10px]">
              {activeImpersonation.expiresAt}
            </span>
            <button
              onClick={() => {
                setActiveImpersonation(null);
                showToast('Support impersonation session terminated cleanly.', 'info');
              }}
              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] font-bold transition-colors"
            >
              Terminate Session
            </button>
          </div>
        </div>
      )}

      {/* SaaS Platform Control Header */}
      <div className="px-4 sm:px-6 py-4 bg-slate-900/90 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400 shadow-md shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex flex-wrap items-center gap-2">
              ServOS Platform Control Plane
              <span className="px-2 py-0.5 text-[10px] font-mono bg-purple-500/10 text-purple-400 border border-purple-500/30 rounded-full font-bold">
                SUPERADMIN LAYER
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              Multi-Tenant Governance • Entitlement Engine • Hardware Telemetry • System Health
            </p>
          </div>
        </div>

        {/* Global Action Controls */}
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={() => setIsImpersonationModalOpen(true)}
            className="flex-1 md:flex-initial px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-500/30 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all"
          >
            <Eye className="w-4 h-4 text-purple-400" />
            <span>Start Support Session</span>
          </button>

          <button
            onClick={() => {
              setWizardStep(1);
              setIsProvisionWizardOpen(true);
            }}
            className="flex-1 md:flex-initial px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Provision New Tenant</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 p-4 sm:p-6 bg-slate-900/40 border-b border-slate-800 shrink-0">
        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
            TOTAL ACTIVE TENANTS
          </span>
          <div className="text-2xl font-bold font-mono text-white flex items-center justify-between">
            <span>{totalActiveTenants} / {tenants.length}</span>
            <Building2 className="w-5 h-5 text-purple-400" />
          </div>
        </div>

        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
            MONTHLY RECURRING REVENUE
          </span>
          <div className="text-2xl font-bold font-mono text-emerald-400 flex items-center justify-between">
            <span>KES {totalMrr.toLocaleString()}</span>
            <CreditCard className="w-5 h-5 text-emerald-400" />
          </div>
        </div>

        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
            HARDWARE FLEET STATUS
          </span>
          <div className="text-2xl font-bold font-mono text-amber-400 flex items-center justify-between">
            <span>{fleet.filter(f => f.isOnline).length} / {fleet.length} Online</span>
            <Server className="w-5 h-5 text-amber-400" />
          </div>
        </div>

        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
            PLATFORM HEALTH & INCIDENTS
          </span>
          <div className="text-2xl font-bold font-mono text-emerald-400 flex items-center justify-between">
            <span>99.98% ({incidents.filter(i => i.status !== 'RESOLVED').length} Active)</span>
            <Activity className="w-5 h-5 text-emerald-400" />
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="px-6 border-b border-slate-800 bg-slate-900/60 flex items-center gap-6 text-xs font-mono font-bold shrink-0 overflow-x-auto">
        <button
          onClick={() => setActiveTab('TENANTS')}
          className={`py-3 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'TENANTS' ? 'border-purple-500 text-purple-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Tenants Directory ({tenants.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('PLANS')}
          className={`py-3 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'PLANS' ? 'border-purple-500 text-purple-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Plans, Entitlements & Marketplace</span>
        </button>

        <button
          onClick={() => setActiveTab('FLEET')}
          className={`py-3 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'FLEET' ? 'border-purple-500 text-purple-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>Hardware Fleet Diagnostics ({fleet.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('INTEGRATIONS')}
          className={`py-3 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'INTEGRATIONS' ? 'border-purple-500 text-purple-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>Integrations & Webhooks ({integrations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('SUPPORT_AUDIT')}
          className={`py-3 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'SUPPORT_AUDIT' ? 'border-purple-500 text-purple-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <LifeBuoy className="w-4 h-4" />
          <span>Support Console & Audit ({supportCases.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('HEALTH_INCIDENTS')}
          className={`py-3 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'HEALTH_INCIDENTS' ? 'border-purple-500 text-purple-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Platform Health & Feature Flags</span>
        </button>
      </div>

      {/* Main Tab Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* ================= TAB 1: TENANTS DIRECTORY ================= */}
        {activeTab === 'TENANTS' && (
          <div className="grid grid-cols-12 gap-6 h-full">
            {/* Left: Tenant Directory Table (Cols 8) */}
            <div className="col-span-8 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search tenant name, owner, email, or country..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>

                <div className="flex items-center gap-2">
                  {['ALL', 'ACTIVE', 'TRIAL', 'PAST_DUE', 'SUSPENDED'].map(st => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                        statusFilter === st ? 'bg-purple-600 text-white' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <table className="w-full text-left border-collapse font-mono text-xs">
                  <thead>
                    <tr className="bg-slate-900 text-slate-400 border-b border-slate-800">
                      <th className="p-3">TENANT ORGANISATION</th>
                      <th className="p-3">STATUS</th>
                      <th className="p-3">SUBSCRIPTION PLAN</th>
                      <th className="p-3">MONTHLY MRR</th>
                      <th className="p-3 text-right">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {tenants
                      .filter(t => statusFilter === 'ALL' || t.status === statusFilter)
                      .filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) || t.ownerEmail.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map(t => (
                        <tr
                          key={t.id}
                          onClick={() => setSelectedTenantId(t.id)}
                          className={`hover:bg-slate-800/40 cursor-pointer transition-colors ${
                            selectedTenantId === t.id ? 'bg-slate-800/80 border-l-4 border-l-purple-500' : ''
                          }`}
                        >
                          <td className="p-3">
                            <div className="font-bold text-white text-sm">{t.name}</div>
                            <div className="text-[11px] text-slate-400">{t.ownerName} • {t.ownerEmail}</div>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              t.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                              t.status === 'TRIAL' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                              t.status === 'PAST_DUE' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                              'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            }`}>
                              {t.status}
                            </span>
                          </td>
                          <td className="p-3 text-slate-300 font-semibold">{t.planName}</td>
                          <td className="p-3 font-bold text-emerald-400">
                            {t.mrr > 0 ? `KES ${t.mrr.toLocaleString()}` : <span className="text-slate-500">Trial (Free)</span>}
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTenantId(t.id);
                                setIsImpersonationModalOpen(true);
                              }}
                              className="px-2.5 py-1 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg text-[10px] font-bold transition-colors"
                            >
                              Support Session
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right: Selected Tenant Entitlements & Quotas Inspection Pane (Cols 4) */}
            <div className="col-span-4 bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-5 overflow-y-auto max-h-[80vh]">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-mono font-bold text-purple-400 uppercase tracking-wider">
                  Tenant Details & Governance
                </span>
                <span className="text-xs font-mono text-slate-400">ID: {selectedTenant.id}</span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white">{selectedTenant.name}</h3>
                <p className="text-xs font-mono text-slate-400">{selectedTenant.legalName}</p>
                <div className="flex items-center gap-2 mt-1 font-mono text-xs text-slate-400">
                  <span>{selectedTenant.country} ({selectedTenant.currency})</span>
                  <span>•</span>
                  <span>Owner: {selectedTenant.ownerName}</span>
                </div>
              </div>

              {/* Usage Quotas Progress */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 font-mono text-xs">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                  CAPACITY QUOTAS & CONSUMPTION
                </span>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-slate-400">Properties:</span>
                    <span className="text-white font-bold">{selectedTenant.activePropertiesCount} / {selectedTenant.quotas.maxProperties}</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-purple-500 h-full" style={{ width: `${(selectedTenant.activePropertiesCount / selectedTenant.quotas.maxProperties) * 100}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-slate-400">Outlets & Stations:</span>
                    <span className="text-white font-bold">{selectedTenant.activeOutletsCount} / {selectedTenant.quotas.maxOutlets}</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full" style={{ width: `${(selectedTenant.activeOutletsCount / selectedTenant.quotas.maxOutlets) * 100}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-slate-400">POS Terminals:</span>
                    <span className="text-white font-bold">{selectedTenant.activeTerminalsCount} / {selectedTenant.quotas.maxTerminals}</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full" style={{ width: `${(selectedTenant.activeTerminalsCount / selectedTenant.quotas.maxTerminals) * 100}%` }} />
                  </div>
                </div>
              </div>

              {/* Granular Feature Entitlements Matrix */}
              <div className="space-y-2 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                    FEATURE ENTITLEMENTS MATRIX ({selectedTenant.entitlements.length}/{ALL_ENTITLEMENT_KEYS.length})
                  </span>
                </div>

                <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                  {ALL_ENTITLEMENT_KEYS.map(ent => {
                    const isEnabled = selectedTenant.entitlements.includes(ent.key);
                    return (
                      <div
                        key={ent.key}
                        onClick={() => handleToggleEntitlement(ent.key)}
                        className={`p-2 rounded-lg border flex items-center justify-between cursor-pointer transition-colors ${
                          isEnabled
                            ? 'bg-slate-950 border-emerald-500/30 text-slate-200 hover:bg-slate-900'
                            : 'bg-slate-950/40 border-slate-800 text-slate-500 hover:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {isEnabled ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 text-slate-600" />
                          )}
                          <span className={`text-[11px] font-mono ${isEnabled ? 'text-white font-semibold' : 'text-slate-500'}`}>
                            {ent.label}
                          </span>
                        </div>
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${isEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-600'}`}>
                          {isEnabled ? 'ENABLED' : 'LOCKED'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tenant Control Actions */}
              <div className="pt-4 border-t border-slate-800 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleExportTenantPackage}
                    className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-purple-400" />
                    <span>Export JSON</span>
                  </button>

                  <button
                    onClick={() => setIsStatusModalOpen(true)}
                    className={`py-2 px-3 rounded-xl font-mono text-xs font-bold transition-colors ${
                      selectedTenant.status === 'ACTIVE'
                        ? 'bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    }`}
                  >
                    {selectedTenant.status === 'ACTIVE' ? 'Suspend Tenant' : 'Reactivate'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: PLANS, ENTITLEMENTS & MARKETPLACE ================= */}
        {activeTab === 'PLANS' && (
          <div className="space-y-6 font-mono text-xs">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Subscription Tiers & Feature Entitlements Engine</h2>
                <p className="text-xs text-slate-400">Configure feature availability, capacity quotas, and optional SaaS add-on modules</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 shadow-xl">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-white">Starter POS</h3>
                    <p className="text-xs text-slate-400">Basic F&B Sales & eTIMS</p>
                  </div>
                  <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px] font-bold">STARTER</span>
                </div>

                <div className="text-2xl font-bold text-emerald-400">
                  KES 45,000 <span className="text-xs text-slate-500 font-normal">/ month</span>
                </div>

                <ul className="space-y-2 pt-3 border-t border-slate-800 text-slate-300">
                  <li className="flex items-center gap-2 text-emerald-400"><CheckCircle2 className="w-3.5 h-3.5" /> POS Sales & Floorplan</li>
                  <li className="flex items-center gap-2 text-emerald-400"><CheckCircle2 className="w-3.5 h-3.5" /> Basic KDS Pass</li>
                  <li className="flex items-center gap-2 text-emerald-400"><CheckCircle2 className="w-3.5 h-3.5" /> Basic Inventory Ledger</li>
                  <li className="flex items-center gap-2 text-emerald-400"><CheckCircle2 className="w-3.5 h-3.5" /> KRA eTIMS Fiscalization</li>
                  <li className="flex items-center gap-2 text-slate-500"><XCircle className="w-3.5 h-3.5 text-slate-600" /> Hotel PMS & Tape Chart</li>
                  <li className="flex items-center gap-2 text-slate-500"><XCircle className="w-3.5 h-3.5 text-slate-600" /> Predictive Inventory AI</li>
                </ul>
              </div>

              <div className="p-5 bg-slate-900 border border-purple-500/50 rounded-2xl space-y-4 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 bg-purple-600 text-white px-3 py-1 text-[10px] font-bold rounded-bl-xl">
                  MOST POPULAR
                </div>

                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-white">Pro Hospitality</h3>
                    <p className="text-xs text-slate-400">Full Dining, Coursing & CRM</p>
                  </div>
                </div>

                <div className="text-2xl font-bold text-purple-400">
                  KES 120,000 <span className="text-xs text-slate-500 font-normal">/ month</span>
                </div>

                <ul className="space-y-2 pt-3 border-t border-slate-800 text-slate-300">
                  <li className="flex items-center gap-2 text-emerald-400"><CheckCircle2 className="w-3.5 h-3.5" /> All Starter Features</li>
                  <li className="flex items-center gap-2 text-emerald-400"><CheckCircle2 className="w-3.5 h-3.5" /> Host Stand & Reservations</li>
                  <li className="flex items-center gap-2 text-emerald-400"><CheckCircle2 className="w-3.5 h-3.5" /> Seat-Level Ordering & Coursing</li>
                  <li className="flex items-center gap-2 text-emerald-400"><CheckCircle2 className="w-3.5 h-3.5" /> CRM 360 & Loyalty Engine</li>
                  <li className="flex items-center gap-2 text-emerald-400"><CheckCircle2 className="w-3.5 h-3.5" /> Events & QR Door Access</li>
                  <li className="flex items-center gap-2 text-slate-500"><XCircle className="w-3.5 h-3.5 text-slate-600" /> Hotel PMS & Tape Chart</li>
                </ul>
              </div>

              <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 shadow-xl">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-white">Enterprise OS</h3>
                    <p className="text-xs text-slate-400">Hotel, F&B, Accounting & Multi-Property</p>
                  </div>
                  <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded text-[10px] font-bold">FULL UNLOCK</span>
                </div>

                <div className="text-2xl font-bold text-amber-400">
                  KES 285,000 <span className="text-xs text-slate-500 font-normal">/ month</span>
                </div>

                <ul className="space-y-2 pt-3 border-t border-slate-800 text-slate-300">
                  <li className="flex items-center gap-2 text-emerald-400"><CheckCircle2 className="w-3.5 h-3.5" /> All Pro Features</li>
                  <li className="flex items-center gap-2 text-emerald-400"><CheckCircle2 className="w-3.5 h-3.5" /> Hotel PMS & Tape Chart</li>
                  <li className="flex items-center gap-2 text-emerald-400"><CheckCircle2 className="w-3.5 h-3.5" /> Predictive Inventory Forecasting</li>
                  <li className="flex items-center gap-2 text-emerald-400"><CheckCircle2 className="w-3.5 h-3.5" /> Double-Entry Accounting ERP</li>
                  <li className="flex items-center gap-2 text-emerald-400"><CheckCircle2 className="w-3.5 h-3.5" /> Multi-Property Consolidation</li>
                  <li className="flex items-center gap-2 text-emerald-400"><CheckCircle2 className="w-3.5 h-3.5" /> Dedicated SLA Support</li>
                </ul>
              </div>
            </div>

            {/* SaaS Add-On Module Marketplace */}
            <div className="pt-6 border-t border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider text-purple-400 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" />
                SaaS Optional Add-On Marketplace Modules
              </h3>

              <div className="grid grid-cols-2 gap-4">
                {MODULE_ADDONS.map(mod => (
                  <div key={mod.id} className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{mod.name}</span>
                        {mod.isPopular && (
                          <span className="px-2 py-0.2 bg-purple-500/20 text-purple-300 text-[9px] font-bold rounded">
                            POPULAR
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{mod.description}</p>
                      <span className="text-xs font-mono font-bold text-emerald-400 mt-1 block">
                        + KES {mod.priceMonthlyKes.toLocaleString()} / month
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        handleToggleEntitlement(mod.code);
                      }}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg text-xs transition-colors shrink-0"
                    >
                      Grant to Tenant
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: HARDWARE FLEET ================= */}
        {activeTab === 'FLEET' && (
          <div className="space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Hardware Fleet Remote Diagnostics & Telemetry</h2>
                <p className="text-xs text-slate-400">Monitor Edge POS nodes, thermal KOT printers, spirit scales & M-Pesa terminals</p>
              </div>
              <button
                onClick={() => showToast('Refreshed Edge fleet heartbeat telemetry!', 'info')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5 text-purple-400" />
                <span>Refresh Heartbeat</span>
              </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                    <th className="p-3">DEVICE NAME</th>
                    <th className="p-3">TENANT</th>
                    <th className="p-3">DEVICE TYPE</th>
                    <th className="p-3">EDGE VERSION</th>
                    <th className="p-3">IP ADDRESS</th>
                    <th className="p-3">STATUS</th>
                    <th className="p-3 text-right">REMOTE DIAGNOSTICS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {fleet.map(dev => (
                    <tr key={dev.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-bold text-white flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-purple-400 shrink-0" />
                        <div>
                          <div>{dev.deviceName}</div>
                          <span className="text-[10px] text-slate-500 font-normal">S/N: {dev.serialNumber}</span>
                        </div>
                      </td>
                      <td className="p-3 text-slate-300">{dev.tenantName}</td>
                      <td className="p-3 text-slate-400 font-semibold">{dev.deviceType}</td>
                      <td className="p-3 text-slate-400">{dev.edgeVersion}</td>
                      <td className="p-3 text-slate-400">{dev.ipAddress}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          dev.isOnline ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}>
                          {dev.isOnline ? 'ONLINE' : 'OFFLINE'}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-2">
                        <button
                          onClick={() => showToast(`Sent test ping to ${dev.deviceName} at ${dev.ipAddress}! Response: 2ms`, 'success')}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-bold"
                        >
                          Ping
                        </button>
                        <button
                          onClick={() => showToast(`Pushed configuration refresh signal to ${dev.deviceName}`, 'info')}
                          className="px-2.5 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg font-bold"
                        >
                          Push Config
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= TAB 4: INTEGRATIONS & WEBHOOKS ================= */}
        {activeTab === 'INTEGRATIONS' && (
          <div className="space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Integration Registry & Gateway Health Matrix</h2>
                <p className="text-xs text-slate-400">Monitor external APIs: Safaricom M-Pesa Daraja, KRA eTIMS, PesaLink PDQ, Twilio & SendGrid</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {integrations.map(ing => (
                <div key={ing.id} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm flex items-center gap-2">
                      <Radio className="w-4 h-4 text-purple-400" />
                      {ing.providerName}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      ing.status === 'OPTIMAL' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {ing.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-slate-400 text-[11px] pt-2 border-t border-slate-800">
                    <div>Category: <span className="text-white font-bold">{ing.category}</span></div>
                    <div>Active Tenants: <span className="text-white font-bold">{ing.tenantCount}</span></div>
                    <div>Secret Reference: <span className="text-amber-300 font-mono">{ing.secretMask}</span></div>
                    <div>24h Error Count: <span className="text-rose-400 font-bold">{ing.failureCount24h}</span></div>
                  </div>

                  <div className="pt-2 flex justify-between items-center text-[10px] text-slate-500 border-t border-slate-800/60">
                    <span>Last Success: {ing.lastSuccessAt}</span>
                    <button
                      onClick={() => showToast(`Triggered test health check for ${ing.providerName}. Status: 200 OK`, 'success')}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-purple-300 font-bold rounded-lg transition-colors"
                    >
                      Test Webhook
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 5: SUPPORT CONSOLE & AUDIT ================= */}
        {activeTab === 'SUPPORT_AUDIT' && (
          <div className="grid grid-cols-12 gap-6 font-mono text-xs">
            {/* Left: Support Cases Queue (Cols 7) */}
            <div className="col-span-7 space-y-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <LifeBuoy className="w-5 h-5 text-purple-400" />
                Support Cases & Ticket Inbox
              </h2>

              <div className="space-y-3">
                {supportCases.map(sc => (
                  <div key={sc.id} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2 shadow-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-amber-400">{sc.ticketNumber}</span>
                        <span className="text-slate-300 font-semibold">{sc.tenantName}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        sc.severity === 'HIGH' || sc.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {sc.severity}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-white">{sc.title}</h4>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                      <span>Assigned: {sc.assignedToAdmin}</span>
                      <button
                        onClick={() => {
                          setSupportCases(prev => prev.map(c => c.id === sc.id ? { ...c, status: 'RESOLVED' } : c));
                          showToast(`Support case ${sc.ticketNumber} marked as RESOLVED`, 'success');
                        }}
                        className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 font-bold rounded-lg border border-emerald-500/30 transition-colors"
                      >
                        {sc.status === 'RESOLVED' ? 'Resolved' : 'Mark Resolved'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Security Audit Log (Cols 5) */}
            <div className="col-span-5 space-y-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                Immutable Platform Audit Trail
              </h2>

              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-3 max-h-[70vh] overflow-y-auto">
                {auditLogs.map(log => (
                  <div key={log.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-purple-400 font-bold">
                      <span>{log.action}</span>
                      <span className="text-slate-500">{log.timestamp}</span>
                    </div>
                    <p className="text-xs text-white font-semibold">{log.tenantName}</p>
                    <p className="text-[11px] text-slate-400">{log.reason}</p>
                    <span className="text-[9px] text-slate-600 block">Actor: {log.actorEmail} ({log.ipAddress})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 6: HEALTH & FEATURE FLAGS ================= */}
        {activeTab === 'HEALTH_INCIDENTS' && (
          <div className="space-y-6 font-mono text-xs">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Platform Health & Global Feature Flags</h2>
                <p className="text-xs text-slate-400">Infrastructure status indicators, incident management & staged feature rollouts</p>
              </div>
            </div>

            {/* Microservice Indicators */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { name: 'Core API Gateway', status: 'OPTIMAL', latency: '12ms' },
                { name: 'PostgreSQL Database', status: 'OPTIMAL', latency: '4ms' },
                { name: 'Redis Edge Queue', status: 'OPTIMAL', latency: '2ms' },
                { name: 'M-Pesa Express Bridge', status: 'OPTIMAL', latency: '140ms' },
                { name: 'KRA eTIMS VSC Engine', status: 'OPTIMAL', latency: '85ms' },
                { name: 'Edge Hardware Fleet Hub', status: 'OPTIMAL', latency: '18ms' }
              ].map((serv, idx) => (
                <div key={idx} className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white block">{serv.name}</span>
                    <span className="text-[10px] text-slate-500">Latency: {serv.latency}</span>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[9px] font-bold">
                    {serv.status}
                  </span>
                </div>
              ))}
            </div>

            {/* Feature Flags Control */}
            <div className="pt-6 border-t border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider text-purple-400">
                Staged Feature Flags & Beta Rollouts
              </h3>

              <div className="space-y-3">
                {featureFlags.map(ff => (
                  <div key={ff.key} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{ff.name}</span>
                        <span className="px-2 py-0.2 bg-slate-800 text-amber-300 text-[10px] font-bold rounded">
                          {ff.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{ff.description}</p>
                      <span className="text-[10px] text-slate-500 font-mono mt-1 block">Key: {ff.key}</span>
                    </div>

                    <button
                      onClick={() => {
                        setFeatureFlags(prev => prev.map(f => f.key === ff.key ? { ...f, enabledGlobally: !f.enabledGlobally } : f));
                        showToast(`Feature flag "${ff.key}" updated`, 'info');
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        ff.enabledGlobally ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {ff.enabledGlobally ? 'GLOBALLY ENABLED' : 'DISABLED'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================= MODAL: SUPPORT IMPERSONATION ================= */}
      {isImpersonationModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Eye className="w-5 h-5 text-purple-400" />
                Launch Support Session
              </h3>
              <button onClick={() => setIsImpersonationModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-slate-300 block mb-1">Target Tenant Organisation</label>
              <input
                type="text"
                readOnly
                value={selectedTenant.name}
                className="w-full bg-slate-850 border border-slate-750 rounded-xl px-3 py-2 text-xs font-bold text-purple-300"
              />
            </div>

            <div>
              <label className="text-slate-300 block mb-1">Mandatory Justification / Ticket Number</label>
              <textarea
                required
                rows={3}
                placeholder="e.g. Debugging eTIMS tax transmission failure for invoice #INV-0028"
                value={impersonationReason}
                onChange={e => setImpersonationReason(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-[11px] text-purple-300 space-y-1">
              <span className="font-bold block">SECURITY & AUDIT POLICY:</span>
              <p>Support sessions are strictly time-limited (60 mins), display an active security banner in the tenant runtime, and log all actions to the immutable audit trail.</p>
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsImpersonationModalOpen(false)}
                className="px-4 py-2 text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStartImpersonation}
                className="px-5 py-2 font-bold bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-colors shadow-lg shadow-purple-600/20"
              >
                Start Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: STATUS JUSTIFICATION ================= */}
      {isStatusModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {selectedTenant.status === 'ACTIVE' ? 'Suspend Tenant Access' : 'Reactivate Tenant'}
              </h3>
              <button onClick={() => setIsStatusModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-slate-300 block mb-1">Reason / Justification Log</label>
              <textarea
                required
                rows={3}
                placeholder="e.g. Past due payment beyond 30-day grace period or non-compliance"
                value={statusReason}
                onChange={e => setStatusReason(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsStatusModalOpen(false)}
                className="px-4 py-2 text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmStatusChange}
                className="px-5 py-2 font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xl transition-colors"
              >
                Confirm State Change
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: 12-STEP PROVISIONING WIZARD ================= */}
      {isProvisionWizardOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden font-mono text-xs">
            {/* Wizard Header & Progress */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  Tenant Provisioning Wizard (Step {wizardStep} / 4)
                </h3>
                <p className="text-[11px] text-slate-400">Automated multi-tenant environment setup & initial seeding</p>
              </div>
              <button onClick={() => setIsProvisionWizardOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step Wizard Content */}
            <div className="p-6 space-y-4">
              {wizardStep === 1 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-purple-400">Step 1: Organization & Legal Identity</h4>
                  
                  <div>
                    <label className="text-slate-300 block mb-1">Business Operating Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Carnivore Restaurant Nairobi"
                      value={wizOrgName}
                      onChange={e => setWizOrgName(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 block mb-1">Legal Registered Entity Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Tamarind Group Kenya Ltd"
                      value={wizLegalName}
                      onChange={e => setWizLegalName(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-300 block mb-1">Country</label>
                      <input
                        type="text"
                        value={wizCountry}
                        onChange={e => setWizCountry(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="text-slate-300 block mb-1">Base Currency</label>
                      <select
                        value={wizCurrency}
                        onChange={e => setWizCurrency(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white"
                      >
                        <option value="KES">KES (Kenyan Shilling)</option>
                        <option value="USD">USD (US Dollar)</option>
                        <option value="EUR">EUR (Euro)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {wizardStep === 2 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-purple-400">Step 2: Subscription Tier & Owner Account</h4>

                  <div>
                    <label className="text-slate-300 block mb-1">Subscription Plan</label>
                    <select
                      value={wizPlanId}
                      onChange={e => setWizPlanId(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white"
                    >
                      <option value="plan-starter">Starter POS & Inventory (KES 45,000/mo)</option>
                      <option value="plan-pro">Pro Hospitality Suite (KES 120,000/mo)</option>
                      <option value="plan-enterprise">Enterprise Operating System (KES 285,000/mo)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-300 block mb-1">Tenant Owner Full Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Jane Doe"
                        value={wizOwnerName}
                        onChange={e => setWizOwnerName(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="text-slate-300 block mb-1">Owner Email Address</label>
                      <input
                        type="email"
                        placeholder="jane@carnivore.co.ke"
                        value={wizOwnerEmail}
                        onChange={e => setWizOwnerEmail(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {wizardStep === 3 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-purple-400">Step 3: Feature Entitlements & Initial Seeding</h4>

                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                    <span className="text-xs font-bold text-white block">INITIAL FEATURE KEYS:</span>
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-emerald-400">
                      {wizEntitlements.map(e => (
                        <div key={e} className="flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{e}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="seedDemoData"
                      checked={wizSeedDemoData}
                      onChange={e => setWizSeedDemoData(e.target.checked)}
                      className="rounded bg-slate-800 border-slate-700 text-purple-600 focus:ring-0"
                    />
                    <label htmlFor="seedDemoData" className="text-slate-300 text-xs">
                      Seed demo catalog items, menu categories, and stock locations
                    </label>
                  </div>
                </div>
              )}

              {wizardStep === 4 && (
                <div className="space-y-3 text-center py-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-white">Ready to Deploy Tenant!</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Clicking finish will provision database schemas, issue API authorization keys, and generate owner login credentials for "{wizOrgName}".
                  </p>
                </div>
              )}
            </div>

            {/* Wizard Navigation Footer */}
            <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex justify-between items-center">
              <button
                type="button"
                disabled={wizardStep === 1}
                onClick={() => setWizardStep(s => s - 1)}
                className="px-4 py-2 bg-slate-800 disabled:opacity-30 text-slate-300 rounded-xl font-bold"
              >
                Back
              </button>

              {wizardStep < 4 ? (
                <button
                  type="button"
                  onClick={() => setWizardStep(s => s + 1)}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold transition-colors"
                >
                  Next Step
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCompleteProvisioning}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-colors shadow-lg shadow-emerald-600/20"
                >
                  Complete & Provision
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlatformAdminView;
