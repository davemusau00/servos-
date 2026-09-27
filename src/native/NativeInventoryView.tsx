import React, { useMemo, useState } from 'react';
import { AlertTriangle, ArrowRightLeft, Boxes, PackageCheck, Search, Trash2 } from 'lucide-react';
import { useRuntime } from '../runtime/RuntimeProvider';
import type { Permission } from '../types/runtime';
import { barcodeEquals, useBarcodeScanner } from '../hooks/useBarcodeScanner';
import { recordsOf, fieldClass, buttonClass, primaryButtonClass, money, shortDate } from './records';
import { ManagerApprovalDialog } from './ManagerApprovalDialog';
import { ActionDialog } from './ActionDialog';

type StockStatus = 'ALL' | 'LOW' | 'OUT' | 'HEALTHY';

const totalStock = (stock: any) =>
  Object.values(stock.currentStock || {}).reduce((sum: number, value) => sum + Number(value || 0), 0);

const statusOf = (stock: any): Exclude<StockStatus, 'ALL'> => {
  const quantity = totalStock(stock);
  const reorder = Number(stock.reorderLevel || 0);
  if (quantity <= 0) return 'OUT';
  if (reorder > 0 && quantity <= reorder) return 'LOW';
  return 'HEALTHY';
};

const statusClass = (status: Exclude<StockStatus, 'ALL'>) =>
  status === 'OUT'
    ? 'border-rose-500/30 bg-rose-500/10 text-rose-200'
    : status === 'LOW'
      ? 'border-amber-500/30 bg-amber-500/10 text-amber-200'
      : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200';

export function NativeInventoryView() {
  const runtime = useRuntime();
  const snapshot = runtime.snapshot!;
  const stocks = recordsOf(snapshot, 'stockItems');
  const locations = recordsOf(snapshot, 'stockLocations');
  const movements = recordsOf(snapshot, 'stockMovements').slice().reverse();
  const [modal, setModal] = useState<string | null>(null);
  const [approval, setApproval] = useState<{ permission: Permission; run: (token: string) => Promise<void> } | null>(null);
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StockStatus>('ALL');
  const [locationFilter, setLocationFilter] = useState('ALL');
  const [selectedStockId, setSelectedStockId] = useState(stocks[0]?.id || '');
  const permissions = snapshot.actor.permissions;
  const [form, setForm] = useState({
    stockItemId: stocks[0]?.id || '', locationId: locations[0]?.id || '', toLocationId: locations[1]?.id || '',
    quantity: 1, countedQty: 0, reason: '', scanBarcode: '',
  });

  const rows = useMemo(() => stocks.map((stock: any) => {
    const total = totalStock(stock);
    const reorder = Number(stock.reorderLevel || 0);
    const unitCost = Number(stock.averageUnitCost || 0);
    const locationQty = locationFilter === 'ALL' ? total : Number(stock.currentStock?.[locationFilter] || 0);
    return { stock, total, locationQty, reorder, value: total * unitCost, status: statusOf(stock) };
  }), [stocks, locationFilter]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter(row => {
      const matchesSearch = !q || [row.stock.name, row.stock.code, row.stock.barcode, row.stock.baseUnit]
        .some(value => String(value || '').toLowerCase().includes(q));
      const matchesStatus = statusFilter === 'ALL' || row.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [rows, search, statusFilter]);

  const selected = stocks.find((stock: any) => stock.id === selectedStockId) || filtered[0]?.stock || stocks[0];
  const selectedMovements = selected ? movements.filter((movement: any) => movement.stockItemId === selected.id).slice(0, 12) : [];
  const stockValue = rows.reduce((sum, row) => sum + row.value, 0);
  const lowCount = rows.filter(row => row.status === 'LOW').length;
  const outCount = rows.filter(row => row.status === 'OUT').length;

  const act = async (operation: string, payload: Record<string, unknown>, permission: Permission) => {
    const execute = async (token?: string) => {
      await runtime.command(operation, { ...payload, approvalToken: token });
      setModal(null);
      setNotice('Inventory movement committed.');
    };
    if (permissions.includes(permission)) await execute();
    else setApproval({ permission, run: async token => execute(token) });
  };

  const openMovement = (kind: 'COUNT' | 'TRANSFER' | 'WASTE', stockId?: string, locationId?: string) => {
    const targetId = stockId || selected?.id || stocks[0]?.id || '';
    const sourceLocation = locationId || form.locationId || locations[0]?.id || '';
    const destination = locations.find((location: any) => location.id !== sourceLocation)?.id || '';
    setNotice('');
    setForm(previous => ({ ...previous, stockItemId: targetId, locationId: sourceLocation, toLocationId: destination, countedQty: 0, quantity: 1, reason: '', scanBarcode: '' }));
    setModal(kind);
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
    setForm(previous => ({ ...previous, stockItemId: item.id, countedQty: Number(previous.stockItemId === item.id ? previous.countedQty : 0) + increment, scanBarcode: '' }));
    setSelectedStockId(item.id);
    setNotice(`Count draft: +${increment.toLocaleString()} ${item.baseUnit} for ${item.name}. Nothing changes until you commit.`);
  };

  useBarcodeScanner({ enabled: modal === 'COUNT', onScan: resolveBarcode });

  return <div className="h-full overflow-auto bg-slate-950 p-5 text-white">
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <div className="mb-1 text-[11px] font-black uppercase tracking-[0.22em] text-amber-400">Stock control</div>
        <h1 className="text-2xl font-bold">Inventory</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-400">One location-driven stock truth. Count, transfer and waste actions post through the native ledger. Supplier receipts are posted through Procurement so stock, GRN, payable and journal remain one atomic chain.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button className={primaryButtonClass} onClick={() => openMovement('COUNT')}>Count stock</button>
        <button className={buttonClass} onClick={() => openMovement('TRANSFER')}>Transfer</button>
        <button className={buttonClass} onClick={() => openMovement('WASTE')}>Record waste</button>
      </div>
    </div>

    {notice && <p role="status" className="mb-4 rounded-xl border border-slate-800 bg-slate-900 p-3 text-sm text-slate-300">{notice}</p>}

    <section className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Metric label="Stock masters" value={String(stocks.length)} hint={`${locations.length} stock location${locations.length === 1 ? '' : 's'}`} icon={<Boxes className="h-4 w-4"/>}/>
      <Metric label="Stock value" value={money(stockValue)} hint="Current quantity × average unit cost" icon={<PackageCheck className="h-4 w-4"/>}/>
      <Metric label="Low stock" value={String(lowCount)} hint="At or below configured reorder level" tone={lowCount ? 'amber' : 'normal'} icon={<AlertTriangle className="h-4 w-4"/>}/>
      <Metric label="Out of stock" value={String(outCount)} hint="Zero or below across all locations" tone={outCount ? 'rose' : 'normal'} icon={<Trash2 className="h-4 w-4"/>}/>
    </section>

    <section className="mb-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
      <div className="grid gap-2 md:grid-cols-[minmax(240px,1fr)_180px_220px]">
        <label className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-500"/><input className={fieldClass + ' pl-9'} value={search} onChange={event => setSearch(event.target.value)} placeholder="Search stock name, SKU or barcode"/></label>
        <select className={fieldClass} value={statusFilter} onChange={event => setStatusFilter(event.target.value as StockStatus)}><option value="ALL">All stock states</option><option value="LOW">Low stock</option><option value="OUT">Out of stock</option><option value="HEALTHY">Healthy</option></select>
        <select className={fieldClass} value={locationFilter} onChange={event => setLocationFilter(event.target.value)}><option value="ALL">All locations / total</option>{locations.map((location: any) => <option key={location.id} value={location.id}>{location.name}</option>)}</select>
      </div>
    </section>

    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/30">
        <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-slate-900 text-xs uppercase tracking-wide text-slate-500"><tr><th className="p-3">Stock item</th><th className="p-3">Status</th><th className="p-3 text-right">{locationFilter === 'ALL' ? 'Total on hand' : 'At location'}</th><th className="p-3 text-right">Reorder at</th><th className="p-3 text-right">Avg cost</th><th className="p-3 text-right">Stock value</th></tr></thead>
          <tbody>{filtered.map(row => <tr key={row.stock.id} onClick={() => setSelectedStockId(row.stock.id)} className={`cursor-pointer border-t border-slate-800 transition hover:bg-slate-900 ${selected?.id === row.stock.id ? 'bg-amber-400/5' : ''}`}><td className="p-3"><div className="font-semibold">{row.stock.name}</div><div className="mt-0.5 font-mono text-[11px] text-slate-500">{row.stock.code || 'No SKU'}{row.stock.barcode ? ` · ${row.stock.barcode}` : ''}</div></td><td className="p-3"><span className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-black ${statusClass(row.status)}`}>{row.status}</span></td><td className="p-3 text-right font-mono font-semibold">{row.locationQty.toLocaleString()} <span className="font-sans text-xs text-slate-500">{row.stock.baseUnit}</span></td><td className="p-3 text-right font-mono">{row.reorder > 0 ? `${row.reorder.toLocaleString()} ${row.stock.baseUnit}` : '—'}</td><td className="p-3 text-right">{money(row.stock.averageUnitCost)}</td><td className="p-3 text-right font-semibold">{money(row.value)}</td></tr>)}</tbody>
        </table></div>
        {filtered.length === 0 && <div className="p-8 text-center text-sm text-slate-500">No stock items match the current filters.</div>}
      </section>

      <aside className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
        {!selected ? <p className="text-sm text-slate-500">Select a stock item to inspect quantities and movements.</p> : <>
          <div className="flex items-start justify-between gap-3"><div><div className="text-xs uppercase tracking-wide text-slate-500">Selected stock</div><h2 className="mt-1 text-lg font-bold">{selected.name}</h2><div className="font-mono text-xs text-slate-500">{selected.code}</div></div><span className={`rounded-full border px-2 py-1 text-[10px] font-black ${statusClass(statusOf(selected))}`}>{statusOf(selected)}</span></div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm"><SmallFact label="Total on hand" value={`${totalStock(selected).toLocaleString()} ${selected.baseUnit}`}/><SmallFact label="Reorder level" value={Number(selected.reorderLevel || 0) > 0 ? `${Number(selected.reorderLevel).toLocaleString()} ${selected.baseUnit}` : 'Not set'}/><SmallFact label="Avg unit cost" value={money(selected.averageUnitCost)}/><SmallFact label="Scan quantity" value={`${Number(selected.scanUnitQuantity || 1).toLocaleString()} ${selected.baseUnit}`}/></div>
          <div className="mt-4"><div className="mb-2 text-xs font-black uppercase tracking-wide text-slate-500">By location</div><div className="space-y-2">{locations.map((location: any) => { const qty = Number(selected.currentStock?.[location.id] || 0); return <button key={location.id} onClick={() => openMovement('COUNT', selected.id, location.id)} className="flex w-full items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-3 text-left hover:border-slate-700"><span><b className="text-sm">{location.name}</b><span className="block text-[11px] text-slate-500">Click to count this location</span></span><span className="font-mono text-sm">{qty.toLocaleString()} {selected.baseUnit}</span></button>; })}</div></div>
          <div className="mt-4 grid grid-cols-3 gap-2"><button className={buttonClass} onClick={() => openMovement('COUNT', selected.id)}>Count</button><button className={buttonClass} onClick={() => openMovement('TRANSFER', selected.id)}><ArrowRightLeft className="mr-1 inline h-3.5 w-3.5"/>Move</button><button className={buttonClass} onClick={() => openMovement('WASTE', selected.id)}>Waste</button></div>
          <div className="mt-5"><div className="mb-2 text-xs font-black uppercase tracking-wide text-slate-500">Recent movement history</div><div className="max-h-72 space-y-2 overflow-auto">{selectedMovements.map((movement: any) => <div key={movement.id} className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs"><div className="flex justify-between gap-3"><b>{movement.locationName || 'Stock location'}</b><span className={Number(movement.quantityDelta) >= 0 ? 'text-emerald-300' : 'text-rose-300'}>{Number(movement.quantityDelta) > 0 ? '+' : ''}{Number(movement.quantityDelta).toLocaleString()} {movement.baseUnit}</span></div><div className="mt-1 text-slate-500">{movement.movementType} · {movement.reasonCode || movement.reason || 'Movement'}</div><div className="mt-1 text-slate-600">{shortDate(movement.occurredAt || movement.createdAt)}{movement.actorName ? ` · ${movement.actorName}` : ''}</div></div>)}{selectedMovements.length === 0 && <p className="text-xs text-slate-500">No movement history for this stock item yet.</p>}</div></div>
        </>}
      </aside>
    </div>

    {modal && <ActionDialog title={{ COUNT: 'Physical stock count', TRANSFER: 'Transfer stock', WASTE: 'Record waste' }[modal] || modal} onClose={() => setModal(null)}><InventoryForm modal={modal} form={form} setForm={setForm} stocks={stocks} locations={locations} onResolveBarcode={resolveBarcode} onSubmit={async () => {
      if (modal === 'COUNT') await act('inventory.adjust', { stockItemId: form.stockItemId, locationId: form.locationId, countedQty: form.countedQty, reason: form.reason || 'Physical stock count' }, 'inventory.count');
      if (modal === 'WASTE') await act('inventory.waste', { stockItemId: form.stockItemId, locationId: form.locationId, quantity: form.quantity, reason: form.reason || 'Declared waste' }, 'inventory.waste');
      if (modal === 'TRANSFER') await act('inventory.transfer', { stockItemId: form.stockItemId, locationId: form.locationId, toLocationId: form.toLocationId, quantity: form.quantity, reason: form.reason || 'Internal transfer' }, 'inventory.transfer');
    }} /></ActionDialog>}
    {approval && <ManagerApprovalDialog permission={approval.permission} onClose={() => setApproval(null)} onApproved={approval.run} />}
  </div>;
}

const Metric = ({ label, value, hint, icon, tone = 'normal' }: { label: string; value: string; hint: string; icon: React.ReactNode; tone?: 'normal' | 'amber' | 'rose' }) =>
  <div className={`rounded-2xl border p-4 ${tone === 'rose' ? 'border-rose-500/25 bg-rose-500/5' : tone === 'amber' ? 'border-amber-500/25 bg-amber-500/5' : 'border-slate-800 bg-slate-900'}`}><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{icon}{label}</div><div className="mt-2 text-2xl font-black">{value}</div><div className="mt-1 text-[11px] text-slate-500">{hint}</div></div>;

const SmallFact = ({ label, value }: { label: string; value: string }) =>
  <div className="rounded-xl bg-slate-950 p-3"><div className="text-[10px] uppercase tracking-wide text-slate-600">{label}</div><div className="mt-1 font-semibold">{value}</div></div>;

const InventoryForm = ({ modal, form, setForm, stocks, locations, onResolveBarcode, onSubmit }: {
  modal: string; form: any; setForm: (next: any) => void; stocks: any[]; locations: any[];
  onResolveBarcode: (code: string) => void; onSubmit: () => Promise<void>;
}) => {
  const selected = stocks.find(item => item.id === form.stockItemId);
  const expected = Number(selected?.currentStock?.[form.locationId] || 0);
  const variance = Number(form.countedQty || 0) - expected;
  return <div className="space-y-3">
    <label className="block text-sm">Stock item<select className={fieldClass + ' mt-1'} value={form.stockItemId} onChange={event => setForm({ ...form, stockItemId: event.target.value, countedQty: 0 })}>{stocks.map(item => <option key={item.id} value={item.id}>{item.name} · {item.code}</option>)}</select></label>
    <label className="block text-sm">Location<select className={fieldClass + ' mt-1'} value={form.locationId} onChange={event => setForm({ ...form, locationId: event.target.value, countedQty: 0, toLocationId: locations.find(location => location.id !== event.target.value)?.id || '' })}>{locations.map(location => <option key={location.id} value={location.id}>{location.name}</option>)}</select></label>
    {modal === 'TRANSFER' && <label className="block text-sm">Destination<select className={fieldClass + ' mt-1'} value={form.toLocationId} onChange={event => setForm({ ...form, toLocationId: event.target.value })}>{locations.filter(location => location.id !== form.locationId).map(location => <option key={location.id} value={location.id}>{location.name}</option>)}</select></label>}
    {modal === 'COUNT' ? <>
      <div className="grid grid-cols-2 gap-2"><SmallFact label="Expected" value={`${expected.toLocaleString()} ${selected?.baseUnit || ''}`}/><SmallFact label="Draft variance" value={`${variance > 0 ? '+' : ''}${variance.toLocaleString()} ${selected?.baseUnit || ''}`}/></div>
      <label className="block text-sm">Physical quantity counted in {selected?.baseUnit || 'base units'}<input className={fieldClass + ' mt-1'} type="number" min="0" step="0.001" value={form.countedQty} onChange={event => setForm({ ...form, countedQty: Number(event.target.value) })} /></label>
      <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-3"><label className="block text-sm">Scan stock barcode or SKU<input data-barcode-capture="true" className={fieldClass + ' mt-1 font-mono'} placeholder="Scan or type exact stock code" value={form.scanBarcode} onChange={event => setForm({ ...form, scanBarcode: event.target.value })} /></label><button className={buttonClass + ' mt-2'} disabled={!form.scanBarcode.trim()} onClick={() => onResolveBarcode(form.scanBarcode)}>Apply typed barcode</button><p className="mt-2 text-xs text-slate-500">One scan adds {Number(selected?.scanUnitQuantity || 1).toLocaleString()} {selected?.baseUnit || 'base units'}. Scanning only changes this draft.</p></div>
      <label className="block text-sm">Count note / reason<textarea className={fieldClass + ' mt-1'} value={form.reason} onChange={event => setForm({ ...form, reason: event.target.value })} placeholder="e.g. Weekly Sunday stocktake" /></label>
    </> : <><label className="block text-sm">Quantity in {selected?.baseUnit || 'base units'}<input className={fieldClass + ' mt-1'} type="number" min="0.001" step="0.001" value={form.quantity} onChange={event => setForm({ ...form, quantity: Number(event.target.value) })} /></label><label className="block text-sm">Reason / note<textarea className={fieldClass + ' mt-1'} value={form.reason} onChange={event => setForm({ ...form, reason: event.target.value })} /></label></>}
    <button className={primaryButtonClass} disabled={!form.stockItemId || !form.locationId || (modal === 'COUNT' ? Number(form.countedQty) < 0 : Number(form.quantity) <= 0) || (modal === 'TRANSFER' && !form.toLocationId)} onClick={() => void onSubmit()}>{modal === 'COUNT' ? 'Commit physical count' : modal === 'TRANSFER' ? 'Commit transfer' : 'Commit waste'}</button>
  </div>;
};
