import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] || process.cwd());
const marker = 'SERVOS_PATCH_02A_RECONCILIATION';
const stamp = new Date().toISOString().replace(/[:.]/g,'-');
const backupRoot = path.join(root, `.servos-patch-02a1-backup-${stamp}`);

function p(rel) { return path.join(root, rel); }
function backup(rel) {
  const src=p(rel);
  const dst=path.join(backupRoot,rel);
  fs.mkdirSync(path.dirname(dst),{recursive:true});
  fs.copyFileSync(src,dst);
}
function must(rel) {
  if(!fs.existsSync(p(rel))) throw new Error(`Missing expected file: ${rel}`);
  return fs.readFileSync(p(rel),'utf8');
}
function save(rel,content) {
  fs.writeFileSync(p(rel),content,'utf8');
  console.log(`Repaired: ${rel}`);
}

const stray='NativeDataReconciliationPanel.tsx';
if(fs.existsSync(p(stray))) {
  const c=fs.readFileSync(p(stray),'utf8');
  if(!c.includes(marker) && !c.includes('export function NativeDataReconciliationPanel')) {
    throw new Error(`${stray} exists but does not look like the Patch 02A preview file; refusing to delete it.`);
  }
  backup(stray);
  fs.unlinkSync(p(stray));
  console.log(`Removed stray package preview: ${stray}`);
} else {
  console.log(`No stray root TSX file: ${stray}`);
}

{
  const rel='src-tauri/src/store.rs';
  let c=must(rel);
  if(c.includes('(None, None) => continue,')) {
    console.log(`Already repaired: ${rel}`);
  } else {
    const anchor="            (Some(_), Some(_)) => {\n                diverged += 1;\n                (\"DIVERGED\", \"Same record version has different archive state or record data\")\n            }\n        };";
    const replacement="            (Some(_), Some(_)) => {\n                diverged += 1;\n                (\"DIVERGED\", \"Same record version has different archive state or record data\")\n            }\n            (None, None) => continue,\n        };";
    if(!c.includes(anchor)) throw new Error(`${rel}: reconciliation match anchor not found`);
    backup(rel);
    c=c.replace(anchor,replacement);
    save(rel,c);
  }
}

{
  const rel='tests/supabase/protocol.sql';
  let c=must(rel);
  const start=c.indexOf('-- SERVOS_PATCH_02A_RECONCILIATION');
  const endAnchor="reset role;\nselect pg_temp.check_that((select last_sequence=1 from servos_private.terminal),'entire failed batch rolled back');";
  const end=c.indexOf(endAnchor);
  if(start<0 || end<0 || end<=start) throw new Error(`${rel}: Patch 02A protocol block anchors not found`);
  const desired="-- SERVOS_PATCH_02A_RECONCILIATION\nselect pg_temp.check_that(\n  pg_temp.rejects($q$select public.servos_reconciliation_manifest('00000000-0000-4000-8000-000000000010','wrong',null,null,100)$q$),\n  'reconciliation manifest rejects invalid terminal credentials'\n);\nselect pg_temp.check_that(\n  (public.servos_reconciliation_manifest(\n    '00000000-0000-4000-8000-000000000010',\n    repeat('a',64),\n    null,\n    null,\n    100\n  )->>'mode')='READ_ONLY_CLOUD_REPLICA',\n  'reconciliation manifest identifies read-only cloud replica mode'\n);\nselect pg_temp.check_that(\n  jsonb_array_length(\n    public.servos_reconciliation_manifest(\n      '00000000-0000-4000-8000-000000000010',\n      repeat('a',64),\n      null,\n      null,\n      100\n    )->'records'\n  )=1,\n  'reconciliation manifest returns the replicated business record'\n);\nselect pg_temp.check_that(\n  (\n    public.servos_reconciliation_manifest(\n      '00000000-0000-4000-8000-000000000010',\n      repeat('a',64),\n      null,\n      null,\n      100\n    )->'records'->0->>'collection'\n  )='products',\n  'reconciliation manifest preserves collection identity'\n);\nselect pg_temp.check_that(\n  (\n    public.servos_reconciliation_manifest(\n      '00000000-0000-4000-8000-000000000010',\n      repeat('a',64),\n      null,\n      null,\n      100\n    )->'records'->0->>'id'\n  )='p1',\n  'reconciliation manifest preserves record identity'\n);\nselect pg_temp.check_that(\n  (\n    public.servos_reconciliation_manifest(\n      '00000000-0000-4000-8000-000000000010',\n      repeat('a',64),\n      null,\n      null,\n      100\n    )->'terminal'->>'lastSequence'\n  )::bigint=1,\n  'reconciliation manifest reports cloud operation sequence'\n);\nselect pg_temp.check_that(\n  (select count(*)=1 from public.business_records),\n  'reconciliation manifest does not mutate business records'\n);\n";
  if(c.slice(start,end)===desired+'\n') {
    console.log(`Already repaired: ${rel}`);
  } else {
    backup(rel);
    c=c.slice(0,start)+desired+'\n'+c.slice(end);
    save(rel,c);
  }
}

console.log('');
console.log('Patch 02A.1 repair complete.');
console.log(`Backups: ${backupRoot}`);
console.log('No SQLite database was opened and no Supabase endpoint was contacted.');
console.log('Run: git diff --check; npm run lint; npm test; npm run test:native; npm run test:desktop; npm run build; npm run test:browser; npm run test:cloud; npm run audit:ui; npm run docs:check');
