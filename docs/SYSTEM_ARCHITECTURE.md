# ServOS Technical Architecture & System Overview

## 1. System Vision & Architecture Principles

ServOS is designed as a **Unified Hospitality Operating System** that integrates front-of-house (FOH) guest interaction, mid-of-house (MOH) kitchen/room service fulfillment, and back-of-house (BOH) enterprise resource planning (ERP).

```
                      ┌──────────────────────────────────────────────┐
                      │              ServOS Web App Core             │
                      │  (Vite + React + TypeScript + Tailwind CSS)  │
                      └──────────────────────┬───────────────────────┘
                                             │
      ┌──────────────────────────────────────┼──────────────────────────────────────┐
      │                                      │                                      │
┌─────▼──────────────┐             ┌─────────▼───────────┐                ┌─────────▼───────────┐
│ Front-of-House UI  │             │ Mid-of-House Engine │                │ Back-of-House ERP   │
├────────────────────┤             ├─────────────────────┤                ├─────────────────────┤
│ POS & Multi-Tender │             │ KDS Prep Stations   │                │ Double-Entry Ledger │
│ Table Floorplan    │             │ Hotel Tape Chart    │                │ KRA eTIMS Fiscal    │
│ Catalog & Pricing  │             │ Housekeeping Board  │                │ Procurement & AP    │
│ Nightlife Door Scan│             │ Maintenance Tickets │                │ HR & Payroll Hub    │
│ CRM 360 & Loyalty  │             │ Universal Task Queue│                │ AvT Yield Control   │
└─────────┬──────────┘             └──────────┬──────────┘                └──────────┬──────────┘
          │                                   │                                      │
          └───────────────────────────────────┼──────────────────────────────────────┘
                                              │
                              ┌───────────────▼───────────────┐
                              │     Edge Node Sync & Offline  │
                              │     Hardware Gateway Bridge   │
                              └───────────────┬───────────────┘
                                              │
                      ┌───────────────────────┴───────────────────────┐
                      │                                               │
             ┌────────▼────────┐                             ┌────────▼────────┐
             │ Edge Hardware   │                             │ Cloud Sync API  │
             ├─────────────────┤                             ├─────────────────┤
             │ Thermal Printers│                             │ Multi-Property  │
             │ Weight Scales   │                             │ Global Analytics│
             │ M-Pesa POS Term │                             │ Remote Audit    │
             └─────────────────┘                             └─────────────────┘
```

### Core Architecture Design Pillars:
1. **Local-First Edge Resilience**: Cashiers and waiters must be able to ring up orders, print receipts, and issue M-Pesa requests uninterrupted during cloud network outages.
2. **Unified Data Model**: Single source of truth across inventory, sales, room folios, and financial ledger accounts.
3. **Role-Based Security & Audit Trail**: Granular action permissions with manager authorization PIN gates and immutable audit logs.
4. **Real-time Operational Telemetry**: Instant sync across POS, KDS, Hotel Tape Chart, and Command Centre.

---

## 2. Technology Stack

- **Framework**: React 18+ with TypeScript (Strict mode enabled)
- **Build System**: Vite
- **Styling**: Tailwind CSS with custom dark mode glassmorphism theme (`bg-slate-900`, `bg-slate-800`, `border-slate-700`, `amber-400` accent highlights)
- **Icons**: Lucide React (`lucide-react`)
- **State Management**: React Context API (`ServOSContext.tsx`) with memoized selective state updates
- **Storage & Synchronization**: LocalStorage & IndexedDB backed offline transaction queue simulation with automatic backoff retry logic.

---

## 3. Data Model & Entity Hierarchy

### Property & Outlet Structure
ServOS enforces a strict multi-property and multi-outlet relational structure:

```
Organization
 └── Property (e.g., Grand Nairobi Hotel, Westlands Rooftop)
      ├── Outlets (Main Bar, VIP Lounge, Terrace Restaurant, Room Service)
      ├── Terminals / Edge Nodes (POS-01, KDS-Bar, Door-Scanner-01)
      ├── Tables / Sections (Section A, VIP Cabanas, Terrace)
      └── Hotel Rooms / Room Types (Deluxe Ocean, Executive Suite)
```

### Key Entity Relationships:
- **Product & Portions**: A `Product` (e.g., Jameson 750ml) links to multiple `Portion` definitions (30ml Shot, 60ml Double, Bottle) and a master `StockItem` for milliliter-precise inventory depletion.
- **Orders & Payments**: An `Order` contains multiple `OrderItems` (with modifiers and mixers), linked to a `Table` or `RoomFolio`, settled via `SplitPayment` entries (M-Pesa, Cash, Card, Room Charge).
- **Fiscal Receipts**: Every completed payment generates an eTIMS payload containing a Control Unit Code (CU Serial), QR Code URL, and Tax Breakdown (VAT 16%, Catering Levy 2%).
- **Guest 360**: A `CustomerProfile` accumulates spend across F&B, Nightlife, and Hotel Stays, generating loyalty points and tracking preferences.

---

## 4. Hardware Diagnostics & Edge Integration

ServOS interfaces directly with peripheral hardware through Edge Gateway API protocols:

```
                  ┌─────────────────────────────────┐
                  │    ServOS Edge Gateway Bridge   │
                  └────────────────┬────────────────┘
                                   │
      ┌────────────────────────────┼────────────────────────────┐
      │                            │                            │
┌─────▼──────────────┐   ┌─────────▼──────────┐       ┌─────────▼──────────┐
│  Thermal Printer   │   │ Smart Bar Scale    │       │ M-Pesa POS Device  │
├────────────────────┤   ├────────────────────┤       ├────────────────────┤
│ ESC/POS USB/LAN    │   │ RS232 / USB Serial │       │ Direct SDK / Push  │
│ 80mm Autocutter    │   │ Bottle Weight (g)  │       │ Instant STK Push   │
└────────────────────┘   └────────────────────┘       └────────────────────┘
```

- **ESC/POS Printing**: Native support for Kitchen Order Tickets (KOT) and Fiscal Receipts via ESC/POS command generation.
- **Precision Spirit Weighing**: Integration with Bluetooth/USB digital scales to weigh partial bottles for exact liquid loss calculation.
- **M-Pesa Express (STK Push)**: Real-time M-Pesa payment prompt triggering and instant callback verification.
