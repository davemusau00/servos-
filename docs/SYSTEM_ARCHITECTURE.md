# System architecture

ServOS v2 targets **one business → one premises/property → one authoritative installed terminal**. Internal service areas and stock locations are logical subdivisions, not tenants or terminals.

```text
React native production shell
        ↓
typed Tauri invoke boundary
        ↓
Rust capability + business-rule validation
        ↓
SQLite transaction
records + journals/stock effects + immutable audit + ordered outbox
        ↓ when online
authenticated ordered Supabase upload
        ↓
remote read replica / constrained manager requests
```

The browser preview is explicitly sample data and is never a production writer. The browser Remote Manager reads replicated records and submits constrained requests that remain pending until the terminal applies and uploads them.

## Authority

- Rust derives actor/role from local session.
- Runtime snapshots return native permissions.
- Go Live is enforced at the command boundary.
- Manager elevation is single-use rather than role impersonation.
- SQLite commit means local success; it does not mean provider/server acknowledgement.
