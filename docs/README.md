# ServOS Operational & Architectural Documentation Index

Welcome to the comprehensive documentation suite for **ServOS** — the Next-Generation Hospitality Operating System & Multi-Tenant SaaS Control Platform.

---

## 📚 Documentation Directory

| Document | Description |
| :--- | :--- |
| **[1. System Architecture & Overview](./SYSTEM_ARCHITECTURE.md)** | Technical architecture, core stack, state flow, and multi-property hierarchy. |
| **[2. Feature Coverage Matrix](./FEATURE_COVERAGE_MATRIX.md)** | Exhaustive audit of present vs. partial vs. target features across all operational modules. |
| **[3. Gap Analysis & Production Roadmap](./GAP_ANALYSIS_AND_ROADMAP.md)** | In-depth analysis of high-priority operational gaps, management tools, and sequential roadmap. |
| **[4. End-to-End Module Workflows](./MODULE_WORKFLOWS.md)** | Step-by-step operational journeys for POS, Hotel PMS, CRM, Nightlife, Procurement, and Financials. |
| **[5. Codebase Decomposition & Refactoring Guide](./REFACTORING_AND_DECOMPOSITION_GUIDE.md)** | File structure migration plan to modularize large view components and contexts into clean domain feature directories. |
| **[6. Restaurant + SaaS Admin Expansion Spec](./RESTAURANT_SAAS_EXPANSION_SPEC.md)** | Comprehensive specification for Restaurant FOH Depth (Coursing, Seats, Host Stand) and SaaS Control Plane. |

---

## 🌟 Executive Summary

ServOS bridges transactional front-of-house hospitality operations (POS, KDS, Hotel PMS, Bar Yield, Host Stand) with back-of-house ERP functions (Double-Entry Accounting, KRA eTIMS Fiscalization, Procurement, AP/AR, HR & Payroll) and a multi-tenant SaaS Admin Control Plane.

### Core Highlights Implemented:
- **SaaS Platform Control Plane**: Tenant provisioning wizard, subscription plans, fine-grained entitlements, hardware fleet telemetry, integration registry, and support impersonation audit.
- **Restaurant Service Depth & Host Stand**: Seat-level ordering (`Seat 1..N`), course firing engine (`HELD` $\rightarrow$ `FIRED`), live waitlist queue, and reservation management.
- **Command Centre**: Multi-lens executive dashboard (GM, Owner, F&B, Hotel, Finance) featuring real-time revenue, occupancy, and cash variance metrics.
- **Transactional POS & Bar Control**: Multi-portion shot/bottle yield tracking, liquor depletion (AvT analysis), mixed tenders, credit note refunds, and check merging.
- **Hotel PMS & Tape Chart**: Visual room tape chart, multi-step check-in wizard, minibar charges, housekeeping inspection board, and engineering maintenance ticketing.
- **Catalog Studio & Dynamic Pricing**: Master catalog builder, cocktail recipe yields, and timed rule engines (Happy Hour, VIP, Staff rates).
- **CRM 360 & Loyalty**: Guest profiles, spend timelines, favorite items, and reward point redemption.
- **Events & Nightlife**: Ticket QR door scanner, promoter guest lists, and automated M-Pesa B2C commission payouts.
- **Universal Inbox**: Centralized operational task queue for approvals, low stock alerts, cash variances, and housekeeping exceptions.
- **Fiscal & Edge Resilience**: Local-first offline queue with KRA eTIMS fiscal signature generation and hardware device diagnostics.
