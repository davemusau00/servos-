import React, { useState } from 'react';
import { useRuntime } from '../runtime/RuntimeProvider';
import type { Permission } from '../types/runtime';
import { barcodeEquals, useBarcodeScanner } from '../hooks/useBarcodeScanner';
import { recordsOf, fieldClass, buttonClass, primaryButtonClass, money } from './records';
import { ManagerApprovalDialog } from './ManagerApprovalDialog';
import { ActionDialog } from './ActionDialog';

export function NativeInventoryView() {
  const runtime = useRuntime();
  const snapshot = runtime.snapshot!;
  const stocks = recordsOf(snapshot, 'stockItems');
  const locations = recordsOf(snapshot, 'stockLocations');
  const movements = recordsOf(snapshot, 'stockMovements').slice().reverse().slice(0, 100);
  const [modal, setModal] = useState<string | null>(null);
  const [approval, setApproval] = useState<{ permission: Permission; run: (token: string) => Promise<void> } | null>(null);
  const [notice, setNotice] = useState('');
  const permissions = snapshot.actor.permissions;
  const [form, setForm] = useState({
    stockItemId: stocks[0]?.id || '', locationId: locations[0]?.id || '', toLocationId: locations[1]?.id || '',
    quantity: 1, countedQty: 0, reason: '', scanBarcode: '',
  });

  const act = async (operation: string, payload: Record<string, unknown>, permission: Permission) => {
    const execute = async (token?: string) => {
      await runtime.command(operation, { ...payload, approvalToken: token });
      setModal(null);
    };
    if (permissions.includes(permission)) await execute();
    else setApproval({ permission, run: async token => execute(token) });
  };

  const resolveBarcode = (raw: string) => {
    const code = raw.trim();
    if (!code) return;
    const matches = stocks.filter((item: any) => barcodeEquals(item.barcode, code) || barcodeEquals(item.code, code));
    setForm(previous => ({ ...previous, scanBarcode: '' }));
    if (matches.length !== 1) {
      setNotice(matches.length ? `Barcode ${code} matches more than one stock item.` : `Unknown stock barcode: ${code}`);
      return;
    }
    const item = matches[0];
    if (form.countedQty > 0 && form.stockItemId !== item.id) {
      setNotice(`Finish the count for ${stocks.find((stock: any) => stock.id === form.stockItemId)?.name || 'the selected item'} before scanning another stock item.`);
      return;
    }
    const increment = Number(item.scanUnitQuantity) || 1;
    setForm(previous => ({
      ...previous,
      stockItemId: item.id,
      countedQty: Number(previous.stockItemId === item.id ? previous.countedQty : 0) + increment,
      scanBarcode: '',
    }));
    setNotice(`Count draft: +${increment} ${item.baseUnit} for ${item.name}. Review the total and commit to post the adjustment.`);
  };

  useBarcodeScanner({ enabled: modal === 'COUNT', onScan: resolveBarcode });

  return <div className="h-full overflow-auto bg-slate-950 p-5 text-white">
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div><h1 className="text-2xl font-bold">Inventory</h1><p className="text-sm text-slate-400">Location-driven stock ledger. Supplier receipts are posted through Procurement so stock, GRN, payable and journal remain one atomic chain.</p></div>
      <div className="flex flex-wrap gap-2">
        <button className={buttonClass} onClick={() => { setNotice(''); setForm(previous => ({ ...previous, countedQty: 0, scanBarcode: '' })); setModal('COUNT'); }}>Count</button>
        <button className={buttonClass} onClick={() => setModal('TRANSFER')}>Transfer</button>
        <button className={buttonClass} onClick={() => setModal('WASTE')}>Waste</button>
      </div>
    </div>

    {notice && <p role="status" className="mb-3 rounded-lg bg-slate-900 p-3 text-sm text-slate-300">{notice}</p>}
    <div className="overflow-x-auto rounded-xl border border-slate-800">
      <table className="w-full text-sm"><thead className="bg-slate-900 text-left text-slate-400"><tr><th className="p-3">Stock item</th><th className="p-3">Unit</th>{locations.map((location: any) => <th className="p-3" key={location.id}>{location.name}</th>)}<th className="p-3">Avg cost</th></tr></thead>
        <tbody>{stocks.map((stock: any) => <tr key={stock.id} className="border-t border-slate-800"><td className="p-3 font-semibold">{stock.name}<div className="text-xs text-slate-500">{stock.code}</div></td><td className="p-3">{stock.baseUnit}</td>{locations.map((location: any) => <td className="p-3 font-mono" key={location.id}>{Number(stock.currentStock?.[location.id] || 0).toLocaleString()}</td>)}<td className="p-3">{money(stock.averageUnitCost)}</td></tr>)}</tbody>
      </table>
    </div>
    <h2 className="mb-2 mt-6 font-bold">Recent movements</h2>
    <div className="space-y-2">{movements.map((movement: any) => <div key={movement.id} className="grid grid-cols-[1fr_auto] gap-3 rounded-xl border border-slate-800 bg-slate-900 p-3 text-sm"><div><b>{movement.stockItemName}</b> · {movement.locationName}<div className="text-xs text-slate-500">{movement.movementType} · {movement.reasonCode} · {movement.actorName}</div></div><span className={Number(movement.quantityDelta) >= 0 ? 'text-emerald-300' : 'text-rose-300'}>{Number(movement.quantityDelta) > 0 ? '+' : ''}{movement.quantityDelta} {movement.baseUnit}</span></div>)}</div>

    {modal && <ActionDialog title={{ COUNT: 'Physical count', TRANSFER: 'Transfer stock', WASTE: 'Declare waste' }[modal] || modal} onClose={() => setModal(null)}>
      <InventoryForm modal={modal} form={form} setForm={setForm} stocks={stocks} locations={locations} onResolveBarcode={resolveBarcode} onSubmit={async () => {
        if (modal === 'COUNT') await act('inventory.adjust', { stockItemId: form.stockItemId, locationId: form.locationId, countedQty: form.countedQty, reason: form.reason || 'Physical stock count' }, 'inventory.count');
        if (modal === 'WASTE') await act('inventory.waste', { stockItemId: form.stockItemId, locationId: form.locationId, quantity: form.quantity, reason: form.reason || 'Declared waste' }, 'inventory.waste');
        if (modal === 'TRANSFER') await act('inventory.transfer', { stockItemId: form.stockItemId, locationId: form.locationId, toLocationId: form.toLocationId, quantity: form.quantity, reason: form.reason || 'Internal transfer' }, 'inventory.transfer');
      }} />
    </ActionDialog>}
    {approval && <ManagerApprovalDialog permission={approval.permission} onClose={() => setApproval(null)} onApproved={approval.run} />}
  </div>;
}

const InventoryForm = ({ modal, form, setForm, stocks, locations, onResolveBarcode, onSubmit }: {
  modal: string; form: any; setForm: (next: any) => void; stocks: any[]; locations: any[];
  onResolveBarcode: (code: string) => void; onSubmit: () => Promise<void>;
}) => <div className="space-y-3">
  <label>Stock item<select className={fieldClass} value={form.stockItemId} onChange={event => setForm({ ...form, stockItemId: event.target.value })}>{stocks.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
  <label>Location<select className={fieldClass} value={form.locationId} onChange={event => setForm({ ...form, locationId: event.target.value })}>{locations.map(location => <option key={location.id} value={location.id}>{location.name}</option>)}</select></label>
  {modal === 'TRANSFER' && <label>Destination<select className={fieldClass} value={form.toLocationId} onChange={event => setForm({ ...form, toLocationId: event.target.value })}>{locations.filter(location => location.id !== form.locationId).map(location => <option key={location.id} value={location.id}>{location.name}</option>)}</select></label>}
  {modal === 'COUNT' ? <>
    <label>Counted quantity in {stocks.find(item => item.id === form.stockItemId)?.baseUnit || 'base units'}<input className={fieldClass} type="number" min="0" step="0.001" value={form.countedQty} onChange={event => setForm({ ...form, countedQty: Number(event.target.value) })} /></label>
    <div className="rounded-xl border border-slate-700 p-3"><label className="block text-sm">Scan stock barcode or SKU<input data-barcode-capture="true" className={fieldClass + ' mt-1 font-mono'} placeholder="Scan or type exact stock code" value={form.scanBarcode} onChange={event => setForm({ ...form, scanBarcode: event.target.value })} /></label><button className={buttonClass + ' mt-2'} disabled={!form.scanBarcode.trim()} onClick={() => onResolveBarcode(form.scanBarcode)}>Apply typed barcode</button><p className="mt-2 text-xs text-slate-500">Each scan adds the item's configured scan quantity in its base unit. No stock changes until you commit.</p></div>
  </> : <label>Quantity<input className={fieldClass} type="number" min="0.001" step="0.001" value={form.quantity} onChange={event => setForm({ ...form, quantity: Number(event.target.value) })} /></label>}
  {modal !== 'COUNT' && <label>Reason / note<textarea className={fieldClass} value={form.reason} onChange={event => setForm({ ...form, reason: event.target.value })} /></label>}
  <button className={primaryButtonClass} disabled={modal === 'COUNT' && (!form.stockItemId || Number(form.countedQty) < 0)} onClick={() => void onSubmit()}>Commit movement</button>
</div>;
