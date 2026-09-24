# ServOS Operational Gap Analysis & Production Roadmap

This document provides a systematic analysis of operational gaps identified in hospitality workflows, details recent major enhancements implemented, and establishes a 10-step strategic development sequence to transition ServOS from a high-fidelity prototype into an enterprise-grade operating system.

---

## 🚀 Key Implemented Enhancements

Based on operational feedback, the following core management modules and transactional capabilities have been fully integrated into the ServOS frontend codebase:

### 1. ServOS Command Centre (`CommandCentreView.tsx`)
- **Executive Lens Switcher**: Role-customized views for GM, Owner, F&B Manager, Hotel Manager, and Finance Controller.
- **Live Metrics Banner**: Real-time revenue, occupancy percentage, gross profit, total orders, cash variance, and active alerts.
- **Live Operations Dashboard**: Instant counts for occupied tables, occupied rooms, active KDS kitchen tickets, on-duty staff, and VIP tables.
- **Needs Attention Panel**: Automated priority queue highlighting critical stockouts, till variances, overdue maintenance, pending approvals, and supplier invoices.

### 2. Universal Action & Task Inbox (`UniversalInboxModal.tsx`)
- **Centralized Work Queue**: A single operational inbox consolidating approvals, low stock alerts, cash variances, housekeeping exceptions, failed payments, offline sync conflicts, and maintenance tickets.
- **Direct Action Execution**: One-click resolution (e.g., Approve Discount, Dispatch Engineer, Create PO) directly from the item card.

### 3. Catalog Studio & Yield Engine (`CatalogStudioView.tsx`)
- **Portion & Yield Configurator**: Defines shots (30ml), doubles (60ml), half bottles (375ml), and full bottles (750ml) with theoretical yield calculations and allowable loss percentages.
- **Cocktail Recipe Builder**: Ingredient assembly with precise milliliter depletions and modifier rules.
- **Price Books & Dynamic Pricing Engine**: Timed happy hour rules, VIP tiers, and outlet targeting.

### 4. CRM 360 & Loyalty Hub (`CRM360View.tsx`)
- **Unified Guest Profiles**: Lifetime spend metrics, visit count, hotel nights, preferred drink/table, and complete interaction timeline.
- **Tiered Loyalty Engine**: Automatic point accrual and reward tier calculations (Bronze, Silver, Gold, Platinum, VIP) with instant POS redemption.

### 5. Events & Nightlife Module (`EventsNightlifeView.tsx`)
- **Event Capacity & Ticket Monitoring**: Real-time ticket sales, door revenue, and VIP table reservations.
- **Door Access Scanner**: QR code validator with instant signature verification.
- **Promoter Management & B2C Payouts**: Guest list tracking and automated promoter commission payouts via M-Pesa B2C.

### 6. Hotel PMS Expansion (`HotelPMSView.tsx`, `HotelTapeChart.tsx`, `HousekeepingBoard.tsx`, `MaintenanceWorkspace.tsx`)
- **Reservation Tape Chart**: Visual room occupancy grid across multi-day calendar spans.
- **Guided Check-In Wizard**: 3-step check-in flow with guest ID verification, deposit payment, and RFID key encoding.
- **Housekeeping Inspection Workspace**: Room clean/dirty state tracking with mobile inspection checklists.
- **Engineering Work Orders**: Maintenance ticketing with priority levels, assigned technicians, and spare parts tracking.

### 7. POS Transactional Capabilities (`POSView.tsx`, `MixedTenderModal.tsx`, `RefundModal.tsx`, `TableMergeModal.tsx`)
- **Mixed & Partial Tender**: Settlement builder allowing combinations of M-Pesa, Cash, Credit Card, and Room Charge.
- **Itemized Refunds & Credit Notes**: Item-level return processing generating KRA eTIMS credit notes with reason logging.
- **Check Merging**: Seamless merging of multiple table checks into a single bill.
- **Customer Assignment**: Direct linking of guest CRM profiles at POS for points accumulation and preference alerts.

### 8. Settings & Administration Center (`SettingsCenterView.tsx`)
- **Property & Outlet Configuration**: Multi-property setup and terminal assignment.
- **Role Permission Matrix**: Fine-grained RBAC matrix (Manager, Bartender, Cashier, Front Desk, Housekeeper) controlling access to sensitive operations.

### 9. Interactive Floor Plan Designer Studio (`FloorPlanDesignerView.tsx`)
- **Visual Section Grid Editor**: Drag-and-grid floorplan designer supporting Main Dining, VIP Cabanas, Outdoor Terrace, and Grill Room.
- **Table Customization & Geometry**: Shapes (Square, Round, Rectangle, Bar Top), capacity, server zone assignment, joinable party flags, and minimum spend requirements (e.g. KES 15,000 for VIP cabanas).
- **POS Live State Sync**: Immediate publishing of custom layouts directly to live POS floor views.

### 10. Tender Reconciliation & Shift Settlement Center (`TenderReconciliationView.tsx`)
- **Multi-Channel Settlement Audit**: Side-by-side reconciliation between expected POS revenue and counted drops across Cash, M-Pesa Express, Card PDQ Batches, Hotel Guest Postings, and Delivery Payouts.
- **Automated Variance & Supervisor Notes**: Discrepancy flagging (`Actual - Expected`) with required supervisor notes for variances exceeding tolerance thresholds.
- **Service Charge & Tip Pool Distribution**: Tip calculation split between Waitstaff, Kitchen, Bar, and Support runners with automated M-Pesa B2C payout triggers.

### 11. Sub-Recipe & Production Batch Studio (`BatchProductionView.tsx`)
- **Prep Run Manufacturing**: Central kitchen and bar prep management for house sauces, cocktail premixes, marinades, and dough bases.
- **Batch Scaling & Stock Depletion**: Multiplier scaling (0.5x to 5.0x) with raw ingredient inventory depletion and yield efficiency variance tracking.

### 12. Analytics & Reports Centre (`ReportsCenterView.tsx`)
- **Comprehensive Operational Reporting**: Sales & Covers per head (RevPASH), hourly peak revenue curves, Kitchen Speed SLA & ticket turn times, and Boston Matrix Menu Engineering (Stars, Plowhorses, Puzzles, Dogs).
- **Financial & Audit Exports**: CSV and PDF reporting exports.

### 13. Digital QR Table Self-Ordering Experience (`QROrderingGuestView.tsx`)
- **Mobile Guest Ordering Interface**: Web app simulation for table QR code scanning.
- **Instant KDS Routing**: Guest cart builder with dietary notes, routing orders directly to Kitchen/Bar KDS passes, and choice of "Add to Table Bill" or instant M-Pesa STK Push checkout.

### 14. Multi-Location Stock Transfer & Store Requisition (`StockRequisitionModal.tsx`)
- **Internal Store Requisitioning**: Inter-outlet transfer requests from Central Cellar / Bulk Store to sub-outlets (Rooftop Bar, Poolside Bar, Grill Pass) with multi-item line creation and transfer logs.

---

## 🎯 Target Functional Gaps & Future Roadmap Items

While the transactional core and management screens are now robust, the following high-value enterprise features remain on the product roadmap:

### 1. Barcode & Scanner Mode at POS
- **Gap**: POS currently relies on touch search or category navigation.
- **Target Solution**: Add a dedicated USB/Bluetooth barcode scanner listener (`scan-first mode`) that immediately increments item count upon hardware scan without requiring manual modal interaction.

### 2. Production Batching & Premix Recipe UI
- **Gap**: Inventory tracks spirit depletion but lacks a batch manufacturing UI for central kitchens or bars (e.g., premixing 10 Liters of House Cocktail, dough preparation, or sauces).
- **Target Solution**: Create a **Production Batch Workspace** where raw inputs are consumed and a produced parent item is credited into stock with expected vs. actual yield variance tracking.

### 3. Procurement Requisitions & Quote Comparison Matrix
- **Gap**: PO creation currently assumes a pre-selected supplier.
- **Target Solution**: Implement departmental **Purchase Requisitions** followed by a 3-way **Vendor Quote Comparison Matrix** evaluating price, delivery SLA, and payment terms before PO approval.

### 4. Automatic Bank & M-Pesa Reconciliation
- **Gap**: Till closing tracks cash variances, but digital M-Pesa statement reconciliation requires manual cross-checking.
- **Target Solution**: Automated statement importer comparing M-Pesa C2B transaction IDs against ServOS payment ledger logs, flagging unmatched exceptions.

### 5. Corporate Accounts & Accounts Receivable (AR)
- **Gap**: Room charges post to guest folios, but corporate accounts (e.g., Safaricom corporate stay tabs) lack credit limit tracking and aged invoicing.
- **Target Solution**: Dedicated **AR Subledger** managing corporate credit accounts, invoice statements, and payment collection schedules (Current, 30, 60, 90 days).

### 6. Custom Report & Analytics Builder
- **Gap**: Reporting relies on pre-built dashboards.
- **Target Solution**: A drag-and-drop **Custom Reporting Engine** supporting custom date range comparisons, menu engineering matrix (Stars, Plowhorses, Dogs, Puzzles), and export to PDF/CSV/Excel.

### 7. React Router & Deep-Linking Architecture
- **Gap**: Screen navigation relies on tab state (`activeTab === 'pos'`), which prevents browser URL bookmarking and deep linking to specific orders or room folios.
- **Target Solution**: Migrate navigation to React Router (`/pos/orders/:id`, `/hotel/rooms/:id`, `/inventory/items/:id`).

### 8. Record Detail Drawers & Activity Timelines
- **Gap**: Entities are edited via full-screen modals.
- **Target Solution**: Introduce side drawers (`<Drawer />`) for quick entity inspection (e.g., clicking a stock item opens a drawer showing recent movement history without navigating away from the current page).

### 9. Daylight & High-Contrast POS Theme
- **Gap**: Dark mode is ideal for dimly lit night venues, but hard to read on outdoor terrace POS tablets under daylight.
- **Target Solution**: Add a high-contrast `Daylight POS Mode` toggle in the header.

---

## 🗓️ 10-Step Sequential Production Roadmap

```
Step 1: ServOS Command Centre (COMPLETED)
   ├── Multi-lens executive dashboards (GM, Owner, F&B, Hotel, Finance)
   └── Real-time operational KPI telemetry

Step 2: Catalog Studio & Pricing Engine (COMPLETED)
   ├── Spirits yield configurator & recipe builder
   └── Timed price books & promotional rules

Step 3: CRM 360 & Loyalty Engine (COMPLETED)
   ├── Guest profiles, spend timelines & preference tracking
   └── Loyalty points accrual & POS redemption

Step 4: Full Hotel Operations Expansion (COMPLETED)
   ├── Interactive Tape Chart calendar
   ├── Guided check-in wizard & keycard encoding
   └── Housekeeping inspection board & engineering tickets

Step 5: Advanced POS Transactions (COMPLETED)
   ├── Mixed/split tender settlement
   ├── Itemized credit note refunds & voids
   └── Table check merging & CRM guest attachment

Step 6: Events, Nightlife & Promoter Management (COMPLETED)
   ├── Ticket QR scanner & door access validator
   └── Promoter guest list attribution & M-Pesa B2C payouts

Step 7: Production Batching & Central Kitchen Engine (UPCOMING)
   ├── Batch recipe manufacturing (Syrups, Mixes, Dough)
   └── Yield variance logging

Step 8: M-Pesa / Bank Automated Reconciliation & AR (UPCOMING)
   ├── Automated statement matcher
   └── Corporate credit accounts & aged AR ledgers

Step 9: Standalone Reporting & Custom Analytics Builder (UPCOMING)
   ├── Custom report builder & menu engineering matrix
   └── Scheduled PDF/CSV exports

Step 10: Router Deep-Linking & Architectural Refactoring (UPCOMING)
   ├── React Router migration (/pos/orders/102)
   ├── Component decomposition into /src/features/
   └── Record detail side drawers & standardized UI states
```
