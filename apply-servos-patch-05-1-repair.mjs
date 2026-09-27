import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(process.argv[2]||process.cwd());
const rel='docs/user-guide/34-rooms-engine.md';
const target=path.join(root,rel);
if(!fs.existsSync(target))throw new Error(`Missing ${rel}`);
const stamp=new Date().toISOString().replace(/[:.]/g,'-');
const backupRoot=path.join(root,`.servos-patch-05-1-backup-${stamp}`);
const backup=path.join(backupRoot,rel);
fs.mkdirSync(path.dirname(backup),{recursive:true});
fs.copyFileSync(target,backup);

const content=JSON.parse(fs.readFileSync(new URL('./patch05_1_payload.json',import.meta.url),'utf8')).guide;
fs.writeFileSync(target,content.endsWith('\n')?content:content+'\n','utf8');

const verify=fs.readFileSync(target,'utf8');
for(const token of ['## Overview','## Procedure','Permission: rooms.view, rooms.manage, rooms.operate']){
  if(!verify.includes(token))throw new Error(`Guide repair verification failed: ${token}`);
}

console.log(`Repaired: ${rel}`);
console.log(`Backups: ${backupRoot}`);
console.log('No Rust, TypeScript, SQLite, or Supabase code was changed.');
console.log('Next: npm run docs:check');
