# Receiving Stock

Section: Inventory
Roles: Admin, Manager
Permission: inventory.receive
Screen: inventory
Keywords: receiving stock, inventory, ServOS

## Overview

Receiving increases stock and updates weighted-average cost with supplier evidence.

## Procedure

Choose Receive, select stock item and location, enter quantity and unit cost, select supplier when available, and record delivery/invoice references. ServOS creates a receipt record and movement in one transaction.

## What ServOS records

Actions that change the business are committed through the native backend. When applicable, business records, audit evidence and synchronization outbox entries commit together.

## Common mistakes and correction

Do not treat a button, toast or browser preview as proof that a business transaction was committed. Correct mistakes through the documented reversal, void, refund, count or manager-approved workflow rather than deleting historical transactions.
