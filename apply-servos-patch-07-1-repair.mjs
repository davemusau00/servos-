import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(process.argv[2]||process.cwd());
const stamp=new Date().toISOString().replace(/[:.]/g,'-');
const backupRoot=path.join(root,`.servos-patch-07-1-backup-${stamp}`);
const f=rel=>path.join(root,rel);
const read=rel=>fs.readFileSync(f(rel),'utf8');
const write=(rel,c)=>fs.writeFileSync(f(rel),c,'utf8');
function backup(rel){
  const dst=path.join(backupRoot,rel);
  fs.mkdirSync(path.dirname(dst),{recursive:true});
  if(!fs.existsSync(dst))fs.copyFileSync(f(rel),dst);
}
function patch(rel,fn){
  const before=read(rel);
  const after=fn(before);
  if(after===before){console.log(`Already repaired: ${rel}`);return;}
  backup(rel);write(rel,after);console.log(`Repaired: ${rel}`);
}
function replaceOne(c,oldText,newText,label){
  if(c.includes(newText))return c;
  const count=c.split(oldText).length-1;
  if(count!==1)throw new Error(`${label}: expected one old anchor, found ${count}`);
  return c.replace(oldText,newText);
}

for(const rel of [
  'src-tauri/src/store.rs','src-tauri/src/tests.rs',
  'tests/bar-v2-source.test.mjs','tests/front-desk-source.test.mjs','tests/rooms-engine-source.test.mjs',
  'tests/folios-source.test.mjs'
]){
  if(!fs.existsSync(f(rel)))throw new Error(`Missing expected Patch 07 file: ${rel}`);
}
if(!read('src-tauri/src/store.rs').includes('SERVOS_PATCH_07_FOLIOS'))throw new Error('Patch 07 must be applied before Patch 07.1.');

// 1. Real source fix: Patch 07 financial operations must remain behind native Go Live.
patch('src-tauri/src/store.rs',c=>{
  const marker='"stay.checkIn","stay.move","stay.extend","stay.checkOut","folio.open","folio.postAccommodation","folio.postService","folio.deposit","folio.pay","folio.applyDeposit","folio.refundDeposit","folio.reverse","pos.roomCharge"';
  if(c.includes(marker))return c;
  const old='"stay.checkIn","stay.move"';
  const count=c.split(old).length-1;
  if(count<1)throw new Error('store.rs: live_required stay.move anchor missing');
  const start=c.indexOf('fn live_required(');
  const end=c.indexOf('fn verify_staff_pin',start);
  if(start<0||end<0)throw new Error('store.rs: live_required block missing');
  const block=c.slice(start,end);
  if(!block.includes(old))throw new Error('store.rs: live_required does not contain expected Patch 06 tail');
  const repaired=block.replace(old,marker);
  return c.slice(0,start)+repaired+c.slice(end);
});

// 2. ROOM_CHARGE is no longer a legacy demo convention. It is a real internal tender.
patch('tests/bar-v2-source.test.mjs',c=>{
  c=c.replace(/,\s*'ROOM_CHARGE'/g,'').replace(/'ROOM_CHARGE',\s*/g,'');
  return c;
});

// 3. Front Desk acceptance now expects real checkout, not the Patch 06 placeholder.
patch('tests/front-desk-source.test.mjs',c=>{
  c=c.replace(
    "test('front desk exposes tape chart, arrivals, check-in and room moves without fake checkout',()=>{",
    "test('front desk exposes tape chart, arrivals, check-in, room moves and conserved checkout',()=>{"
  );
  c=c.replace(/assert\.match\(view,\/Checkout[^;]*P07\/\);/g,
    "assert.match(view,/stay\\.checkOut/);\n  assert.match(view,/Checkout conservation active/);");
  c=c.replace(/assert\.match\(store,\/SETTLEMENT_REQUIRED: stay extension and checkout\/\);/g,
    "assert.match(store,/SETTLEMENT_REQUIRED/);\n  assert.match(store,/folio\\.postAccommodation/);");
  return c;
});

// 4. Rooms source acceptance promotes hotel services into Patch 07.
patch('tests/rooms-engine-source.test.mjs',c=>{
  c=c.replace(
    "test('rooms route is permission gated and hotel services remain deferred',()=>{",
    "test('rooms route is permission gated and hotel services are owned by Patch 07 folios',()=>{"
  );
  c=c.replace(/assert\.match\(store,\/Hotel services remain staged until Patch 07 Folios\/\);/g,
    "assert.match(store,/hotelService\\.save/);\n  assert.match(store,/SERVOS_PATCH_07_FOLIOS/);");
  return c;
});

// 5. Patch 07 source test also guards the Go-Live boundary so this regression cannot recur.
patch('tests/folios-source.test.mjs',c=>{
  if(c.includes("Patch 07 money operations remain behind native Go Live"))return c;
  return c.trimEnd()+`
test('Patch 07 money operations remain behind native Go Live',()=>{
  const store=readFileSync('src-tauri/src/store.rs','utf8');
  const start=store.indexOf('fn live_required');
  const end=store.indexOf('fn verify_staff_pin',start);
  const gate=store.slice(start,end);
  for(const operation of ['stay.extend','stay.checkOut','folio.open','folio.postAccommodation','folio.postService','folio.deposit','folio.pay','folio.applyDeposit','folio.refundDeposit','folio.reverse','pos.roomCharge']){
    assert.ok(gate.includes(\`"\${operation}"\`),operation);
  }
});
`+"\n";
});

// 6. Migrate stale Rust acceptance expectations.
patch('src-tauri/src/tests.rs',c=>{
  // Hotel services are now executable through hotelService.save.
  c=c.replace(
    'fn controlled_import_blocks_live_opening_inventory_and_deferred_domains() {',
    'fn controlled_import_blocks_live_opening_inventory_and_promotes_hotel_services() {'
  );
  const oldService=`    assert_eq!(service_plan["status"],"BLOCKED");
    assert!(service_plan["steps"][0]["reason"].as_str().unwrap().contains("Patch 07"));`;
  const newService=`    assert_eq!(service_plan["status"],"READY");
    assert_eq!(service_plan["steps"][0]["operation"],"hotelService.save");
    let service_plan_id=service_plan["id"].as_str().unwrap().to_string();
    assert_eq!(import_apply(&mut db,&s.token,&service_plan_id).unwrap()["status"],"APPLIED");
    assert_eq!(list(&db,"hotelServices").unwrap().len(),1);`;
  if(c.includes(oldService))c=c.replace(oldService,newService);

  // Check-in now posts the due accommodation period atomically.
  c=c.replace(
    'fn front_desk_check_in_creates_stay_and_zero_value_folio_atomically() {',
    'fn front_desk_check_in_creates_stay_folio_and_due_accommodation_atomically() {'
  );
  const oldFolio='    assert_eq!(folio["balanceMinor"],0);assert_eq!(folio["depositMinor"],0);assert_eq!(folio["status"],"OPEN");';
  const newFolio=`    assert_eq!(folio["balanceMinor"],12000);assert_eq!(folio["depositMinor"],0);assert_eq!(folio["status"],"OPEN");
    assert_eq!(list(&db,"folioEntries").unwrap().iter().filter(|r|r["data"]["sourceType"]=="ACCOMMODATION").count(),1);`;
  if(c.includes(oldFolio))c=c.replace(oldFolio,newFolio);

  // Room moves now protect the concurrently mutable folio with a baseline.
  const oldMove=`    let (sv,_)=get(&db,"stays","move-res").unwrap();let (rv,_)=get(&db,"roomReservations","move-res").unwrap();let (av,_)=get(&db,"rooms","move-a").unwrap();let (bv,_)=get(&db,"rooms","move-b").unwrap();
    let mut moving=cmd("stay.move",json!({"id":"move-res","destinationRoomId":"move-b","reservationVersion":rv,"currentRoomVersion":av,"destinationRoomVersion":bv,"reason":"Guest request"}));`;
  const newMove=`    let (sv,_)=get(&db,"stays","move-res").unwrap();let (rv,_)=get(&db,"roomReservations","move-res").unwrap();let (fv,_)=get(&db,"folios","move-res").unwrap();let (av,_)=get(&db,"rooms","move-a").unwrap();let (bv,_)=get(&db,"rooms","move-b").unwrap();
    let mut moving=cmd("stay.move",json!({"id":"move-res","destinationRoomId":"move-b","reservationVersion":rv,"folioVersion":fv,"currentRoomVersion":av,"destinationRoomVersion":bv,"reason":"Guest request"}));`;
  if(c.includes(oldMove))c=c.replace(oldMove,newMove);

  // Replace the old placeholder-checkout assertion with a real financially incomplete checkout.
  const oldCheckout=`    let mut checkout=cmd("stay.checkOut",json!({"id":"gate-res"}));checkout.target_version=Some(0);assert!(execute(&mut db,&s.token,checkout).unwrap_err().contains("Patch 07"));`;
  const newCheckout=`    let (rv,_)=get(&db,"roomReservations","gate-res").unwrap();let mut cancel=cmd("roomReservation.cancel",json!({"id":"gate-res","reason":"Early-arrival gate test complete"}));cancel.target_version=Some(rv);execute(&mut db,&s.token,cancel).unwrap();
    let current_arrival=(chrono::Utc::now()-chrono::Duration::minutes(5)).to_rfc3339();
    let current_departure=(chrono::Utc::now()+chrono::Duration::days(1)).to_rfc3339();
    run(&mut db,&s,"roomReservation.create",json!({"id":"gate-live","roomId":"gate-room","ratePlanId":"gate-rate","customerId":"gate-guest","guests":1,"startsAt":current_arrival,"endsAt":current_departure}));
    let (rv,_)=get(&db,"roomReservations","gate-live").unwrap();let (roomv,_)=get(&db,"rooms","gate-room").unwrap();
    let mut checkin=cmd("stay.checkIn",json!({"id":"gate-live","roomVersion":roomv}));checkin.target_version=Some(rv);execute(&mut db,&s.token,checkin).unwrap();
    let (sv,_)=get(&db,"stays","gate-live").unwrap();let (rv,res)=get(&db,"roomReservations","gate-live").unwrap();let (fv,_)=get(&db,"folios","gate-live").unwrap();let (roomv,_)=get(&db,"rooms",res["roomId"].as_str().unwrap()).unwrap();
    let mut checkout=cmd("stay.checkOut",json!({"id":"gate-live","reservationVersion":rv,"folioVersion":fv,"roomVersion":roomv}));checkout.target_version=Some(sv);
    assert!(execute(&mut db,&s.token,checkout).unwrap_err().contains("SETTLEMENT_REQUIRED"));`;
  if(c.includes(oldCheckout))c=c.replace(oldCheckout,newCheckout);

  // Strengthen the existing pre-live runtime test with Patch 07 operations.
  const gateAnchor=`    assert!(execute(&mut db, &session.token, cmd("order.create", json!({"outletId":"missing","name":"Nope"}))).is_err());
}`;
  const gateNew=`    assert!(execute(&mut db, &session.token, cmd("order.create", json!({"outletId":"missing","name":"Nope"}))).is_err());
    for operation in ["folio.open","folio.deposit","folio.pay","stay.extend","stay.checkOut","pos.roomCharge"] {
        let blocked=execute(&mut db,&session.token,cmd(operation,json!({"id":"missing","orderId":"missing"}))).unwrap_err();
        assert!(blocked.contains("Complete business setup"),"{operation}: {blocked}");
    }
}`;
  if(c.includes(gateAnchor)&&!c.includes('for operation in ["folio.open","folio.deposit"'))c=c.replace(gateAnchor,gateNew);

  return c;
});

console.log('');
console.log('Patch 07.1 repair complete.');
console.log(`Backups: ${backupRoot}`);
console.log('No business SQLite database was opened. No Supabase endpoint was contacted.');
console.log('Next: npm test ; npm run test:native ; npm run test:desktop');
