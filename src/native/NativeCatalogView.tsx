import React, { useState } from 'react';
import { parseCatalogCsv } from './csvImport';
import { useRuntime } from '../runtime/RuntimeProvider';
import { recordsOf, recordOf, fieldClass, buttonClass, primaryButtonClass, money } from './records';
import { ActionDialog } from './ActionDialog';

export function NativeCatalogView(){
  const runtime=useRuntime(); const s=runtime.snapshot!; const products=recordsOf(s,'products'); const stocks=recordsOf(s,'stockItems'); const outlets=recordsOf(s,'outlets'); const rules=recordsOf(s,'priceRules'); const suppliers=recordsOf(s,'suppliers'); const locations=recordsOf(s,'stockLocations');
  const canManage=s.actor.permissions.includes('catalog.manage'); const canPrice=s.actor.permissions.includes('pricing.manage'); const canImport=canManage&&s.actor.permissions.includes('inventory.adjust');
  const [modal,setModal]=useState<string|null>(null); const [edit,setEdit]=useState<any>(null); const [notice,setNotice]=useState('');
  const save=async(collection:string,data:any)=>{const id=data.id||crypto.randomUUID();const rec=recordOf(s,collection,id);setNotice('');try{await runtime.command('record.save',{collection,id,data:{...data,id}},rec?.version);setModal(null);setEdit(null)}catch(error){setNotice(String(error))}};
  const importCsv=async({rows,outletId,locationId,mode,supplierId,reference}:{rows:any[];outletId:string;locationId:string;mode:string;supplierId?:string;reference?:string})=>{
    const key=(value:any)=>String(value||'').trim().toLowerCase();
    if(!['MASTER_ONLY','OPENING_BALANCE','RECEIPT'].includes(mode))throw new Error('Unsupported CSV import mode.');
    if(mode==='OPENING_BALANCE'&&s.installationStage==='LIVE')throw new Error('Opening balances are not allowed after Go Live.');
    if(mode==='RECEIPT'&&s.installationStage!=='LIVE')throw new Error('Use opening-balance mode before Go Live.');
    if(mode!=='MASTER_ONLY'&&!locationId)throw new Error('Choose a stock location.');
    if(mode==='RECEIPT'&&!String(reference||'').trim())throw new Error('Receipt / invoice reference is required.');

    for(const row of rows){
      const stockMatch=stocks.find(x=>key(x.code)===key(row.sku));
      const productMatch=products.find(x=>key(x.code)===key(row.sku));
      if(row.barcode){
        const stockConflict=stocks.find(x=>key(x.barcode)===key(row.barcode)&&x.id!==stockMatch?.id);
        const productConflict=products.find(x=>key(x.barcode)===key(row.barcode)&&x.id!==productMatch?.id);
        if(stockConflict)throw new Error(`Row ${row.rowNumber}: barcode ${row.barcode} already belongs to stock item ${stockConflict.name}.`);
        if(productConflict)throw new Error(`Row ${row.rowNumber}: barcode ${row.barcode} already belongs to product ${productConflict.name}.`);
      }
      if(row.createProduct&&!outletId)throw new Error(`Row ${row.rowNumber}: choose a service area before importing sellables.`);
      if(mode==='RECEIPT'&&row.quantity>0&&row.costPrice===undefined)throw new Error(`Row ${row.rowNumber}: cost_price is required for received stock.`);
    }

    let stockCount=0,productCount=0,movementCount=0;
    for(const row of rows){
      const existingStock=stocks.find(x=>key(x.code)===key(row.sku));
      const stockId=existingStock?.id||crypto.randomUUID();
      const stockRecord=existingStock?recordOf(s,'stockItems',stockId):undefined;
      const stockData={
        ...(existingStock||{}),
        id:stockId,
        name:row.name,
        code:row.sku,
        baseUnit:row.baseUnit,
        scanUnitQuantity:row.scanUnitQuantity,
        currentStock:existingStock?.currentStock||{},
        averageUnitCost:mode==='RECEIPT'&&existingStock?Number(existingStock.averageUnitCost||0):Number(row.costPrice??existingStock?.averageUnitCost??0),
        ...(row.barcode?{barcode:row.barcode}:{})
      };
      await runtime.command('record.save',{collection:'stockItems',id:stockId,data:stockData},stockRecord?.version);
      stockCount++;

      if(row.createProduct){
        const existingProduct=products.find(x=>key(x.code)===key(row.sku));
        const productId=existingProduct?.id||crypto.randomUUID();
        const productRecord=existingProduct?recordOf(s,'products',productId):undefined;
        const outletIds=Array.from(new Set([...(existingProduct?.outletIds||[]),outletId].filter(Boolean)));
        const productData={
          ...(existingProduct||{}),
          id:productId,
          name:row.name,
          code:row.sku,
          price:Number(row.salePrice),
          costPrice:row.costPrice===undefined?existingProduct?.costPrice:Number(row.costPrice),
          category:row.category,
          routeTo:row.routeTo,
          taxClassId:row.taxClassId,
          stockItemId:stockId,
          outletIds,
          portionVolume:Number(row.portionVolume||1),
          favorite:existingProduct?.favorite||false,
          portions:existingProduct?.portions||[],
          modifiers:existingProduct?.modifiers||[],
          recipeIngredients:existingProduct?.recipeIngredients||[],
          ...(row.barcode?{barcode:row.barcode}:{})
        };
        await runtime.command('record.save',{collection:'products',id:productId,data:productData},productRecord?.version);
        productCount++;
      }

      if(mode==='OPENING_BALANCE'&&Number(row.quantity)>0){
        await runtime.command('inventory.openingBalance',{stockItemId:stockId,locationId,quantity:Number(row.quantity),reason:String(reference||'CSV opening balance import')});
        movementCount++;
      }
      if(mode==='RECEIPT'&&Number(row.quantity)>0){
        await runtime.command('inventory.receive',{stockItemId:stockId,locationId,quantity:Number(row.quantity),unitCost:Number(row.costPrice),supplierId,reference:String(reference),invoiceReference:String(reference)});
        movementCount++;
      }
    }
    setNotice(`CSV import complete: ${stockCount} stock master(s), ${productCount} sellable product(s), ${movementCount} inventory movement(s).`);
  };
  return <div className="h-full overflow-auto bg-slate-950 p-5 text-white"><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-bold">Catalog & Pricing</h1><p className="text-sm text-slate-400">Durable sellables, stock links, portions, modifiers, recipes and promotions.</p></div><div className="flex flex-wrap gap-2">{canManage&&<><button className={primaryButtonClass} onClick={()=>{setEdit(null);setModal('PRODUCT')}}>New product</button><button className={buttonClass} onClick={()=>{setEdit(null);setModal('STOCK')}}>Stock master</button><button className={buttonClass} onClick={()=>{setEdit(null);setModal('SUPPLIER')}}>Supplier</button></>}{canImport&&<button className={buttonClass} onClick={()=>{setEdit(null);setModal('IMPORT')}}>Import CSV</button>}{canPrice&&<button className={buttonClass} onClick={()=>{setEdit(null);setModal('RULE')}}>Price rule</button>}</div></div>
  {notice&&<p role="alert" className="mb-3 rounded-lg bg-rose-950 p-3 text-sm text-rose-200">{notice}</p>}
  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{products.map(p=><button key={p.id} onClick={()=>canManage&&(setEdit(p),setModal('PRODUCT'))} className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-left"><div className="text-xs text-slate-500">{p.code} Â· {p.category} Â· â†’ {p.routeTo}</div><div className="mt-1 flex justify-between gap-3"><b>{p.name}</b><span className="text-amber-300">{money(p.price)}</span></div><div className="mt-2 text-xs text-slate-400">{p.portions?.length||0} portions Â· {p.modifiers?.length||0} modifiers Â· {p.recipeIngredients?.length||0} recipe lines {p.favorite?'Â· â˜… favorite':''}</div></button>)}</div>
  <h2 className="mb-2 mt-7 font-bold">Price rules</h2><div className="grid gap-2 md:grid-cols-2">{rules.map(r=><button key={r.id} onClick={()=>canPrice&&(setEdit(r),setModal('RULE'))} className="rounded-xl border border-slate-800 bg-slate-900 p-3 text-left"><div className="flex justify-between"><b>{r.name}</b><span>{r.active===false?'Off':'Active'}</span></div><div className="text-xs text-slate-500">{r.type} {r.value} Â· {r.scopeType||'ALL'} Â· {r.startTime||'all day'}â€“{r.endTime||'all day'}</div></button>)}</div>
  {modal==='IMPORT'&&<CsvImportDialog snapshot={s} products={products} stocks={stocks} outlets={outlets} locations={locations} suppliers={suppliers} onClose={()=>setModal(null)} onImport={importCsv}/>} 
  {modal==='PRODUCT'&&<ProductDialog existing={edit} stocks={stocks} outlets={outlets} onClose={()=>setModal(null)} onSave={v=>save('products',v)}/>} 
  {modal==='STOCK'&&<StockDialog existing={edit} onClose={()=>setModal(null)} onSave={v=>save('stockItems',v)}/>} 
  {modal==='SUPPLIER'&&<SupplierDialog existing={edit} suppliers={suppliers} onClose={()=>setModal(null)} onSave={v=>save('suppliers',v)}/>} 
  {modal==='RULE'&&<RuleDialog existing={edit} products={products} onClose={()=>setModal(null)} onSave={v=>save('priceRules',v)}/>} 
  </div>;
}

const CsvImportDialog=({snapshot,products,stocks,outlets,locations,suppliers,onImport,onClose}:{snapshot:any;products:any[];stocks:any[];outlets:any[];locations:any[];suppliers:any[];onImport:(v:any)=>Promise<void>;onClose:()=>void})=>{
  const [parsed,setParsed]=useState<any>({rows:[],errors:[]});
  const [fileName,setFileName]=useState('');
  const [outletId,setOutletId]=useState(outlets[0]?.id||'');
  const [locationId,setLocationId]=useState(locations[0]?.id||'');
  const [mode,setMode]=useState('MASTER_ONLY');
  const [supplierId,setSupplierId]=useState('');
  const [reference,setReference]=useState('');
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  const stage=snapshot.installationStage;
  const load=async(file?:File)=>{
    if(!file)return;
    setFileName(file.name);setError('');
    try{setParsed(parseCatalogCsv(await file.text()))}catch(e){setParsed({rows:[],errors:[String(e)]})}
  };
  const submit=async()=>{
    setError('');
    if(!parsed.rows.length||parsed.errors.length)return;
    if(parsed.rows.some((r:any)=>r.createProduct)&&!outletId){setError('Choose the service area for imported sellables.');return;}
    if(mode!=='MASTER_ONLY'&&!locationId){setError('Choose the stock location for imported quantities.');return;}
    if(mode==='RECEIPT'&&!reference.trim()){setError('A receipt/invoice reference is required for live stock receipts.');return;}
    if(mode==='RECEIPT'&&parsed.rows.some((r:any)=>r.quantity>0&&r.costPrice===undefined)){setError('Every row with received quantity needs cost_price in receipt mode.');return;}
    setBusy(true);
    try{await onImport({rows:parsed.rows,outletId,locationId,mode,supplierId:supplierId||undefined,reference:reference.trim()});onClose()}
    catch(e){setError(String(e))}
    finally{setBusy(false)}
  };
  return <ActionDialog title="Import products & inventory CSV" onClose={onClose}><div className="space-y-4">
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3 text-sm text-slate-300">
      Required columns: <b>sku</b> and <b>name</b>. Supported: barcode, category, sale_price, cost_price, quantity, base_unit, scan_unit_quantity, route_to, tax_class_id, create_product, portion_volume and notes.
    </div>
    <label className="block text-sm">CSV file<input className={fieldClass+' mt-1'} type="file" accept=".csv,text/csv" onChange={e=>void load(e.target.files?.[0])}/></label>
    {fileName&&<p className="text-xs text-slate-500">{fileName} Â· {parsed.rows.length} parsed row(s)</p>}
    <div className="grid gap-2 sm:grid-cols-2">
      <label className="text-sm">Service area<select className={fieldClass+' mt-1'} value={outletId} onChange={e=>setOutletId(e.target.value)}>{outlets.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}</select></label>
      <label className="text-sm">Import mode<select className={fieldClass+' mt-1'} value={mode} onChange={e=>setMode(e.target.value)}><option value="MASTER_ONLY">Products / stock master only</option>{stage!=='LIVE'&&<option value="OPENING_BALANCE">Create/update + set opening quantities</option>}{stage==='LIVE'&&<option value="RECEIPT">Create/update + receive stock</option>}</select></label>
      {mode!=='MASTER_ONLY'&&<label className="text-sm">Stock location<select className={fieldClass+' mt-1'} value={locationId} onChange={e=>setLocationId(e.target.value)}>{locations.map(l=><option key={l.id} value={l.id}>{l.name}</option>)}</select></label>}
      {mode==='RECEIPT'&&<label className="text-sm">Supplier (optional)<select className={fieldClass+' mt-1'} value={supplierId} onChange={e=>setSupplierId(e.target.value)}><option value="">No supplier link</option>{suppliers.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>}
    </div>
    {mode!=='MASTER_ONLY'&&<label className="block text-sm">{mode==='RECEIPT'?'Receipt / invoice reference':'Opening balance note'}<input className={fieldClass+' mt-1'} value={reference} onChange={e=>setReference(e.target.value)} placeholder={mode==='RECEIPT'?'e.g. INV-20175 / supplier receipt batch':'e.g. Initial stock count'}/></label>}
    {parsed.errors.length>0&&<div className="rounded-xl border border-rose-800 bg-rose-950/30 p-3 text-sm text-rose-200">{parsed.errors.slice(0,8).map((x:string)=><div key={x}>{x}</div>)}{parsed.errors.length>8&&<div>+ {parsed.errors.length-8} more error(s)</div>}</div>}
    {parsed.rows.length>0&&<div className="max-h-64 overflow-auto rounded-xl border border-slate-800"><table className="w-full min-w-[760px] text-left text-xs"><thead className="sticky top-0 bg-slate-900 text-slate-400"><tr><th className="p-2">SKU</th><th className="p-2">Name</th><th className="p-2">Qty</th><th className="p-2">Cost</th><th className="p-2">Sale</th><th className="p-2">Sellable?</th><th className="p-2">Barcode</th></tr></thead><tbody>{parsed.rows.slice(0,20).map((r:any)=><tr key={r.sku} className="border-t border-slate-800"><td className="p-2 font-mono">{r.sku}</td><td className="p-2">{r.name}</td><td className="p-2">{r.quantity} {r.baseUnit}</td><td className="p-2">{r.costPrice===undefined?'â€”':money(r.costPrice)}</td><td className="p-2">{r.salePrice===undefined?'â€”':money(r.salePrice)}</td><td className="p-2">{r.createProduct?'Yes':'Stock only'}</td><td className="p-2 font-mono">{r.barcode||'â€”'}</td></tr>)}</tbody></table></div>}
    <p className="text-xs text-slate-500">Existing records are matched by SKU/code. Backend uniqueness rules still protect duplicate codes and barcodes. In live receipt mode, stock movements go through the normal immutable inventory receipt command.</p>
    {(error||parsed.errors.length>0)&&error&&<p role="alert" className="text-sm text-rose-300">{error}</p>}
    <button className={primaryButtonClass} disabled={busy||!parsed.rows.length||parsed.errors.length>0} onClick={()=>void submit()}>{busy?'Importingâ€¦':`Import ${parsed.rows.length||''} row${parsed.rows.length===1?'':'s'}`}</button>
  </div></ActionDialog>
};
const ProductDialog=({existing,stocks,outlets,onSave,onClose}:{existing:any;stocks:any[];outlets:any[];onSave:(v:any)=>Promise<void>;onClose:()=>void})=>{const [v,setV]=useState(existing||{id:'',name:'',code:'',price:0,category:'SPIRITS',routeTo:'BAR',stockItemId:stocks[0]?.id||'',outletIds:outlets.map(o=>o.id),taxClassId:'A_STANDARD',favorite:false,barcode:'',portions:[],modifiers:[],recipeIngredients:[]});const [portion,setPortion]=useState({name:'Single',volume:30,price:0});const [modifier,setModifier]=useState({name:'Mixer',priceDelta:0,stockItemId:'',quantityDelta:0});const [ingredient,setIngredient]=useState({stockItemId:stocks[0]?.id||'',quantity:1});return <ActionDialog title={existing?'Edit product':'New product'} onClose={onClose}><div className="space-y-3"><div className="grid grid-cols-2 gap-2"><input className={fieldClass} placeholder="Name" value={v.name} onChange={e=>setV({...v,name:e.target.value})}/><input className={fieldClass} placeholder="SKU / code" value={v.code} onChange={e=>setV({...v,code:e.target.value})}/><input className={fieldClass} type="number" placeholder="Price" value={v.price} onChange={e=>setV({...v,price:Number(e.target.value)})}/><input className={fieldClass} placeholder="Barcode" value={v.barcode||''} onChange={e=>setV({...v,barcode:e.target.value})}/><input className={fieldClass} placeholder="Category" value={v.category} onChange={e=>setV({...v,category:e.target.value})}/><select className={fieldClass} value={v.routeTo} onChange={e=>setV({...v,routeTo:e.target.value})}><option>BAR</option><option>KITCHEN</option><option>SERVICE</option></select><select className={fieldClass} value={v.stockItemId||''} onChange={e=>setV({...v,stockItemId:e.target.value})}><option value="">Recipe only / untracked</option>{stocks.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select><label className="flex items-center gap-2"><input type="checkbox" checked={!!v.favorite} onChange={e=>setV({...v,favorite:e.target.checked})}/>Favorite</label></div>
  <div className="rounded-xl border border-slate-800 p-3"><b className="text-sm">Portions</b><div className="mt-2 flex gap-2"><input className={fieldClass} placeholder="Name" value={portion.name} onChange={e=>setPortion({...portion,name:e.target.value})}/><input className={fieldClass} type="number" placeholder="ml/unit" value={portion.volume} onChange={e=>setPortion({...portion,volume:Number(e.target.value)})}/><input className={fieldClass} type="number" placeholder="Price" value={portion.price} onChange={e=>setPortion({...portion,price:Number(e.target.value)})}/><button className={buttonClass} onClick={()=>{setV({...v,portions:[...(v.portions||[]),{id:crypto.randomUUID(),...portion}]});}}>Add</button></div><div className="mt-2 text-xs text-slate-400">{(v.portions||[]).map((p:any)=>`${p.name} ${p.volume} @ ${money(p.price)}`).join(' Â· ')||'No portions'}</div></div>
  <div className="rounded-xl border border-slate-800 p-3"><b className="text-sm">Modifiers / mixers</b><div className="mt-2 grid grid-cols-2 gap-2"><input className={fieldClass} value={modifier.name} onChange={e=>setModifier({...modifier,name:e.target.value})}/><input className={fieldClass} type="number" value={modifier.priceDelta} onChange={e=>setModifier({...modifier,priceDelta:Number(e.target.value)})}/><select className={fieldClass} value={modifier.stockItemId} onChange={e=>setModifier({...modifier,stockItemId:e.target.value})}><option value="">No stock effect</option>{stocks.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select><input className={fieldClass} type="number" step="0.001" value={modifier.quantityDelta} onChange={e=>setModifier({...modifier,quantityDelta:Number(e.target.value)})}/></div><button className={buttonClass+' mt-2'} onClick={()=>setV({...v,modifiers:[...(v.modifiers||[]),{id:crypto.randomUUID(),name:modifier.name,priceDelta:modifier.priceDelta,ingredientAdjustments:modifier.stockItemId?[{stockItemId:modifier.stockItemId,quantityDelta:modifier.quantityDelta}]:[]}]})}>Add modifier</button><div className="mt-2 text-xs text-slate-400">{(v.modifiers||[]).map((m:any)=>m.name).join(' Â· ')||'No modifiers'}</div></div>
  <div className="rounded-xl border border-slate-800 p-3"><b className="text-sm">Recipe ingredients</b><div className="mt-2 flex gap-2"><select className={fieldClass} value={ingredient.stockItemId} onChange={e=>setIngredient({...ingredient,stockItemId:e.target.value})}>{stocks.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select><input className={fieldClass} type="number" step="0.001" value={ingredient.quantity} onChange={e=>setIngredient({...ingredient,quantity:Number(e.target.value)})}/><button className={buttonClass} onClick={()=>setV({...v,recipeIngredients:[...(v.recipeIngredients||[]),{...ingredient,tracked:true}]})}>Add</button></div><div className="mt-2 text-xs text-slate-400">{(v.recipeIngredients||[]).length} ingredient(s)</div></div>
  <button className={primaryButtonClass} disabled={!v.name||!v.code||!v.outletIds?.length} onClick={()=>void onSave(v)}>Save product</button></div></ActionDialog>};
const StockDialog=({existing,onSave,onClose}:{existing:any;onSave:(v:any)=>Promise<void>;onClose:()=>void})=>{const [v,setV]=useState(existing||{id:'',name:'',code:'',baseUnit:'unit',averageUnitCost:0,currentStock:{},barcode:'',scanUnitQuantity:1});return <ActionDialog title="Stock master" onClose={onClose}><div className="space-y-3"><input className={fieldClass} placeholder="Name" value={v.name} onChange={e=>setV({...v,name:e.target.value})}/><input className={fieldClass} placeholder="Code" value={v.code} onChange={e=>setV({...v,code:e.target.value})}/><input className={fieldClass} placeholder="Base unit (ml, bottle, piece)" value={v.baseUnit} onChange={e=>setV({...v,baseUnit:e.target.value})}/><input className={fieldClass} type="number" min="0" placeholder="Average unit cost" value={v.averageUnitCost} onChange={e=>setV({...v,averageUnitCost:Number(e.target.value)})}/><label className="block text-sm">Physical barcode / EAN / UPC<input data-barcode-capture="true" className={fieldClass+' mt-1 font-mono'} placeholder="Click and scan, or type code" value={v.barcode||''} onChange={e=>setV({...v,barcode:e.target.value})}/></label><label className="block text-sm">Quantity represented by one scan<input className={fieldClass+' mt-1'} type="number" min="0.000001" step="0.001" value={v.scanUnitQuantity??1} onChange={e=>setV({...v,scanUnitQuantity:Number(e.target.value)})}/><span className="text-xs text-slate-500">Enter in {v.baseUnit || 'base units'} (for example, 750 for a 750 ml bottle tracked in ml).</span></label><button className={primaryButtonClass} disabled={!v.name?.trim()||!v.code?.trim()||!v.baseUnit?.trim()||!Number.isFinite(v.scanUnitQuantity)||v.scanUnitQuantity<=0} onClick={()=>void onSave(v)}>Save stock item</button></div></ActionDialog>};
const SupplierDialog=({existing,onSave,onClose}:{existing:any;suppliers:any[];onSave:(v:any)=>Promise<void>;onClose:()=>void})=>{const [v,setV]=useState(existing||{id:'',name:'',code:'',phone:'',email:'',contactPerson:'',kraPin:'',paymentTermsDays:0,paymentTerms:''});return <ActionDialog title="Supplier" onClose={onClose}><div className="space-y-3">{['name','code','phone','email','contactPerson','kraPin'].map(k=><input key={k} className={fieldClass} placeholder={k} value={v[k]||''} onChange={e=>setV({...v,[k]:e.target.value})}/>)}<label>Payment terms (days)<input className={fieldClass} type="number" min="0" value={v.paymentTermsDays??0} onChange={e=>setV({...v,paymentTermsDays:Number(e.target.value)})}/></label><label>Payment terms / notes<textarea className={fieldClass} value={v.paymentTerms||''} onChange={e=>setV({...v,paymentTerms:e.target.value})}/></label><button className={primaryButtonClass} disabled={!v.name?.trim()||!v.code?.trim()||Number(v.paymentTermsDays)<0} onClick={()=>void onSave(v)}>Save supplier</button></div></ActionDialog>};
const RuleDialog=({existing,products,onSave,onClose}:{existing:any;products:any[];onSave:(v:any)=>Promise<void>;onClose:()=>void})=>{
  const [v,setV]=useState(existing||{id:'',name:'Happy Hour',type:'PERCENT',value:10,scopeType:'ALL',scopeId:'',startTime:'17:00',endTime:'19:00',days:[1,2,3,4,5],priority:10,active:true});
  const days=[['Mon',1],['Tue',2],['Wed',3],['Thu',4],['Fri',5],['Sat',6],['Sun',7]] as const;
  const toggleDay=(day:number)=>setV({...v,days:(v.days||[]).includes(day)?(v.days||[]).filter((x:number)=>x!==day):[...(v.days||[]),day].sort()});
  return <ActionDialog title="Price rule" onClose={onClose}><div className="space-y-3">
    <input className={fieldClass} placeholder="Name" value={v.name} onChange={e=>setV({...v,name:e.target.value})}/>
    <div className="grid grid-cols-2 gap-2">
      <select className={fieldClass} value={v.type} onChange={e=>setV({...v,type:e.target.value})}><option>PERCENT</option><option>FIXED</option></select>
      <input className={fieldClass} type="number" min="0" value={v.value} onChange={e=>setV({...v,value:Number(e.target.value)})}/>
      <select className={fieldClass} value={v.scopeType} onChange={e=>setV({...v,scopeType:e.target.value,scopeId:''})}><option>ALL</option><option>PRODUCT</option><option>CATEGORY</option></select>
      {v.scopeType==='PRODUCT'?<select className={fieldClass} value={v.scopeId} onChange={e=>setV({...v,scopeId:e.target.value})}><option value="">Choose product</option>{products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>:v.scopeType==='CATEGORY'?<input className={fieldClass} placeholder="Category" value={v.scopeId||''} onChange={e=>setV({...v,scopeId:e.target.value})}/>:<div/>}
      <label>Start<input className={fieldClass} type="time" value={v.startTime||''} onChange={e=>setV({...v,startTime:e.target.value})}/></label>
      <label>End<input className={fieldClass} type="time" value={v.endTime||''} onChange={e=>setV({...v,endTime:e.target.value})}/></label>
      <label>Priority<input className={fieldClass} type="number" value={v.priority??10} onChange={e=>setV({...v,priority:Number(e.target.value)})}/></label>
    </div>
    <div><div className="mb-2 text-sm">Active weekdays</div><div className="flex flex-wrap gap-2">{days.map(([label,day])=><button type="button" key={day} className={(v.days||[]).includes(day)?primaryButtonClass:buttonClass} onClick={()=>toggleDay(day)}>{label}</button>)}</div></div>
    <label className="flex gap-2"><input type="checkbox" checked={v.active!==false} onChange={e=>setV({...v,active:e.target.checked})}/>Active</label>
    <button className={primaryButtonClass} disabled={!v.name?.trim()||v.value<0||(v.scopeType!=='ALL'&&!v.scopeId)} onClick={()=>void onSave(v)}>Save rule</button>
  </div></ActionDialog>;
};







