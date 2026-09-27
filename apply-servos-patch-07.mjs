import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(process.argv[2]||process.cwd());
const p=JSON.parse(fs.readFileSync(new URL('./patch07_payload.json',import.meta.url),'utf8'));
const PATCH='SERVOS_PATCH_07_FOLIOS';
const stamp=new Date().toISOString().replace(/[:.]/g,'-');
const backupRoot=path.join(root,`.servos-patch-07-backup-${stamp}`);
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
  'src/native/NativeBarShell.tsx','src/native/NativePOSView.tsx','src/native/NativeFrontDeskView.tsx',
  'src/native/NativeImportCenterView.tsx','docs/CONTROLLED_IMPORT_MIGRATION.md'
]){
  if(!fs.existsSync(f(rel)))throw new Error(`Missing expected Patch 06 file: ${rel}`);
}
if(!read('src-tauri/src/store.rs').includes('SERVOS_PATCH_06_FRONT_DESK'))throw new Error('Patch 07 requires Patch 06 Front Desk source locally.');

create('src-tauri/migrations/006_folios.sql',p.migration);
create('src/native/NativeFoliosView.tsx',p.foliosUi,PATCH);
create('docs/user-guide/37-folios.md',p.guide);
create('tests/folios-source.test.mjs',p.nodeTests);

// Store: migration, permissions, folio engine, room lifecycle integration and reporting.
{
  const rel='src-tauri/src/store.rs';let c=read(rel),changed=false;
  if(c.includes('if version > 5 {')){backup(rel);c=c.replace('if version > 5 {','if version > 6 {');changed=true}
  if(!c.includes('006_folios.sql')){
    if(!changed)backup(rel);
    const anchor=`    if version < 5 {
        db.execute_batch(include_str!("../migrations/005_import_apply.sql")).map_err(error)?;
    }
    Ok(db)`;
    if(!c.includes(anchor))throw new Error(`${rel}: migration 005 anchor missing`);
    c=c.replace(anchor,`    if version < 5 {
        db.execute_batch(include_str!("../migrations/005_import_apply.sql")).map_err(error)?;
    }
    if version < 6 {
        db.execute_batch(include_str!("../migrations/006_folios.sql")).map_err(error)?;
    }
    Ok(db)`);
    changed=true;
  }

  if(!c.includes('"folio.view","folio.manage","folio.reverse","folio.room_charge"')){
    if(!changed)backup(rel);
    const anchor='"floorplan.view","floorplan.manage","rooms.view","rooms.manage","rooms.operate","rooms.guests.view","kds.view","kds.update",';
    if(!c.includes(anchor))throw new Error(`${rel}: rooms permission anchor missing`);
    c=c.replace(anchor,'"floorplan.view","floorplan.manage","rooms.view","rooms.manage","rooms.operate","rooms.guests.view","folio.view","folio.manage","folio.reverse","folio.room_charge","kds.view","kds.update",');
    const serverAnchor='"catalog.view","inventory.view","procurement.view","procurement.receive","floorplan.view","kds.view","kds.update","help.view"';
    if(!c.includes(serverAnchor))throw new Error(`${rel}: Server permission anchor missing`);
    c=c.replace(serverAnchor,'"catalog.view","inventory.view","procurement.view","procurement.receive","floorplan.view","folio.room_charge","kds.view","kds.update","help.view"');
    changed=true;
  }

  if(!c.includes(PATCH)){
    if(!changed)backup(rel);
    const anchor='fn room_execute(tx:&Transaction,user:&Session,cmd:&BusinessCommand,changes:&mut Vec<Value>)->Result<bool>{';
    if((c.split(anchor).length-1)!==1)throw new Error(`${rel}: room_execute anchor missing/ambiguous`);
    c=c.replace(anchor,p.folioCode+'\n'+anchor);
    changed=true;
  }

  // Check-in reuses pre-arrival folio with an explicit baseline and posts due accommodation.
  const oldCheckin=`                if let Some((_,folio,archived))=room_any(tx,"folios",&key)?{
                    if archived||folio["status"].as_str()!=Some("OPEN")||folio["customerId"]!=reservation.1["customerId"]{
                        return Err("INVALID_STATE: existing reservation folio is not compatible with check-in".into());
                    }
                }else{
                    put(tx,"folios",&key,json!({
                        "id":key,"reservationId":key,"stayId":key,"customerId":reservation.1["customerId"],
                        "status":"OPEN","balanceMinor":0,"depositMinor":0,"createdAt":stamp,"openedBy":user.staff_id
                    }),changes)?;
                }`;
  const newCheckin=`                if let Some((folio_version,folio,archived))=room_any(tx,"folios",&key)?{
                    if p["folioVersion"].as_i64()!=Some(folio_version){return Err("CONFLICT: Folio changed; reload before check-in".into());}
                    if archived||folio["status"].as_str()!=Some("OPEN")||folio["customerId"]!=reservation.1["customerId"]{
                        return Err("INVALID_STATE: existing reservation folio is not compatible with check-in".into());
                    }
                }else{
                    if p.get("folioVersion").is_some_and(|v|!v.is_null()){return Err("CONFLICT: Folio appeared after the screen loaded".into());}
                    put(tx,"folios",&key,json!({
                        "id":key,"reservationId":key,"stayId":key,"customerId":reservation.1["customerId"],
                        "currency":"KES","status":"OPEN","balanceMinor":0,"depositMinor":0,"createdAt":stamp,"openedBy":user.staff_id
                    }),changes)?;
                }
                folio_post_accommodation(tx,&key,false,changes)?;`;
  if(c.includes(oldCheckin)){if(!changed)backup(rel);c=c.replace(oldCheckin,newCheckin);changed=true}
  else if(!c.includes('folio_post_accommodation(tx,&key,false,changes)?'))throw new Error(`${rel}: Patch 06 check-in folio anchor missing`);

  // Room moves require the same open folio baseline.
  const moveAnchor=`                if reservation.0!=reservation_version||reservation.1["status"].as_str()!=Some("CHECKED_IN"){return Err("CONFLICT: Reservation changed; reload before room move".into());}
                let old_room_id=text(&stay.1,"roomId")?.to_string();`;
  const moveNext=`                if reservation.0!=reservation_version||reservation.1["status"].as_str()!=Some("CHECKED_IN"){return Err("CONFLICT: Reservation changed; reload before room move".into());}
                let folio=room_any(tx,"folios",&key)?.ok_or("Folio not found")?;
                if p["folioVersion"].as_i64()!=Some(folio.0)||folio.2||folio.1["status"].as_str()!=Some("OPEN"){return Err("CONFLICT: Folio changed or is closed; reload before room move".into());}
                let old_room_id=text(&stay.1,"roomId")?.to_string();`;
  if(c.includes(moveAnchor)){if(!changed)backup(rel);c=c.replace(moveAnchor,moveNext);changed=true}
  else if(!c.includes('Folio changed or is closed; reload before room move'))throw new Error(`${rel}: Patch 06 move anchor missing`);

  const gated=`            "stay.extend"|"stay.checkOut"=>{
                return Err("SETTLEMENT_REQUIRED: stay extension and checkout are enabled with Patch 07 Folios".into());
            }`;
  if(c.includes(gated)){if(!changed)backup(rel);c=c.replace(gated,p.stayReplace);changed=true}
  else if(!c.includes('"stay.checkOut"=>'))throw new Error(`${rel}: Patch 06 stay gate anchor missing`);

  // Dispatch folio commands before room-domain dispatch. POS room charge captures the normal immutable POS receipt.
  const dispatch=`    live_required(&tx, &cmd.operation)?;
    if room_execute(&tx,user,&cmd,&mut changes)? {`;
  const dispatchNext=`    live_required(&tx, &cmd.operation)?;
    if folio_execute(&tx,user,&cmd,&mut changes)? {
        if cmd.operation=="pos.roomCharge" { receipts::capture(&tx,user,text(p,"orderId")?,&cmd.id,&mut changes)?; }
        let result=finish(&tx,&cmd,&user.staff_id,changes)?;
        tx.commit().map_err(error)?;
        return Ok(result);
    }
    if room_execute(&tx,user,&cmd,&mut changes)? {`;
  if(c.includes(dispatch)){if(!changed)backup(rel);c=c.replace(dispatch,dispatchNext);changed=true}
  else if(!c.includes('if folio_execute(&tx,user,&cmd,&mut changes)?'))throw new Error(`${rel}: execute dispatch anchor missing`);

  // Folio/stay financial operations are live trading.
  const liveOld='"table.ready","closeDay.generate","roomReservation.create","roomReservation.update","roomReservation.cancel","roomReservation.noShow","stay.checkIn","stay.move"';
  const liveNew='"table.ready","closeDay.generate","roomReservation.create","roomReservation.update","roomReservation.cancel","roomReservation.noShow","stay.checkIn","stay.move","stay.extend","stay.checkOut","folio.open","folio.postAccommodation","folio.postService","folio.deposit","folio.pay","folio.applyDeposit","folio.refundDeposit","folio.reverse","pos.roomCharge"';
  if(!c.includes('"folio.open"')&&c.includes(liveOld)){if(!changed)backup(rel);c=c.replace(liveOld,liveNew);changed=true}

  // Sanitize room-charge targets into snapshot for POS roles without exposing full folio/guest records.
  const pendingAnchor='    let pending:i64=db.query_row("SELECT COUNT(*) FROM outbox WHERE acknowledged_at IS NULL",[],|r|r.get(0)).map_err(error)?;';
  if(!c.includes('collection":"roomChargeTargets"')){
    if(!changed)backup(rel);
    if((c.split(pendingAnchor).length-1)!==1)throw new Error(`${rel}: snapshot pending anchor missing/ambiguous`);
    const derived=`    if permissions(&user.role).contains(&"folio.room_charge") {
        for folio_record in list(db,"folios")? {
            let data=&folio_record["data"];if data["status"].as_str()!=Some("OPEN"){continue;}
            let Some(folio_id)=folio_record["id"].as_str() else {continue;};
            let Ok((_,reservation))=get(db,"roomReservations",folio_id) else {continue;};
            let Ok((_,stay))=get(db,"stays",folio_id) else {continue;};
            if reservation["status"].as_str()!=Some("CHECKED_IN")||stay["status"].as_str()!=Some("CHECKED_IN"){continue;}
            let room=get(db,"rooms",reservation["roomId"].as_str().unwrap_or("")).map(|(_,v)|v).unwrap_or(json!({}));
            let customer=get(db,"customers",reservation["customerId"].as_str().unwrap_or("")).map(|(_,v)|v).unwrap_or(json!({}));
            records.push(json!({"collection":"roomChargeTargets","id":folio_id,"version":folio_record["version"],"data":{
                "id":folio_id,"folioId":folio_id,"folioVersion":folio_record["version"],"roomId":reservation["roomId"],
                "roomNumber":room["number"],"guestName":customer["name"],"balanceMinor":data["balanceMinor"]
            }}));
        }
    }
`;
    c=c.replace(pendingAnchor,derived+pendingAnchor);changed=true;
  }

  // Close-day: include native hotel revenue, attribute folio tenders to shift, but never count deposits as sales.
  const grossOld=`            let gross=orders.iter().map(|o|money(o,"grandTotal")).collect::<Result<Vec<_>>>()?.iter().sum::<i64>(); let tax=orders.iter().map(|o|money(o,"taxTotal")).collect::<Result<Vec<_>>>()?.iter().sum::<i64>(); let levy=orders.iter().map(|o|money(o,"cateringLevyTotal")).collect::<Result<Vec<_>>>()?.iter().sum::<i64>(); let discounts=orders.iter().map(|o|money(o,"discountTotal")).collect::<Result<Vec<_>>>()?.iter().sum::<i64>();`;
  const grossNew=`            let pos_gross=orders.iter().map(|o|money(o,"grandTotal")).collect::<Result<Vec<_>>>()?.iter().sum::<i64>(); let tax=orders.iter().map(|o|money(o,"taxTotal")).collect::<Result<Vec<_>>>()?.iter().sum::<i64>(); let levy=orders.iter().map(|o|money(o,"cateringLevyTotal")).collect::<Result<Vec<_>>>()?.iter().sum::<i64>(); let discounts=orders.iter().map(|o|money(o,"discountTotal")).collect::<Result<Vec<_>>>()?.iter().sum::<i64>();
            let hotel_entries:Vec<Value>=list(&tx,"folioEntries")?.into_iter().map(|r|r["data"].clone()).filter(|e|["CHARGE","REVERSAL"].contains(&e["kind"].as_str().unwrap_or(""))&&e["sourceType"].as_str()!=Some("POS")&&e["postedAt"].as_str().is_some_and(|t|t>=opened.as_str()&&t<=closed.as_str())).collect();
            let hotel_gross=hotel_entries.iter().map(|e|e["balanceDeltaMinor"].as_i64().unwrap_or(0)).sum::<i64>();let hotel_tax=hotel_entries.iter().map(|e|e["taxMinor"].as_i64().unwrap_or(0)).sum::<i64>();let gross=pos_gross+hotel_gross;`;
  if(c.includes(grossOld)){if(!changed)backup(rel);c=c.replace(grossOld,grossNew);changed=true}
  else if(!c.includes('let hotel_entries:Vec<Value>'))throw new Error(`${rel}: close-day gross anchor missing`);

  const refundOld=`            let refunds:Vec<Value>=list(&tx,"refunds")?.into_iter().map(|r|r["data"].clone()).filter(|r|r["refundedAt"].as_str().is_some_and(|t|t>=opened.as_str()&&t<=closed.as_str())).collect(); let refund_total=refunds.iter().map(|r|money(r,"amount")).collect::<Result<Vec<_>>>()?.iter().sum::<i64>();`;
  const refundNew=`            let refunds:Vec<Value>=list(&tx,"refunds")?.into_iter().map(|r|r["data"].clone()).filter(|r|r["kind"].as_str()!=Some("DEPOSIT_REFUND")&&r["refundedAt"].as_str().is_some_and(|t|t>=opened.as_str()&&t<=closed.as_str())).collect(); let refund_total=refunds.iter().map(|r|money(r,"amount")).collect::<Result<Vec<_>>>()?.iter().sum::<i64>();`;
  if(c.includes(refundOld)){if(!changed)backup(rel);c=c.replace(refundOld,refundNew);changed=true}

  const reportOld=`"sales":{"gross":gross as f64/100.0,"net":(gross-tax-levy-refund_total) as f64/100.0,"vat":tax as f64/100.0,"levy":levy as f64/100.0,"refunds":refund_total as f64/100.0}`;
  const reportNew=`"sales":{"gross":gross as f64/100.0,"net":(gross-tax-levy-hotel_tax-refund_total) as f64/100.0,"vat":tax as f64/100.0,"levy":levy as f64/100.0,"hotelTax":hotel_tax as f64/100.0,"hotelGross":hotel_gross as f64/100.0,"refunds":refund_total as f64/100.0}`;
  if(c.includes(reportOld)){if(!changed)backup(rel);c=c.replace(reportOld,reportNew);changed=true}

  if(changed){write(rel,c);console.log(`Patched: ${rel}`)}else console.log(`Already patched: ${rel}`);
}

// TypeScript permissions.
{
  const rel='src/types/runtime.ts';let c=read(rel);
  if(!c.includes("'folio.view'")){
    backup(rel);
    const anchor="  | 'rooms.view' | 'rooms.manage' | 'rooms.operate' | 'rooms.guests.view'\n";
    if(!c.includes(anchor))throw new Error(`${rel}: rooms permission union anchor missing`);
    c=c.replace(anchor,anchor+"  | 'folio.view' | 'folio.manage' | 'folio.reverse' | 'folio.room_charge'\n");
    write(rel,c);console.log(`Patched: ${rel}`);
  }else console.log(`Already patched: ${rel}`);
}

// Promote hotel_services.csv from staging-only to native folio service master.
{
  const rel='src-tauri/src/store.rs';let c=read(rel);
  const old=`    if template_key=="hotel_services" {
        one("BLOCKED",None,None,None,None,None,
            "Hotel services remain staged until Patch 07 Folios so service posting and price/tax snapshots are atomic.".into(),None,None);
        return Ok(steps);
    }
`;
  if(c.includes(old)){backup(rel);c=c.replace(old,p.hotelImport);write(rel,c);console.log(`Promoted hotel services import: ${rel}`)}
  else if(!c.includes('Apply through the native folio service master command'))throw new Error(`${rel}: hotel_services deferral anchor missing`);
}

// Front Desk becomes folio-aware and enables conserved checkout.
{
  const rel='src/native/NativeFrontDeskView.tsx';let c=read(rel),changed=false;
  const recordsOld="const rooms=recordsOf(s,'rooms'),types=recordsOf(s,'roomTypes'),reservations=recordsOf(s,'roomReservations'),customers=recordsOf(s,'customers'),blocks=recordsOf(s,'roomBlocks');";
  const recordsNew="const rooms=recordsOf(s,'rooms'),types=recordsOf(s,'roomTypes'),reservations=recordsOf(s,'roomReservations'),customers=recordsOf(s,'customers'),blocks=recordsOf(s,'roomBlocks'),folios=recordsOf(s,'folios');";
  if(!c.includes("roomChargeTargets=recordsOf(snapshot,'roomChargeTargets')")&&c.includes(recordsOld)){backup(rel);c=c.replace(recordsOld,recordsNew);changed=true}

  const checkOld="const checkIn=async(r:any)=>{const rr=recordOf(s,'roomReservations',r.id),room=recordOf(s,'rooms',r.roomId);if(!rr||!room)return;await command('stay.checkIn',{id:r.id,roomVersion:room.version},rr.version)};";
  const checkNew="const checkIn=async(r:any)=>{const rr=recordOf(s,'roomReservations',r.id),room=recordOf(s,'rooms',r.roomId),folio=recordOf(s,'folios',r.id);if(!rr||!room)return;await command('stay.checkIn',{id:r.id,roomVersion:room.version,...(folio?{folioVersion:folio.version}:{})},rr.version)};";
  if(c.includes(checkOld)){if(!changed)backup(rel);c=c.replace(checkOld,checkNew);changed=true}

  const moveOld="await command('stay.move',{id:move.id,destinationRoomId,reservationVersion:res.version,currentRoomVersion:oldRoom.version,destinationRoomVersion:dest.version,reason},stay.version)};";
  const moveNew="const folio=recordOf(s,'folios',move.id);if(!folio)return;await command('stay.move',{id:move.id,destinationRoomId,reservationVersion:res.version,folioVersion:folio.version,currentRoomVersion:oldRoom.version,destinationRoomVersion:dest.version,reason},stay.version)};";
  if(c.includes(moveOld)){if(!changed)backup(rel);c=c.replace(moveOld,moveNew);changed=true}

  const returnAnchor="\n\n  return <div className=\"h-full overflow-auto bg-slate-950 p-5 text-white\">";
  if(!c.includes("const checkOut=async")&&c.includes(returnAnchor)){
    if(!changed)backup(rel);
    const fn=`\n  const checkOut=async(r:any)=>{const stay=recordOf(s,'stays',r.id),res=recordOf(s,'roomReservations',r.id),folio=recordOf(s,'folios',r.id),room=recordOf(s,'rooms',r.roomId);if(!stay||!res||!folio||!room)return;await command('stay.checkOut',{id:r.id,reservationVersion:res.version,folioVersion:folio.version,roomVersion:room.version},stay.version)};`;
    c=c.replace(returnAnchor,fn+returnAnchor);changed=true;
  }

  const depOld=`<div className="flex gap-2">{r.status==='CHECKED_IN'&&canOperate&&<button className={buttonClass} onClick={()=>setMove(r)}><ArrowRightLeft className="mr-1 inline h-4 w-4"/>Move</button>}<button disabled className={buttonClass} title="Checkout requires Patch 07 Folios">Checkout · P07</button></div>`;
  const depNew=`<div className="flex flex-wrap items-center justify-end gap-2">{folios.find(f=>f.id===r.id)&&<span className="text-[11px] text-slate-500">Balance {money(Number(folios.find(f=>f.id===r.id)?.balanceMinor||0)/100)} · Deposit {money(Number(folios.find(f=>f.id===r.id)?.depositMinor||0)/100)}</span>}{r.status==='CHECKED_IN'&&canOperate&&<button className={buttonClass} onClick={()=>setMove(r)}><ArrowRightLeft className="mr-1 inline h-4 w-4"/>Move</button>}{r.status==='CHECKED_IN'&&canOperate&&<button className={primaryButtonClass} onClick={()=>void checkOut(r)}>Check out</button>}</div>`;
  if(c.includes(depOld)){if(!changed)backup(rel);c=c.replace(depOld,depNew);changed=true}

  const gateOld=`    <section className="mt-5 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4"><div className="flex gap-3"><ShieldAlert className="mt-0.5 h-5 w-5 text-amber-300"/><div><b className="text-amber-200">Checkout and paid extensions remain gated</b><p className="mt-1 text-xs text-slate-400">Check-in and room moves are live because they can preserve room/stay state and open a zero-value folio atomically. Checkout and extension change money state, so their buttons remain disabled until Patch 07 provides accommodation posting, deposits, settlement and conservation tests.</p></div></div></section>`;
  const gateNew=`    <section className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4"><div className="flex gap-3"><ShieldAlert className="mt-0.5 h-5 w-5 text-emerald-300"/><div><b className="text-emerald-200">Checkout conservation active</b><p className="mt-1 text-xs text-slate-400">Checkout now requires all booked accommodation posted, zero guest receivable and zero unapplied deposit. Use Folios to settle, apply/refund deposits, post services, or perform paid extensions.</p></div></div></section>`;
  if(c.includes(gateOld)){if(!changed)backup(rel);c=c.replace(gateOld,gateNew);changed=true}

  if(changed){write(rel,c);console.log(`Patched: ${rel}`)}else console.log(`Already patched: ${rel}`);
}

// POS room charge target + action.
{
  const rel='src/native/NativePOSView.tsx';let c=read(rel),changed=false;
  const recordsOld="const outlets=recordsOf(snapshot,'outlets'); const products=recordsOf(snapshot,'products'); const tables=recordsOf(snapshot,'tables'); const orders=recordsOf(snapshot,'orders'); const customers=recordsOf(snapshot,'customers');";
  const recordsNew="const outlets=recordsOf(snapshot,'outlets'); const products=recordsOf(snapshot,'products'); const tables=recordsOf(snapshot,'tables'); const orders=recordsOf(snapshot,'orders'); const customers=recordsOf(snapshot,'customers'); const roomChargeTargets=recordsOf(snapshot,'roomChargeTargets');";
  if(!c.includes("roomChargeTargets=recordsOf(snapshot,'roomChargeTargets')")&&c.includes(recordsOld)){backup(rel);c=c.replace(recordsOld,recordsNew);changed=true}

  const finishSplitEnd=`  const finishSplit=async(payments:any[])=>{
    if(!active)return;
    const amount=payments.reduce((sum,p)=>sum+Number(p.amount||0),0);
    const order={...active,amountPaid:Number(active.amountPaid||0)+amount,completedAt:new Date().toISOString()};
    try{
      const result=await runtime.command('payment.split',{orderId:active.id,payments});
      setModal({kind:'RECEIPT',data:{order,receiptId:result.recordIds.find(id=>id.startsWith('receipt-')),payment:{tenderType:payments.map(p=>p.method).join(' + '),amount}}});
    }catch(e){setNotice(String(e))}
  };`;
  if(!c.includes('const finishRoomCharge=async')&&c.includes(finishSplitEnd)){
    if(!changed)backup(rel);
    const add=`${finishSplitEnd}
  const finishRoomCharge=async(target:any)=>{
    if(!active)return;
    try{
      const result=await runtime.command('pos.roomCharge',{orderId:active.id,folioId:target.folioId,folioVersion:target.folioVersion},recordVersion(snapshot,'orders',active.id));
      const order={...active,amountPaid:Number(active.grandTotal||0),paymentMethod:'ROOM_CHARGE',completedAt:new Date().toISOString()};
      setModal({kind:'RECEIPT',data:{order,receiptId:result.recordIds.find(id=>id.startsWith('receipt-')),payment:{tenderType:'ROOM_CHARGE',amount:balance}}});
    }catch(e){setNotice(String(e))}
  };`;
    c=c.replace(finishSplitEnd,add);changed=true;
  }

  const buttonOld=`<button className={buttonClass} onClick={()=>setModal({kind:'SPLIT'})}><Split className="mr-1 inline h-4 w-4"/>Split tender</button>`;
  const buttonNew=buttonOld+`{perms.includes('folio.room_charge')&&<button className={buttonClass} disabled={!roomChargeTargets.length||balance<=0} onClick={()=>setModal({kind:'ROOM_CHARGE'})}>Charge room</button>}`;
  if(c.includes(buttonOld)&&!c.includes("kind:'ROOM_CHARGE'")){if(!changed)backup(rel);c=c.replace(buttonOld,buttonNew);changed=true}

  const modalAnchor=`    {modal?.kind==='SPLIT'&&active&&<SplitDialog balance={balance} snapshot={snapshot} onClose={()=>setModal(null)} onPay={finishSplit}/>}
`;
  if(c.includes(modalAnchor)&&!c.includes("RoomChargeDialog targets=")){
    if(!changed)backup(rel);
    c=c.replace(modalAnchor,modalAnchor+`    {modal?.kind==='ROOM_CHARGE'&&active&&<RoomChargeDialog targets={roomChargeTargets} balance={balance} onClose={()=>setModal(null)} onCharge={finishRoomCharge}/>}
`);changed=true;
  }

  if(!c.includes('const RoomChargeDialog=') ){
    if(!changed)backup(rel);
    const tail=`const RoomChargeDialog=({targets,balance,onCharge,onClose}:{targets:any[];balance:number;onCharge:(target:any)=>Promise<void>;onClose:()=>void})=>{const [folioId,setFolioId]=useState(targets[0]?.folioId||'');const target=targets.find(t=>t.folioId===folioId);return <ActionDialog title="Charge order to guest room" onClose={onClose}><div className="space-y-3"><label>Checked-in guest<select className={fieldClass} value={folioId} onChange={e=>setFolioId(e.target.value)}>{targets.map(t=><option key={t.folioId} value={t.folioId}>Room {t.roomNumber} · {t.guestName} · folio {money(Number(t.balanceMinor||0)/100)}</option>)}</select></label><p className="rounded-xl bg-slate-950 p-3 text-sm">Transfer <b>{money(balance)}</b> to the selected guest folio. No cash, M-Pesa or card receipt is created. Restaurant revenue is recognized once and the guest receivable increases.</p><button disabled={!target||balance<=0} className={primaryButtonClass} onClick={()=>void onCharge(target)}>Charge room</button></div></ActionDialog>};
`;
    c=c.trimEnd()+"\n"+tail;changed=true;
  }
  if(changed){write(rel,c);console.log(`Patched: ${rel}`)}else console.log(`Already patched: ${rel}`);
}

// Folios route.
{
  const rel='src/native/NativeBarShell.tsx';let c=read(rel),changed=false;
  if(!c.includes('NativeFoliosView')){
    backup(rel);
    const importAnchor="import { NativeHousekeepingView } from './NativeHousekeepingView';";
    if(!c.includes(importAnchor))throw new Error(`${rel}: Housekeeping import anchor missing`);
    c=c.replace(importAnchor,importAnchor+"\nimport { NativeFoliosView } from './NativeFoliosView';");
    const routeAnchor="  {id:'frontdesk',label:'Front Desk',permission:'rooms.view',icon:CalendarRange,help:'front-desk'},";
    if(!c.includes(routeAnchor))throw new Error(`${rel}: Front Desk route anchor missing`);
    c=c.replace(routeAnchor,routeAnchor+"\n  {id:'folios',label:'Folios',permission:'folio.view',icon:WalletCards,help:'folios'},");
    const contentAnchor="tab==='frontdesk'?<NativeFrontDeskView/>:tab==='housekeeping'";
    if(!c.includes(contentAnchor))throw new Error(`${rel}: Front Desk content anchor missing`);
    c=c.replace(contentAnchor,"tab==='frontdesk'?<NativeFrontDeskView/>:tab==='folios'?<NativeFoliosView/>:tab==='housekeeping'");
    changed=true;
  }
  if(changed){write(rel,c);console.log(`Patched: ${rel}`)}else console.log(`Already patched: ${rel}`);
}

// Import Center and architecture docs now treat hotel services as executable.
{
  const rel='src/native/NativeImportCenterView.tsx';let c=read(rel);
  const old='Room types, rooms and rate plans now apply through the native Rooms engine; hotel services wait for Folios and Assets remain staged.';
  const next='Room types, rooms, rate plans and hotel services now apply through native Rooms/Folios commands; Assets remain staged.';
  if(c.includes(old)){backup(rel);c=c.replace(old,next);write(rel,c);console.log(`Updated: ${rel}`)}
}
{
  const rel='docs/CONTROLLED_IMPORT_MIGRATION.md';let c=read(rel);
  const old='Room types, rooms and rate plans apply through the Patch 05 native Rooms engine. Hotel services remain staged until Patch 07 Folios. Assets stay staged until Patch 08.';
  const next='Room types, rooms and rate plans apply through the native Rooms engine. Hotel services apply through Patch 07 Folios with price/tax snapshots. Assets stay staged until Patch 08.';
  if(c.includes(old)){backup(rel);c=c.replace(old,next);write(rel,c);console.log(`Updated: ${rel}`)}
}

// Regression tests.
insertBefore('src-tauri/src/tests.rs',PATCH,'#[test]\nfn audit_cannot_be_modified()',p.rustTests);

console.log('');
console.log('Patch 07 Folios + POS Room Charging applied/repaired.');
console.log(`Backups: ${backupRoot}`);
console.log('No business SQLite database was opened by this applicator. No Supabase endpoint was contacted.');
console.log('Run the full validation gate before committing.');
