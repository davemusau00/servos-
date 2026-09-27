import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(process.argv[2]||process.cwd());
const rel='tests/front-desk-source.test.mjs';
const target=path.join(root,rel);
if(!fs.existsSync(target))throw new Error(`Missing ${rel}`);

const stamp=new Date().toISOString().replace(/[:.]/g,'-');
const backupRoot=path.join(root,`.servos-patch-06-1-backup-${stamp}`);
const backup=path.join(backupRoot,rel);
fs.mkdirSync(path.dirname(backup),{recursive:true});
fs.copyFileSync(target,backup);

let c=fs.readFileSync(target,'utf8');
const old='assert.match(view,/Arrivals today/);';
const next='assert.match(view,/Arrivals & overdue/);';

if(c.includes(old)){
  c=c.replace(old,next);
  fs.writeFileSync(target,c,'utf8');
  console.log(`Repaired: ${rel}`);
}else if(c.includes(next)){
  console.log(`Already repaired: ${rel}`);
}else{
  throw new Error(`${rel}: expected Arrivals assertion was not found`);
}

const verify=fs.readFileSync(target,'utf8');
if(!verify.includes('Arrivals & overdue'))throw new Error('Patch 06.1 verification failed');

console.log('');
console.log('Patch 06.1 source-test repair complete.');
console.log(`Backups: ${backupRoot}`);
console.log('No application source, Rust, SQLite, or Supabase code was changed.');
console.log('Next: npm test');
