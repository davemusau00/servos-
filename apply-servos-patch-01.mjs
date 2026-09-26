import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const repo = path.resolve(process.argv[2] || process.cwd());
const baseline = 'dbefee308edb6beca307a7553d8f6656a5460e83';
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupDir = path.join(repo, `.servos-patch-backup-${stamp}`);

const files = {
  runtimeTypes: 'src/types/runtime.ts',
  runtimeProvider: 'src/runtime/RuntimeProvider.tsx',
  store: 'src-tauri/src/store.rs',
  tauriLib: 'src-tauri/src/lib.rs',
  operations: 'src/native/NativeOperationsViews.tsx',
  nativeTests: 'src-tauri/src/tests.rs',
  healthPanel: 'src/native/NativeProductionHealthPanel.tsx',
  docsPlan: 'docs/PRODUCTION_UPGRADE_PATCH_PLAN.md',
};

function abs(rel) { return path.join(repo, rel); }
function read(rel) { return fs.readFileSync(abs(rel), 'utf8'); }
function ensureParent(rel) { fs.mkdirSync(path.dirname(abs(rel)), { recursive: true }); }
function backup(rel) {
  const source = abs(rel);
  if (!fs.existsSync(source)) return;
  const target = path.join(backupDir, rel);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}
function write(rel, content) {
  ensureParent(rel);
  backup(rel);
  fs.writeFileSync(abs(rel), content, 'utf8');
}
function replaceOnce(rel, before, after) {
  const current = read(rel);
  const count = current.split(before).length - 1;
  if (count !== 1) throw new Error(`${rel}: expected one patch anchor, found ${count}`);
  write(rel, current.replace(before, after));
}
function insertBefore(rel, needle, addition) {
  const current = read(rel);
  const index = current.indexOf(needle);
  if (index < 0) throw new Error(`${rel}: insertion anchor not found: ${needle.slice(0, 80)}`);
  write(rel, current.slice(0, index) + addition + current.slice(index));
}

if (!fs.existsSync(path.join(repo, 'package.json')) || !fs.existsSync(path.join(repo, 'src-tauri'))) {
  throw new Error(`Not a ServOS repository: ${repo}`);
}

try {
  const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).trim();
  if (head !== baseline) {
    console.warn(`WARNING: repository HEAD is ${head}, while Patch 01 was prepared against ${baseline}.`);
    console.warn('The script will continue only if every source anchor still matches exactly.');
  }
} catch {
  console.warn('WARNING: git HEAD could not be read. Exact source anchors are still enforced.');
}

fs.mkdirSync(backupDir, { recursive: true });

const healthTypes = `export interface ProductionHealthCollection { collection: string; active: number; archived: number; maxVersion: number }\nexport interface ProductionHealthRecordVersion { collection: string; id: string; version: number; archived: boolean }\nexport interface ProductionHealthAudit {\n  mode: 'READ_ONLY_LOCAL_AUDIT';\n  generatedAt: string;\n  appVersion: string;\n  database: { schemaVersion: number; quickCheck: string };\n  installation: { stage: InstallationStage; terminalId: string | null; cloudConfigured: boolean; lastSync: string | null; lastBackup: string | null };\n  staff: { total: number; active: number };\n  operations: { commands: number; auditEntries: number; firstAuditSequence: number | null; lastAuditSequence: number | null; outboxTotal: number; outboxPending: number; outboxAcknowledged: number; lastOutboxSequence: number; remoteRequests: number; openTills: number };\n  records: { total: number; active: number; archived: number; collections: ProductionHealthCollection[]; manifest: ProductionHealthRecordVersion[] };\n  warnings: string[];\n}\n`;
replaceOnce(files.runtimeTypes,
  "export type PrinterJobState = 'SENT' | 'QUEUED' | 'DELIVERY_UNCERTAIN' | 'SENDING' | 'OS_DIALOG' | 'MANUAL';",
  healthTypes + "export type PrinterJobState = 'SENT' | 'QUEUED' | 'DELIVERY_UNCERTAIN' | 'SENDING' | 'OS_DIALOG' | 'MANUAL';"
);

replaceOnce(files.runtimeProvider,
  "import type { BusinessCommand, CommandResult, IntakeProfile, ManagerApproval, Permission, PrinterJobResult, RuntimeSession, RuntimeSnapshot, RuntimeStatus } from '../types/runtime';",
  "import type { BusinessCommand, CommandResult, IntakeProfile, ManagerApproval, Permission, PrinterJobResult, ProductionHealthAudit, RuntimeSession, RuntimeSnapshot, RuntimeStatus } from '../types/runtime';"
);
replaceOnce(files.runtimeProvider,
  "  backup: () => Promise<string>;\n  receipt: (orderId: string, receiptId?: string) => Promise<ReceiptResponse>;",
  "  backup: () => Promise<string>;\n  healthAudit: () => Promise<ProductionHealthAudit>;\n  receipt: (orderId: string, receiptId?: string) => Promise<ReceiptResponse>;"
);
replaceOnce(files.runtimeProvider,
  "  const receipt = async (orderId: string, receiptId?: string) => {",
  "  const healthAudit = async () => {\n    if (!session) throw new Error('Unlock the terminal first');\n    try { return await invoke<ProductionHealthAudit>('runtime_health_audit', { token: session.token }); }\n    catch (e) { report(e); throw e; }\n  };\n  const receipt = async (orderId: string, receiptId?: string) => {"
);
replaceOnce(files.runtimeProvider,
  "command, approve, sync, backup, receipt, receiptHistory",
  "command, approve, sync, backup, healthAudit, receipt, receiptHistory"
);

const rustAudit = `pub fn production_health_audit(db: &Connection, token: &str) -> Result<Value> {\n    let user = actor(db, token, false)?;\n    if !permissions(&user.role).contains(&\"audit.view\") {\n        return Err(\"Audit permission required\".into());\n    }\n\n    let schema_version: i64 = db.query_row(\"PRAGMA user_version\", [], |r| r.get(0)).map_err(error)?;\n    let quick_check: String = db.query_row(\"PRAGMA quick_check\", [], |r| r.get(0)).map_err(error)?;\n    let stage = installation_stage(db)?;\n    let terminal_id = meta(db, \"terminal_id\")?;\n    let last_sync = meta(db, \"last_sync\")?;\n    let last_backup = meta(db, \"last_backup\")?;\n    let cloud_configured = meta(db, \"cloud_url\")?.is_some();\n\n    let staff_total: i64 = db.query_row(\"SELECT COUNT(*) FROM staff\", [], |r| r.get(0)).map_err(error)?;\n    let staff_active: i64 = db.query_row(\"SELECT COUNT(*) FROM staff WHERE active=1\", [], |r| r.get(0)).map_err(error)?;\n    let (record_total, record_active, record_archived): (i64, i64, i64) = db.query_row(\n        \"SELECT COUNT(*),COALESCE(SUM(CASE WHEN archived=0 THEN 1 ELSE 0 END),0),COALESCE(SUM(CASE WHEN archived<>0 THEN 1 ELSE 0 END),0) FROM records\",\n        [],\n        |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?)),\n    ).map_err(error)?;\n    let commands: i64 = db.query_row(\"SELECT COUNT(*) FROM commands\", [], |r| r.get(0)).map_err(error)?;\n    let (audit_entries, first_audit, last_audit): (i64, Option<i64>, Option<i64>) = db.query_row(\n        \"SELECT COUNT(*),MIN(sequence),MAX(sequence) FROM audit\", [], |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?))\n    ).map_err(error)?;\n    let (outbox_total, outbox_pending, outbox_acknowledged, last_outbox): (i64, i64, i64, i64) = db.query_row(\n        \"SELECT COUNT(*),COALESCE(SUM(CASE WHEN acknowledged_at IS NULL THEN 1 ELSE 0 END),0),COALESCE(SUM(CASE WHEN acknowledged_at IS NOT NULL THEN 1 ELSE 0 END),0),COALESCE(MAX(sequence),0) FROM outbox\",\n        [],\n        |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?, r.get(3)?)),\n    ).map_err(error)?;\n    let remote_requests: i64 = db.query_row(\"SELECT COUNT(*) FROM remote_requests\", [], |r| r.get(0)).map_err(error)?;\n    let open_tills: i64 = db.query_row(\n        \"SELECT COUNT(*) FROM records WHERE collection='tillSessions' AND archived=0 AND json_extract(data,'$.status')='OPEN'\",\n        [], |r| r.get(0)\n    ).map_err(error)?;\n\n    let collections = {\n        let mut stmt = db.prepare(\"SELECT collection,COALESCE(SUM(CASE WHEN archived=0 THEN 1 ELSE 0 END),0),COALESCE(SUM(CASE WHEN archived<>0 THEN 1 ELSE 0 END),0),COALESCE(MAX(version),0) FROM records GROUP BY collection ORDER BY collection\").map_err(error)?;\n        let rows = stmt.query_map([], |r| Ok(json!({\n            \"collection\": r.get::<_, String>(0)?,\n            \"active\": r.get::<_, i64>(1)?,\n            \"archived\": r.get::<_, i64>(2)?,\n            \"maxVersion\": r.get::<_, i64>(3)?,\n        }))).map_err(error)?;\n        rows.collect::<std::result::Result<Vec<_>, _>>().map_err(error)?\n    };\n    let manifest = {\n        let mut stmt = db.prepare(\"SELECT collection,id,version,archived FROM records ORDER BY collection,id\").map_err(error)?;\n        let rows = stmt.query_map([], |r| Ok(json!({\n            \"collection\": r.get::<_, String>(0)?,\n            \"id\": r.get::<_, String>(1)?,\n            \"version\": r.get::<_, i64>(2)?,\n            \"archived\": r.get::<_, bool>(3)?,\n        }))).map_err(error)?;\n        rows.collect::<std::result::Result<Vec<_>, _>>().map_err(error)?\n    };\n\n    let mut warnings: Vec<String> = vec![];\n    if quick_check != \"ok\" { warnings.push(format!(\"SQLite quick_check returned: {quick_check}\")); }\n    if stage != \"LIVE\" { warnings.push(format!(\"Installation stage is {stage}, not LIVE\")); }\n    if terminal_id.is_none() { warnings.push(\"Terminal identity is missing\".into()); }\n    if last_backup.is_none() { warnings.push(\"No successful local backup is recorded\".into()); }\n    if outbox_pending > 0 { warnings.push(format!(\"{outbox_pending} local operation(s) are still pending cloud acknowledgement\")); }\n    if !cloud_configured { warnings.push(\"Cloud synchronization is not configured\".into()); }\n    if open_tills > 0 { warnings.push(\"A till is currently open; take migration checkpoints after close where operationally possible\".into()); }\n\n    Ok(json!({\n        \"mode\": \"READ_ONLY_LOCAL_AUDIT\",\n        \"generatedAt\": now(),\n        \"appVersion\": env!(\"CARGO_PKG_VERSION\"),\n        \"database\": {\"schemaVersion\": schema_version, \"quickCheck\": quick_check},\n        \"installation\": {\"stage\": stage, \"terminalId\": terminal_id, \"cloudConfigured\": cloud_configured, \"lastSync\": last_sync, \"lastBackup\": last_backup},\n        \"staff\": {\"total\": staff_total, \"active\": staff_active},\n        \"operations\": {\"commands\": commands, \"auditEntries\": audit_entries, \"firstAuditSequence\": first_audit, \"lastAuditSequence\": last_audit, \"outboxTotal\": outbox_total, \"outboxPending\": outbox_pending, \"outboxAcknowledged\": outbox_acknowledged, \"lastOutboxSequence\": last_outbox, \"remoteRequests\": remote_requests, \"openTills\": open_tills},\n        \"records\": {\"total\": record_total, \"active\": record_active, \"archived\": record_archived, \"collections\": collections, \"manifest\": manifest},\n        \"warnings\": warnings,\n    }))\n}\n\n`;
insertBefore(files.store, 'pub fn snapshot(db: &Connection, token: &str) -> Result<Value> {', rustAudit);

const tauriCommand = `#[tauri::command]\nfn runtime_health_audit(state: State<Runtime>, token: String) -> store::Result<Value> {\n    let db = state.db.lock().map_err(|e| e.to_string())?;\n    store::production_health_audit(&db, &token)\n}\n\n`;
insertBefore(files.tauriLib, '#[tauri::command]\nfn runtime_backup', tauriCommand);
replaceOnce(files.tauriLib,
  '            runtime_backup,\n            runtime_print_receipt,',
  '            runtime_backup,\n            runtime_health_audit,\n            runtime_print_receipt,'
);

const healthPanel = `import React,{useState} from 'react';\nimport type {ProductionHealthAudit} from '../types/runtime';\nimport {useRuntime} from '../runtime/RuntimeProvider';\nimport {ActionDialog} from './ActionDialog';\nimport {buttonClass,primaryButtonClass} from './records';\n\nconst displayTime=(value:string|null)=>value?new Date(value).toLocaleString():'Never';\n\nexport function NativeProductionHealthPanel(){\n  const runtime=useRuntime();\n  const [audit,setAudit]=useState<ProductionHealthAudit|null>(null);\n  const [detailsOpen,setDetailsOpen]=useState(false);\n  const [busy,setBusy]=useState(false);\n  const [message,setMessage]=useState('');\n  const run=async()=>{setBusy(true);setMessage('');try{setAudit(await runtime.healthAudit());setDetailsOpen(true)}catch(e){setMessage(String(e))}finally{setBusy(false)}};\n  const checkpoint=async()=>{setBusy(true);setMessage('');try{const backup=await runtime.backup();const next=await runtime.healthAudit();setAudit(next);setDetailsOpen(true);setMessage(\`Checkpoint backup created: \${backup}\`)}catch(e){setMessage(String(e))}finally{setBusy(false)}};\n  return <section className=\"mt-5 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4\">\n    <div className=\"flex flex-wrap items-start justify-between gap-3\"><div><h2 className=\"font-bold text-amber-200\">Production data safety</h2><p className=\"mt-1 max-w-3xl text-xs text-slate-400\">Read-only local audit for the already-deployed terminal. It reports schema, record versions, audit/outbox state and backup/sync evidence without exposing cloud/device secrets or changing business records.</p></div><div className=\"flex flex-wrap gap-2\"><button className={buttonClass} disabled={busy} onClick={()=>void run()}>{busy?'Checking…':'Run read-only audit'}</button><button className={primaryButtonClass} disabled={busy} onClick={()=>void checkpoint()}>Create checkpoint backup</button></div></div>\n    {message&&<p role=\"status\" className=\"mt-3 text-xs text-slate-300\">{message}</p>}\n    {audit&&<div className=\"mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4\"><Metric label=\"SQLite\" value={\`v\${audit.database.schemaVersion} · \${audit.database.quickCheck}\`}/><Metric label=\"Records\" value={\`\${audit.records.active} active · \${audit.records.archived} archived\`}/><Metric label=\"Outbox\" value={\`\${audit.operations.outboxPending} pending / \${audit.operations.outboxAcknowledged} acknowledged\`}/><Metric label=\"Last backup\" value={displayTime(audit.installation.lastBackup)}/></div>}\n    {audit&&audit.warnings.length>0&&<div className=\"mt-3 rounded-xl border border-amber-500/30 bg-slate-950 p-3\"><div className=\"text-xs font-bold text-amber-300\">Review before migration</div><ul className=\"mt-2 space-y-1 text-xs text-slate-300\">{audit.warnings.map(w=><li key={w}>• {w}</li>)}</ul></div>}\n    {audit&&<button className=\"mt-3 text-xs font-semibold text-amber-300 underline\" onClick={()=>setDetailsOpen(true)}>Local manifest captured: {audit.records.manifest.length} record version(s)</button>}\n    {audit&&detailsOpen&&<ActionDialog title=\"Production data health audit\" onClose={()=>setDetailsOpen(false)}><div className=\"space-y-4 text-sm\"><div className=\"grid gap-2 sm:grid-cols-2\"><Metric label=\"Generated\" value={displayTime(audit.generatedAt)}/><Metric label=\"App version\" value={audit.appVersion}/><Metric label=\"Installation\" value={audit.installation.stage}/><Metric label=\"Terminal\" value={audit.installation.terminalId||'Missing'}/><Metric label=\"Last sync\" value={displayTime(audit.installation.lastSync)}/><Metric label=\"Cloud configured\" value={audit.installation.cloudConfigured?'Yes':'No'}/><Metric label=\"Commands\" value={String(audit.operations.commands)}/><Metric label=\"Audit sequence\" value={audit.operations.lastAuditSequence===null?'None':\`\${audit.operations.firstAuditSequence} - \${audit.operations.lastAuditSequence}\`}/></div><div><h3 className=\"mb-2 font-bold\">Collection manifest</h3><div className=\"max-h-72 overflow-auto rounded-xl border border-slate-800\"><table className=\"w-full text-left text-xs\"><thead className=\"sticky top-0 bg-slate-950 text-slate-400\"><tr><th className=\"p-2\">Collection</th><th className=\"p-2 text-right\">Active</th><th className=\"p-2 text-right\">Archived</th><th className=\"p-2 text-right\">Max version</th></tr></thead><tbody>{audit.records.collections.map(c=><tr key={c.collection} className=\"border-t border-slate-800\"><td className=\"p-2 font-mono\">{c.collection}</td><td className=\"p-2 text-right\">{c.active}</td><td className=\"p-2 text-right\">{c.archived}</td><td className=\"p-2 text-right\">{c.maxVersion}</td></tr>)}</tbody></table></div></div><p className=\"text-xs text-slate-500\">Patch 02 will request the equivalent manifest from Supabase and classify every record as matched, local-ahead, cloud-missing, cloud-ahead or diverged before any v2 cutover.</p></div></ActionDialog>}\n  </section>;\n}\nconst Metric=({label,value}:{label:string;value:string})=><div className=\"rounded-xl bg-slate-950 p-3\"><div className=\"text-[11px] text-slate-500\">{label}</div><div className=\"mt-1 break-all font-semibold\">{value}</div></div>;\n`;
write(files.healthPanel, healthPanel);

replaceOnce(files.operations,
  "import { NativeSettingsPanel } from './NativeSettingsPanel';",
  "import { NativeSettingsPanel } from './NativeSettingsPanel';\nimport { NativeProductionHealthPanel } from './NativeProductionHealthPanel';"
);
replaceOnce(files.operations,
  '<section className="mt-5 rounded-2xl border border-slate-800 bg-slate-900 p-4"><h2 className="font-bold">System health</h2><div className="mt-3 grid gap-3 sm:grid-cols-3"><Metric label="Installation" value={s.installationStage}/><Metric label="Pending sync" value={String(s.pendingCount)}/><Metric label="Last backup" value={shortDate(s.lastBackup)}/></div></section>',
  '<section className="mt-5 rounded-2xl border border-slate-800 bg-slate-900 p-4"><h2 className="font-bold">System health</h2><div className="mt-3 grid gap-3 sm:grid-cols-3"><Metric label="Installation" value={s.installationStage}/><Metric label="Pending sync" value={String(s.pendingCount)}/><Metric label="Last backup" value={shortDate(s.lastBackup)}/></div></section>\n<NativeProductionHealthPanel/>'
);

const testBlock = `#[test]\nfn production_health_audit_is_read_only_and_excludes_secrets() {\n    let (_, db, s) = setup();\n    set_meta(&db, \"cloud_url\", \"https://example.supabase.co\").unwrap();\n    set_meta(&db, \"cloud_key\", \"secret-cloud-key\").unwrap();\n    set_meta(&db, \"device_token\", \"secret-device-token\").unwrap();\n    let before: (i64, i64, i64, i64) = db.query_row(\n        \"SELECT (SELECT COUNT(*) FROM records),(SELECT COUNT(*) FROM commands),(SELECT COUNT(*) FROM audit),(SELECT COUNT(*) FROM outbox)\",\n        [],\n        |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?, r.get(3)?)),\n    ).unwrap();\n    let health = production_health_audit(&db, &s.token).unwrap();\n    assert_eq!(health[\"mode\"], \"READ_ONLY_LOCAL_AUDIT\");\n    assert_eq!(health[\"database\"][\"quickCheck\"], \"ok\");\n    assert_eq!(health[\"installation\"][\"stage\"], \"LIVE\");\n    assert_eq!(health[\"installation\"][\"cloudConfigured\"], true);\n    assert!(health[\"records\"][\"manifest\"].as_array().unwrap().len() > 0);\n    let rendered = health.to_string();\n    assert!(!rendered.contains(\"secret-cloud-key\"));\n    assert!(!rendered.contains(\"secret-device-token\"));\n    let after: (i64, i64, i64, i64) = db.query_row(\n        \"SELECT (SELECT COUNT(*) FROM records),(SELECT COUNT(*) FROM commands),(SELECT COUNT(*) FROM audit),(SELECT COUNT(*) FROM outbox)\",\n        [],\n        |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?, r.get(3)?)),\n    ).unwrap();\n    assert_eq!(before, after);\n}\n\n`;
insertBefore(files.nativeTests, '#[test]\nfn audit_cannot_be_modified()', testBlock);

const plan = fs.readFileSync(new URL('./SERVOS_PATCH_ROADMAP.md', import.meta.url), 'utf8');
write(files.docsPlan, plan);

console.log(`Patch 01 source changes applied to: ${repo}`);
console.log(`Backups of changed files: ${backupDir}`);
console.log('No business SQLite database, enrollment metadata, or Supabase data was modified by this patch script.');
console.log('Next run: npm run lint && npm test && npm run test:native && npm run test:desktop && npm run build');
