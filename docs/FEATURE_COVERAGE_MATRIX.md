# ServOS Feature Coverage Matrix & Functional Audit

This matrix provides a detailed module-by-module evaluation of current capabilities, partially implemented workflows, and target production enhancements across ServOS.

---

## 📊 Summary Status Overview

| Operational Area | Status | Key Capabilities Implemented |
| :--- | :---: | :--- |
| **1. Command Centre** | 🟢 Strong | Live KPI banner, executive lens switcher (GM, Owner, F&B, Hotel, Finance), revenue mix charts, urgent attention list, live operations counter. |
| **2. POS & Floorplan** | 🟢 Strong | Table sections, order builder, modifier/mixer popups, split/mixed tender, itemized credit note refunds, check merge, thermal receipts, customer assignment. |
| **3. KDS Pass** | 🟢 Good | Real-time kitchen & bar order tickets, prep timer badges, item bump status, station filtering. |
| **4. Catalog Studio** | 🟢 Strong | Master item catalog, portion definitions, spirits shot/bottle yield calculator, cocktail recipe builder, promotional price books. |
| **5. Pricing Engine UI** | 🟢 Strong | Time-based rule builder (Happy Hour, VIP, Member rates), tier discounts, active outlet scope targeting. |
| **6. Inventory & Yield Control** | 🟢 Strong | Spirits depletion, Actual vs. Theoretical (AvT) liquor loss tracking, stock transfers, waste logs, predictive stockout forecasting. |
| **7. Procurement & AP** | 🟢 Good | Purchase Order creation, Goods Received Notes (GRN), 3-way invoice matching, supplier ledger tracking. |
| **8. Double-Entry Accounting & eTIMS** | 🟢 Good | Chart of accounts, general journal entries, KRA eTIMS fiscalization logs, tax summaries. |
| **9. Hotel PMS & Tape Chart** | 🟢 Strong | Room tape calendar, multi-step check-in wizard, minibar posting, housekeeping inspection board, engineering maintenance tickets. |
| **10. CRM 360 & Loyalty** | 🟢 Strong | Unified guest profile, spend breakdown (F&B/Hotel/Events), timeline history, loyalty tier points, rewards redemption. |
| **11. Events & Nightlife** | 🟢 Strong | Event capacity tracking, ticket sales, QR door access scanner, promoter guest lists, automated M-Pesa B2C commission payouts. |
| **12. HR, Staff & Till Hub** | 🟢 Strong | Staff directory, shift scheduling, payroll processing, leave requests, till open/close cash variance tracking. |
| **13. Universal Action Inbox** | 🟢 Strong | Centralized operational task queue for approvals, low stock alerts, cash variances, housekeeping exceptions, and maintenance tickets. |
| **14. Control, Audit & Approvals** | 🟢 Strong | Anomaly detection alerts, manager PIN authorization gates, immutable system audit log. |
| **15. Settings & Admin Center** | 🟢 Strong | Multi-property & outlet configuration, role permission matrix, fiscal eTIMS setup, gateway settings, printer routing. |
| **16. Floor Plan Studio** | 🟢 Strong | Interactive drag-and-grid floorplan designer, geometry/shapes, server zone mapping, minimum spend rules, live POS state sync. |
| **17. Tender Reconciliation** | 🟢 Strong | Multi-channel payment drop audit (Cash, M-Pesa, PDQ, Room Charge), variance tracking, tip pool & M-Pesa B2C payouts. |
| **18. Batch Prep Studio** | 🟢 Strong | Sub-recipe manufacturing runs (sauces, premixes, dough), scaling multipliers, raw ingredient depletion, yield efficiency tracking. |
| **19. Analytics & Reports Centre** | 🟢 Strong | RevPASH metrics, hourly peak curves, Kitchen Speed SLA turn times, Boston Matrix Menu Engineering, CSV/PDF exports. |
| **20. QR Table Self-Ordering** | 🟢 Strong | Digital mobile guest web app, table parameter lookup, instant KDS routing, M-Pesa STK push or add to bill checkout. |
| **21. Store Requisitions** | 🟢 Strong | Multi-location internal stock transfer requests, sub-outlet replenishment, line item quantities, and movement tracking. |

---

## 🔍 Detailed Functional Coverage Audit

### 1. POS & Front-of-House
| Feature | Status | Implementation Details |
| :--- | :---: | :--- |
| Table Floorplan | 🟢 Strong | Visual section filtering (Main Dining, Bar, VIP Lounge, Terrace), seated timer, active bill total indicator. |
| Portions / Shots / Bottles | 🟢 Strong | Single tap selection for 30ml, 60ml, 375ml Half, and 750ml Bottle with yield auto-calculation. |
| Modifiers & Mixers | 🟢 Strong | Multi-select popup for spirit mixers (Tonic, Soda, Coke) and preparation instructions (No Ice, Extra Lemon). |
| Comp / Discount / Void | 🟢 Strong | Item and order-level discount capabilities requiring manager PIN authorization for voids. |
| Bill Splitting & Mixed Tender | 🟢 Strong | Multi-method settlement window supporting combination of M-Pesa, Cash, Card, and Room Charge. |
| Itemized Refunds | 🟢 Strong | Refund modal generating KRA eTIMS credit notes with reason code logging. |
| Check Merging | 🟢 Strong | Merge active table bills into a single check with item consolidation. |
| Customer Assignment | 🟢 Strong | Link CRM guest profile directly to POS ticket to accumulate points and enforce preferences. |
| Floor Plan Studio | 🟢 Strong | Interactive drag-and-grid floorplan designer, table shapes, capacity, server zones, minimum spend, and joinable party flags. |
| QR Table Self-Ordering | 🟢 Strong | Mobile guest web app interface with category filter, item notes, instant KDS routing, and M-Pesa STK push or add to bill checkout. |
| Thermal Receipt Printing | 🟢 Strong | ESC/POS formatted receipt modal complete with eTIMS QR code and tax breakdown. |

---

### 2. Catalog Studio & Pricing Engine
| Feature | Status | Implementation Details |
| :--- | :---: | :--- |
| Catalog Item Builder | 🟢 Strong | Master list creation with tax categories, stock item mapping, and selling prices. |
| Portion Yield Calculator | 🟢 Strong | Theoretical yield calculation (e.g., 25 × 30ml shots per 750ml bottle) with 2% allowable loss margin. |
| Cocktail Recipe Builder | 🟢 Strong | Multi-ingredient cocktail assembly with milliliter depletions (e.g., Long Island Ice Tea formula). |
| Dynamic Pricing Rules | 🟢 Strong | Timed Happy Hour, VIP, Member, and Event pricing rules scoped by outlet. |

---

### 3. Hotel PMS & Guest Experience
| Feature | Status | Implementation Details |
| :--- | :---: | :--- |
| Visual Tape Chart | 🟢 Strong | Interactive timeline showing multi-day room bookings across Executive, Deluxe, and Standard rooms. |
| Multi-Step Check-In Wizard | 🟢 Strong | Guided workflow: Guest info -> ID verification -> Room selection -> Deposit -> RFID Keycard encoding. |
| Minibar Posting | 🟢 Strong | Direct minibar item posting onto guest room folio. |
| Housekeeping Board | 🟢 Strong | Real-time status tracking (Clean, Dirty, Cleaning, Inspection, DND) with mobile checklist mode. |
| Maintenance Ticketing | 🟢 Strong | Engineering work order dispatch with urgency, asset logs, and spare parts tracking. |

---

### 4. CRM 360 & Loyalty Hub
| Feature | Status | Implementation Details |
| :--- | :---: | :--- |
| Unified Customer Profile | 🟢 Strong | Single guest view aggregating F&B orders, hotel stays, event attendance, and lifetime spend. |
| Activity Timeline | 🟢 Strong | Chronological audit trail of guest interactions and transactions across properties. |
| Loyalty Points Engine | 🟢 Strong | Automatic point accrual (KES 100 = 1 pt) with tier progression (Bronze, Silver, Gold, Platinum, VIP). |
| POS Redemption | 🟢 Strong | Real-time point balance lookup and payment deduction at POS cashier screen. |

---

### 5. Events, Nightlife & Promoters
| Feature | Status | Implementation Details |
| :--- | :---: | :--- |
| Event Dashboard | 🟢 Strong | Capacity monitoring, ticket sales counters, VIP table bookings, and door revenue metrics. |
| Door QR Scanner | 🟢 Strong | High-speed QR signature validator with tier access verification (VIP Lounge vs. General Entry). |
| Promoter Guest Lists | 🟢 Strong | Guest list tracking attributed to promoters with ticket conversion metrics. |
| Automated B2C Payouts | 🟢 Strong | Calculated promoter commissions disbursed via M-Pesa Daraja B2C API. |

---

### 6. Command Centre & Operational Inbox
| Feature | Status | Implementation Details |
| :--- | :---: | :--- |
| Executive Cockpit | 🟢 Strong | Multi-perspective lenses for GM, Owner, F&B Manager, Hotel Manager, and Finance Controller. |
| Real-Time KPI Banner | 🟢 Strong | Gross revenue, occupancy %, gross profit, order count, alerts, and cash variance display. |
| Universal Action Inbox | 🟢 Strong | Single queue aggregating approvals, stockout alerts, till cash variances, housekeeping exceptions, and eTIMS errors. |
| Global Search | 🟢 Strong | Multi-entity lookup across orders, guests, rooms, purchase orders, and inventory items. |

---

### 7. Inventory, Procurement & Accounting
| Feature | Status | Implementation Details |
| :--- | :---: | :--- |
| AvT Liquor Yield Control | 🟢 Strong | Actual vs. Theoretical spirit depletion analysis pinpointing unrecorded pours and waste. |
| Predictive Inventory | 🟢 Strong | Machine-learning-based stockout forecasting based on historic hourly depletion velocity. |
| Procurement & 3-Way Match | 🟢 Good | PO generation, Goods Received Notes (GRN), and 3-way invoice matching against PO and GRN. |
| Accounting & eTIMS | 🟢 Good | Double-entry journal posting with KRA eTIMS fiscal compliance logging. |
