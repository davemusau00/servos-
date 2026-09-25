import React, { useState } from 'react';
import { Barcode, ClipboardCheck, Plus, Truck } from 'lucide-react';
import { useRuntime } from '../runtime/RuntimeProvider';
import type { Permission } from '../types/runtime';
import { barcodeEquals, useBarcodeScanner } from '../hooks/useBarcodeScanner';
import { ActionDialog } from './ActionDialog';
import { ManagerApprovalDialog } from './ManagerApprovalDialog';
import { buttonClass, fieldClass, money, primaryButtonClass, recordOf, recordsOf, shortDate } from './records';

type ReceiptDraftLine = { delivered: number; rejected: number; rejectionReason: string };

export function NativeProcurementView({ onOpenCatalog }: { onOpenCatalog: () => void }) {
  const runtime = useRuntime();
  const snapshot = runtime.snapshot!;
  const suppliers = recordsOf(snapshot, 'suppliers');
  const stockItems = recordsOf(snapshot, 'stockItems');
  const locations = recordsOf(snapshot, 'stockLocations');
  const orders = recordsOf(snapshot, 'purchaseOrders').slice().reverse();
  const receipts = recordsOf(snapshot, 'goodsReceipts').slice().reverse();
  const payables = recordsOf(snapshot, 'supplierPayables').slice().reverse();
  const permissions = snapshot.actor.permissions;
  const canManage = permissions.includes('procurement.manage');
  const canReceive = permissions.includes('procurement.receive');
  const canViewPayables = permissions.includes('accounting.view');

  const [section, setSection] = useState<'ORDERS' | 'RECEIPTS' | 'PAYABLES'>('ORDERS');
  const [notice, setNotice] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || '');
  const [selectedStockId, setSelectedStockId] = useState(stockItems[0]?.id || '');
  const [packageQuantity, setPackageQuantity] = useState(1);
  const [packagePrice, setPackagePrice] = useState(0);
  const [poScanCode, setPoScanCode] = useState('');
  const [poLines, setPoLines] = useState<any[]>([]);

  const [receivingOrder, setReceivingOrder] = useState<any | null>(null);
  const [receiptLocationId, setReceiptLocationId] = useState(locations[0]?.id || '');
  const [receiptDraft, setReceiptDraft] = useState<Record<string, ReceiptDraftLine>>({});
  const [grnScanCode, setGrnScanCode] = useState('');
  const [supplierInvoiceNumber, setSupplierInvoiceNumber] = useState('');
  const [deliveryNote, setDeliveryNote] = useState('');
  const [receiptNotes, setReceiptNotes] = useState('');
  const [approval, setApproval] = useState<{ permission: Permission; target: string; run: (token: string) => Promise<void> } | null>(null);

  const selectStockItem = (id: string) => {
    setSelectedStockId(id);
    setPackageQuantity(1);
    const item = stockItems.find((stock: any) => stock.id === id);
    const packSize = Number(item?.scanUnitQuantity) || 1;
    setPackagePrice((Number(item?.averageUnitCost) || 0) * packSize);
  };

  const handleScan = (raw: string) => {
    const code = raw.trim();
    if (!code) return;
    const matches = stockItems.filter((item: any) => barcodeEquals(item.barcode, code) || barcodeEquals(item.code, code));
    setPoScanCode('');
    setGrnScanCode('');
    if (matches.length !== 1) {
      setNotice(matches.length ? `Scan ${code} matches multiple stock items. Resolve the duplicate first.` : `No stock item is assigned to ${code}. No order or stock change was made.`);
      return;
    }
    const item = matches[0];
    if (createOpen) {
      selectStockItem(item.id);
      setNotice(`${item.name} selected. Confirm the ordered package quantity and price, then add the line.`);
      return;
    }
    if (receivingOrder) {
      const poLine = receivingOrder.items?.find((line: any) => line.stockItemId === item.id);
      if (!poLine) {
        setNotice(`${item.name} is not on ${receivingOrder.poNumber}. It was not counted.`);
        return;
      }
      const increment = Number(poLine.scanUnitQuantity) || Number(item.scanUnitQuantity) || 1;
      setReceiptDraft(previous => {
        const current = previous[item.id] || { delivered: 0, rejected: 0, rejectionReason: '' };
        return { ...previous, [item.id]: { ...current, delivered: Number(current.delivered || 0) + increment } };
      });
      setNotice(`Received draft: +${increment} ${poLine.unitSymbol} for ${item.name}. Review delivered and rejected quantities before posting the GRN.`);
    }
  };

  useBarcodeScanner({ enabled: createOpen || Boolean(receivingOrder), onScan: handleScan });

  const addPoLine = () => {
    const stock = stockItems.find((item: any) => item.id === selectedStockId);
    const packSize = Number(stock?.scanUnitQuantity) || 1;
    if (!stock || !Number.isFinite(packageQuantity) || packageQuantity <= 0 || !Number.isFinite(packagePrice) || packagePrice < 0) {
      setNotice('Choose a stock item and enter a positive package quantity and a valid package price.');
      return;
    }
    if (poLines.some(line => line.stockItemId === stock.id)) {
      setNotice(`${stock.name} is already on this draft. Remove its line before replacing it.`);
      return;
    }
    setPoLines(previous => [...previous, {
      stockItemId: stock.id,
      stockItemName: stock.name,
      quantityOrdered: packageQuantity * packSize,
      unitPrice: packagePrice / packSize,
      unitSymbol: stock.baseUnit,
      scanUnitQuantity: packSize,
      packageQuantity,
      packagePrice,
      lineTotal: packageQuantity * packagePrice,
    }]);
    setNotice(`${stock.name} added to the purchase order draft.`);
  };

  const createOrder = async () => {
    if (!supplierId || !poLines.length) {
      setNotice('Choose a supplier and add at least one stock item.');
      return;
    }
    setNotice('');
    try {
      await runtime.command('purchaseOrder.create', {
        supplierId,
        items: poLines.map(line => ({ stockItemId: line.stockItemId, quantityOrdered: line.quantityOrdered, unitPrice: line.unitPrice })),
      });
      setCreateOpen(false);
      setPoLines([]);
      setPoScanCode('');
      setNotice('Purchase order created and approved locally. It is queued for synchronization when online.');
    } catch (error) {
      setNotice(String(error));
    }
  };

  const beginReceiving = (order: any) => {
    setReceivingOrder(order);
    setReceiptLocationId(locations[0]?.id || '');
    setReceiptDraft({});
    setGrnScanCode('');
    setSupplierInvoiceNumber('');
    setDeliveryNote('');
    setReceiptNotes('');
    setNotice('');
  };

  const postReceipt = async (approvalToken?: string) => {
    if (!receivingOrder) return;
    const lines = (receivingOrder.items || []).map((line: any) => {
      const draft = receiptDraft[line.stockItemId] || { delivered: 0, rejected: 0, rejectionReason: '' };
      return {
        stockItemId: line.stockItemId,
        quantityDelivered: Number(draft.delivered || 0),
        quantityRejected: Number(draft.rejected || 0),
        quantityAccepted: Number(draft.delivered || 0) - Number(draft.rejected || 0),
        rejectionReason: draft.rejectionReason,
      };
    }).filter((line: any) => line.quantityDelivered > 0);
    if (!receiptLocationId || !lines.length) {
      setNotice('Choose a receiving location and scan or enter at least one delivered quantity.');
      return;
    }
    if (lines.some((line: any) => line.quantityRejected > line.quantityDelivered || line.quantityAccepted < 0)) {
      setNotice('Rejected quantity cannot exceed delivered quantity.');
      return;
    }
    if (lines.some((line: any) => line.quantityRejected > 0 && !line.rejectionReason.trim())) {
      setNotice('Enter a reason for each rejected delivery quantity.');
      return;
    }
    const overReceived = lines.some((line: any) => {
      const poLine = receivingOrder.items.find((item: any) => item.stockItemId === line.stockItemId);
      const remaining = Number(poLine.quantityOrdered || 0) - Number(poLine.quantityReceived || 0);
      return line.quantityAccepted > remaining + 0.000001;
    });
    if (overReceived && !approvalToken) {
      setApproval({ permission: 'procurement.over_receive', target: receivingOrder.id, run: token => postReceipt(token) });
      return;
    }
    setNotice('');
    try {
      await runtime.command('purchaseOrder.receive', {
        purchaseOrderId: receivingOrder.id,
        locationId: receiptLocationId,
        supplierInvoiceNumber: supplierInvoiceNumber.trim(),
        deliveryNote: deliveryNote.trim(),
        notes: receiptNotes.trim(),
        lines,
        ...(approvalToken ? { approvalToken } : {}),
      }, recordOf(snapshot, 'purchaseOrders', receivingOrder.id)?.version);
      setReceivingOrder(null);
      setReceiptDraft({});
      setNotice('Goods receipt posted. Accepted quantities, stock ledger, payable accrual and purchase order updated together.');
    } catch (error) {
      setNotice(String(error));
    }
  };

  const sectionButton = (id: typeof section, label: string) => <button key={id} className={section === id ? primaryButtonClass : buttonClass} onClick={() => setSection(id)}>{label}</button>;

  return <div className="h-full overflow-auto bg-slate-950 p-5 text-white">
    <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div><h1 className="flex items-center gap-2 text-2xl font-bold"><Truck className="h-6 w-6 text-amber-400" />Procurement</h1><p className="mt-1 text-sm text-slate-400">Purchase orders, scanner-assisted goods receipts and accepted-quantity accruals. Changes save locally first.</p></div>
      {canManage && <button className={primaryButtonClass} onClick={() => { setNotice(''); setSupplierId(suppliers[0]?.id || ''); setPoLines([]); setPoScanCode(''); setCreateOpen(true); }}><Plus className="mr-1 inline h-4 w-4" />New purchase order</button>}
    </header>

    {notice && <p role="status" className="mb-4 whitespace-pre-wrap rounded-lg border border-slate-700 bg-slate-900 p-3 text-sm text-slate-200">{notice}</p>}
    <nav className="mb-4 flex flex-wrap gap-2">{sectionButton('ORDERS', `Purchase orders (${orders.length})`)}{sectionButton('RECEIPTS', `Goods receipts (${receipts.length})`)}{canViewPayables&&sectionButton('PAYABLES', `Payables (${payables.length})`)}</nav>

    {section === 'ORDERS' && <div className="space-y-3">
      {!suppliers.length && <div className="rounded-xl border border-amber-800 bg-amber-950/30 p-4 text-sm">Add a supplier in Catalog before creating a purchase order. <button className="ml-2 underline" onClick={onOpenCatalog}>Open Catalog</button></div>}
      {orders.map((order: any) => <article key={order.id} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-bold text-amber-300">{order.poNumber}</h2><p className="text-sm text-slate-300">{order.supplierName} · {shortDate(order.createdAt)}</p><p className="mt-1 text-xs text-slate-500">{order.status} · approved by {order.approvedBy || order.createdByName || '—'}</p></div><div className="text-right"><b>{money(order.grandTotal)}</b>{canReceive && ['APPROVED', 'PARTIALLY_RECEIVED'].includes(order.status) && <button className={buttonClass + ' ml-3'} onClick={() => beginReceiving(order)}>Receive delivery</button>}</div></div>
        <div className="mt-3 divide-y divide-slate-800">{(order.items || []).map((line: any) => <div key={line.stockItemId} className="flex flex-wrap justify-between gap-2 py-2 text-sm"><span>{line.stockItemName}</span><span className="font-mono text-slate-300">Ordered {line.quantityOrdered} {line.unitSymbol} · accepted {line.quantityReceived || 0} · rejected {line.quantityRejected || 0}</span></div>)}</div>
      </article>)}
      {!orders.length && <p className="rounded-xl border border-dashed border-slate-700 p-6 text-slate-400">No purchase orders have been created.</p>}
    </div>}

    {section === 'RECEIPTS' && <div className="space-y-3">{receipts.map((receipt: any) => <article key={receipt.id} className="rounded-xl border border-slate-800 bg-slate-900 p-4"><div className="flex flex-wrap justify-between gap-3"><div><h2 className="font-bold text-emerald-300">{receipt.grnNumber}</h2><p className="text-sm text-slate-300">{receipt.poNumber} · {receipt.supplierName}</p><p className="text-xs text-slate-500">{shortDate(receipt.receivedAt)} · {receipt.receivedByName}</p></div><div className="text-right text-sm">Accepted value: {money(receipt.acceptedValue)}<p className="text-xs text-slate-500">{receipt.supplierInvoiceNumber || 'Invoice reference not entered'}</p></div></div><div className="mt-3 space-y-1 text-sm">{(receipt.lines || []).map((line: any) => <p key={line.stockItemId} className="text-slate-300">{line.stockItemName}: delivered {line.quantityDelivered}, accepted {line.quantityAccepted}, rejected {line.quantityRejected} {line.unitSymbol}</p>)}</div></article>)}{!receipts.length && <p className="rounded-xl border border-dashed border-slate-700 p-6 text-slate-400">No goods receipts have been posted.</p>}</div>}

    {section === 'PAYABLES' && canViewPayables && <div className="space-y-3">{payables.map((payable: any) => <article key={payable.id} className="flex flex-wrap justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900 p-4"><div><h2 className="font-bold">{payable.payableNumber} · {payable.supplierName}</h2><p className="text-sm text-slate-400">{payable.grnNumber} · {payable.status}</p><p className="text-xs text-slate-500">{payable.basis}</p></div><b>{money(payable.amount)}</b></article>)}{!payables.length && <p className="rounded-xl border border-dashed border-slate-700 p-6 text-slate-400">Accepted goods create payable accruals. Rejected quantities do not create stock or payable value.</p>}<p className="rounded-lg border border-slate-800 p-3 text-xs text-slate-500">Accruals use accepted quantities at the approved purchase-order unit cost. Supplier invoice matching and payment settlement remain separate accounting steps.</p></div>}

    {createOpen && <ActionDialog title="Create purchase order" onClose={() => setCreateOpen(false)}>
      {!suppliers.length ? <div className="space-y-3"><p>No suppliers are configured.</p><button className={buttonClass} onClick={onOpenCatalog}>Open Catalog to add a supplier</button></div> : <div className="space-y-4">
        <label className="block text-sm">Supplier<select className={fieldClass + ' mt-1'} value={supplierId} onChange={event => setSupplierId(event.target.value)}>{suppliers.map((supplier: any) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}</select></label>
        <div className="rounded-xl border border-slate-700 p-3"><label className="block text-sm">Scan stock barcode or SKU<input autoFocus data-barcode-capture="true" className={fieldClass + ' mt-1 font-mono'} placeholder="Focus here, then scan" value={poScanCode} onChange={event => setPoScanCode(event.target.value)} /></label><div className="mt-2 flex items-center gap-2 text-xs text-slate-500"><Barcode className="h-4 w-4" />Scan selects a stock master; it does not set the ordered quantity.</div></div>
        <label className="block text-sm">Stock item<select className={fieldClass + ' mt-1'} value={selectedStockId} onChange={event => selectStockItem(event.target.value)}>{stockItems.map((item: any) => <option key={item.id} value={item.id}>{item.name} · {item.code}</option>)}</select></label>
        {(() => { const stock = stockItems.find((item: any) => item.id === selectedStockId); const packSize = Number(stock?.scanUnitQuantity) || 1; return <div className="grid gap-3 sm:grid-cols-2"><label className="text-sm">Packages ordered<input className={fieldClass + ' mt-1'} type="number" min="0.001" step="0.001" value={packageQuantity} onChange={event => setPackageQuantity(Number(event.target.value))} /><span className="text-xs text-slate-500">Each package represents {packSize} {stock?.baseUnit || 'base units'}.</span></label><label className="text-sm">Price per package (KES)<input className={fieldClass + ' mt-1'} type="number" min="0" step="0.01" value={packagePrice} onChange={event => setPackagePrice(Number(event.target.value))} /></label></div>; })()}
        <button className={buttonClass} disabled={!stockItems.length} onClick={addPoLine}>Add item to draft</button>
        <div className="space-y-2">{poLines.map(line => <div key={line.stockItemId} className="flex items-center justify-between gap-3 rounded-lg bg-slate-950 p-3 text-sm"><div><b>{line.stockItemName}</b><p className="text-xs text-slate-500">{line.packageQuantity} package(s) → {line.quantityOrdered} {line.unitSymbol}</p></div><div className="flex items-center gap-3"><span>{money(line.lineTotal)}</span><button className="text-rose-300" onClick={() => setPoLines(previous => previous.filter(item => item.stockItemId !== line.stockItemId))}>Remove</button></div></div>)}</div>
        <p className="text-xs text-slate-500">Order costs are recorded per stock base unit. Tax is not inferred; enter the agreed supplier package cost.</p>
        <button className={primaryButtonClass} disabled={!supplierId || !poLines.length} onClick={() => void createOrder()}>Create and approve PO</button>
      </div>}
    </ActionDialog>}

    {receivingOrder && <ActionDialog title={`Receive ${receivingOrder.poNumber}`} onClose={() => setReceivingOrder(null)}>
      <div className="space-y-4">
        <label className="block text-sm">Receiving stock location<select className={fieldClass + ' mt-1'} value={receiptLocationId} onChange={event => setReceiptLocationId(event.target.value)}>{locations.map((location: any) => <option key={location.id} value={location.id}>{location.name}</option>)}</select></label>
        <div className="rounded-xl border border-slate-700 p-3"><label className="block text-sm">Scan delivered packages<input autoFocus data-barcode-capture="true" className={fieldClass + ' mt-1 font-mono'} placeholder="Focus here; each scan adds one package" value={grnScanCode} onChange={event => setGrnScanCode(event.target.value)} /></label><p className="mt-2 text-xs text-slate-500">Scans add delivered quantity only. Mark any rejected quantity and its reason before posting.</p></div>
        <div className="space-y-3">{(receivingOrder.items || []).map((line: any) => {
          const stock = stockItems.find((item: any) => item.id === line.stockItemId);
          const draft = receiptDraft[line.stockItemId] || { delivered: 0, rejected: 0, rejectionReason: '' };
          const remaining = Math.max(0, Number(line.quantityOrdered || 0) - Number(line.quantityReceived || 0));
          const accepted = Number(draft.delivered || 0) - Number(draft.rejected || 0);
          const packageSize = Number(line.scanUnitQuantity) || Number(stock?.scanUnitQuantity) || 1;
          return <div key={line.stockItemId} className="rounded-xl border border-slate-800 bg-slate-900 p-3">
            <div className="flex flex-wrap justify-between gap-2"><b>{line.stockItemName}</b><span className="text-xs text-slate-400">Ordered {line.quantityOrdered} · accepted previously {line.quantityReceived || 0} · remaining {remaining} {line.unitSymbol}</span></div>
            <p className="my-2 text-xs text-slate-500">One barcode scan adds {packageSize} {line.unitSymbol}. This PO uses the package size saved when it was created.</p>
            <div className="grid gap-2 sm:grid-cols-3"><label className="text-xs">Delivered<input className={fieldClass + ' mt-1'} type="number" min="0" step="0.001" value={draft.delivered} onChange={event => setReceiptDraft(previous => ({ ...previous, [line.stockItemId]: { ...draft, delivered: Number(event.target.value) } }))} /></label><label className="text-xs">Rejected<input className={fieldClass + ' mt-1'} type="number" min="0" step="0.001" value={draft.rejected} onChange={event => setReceiptDraft(previous => ({ ...previous, [line.stockItemId]: { ...draft, rejected: Number(event.target.value) } }))} /></label><div className="rounded-lg bg-slate-950 p-2 text-xs">Accepted now<strong className="mt-1 block text-emerald-300">{Math.max(0, accepted)} {line.unitSymbol}</strong></div></div>
            {Number(draft.rejected) > 0 && <label className="mt-2 block text-xs">Rejection reason<input className={fieldClass + ' mt-1'} value={draft.rejectionReason} onChange={event => setReceiptDraft(previous => ({ ...previous, [line.stockItemId]: { ...draft, rejectionReason: event.target.value } }))} /></label>}
            {accepted > remaining + 0.000001 && <p className="mt-2 text-xs text-amber-300">This accepts {accepted - remaining} {line.unitSymbol} above the open PO quantity and requires a different Admin or Manager to approve.</p>}
          </div>;
        })}</div>
        <label className="block text-sm">Supplier invoice number (optional)<input className={fieldClass + ' mt-1'} value={supplierInvoiceNumber} onChange={event => setSupplierInvoiceNumber(event.target.value)} /></label>
        <label className="block text-sm">Delivery note (optional)<input className={fieldClass + ' mt-1'} value={deliveryNote} onChange={event => setDeliveryNote(event.target.value)} /></label>
        <label className="block text-sm">Receipt notes<textarea className={fieldClass + ' mt-1'} value={receiptNotes} onChange={event => setReceiptNotes(event.target.value)} /></label>
        <button className={primaryButtonClass} disabled={!receiptLocationId} onClick={() => void postReceipt()}><ClipboardCheck className="mr-1 inline h-4 w-4" />Post goods receipt</button>
      </div>
    </ActionDialog>}

    {approval && <ManagerApprovalDialog permission={approval.permission} target={approval.target} onClose={() => setApproval(null)} onApproved={approval.run} />}
  </div>;
}
