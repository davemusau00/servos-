# ServOS Restaurant + SaaS Admin Expansion Specification

**Repository:** `davemusau00/ServOs`  
**Purpose:** Define the restaurant-specific product depth and SaaS administration layer required to evolve ServOS from a hospitality operations application into a multi-tenant hospitality operating platform.

---

## 1. Product Direction

ServOS operates as two complementary layers on one domain foundation:

1. **ServOS Hospitality Runtime**: For restaurants, bars, clubs, hotels, kitchens, stores, finance teams, and staff.
2. **ServOS Platform Control Plane**: For ServOS platform administrators, implementation partners, and tenant managers to provision tenants, subscription plans, feature entitlements, hardware devices, third-party integrations, support, and health monitoring.

**Operating Principle:**
> Every hospitality action must have visible operational, inventory, payment, staff, tax, and accounting consequences.

---

## 2. Platform Architecture & Dual Control Plane

```
                                  ┌─────────────────────────────────────────┐
                                  │           ServOS Global Kernel          │
                                  └────────────────────┬────────────────────┘
                                                       │
               ┌───────────────────────────────────────┴───────────────────────────────────────┐
               │                                                                               │
 ┌─────────────▼───────────────┐                                                 ┌─────────────▼───────────────┐
 │ ServOS Hospitality Runtime  │                                                 │ ServOS SaaS Control Plane   │
 │   (Multi-Outlet Tenant)     │                                                 │    (Platform Superadmin)    │
 ├─────────────────────────────┤                                                 ├─────────────────────────────┤
 │ • POS, Seat & Coursing      │                                                 │ • Multi-Tenant Lifecycle    │
 │ • Host Stand & Waitlist     │                                                 │ • Subscription Plans & Billing│
 │ • Catalog Studio & Pricing  │                                                 │ • Granular Entitlements     │
 │ • Multi-Station KDS & Expo  │                                                 │ • Hardware Fleet Diagnostics│
 │ • Guest 360 & Loyalty       │                                                 │ • Tenant Support Sessions   │
 │ • Hotel PMS & Tape Chart    │                                                 │ • Integration Registry      │
 │ • AvT Yield & Inventory ERP │                                                 │ • Platform Health & Audit   │
 └─────────────────────────────┘                                                 └─────────────────────────────┘
```

---

## 3. Restaurant Front-of-House Depth

### A. Seat-Level Ordering
- Assign items to specific seats (`Seat 1`, `Seat 2`, `Shared / Table`).
- Support item movement across seats, seat-based bill splitting, and seat receipt printing.

### B. Coursing Engine
- Default courses: `Drinks`, `Starters`, `Mains`, `Dessert`, `Custom`.
- Course statuses: `HELD` $\rightarrow$ `FIRED` $\rightarrow$ `PREPARING` $\rightarrow$ `READY` $\rightarrow$ `SERVED`.
- POS controls: Hold Course, Fire Course, Fire Next, Rush Item.
- KDS ticket grouping by course with visual SLA badges.

### C. Host Stand, Reservations & Live Waitlist
- Three-pane workspace: **Reservations / Waitlist Queue** | **Live Floor Canvas** | **Guest / Table Context**.
- Reservation lifecycle: `BOOKED` $\rightarrow$ `CONFIRMED` $\rightarrow$ `ARRIVED` $\rightarrow$ `SEATED` $\rightarrow$ `COMPLETED` (or `NO_SHOW` / `CANCELLED`).
- Waitlist management: Quoted vs. actual wait time tracking, SMS arrival notifications, party seating, and customer linking.

### D. Advanced Check & Table Settlement
- Multi-tender settlement (M-Pesa, Cash, Card, Room Charge, Gift Card).
- Itemized credit note refunds with reason code audit.
- Table & check merging with item consolidation.

---

## 4. SaaS Platform Control Plane (`apps/platform-admin`)

### A. Tenant Lifecycle Management
- States: `TRIAL` $\rightarrow$ `ONBOARDING` $\rightarrow$ `ACTIVE` $\rightarrow$ `PAST_DUE` $\rightarrow$ `SUSPENDED` $\rightarrow$ `CANCELLED` $\rightarrow$ `ARCHIVED`.
- Tenant detail: Business info, billing identity, properties/outlets, assigned users, active devices, health, and support cases.

### B. Subscription Plans & Entitlements
- Never check raw plan names in code; evaluate fine-grained entitlements:
  - `restaurant.pos`, `restaurant.kds`, `restaurant.coursing`, `restaurant.reservations`, `restaurant.host_stand`
  - `inventory.basic`, `inventory.predictive`, `inventory.commissary`
  - `hotel.pms`, `hotel.housekeeping`
  - `finance.accounting`, `finance.etims`
  - `platform.api`, `platform.multi_property`
- Quotas & limits enforcement (`properties`, `outlets`, `terminals`, `users`, `monthly_orders`).

### C. Tenant Provisioning Wizard
- Guided 12-step automated provisioning: Organization $\rightarrow$ Region $\rightarrow$ Currency $\rightarrow$ Plan $\rightarrow$ Outlets $\rightarrow$ Admin User $\rightarrow$ Fiscal Config $\rightarrow$ Seed Data.

### D. Hardware Fleet Management
- Remote monitoring of Edge nodes, thermal printers, scale bridges, and M-Pesa POS devices.
- Diagnostic commands: Test Print, Config Refresh, Remote Diagnostics, Credential Rotation.

### E. Support Console & Audit
- Impersonation support sessions requiring explicit reason, time-limited tokens, visible banner, and immutable audit logs.

# ServOS Restaurant + SaaS Admin Expansion
## Comprehensive Feature, Module & Developer Instruction Specification

**Repository:** `davemusau00/ServOs`  

---

## 1. Product Direction

ServOS should be treated as two products sharing one domain foundation:

1. **ServOS Hospitality Runtime** for restaurants, bars, clubs, hotels, kitchens, stores, finance teams and staff.
2. **ServOS Platform Control Plane** for ServOS administrators, implementation partners and tenant administrators to provision tenants, plans, billing, entitlements, devices, integrations, support and system health.

The operating principle remains:

> Every hospitality action should have visible operational, inventory, payment, staff, tax and accounting consequences.

ServOS should not become another POS with many disconnected tabs. The frontend should make the business feel like one living system.

---

## 2. Current Strengths to Preserve

The current frontend already covers substantial ground:

- POS sales and tables
- measured product portions such as shots and bottles
- modifiers and mixers
- comps and discounts
- order voiding
- bill splitting
- table transfer
- cash, M-Pesa, card and room-charge concepts
- thermal receipts
- KDS
- hotel rooms, folios and minibar posting
- inventory movement ledger
- beverage actual-vs-theoretical reconciliation
- waste
- stock counts
- transfers
- predictive inventory
- procurement / PO / GRN concepts
- accounts payable concepts
- double-entry accounting
- eTIMS concepts
- control/audit and approvals
- global search
- offline queue / IndexedDB
- Edge hardware diagnostics
- staff, leave, shifts, payroll and salary advances
- till sessions
- tip-pool concepts
- executive analytics
- frontend RBAC / permission-aware navigation

The next work should deepen restaurant service flow and add the missing SaaS platform layer rather than simply adding more dashboards.

---

# PART A — COMPETITIVE GAP SUMMARY

## 3. Restaurant Platforms Set a Higher Front-of-House Baseline

Mature restaurant products commonly include:

- editable floor plans
- seat tracking
- server sections
- table timers
- coursing
- hold/fire
- item movement between seats/checks
- table merging
- waitlists
- reservations
- customer profiles
- loyalty
- online ordering
- QR ordering
- gift cards
- customer-facing displays
- kiosk
- marketing
- restaurant analytics

ServOS already has a stronger-than-average internal control story around measured consumption, AvT beverage yield, integrated accounting, hotel cross-charge and audit. The missing restaurant depth is mostly service orchestration and guest/revenue tooling.

## 4. Front-of-House Gap

ServOS currently needs:

- seat-level service
- coursing
- hold/fire
- server sections and rotation
- floor-plan designer
- table merge
- item/check merge
- reservation book
- waitlist
- guest identity at POS
- pre-shift guest intelligence
- no-show/deposit workflows

## 5. Guest Growth Gap

ServOS currently needs:

- unified restaurant/hotel/event CRM
- loyalty
- gift cards
- vouchers/store credit
- direct online ordering
- QR ordering
- marketing segments
- guest feedback
- service recovery

## 6. Menu Administration Gap

The POS can already express sophisticated product behavior, but there is no sufficiently deep visual administration layer for:

- menus
- products
- portions
- recipes
- modifiers
- combos
- price books
- dayparts
- promotions
- availability
- kitchen routing
- allergens
- channel visibility

## 7. SaaS Commercialization Gap

The existing application represents a hospitality tenant. A sellable SaaS platform still needs:

- tenant lifecycle
- subscription lifecycle
- plan builder
- entitlements
- limits/quotas
- billing
- trials
- onboarding
- provisioning
- feature flags
- release management
- integration management
- hardware fleet management
- support console
- platform health
- security center
- data operations
- customer success
- usage analytics

---

# PART B — RESTAURANT PRODUCT MODULES

## 8. Restaurant Command Centre

Create a role-aware restaurant home screen.

### Owner view
- gross sales
- net sales
- gross margin
- prime cost
- labor %
- food cost %
- beverage cost %
- average check
- covers
- cash variance
- stock variance
- AP
- AR
- high-severity risks

### Manager view
- reservations today
- walk-ins
- waitlist
- occupied tables
- table turn
- average ticket age
- KDS backlog
- staff on duty
- out-of-stock items
- pending approvals
- complaints/service recovery

### Kitchen manager view
- active tickets
- SLA breaches
- station load
- prep shortages
- 86 list
- batches due
- waste
- top slow items

### Requirements
- widget customization
- role-based defaults
- date/shift switcher
- property/outlet scope
- drill-down
- live refresh
- responsive manager view

---

## 9. Reservations

Create a native restaurant reservation domain, separate from hotel reservations.

### Reservation fields
- guest
- date
- start time
- duration
- party size
- table preference
- section
- experience/package
- source
- notes
- dietary/allergy notes
- occasion
- deposit
- minimum spend
- status

### Statuses
`BOOKED -> CONFIRMED -> ARRIVED -> SEATED -> COMPLETED`

Exception states:
`NO_SHOW`, `CANCELLED`

### Sources
- phone
- walk-in future booking
- website
- Google
- social
- concierge
- hotel guest
- corporate
- external API

### UX
- day view
- timeline view
- table assignment
- drag reservation
- resize duration
- color by state
- capacity indicators
- deposit status

---

## 10. Waitlist

Create:

- party name
- phone
- party size
- preferred area
- quoted wait
- actual wait
- guest profile
- notes

Statuses:
`WAITING -> NOTIFIED -> ARRIVED -> SEATED`

Exception:
`CANCELLED`, `WALKED_AWAY`

Actions:
- text guest
- update quote
- seat
- convert to reservation
- attach existing customer

---

## 11. Host Stand

Build a three-pane host workspace:

```text
RESERVATIONS / WAITLIST | FLOOR | GUEST/TABLE CONTEXT
```

The host should be able to:

- seat a reservation
- seat a walk-in
- move a party
- join tables
- assign server
- mark arrived
- mark no-show
- see VIP/dietary notes
- send SMS
- inspect spend/history

---

## 12. Floor Plan Designer

Current table selection should evolve into a proper floor canvas.

### Designer tools
- drag tables
- resize
- rotate
- change shape
- add bar seats
- assign table capacity
- assign section
- mark joinable tables
- add walls/obstacles
- hide/disable table
- configure minimum spend
- configure server zone

### Service floor card
Show:
- table number
- covers
- server
- elapsed seated time
- order total
- current course
- KDS state
- payment state
- reservation name
- VIP marker
- alerts

---

## 13. Server Sections & Rotation

Add:

- sections
- assigned server
- server rotation
- covers per server
- open tables per server
- workload visibility

Do not auto-assign blindly. The UI may recommend the next server but allow host override.

---

## 14. Seat-Level Ordering

Add `seatId` to order items.

Support:
- Seat 1, Seat 2, etc.
- Shared/Table items
- move item between seats
- split by seat
- pay by seat
- print seat check
- transfer seat between tables

Suggested type:

```ts
interface DiningSeat {
  id: string;
  tableId: string;
  label: string;
  position: number;
}
```

---

## 15. Coursing

This is a P0 restaurant feature.

Suggested model:

```ts
interface OrderCourse {
  id: string;
  orderId: string;
  name: string;
  sequence: number;
  status: 'HELD' | 'FIRED' | 'PREPARING' | 'READY' | 'SERVED';
  firedAt?: string;
  readyAt?: string;
  servedAt?: string;
}
```

Default courses:
- drinks
- starter
- soup
- main
- dessert

Support custom course names.

### POS actions
- assign item to course
- hold
- fire
- fire next
- fire selected item
- delay
- mark served

### Ticket UI
```text
DRINKS     SENT
STARTERS   READY
MAINS      HELD
DESSERT    HELD
```

---

## 16. Full Order Lifecycle

Expand item states:

`OPEN -> HELD -> ROUTED -> ACKNOWLEDGED -> PREPARING -> READY -> EXPO -> SERVED`

Exceptions:
`RETURNED`, `VOIDED`

Order modes:
- dine-in
- bar
- takeaway
- pickup
- delivery
- room service
- QR
- kiosk
- catering
- event
- staff meal
- complimentary
- house account

Actions:
- hold
- send
- fire
- rush
- move seat
- transfer table
- merge
- split
- reopen
- void item
- void order
- comp
- discount
- price override
- refund
- reprint
- resend KDS
- note
- customer assignment

---

## 17. Check / Bill Merge

Current transfer and split are not enough.

Support:
- merge checks
- merge tables
- move selected items
- move selected seats
- preserve audit
- preserve server attribution

Merged physical tables should be temporary service groups, not permanent floor-plan changes.

---

## 18. Advanced Bill Splitting

Support:
- equal split
- by item
- by seat
- custom amount
- percentage
- separate checks

A split must create clear settlement allocations without corrupting original sales attribution.

---

## 19. Mixed & Partial Tender

One order must accept multiple payments.

Example:

```text
TOTAL 12,600
M-PESA 6,000
CASH   4,000
CARD   2,600
BALANCE 0
```

Suggested model:

```ts
interface PaymentAllocation {
  id: string;
  orderId: string;
  tenderType: TenderType;
  amount: number;
  status: PaymentState;
}
```

Support:
- partial settlement
- later settlement
- multiple M-Pesa payments
- room charge + cash
- gift card + card

---

## 20. Refunds

Separate voids from refunds.

Refund UX:
- locate original order
- choose full / partial
- choose item(s)
- quantity
- reason
- destination tender
- approval
- tax/fiscal adjustment
- stock return decision where applicable

Statuses:
`REQUESTED -> APPROVED -> PROCESSED -> FAILED`

---

## 21. Tips & Service Charge

Add POS-level tip handling.

Support:
- fixed
- %
- cash tip
- card tip
- M-Pesa tip
- server tip
- pooled tip

Service charge rules:
- outlet
- party size
- event
- section
- order type

The staff tip pool should consume these records rather than separate manual data.

---

## 22. Customer Assignment at POS

Every check may attach:
- guest/customer
- hotel guest
- company account
- event guest

POS should show:
- tier
- points
- preferences
- allergies
- notes
- favorite items
- prior visits

---

## 23. Menu & Catalog Studio

Create a full administrative module.

### Sections
- Products
- Menus
- Categories
- Portions
- Recipes
- Modifiers
- Combos
- Packages
- Pricing
- Availability
- Channels
- Tax
- Kitchen Routing

### Product editor tabs
1. Basics
2. Pricing
3. Portions
4. Recipe
5. Modifiers
6. Channels
7. Routing
8. Inventory
9. Tax
10. Availability
11. Allergens
12. Reporting
13. History

---

## 24. Modifier Engine

Support:
- required groups
- optional groups
- min/max selections
- defaults
- substitution
- price delta
- ingredient delta
- nested modifier sets
- channel visibility
- KDS display order

Example:

```text
STEAK TEMPERATURE [choose 1]
Rare
Medium Rare
Medium
Medium Well
Well Done

SIDES [choose 2]
Fries
Mash
Vegetables
Salad
```

---

## 25. Combos & Choice Groups

Support product compositions:

```text
BURGER COMBO
Choose 1 burger
Choose 1 side
Choose 1 drink
Optional dessert
```

The engine must still calculate:
- component depletion
- cost
- price
- tax
- substitutions

---

## 26. Pricing Engine

Price scopes:
- organization
- property
- outlet
- channel
- customer tier
- daypart
- event
- table section
- room service
- staff

Rule types:
- fixed
- percentage
- amount
- bundle
- buy X get Y
- quantity break
- happy hour
- coupon
- voucher
- membership
- minimum spend

Rule metadata:
- priority
- exclusive
- stackable
- approval required

---

## 27. Menu Availability / 86

Staff must be able to:
- 86 item
- 86 modifier
- set quantity remaining
- set temporary unavailable
- set unavailable until time
- set channel-specific availability

KDS and online channels must update.

---

## 28. Recipe Studio

Create proper recipes with:
- ingredients
- quantities
- unit conversions
- yield
- trim loss
- prep loss
- batch size
- instructions
- station
- cost
- image
- allergens

Support recipe versioning.

Historical COGS should use cost snapshots and must not be rewritten by later recipe edits.

---

## 29. Sub-Recipes

Examples:
- tomato sauce
- dough
- simple syrup
- dressing
- stock
- marinade

Sub-recipes become produced inventory consumed by finished recipes.

---

## 30. Production & Prep

Create:
- prep list
- batch production
- expected yield
- actual yield
- waste
- shelf life
- expiry
- lot

Example:

```text
TOMATO SAUCE BATCH
INPUT 12.4 kg
EXPECTED 10.0 L
ACTUAL 9.6 L
VARIANCE -4%
```

---

## 31. Advanced KDS

Current KDS should evolve into a multi-station system.

Stations:
- grill
- fry
- salad
- pizza
- dessert
- bar
- coffee
- expo

Route by:
- product
- category
- modifier
- order type
- course
- outlet

Ticket indicators:
- age
- SLA
- rush
- VIP
- allergy
- course
- promised pickup time
- delivery status

Actions:
- bump
- recall
- re-fire
- item bump
- transfer station
- hold
- fire
- sold-out
- all-day count

---

## 32. Expo

Create a dedicated expo view aggregating all stations.

For each order show:
- station completion
- missing items
- course
- runner
- table
- allergies
- elapsed time

State:
`WAITING -> PARTIAL -> COMPLETE -> RUNNER_ASSIGNED -> SERVED`

---

## 33. Customer-Facing Display

Counter service needs:
- item list
- modifiers
- subtotal
- discount
- tax
- total
- loyalty
- tip
- payment state
- order confirmation

Optional branded promotion panel.

---

## 34. QR Ordering

QR identifies:
- table
- room
- event
- outlet

Customer can:
- browse
- modify
- order
- reorder
- pay
- tip
- request waiter
- request bill

Modes:
- waiter approves
- auto-send
- prepay
- open-tab

Use the same core `Order` domain.

---

## 35. Kiosk

Support:
- large touch UI
- menu images
- modifiers
- combos
- upsell
- dine-in/takeaway
- payment
- receipt
- timeout/reset
- accessibility

---

## 36. Online Ordering

Customer storefront:
- location selection
- menu
- modifiers
- pickup
- delivery
- scheduled ordering
- promo
- loyalty
- payment
- tracking

Restaurant controls:
- online hours
- lead time
- throttling
- pause orders
- item availability
- delivery radius
- minimum order

All orders must normalize into the same ServOS order engine.

---

## 37. Delivery Adapter Layer

Create provider adapters.

Normalize:
- marketplace
- external order ID
- gross sale
- commission
- net payout
- driver
- status
- reconciliation

Do not build marketplace-specific logic inside POS components.

---

## 38. CRM / Guest 360

Use one identity across restaurant, hotel, club and events.

Profile:
- name
- contact
- consent
- birthday
- anniversary
- preferences
- allergies
- favorite items
- favorite table
- favorite server
- visit history
- stay history
- event history
- lifetime spend
- average check
- no-shows
- tags
- notes
- loyalty
- gift cards
- credit

Automatic tags:
- VIP
- high spender
- frequent lunch
- wine buyer
- hotel guest
- frequent no-show
- corporate
- birthday month

---

## 39. Pre-Shift Guest Brief

Before service, show:
- VIP reservations
- birthdays
- anniversaries
- allergies
- notable preferences
- unresolved service-recovery issues
- high-value customers
- first-time guests

---

## 40. Loyalty

Program types:
- points
- visit based
- spend tier
- paid membership
- item-based
- punch card
- cashback/store credit

POS functions:
- enroll
- attach
- earn
- redeem
- show tier
- show reward eligibility

---

## 41. Gift Cards, Vouchers & Store Credit

Ledger-based balance.

Support:
- issue
- reload
- redeem partially
- cross-location use
- expire
- block
- replace
- refund to store credit
- audit

---

## 42. Feedback & Service Recovery

Capture:
- visit
- table
- order
- server
- rating
- issue
- comment

Recovery workflow:
- owner
- follow-up
- voucher
- comp
- status
- resolution

---

## 43. Restaurant Marketing

Later-stage module:
- segments
- email
- SMS
- campaigns
- promo codes
- win-back
- birthday
- first-visit follow-up
- inactive customer
- event promotion

Never send without consent rules.

---

## 44. Menu Engineering

Report:
- popularity
- contribution margin
- food cost
- modifier revenue
- waste
- prep time
- refund rate

Visual matrix:
- stars
- plowhorses
- puzzles
- dogs

Use the matrix as descriptive analysis, not automatic menu decisions.

---

## 45. Food Safety

Strong differentiation opportunity.

Logs:
- fridge temperature
- freezer temperature
- hot holding
- cooking temperature
- receiving temperature
- cleaning
- sanitization
- opening
- closing

Allergen system:
- ingredient allergens
- inherited recipe allergens
- guest allergy note
- POS warning
- KDS warning

Lot/expiry:
- batch
- supplier
- received date
- expiry
- affected recipe
- recall trace

---

## 46. Inventory Extensions

Add:
- purchase-pack conversion
- ingredient units
- recipe consumption
- lot/expiry
- par by outlet
- par by daypart
- transfer requests
- approvals
- receiving variance
- supplier returns
- open-container counts
- mobile counts
- barcode counts
- blind counts
- recount

Predictive reorder UI must offer:
`ADD RECOMMENDED QTY TO PURCHASE REQUEST`

---

## 47. Commissary / Central Kitchen

For groups:
- production orders
- raw material consumption
- finished goods
- demand forecast
- inter-location transfer
- central recipes
- internal transfer value

---

## 48. Procurement Extensions

Add:
- requisitions
- approval chain
- RFQ
- quote comparison
- PO
- receiving
- rejects
- lot/expiry
- supplier invoice
- 3-way match

Quote comparison should display:
- price
- delivery
- terms
- historical reliability

Let the operator choose.

---

## 49. Invoice Capture

UI for:
- photo upload
- PDF upload
- supplier
- invoice number
- invoice date
- line items
- tax
- total
- PO match

OCR/AI may enhance later, but the workflow should not depend on AI.

---

## 50. Tender Reconciliation

Create a settlement center comparing:
- POS cash
- counted cash
- M-Pesa
- card batches
- gift cards
- delivery payouts
- room charges

Exceptions:
- unmatched
- duplicate
- reversal
- missing
- amount mismatch

---

## 51. Restaurant Labor Analytics

Add:
- covers/server
- sales/labor hour
- check average
- table turns
- upsell rate
- voids
- discounts
- comps
- tip
- attendance
- kitchen output/labor hour

Present operational evidence, not opaque employee scores.

---

## 52. Opening & Closing

Opening checklist:
- tills
- printers
- KDS
- dining room
- critical stock
- reservations
- prep

Closing:
- open checks
- till close
- cash count
- waste
- stock criticals
- KDS clear
- security
- daily close

Generate one manager shift-close record.

---

## 53. Reports Centre

Create a dedicated workspace.

### Sales
- gross/net
- item
- category
- hourly
- daypart
- outlet
- channel
- tax
- discount
- comp
- refund
- void

### Restaurant
- covers
- average check
- turn time
- seat utilization
- reservation conversion
- no-show
- wait time

### Kitchen
- ticket time
- item SLA
- station load
- refires

### Inventory
- AvT
- usage
- waste
- valuation
- stockouts
- forecasts

### Menu
- food cost
- margin
- popularity
- engineering

### Staff
- sales
- covers
- labor cost
- attendance

### Guest
- repeat rate
- lifetime value
- loyalty
- source

### Finance
- P&L
- BS
- cash
- tax
- reconciliation
- AP
- AR

UX:
- date range
- compare period
- property/outlet
- export CSV
- export PDF
- saved view
- scheduled delivery later

---

## 54. Restaurant Settings

Create a first-class Settings module.

Sections:
- Organization
- Property
- Outlets
- Service periods
- Sections
- Tables
- Seats
- Courses
- Order types
- Menu
- Pricing
- Taxes
- Service charges
- Payments
- Tips
- KDS routing
- Terminals
- Printers
- Scanners
- Roles
- Permissions
- Approvals
- SMS/email
- Integrations

---

# PART C — SaaS PLATFORM ADMIN

## 55. Separate Platform Application

Do not place SaaS superadmin controls in tenant settings.

Create:
`apps/platform-admin`

Top-level navigation:

```text
Platform Overview
Tenants
Plans & Entitlements
Billing
Provisioning
Users & Access
Hardware Fleet
Integrations
Feature Flags
Releases
Usage
Support
Incidents
Audit
Data Operations
Security
Platform Settings
```

---

## 56. Platform Dashboard

Metrics:
- active tenants
- trials
- active properties
- outlets
- terminals
- users
- MRR
- ARR
- failed payments
- churn
- trials ending
- active tenants/day
- storage
- API usage
- offline terminals
- integration errors
- incident state

Filters:
- region
- plan
- tenant state
- partner
- version

---

## 57. Tenant Lifecycle

States:
`TRIAL`
`ONBOARDING`
`ACTIVE`
`PAST_DUE`
`SUSPENDED`
`CANCELLED`
`ARCHIVED`

Tenant detail:
- legal/business name
- billing identity
- country
- currency
- tax ID
- owner
- plan
- subscription
- properties
- outlets
- users
- devices
- modules
- usage
- support tier
- health
- onboarding

Actions:
- extend trial
- activate
- suspend
- reactivate
- archive
- export
- change plan
- temporary entitlement

Every high-risk action requires reason + audit.

---

## 58. Provisioning Wizard

Steps:
1. Organization
2. Region/country
3. Currency/timezone
4. Plan
5. Modules
6. Property
7. Outlet types
8. Admin user
9. Payment provider
10. Fiscal configuration
11. Hardware profile
12. Demo/seed data
13. Go-live checklist

A new tenant should not require a code change.

---

## 59. Plans & Entitlements

Never gate features by checking plan names in UI.

Bad:
```ts
if (plan === 'PRO')
```

Good:
```ts
if (hasEntitlement('restaurant.reservations'))
```

Example entitlements:
```text
restaurant.pos
restaurant.kds
restaurant.reservations
restaurant.crm
restaurant.online_ordering
restaurant.loyalty

inventory.basic
inventory.predictive
inventory.commissary

hotel.pms
hotel.housekeeping

finance.accounting
finance.etims

platform.api
platform.multi_property
```

---

## 60. Limits & Quotas

Entitlements can have limits:
- properties
- outlets
- terminals
- users
- employees
- API calls
- SMS
- storage
- reservations
- online orders
- invoice scans

Display:
`used / included / overage`

---

## 61. Billing

Support:
- monthly
- annual
- per property
- per outlet
- per terminal
- per active user
- add-ons
- usage-based items
- trials
- credits
- coupons
- proration
- custom contract

Use an adapter:

```ts
interface BillingProvider {
  createCustomer(...): Promise<unknown>;
  createSubscription(...): Promise<unknown>;
  updateSubscription(...): Promise<unknown>;
  cancelSubscription(...): Promise<unknown>;
  createInvoice(...): Promise<unknown>;
  addCredit(...): Promise<unknown>;
  getCustomerPortalUrl(...): Promise<string>;
}
```

---

## 62. Billing Operations

Platform view:
- subscription
- invoices
- payments
- credits
- refunds
- failed payments
- next invoice
- pricing version
- tax

Tenant billing view:
- plan
- add-ons
- payment method
- invoices
- billing details
- change plan
- cancellation policy

---

## 63. Dunning / Failed Billing

Workflow:
- payment failure
- retry
- reminder
- grace period
- limited admin mode
- suspension
- reactivation

Never suddenly disable a restaurant POS mid-service because a billing card failed.

Operational continuity must be part of dunning policy.

---

## 64. Module Marketplace

Tenant admin can browse:
- Reservations
- CRM
- Loyalty
- Online Ordering
- Predictive Inventory
- Hotel PMS
- Events
- Advanced Finance

Each card:
- description
- entitlement
- price
- dependencies
- state

---

## 65. Feature Flags

Distinct from paid entitlements.

Use for:
- beta
- staged rollout
- experiments
- tenant-specific mitigation
- emergency disable

Scope:
- global
- region
- plan
- tenant
- property
- user

Audit overrides.

---

## 66. Release Management

Track:
- web version
- API version
- Edge version
- schema version
- release channel

Channels:
- stable
- early access
- internal

Surface incompatible Edge versions.

---

## 67. Hardware Fleet

Turn Edge into a SaaS fleet.

Track:
- tenant
- property
- terminal
- device
- serial
- Edge version
- firmware
- last seen
- status
- queue depth
- errors

Safe remote actions:
- test print
- refresh config
- reconnect
- rotate credentials
- collect diagnostics

High-risk remote actions require strict policy.

---

## 68. Integration Registry

Tenant integration records:
- provider
- status
- environment
- secret reference
- last success
- last failure
- failure count
- webhook state

Providers:
- M-Pesa
- eTIMS
- card processors
- SMS
- email
- delivery
- accounting
- OTA
- reservations

Never reveal complete stored secrets.

---

## 69. Platform Users vs Tenant Users

Do not use one role enum for both.

### Platform roles
- superadmin
- support
- implementation
- billing
- engineering
- security
- sales/customer success

### Tenant roles
Hospitality operational users.

This boundary is security-critical.

---

## 70. Support Console

Tenant support screen:
- account summary
- health
- properties
- users
- integrations
- devices
- recent errors
- audit
- subscription
- last sync
- support cases

### Support session
If impersonation exists:
- reason required
- time-limited
- visible banner
- full audit
- sensitive actions blocked by default
- optional tenant approval

Prefer explicit support sessions over invisible impersonation.

---

## 71. Support Cases

Fields:
- tenant
- severity
- category
- assignee
- status
- timeline
- attachments
- linked errors
- linked device
- linked incident

Categories:
- POS
- payment
- fiscal
- hardware
- inventory
- integration
- billing
- login
- data

---

## 72. Platform Health

Monitor:
- API
- database
- queues
- workers
- M-Pesa adapter
- eTIMS adapter
- email
- SMS
- edge fleet
- backup status

Per-tenant:
- failed jobs
- stuck fiscal invoices
- offline duration
- queue depth
- webhook failures
- sync conflicts

---

## 73. Incidents

Incident states:
`INVESTIGATING -> IDENTIFIED -> MONITORING -> RESOLVED`

Fields:
- severity
- services
- tenants
- start
- updates
- resolution

Add customer-facing status later.

---

## 74. Data Operations

Explicit workflows only:
- export tenant
- import
- migration
- validation
- anonymized demo copy
- backup
- restore request
- archive

Do not create a generic production database editor.

---

## 75. Platform Audit

Audit:
- actor
- action
- tenant
- entity
- before/after
- reason
- session
- timestamp

High-risk events:
- entitlement override
- subscription override
- support session
- user reset
- secret rotation
- export
- restore
- suspension

---

## 76. Security Centre

Track:
- MFA
- SSO
- suspicious login
- locked users
- sessions
- API keys
- webhook secrets
- expiring credentials
- Edge certificates

Actions:
- revoke session
- rotate key
- disable client

---

## 77. API Keys

Tenant admin may create scoped API clients.

Fields:
- name
- scopes
- environment
- created
- last used
- expiry
- optional IP allowlist

Show secret only once.

---

## 78. Webhooks

Tenant webhook configuration.

Events:
- order.completed
- payment.completed
- reservation.created
- stock.low
- invoice.created
- guest.updated

UI:
- endpoint
- events
- secret
- delivery log
- retry
- test

---

## 79. Localization / Regional Packs

Move regional rules into configuration packs.

Fields:
- country
- currency
- timezone
- date
- language
- tax
- fiscal provider
- payroll profile
- payment providers
- phone formats

Kenya should become the first excellent regional pack, not a permanently hardcoded assumption.

---

## 80. Multi-Property Enterprise Console

Central management:
- master menu
- recipes
- price books
- approved suppliers
- role templates
- device templates
- reports
- brand standards

Allow explicit location overrides.

---

## 81. Franchise / Partner Mode

Later:
- parent brand
- franchisees
- mandatory settings
- optional settings
- comparative reporting
- licensing
- reseller ownership

---

## 82. Usage Analytics

Measure product adoption:
- transactions
- active users
- KDS usage
- reservations
- stock counts
- invoices
- online orders
- API calls
- devices

Use for:
- product decisions
- support
- billing where agreed

Do not turn SaaS usage analytics into opaque employee surveillance.

---

## 83. Customer Success

Tenant health indicators:
- onboarding completion
- days since admin login
- active modules
- integration failures
- open cases
- payment state
- offline devices
- adoption

Use indicators to guide support, not to generate unexplainable customer labels.

---

## 84. Onboarding Tracker

Example:

```text
✓ Organization
✓ Property
✓ Menu import
✓ Tax
✓ M-Pesa
✓ eTIMS
□ Printers
□ Staff invites
□ Opening balances
□ Training
□ Go-live
```

---

## 85. Demo / Sandbox Tenants

Support:
- seeded demo
- reset
- expiration
- demo watermark
- fake payments
- fake fiscal environment

Important for sales, QA and training.

---

## 86. Platform Broadcasts

Send:
- maintenance notices
- release notes
- billing notices
- integration outage notices
- account notices

Scope by region, plan or tenant.

---

# PART D — CROSS-CUTTING FRONTEND INSTRUCTIONS

## 87. Introduce Real Routing

Replace root `activeTab` as the primary navigation architecture.

Recommended paths:

```text
/dashboard
/service/pos
/service/floor
/service/reservations
/service/waitlist
/service/orders/:id

/kitchen/kds
/kitchen/expo
/kitchen/production

/menu/products
/menu/products/:id
/menu/recipes
/menu/pricing

/guests
/guests/:id
/loyalty

/inventory/items
/inventory/items/:id

/procurement/purchase-orders/:id
/accounting/journals/:id
/reports
/settings
```

Benefits:
- back button
- deep links
- refresh safety
- bookmarks
- shareable support URLs
- search navigation

---

## 88. Refactor Giant Views

Current large components should be decomposed by feature.

Suggested:

```text
src/
├── app/
│   ├── router/
│   ├── layouts/
│   └── providers/
├── features/
│   ├── dashboard/
│   ├── service/
│   │   ├── pos/
│   │   ├── floor/
│   │   ├── reservations/
│   │   └── waitlist/
│   ├── kitchen/
│   ├── menu/
│   ├── guests/
│   ├── hotel/
│   ├── inventory/
│   ├── procurement/
│   ├── accounting/
│   ├── staff/
│   ├── control/
│   ├── reports/
│   └── settings/
├── components/
├── domain/
├── services/
├── hooks/
├── stores/
└── utils/
```

SaaS:
`apps/platform-admin`

---

## 89. State Architecture

Do not continue growing one giant global context.

Target:
- TanStack Query for server state
- Zustand or scoped context for UI/session state
- React Hook Form for complex forms
- Zod for validation
- pure domain services for calculations
- dedicated offline service/store
- dedicated auth/tenant providers

Context is not a database.

---

## 90. Shared UI Components

Build:
- AppShell
- PageHeader
- ModuleTabs
- DataTable
- MobileEntityCard
- EntityDrawer
- Modal
- ConfirmDialog
- CommandPalette
- NotificationCenter
- FilterBar
- DateRangePicker
- StatusBadge
- MetricCard
- AlertCard
- ActivityTimeline
- EmptyState
- LoadingState
- ErrorState
- PermissionGate
- EntitlementGate
- OfflineIndicator
- SyncConflictDialog
- AuditReasonDialog
- FloorCanvas

---

## 91. Upgrade Global Search to Command Palette

Support both search and actions.

Examples:
- New Sale
- New Reservation
- New Guest
- New PO
- New Expense
- Stock Count
- Close Shift

Search across:
- products
- orders
- guests
- reservations
- rooms
- stock
- suppliers
- invoices
- employees

---

## 92. Persistent Notifications

Toasts are temporary feedback.

Create a notification center for:
- stock risk
- approvals
- KDS SLA breach
- reservation arrival
- payment exception
- fiscal failure
- device offline
- payroll event

Notifications need read/unread state and links.

---

## 93. Entity Drawers & Timelines

Prefer drawers for quick inspection:
- guest
- table
- order
- stock item
- employee
- supplier

Every important entity should have an activity timeline.

---

## 94. Standard UI States

Shared components for:
- loading
- empty
- error
- no permission
- offline
- stale
- no result
- syncing

Remove native `window.confirm()` from financial/operational actions.

---

## 95. Mobile UX by Role

### Waiter
- floor
- active checks
- add items
- fire course
- pay

### Host
- reservations
- waitlist
- floor

### Manager
- command center
- alerts
- approvals
- sales

### Storekeeper
- count
- receive
- transfer
- waste

Do not merely shrink desktop tables.

---

## 96. Accessibility & Theme

Implement:
- keyboard navigation
- focus trapping
- Escape close
- focus restoration
- screen-reader labels
- status beyond color
- 44px touch targets where operational
- reduced motion

Themes:
- dark
- light
- high contrast
- system

---

# PART E — DOMAIN & SECURITY INSTRUCTIONS

## 97. RBAC vs Entitlements vs Policy

Always separate:

1. **Entitlement** — customer paid/is enabled for the feature.
2. **Permission** — user may perform the action.
3. **Policy** — business rules allow it now.

Example:
- tenant has refunds
- waiter lacks refund permission
- manager has refund permission
- refunds over KES 10,000 require finance approval

---

## 98. Permission Keys

Prefer granular keys:

```text
order.create
order.modify
order.void
order.reopen
order.transfer

payment.collect
payment.refund
payment.cash
payment.mpesa

reservation.create
reservation.cancel

inventory.transfer
inventory.adjust
inventory.count

menu.edit
price.override

staff.view
staff.payroll

platform.tenant.support_session
```

---

## 99. Offline Rules

Should work offline where practical:
- open check
- add item
- table state
- local KDS
- cash settlement
- receipt
- local stock movement

May require online:
- remote loyalty validation
- reservation sync
- M-Pesa authorization
- external gift cards
- fiscal submission depending adapter

UI must label operations that require connection.

---

## 100. Sync Conflicts

Do not silently overwrite material conflicts.

Show:
- local version
- server version
- timestamps
- actor
- suggested resolution

Require review for financial/order conflicts.

---

# PART F — ROADMAP

## 101. P0 Restaurant Parity

Build:
1. routing
2. design-system primitives
3. Catalog Studio
4. floor-plan designer
5. seat tracking
6. coursing
7. hold/fire
8. merge checks/tables
9. mixed tender
10. refunds
11. reservations
12. waitlist
13. customer assignment
14. notifications
15. settings shell

---

## 102. P1 Restaurant Growth

Build:
1. CRM / Guest 360
2. loyalty
3. gift cards
4. online ordering
5. QR
6. kiosk
7. advanced KDS
8. expo
9. recipe studio
10. production
11. menu engineering
12. invoice capture
13. reconciliation
14. reports

---

## 103. P2 SaaS Commercialization

Build:
1. platform-admin app
2. tenants
3. plans
4. entitlements
5. billing
6. quotas
7. provisioning
8. onboarding
9. support console
10. feature flags
11. integration registry
12. hardware fleet
13. audit
14. usage
15. health

---

## 104. P3 Enterprise

Build:
1. master multi-property configuration
2. commissary
3. central procurement
4. franchise mode
5. SSO
6. API keys
7. webhooks
8. white-label
9. enterprise reporting
10. regional packs

---

# PART G — IMMEDIATE DEV SPRINT

## 105. Recommended Next Sprint: Restaurant Service Core

### A. Routing
- install React Router
- create route shell
- preserve current screens

### B. Floor
- `FloorPlanView`
- timers
- covers
- server sections
- merge tables

### C. Seats
- `DiningSeat`
- assign item to seat
- move item
- split by seat

### D. Courses
- `OrderCourse`
- hold/fire
- POS grouping
- KDS integration

### E. Settlement
- payment allocations
- mixed tender
- partial tender
- refund

### F. Catalog Studio
- products
- portions
- recipes
- modifiers
- menus
- pricing

This is the most valuable immediate restaurant sprint because it closes the largest visible parity gaps without distracting from the existing ServOS strengths.

---

## 106. Recommended Second Sprint: Reservations & Guest Layer

Build:
- reservation book
- host stand
- waitlist
- guest profiles
- POS guest assignment
- reservation-to-table
- reservation-to-order
- guest notes
- pre-shift brief

---

## 107. Recommended Third Sprint: SaaS Control Plane MVP

Build:
- `apps/platform-admin`
- tenant list/detail
- provisioning
- plans
- entitlements
- billing status
- usage
- feature overrides
- support-session audit
- integration health
- hardware health

---

# PART H — ACCEPTANCE CRITERIA

## 108. Restaurant Service Core Definition of Done

Complete when:
- host can seat reservation or walk-in
- server opens table
- table has seats
- order items can reference seats
- items can be grouped into courses
- held courses do not fire
- fired courses route to correct station
- KDS shows course context
- checks can split and merge
- table groups can merge
- multiple tenders settle one order
- payment can be partially refunded
- inventory stays correct
- journal entries remain balanced
- high-risk actions are audited
- permission checks protect restricted actions
- mobile remains usable

---

## 109. SaaS Control Plane Definition of Done

Complete when:
- admin provisions tenant
- tenant receives plan + entitlements
- tenant may have multiple properties
- feature access changes without deployment
- quotas enforce centrally
- billing status is visible
- billing failure uses grace state
- tenant admin sees invoices
- support sees health
- support sessions are audited
- integration health is visible
- Edge version/last-seen is visible
- tenant suspension preserves data
- tenant export exists
- platform actions are audited

---

# PART I — ANTI-PATTERNS

## 110. Do Not

- keep adding every module to `ServOSContext.tsx`
- keep adding every screen as a root `activeTab`
- gate features by plan names
- duplicate order engines for QR/kiosk/web
- duplicate restaurant/hotel customer identities
- put secrets in frontend state
- hard-code M-Pesa/eTIMS into generic order UI
- use browser confirmation dialogs for money/stock actions
- mix platform-superadmin and tenant roles
- rewrite historical recipe costs
- silently resolve sync conflicts
- build CRM as only a mailing list
- treat reservations as ordinary calendar events without table capacity
- make dashboards that cannot drill to action

---

# 111. Target Product Position

ServOS should not position itself as:

> “Every individual feature is better than every specialist product.”

A more credible and valuable position is:

> ServOS unifies the operational domains that hospitality businesses normally stitch together across POS, reservations, inventory, hotel PMS, workforce, accounting, guest CRM and compliance systems.

Its distinctive product spine should remain:

`Guest -> Reservation -> Table/Room/Event -> Order -> Recipe/Consumption -> Stock -> Payment -> Tax -> Accounting -> Loyalty -> Analytics -> Audit`

That is the architecture worth defending.

---

# 112. Final Developer Directive

Build ServOS around three frontend questions:

1. **What is happening now?**
2. **What action does this user need to take?**
3. **What operational and financial consequence follows from that action?**

Restaurant software is not merely a checkout screen. It coordinates guests, seats, tables, timing, food, kitchens, ingredients, staff, capacity, payments and service.

The SaaS control plane is not merely an admin dashboard. It determines who can use ServOS, what capabilities they receive, how they are billed, how their installation is provisioned, whether it is healthy, and how support can intervene safely.

Build these two layers deliberately, on one shared domain model, and ServOS can graduate from a strong hospitality prototype into a real hospitality operating platform.



