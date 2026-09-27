import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(process.argv[2]||process.cwd());
const rel='src-tauri/src/store.rs';
const file=path.join(root,rel);
if(!fs.existsSync(file)) throw new Error(`Missing ${rel}`);

let c=fs.readFileSync(file,'utf8');
if(!c.includes('SERVOS_PATCH_09_ASSET_REGISTER') && !c.includes('"asset.commission"=>{')){
  throw new Error('Patch 09 must be applied before Patch 09.1.');
}

const movedMarker='// SERVOS_PATCH_09_1_COMMISSION_ROUTING';
if(c.includes(movedMarker)){
  console.log('Patch 09.1 commission routing is already present.');
  process.exit(0);
}

const armStart='            "asset.commission"=>{';
const nextArm='            "asset.save"=>{';
const armIndex=c.indexOf(armStart);
if(armIndex<0) throw new Error('asset.commission match arm not found.');
const nextIndex=c.indexOf(nextArm,armIndex);
if(nextIndex<0) throw new Error('asset.save arm not found after asset.commission.');

const arm=c.slice(armIndex,nextIndex);
const firstNewline=arm.indexOf('\n');
if(firstNewline<0) throw new Error('asset.commission arm is malformed.');
let body=arm.slice(firstNewline+1);

// Find the outer match-arm closing brace from the end. Inner braces are more deeply indented.
const closing=body.lastIndexOf('\n            }');
if(closing<0) throw new Error('asset.commission arm closing brace not found.');
const trailing=body.slice(closing).trim();
if(trailing!=='}') throw new Error('Unexpected content after asset.commission arm.');
body=body.slice(0,closing+1);

const keyAnchor='        let key=text(p,"id")?.to_string();let current=room_any(tx,"assets",&key)?;';
const keyIndex=c.indexOf(keyAnchor);
if(keyIndex<0) throw new Error('ordinary asset ID lookup anchor not found.');

// Ensure we patch the asset dispatcher occurrence, not an unrelated string.
const assetBlock=c.lastIndexOf('    if op.starts_with("asset."){',keyIndex);
if(assetBlock<0) throw new Error('asset dispatcher block not found.');
if(armIndex<assetBlock) throw new Error('asset.commission arm is outside the expected asset dispatcher.');

const routed=`        ${movedMarker}
        if op=="asset.commission"{
${body}            return Ok(true);
        }
`;

const backupDir=path.join(root,`.servos-patch-09-1-backup-${new Date().toISOString().replace(/[:.]/g,'-')}`);
const backup=path.join(backupDir,rel);
fs.mkdirSync(path.dirname(backup),{recursive:true});
fs.copyFileSync(file,backup);

// Remove the now-unreachable match arm, then route it before ordinary asset ID lookup.
c=c.slice(0,armIndex)+c.slice(nextIndex);
const newKeyIndex=c.indexOf(keyAnchor);
if(newKeyIndex<0) throw new Error('asset ID lookup anchor disappeared during repair.');
c=c.slice(0,newKeyIndex)+routed+c.slice(newKeyIndex);

fs.writeFileSync(file,c,'utf8');

console.log('Patch 09.1 commission routing repair complete.');
console.log(`Backup: ${backup}`);
console.log('asset.commission now resolves acquisitionId before any existing asset id is required.');
console.log('No SQLite database was opened. No Supabase endpoint was contacted.');
console.log('Next: npm run test:native ; npm run test:desktop');
