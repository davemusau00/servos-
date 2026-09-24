# Implementation roadmap

The accepted objective covers every existing operational module. Completing the foundation does not complete the objective.

1. Establish reproducible builds and finish the runtime interaction audit, including non-button cards, responsive layouts and modal behavior.
2. Verify native SQLite transactions, permissions and enrollment recovery; secure device credentials and backups, and normalize domain constraints.
3. Exercise upload/replay, remote requests, conflicts and the manager UI against the configured Supabase project. Implement staff revocation and device replacement.
4. Finish the complete trading slice: product modifiers/portions/pricing, fire-time stock snapshots, lifecycle controls, tax-configured journals, receipts, refunds, split/merge/transfer, till accounting and customer credit.
5. Integrate procurement and production, hotel/host, CRM, events, HR, controls and reports. Replace component-local fixtures with native queries and dedicated commands, preserving cross-module atomicity.
6. Finish guest ordering, manual external handoffs, accessible interactions and report/export parity.
7. Rehearse business opening-to-close, extended offline trading, reconnect replay, upgrades and backup restoration on the actual terminal platform.

Each workflow requires happy-path, invalid input, permission denial, reload, failure, duplicate and synchronization evidence before its coverage status advances. Do not count hidden or disabled prototype features as implemented.
