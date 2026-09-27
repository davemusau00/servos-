# ServOS Patch 06.1 Source-Test Repair

Patch 06 intentionally changed the Front Desk queue label from `Arrivals today` to
`Arrivals & overdue` so late unclosed arrivals remain operationally visible.

The source-level Node test still asserted the old label. This repair updates only:

`tests/front-desk-source.test.mjs`

Run:

```powershell
node .\apply-servos-patch-06-1-repair.mjs C:\Users\Admin\Downloads\servos
npm test
```

If `npm test` passes, Patch 06's full validation gate is green because the uploaded
validation already passed native, desktop, build, browser, UI audit, and docs checks.
