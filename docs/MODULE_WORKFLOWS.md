# ServOS Module Workflows & Operational End-to-End Journeys

This document details the step-by-step operational workflows implemented across ServOS, illustrating how transactional data flows seamlessly between front-of-house operations, kitchen/bar fulfillment, stock depletion, and double-entry accounting.

---

## 1. POS Order-to-Fiscal Settlement Journey

```
Waiter Opens Table Floorplan
      │
      ▼
Selects Portion & Modifiers (e.g., Jameson 60ml Double + Tonic)
      │
      ▼
Attaches Guest Profile from CRM 360 (John Kamau - Gold Member)
      │
      ▼
Sends Order to KDS Pass (KOT printed at Bar Station)
      │
      ▼
Guest Requests Bill Split & Settlement
      │
      ▼
Selects Mixed Tender (KES 1,000 Cash + KES 1,000 M-Pesa STK Push)
      │
      ▼
System Verifies M-Pesa Callback & Finalizes Ticket
      │
      ├──> Generates KRA eTIMS Fiscal Signature & QR Code
      ├──> Depletes 60ml from Master Jameson Stock Ledger
      ├──> Accrues 20 Loyalty Points to Guest CRM Profile
      └──> Posts Double-Entry Journal (Debit Cash/M-Pesa, Credit F&B Revenue)
```

---

## 2. Bar Stock Depletion & Spirit Yield (AvT) Workflow

```
Catalog Studio Defines Jameson 750ml Bottle
      │
      ├──> Theoretical Yield: 25 × 30ml Shots (Allowable Loss: 2%)
      └──> Base Unit Cost: KES 2,800 / Bottle
      │
POS Cashier Sells 10 × 60ml Doubles & 4 × 30ml Shots
      │
      ▼
ServOS Calculates Theoretical Depletion: (10 × 60ml) + (4 × 30ml) = 720 ml
      │
      ▼
Bartender Performs Shift End Bottle Weight Count (Smart Scale Bridge)
      │
      ▼
Actual Measured Depletion Recorded: 760 ml (Variance: -40 ml)
      │
      ▼
AvT Engine Calculates Variance Percentage (-5.2%)
      │
      ▼
If Variance > Threshold (2%), Triggers High-Priority Flag in Universal Inbox:
"Unexplained Liquor Variance at Main Bar: Jameson 750ml (-40ml)"
```

---

## 3. Hotel Guest Stay & Folio Settlement Journey

```
Guest Arrives at Front Desk (Walk-In or Pre-booked)
      │
      ▼
Front Desk Agent Launches Guided Check-In Wizard
      ├── Step 1: Input Guest Details & Passport Copy
      ├── Step 2: Assign Room 304 (Executive Suite) via Tape Chart
      ├── Step 3: Collect Deposit & Encode RFID Keycard
      └── Status Changes: Room 304 -> OCCUPIED
      │
Guest Orders Room Service from POS
      │
      ▼
Cashier Selects Tender: "ROOM CHARGE" -> Posts KES 3,500 to Room 304 Folio
      │
      ▼
Minibar Restock Staff Posts Minibar Items (2 × Mineral Water) to Folio
      │
      ▼
Guest Checkout: Front Desk Prints Itemized Master Folio
      │
      ▼
Settlement via Card / M-Pesa -> Folio Balance Zeroed -> Status: DIRTY
      │
      ▼
Automated Task Dispatched to Housekeeping Board: "Clean & Inspect Room 304"
```

---

## 4. Nightlife Door Access & Promoter Commission Workflow

```
Event Organizer Creates "Saturday Sessions" in Events & Nightlife Module
      ├── Sets Capacity: 850
      └── Assigns Promoters (e.g., Mercy - 5% Commission)
      │
Guest Purchases Ticket Online / Presale -> Receives Encrypted QR Ticket
      │
      ▼
Bouncer at Door Uses ServOS QR Door Scanner
      │
      ▼
System Validates Barcode Signature
      ├── If VALID: Displays "Access Granted - VIP Lounge Entry"
      └── Increments Door Count (Checked In: 291 / 850)
      │
POS Bar Sales Attributed to Promoter Guest List Code
      │
      ▼
At Event Conclusion, ServOS Calculates Promoter Commission:
Attributed Sales: KES 184,000 x 5% = KES 9,200
      │
      ▼
Manager Clicks "Disburse Commission via M-Pesa B2C"
      │
      ▼
Automated M-Pesa B2C Payout Processed to Promoter's Mobile Number
```

---

## 5. Procurement, GRN & 3-Way Match Workflow

```
Stock Engine Detects Low Jameson Level (Forecast: Stockout in 1.4 Days)
      │
      ▼
Automated Alert Appears in Universal Inbox: "Create PO for Jameson"
      │
      ▼
Procurement Officer Generates Purchase Order (PO-2039) to East African Distillers
      │
      ▼
Supplier Delivers Goods to Store Room
      │
      ▼
Storekeeper Records Goods Received Note (GRN-1048) with Batch & Expiry Dates
      │
      ▼
Finance Clerk Receives Supplier Invoice (INV-9821)
      │
      ▼
ServOS 3-Way Match Engine Compares:
PO-2039 (Ordered 36 btls @ 2,800 = 100,800)
GRN-1048 (Received 36 btls)
INV-9821 (Invoiced KES 100,800)
      │
      ▼
If Match Confirmed: Posts AP Journal & Schedules Payment
      │
      ▼
Stock Ledger Updated: +36 Bottles added to Master Warehouse Inventory
```

---

## 6. Universal Task Inbox Operational Action Flow

```
System Event Triggered
 (e.g., Till #04 Shortage: -KES 2,400 / Overdue Maintenance Room 312)
      │
      ▼
Event Formatted into Unified Task Item
      ├── Title, Category, Source Location, Urgency (CRITICAL / HIGH / MEDIUM)
      └── Assigned Role (e.g., Manager, Engineer, Accountant)
      │
      ▼
Notification Counter Badges Header & Universal Inbox Trigger
      │
      ▼
Manager Opens Universal Inbox (`UniversalInboxModal.tsx`)
      │
      ▼
Manager Reviews Item Details & Selects Direct Action:
      ├── Option A: "Approve / Resolve"
      ├── Option B: "Dispatch Staff / Reassign"
      └── Option C: "Navigate to Module Tab"
      │
      ▼
Task Status Updated -> Real-time System Telemetry Refreshed
```
