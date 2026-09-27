import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(process.argv[2]||process.cwd());
const p=JSON.parse(fs.readFileSync(new URL('./patch05_payload.json',import.meta.url),'utf8'));
const PATCH='SERVOS_PATCH_05_ROOMS_ENGINE';
const stamp=new Date().toISOString().replace(/[:.]/g,'-');
const backupRoot=path.join(root,`.servos-patch-05-backup-${stamp}`);
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

for(const rel of [
  'src-tauri/src/store.rs','src-tauri/src/tests.rs','src/types/runtime.ts',
  'src/native/NativeBarShell.tsx','src/native/NativeImportCenterView.tsx',
  'src/native/importTemplates.ts','import-templates/stock_locations.csv',
  'docs/CONTROLLED_IMPORT_MIGRATION.md'
]){
  if(!fs.existsSync(f(rel)))throw new Error(`Missing expected file: ${rel}`);
}
if(!read('src-tauri/src/store.rs').includes('SERVOS_PATCH_04_CONTROLLED_IMPORT'))throw new Error('Patch 05 requires Patch 04 controlled-import source locally.');

create('src/native/NativeRoomsView.tsx',p.ui,PATCH);
create('docs/user-guide/34-rooms-engine.md',p.guide);
create('tests/rooms-engine-source.test.mjs',p.nodeTest);

// Permissions and room engine backend.
{
  const rel='src-tauri/src/store.rs';let c=read(rel),changed=false;
  if(!c.includes('"rooms.view","rooms.manage","rooms.operate","rooms.guests.view"')){
    backup(rel);
    const anchor='"floorplan.view","floorplan.manage","kds.view","kds.update",';
    if(!c.includes(anchor))throw new Error(`${rel}: permission anchor missing`);
    c=c.replace(anchor,'"floorplan.view","floorplan.manage","rooms.view","rooms.manage","rooms.operate","rooms.guests.view","kds.view","kds.update",');
    changed=true;
  }
  // Generic CRUD must no longer bypass dedicated room invariants.
  if(c.includes('    "rooms",\n')){
    if(!changed)backup(rel);
    c=c.replace('    "rooms",\n','');
    changed=true;
  }
  if(c.includes('| "rooms" | "events"')){
    if(!changed)backup(rel);
    c=c.replace('| "rooms" | "events"','| "events"');
    changed=true;
  }
  if(!c.includes(PATCH)){
    if(!changed)backup(rel);
    const anchor='pub fn execute(db: &mut Connection, token: &str, cmd: BusinessCommand) -> Result<Value> {';
    if((c.split(anchor).length-1)!==1)throw new Error(`${rel}: execute anchor missing/ambiguous`);
    c=c.replace(anchor,p.rustRooms+'\n'+anchor);
    changed=true;
  }
  if(!c.includes('if room_execute(&tx,user,&cmd,&mut changes)?')){
    if(!changed)backup(rel);
    const anchor='    live_required(&tx, &cmd.operation)?;\n    match cmd.operation.as_str() {';
    if(!c.includes(anchor))throw new Error(`${rel}: execute dispatch anchor missing`);
    c=c.replace(anchor,'    live_required(&tx, &cmd.operation)?;\n    if room_execute(&tx,user,&cmd,&mut changes)? {\n        let result=finish(&tx,&cmd,&user.staff_id,changes)?;\n        tx.commit().map_err(error)?;\n        return Ok(result);\n    }\n    match cmd.operation.as_str() {');
    changed=true;
  }

  // Promote room master CSVs into the controlled-import planner.
  const oldDeferred=`    if ["room_types","rooms","rate_plans","hotel_services"].contains(&template_key) {
        one("BLOCKED",None,None,None,None,None,
            "This staged dataset is reserved for Patch 05 Rooms/PMS so room-state and reservation invariants exist before application.".into(),None,None);
        return Ok(steps);
    }
`;
  if(c.includes(oldDeferred)){
    if(!changed)backup(rel);
    c=c.replace(oldDeferred,p.rustImportBranch);
    changed=true;
  }else if(!c.includes('Hotel services remain staged until Patch 07 Folios')){
    throw new Error(`${rel}: Patch 04 room-import deferral anchor missing`);
  }

  if(changed){write(rel,c);console.log(`Patched: ${rel}`)}else console.log(`Already patched: ${rel}`);
}

// TypeScript permission union.
{
  const rel='src/types/runtime.ts';let c=read(rel);
  if(!c.includes("'rooms.view'")){
    backup(rel);
    const anchor="  | 'floorplan.view' | 'floorplan.manage'\n";
    if(!c.includes(anchor))throw new Error(`${rel}: permission type anchor missing`);
    c=c.replace(anchor,anchor+"  | 'rooms.view' | 'rooms.manage' | 'rooms.operate' | 'rooms.guests.view'\n");
    write(rel,c);console.log(`Patched: ${rel}`);
  }else console.log(`Already patched: ${rel}`);
}

// Rooms route.
{
  const rel='src/native/NativeBarShell.tsx';let c=read(rel),changed=false;
  if(!c.includes('NativeRoomsView')){
    backup(rel);
    const iconAnchor='BookOpen, Boxes, ClipboardCheck, CreditCard, Database, FileSpreadsheet, HelpCircle, LayoutGrid, Lock, Martini, PackageSearch, RefreshCw, Settings, SlidersHorizontal, Truck, WalletCards';
    if(!c.includes(iconAnchor))throw new Error(`${rel}: lucide icon anchor missing`);
    c=c.replace(iconAnchor,'BedDouble, '+iconAnchor);
    const importAnchor="import { NativeImportCenterView } from './NativeImportCenterView';";
    if(!c.includes(importAnchor))throw new Error(`${rel}: import-center import anchor missing`);
    c=c.replace(importAnchor,importAnchor+"\nimport { NativeRoomsView } from './NativeRoomsView';");
    const routeAnchor="  {id:'imports',label:'Import Center',permission:'data.import.view',icon:FileSpreadsheet,help:'master-data'},";
    if(!c.includes(routeAnchor))throw new Error(`${rel}: imports route anchor missing`);
    c=c.replace(routeAnchor,routeAnchor+"\n  {id:'rooms',label:'Rooms',permission:'rooms.view',icon:BedDouble,help:'rooms-engine'},");
    const contentAnchor="tab==='imports'?<NativeImportCenterView/>:tab==='tender'";
    if(!c.includes(contentAnchor))throw new Error(`${rel}: content route anchor missing`);
    c=c.replace(contentAnchor,"tab==='imports'?<NativeImportCenterView/>:tab==='rooms'?<NativeRoomsView/>:tab==='tender'");
    changed=true;
  }
  if(changed){write(rel,c);console.log(`Patched: ${rel}`)}else console.log(`Already patched: ${rel}`);
}

// Correct the canonical outlet/stock-location dependency example introduced in Patch 04.
{
  const rel='import-templates/stock_locations.csv';
  if(read(rel)!==p.stockLocationCsv){backup(rel);write(rel,p.stockLocationCsv);console.log(`Updated: ${rel}`)}
  else console.log(`Already updated: ${rel}`);

  const ts='src/native/importTemplates.ts';let c=read(ts);
  const oldRow='stock-main,Main Store,outlet-main,MAIN,true';
  const newRow='stock-main,Main Store,,MAIN,true';
  if(c.includes(oldRow)){backup(ts);c=c.replace(oldRow,newRow);write(ts,c);console.log(`Updated: ${ts}`)}
  else if(!c.includes(newRow))throw new Error(`${ts}: stock-location template anchor missing`);
}

// Import Center copy: correct dependency order and Rooms state.
{
  const rel='src/native/NativeImportCenterView.tsx';let c=read(rel),changed=false;
  const old='Dependency order: outlets/identity → stock locations → inventory stock masters → products. Rooms and Assets remain staging-only until their native domain patches.';
  const next='Dependency order: business → stock locations → outlets → inventory stock masters → products. Room types, rooms and rate plans now apply through the native Rooms engine; hotel services wait for Folios and Assets remain staged.';
  if(c.includes(old)){backup(rel);c=c.replace(old,next);changed=true}
  if(changed){write(rel,c);console.log(`Updated: ${rel}`)}else if(!c.includes(next))console.log(`Copy anchor not found in ${rel}; no functional change required.`);
}

// Patch 04 regression now expects hotel services, not room types, to remain deferred.
{
  const rel='src-tauri/src/tests.rs';let c=read(rel),changed=false;
  if(c.includes(p.oldDeferredTest)){backup(rel);c=c.replace(p.oldDeferredTest,p.newDeferredTest);changed=true}
  else if(!c.includes('service_plan["steps"][0]["reason"]'))throw new Error(`${rel}: Patch 04 deferred-domain test anchor missing`);
  if(!c.includes(PATCH)){
    const anchor='#[test]\nfn audit_cannot_be_modified()';
    if((c.split(anchor).length-1)!==1)throw new Error(`${rel}: audit test anchor missing/ambiguous`);
    if(!changed)backup(rel);
    c=c.replace(anchor,p.rustTests+'\n'+anchor);changed=true;
  }
  if(changed){write(rel,c);console.log(`Patched tests: ${rel}`)}else console.log(`Already patched tests: ${rel}`);
}

// Update controlled-import architecture note.
{
  const rel='docs/CONTROLLED_IMPORT_MIGRATION.md';let c=read(rel);
  const old='Rooms/PMS stays staged until Patch 05. Assets stay staged until Patch 08.';
  const next='Room types, rooms and rate plans apply through the Patch 05 native Rooms engine. Hotel services remain staged until Patch 07 Folios. Assets stay staged until Patch 08.';
  if(c.includes(old)){backup(rel);c=c.replace(old,next);write(rel,c);console.log(`Updated: ${rel}`)}
}

console.log('');
console.log('Patch 05 Native Rooms Engine applied/repaired.');
console.log(`Backups: ${backupRoot}`);
console.log('No business SQLite database was opened by this applicator. No Supabase endpoint was contacted.');
console.log('Run the full validation gate before committing.');
