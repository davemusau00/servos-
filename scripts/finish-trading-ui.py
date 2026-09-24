from pathlib import Path
root=Path(__file__).resolve().parents[1]
def edit(f, fn):
 p=root/f;p.write_text(fn(p.read_text(encoding='utf-8')),encoding='utf-8')
def context(s):
 s=s.replace('export interface ServOSContextType {','type MutationResult = void | Promise<boolean>;\n\nexport interface ServOSContextType {')
 for name in ['addProduct','updateProduct','deleteProduct','addStockItem','updateStockItem','deleteStockItem']:
  import re
  s=re.sub(r'('+name+r':[^\n]+)=> void;',r'\1=> MutationResult;',s)
 for name in ['transferStock','declareWaste','recordStockCountAdjustment']:
  start=s.index('  '+name+':');end=s.index(') => void;',start);s=s[:end]+s[end:].replace(') => void;',') => MutationResult;',1)
 s=s.replace('createOrderForTable: (tableId: string) => Order;', 'createOrderForTable: (tableId: string) => Order | Promise<string | null>;').replace('createQuickBarTab: (tabName?: string) => Order;', 'createQuickBarTab: (tabName?: string) => Order | Promise<string | null>;')
 return s
edit('src/context/ServOSContext.tsx',context)
def native(s):
 s=s.replace("showToast('Saved locally; synchronization pending.', 'success');", "showToast('Saved locally; synchronization pending.', 'success'); return true;")
 s=s.replace("catch (e) { showToast(String(e), 'error'); }", "catch (e) { showToast(String(e), 'error'); return false; }")
 s=s.replace("showToast('Archived locally.', 'success');", "showToast('Archived locally.', 'success'); return true;")
 s=s.replace('=> void save(', '=> save(').replace('=> void archive(', '=> archive(')
 start=s.index('  const createOrder = ');end=s.index('  const value =',start)
 s=s[:start]+'''  const createOrder = async (payload: Record<string, unknown>) => {
    const result = await run('order.create', { ...payload, outletId });
    if (!result) return null;
    setActiveId(result.recordIds[0]);
    return result.recordIds[0];
  };
  const mutate = (operation: string, payload: Record<string, unknown>) => run(operation, payload).then(Boolean);
'''+s[end:]
 for op in ['inventory.transfer','inventory.waste','inventory.adjust']:
  s=s.replace("=> void run('"+op,"=> mutate('"+op)
 return s
edit('src/runtime/NativeServOSProvider.tsx',native)
def inventory(s):
 s=s.replace('const handleSaveStockItem = (e:', 'const handleSaveStockItem = async (e:')
 s=s.replace('      updateStockItem(editingStockId, {','      const saved = await updateStockItem(editingStockId, {')
 s=s.replace('        minimumStockLevel: stockFormMin\n      });','        minimumStockLevel: stockFormMin\n      });\n      if (saved === false) return;',1)
 s=s.replace('      addStockItem(created);','      if (await addStockItem(created) === false) return;')
 s=s.replace("currentStock: {\n          'loc-warehouse': 1000,\n          'loc-bar-store': 500\n        },", 'currentStock: {},')
 s=s.replace("useState<string>('loc-warehouse')", "useState<string>(stockLocations[0]?.id || '')").replace("useState<string>('loc-bar-store')", "useState<string>(stockLocations[0]?.id || '')")
 for fn in ['transferStock','declareWaste','recordStockCountAdjustment']:
  position=s.index('                  '+fn+'(');start=s.rfind('onClick={() => {',0,position)
  s=s[:start]+s[start:].replace('onClick={() => {','onClick={async () => {',1)
  position=s.index('                  '+fn+'(');end=s.index(';',position)
  line=s[position:end];s=s[:position]+line.replace(fn+'(','if (await '+fn+'(',1)+' === false) return'+s[end:]
 return s
edit('src/components/inventory/InventoryView.tsx',inventory)
def catalog(s):
 s=s.replace('const handleSaveProduct = (e:', 'const handleSaveProduct = async (e:')
 s=s.replace('      updateProduct(editingProductId, {', '      const saved = await updateProduct(editingProductId, {')
 s=s.replace('      if (selectedProduct && selectedProduct.id === editingProductId)', '      if (saved === false) return;\n      if (selectedProduct && selectedProduct.id === editingProductId)')
 s=s.replace('      addProduct(created);','      if (await addProduct(created) === false) return;')
 return s
edit('src/components/catalog/CatalogStudioView.tsx',catalog)
# Eliminate the obsolete gateway terminology in remaining preview-only surfaces.
for file in (root/'src').rglob('*'):
 if file.suffix not in ['.ts','.tsx']:continue
 s=file.read_text(encoding='utf-8')
 s=s.replace('MPESA_B2C','MPESA_MANUAL').replace('M-PESA B2C','manual M-Pesa').replace('M-Pesa B2C','manual M-Pesa')
 s=s.replace('M-PESA Daraja (Direct STK)','Manual M-Pesa').replace('M-PESA Daraja STK','Manual M-Pesa').replace('M-PESA Daraja Ref: QHK482910 [COMPLETED]','M-PESA: manual receipt confirmation required')
 s=s.replace('M-PESA Daraja','Manual M-Pesa').replace('Safaricom Manual M-Pesa 3.0 API Integration','Manual M-Pesa configuration')
 s=s.replace('Trigger M-PESA STK Push','Accept manually confirmed M-Pesa').replace('STK Push Timeout:','Manual review window:').replace('B2C Commission Float:','Manual payout budget:').replace('Pay via M-Pesa STK','Pay at the cashier')
 s=s.replace('darajaStep','paymentStep').replace('setDarajaStep','setPaymentStep')
 file.write_text(s,encoding='utf-8')
