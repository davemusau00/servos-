from pathlib import Path
import json

root = Path(__file__).resolve().parents[1]
def edit(name, fn):
    path = root / name
    path.write_text(fn(path.read_text(encoding='utf-8')), encoding='utf-8')

def package(s):
    p=json.loads(s); p['name']='servos'; p['version']='0.1.0'
    p['scripts'].update({'audit:ui':'node scripts/audit-ui.mjs','tauri':'tauri','native:dev':'tauri dev','native:build':'tauri build','test:native':'cargo test --manifest-path src-tauri/Cargo.toml --lib','test':'node --test tests/*.test.mjs'})
    p['scripts']['clean']='node scripts/clean.mjs'
    p['dependencies']['@tauri-apps/api']='^2.0.0'; p['devDependencies']['@tauri-apps/cli']='^2.0.0'
    return json.dumps(p,indent=2)+'\n'
edit('package.json',package)
edit('src/context/ServOSContext.tsx',lambda s:s.replace('interface ServOSContextType {','export interface ServOSContextType {').replace('const ServOSContext =','export const ServOSContext =').replace('      phoneNumber?: string;','      mpesa?: { code: string; account: string; receivedAmount: number; receivedAt: string; confirmed: boolean };\n      phoneNumber?: string;'))

def app(s):
    s=s.replace("import { PlatformAdminView } from './components/platform/PlatformAdminView';", "import { RuntimeProvider, isNative, useRuntime } from './runtime/RuntimeProvider';\nimport { NativeServOSProvider } from './runtime/NativeServOSProvider';\nimport { BusinessAdminView } from './runtime/BusinessAdminView';\nimport { ManualReconciliationView } from './runtime/ManualReconciliationView';")
    s=s.replace("const [activeTab, setActiveTab] = useState<string>('pos');", "const route = () => window.location.hash.replace(/^#\\/?/, '').split('/')[0] || 'pos';\n  const [activeTab, setTab] = useState<string>(route);\n  const setActiveTab = (tab: string) => { window.location.hash = '/' + tab; setTab(tab); };\n  useEffect(() => { const update = () => setTab(route()); window.addEventListener('hashchange', update); return () => window.removeEventListener('hashchange', update); }, []);\n  const runtime = useRuntime();")
    s=s.replace("      case 'platform':\n        return <PlatformAdminView />;",'')
    s=s.replace("return <TenderReconciliationView />;", "return isNative ? <ManualReconciliationView /> : <TenderReconciliationView />;")
    s=s.replace("return <SettingsCenterView />;", "return isNative ? <BusinessAdminView /> : <SettingsCenterView />;")
    s=s.replace("return <StaffCashView />;", "return isNative ? <BusinessAdminView /> : <StaffCashView />;")
    s=s.replace("    switch (activeTab) {", "    if (isNative && !['pos', 'catalog', 'kds', 'inventory', 'accounting', 'tender', 'settings', 'staff'].includes(activeTab)) return <div className=\"p-6 space-y-3\"><h1 className=\"text-xl font-bold\">Backend integration pending</h1><p>This module is not yet connected to the installed backend. No sample business records are displayed in production.</p></div>;\n    switch (activeTab) {")
    s=s.replace('Elevate to Manager Role','Unlock with another staff account')
    s=s.replace('All POS sales and stock updates are buffered locally in IndexedDB.','Local records remain available. Server synchronization will resume when connected.').replace('Buffered in IndexedDB.','Saved locally.')
    s=s.replace('      {/* Main Viewport & Header */}', '      {/* Main Viewport & Header */}')
    start=s.index('export function App() {')
    s=s[:start]+'''export function App() {
  const Provider = isNative ? NativeServOSProvider : ServOSProvider;
  return <RuntimeProvider><Provider><MainApp /></Provider></RuntimeProvider>;
}

export default App;
'''
    return s
edit('src/App.tsx',app)
edit('src/components/common/Sidebar.tsx',lambda s:'\n'.join(line for line in s.split('\n') if "id: 'platform'" not in line).replace("{ id: 'settings', label: 'Settings & Admin', icon: Settings, desc: 'Multi-property, RBAC & eTIMS' },","{ id: 'settings', label: 'Business Admin', icon: Settings, desc: 'Staff, terminal, backups & synchronization' },"))
edit('src/types/servos.ts',lambda s:s.replace("'platform',",'').replace(", 'platform'",'').replace('// Tenancy & Organization Hierarchy','// Business Organization Hierarchy'))

def pos(s):
    s=s.replace("const [mpesaPhone, setMpesaPhone] = useState<string>('0722419802');", "const [mpesaPhone, setMpesaPhone] = useState<string>('');\n  const [mpesaCode, setMpesaCode] = useState('');\n  const [mpesaAccount, setMpesaAccount] = useState('');\n  const [mpesaConfirmed, setMpesaConfirmed] = useState(false);")
    s=s.replace("useState<string>('748192')","useState<string>('')")
    start=s.index("    if (tenderType === 'MPESA') {",s.index('const handleExecutePayment'))
    end=s.index('    const currentOrderSnapshot',start)
    s=s[:start]+s[end:]
    s=s.replace('phoneNumber: mpesaPhone,','phoneNumber: mpesaPhone,\n      mpesa: { code: mpesaCode, account: mpesaAccount, receivedAmount: activeOrder.grandTotal - activeOrder.amountPaid, receivedAt: new Date().toISOString(), confirmed: mpesaConfirmed },')
    s=s.replace('processPayment(activeOrder.id, tenderType, activeOrder.grandTotal,','processPayment(activeOrder.id, tenderType, activeOrder.grandTotal - activeOrder.amountPaid,')
    s=s.replace('Safaricom Daraja API v2 (STK Push)','Manual M-Pesa receipt').replace('Till: 894102 | Shortcode: 174379','Confirm against the business receipt')
    needle='                    <div>\n                      <label className="text-xs text-slate-300 block mb-1">Customer Phone Number</label>'
    insert='''                    <label className="block text-xs">Transaction code<input required value={mpesaCode} onChange={e => setMpesaCode(e.target.value.toUpperCase())} className="block w-full bg-slate-900 border border-slate-700 rounded p-2" /></label>
                    <label className="block text-xs">Receiving till / paybill account<input required value={mpesaAccount} onChange={e => setMpesaAccount(e.target.value)} className="block w-full bg-slate-900 border border-slate-700 rounded p-2" /></label>
                    <label className="flex gap-2 text-xs"><input type="checkbox" checked={mpesaConfirmed} onChange={e => setMpesaConfirmed(e.target.checked)} />I checked the receipt on the business account and confirmed the amount.</label>
'''
    s=s.replace(needle,insert+needle)
    s=s.replace('M-PESA Daraja & Room Charge','Manual payments & room charge').replace('Initiate STK Push','Record confirmed receipt').replace('Send STK Push','Record confirmed receipt')
    return s
edit('src/components/pos/POSView.tsx',pos)

def native(s):
    s=s.replace('"sellingPrice"','"price"').replace('"costPerBaseUnit"','"averageUnitCost"')
    s=s.replace('text(&data,"name")?;', 'if collection=="tables" {text(&data,"label")?;} else {text(&data,"name")?;}')
    s=s.replace('product["recipe"]','product["recipeIngredients"]')
    s=s.replace('let on_hand=stock["currentStock"].as_f64().unwrap_or(0.0);', 'let location=order["outletId"].as_str().unwrap_or("main").to_string();\n                        let (_, outlet)=get(&tx,"outlets",&location)?;\n                        let location=outlet["defaultStockLocationId"].as_str().unwrap_or("main");\n                        let on_hand=stock["currentStock"][location].as_f64().unwrap_or(0.0);')
    s=s.replace('stock["currentStock"]=json!(on_hand-consumed);','stock["currentStock"][location]=json!(on_hand-consumed);')
    # Avoid borrowing the order while mutating its items.
    s=s.replace('let items=order["items"].as_array_mut()', 'let order_outlet=order["outletId"].as_str().unwrap_or("main").to_string();\n            let items=order["items"].as_array_mut()')
    s=s.replace('let location=order["outletId"].as_str().unwrap_or("main").to_string();','let location=order_outlet.clone();')
    s=s.replace('v.get("name")','v.get("label")')
    s=s.replace('"vatTotal":0,"levyTotal":0','"taxTotal":0,"cateringLevyTotal":0,"shortfallAdjustment":0')
    s=s.replace('"employeeId":user.staff_id,"employeeName":user.name,"guestName":p.get("name")','"serverEmployeeId":user.staff_id,"serverName":user.name,"terminalId":meta(&tx,"terminal_id")?,"tabName":p.get("name")')
    s=s.replace('"productVersion":version,"stockFired":false','"productVersion":version,"taxAmount":0,"cateringLevy":0,"stockFired":false')
    return s
edit('src-tauri/src/store.rs',native)
edit('.gitignore',lambda s:s+'\nsrc-tauri/target/\nsrc-tauri/gen/\n*.sqlite\n*.sqlite-shm\n*.sqlite-wal\n')
