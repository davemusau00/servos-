import React, { useMemo, useState } from 'react';
import { ActionDialog } from './ActionDialog';
import { fieldClass, primaryButtonClass, buttonClass, money } from './records';

type Serving = { id: string; name: string; quantity: number; price: number };
type Props = {
  stocks: any[];
  products: any[];
  outlets: any[];
  variantOnly?: boolean;
  onSave: (value: any) => Promise<void>;
  onClose: () => void;
};

const packages = ['Bottle', 'Can', 'PET Bottle', 'Carton', 'Packet', 'Keg', 'Box', 'Bag', 'Piece', 'Other'];
const canonicalSize = (quantity: number, unit: string) => {
  const normalized = unit.trim().toLowerCase();
  if (['l', 'liter', 'litre', 'liters', 'litres'].includes(normalized)) return { quantity: Number((quantity * 1000).toFixed(3)), unit: 'ml' };
  return { quantity: Number(quantity.toFixed(3)), unit: normalized };
};

export function QuickProductDialog({ stocks, products, outlets, variantOnly = false, onSave, onClose }: Props) {
  const [kind, setKind] = useState('DRINK');
  const [name, setName] = useState('');
  const [price, setPrice] = useState(0);
  const [category, setCategory] = useState('Drinks');
  const [routeTo, setRouteTo] = useState('BAR');
  const [code, setCode] = useState('');
  const [codeEdited, setCodeEdited] = useState(false);
  const [barcode, setBarcode] = useState('');
  const [physical, setPhysical] = useState(variantOnly);
  const [familyId, setFamilyId] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [packageType, setPackageType] = useState('Bottle');
  const [containerQuantity, setContainerQuantity] = useState(750);
  const [containerUnit, setContainerUnit] = useState('ml');
  const [tracked, setTracked] = useState(false);
  const [stockItemId, setStockItemId] = useState('');
  const [wholeContainerQuantity, setWholeContainerQuantity] = useState(1);
  const [servings, setServings] = useState<Serving[]>([]);
  const [servingName, setServingName] = useState('Single');
  const [servingQuantity, setServingQuantity] = useState(30);
  const [servingPrice, setServingPrice] = useState(0);

  const families = useMemo(() => {
    const grouped = new Map<string, any[]>();
    for (const product of products) {
      if (!product.productFamilyId) continue;
      const rows = grouped.get(product.productFamilyId) || [];
      rows.push(product);
      grouped.set(product.productFamilyId, rows);
    }
    return [...grouped.entries()].map(([id, rows]) => ({ id, rows, name: rows[0].productFamilyName || rows[0].name }));
  }, [products]);
  const selectedFamily = families.find(family => family.id === familyId);
  const reservedStockIds = selectedFamily?.rows.map((product: any) => product.stockItemId).filter(Boolean) || [];
  const normalizedSize = canonicalSize(containerQuantity, containerUnit);
  const variantLabel = `${normalizedSize.quantity} ${normalizedSize.unit} ${packageType.toLowerCase()}`;
  const duplicateVariant = Boolean(selectedFamily?.rows.some((product: any) => String(product.variantLabel || '').toLowerCase() === variantLabel.toLowerCase()));
  const selectedStock = stocks.find(stock => stock.id === stockItemId);

  const updateName = (value: string) => {
    setName(value);
    if (!codeEdited) {
      const slug = value.normalize('NFKD').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toUpperCase().slice(0, 20);
      setCode(slug ? `${slug}-${crypto.randomUUID().slice(0, 4).toUpperCase()}` : '');
    }
  };
  const configureKind = (next: string) => {
    setKind(next);
    if (next === 'FOOD') { setCategory('Food'); setRouteTo('KITCHEN'); }
    else if (next === 'RETAIL') { setCategory('Retail'); setRouteTo('SERVICE'); }
    else if (next === 'SERVICE') { setCategory('Services'); setRouteTo('SERVICE'); }
    else { setCategory('Drinks'); setRouteTo('BAR'); }
  };
  const chooseFamily = (id: string) => {
    setFamilyId(id);
    const family = families.find(item => item.id === id);
    if (!family) return;
    const source = family.rows[0];
    const displayName = String(source.productFamilyName || source.name);
    setPhysical(true); setFamilyName(displayName); setName(displayName);
    setCategory(source.category || 'Drinks'); setRouteTo(source.routeTo || 'BAR');
    setPackageType(source.packageType || 'Bottle'); setKind(source.routeTo === 'KITCHEN' ? 'FOOD' : 'DRINK');
    if (!codeEdited) { const slug = displayName.normalize('NFKD').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toUpperCase().slice(0, 20); setCode(slug ? `${slug}-${crypto.randomUUID().slice(0, 4).toUpperCase()}` : ''); }
  };
  const addServing = () => {
    if (!servingName.trim() || !Number.isFinite(servingQuantity) || servingQuantity <= 0 || servingPrice < 0) return;
    setServings(rows => [...rows, { id: crypto.randomUUID(), name: servingName.trim(), quantity: servingQuantity, price: servingPrice }]);
    setServingName('');
  };
  const submit = () => {
    const productName = physical ? `${familyName.trim() || name.trim()} ${variantLabel}` : name.trim();
    const portions = physical ? [
      { id: crypto.randomUUID(), name: `Whole ${packageType.toLowerCase()}`, volume: Number(wholeContainerQuantity), price: Number(price) },
      ...servings.map(serving => ({ id: serving.id, name: serving.name, volume: Number(serving.quantity), price: Number(serving.price) })),
    ] : [];
    void onSave({
      id: '', name: productName, code: code.trim(), price: Number(price), category, routeTo,
      stockItemId: tracked ? stockItemId : '', outletIds: outlets.map(outlet => outlet.id),
      taxClassId: 'A_STANDARD', favorite: false, barcode: barcode.trim(),
      productFamilyId: physical ? familyId || crypto.randomUUID() : undefined,
      productFamilyName: physical ? (familyName.trim() || name.trim()) : undefined,
      packageType: physical ? packageType : undefined,
      containerQuantity: physical ? Number(containerQuantity) : undefined,
      containerUnit: physical ? containerUnit.trim() : undefined,
      variantLabel: physical ? variantLabel : undefined,
      portionVolume: physical ? Number(wholeContainerQuantity) : undefined,
      portions, modifiers: [], recipeIngredients: [],
    });
  };
  const physicalValid = !physical || (familyName.trim() && packageType.trim() && Number.isFinite(containerQuantity) && containerQuantity > 0 && containerUnit.trim() && Number.isFinite(wholeContainerQuantity) && wholeContainerQuantity > 0 && !duplicateVariant);
  const linkedStockAvailable = !tracked || (stockItemId && (!familyId || !reservedStockIds.includes(stockItemId)));

  return <ActionDialog title={variantOnly ? 'Add another size' : 'Add product or menu item'} onClose={onClose}>
    <div className="space-y-4">
      {!variantOnly && <label className="block text-sm font-semibold">What are you adding?<select className={fieldClass + ' mt-1'} value={kind} onChange={event => configureKind(event.target.value)}><option value="DRINK">Drink</option><option value="FOOD">Food / kitchen item</option><option value="RETAIL">Retail / packaged item</option><option value="SERVICE">Service</option></select></label>}
      <label className="block text-sm font-semibold">{physical ? 'Product family name' : 'Name'}<input autoFocus className={fieldClass + ' mt-1'} value={physical ? familyName : name} onChange={event => { const value = event.target.value; setFamilyName(value); updateName(value); }} placeholder={kind === 'FOOD' ? 'e.g. Chicken and chips' : 'e.g. Jameson'}/></label>
      {!physical && <label className="block text-sm font-semibold">Selling price (KES)<input className={fieldClass + ' mt-1'} type="number" min="0" step="0.01" value={price} onChange={event => setPrice(Number(event.target.value))}/></label>}
      <label className="block text-sm font-semibold">Send order to<select className={fieldClass + ' mt-1'} value={routeTo} onChange={event => setRouteTo(event.target.value)}><option value="BAR">Bar</option><option value="KITCHEN">Kitchen</option><option value="SERVICE">Service</option></select></label>
      {physical && <>
        <label className="block text-sm">Product family<select className={fieldClass + ' mt-1'} value={familyId} onChange={event => chooseFamily(event.target.value)}><option value="">{variantOnly?'Choose product family':'Create a new family'}</option>{families.map(family => <option key={family.id} value={family.id}>{family.name} · {family.rows.length} size(s)</option>)}</select></label>
        <div className="rounded-xl border border-slate-800 p-3"><h3 className="font-semibold">Physical size</h3><div className="mt-3 grid grid-cols-2 gap-2"><label className="text-sm">Container<select className={fieldClass + ' mt-1'} value={packageType} onChange={event => setPackageType(event.target.value)}>{packages.map(value => <option key={value}>{value}</option>)}</select></label><label className="text-sm">Size<input className={fieldClass + ' mt-1'} type="number" min="0.001" step="any" value={containerQuantity} onChange={event => setContainerQuantity(Number(event.target.value))}/></label><label className="text-sm">Size unit<input className={fieldClass + ' mt-1'} value={containerUnit} onChange={event => setContainerUnit(event.target.value)}/></label><label className="text-sm">Whole-container stock quantity<input className={fieldClass + ' mt-1'} type="number" min="0.000001" step="any" value={wholeContainerQuantity} onChange={event => setWholeContainerQuantity(Number(event.target.value))}/></label></div><div className="mt-3 flex flex-wrap gap-2">{[200,250,330,350,500,700,750,1000].map(size => <button type="button" key={size} className={buttonClass} onClick={() => { setContainerQuantity(size); setContainerUnit('ml'); setWholeContainerQuantity(selectedStock?.baseUnit?.toLowerCase() === 'ml' ? size : 1); }}>{size === 1000 ? '1L' : `${size}ml`}</button>)}</div><p className="mt-2 text-xs text-slate-400">The stock quantity must use the linked stock item's count unit. A 750 ml bottle tracked in ml uses 750 here; tracked as whole bottles, use 1.</p></div>
        <div className="rounded-xl border border-slate-800 p-3"><h3 className="font-semibold">How do you sell this size?</h3><label className="mt-3 block text-sm">Whole-container selling price (KES)<input className={fieldClass + ' mt-1'} type="number" min="0" step="0.01" value={price} onChange={event => setPrice(Number(event.target.value))}/></label><div className="mt-3 grid grid-cols-[1fr_1fr_1fr_auto] gap-2"><input aria-label="Serving name" className={fieldClass} value={servingName} onChange={event => setServingName(event.target.value)} placeholder="Single"/><input aria-label="Serving stock quantity" className={fieldClass} type="number" min="0.000001" step="any" value={servingQuantity} onChange={event => setServingQuantity(Number(event.target.value))}/><input aria-label="Serving price" className={fieldClass} type="number" min="0" step="0.01" value={servingPrice} onChange={event => setServingPrice(Number(event.target.value))}/><button type="button" className={buttonClass} onClick={addServing}>Add serving</button></div>{servings.length>0&&<ul className="mt-3 space-y-1 text-sm">{servings.map(serving=><li key={serving.id} className="flex justify-between"><span>{serving.name} · {serving.quantity} stock units</span><span>{money(serving.price)}</span></li>)}</ul>}<p className="mt-2 text-xs text-slate-400">Serving quantities must use the linked stock item's base unit (for example, 30 ml). Sale choices reuse the current audited portion and order-fire inventory path.</p></div>
      </>}
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={physical} disabled={variantOnly} onChange={event => setPhysical(event.target.checked)}/>This item has physical package sizes</label>
      <details className="rounded-xl border border-slate-800 p-3"><summary className="cursor-pointer text-sm font-semibold">More setup</summary><div className="mt-3 space-y-3"><label className="block text-sm">Category<input className={fieldClass + ' mt-1'} value={category} onChange={event => setCategory(event.target.value)}/></label><label className="block text-sm">Item code (generated; editable)<input className={fieldClass + ' mt-1 font-mono'} value={code} onChange={event => { setCode(event.target.value); setCodeEdited(true); }}/></label><label className="block text-sm">Variant barcode<input className={fieldClass + ' mt-1 font-mono'} value={barcode} onChange={event => setBarcode(event.target.value)} placeholder="Scan or enter this size's barcode"/></label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={tracked} onChange={event => setTracked(event.target.checked)}/>Track sales against an existing stock item</label>{tracked&&<select aria-label="Stock item" className={fieldClass} value={stockItemId} onChange={event => { setStockItemId(event.target.value); const stock = stocks.find(item => item.id === event.target.value); if (stock?.baseUnit?.toLowerCase() === 'ml') setWholeContainerQuantity(Number(containerQuantity)); else setWholeContainerQuantity(1); }}><option value="">Choose stock item</option>{stocks.map(stock => <option key={stock.id} value={stock.id} disabled={Boolean(familyId && reservedStockIds.includes(stock.id) && stock.id !== stockItemId)}>{stock.name} · {stock.baseUnit}</option>)}</select>}{physical&&familyId&&<p className="text-xs text-slate-400">Each size is a separate sellable product. Choose a different stock item for each size so inventory stays separate.</p>}</div></details>
      {duplicateVariant&&<p role="alert" className="text-sm text-rose-200">This family already has a {variantLabel} variant.</p>}
      {physical&&tracked&&selectedStock&&servings.length>0&&selectedStock.baseUnit?.toLowerCase()!=='ml'&&<p role="alert" className="text-sm text-amber-200">This stock item is counted in {selectedStock.baseUnit}. Use a stock item counted in ml for measured serving quantities.</p>}
      <button className={primaryButtonClass + ' w-full'} disabled={!name.trim()||!code.trim()||price<0||outlets.length===0||!physicalValid||!linkedStockAvailable||(variantOnly&&!familyId)||(tracked&&!stockItemId)||(physical&&tracked&&servings.length>0&&selectedStock?.baseUnit?.toLowerCase()!=='ml')} onClick={submit}>{physical?'Add size':'Add item'}</button>
      {outlets.length===0&&<p role="status" className="text-sm text-amber-200">Add a service area in setup before creating sellable items.</p>}
    </div>
  </ActionDialog>;
}
