from pathlib import Path
root=Path(__file__).resolve().parents[1]
def edit(name,fn):
 p=root/name;p.write_text(fn(p.read_text(encoding='utf-8')),encoding='utf-8')
def context(s):
 a=s.index('  // Payment processing with M-PESA STK emulator');b=s.index('  // Till Session Management',a)
 s=s[:a]+'''  // Browser preview cannot record real financial transactions.
  const processPayment: ServOSContextType['processPayment'] = async () => ({
    success: false,
    message: 'Payments require the installed business application. No payment was recorded.'
  });

'''+s[b:]
 a=s.index('  const syncOfflineQueue = async () => {');b=s.index('  const triggerEdgePrint',a)
 s=s[:a]+'''  const syncOfflineQueue = async () => {
    showToast('Browser preview has no server connection. No transactions were synchronized.', 'info');
  };

'''+s[b:]
 a=s.index('  const disbursePayrollRun = ');b=s.index('\n  const ',a+10)
 s=s[:a]+'''  const disbursePayrollRun = (_payrollId: string) => {
    showToast('Manual payroll payment recording is pending backend integration. No funds were disbursed.', 'error');
  };
'''+s[b:]
 s=s.replace("status: 'FISCALIZED'", "status: 'PENDING'")
 s=s.replace('verificationHash: `KRA-HASH-${Math.random().toString(36).substring(2, 10).toUpperCase()}`', "verificationHash: ''")
 s=s.replace('M-PESA Daraja adapter, eTIMS fiscalizer','Legacy browser preview').replace('M-PESA Daraja','manual M-Pesa')
 return s
edit('src/context/ServOSContext.tsx',context)
def refund(s):
 a=s.index('  const handleProcessRefund = () => {');b=s.index('\n  return (',a)
 return s[:a]+'''  const handleProcessRefund = () => {
    showToast('Refund recording is pending backend integration. No refund or fiscal credit note was issued.', 'error');
  };
'''+s[b:]
edit('src/components/pos/RefundModal.tsx',refund)
def event(s):
 a=s.index('  const handlePayCommission = ');b=s.index('\n  return (',a)
 return (s[:a]+'''  const handlePayCommission = (_prom: Promoter) => {
    showToast('Manual commission payment recording is pending backend integration. No payout was made.', 'error');
  };
'''+s[b:]).replace('Daraja e-Tickets','Event tickets')
edit('src/components/events/EventsNightlifeView.tsx',event)
def pos(s):
 s="import { ManualMpesaFields } from './ManualMpesaFields';\nimport type { ManualMpesaInput } from '../../types/runtime';\n"+s
 a=s.index("  const [mpesaCode");b=s.index('  const [cashTendered',a)
 s=s[:a]+"  const [mpesaReceipt, setMpesaReceipt] = useState<ManualMpesaInput>({ code: '', account: '', receivedAmount: 0, receivedAt: new Date().toISOString(), confirmed: false });\n"+s[b:]
 a=s.index('      mpesa: { code: mpesaCode');b=s.index('\n',a)
 s=s[:a]+'      mpesa: mpesaReceipt,'+s[b:]
 a=s.index('                    <label className="block text-xs">Transaction code');b=s.index('                    <div>\n                      <label',a)
 s=s[:a]+'                    <ManualMpesaFields value={mpesaReceipt} onChange={setMpesaReceipt} />\n'+s[b:]
 return s.replace('Processing & Fiscalizing...','Saving payment locally…')
edit('src/components/pos/POSView.tsx',pos)

# Keep frontend installation free of unused AI/server runtime dependencies.
import json
p=root/'package.json';data=json.loads(p.read_text())
for key in ['@google/genai','express','dotenv']:data['dependencies'].pop(key,None)
data['devDependencies'].pop('@types/express',None)
data['scripts']['test:browser']='playwright test'
p.write_text(json.dumps(data,indent=2)+'\n')
edit('vite.config.ts',lambda s:s.replace("path.resolve(__dirname, '.')", "path.resolve(import.meta.dirname, '.')"))
edit('index.html',lambda s:'\n'.join(line for line in s.split('\n') if 'fonts.googleapis.com' not in line and 'fonts.gstatic.com' not in line).replace('Enterprise modular hospitality operating system unifying POS, beverage yield, double-entry accounting, hotel PMS, M-PESA, eTIMS fiscalization, and operational control engine.','Single-business hospitality operations with local storage and manual payment reconciliation.'))
if (root/'metadata.json').exists():(root/'metadata.json').unlink()
