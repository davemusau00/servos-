import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(process.argv[2]||process.cwd());
const p=JSON.parse(fs.readFileSync(new URL('./patch08_payload.json',import.meta.url),'utf8'));
const PATCH='SERVOS_PATCH_08_ASSETS_MAINTENANCE';
const stamp=new Date().toISOString().replace(/[:.]/g,'-');
const backupRoot=path.join(root,`.servos-patch-08-backup-${stamp}`);
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
  'src/native/NativeImportCenterView.tsx','docs/CONTROLLED_IMPORT_MIGRATION.md'
]){
  if(!fs.existsSync(f(rel)))throw new Error(`Missing expected Patch 07 file: ${rel}`);
}
const initialStore=read('src-tauri/src/store.rs');
if(!initialStore.includes('SERVOS_PATCH_07_FOLIOS'))throw new Error('Patch 08 requires Patch 07 Folios.');
if(!initialStore.includes('"folio.deposit"')||!initialStore.includes('"pos.roomCharge"'))throw new Error('Patch 08 requires the Patch 07.1 financial Go-Live repair locally.');

create('src-tauri/migrations/007_assets_maintenance.sql',p.migration);
create('docs/user-guide/38-assets-maintenance-domain.md',p.guide);
create('tests/assets-source.test.mjs',p.nodeTests);

// Rust store.
{
  const rel='src-tauri/src/store.rs';let c=read(rel),changed=false;

  if(c.includes('if version > 6 {')){backup(rel);c=c.replace('if version > 6 {','if version > 7 {');changed=true}
  else if(!c.includes('if version > 7 {'))throw new Error(`${rel}: schema ceiling anchor missing`);

  if(!c.includes('007_assets_maintenance.sql')){
    if(!changed)backup(rel);
    const anchor=`    if version < 6 {
        db.execute_batch(include_str!("../migrations/006_folios.sql")).map_err(error)?;
    }
    Ok(db)`;
    if(!c.includes(anchor))throw new Error(`${rel}: migration 006 anchor missing`);
    c=c.replace(anchor,`    if version < 6 {
        db.execute_batch(include_str!("../migrations/006_folios.sql")).map_err(error)?;
    }
    if version < 7 {
        db.execute_batch(include_str!("../migrations/007_assets_maintenance.sql")).map_err(error)?;
    }
    Ok(db)`);
    changed=true;
  }

  if(!c.includes('"assets.view","assets.manage","assets.operate","maintenance.view","maintenance.manage"')){
    if(!changed)backup(rel);
    const anchor='"folio.view","folio.manage","folio.reverse","folio.room_charge","kds.view","kds.update",';
    if(!c.includes(anchor))throw new Error(`${rel}: Patch 07 permission anchor missing`);
    c=c.replace(anchor,'"folio.view","folio.manage","folio.reverse","folio.room_charge","assets.view","assets.manage","assets.operate","maintenance.view","maintenance.manage","kds.view","kds.update",');
    changed=true;
  }

  if(!c.includes(PATCH)){
    if(!changed)backup(rel);
    const anchor='fn folio_execute(tx:&Transaction,user:&Session,cmd:&BusinessCommand,changes:&mut Vec<Value>)->Result<bool>{';
    if((c.split(anchor).length-1)!==1)throw new Error(`${rel}: folio_execute anchor missing/ambiguous`);
    c=c.replace(anchor,p.engine+'\n'+anchor);
    changed=true;
  }

  // Domain dispatch.
  if(!c.includes('if asset_execute(&tx,user,&cmd,&mut changes)?')){
    if(!changed)backup(rel);
    const anchor='    if folio_execute(&tx,user,&cmd,&mut changes)? {';
    if((c.split(anchor).length-1)!==1)throw new Error(`${rel}: folio dispatch anchor missing/ambiguous`);
    c=c.replace(anchor,`    if asset_execute(&tx,user,&cmd,&mut changes)? {
        let result=finish(&tx,&cmd,&user.staff_id,changes)?;
        tx.commit().map_err(error)?;
        return Ok(result);
    }
`+anchor);
    changed=true;
  }

  // Append operational lifecycle to the native Go-Live trading gate.
  const liveStart=c.indexOf('fn live_required(');
  const liveEnd=c.indexOf('fn verify_staff_pin',liveStart);
  if(liveStart<0||liveEnd<0)throw new Error(`${rel}: live_required block missing`);
  let live=c.slice(liveStart,liveEnd);
  const liveOps=['asset.assign','asset.return','asset.transfer','asset.inspect','asset.lose','asset.retire','asset.dispose','maintenance.report','maintenance.assign','maintenance.start','maintenance.complete','maintenance.cancel'];
  if(liveOps.some(op=>!live.includes(`"${op}"`))){
    if(!changed)backup(rel);
    const close=live.lastIndexOf('];');
    if(close<0)throw new Error(`${rel}: live_required TRADING array terminator missing`);
    const suffix=','+liveOps.filter(op=>!live.includes(`"${op}"`)).map(op=>`"${op}"`).join(',');
    live=live.slice(0,close).replace(/\s+$/,'')+suffix+live.slice(close);
    c=c.slice(0,liveStart)+live+c.slice(liveEnd);
    changed=true;
  }

  // Room blocks may now reference open maintenance, and release waits for maintenance closure.
  const oldLink=`            if p.get("maintenanceOrderId").and_then(Value::as_str).is_some_and(|v|!v.trim().is_empty()){
                return Err("Maintenance-linked room blocks are enabled with the Assets & Maintenance domain in Patch 08".into());
            }
            room_available(tx,room_id,start,end,None)?;
            put(tx,"roomBlocks",&key,json!({
                "id":key,"roomId":room_id,"startsAt":start.to_rfc3339(),"endsAt":end.to_rfc3339(),
                "reason":text(p,"reason")?,"status":"ACTIVE","createdAt":now(),"createdBy":user.staff_id
            }),changes)?;`;
  if(c.includes(oldLink)){
    if(!changed)backup(rel);c=c.replace(oldLink,p.roomLinkage);changed=true;
  }else if(!c.includes('"maintenanceOrderId":maintenance_order_id')){
    throw new Error(`${rel}: Patch 05 room.block maintenance anchor missing`);
  }

  const oldUnblock=`            data["status"]=json!("RELEASED");data["releasedAt"]=json!(now());data["inspection"]=json!(text(p,"inspection")?);data["releasedBy"]=json!(user.staff_id);`;
  if(!c.includes('resolve maintenance before inspection/release')){
    if(!changed)backup(rel);
    if((c.split(oldUnblock).length-1)!==1)throw new Error(`${rel}: room.unblock release anchor missing/ambiguous`);
    c=c.replace(oldUnblock,p.roomUnblockGuard);changed=true;
  }

  // Promote asset CSVs.
  const oldImport=`    if ["asset_categories","assets"].contains(&template_key) {
        one("BLOCKED",None,None,None,None,None,
            "This staged dataset is reserved for Patch 08 Assets so custody, maintenance and lifecycle invariants exist before application.".into(),None,None);
        return Ok(steps);
    }
`;
  if(c.includes(oldImport)){
    if(!changed)backup(rel);c=c.replace(oldImport,p.importBranch);changed=true;
  }else if(!c.includes('Apply through the native Assets domain')){
    throw new Error(`${rel}: Patch 08 asset import deferral anchor missing`);
  }

  if(changed){write(rel,c);console.log(`Patched: ${rel}`)}else console.log(`Already patched: ${rel}`);
}

// TypeScript permission union.
{
  const rel='src/types/runtime.ts';let c=read(rel);
  if(!c.includes("'assets.view'")){
    backup(rel);
    const anchor="  | 'folio.view' | 'folio.manage' | 'folio.reverse' | 'folio.room_charge'\n";
    if(!c.includes(anchor))throw new Error(`${rel}: folio permission union anchor missing`);
    c=c.replace(anchor,anchor+"  | 'assets.view' | 'assets.manage' | 'assets.operate' | 'maintenance.view' | 'maintenance.manage'\n");
    write(rel,c);console.log(`Patched: ${rel}`);
  }else console.log(`Already patched: ${rel}`);
}

// Import Center copy.
{
  const rel='src/native/NativeImportCenterView.tsx';let c=read(rel);
  const old='Room types, rooms, rate plans and hotel services now apply through native Rooms/Folios commands; Assets remain staged.';
  const next='Room types, rooms, rate plans, hotel services, asset categories and assets now apply through their native domain commands.';
  if(c.includes(old)){backup(rel);c=c.replace(old,next);write(rel,c);console.log(`Updated: ${rel}`)}
  else if(!c.includes(next))console.log(`Import Center copy anchor not found in ${rel}; no functional dependency.`);
}
{
  const rel='docs/CONTROLLED_IMPORT_MIGRATION.md';let c=read(rel);
  const old='Room types, rooms and rate plans apply through the native Rooms engine. Hotel services apply through Patch 07 Folios with price/tax snapshots. Assets stay staged until Patch 08.';
  const next='Room types, rooms and rate plans apply through the native Rooms engine. Hotel services apply through Folios with price/tax snapshots. Asset categories and assets apply through Patch 08 with permanent tags, location/custody rules and lifecycle invariants.';
  if(c.includes(old)){backup(rel);c=c.replace(old,next);write(rel,c);console.log(`Updated: ${rel}`)}
}

// Data dictionary note if present.
{
  const rel='docs/DATA_DICTIONARY.md';
  if(fs.existsSync(f(rel))){
    let c=read(rel);
    if(!c.includes('- `assets`: permanent unique asset tag')){
      backup(rel);
      const anchor='- `roomBlocks`: room/time interval, reason, optional shared maintenance order and explicit inspected release. Completing maintenance does not silently release a room.';
      const addition=anchor+`\n- \`assetCategories\`: category code/name plus depreciation method and useful life metadata.\n- \`assets\`: permanent unique asset tag, category, physical room/stock location, acquisition metadata, condition, custodian and terminal lifecycle state. Location/custody/lifecycle changes use dedicated commands.\n- \`assetEvents\`: immutable before/after evidence for every native asset operation.\n- \`maintenanceOrders\`: asset/room work order with priority and REPORTED / ASSIGNED / IN_PROGRESS / COMPLETED / CANCELLED lifecycle. Completion can consume stock parts and create supplier payables atomically.\n- \`maintenanceEvents\`: immutable work-order transition evidence.`;
      if(c.includes(anchor)){c=c.replace(anchor,addition);write(rel,c);console.log(`Updated: ${rel}`)}
    }
  }
}

// Rust regression tests.
insertBefore('src-tauri/src/tests.rs',PATCH,'#[test]\nfn audit_cannot_be_modified()',p.rustTests);

console.log('');
console.log('Patch 08 Native Assets & Maintenance Domain applied/repaired.');
console.log(`Backups: ${backupRoot}`);
console.log('No business SQLite database was opened by this applicator. No Supabase endpoint was contacted.');
console.log('Run the full validation gate before committing.');
