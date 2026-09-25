# Receiving Stock

Section: Procurement
Roles: Admin, Manager, Server
Permission: procurement.view, procurement.manage, procurement.receive
Screen: procurement
Keywords: purchase order, procurement, GRN, goods receipt, barcode scanner, ServOS

## Overview

The Procurement screen keeps the purchase order (PO), goods received note (GRN), accepted stock and supplier accrual linked. It works offline: successful commands commit to the installed terminal's SQLite database and queue for synchronization. Creating a PO requires `procurement.manage`; receiving requires `procurement.receive`.

## Procedure

### Create the purchase order

1. Add and save the supplier in Catalog if it is not already listed.
2. Open **Procurement** and choose **New purchase order**.
3. Select the supplier. Scan a stock barcode or SKU to select a stock master, or choose it from the list.
4. Enter the number of packages being ordered and the agreed price per package. The screen converts packages to the stock base unit using the scan quantity saved on the stock master. Review the converted quantity and price before adding the line.
5. Add each stock item once. Review the PO lines and total, then choose **Create and approve PO**. The PO stores ordered quantities and agreed cost per base unit; tax is not inferred.

### Receive a delivery and post its GRN

1. Open an **APPROVED** or **PARTIALLY_RECEIVED** PO and choose **Receive delivery**.
2. Select the stock location where the delivery physically arrived.
3. Scan each delivered package in **Scan delivered packages**. One scan adds the package size captured when that PO was created. You can edit the **Delivered** count manually; the number is in stock base units.
4. For damaged, short-dated or otherwise refused goods, enter the rejected quantity and a reason. Accepted quantity is delivered minus rejected. Check every line against the supplier's delivery before posting.
5. If accepted quantity would exceed the remaining PO quantity, a different Admin or Manager must approve with their own PIN. The approval is for this PO only, expires after two minutes and can be used once.
6. Enter the supplier invoice number and delivery note when available, add receipt notes, and choose **Post goods receipt**.

An unknown or duplicate barcode does not add quantity. Do not scan a barcode for a product that is not on the PO. Add the correct stock master or correct its barcode before receiving.

### Review the result

Open **Goods receipts** to review the GRN, delivery evidence, delivered/accepted/rejected quantities, receiver and timestamp. Accepted quantity alone increases stock and weighted-average cost and creates the stock movement. The GRN, accepted stock ledger, PO cumulative quantities, audit/outbox records, payable accrual and journal entry are written in one local transaction. Rejected quantities stay on the GRN with their reason and create no stock or payable value.

The **Payables** section is visible to users with `accounting.view`. Its receipt accrual uses accepted quantities at the agreed PO price. Supplier invoice matching and payment settlement are separate accounting steps; a typed invoice reference does not mark an invoice paid.

## What ServOS records

Actions that change the business are committed through the native backend. For receiving, the GRN, stock movement and payable accrual are atomic; synchronization remains pending until the terminal reconnects.

## Common mistakes and correction

Do not post a second GRN to fix a mistake without first reviewing the posted receipt. Posted GRNs are historical records and are not deleted by editing the PO. Record rejected goods before posting; after a receipt is posted, use the approved stock adjustment/return process and retain the supplier evidence. A successful local commit is not proof that remote synchronization has completed.
