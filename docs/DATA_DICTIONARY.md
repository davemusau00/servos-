# Data dictionary

| Store | Purpose and invariant |
|---|---|
| metadata | Installation identity, cloud connection settings and last successful sync |
| staff | Local identity, role, salted PIN hash, active state and persistent attempt throttling |
| sessions | Random local bearer session, staff identity and idle deadline |
| records | Collection/id key, optimistic version, JSON domain payload, archive flag |
| commands | Unique command ID, serialized request fingerprint and committed result |
| audit | Ordered command attribution; application-level update/delete rejection |
| outbox | Exact operation envelope linked to audit sequence; acknowledgement only after server commit |
| mpesa_codes | Unique receiving account/code mapped to one receipt |
| remote_requests | Durable processing outcomes; successful request acknowledgement waits for the command's outbox upload |

BusinessCommand contains id, schemaVersion, operation, optional targetVersion and payload. Actor and terminal identity come from native session/enrollment rather than frontend claims. CommandResult returns record IDs, audit reference and local sequence.

Sync operations carry sequence, command ID, operation, actor, time and changed versioned records. Cloud business_records is a read replica, not an independent writer. Remote changes have pending/applied/rejected/conflict state.

Payments retain integer amountMinor alongside compatibility KES fields. Existing UI-shaped records still contain decimal monetary and quantity fields; full integer/precision normalization remains unfinished. Do not imply that a JSON record store establishes all domain constraints.

`floorplan.save` accepts an outlet ID, baseline table IDs/versions and the complete proposed active table layout for that outlet. It checks the whole baseline, preserves operational state, archives omitted unoccupied tables and emits one atomic audit/outbox operation. Table records retain shape, percentage coordinates, capacity, section, minimum-spend configuration and optional staff assignment. Minimum-spend enforcement at settlement remains pending.

`table.ready` requires the table's expected version, an unoccupied CLEANING state, and an enrolled staff session. It stores cleanedBy/cleanedAt and changes the state to AVAILABLE. Seating and transfer reject tables that are not available. Floorplan changes cannot reset these states.
