import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(process.argv[2]||process.cwd());
const p=JSON.parse(fs.readFileSync(new URL('./patch04_payload.json',import.meta.url),'utf8'));
const PATCH='SERVOS_PATCH_04_CONTROLLED_IMPORT';
const stamp=new Date().toISOString().replace(/[:.]/g,'-');
const backupRoot=path.join(root,`.servos-patch-04-backup-${stamp}`);
const f=rel=>path.join(root,rel);
const read=rel=>fs.readFileSync(f(rel),'utf8');
function backup(rel){const dst=path.join(backupRoot,rel);fs.mkdirSync(path.dirname(dst),{recursive:true});if(!fs.existsSync(dst))fs.copyFileSync(f(rel),dst)}
function write(rel,c){fs.mkdirSync(path.dirname(f(rel)),{recursive:true});fs.writeFileSync(f(rel),c,'utf8')}
function create(rel,c,marker=null){
  if(fs.existsSync(f(rel))){const old=read(rel);if(old===c||old===c+'\n'||(marker&&old.includes(marker))){console.log(`Already present: ${rel}`);return}throw new Error(`${rel} exists with unrelated content`)}
  write(rel,c.endsWith('\n')?c:c+'\n');console.log(`Created: ${rel}`);
}
function insertBefore(rel,marker,anchor,addition){
  let c=read(rel);if(c.includes(marker)){console.log(`Already patched: ${rel}`);return}
  if((c.split(anchor).length-1)!==1)throw new Error(`${rel}: patch anchor missing/ambiguous`);
  backup(rel);c=c.replace(anchor,addition+'\n'+anchor);write(rel,c);console.log(`Patched: ${rel}`);
}

for(const rel of [
  'src-tauri/src/store.rs','src-tauri/src/lib.rs','src-tauri/src/tests.rs',
  'src/runtime/RuntimeProvider.tsx','src/types/imports.ts',
  'src/native/NativeImportCenterView.tsx','src/native/IntakeWizard.tsx',
  'src/native/importTemplates.ts','import-templates/products.csv','import-templates/outlets.csv'
]){
  if(!fs.existsSync(f(rel)))throw new Error(`Missing expected Patch 03 file: ${rel}`);
}
if(!read('src-tauri/src/store.rs').includes('pub fn import_stage'))throw new Error('Patch 04 requires Patch 03 Import Center source.');

create('src-tauri/migrations/005_import_apply.sql',p.migration);
create('src/native/intakeCsv.ts',p.intakeCsv);
create('docs/CONTROLLED_IMPORT_MIGRATION.md',p.docs);
create('tests/controlled-import-source.test.mjs',p.nodeTest);

// SQLite v5 + controlled migration engine + business identity extensions.
{
  const rel='src-tauri/src/store.rs';let c=read(rel),changed=false;
  if(c.includes('if version > 4 {')){backup(rel);c=c.replace('if version > 4 {','if version > 5 {');changed=true}
  if(!c.includes('005_import_apply.sql')){
    if(!changed)backup(rel);
    const anchor=`    if version < 4 {
        db.execute_batch(include_str!("../migrations/004_import_center.sql")).map_err(error)?;
    }
    Ok(db)`;
    if(!c.includes(anchor))throw new Error(`${rel}: migration 004 anchor missing`);
    c=c.replace(anchor,`    if version < 4 {
        db.execute_batch(include_str!("../migrations/004_import_center.sql")).map_err(error)?;
    }
    if version < 5 {
        db.execute_batch(include_str!("../migrations/005_import_apply.sql")).map_err(error)?;
    }
    Ok(db)`);
    changed=true;
  }
  if(!c.includes(PATCH)){
    if(!changed)backup(rel);
    const anchor='pub fn snapshot(db: &Connection, token: &str) -> Result<Value> {';
    if((c.split(anchor).length-1)!==1)throw new Error(`${rel}: snapshot anchor missing/ambiguous`);
    c=c.replace(anchor,p.store+'\n'+anchor);changed=true;
  }
  if(!c.includes('Business identity currency must be KES')){
    if(!changed)backup(rel);
    const anchor=`            put(&tx,"organization","business",organization,&mut changes)?;
            put(&tx,"property","property",property,&mut changes)?;`;
    const replacement=`            if let Some(kra)=data.get("kraPin").and_then(Value::as_str) {
                let kra=kra.trim(); if kra.len()>100{return Err("Business PIN is too long".into());}
                organization["kraPin"]=json!(kra); property["kraPin"]=json!(kra);
            }
            if let Some(currency)=data.get("currency").and_then(Value::as_str) {
                if currency!="KES"{return Err("Business identity currency must be KES".into());}
                property["currency"]=json!(currency);
            }
            if let Some(timezone)=data.get("timezone").and_then(Value::as_str) {
                if timezone!="Africa/Nairobi"{return Err("Business identity timezone must be Africa/Nairobi".into());}
                property["timezone"]=json!(timezone);
            }
            put(&tx,"organization","business",organization,&mut changes)?;
            put(&tx,"property","property",property,&mut changes)?;`;
    if(!c.includes(anchor))throw new Error(`${rel}: business.identity anchor missing`);
    c=c.replace(anchor,replacement);changed=true;
  }
  if(changed){write(rel,c);console.log(`Patched: ${rel}`)}else console.log(`Already patched: ${rel}`);
}

// Import plan types.
{
  const rel='src/types/imports.ts';let c=read(rel);
  if(!c.includes(PATCH)){backup(rel);c=c.trimEnd()+'\n\n'+p.types+'\n';write(rel,c);console.log(`Patched: ${rel}`)}
  else console.log(`Already patched: ${rel}`);
}

// Runtime provider.
{
  const rel='src/runtime/RuntimeProvider.tsx';let c=read(rel),changed=false;
  if(!c.includes('ImportApplyPlan')){
    backup(rel);
    const old="import type { ImportBatchDetail, ImportBatchSummary, StageImportInput } from '../types/imports';";
    const next="import type { ImportApplyPlan, ImportBatchDetail, ImportBatchSummary, StageImportInput } from '../types/imports';";
    if(!c.includes(old))throw new Error(`${rel}: imports type anchor missing`);
    c=c.replace(old,next);changed=true;
  }
  if(!c.includes('planImport: (batchId: string)')){
    const anchor='  cancelImport: (id: string) => Promise<void>;';
    if(!c.includes(anchor))throw new Error(`${rel}: cancelImport interface anchor missing`);
    c=c.replace(anchor,anchor+"\n  planImport: (batchId: string) => Promise<ImportApplyPlan>;\n  importPlan: (planId: string) => Promise<ImportApplyPlan>;\n  applyImport: (planId: string) => Promise<ImportApplyPlan>;");
    changed=true;
  }
  if(!c.includes("'runtime_import_plan'")){
    const anchor='  const receipt = async (orderId: string, receiptId?: string) => {';
    if(!c.includes(anchor))throw new Error(`${rel}: receipt function anchor missing`);
    const addition=`  // ${PATCH}
  const planImport = async (batchId: string) => {
    if (!session) throw new Error('Unlock the terminal first');
    return invoke<ImportApplyPlan>('runtime_import_plan', { token: session.token, batchId });
  };
  const importPlan = async (planId: string) => {
    if (!session) throw new Error('Unlock the terminal first');
    return invoke<ImportApplyPlan>('runtime_import_plan_detail', { token: session.token, planId });
  };
  const applyImport = async (planId: string) => {
    if (!session) throw new Error('Unlock the terminal first');
    const result=await invoke<ImportApplyPlan>('runtime_import_apply', { token: session.token, planId });
    await refresh();
    return result;
  };
`;
    c=c.replace(anchor,addition+anchor);changed=true;
  }
  if(!c.includes('cancelImport, planImport, importPlan, applyImport, reconcile')){
    const anchor='cancelImport, reconcile, receipt';
    if(!c.includes(anchor))throw new Error(`${rel}: provider value anchor missing`);
    c=c.replace(anchor,'cancelImport, planImport, importPlan, applyImport, reconcile, receipt');changed=true;
  }
  if(changed){write(rel,c);console.log(`Patched/repaired: ${rel}`)}else console.log(`Already patched: ${rel}`);
}

// Tauri commands.
{
  const rel='src-tauri/src/lib.rs';let c=read(rel),changed=false;
  if(!c.includes(PATCH)){
    backup(rel);
    const anchor='#[tauri::command]\nfn runtime_backup';
    if(!c.includes(anchor))throw new Error(`${rel}: runtime_backup anchor missing`);
    c=c.replace(anchor,p.lib+'\n'+anchor);changed=true;
  }
  if(!c.includes('            runtime_import_plan,')){
    const anchor='            runtime_import_cancel,';
    if(!c.includes(anchor))throw new Error(`${rel}: import cancel handler anchor missing`);
    c=c.replace(anchor,anchor+'\n            runtime_import_plan,\n            runtime_import_plan_detail,\n            runtime_import_apply,');changed=true;
  }
  if(changed){write(rel,c);console.log(`Patched/repaired: ${rel}`)}else console.log(`Already patched: ${rel}`);
}

// Replace Patch 03 Import Center UI with Patch 04 controlled apply UI.
{
  const rel='src/native/NativeImportCenterView.tsx';const c=read(rel);
  if(!c.includes(PATCH)){backup(rel);write(rel,p.ui+'\n');console.log(`Updated: ${rel}`)}
  else console.log(`Already updated: ${rel}`);
}

// Canonical templates get dependency columns required by controlled application.
{
  const rel='src/native/importTemplates.ts';
  if(read(rel)!==p.importTemplatesTs){backup(rel);write(rel,p.importTemplatesTs);console.log(`Updated: ${rel}`)}
  else console.log(`Already updated: ${rel}`);
  for(const [name,csv] of Object.entries(p.templateFiles)){
    const rel=`import-templates/${name}`;
    if(!fs.existsSync(f(rel)))create(rel,csv);
    else if(read(rel)!==csv){backup(rel);write(rel,csv);console.log(`Updated: ${rel}`)}
  }
}

// Intake business.csv prefill.
{
  const rel='src/native/IntakeWizard.tsx';let c=read(rel),changed=false;
  if(!c.includes('parseBusinessIntakeCsv')){
    backup(rel);
    const importAnchor="import { buttonClass, fieldClass, primaryButtonClass } from './records';";
    if(!c.includes(importAnchor))throw new Error(`${rel}: records import anchor missing`);
    c=c.replace(importAnchor,importAnchor+"\nimport { parseBusinessIntakeCsv } from './intakeCsv';\nimport { IMPORT_TEMPLATES } from './importTemplates';");
    const stateAnchor='  const [profile, setProfile] = useState<IntakeProfile>({';
    if(!c.includes(stateAnchor))throw new Error(`${rel}: profile state anchor missing`);
    c=c.replace(stateAnchor,"  const [csvMessage,setCsvMessage]=useState('');\n"+stateAnchor);
    const readyAnchor='  const identityReady =';
    if(!c.includes(readyAnchor))throw new Error(`${rel}: identityReady anchor missing`);
    const helper=`  const loadBusinessCsv=async(file?:File)=>{if(!file)return;try{const business=parseBusinessIntakeCsv(await file.text());setProfile(p=>({...p,business,importMode:'CSV'}));setCsvMessage('business.csv loaded. Review the identity fields before confirmation.')}catch(e){setCsvMessage(String(e))}};
  const downloadBusinessTemplate=()=>{const t=IMPORT_TEMPLATES.find(x=>x.key==='business')!;const u=URL.createObjectURL(new Blob([t.csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=u;a.download=t.fileName;a.click();window.setTimeout(()=>URL.revokeObjectURL(u),1000)};

`;
    c=c.replace(readyAnchor,helper+readyAnchor);
    const selectLine=`<label>Existing data<select className={fieldClass} value={profile.importMode} onChange={e => set('importMode', e.target.value as IntakeProfile['importMode'])}><option value="MANUAL">Manual entry</option><option value="CSV">CSV import</option><option value="EMPTY">Start empty</option></select></label>`;
    if(!c.includes(selectLine))throw new Error(`${rel}: Existing data select anchor missing`);
    const extra=selectLine+`
          {profile.importMode==='CSV'&&<div className="rounded-xl border border-slate-700 p-3 text-sm"><div className="font-semibold">Business identity CSV</div><p className="mt-1 text-xs text-slate-500">Load business.csv to prefill identity only. Owner and administrator authorization remain manual.</p><div className="mt-2 flex flex-wrap gap-2"><button type="button" className={buttonClass} onClick={downloadBusinessTemplate}>Download business.csv</button><label className={buttonClass+' cursor-pointer'}>Load business.csv<input className="hidden" type="file" accept=".csv,text/csv" onChange={e=>{const file=e.target.files?.[0];void loadBusinessCsv(file);e.currentTarget.value=''}}/></label></div>{csvMessage&&<p className="mt-2 text-xs text-amber-200">{csvMessage}</p>}</div>}`;
    c=c.replace(selectLine,extra);changed=true;
  }
  if(changed){write(rel,c);console.log(`Patched: ${rel}`)}else console.log(`Already patched: ${rel}`);
}

// Native regression tests.
insertBefore('src-tauri/src/tests.rs',PATCH,'#[test]\nfn audit_cannot_be_modified()',p.rustTests);

console.log('');
console.log('Patch 04 controlled CSV migration applied/repaired.');
console.log(`Backups of modified files: ${backupRoot}`);
console.log('No business SQLite database was opened by this applicator. No Supabase endpoint was contacted.');
console.log('Next: git diff --check; npm run lint; npm test; npm run test:native; npm run test:desktop; npm run build; npm run test:browser; npm run audit:ui; npm run docs:check');
