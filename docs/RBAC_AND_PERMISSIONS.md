# RBAC and permissions

ServOS has one authoritative installed terminal. **Rust/native authorization is the source of truth.** React uses the permission list returned in the authenticated runtime snapshot only to hide or disable unavailable actions.

## Roles

| Persisted role | Product label | Default purpose |
|---|---|---|
| `Admin` | Owner / Administrator | Business ownership, setup, security and all operational authority |
| `Manager` | Manager / Supervisor | Operational supervision, approvals, inventory control and reconciliation |
| `Server` | Bar Operator | Bartender/waiter/cashier daily trading |

Job title is stored separately from security role.

## Capability registry

The canonical registry is `ALL_PERMISSIONS` in `src-tauri/src/store.rs`. It includes business configuration, staff lifecycle, POS/order actions, payments/till, M-Pesa, catalog/pricing, inventory, floorplan, KDS, reports/audit, backup/sync and system configuration.

The runtime snapshot includes:

```text
actor.id
actor.name
actor.role
actor.permissions[]
```

The installed UI contains no role simulator. Change actor by locking the terminal and unlocking with another staff PIN.

## Manager override

Protected operations can request `runtime_manager_approve`. The native backend verifies the manager/Admin PIN and capability, then creates a single-use approval token scoped to:

- initiating staff member;
- capability;
- optional target record;
- 120-second expiry.

`authorize()` consumes that token once. Audit evidence records the approving staff identity. This permits a bartender to request a void/discount/refund approval without replacing the bartender's session.

## Staff lifecycle

Native operations include `staff.create`, `staff.update`, `staff.resetPin`, `staff.changeRole`, and `staff.deactivate`.

Rules:
- Server cannot administer staff.
- Manager cannot create Admin accounts.
- only Admin can change persisted security role.
- final active Admin cannot be deactivated or demoted.
- role change, PIN reset and deactivation revoke active sessions for the affected staff member.
- referenced historical staff records are deactivated, not transactionally erased.

## Acceptance

Every protected native command requires a positive role/capability test and a denied test. Manager approval tests must cover expiry, single use, wrong target, wrong initiator and insufficient approver authority.
# Expansion permissions

The [workflow contracts](EXPANSION_WORKFLOWS.md) identify planned domain capabilities and offline restrictions. They do not yet extend the current Rust registry. Cloud memberships, device/operator grants and field-filtered queries must be implemented before enabling browser operational writes.
