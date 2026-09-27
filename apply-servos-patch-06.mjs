import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(process.argv[2]||process.cwd());
const p=JSON.parse(fs.readFileSync(new URL('./patch06_payload.json',import.meta.url),'utf8'));
const PATCH='SERVOS_PATCH_06_FRONT_DESK';
const stamp=new Date().toISOString().replace(/[:.]/g,'-');
const backupRoot=path.join(root,`.servos-patch-06-backup-${stamp}`);
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
  if((c.split(anchor).length-1)!==1)throw new Error(`${rel}: anchor missing/ambiguous`);
  backup(rel);c=c.replace(anchor,addition+'\n'+anchor);write(rel,c);console.log(`Patched: ${rel}`);
}

for(const rel of ['src-tauri/src/store.rs','src-tauri/src/tests.rs','src/native/NativeBarShell.tsx','src/types/runtime.ts']){
  if(!fs.existsSync(f(rel)))throw new Error(`Missing expected Patch 05 file: ${rel}`);
}
if(!read('src-tauri/src/store.rs').includes('SERVOS_PATCH_05_ROOMS_ENGINE'))throw new Error('Patch 06 requires Patch 05 Native Rooms Engine source.');

create('src/native/NativeFrontDeskView.tsx',p.frontDesk,'SERVOS_PATCH_06_FRONT_DESK');
create('src/native/NativeHousekeepingView.tsx',p.housekeeping,'SERVOS_PATCH_06_HOUSEKEEPING');
create('docs/user-guide/35-front-desk.md',p.frontGuide);
create('docs/user-guide/36-housekeeping.md',p.hkGuide);
create('tests/front-desk-source.test.mjs',p.nodeTest);

// Absorb the separate 05.1 guide fix if it has not been applied.
{
  const rel='docs/user-guide/34-rooms-engine.md';
  if(fs.existsSync(f(rel))){
    const c=read(rel);
    if((!c.includes('## Overview')||!c.includes('## Procedure')||c.includes('Permission: rooms.view / rooms.manage / rooms.operate'))&&p.roomsGuideRepair){
      backup(rel);write(rel,p.roomsGuideRepair.endsWith('\n')?p.roomsGuideRepair:p.roomsGuideRepair+'\n');console.log(`Repaired prerequisite guide: ${rel}`);
    }
  }
}

// Backend stay lifecycle slice.
{
  const rel='src-tauri/src/store.rs';let c=read(rel),changed=false;
  if(!c.includes(PATCH)){
    backup(rel);
    const guard='if !(op.starts_with("roomType.")||op.starts_with("room.")||op.starts_with("ratePlan.")||op.starts_with("roomReservation.")){return Ok(false);}';
    const nextGuard='if !(op.starts_with("roomType.")||op.starts_with("room.")||op.starts_with("ratePlan.")||op.starts_with("roomReservation.")||op.starts_with("stay.")){return Ok(false);}';
    if(!c.includes(guard))throw new Error(`${rel}: Patch 05 room_execute guard not found`);
    c=c.replace(guard,nextGuard);
    const anchor='    if op.starts_with("roomReservation."){';
    if((c.split(anchor).length-1)!==1)throw new Error(`${rel}: reservation branch anchor missing/ambiguous`);
    c=c.replace(anchor,p.stayBranch+anchor);
    changed=true;
  }

  // Reservation and stay operations are real hotel trading and require LIVE.
  if(!c.includes('"stay.checkIn","stay.move"')){
    if(!changed)backup(rel);
    const anchor='"table.ready","closeDay.generate"';
    if(!c.includes(anchor))throw new Error(`${rel}: live_required anchor missing`);
    c=c.replace(anchor,'"table.ready","closeDay.generate","roomReservation.create","roomReservation.update","roomReservation.cancel","roomReservation.noShow","stay.checkIn","stay.move"');
    changed=true;
  }
  if(changed){write(rel,c);console.log(`Patched: ${rel}`)}else console.log(`Already patched: ${rel}`);
}

// Shell routes.
{
  const rel='src/native/NativeBarShell.tsx';let c=read(rel),changed=false;
  if(!c.includes('NativeFrontDeskView')){
    backup(rel);
    const importAnchor="import { NativeRoomsView } from './NativeRoomsView';";
    if(!c.includes(importAnchor))throw new Error(`${rel}: Rooms view import anchor missing`);
    c=c.replace(importAnchor,importAnchor+"\nimport { NativeFrontDeskView } from './NativeFrontDeskView';\nimport { NativeHousekeepingView } from './NativeHousekeepingView';\nimport { CalendarRange, Sparkles } from 'lucide-react';");
    const routeAnchor="  {id:'rooms',label:'Rooms',permission:'rooms.view',icon:BedDouble,help:'rooms-engine'},";
    if(!c.includes(routeAnchor))throw new Error(`${rel}: Patch 05 Rooms route anchor missing`);
    c=c.replace(routeAnchor,
      "  {id:'frontdesk',label:'Front Desk',permission:'rooms.view',icon:CalendarRange,help:'front-desk'},\n"+
      "  {id:'housekeeping',label:'Housekeeping',permission:'rooms.manage',icon:Sparkles,help:'housekeeping'},\n"+
      "  {id:'rooms',label:'Rooms Setup',permission:'rooms.view',icon:BedDouble,help:'rooms-engine'},");
    const contentAnchor="tab==='rooms'?<NativeRoomsView/>:tab==='tender'";
    if(!c.includes(contentAnchor))throw new Error(`${rel}: Rooms content anchor missing`);
    c=c.replace(contentAnchor,"tab==='frontdesk'?<NativeFrontDeskView/>:tab==='housekeeping'?<NativeHousekeepingView/>:tab==='rooms'?<NativeRoomsView/>:tab==='tender'");
    changed=true;
  }
  if(changed){write(rel,c);console.log(`Patched: ${rel}`)}else console.log(`Already patched: ${rel}`);
}

// Rust regression tests.
insertBefore('src-tauri/src/tests.rs',PATCH,'#[test]\nfn audit_cannot_be_modified()',p.rustTests);

// Keep roadmap honest about the financial boundary.
for(const rel of ['SERVOS_PATCH_ROADMAP.md','docs/PRODUCTION_UPGRADE_PATCH_PLAN.md']){
  if(!fs.existsSync(f(rel)))continue;
  let c=read(rel);
  const old='- check-in, move, extend, check-out;';
  const next='- safe check-in and in-house room move;\n- extension and checkout affordances remain gated until Patch 07 folio/payment conservation is active;';
  if(c.includes(old)){backup(rel);c=c.replace(old,next);write(rel,c);console.log(`Updated boundary: ${rel}`)}
}

console.log('');
console.log('Patch 06 Front Desk + Housekeeping applied/repaired.');
console.log(`Backups: ${backupRoot}`);
console.log('No business SQLite database was opened by this applicator. No Supabase endpoint was contacted.');
console.log('Run the full validation gate before committing.');
