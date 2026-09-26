## 2026-09-26 - Bar production hardening 01

- Fixed the fresh-setup service-area/stock-location sequencing regression by allowing unresolved outlet stock location only before Go Live and enforcing the relation at Go Live.
- Made the local backup step a required first-Go-Live gate.
- Added pre-enrollment Intake reopening for legacy or incomplete commissioning profiles.
- Connected reusable customers to named POS tabs and added Repeat last round.
- Prevented active product/recipe/modifier dependencies from being broken by stock-master archival.
- Routed supplier receiving through Procurement in the installed UI so PO, GRN, AP and journal controls are not bypassed.
- Added numeric supplier payment terms used by AP due-date calculation.
- Prevented ambiguous same-method two-leg split tenders.
- Prevented duplicate close-day report generation for the same till.
- Normalized Enrollment UI UTF-8 text and removed committed patch-backup artifacts from the repository working tree.

## 2026-09-26 - Intake/Admin and safe CRUD hardening

- Moved business, owner and initial System Administrator configuration into pre-enrollment Intake without persisting credentials.
- Enrollment now derives the local Admin identity from the confirmed Intake and stores commissioning evidence.
- Added permission-aware Master Data CRUD for customers, suppliers, service areas and stock locations.
- Added master-data archive guards for live dependencies.
- Corrected price-rule scope/day compatibility and exposed weekday controls.
- Fixed multi-permission documentation validation that was making CI fail after procurement permissions were documented.

# Changelog

## 2026-09-24 — Bar-first v2 source integration

- introduced durable installation state and Intake Wizard;
- changed enrollment to create a business shell without fake outlet/store/catalog data;
- added resumable Business Setup Wizard and native Go-Live gate;
- introduced native permission catalogue and authenticated permission snapshots;
- removed native role simulation in favor of lock/change-staff and single-use manager approval;
- added staff lifecycle controls;
- expanded bar order engine for quantities, portions, modifiers, recipes, pricing snapshots, KDS item state, discounts, comps, transfers, merges and fired void disposition;
- added refund/reversal accounting without automatic stock restoration;
- added receiving/opening balance/count/transfer/waste inventory workflows;
- added cash drawer movements, strict till close and persisted close-day reports;
- added native bar production shell and offline generated Help Center;
- added CI, source verification and Windows/Linux/Android deployment scripts;
- updated documentation around bar-first acceptance and Definition of Done.
