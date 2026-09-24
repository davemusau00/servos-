# Xprinter XP-80T receipt printing

Section: Hardware and Receipts
Roles: Admin, Manager, Server
Permission: pos.sell
Screen: POS, Business Setup
Keywords: XP-80T, Xprinter, USB printer, receipt printing, customer copy, business copy, Windows driver

## Overview

ServOS prints through the operating system printer queue. The XP-80T can use the installed Windows driver over USB, so operators can print receipts without attaching directly to a raw USB device interface.

## Procedure

## Before connecting

The XP-80T is an 80 mm thermal receipt printer with USB and USB plus Ethernet variants. Use the 24 V, 1.25 A adapter supplied for the printer. Load an 80 mm thermal paper roll with the paper feeding from the correct side. The printer's USB connection carries print data; the separate cash drawer socket is not a USB port.

## Install and test the Windows queue

1. Download the XP-80T Windows driver from the [Xprinter driver page](https://www.xprinter.net/Download_Details/3.html).
2. Install the driver, connect the printer to power, and connect the USB data cable to the Windows 10 POS computer.
3. In Windows Settings, open Bluetooth & devices, then Printers & scanners. Confirm the Xprinter queue appears.
4. Print a Windows test page before using ServOS. If Windows does not list the printer, check power, USB cable, another USB port, and the manufacturer's driver installer.
5. In ServOS Business Setup, set Receipt printing to **Windows / OS printer queue (USB or LAN)**. Complete setup and unlock an operator session.

ServOS uses the Windows print dialog and installed queue. At print time, choose the Xprinter XP-80T queue. The same route can use the XP-80T network queue when the installed Windows driver has been configured for its Ethernet address. The printer model supports ESC/POS commands, but ServOS currently sends formatted pages through the OS driver; it does not open the USB device as a raw port.

## Print the sale receipts

After a native POS payment is recorded, ServOS opens the receipt dialog. Choose **Print both copies**. The print job includes:

- **Customer copy:** business and outlet, receipt number and time, ordered items, total, tender and reference, and any cash change.
- **Business record copy:** the same sale details plus the transaction ID and operator name for filing and reconciliation.

Both copies are pages in one Windows print job. Use 80 mm paper in the driver settings. A test print on the installed XP-80T is required to confirm that Windows applies the correct roll width and cut behavior. Receipt print success is not eTIMS confirmation; fiscal submission is not connected.

## If nothing prints

1. Use the printer's self-test: turn the printer off, hold **FEED**, turn it on, and release FEED after the self-test begins.
2. If the self-test prints, the printer mechanism and paper are working. Return to Windows and print its test page.
3. Reopen the ServOS print dialog and select the Xprinter queue rather than a PDF queue. Check the Windows print queue for paused or failed jobs.
4. If Windows test printing works but a ServOS receipt is clipped, set paper width to 80 mm and disable any letter-size scaling in printer preferences.
5. Keep the customer and business copies together if a paper jam or printer warning interrupts the job. Reprint both copies from the receipt dialog; do not treat a browser preview or an unconfirmed print dialog as proof that paper came out.

## Related workflows

Use [Business Setup](04-business-setup.md) to set till policy, [M-Pesa](12-mpesa.md) to reconcile manual receipt codes, and [Close Day](24-close-day.md) to retain transaction and shift records.
