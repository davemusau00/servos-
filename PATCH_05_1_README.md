# ServOS Patch 05.1 Documentation Repair

This repair changes only `docs/user-guide/34-rooms-engine.md`.

It adds the documentation checker's required `## Overview` and `## Procedure` headings and changes the permission metadata to comma-separated recognized permissions.

Run:

```powershell
node .\apply-servos-patch-05-1-repair.mjs C:\Users\Admin\Downloads\servos
npm run docs:check
```
