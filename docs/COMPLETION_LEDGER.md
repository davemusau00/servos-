# Completion ledger

This ledger distinguishes source implementation from executed verification.

| Slice | Backend | Installed UI | Docs | Executed evidence here | Acceptance status |
|---|---|---|---|---|---|
| Floorplan + table.ready | implemented | implemented | updated | source inspection; native suite pending | source implemented |
| Native capability RBAC | implemented | permission-driven shell | RBAC guide | docs/source checks pending final run | source implemented |
| Manager single-use approval | implemented | approval dialog | RBAC guide | native execution pending | source implemented |
| Intake → enrollment → setup → Go Live | implemented | implemented | onboarding + guide | native execution pending | source implemented |
| Catalog/portions/modifiers/recipes/pricing | implemented | implemented | user guide | native/frontend execution pending | source implemented |
| Bar POS/KDS/table lifecycle | implemented | implemented | user guide | native/frontend execution pending | source implemented |
| Payments/M-Pesa/split/refund | implemented | implemented | user guide | native execution pending | source implemented |
| Inventory receipt/count/transfer/waste | implemented | implemented | user guide | native execution pending | source implemented |
| Till/cash movements/close day | implemented | implemented | user guide | native execution pending | source implemented |
| Offline Help Center | generated from Markdown | implemented | 30 articles | generator/docs checks executable with Node | locally generatable |
| CI/deploy scripts | source implemented | n/a | runbook | syntax/source checks required | source implemented |

When a target-machine check passes, add the commit, OS/device, exact command, date and result to [TEST_EVIDENCE.md](TEST_EVIDENCE.md).
