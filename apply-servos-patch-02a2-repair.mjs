import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] || process.cwd());
const stamp = new Date().toISOString().replace(/[:.]/g,'-');
const backupRoot = path.join(root, `.servos-patch-02a2-backup-${stamp}`);

function file(rel) { return path.join(root,rel); }
function read(rel) {
  if(!fs.existsSync(file(rel))) throw new Error(`Missing expected file: ${rel}`);
  return fs.readFileSync(file(rel),'utf8');
}
function backup(rel) {
  const src=file(rel);
  const dst=path.join(backupRoot,rel);
  fs.mkdirSync(path.dirname(dst),{recursive:true});
  if(!fs.existsSync(dst)) fs.copyFileSync(src,dst);
}
function save(rel,c) {
  fs.writeFileSync(file(rel),c,'utf8');
  console.log(`Repaired: ${rel}`);
}

{
  const rel='src-tauri/src/store.rs';
  let c=read(rel);
  if(c.includes('(None, None) => continue,')) {
    console.log(`Already repaired: ${rel}`);
  } else {
    const anchor="            (Some(_), Some(_)) => {\n                diverged += 1;\n                (\"DIVERGED\", \"Same record version has different archive state or record data\")\n            }\n        };";
    const replacement="            (Some(_), Some(_)) => {\n                diverged += 1;\n                (\"DIVERGED\", \"Same record version has different archive state or record data\")\n            }\n            (None, None) => continue,\n        };";
    if(!c.includes(anchor)) throw new Error(`${rel}: expected reconciliation match anchor not found`);
    backup(rel);
    c=c.replace(anchor,replacement);
    save(rel,c);
  }
}

{
  const rel='tests/supabase/protocol.sql';
  let c=read(rel);
  const oldBlock="select pg_temp.check_that(\n  (select count(*)=1 from public.business_records),\n  'reconciliation manifest does not mutate business records'\n);";
  const newBlock="select pg_temp.check_that(\n  jsonb_array_length(\n    public.servos_reconciliation_manifest(\n      '00000000-0000-4000-8000-000000000010',\n      repeat('a',64),\n      null,\n      null,\n      100\n    )->'records'\n  )=1,\n  'reconciliation manifest remains read-only and returns the same replica row'\n);";
  if(c.includes(newBlock)) {
    console.log(`Already repaired: ${rel}`);
  } else {
    if(!c.includes(oldBlock)) throw new Error(`${rel}: expected anonymous direct-table assertion not found`);
    backup(rel);
    c=c.replace(oldBlock,newBlock);
    save(rel,c);
  }
}

console.log('');
console.log('Patch 02A.2 repair complete.');
console.log(`Backups: ${backupRoot}`);
console.log('No SQLite database was opened. No Supabase endpoint was contacted.');
console.log('Next: npm run lint; npm run test:native; npm run test:desktop; npm run test:cloud');
