import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] || process.cwd());
const stamp = new Date().toISOString().replace(/[:.]/g,'-');
const backupRoot = path.join(root, `.servos-patch-02a3-backup-${stamp}`);

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

const rel='src-tauri/src/store.rs';
let c=read(rel);

const fnStart=c.indexOf('pub fn reconciliation_compare(');
if(fnStart<0) throw new Error(`${rel}: reconciliation_compare function not found`);

const matchStart=c.indexOf('let (classification, reason) = match (local, remote) {',fnStart);
if(matchStart<0) throw new Error(`${rel}: reconciliation classification match not found`);

const nextResults=c.indexOf('results.push(json!({',matchStart);
if(nextResults<0) throw new Error(`${rel}: reconciliation results anchor not found`);

const block=c.slice(matchStart,nextResults);

if(block.includes('(None, None) => continue,')) {
  console.log(`Already repaired in reconciliation block: ${rel}`);
} else {
  const tail="            (Some(_), Some(_)) => {\n                diverged += 1;\n                (\"DIVERGED\", \"Same record version has different archive state or record data\")\n            }\n        };\n\n        ";
  const replacement="            (Some(_), Some(_)) => {\n                diverged += 1;\n                (\"DIVERGED\", \"Same record version has different archive state or record data\")\n            }\n            (None, None) => continue,\n        };\n\n        ";
  if(!block.includes(tail)) {
    console.log('--- reconciliation match block ---');
    console.log(block);
    throw new Error(`${rel}: expected reconciliation match tail not found; no file was changed`);
  }
  backup(rel);
  const repairedBlock=block.replace(tail,replacement);
  c=c.slice(0,matchStart)+repairedBlock+c.slice(nextResults);
  save(rel,c);
}

const verify=read(rel);
const verifyFn=verify.indexOf('pub fn reconciliation_compare(');
const verifyMatch=verify.indexOf('let (classification, reason) = match (local, remote) {',verifyFn);
const verifyEnd=verify.indexOf('results.push(json!({',verifyMatch);
const verifyBlock=verify.slice(verifyMatch,verifyEnd);
if(!verifyBlock.includes('(None, None) => continue,')) {
  throw new Error('Repair verification failed: scoped reconciliation arm is still missing');
}

console.log('');
console.log('Patch 02A.3 scoped Rust repair complete.');
console.log(`Backups: ${backupRoot}`);
console.log('Verified the (None, None) arm inside reconciliation_compare specifically.');
console.log('No SQLite database was opened. No Supabase endpoint was contacted.');
console.log('Next: npm run test:native; npm run test:desktop');
