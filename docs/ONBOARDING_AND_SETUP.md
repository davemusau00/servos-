# Intake, enrollment and business setup

The installed application follows this durable state machine:

`NEW → INTAKE_IN_PROGRESS → READY_FOR_ENROLLMENT → ENROLLMENT_PENDING → SETUP_REQUIRED → READY_FOR_GO_LIVE → LIVE`

`runtime_status` returns the current state before login. After login, `runtime_snapshot` returns the same installation stage with the authenticated actor and permissions.

## Intake Wizard

The pre-enrollment Intake Wizard persists configuration intent in SQLite metadata through `runtime_intake_save` / `runtime_intake_complete`. It captures venue type, counter/tab/table service, operating pattern, payments, M-Pesa account, sales/stock model, service areas, stock areas, staff estimates, hardware expectations, import strategy and intended go-live date. No fake catalog or transaction records are created.

## Owner enrollment

Enrollment requires the confirmed intake, owner online authentication and a local 6–12 digit PIN. The backend creates the terminal identity, business/property shell, first Admin identity/employee and `businessSetup` progress record. It intentionally does **not** seed a restaurant outlet, stock store, products or opening balances.

## Business Setup Wizard

Required steps are:
1. Business identity
2. Tax configuration
3. Payment methods
4. Service areas
5. Stock locations
6. Catalog
7. Opening inventory acknowledgement
8. Staff access
9. Till policy

Optional steps are recipes/portions, floorplan and backup/synchronization rehearsal. Each `setup.completeStep` checks relevant persisted evidence rather than trusting UI checkbox state.

Opening stock uses `inventory.openingBalance` and creates explicit stock movements. It never rewrites stock silently.

## Go Live

`setup.goLive` is Admin-only and revalidates the required persisted business state. Once successful it writes approval actor/time into `businessSetup` and sets installation stage `LIVE`.

The Rust command boundary blocks till, order, payment, reconciliation, operational inventory and close-day commands until the stage is `LIVE`. UI gating is therefore not the only protection.
