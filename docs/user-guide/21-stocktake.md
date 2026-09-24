# Physical Stocktake

Section: Stocktake
Roles: Admin, Manager
Permission: inventory.count
Screen: inventory
Keywords: physical stocktake, stocktake, ServOS

## Overview

A stock count posts the difference between expected and physical quantity as an auditable adjustment.

## Procedure

Select Count, choose item and location, enter the physically counted base quantity and reason. ServOS calculates the delta and refuses impossible invalid quantities.

## What ServOS records

Actions that change the business are committed through the native backend. When applicable, business records, audit evidence and synchronization outbox entries commit together.

## Common mistakes and correction

Do not treat a button, toast or browser preview as proof that a business transaction was committed. Correct mistakes through the documented reversal, void, refund, count or manager-approved workflow rather than deleting historical transactions.
