import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(process.argv[2]||process.cwd());
const stamp=new Date().toISOString().replace(/[:.]/g,'-');
const backupRoot=path.join(root,`.servos-patch-04-1-backup-${stamp}`);
const f=rel=>path.join(root,rel);
const read=rel=>fs.readFileSync(f(rel),'utf8');
function backup(rel){const dst=path.join(backupRoot,rel);fs.mkdirSync(path.dirname(dst),{recursive:true});if(!fs.existsSync(dst))fs.copyFileSync(f(rel),dst)}
function write(rel,c){fs.writeFileSync(f(rel),c,'utf8')}

const tests='src-tauri/src/tests.rs';
if(!fs.existsSync(f(tests)))throw new Error(`Missing ${tests}`);
let c=read(tests);

const oldSeed='let seed_batch=id();let stamp=now();';
const newSeed='let seed_batch=Uuid::new_v4().to_string();let stamp="2026-09-27T00:00:00Z";';
if(c.includes(oldSeed)){
  backup(tests);
  c=c.replace(oldSeed,newSeed);
}
const oldParams='rusqlite::params![seed_batch,now()]';
const newParams='rusqlite::params![seed_batch,stamp]';
if(c.includes(oldParams)){
  if(!fs.existsSync(path.join(backupRoot,tests)))backup(tests);
  c=c.replace(oldParams,newParams);
}
if(!c.includes(newSeed)||!c.includes(newParams)){
  throw new Error('Patch 04.1 test anchors were not found/repaired as expected');
}
write(tests,c);
console.log(`Repaired: ${tests}`);

// Remove only trailing blank lines that git diff --check reported.
for(const rel of ['src/native/NativeImportCenterView.tsx','src/types/imports.ts']){
  if(!fs.existsSync(f(rel)))continue;
  const old=read(rel);
  const normalized=old.replace(/[ \t]+\r?\n/g,'\n').replace(/\n+$/,'\n');
  if(normalized!==old){
    backup(rel);write(rel,normalized);console.log(`Normalized EOF whitespace: ${rel}`);
  }else{
    console.log(`EOF already clean: ${rel}`);
  }
}

console.log('');
console.log('Patch 04.1 repair complete.');
console.log(`Backups: ${backupRoot}`);
console.log('No SQLite database was opened. No Supabase endpoint was contacted.');
console.log('Next: git diff --check; npm run test:native; npm run test:desktop');
