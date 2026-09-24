# ServOS Codebase Decomposition & Architectural Refactoring Guide

As ServOS expands into a complete enterprise operating system, several core view components and context providers have grown significantly in complexity and file size:

- `ServOSContext.tsx` (~132 KB) — Master state store
- `StaffCashView.tsx` (~99 KB) — HR, Payroll, Shift & Till management
- `POSView.tsx` (~70 KB) — Point of Sale floorplan, order ticket & checkout
- `InventoryView.tsx` (~48 KB) — Stock ledger, AvT yield & predictive analytics

While these components function seamlessly, decomposing them into domain-driven modular features is crucial for long-term maintainability, team scaling, testability, and fast build performance.

---

## 1. Target Domain-Driven Directory Architecture

Move from flat view directories (`/src/components/pos`) to domain-isolated feature folders (`/src/features/pos`):

```
src/
├── core/                        # Core system utilities & global primitives
│   ├── types/                   # Master TypeScript definitions (servos.ts)
│   ├── utils/                   # Shared helpers (calculations, formatters)
│   └── hooks/                   # Generic custom hooks (useLocalStorage, useDebounce)
│
├── context/                     # Modular Context Providers
│   ├── ServOSMasterProvider.tsx # Top-level root provider wrapper
│   ├── AuthContext.tsx          # RBAC, user session & terminal identity
│   ├── POSContext.tsx           # Active orders, table states & floorplan
│   ├── HotelContext.tsx         # Rooms, reservations, folios & housekeeping
│   ├── InventoryContext.tsx     # Stock items, depletions, POs & AvT yield
│   └── AccountingContext.tsx    # Journals, eTIMS fiscal logs & tills
│
├── features/                    # Domain-Specific Product Modules
│   ├── command/                 # Executive Command Centre
│   │   ├── components/          # LensCards, LiveKpiBanner, UrgentAttentionList
│   │   └── CommandCentreView.tsx
│   │
│   ├── pos/                     # Point of Sale & Table Floorplan
│   │   ├── components/          # FloorplanGrid, OrderTicket, ModifierModal
│   │   ├── checkout/            # PaymentModal, MixedTenderModal, RefundModal
│   │   └── POSView.tsx
│   │
│   ├── catalog/                 # Catalog Studio & Dynamic Pricing
│   │   ├── components/          # ItemCatalog, YieldCalculator, RecipeBuilder
│   │   └── CatalogStudioView.tsx
│   │
│   ├── hotel/                   # Hotel PMS & Room Management
│   │   ├── components/          # TapeChart, CheckInWizard, HousekeepingBoard
│   │   └── HotelPMSView.tsx
│   │
│   ├── crm/                     # Guest 360 & Loyalty Hub
│   │   ├── components/          # CustomerList, ProfileTimeline, RewardsRedemption
│   │   └── CRM360View.tsx
│   │
│   └── events/                  # Events, Nightlife & Promoters
│       ├── components/          # TicketScanner, GuestList, PromoterPayouts
│       └── EventsNightlifeView.tsx
│
└── shared/                      # System-wide UI components
    ├── ui/                      # Base primitives (Button, Modal, Input, Badge)
    └── layout/                  # Header, Sidebar, UniversalInboxModal
```

---

## 2. Context Splitting Strategy

Currently, `ServOSContext.tsx` handles all state domain slices simultaneously. Splitting this into domain contexts reduces unnecessary re-renders and isolates domain logic:

```tsx
// Example Context Provider Composition Strategy
export const ServOSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AuthProvider>
      <InventoryProvider>
        <HotelProvider>
          <POSProvider>
            <AccountingProvider>
              {children}
            </AccountingProvider>
          </POSProvider>
        </HotelProvider>
      </InventoryProvider>
    </AuthProvider>
  );
};
```

---

## 3. Step-by-Step View Component Decomposition Plan

### Decomposing `POSView.tsx` (~70 KB):
1. **Extract Sub-Components**:
   - `<TableFloorplanGrid />` — Floorplan rendering & section filter tabs.
   - `<CurrentOrderTicket />` — Active ticket item list, modifiers, and action buttons.
   - `<ProductCatalogGrid />` — Product category menu, search bar, and item tiles.
   - `<CheckoutSubsystem />` — Payment modal, tender selector, and receipt printer.
2. **Isolate Local Hooks**:
   - `useOrderBuilder()` — Manages cart state, modifiers selection, and total calculations.
   - `useTableManager()` — Handles table occupancy switching and check transfers.

### Decomposing `StaffCashView.tsx` (~99 KB):
1. **Extract Sub-Components**:
   - `<StaffDirectoryTable />` — Employee roster, role badges, and PIN management.
   - `<ShiftSchedulerCalendar />` — Weekly shift allocations and roster publishing.
   - `<PayrollProcessorTab />` — Salary, overtime, deductions, and payslip generator.
   - `<TillReconciliationGrid />` — Opening balance, cash drops, and variance audit logs.

### Decomposing `HotelPMSView.tsx`:
1. **Extract Sub-Components**:
   - `<HotelTapeChart />` — Multi-day room reservation timeline calendar.
   - `<HousekeepingBoard />` — Room cleaning state cards with inspection modal.
   - `<MaintenanceWorkspace />` — Engineering work orders and parts log.
   - `<DedicatedCheckInModal />` — Multi-step guest check-in wizard.

---

## 4. Performance & Code Quality Guidelines

1. **Selective Memoization**: Wrap heavy sub-components (such as `HotelTapeChart` grids and `CatalogStudioView` recipe items) in `React.memo` to prevent re-renders when unrelated header states change.
2. **Lazy Loading Views**: Use React dynamic imports (`React.lazy`) for non-critical views (e.g., `SettingsCenterView`, `EventsNightlifeView`) to split bundle chunks:
   ```tsx
   const SettingsCenterView = React.lazy(() => import('./features/settings/SettingsCenterView'));
   ```
3. **Type Safety & Strict Validation**: Maintain strict TypeScript interface compliance without resorting to `any` or loose type casting.
4. **Zero Inline Styles**: Enforce utility-first Tailwind CSS classes throughout all refactored component files.
