use argon2::{Argon2, PasswordHash, PasswordHasher, PasswordVerifier, password_hash::SaltString};
use chrono::Utc;
use rand_core::OsRng;
use rusqlite::{params, Connection, OptionalExtension, Transaction};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use uuid::Uuid;

pub type Result<T> = std::result::Result<T, String>;
fn error(e: impl std::fmt::Display) -> String { e.to_string() }
fn id() -> String { Uuid::new_v4().to_string() }
fn now() -> String { Utc::now().to_rfc3339() }
pub fn text<'a>(v: &'a Value, key: &str) -> Result<&'a str> {
    v.get(key).and_then(Value::as_str).filter(|s| !s.trim().is_empty()).ok_or_else(|| format!("{key} is required"))
}
fn money(v: &Value, key: &str) -> Result<i64> {
    let n = v.get(key).and_then(Value::as_f64).ok_or_else(|| format!("{key} must be a number"))?;
    if !n.is_finite() || n < 0.0 || n > 1_000_000_000.0 || ((n * 100.0).round() - n * 100.0).abs() > 0.0001 { return Err(format!("{key} must be a non-negative amount with at most two decimals")); }
    Ok((n * 100.0).round() as i64)
}
fn quantity(v:&Value,key:&str)->Result<f64>{
    let n=v[key].as_f64().ok_or_else(||format!("{key} must be numeric"))?;
    if !n.is_finite()||n<0.0||n>1_000_000_000.0||(n*1_000_000.0-(n*1_000_000.0).round()).abs()>0.00001{return Err(format!("{key} must be non-negative with at most six decimals"));}Ok(n)
}
pub fn open(path: &std::path::Path) -> Result<Connection> {
    let db = Connection::open(path).map_err(error)?;
    db.busy_timeout(std::time::Duration::from_secs(5)).map_err(error)?;
    db.execute_batch("PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; PRAGMA foreign_keys=ON;").map_err(error)?;
    let version: i64 = db.query_row("PRAGMA user_version", [], |r| r.get(0)).map_err(error)?;
    if version > 1 { return Err("Database requires a newer ServOS version".into()); }
    db.execute_batch(include_str!("../migrations/001.sql")).map_err(error)?;
    Ok(db)
}
pub fn meta(db: &Connection, key: &str) -> Result<Option<String>> { db.query_row("SELECT value FROM metadata WHERE key=?", [key], |r| r.get(0)).optional().map_err(error) }
pub fn set_meta(db: &Connection, key: &str, value: &str) -> Result<()> { db.execute("INSERT INTO metadata VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", params![key,value]).map_err(error)?; Ok(()) }
pub fn hash_pin(pin: &str) -> Result<String> {
    if pin.len() < 6 || pin.len() > 12 || !pin.chars().all(|c| c.is_ascii_digit()) { return Err("PIN must contain 6–12 digits".into()); }
    Argon2::default().hash_password(pin.as_bytes(), &SaltString::generate(&mut OsRng)).map(|h| h.to_string()).map_err(error)
}
pub fn initialize(db: &mut Connection, terminal: &str, name: &str, pin: &str, business: &str) -> Result<()> {
    let hash = hash_pin(pin)?;
    if name.trim().is_empty() || business.trim().is_empty() { return Err("Owner and business names are required".into()); }
    let tx = db.transaction().map_err(error)?;
    if meta(&tx,"terminal_id")?.is_some() { return Err("Terminal already enrolled".into()); }
    set_meta(&tx,"terminal_id",terminal)?;
    let owner = id();
    tx.execute("INSERT INTO staff(id,name,role,pin_hash) VALUES(?,?,'Admin',?)", params![owner,name,hash]).map_err(error)?;
    let mut changes = vec![];
    put(&tx,"organization","business",json!({"id":"business","name":business,"code":"BUSINESS","baseCurrency":"KES"}), &mut changes)?;
    put(&tx,"property","property",json!({"id":"property","organizationId":"business","name":business,"code":"MAIN","currency":"KES","timezone":"Africa/Nairobi","kraPin":"","etimsCuNumber":""}), &mut changes)?;
    put(&tx,"outlets","main",json!({"id":"main","propertyId":"property","name":"Main outlet","type":"RESTAURANT","active":true,"defaultStockLocationId":"main"}), &mut changes)?;
    put(&tx,"stockLocations","main",json!({"id":"main","name":"Main store","propertyId":"property","type":"STORE"}), &mut changes)?;
    put(&tx,"employees",&owner,json!({"id":owner,"name":name,"role":"ADMIN","status":"ACTIVE","phone":"","email":"","basicSalary":0}), &mut changes)?;
    let command = BusinessCommand { id:id(), schema_version:1, operation:"installation.enroll".into(), target_version:None, payload:json!({"business":business}) };
    finish(&tx,&command,&owner,changes)?;
    tx.commit().map_err(error)
}
#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all="camelCase")]
pub struct Session { pub token:String, pub staff_id:String, pub name:String, pub role:String }
pub fn login(db:&Connection, staff_id:&str, pin:&str) -> Result<Session> {
    let row: Option<(String,String,String,i64,i64)> = db.query_row("SELECT name,role,pin_hash,failures,locked_until FROM staff WHERE id=? AND active=1", [staff_id], |r| Ok((r.get(0)?,r.get(1)?,r.get(2)?,r.get(3)?,r.get(4)?))).optional().map_err(error)?;
    let (name,role,hash,failures,locked)=row.ok_or("Invalid staff or PIN")?;
    let stamp=Utc::now().timestamp();
    if locked>stamp { return Err("Too many attempts. Try again after five minutes.".into()); }
    let parsed=PasswordHash::new(&hash).map_err(error)?;
    if Argon2::default().verify_password(pin.as_bytes(),&parsed).is_err() {
        let attempts=if locked>0 {1} else {failures+1};
        db.execute("UPDATE staff SET failures=?,locked_until=? WHERE id=?", params![attempts,if attempts>=5 {stamp+300} else {0},staff_id]).map_err(error)?;
        return Err("Invalid staff or PIN".into());
    }
    db.execute("UPDATE staff SET failures=0,locked_until=0 WHERE id=?",[staff_id]).map_err(error)?;
    let token=id();
    db.execute("INSERT INTO sessions VALUES(?,?,?)",params![token,staff_id,stamp]).map_err(error)?;
    Ok(Session{token,staff_id:staff_id.into(),name,role})
}
pub fn actor(db:&Connection,token:&str,touch:bool)->Result<Session> {
    let row:Option<Session>=db.query_row("SELECT s.staff_id,u.name,u.role FROM sessions s JOIN staff u ON u.id=s.staff_id WHERE s.token=? AND u.active=1 AND s.last_seen>?",params![token,Utc::now().timestamp()-900],|r|Ok(Session{token:token.into(),staff_id:r.get(0)?,name:r.get(1)?,role:r.get(2)?})).optional().map_err(error)?;
    let user=row.ok_or("SESSION_EXPIRED: Unlock the terminal to continue")?;
    if touch {db.execute("UPDATE sessions SET last_seen=? WHERE token=?",params![Utc::now().timestamp(),token]).map_err(error)?;}
    Ok(user)
}
#[derive(Serialize,Deserialize,Clone)]
#[serde(rename_all="camelCase")]
pub struct BusinessCommand { pub id:String, pub schema_version:i64, pub operation:String, pub target_version:Option<i64>, pub payload:Value }
pub fn get(db:&Connection,collection:&str,id:&str)->Result<(i64,Value)> {
    let row:Option<(i64,String)>=db.query_row("SELECT version,data FROM records WHERE collection=? AND id=? AND archived=0",params![collection,id],|r|Ok((r.get(0)?,r.get(1)?))).optional().map_err(error)?;
    let (version,data)=row.ok_or_else(||format!("{collection} record not found"))?;
    Ok((version,serde_json::from_str(&data).map_err(error)?))
}
fn put(tx:&Transaction,collection:&str,record_id:&str,mut data:Value,changes:&mut Vec<Value>)->Result<()> {
    data["id"]=json!(record_id);
    tx.execute("INSERT INTO records(collection,id,data) VALUES(?,?,?) ON CONFLICT(collection,id) DO UPDATE SET data=excluded.data, version=records.version+1",params![collection,record_id,data.to_string()]).map_err(error)?;
    let version:i64=tx.query_row("SELECT version FROM records WHERE collection=? AND id=?",params![collection,record_id],|r|r.get(0)).map_err(error)?;
    changes.push(json!({"collection":collection,"id":record_id,"version":version,"data":data,"archived":false})); Ok(())
}
fn finish(tx:&Transaction,cmd:&BusinessCommand,actor_id:&str,changes:Vec<Value>)->Result<Value> {
    let audit_id=id(); let occurred=now();
    tx.execute("INSERT INTO audit(id,command_id,actor_id,operation,occurred_at,payload) VALUES(?,?,?,?,?,?)",params![audit_id,cmd.id,actor_id,cmd.operation,occurred,json!({"recordIds":changes.iter().map(|c|c["id"].clone()).collect::<Vec<_>>()}).to_string()]).map_err(error)?;
    let sequence=tx.last_insert_rowid();
    let envelope=json!({"sequence":sequence,"commandId":cmd.id,"operation":cmd.operation,"actorId":actor_id,"occurredAt":occurred,"changes":changes});
    tx.execute("INSERT INTO outbox(sequence,command_id,envelope) VALUES(?,?,?)",params![sequence,cmd.id,envelope.to_string()]).map_err(error)?;
    let result=json!({"commandId":cmd.id,"recordIds":changes.iter().map(|c|c["id"].clone()).collect::<Vec<_>>(),"auditReference":audit_id,"sequence":sequence});
    tx.execute("INSERT INTO commands VALUES(?,?,?)",params![cmd.id,serde_json::to_string(cmd).map_err(error)?,result.to_string()]).map_err(error)?;
    Ok(result)
}
const MASTER:&[&str]=&["products","stockItems","stockLocations","tables","outlets","property","customers","suppliers","rooms","priceRules","recipes","events","promoters","reservations","waitlist","housekeeping","maintenance"];
pub fn execute(db:&mut Connection,token:&str,cmd:BusinessCommand)->Result<Value> {
    let user=actor(db,token,true)?;
    execute_as(db,&user,cmd)
}
pub fn execute_as(db:&mut Connection,user:&Session,cmd:BusinessCommand)->Result<Value> {
    if cmd.schema_version!=1 || Uuid::parse_str(&cmd.id).is_err() {return Err("Unsupported command version or invalid ID".into());}
    let tx=db.transaction().map_err(error)?;
    let prior:Option<(String,String)>=tx.query_row("SELECT fingerprint,result FROM commands WHERE id=?",[&cmd.id],|r|Ok((r.get(0)?,r.get(1)?))).optional().map_err(error)?;
    if let Some((fingerprint,result))=prior {
        let original:String=tx.query_row("SELECT actor_id FROM audit WHERE command_id=?",[&cmd.id],|r|r.get(0)).map_err(error)?;
        if original!=user.staff_id || fingerprint!=serde_json::to_string(&cmd).map_err(error)? {return Err("Command ID was already used by another actor or for different input".into());} return serde_json::from_str(&result).map_err(error);
    }
    let mut changes=vec![]; let p=&cmd.payload;
    match cmd.operation.as_str() {
        "record.save"|"record.archive" => {
            let collection=text(p,"collection")?;
            if !MASTER.contains(&collection) {return Err("This collection requires a dedicated business command".into());}
            if user.role=="Server" {return Err("Manager permission required".into());}
            let record_id=text(p,"id")?;
            let existing=get(&tx,collection,record_id).ok();
            if existing.as_ref().map(|x|x.0)!=cmd.target_version {return Err("CONFLICT: Record changed; reload before saving".into());}
            if cmd.operation=="record.archive" {
                if existing.is_none(){return Err("Record not found".into());}
                if collection=="property"||collection=="outlets" {return Err("Primary business configuration cannot be archived".into());}
                let data=&existing.as_ref().unwrap().1;
                if collection=="tables" && data["currentOrderId"].as_str().is_some(){return Err("Close or transfer the active order before archiving this table".into());}
                if collection=="stockItems" && data["currentStock"].as_object().is_some_and(|locations|locations.values().any(|q|q.as_f64().unwrap_or(0.0)!=0.0)){return Err("Resolve remaining stock before archiving".into());}
                tx.execute("UPDATE records SET archived=1,version=version+1 WHERE collection=? AND id=?",params![collection,record_id]).map_err(error)?;
                let (version,data)=existing.unwrap(); changes.push(json!({"collection":collection,"id":record_id,"version":version+1,"data":data,"archived":true}));
            } else {
                let mut data=p.get("data").filter(|v|v.is_object()).ok_or("Record data is required")?.clone();
                if collection=="tables" {text(&data,"label")?;} else {text(&data,"name")?;}
                if collection=="products" {
                    money(&data,"price")?; text(&data,"code")?;
                    if !["BAR","KITCHEN","SERVICE"].contains(&text(&data,"routeTo")?){return Err("Invalid preparation station".into());}
                    let outlets=data["outletIds"].as_array().ok_or("Assign at least one outlet")?;if outlets.is_empty(){return Err("Assign at least one outlet".into());}
                    for outlet in outlets {get(&tx,"outlets",outlet.as_str().ok_or("Invalid outlet")?)?;}
                }
                if collection=="stockItems" {
                    quantity(&data,"averageUnitCost")?;text(&data,"code")?;text(&data,"baseUnit")?;
                    data["currentStock"]=existing.as_ref().map(|(_,v)|v["currentStock"].clone()).unwrap_or(json!({}));
                }
                if collection=="tables" {
                    if data["capacity"].as_u64().filter(|n|*n>0&&*n<=1000).is_none(){return Err("Table capacity must be between 1 and 1000".into());}
                    get(&tx,"outlets",text(&data,"outletId")?)?;
                    data["state"]=existing.as_ref().map(|(_,v)|v["state"].clone()).unwrap_or(json!("AVAILABLE"));
                    data["currentOrderId"]=existing.as_ref().map(|(_,v)|v["currentOrderId"].clone()).unwrap_or(Value::Null);
                }
                if ["products","stockItems","suppliers"].contains(&collection) {
                    let code=text(&data,"code")?;
                    let duplicate:bool=tx.query_row("SELECT EXISTS(SELECT 1 FROM records WHERE collection=? AND id<>? AND archived=0 AND lower(json_extract(data,'$.code'))=lower(?))",params![collection,record_id,code],|r|r.get(0)).map_err(error)?;
                    if duplicate{return Err("This code already belongs to another record".into());}
                }
                put(&tx,collection,record_id,data,&mut changes)?;
            }
        },
        "inventory.adjust"|"inventory.waste"|"inventory.transfer" => {
            if user.role=="Server"{return Err("Manager permission required".into());}
            let stock_id=text(p,"stockItemId")?;let location=text(p,"locationId")?;let reason=text(p,"reason")?;
            let (_,stock)=get(&tx,"stockItems",stock_id)?;get(&tx,"stockLocations",location)?;
            let current=stock["currentStock"][location].as_f64().unwrap_or(0.0);
            if cmd.operation=="inventory.adjust" {
                let counted=quantity(p,"countedQty")?;
                stock_delta(&tx,&user,stock_id,location,counted-current,"COUNT_ADJUSTMENT",&cmd.id,reason,&mut changes)?;
            } else {
                let qty=quantity(p,"quantity")?;if qty==0.0{return Err("Quantity must be positive".into());}
                if cmd.operation=="inventory.transfer" {
                    let target=text(p,"toLocationId")?;if target==location{return Err("Choose a different destination".into());}get(&tx,"stockLocations",target)?;
                    stock_delta(&tx,&user,stock_id,location,-qty,"TRANSFER_OUT",&cmd.id,reason,&mut changes)?;
                    stock_delta(&tx,&user,stock_id,target,qty,"TRANSFER_IN",&cmd.id,reason,&mut changes)?;
                }else{stock_delta(&tx,&user,stock_id,location,-qty,"WASTE",&cmd.id,reason,&mut changes)?;}
            }
        },
        "staff.create" => {
            if user.role!="Admin" {return Err("Owner permission required".into());}
            let role=text(p,"role")?; if !["Admin","Manager","Server"].contains(&role){return Err("Invalid role".into());}
            let staff_id=id(); let name=text(p,"name")?; let hash=hash_pin(text(p,"pin")?)?;
            tx.execute("INSERT INTO staff(id,name,role,pin_hash) VALUES(?,?,?,?)",params![staff_id,name,role,hash]).map_err(error)?;
            put(&tx,"employees",&staff_id,json!({"id":staff_id,"name":name,"role":role.to_uppercase(),"status":"ACTIVE","phone":"","email":"","basicSalary":0}),&mut changes)?;
        },
        "till.open" => {
            if list(&tx,"tillSessions")?.iter().any(|v|v["data"]["status"]=="OPEN"){return Err("A till is already open".into());}
            let float=money(p,"floatAmount")?; let till_id=id();
            put(&tx,"tillSessions",&till_id,json!({"id":till_id,"terminalId":meta(&tx,"terminal_id")?,"terminalName":"POS terminal","employeeId":user.staff_id,"employeeName":user.name,"openedAt":now(),"openingFloat":float as f64/100.0,"cashSalesTotal":0,"cashPaidIn":0,"cashPaidOut":0,"expectedCashInDrawer":float as f64/100.0,"status":"OPEN"}),&mut changes)?;
        },
        "order.create" => {
            let order_id=id(); let table_id=p.get("tableId").and_then(Value::as_str);
            let mut table=None;
            if let Some(t)=table_id {let (_,mut value)=get(&tx,"tables",t)?; if value.get("currentOrderId").and_then(Value::as_str).is_some(){return Err("Table already has an order".into());} value["currentOrderId"]=json!(order_id); value["state"]=json!("ORDERING"); table=Some((t.to_string(),value));}
            put(&tx,"orders",&order_id,json!({"id":order_id,"orderNumber":format!("ORD-{}",&order_id[..8]),"propertyId":"property","outletId":p.get("outletId").and_then(Value::as_str).unwrap_or("main"),"tableId":table_id,"tableName":table.as_ref().and_then(|(_,v)|v.get("label")),"items":[],"state":"OPEN","subtotal":0,"discountTotal":0,"taxTotal":0,"cateringLevyTotal":0,"shortfallAdjustment":0,"grandTotal":0,"amountPaid":0,"createdAt":now(),"serverEmployeeId":user.staff_id,"serverName":user.name,"terminalId":meta(&tx,"terminal_id")?,"tabName":p.get("name")}),&mut changes)?;
            if let Some((key,value))=table {put(&tx,"tables",&key,value,&mut changes)?;}
        },
        "order.addItem"|"order.removeItem"|"order.fire"|"order.kds" => {
            let order_id=text(p,"orderId")?; let (_,mut order)=get(&tx,"orders",order_id)?;
            if ["COMPLETED","VOIDED"].contains(&order["state"].as_str().unwrap_or("")){return Err("Order is closed".into());}
            if order["amountPaid"].as_f64().unwrap_or(0.0)>0.0 && ["order.addItem","order.removeItem"].contains(&cmd.operation.as_str()){return Err("Partially paid orders cannot be edited".into());}
            let order_outlet=order["outletId"].as_str().unwrap_or("main").to_string();
            let items=order["items"].as_array_mut().ok_or("Invalid order items")?;
            if cmd.operation=="order.addItem" {
                let product_id=text(p,"productId")?; let (version,product)=get(&tx,"products",product_id)?; let price=money(&product,"price")?;
                let item_id=id();
                items.push(json!({"id":item_id,"productId":product_id,"productName":product["name"],"quantity":1,"unitPrice":price as f64/100.0,"lineTotal":price as f64/100.0,"totalPrice":price as f64/100.0,"state":"OPEN","courseStatus":"HELD","courseName":p.get("courseName").cloned().unwrap_or(json!("Mains")),"seatLabel":p.get("seatLabel"),"productSnapshot":product,"productVersion":version,"taxAmount":0,"cateringLevy":0,"stockFired":false,"modifiers":[]}));
            } else if cmd.operation=="order.removeItem" {
                let item_id=text(p,"itemId")?;
                let item=items.iter().find(|i|i["id"]==item_id).ok_or("Item not found")?;
                if item["stockFired"]==true {return Err("Fired items require a stock disposition and manager void".into());}
                items.retain(|i|i["id"]!=item_id);
            } else if cmd.operation=="order.fire" {
                for item in items.iter_mut() {
                    if item["stockFired"]==true {continue;}
                    if let Some(course)=p.get("courseName").and_then(Value::as_str){if item["courseName"]!=course {continue;}}
                    let product=&item["productSnapshot"]; let quantity=item["quantity"].as_f64().unwrap_or(1.0);
                    let mut ingredients=product["recipeIngredients"].as_array().cloned().unwrap_or_default();
                    if ingredients.is_empty(){if let Some(stock)=product["stockItemId"].as_str(){ingredients.push(json!({"stockItemId":stock,"quantity":product["portionVolume"].as_f64().unwrap_or(1.0)}));}}
                    for ingredient in ingredients {
                        let stock_id=text(&ingredient,"stockItemId")?; let (_,mut stock)=get(&tx,"stockItems",stock_id)?;
                        let consumed=ingredient["quantity"].as_f64().ok_or("Invalid recipe quantity")?*quantity;
                        if !consumed.is_finite()||consumed<=0.0{return Err("Invalid recipe quantity".into());}
                        let location=order_outlet.clone();
                        let (_, outlet)=get(&tx,"outlets",&location)?;
                        let location=outlet["defaultStockLocationId"].as_str().unwrap_or("main");
                        let on_hand=stock["currentStock"][location].as_f64().unwrap_or(0.0);
                        if on_hand<consumed {return Err(format!("Insufficient stock for {}",stock["name"]));}
                        stock["currentStock"][location]=json!(on_hand-consumed); put(&tx,"stockItems",stock_id,stock,&mut changes)?;
                        let movement=id(); put(&tx,"stockMovements",&movement,json!({"id":movement,"stockItemId":stock_id,"type":"SALE","quantity":-consumed,"occurredAt":now(),"referenceId":order_id,"orderItemId":item["id"],"employeeId":user.staff_id}),&mut changes)?;
                    }
                    item["stockFired"]=json!(true); item["state"]=json!("ROUTED"); item["courseStatus"]=json!("FIRED"); item["firedAt"]=json!(now());
                }
                order["state"]=json!("SENT");
            } else {
                let status=text(p,"status")?; if !["PREPARING","READY","SERVED"].contains(&status){return Err("Invalid kitchen state".into());}
                for item in items.iter_mut().filter(|i|i["stockFired"]==true){item["state"]=json!(status);}
            }
            let total:i64=order["items"].as_array().unwrap().iter().map(|i|money(i,"lineTotal")).collect::<Result<Vec<_>>>()?.iter().sum();
            order["subtotal"]=json!(total as f64/100.0); order["grandTotal"]=json!(total as f64/100.0);
            put(&tx,"orders",order_id,order,&mut changes)?;
        },
        "payment.record" => payment(&tx,&user,p,&mut changes)?,
        "payment.split" => {
            let splits=p["payments"].as_array().ok_or("Payment lines are required")?;
            if splits.is_empty() || splits.len()>10 {return Err("Use between one and ten payment lines".into());}
            let order_id=text(p,"orderId")?; let (_,order)=get(&tx,"orders",order_id)?;
            let sum=splits.iter().map(|s|money(s,"amount")).collect::<Result<Vec<_>>>()?.iter().sum::<i64>();
            if sum!=money(&order,"grandTotal")?-money(&order,"amountPaid")?{return Err("Split amounts must equal the outstanding balance".into());}
            for split in splits {let mut line=split.clone();line["orderId"]=json!(order_id);payment(&tx,&user,&line,&mut changes)?;}
        },
        "mpesa.reconcile" => {
            if user.role=="Server"{return Err("Manager permission required".into());}
            let receipt_id=text(p,"receiptId")?; let (_,mut receipt)=get(&tx,"mpesaReceipts",receipt_id)?;
            if receipt["reconciliationStatus"]=="RECONCILED" {return Err("Receipt already reconciled".into());}
            let statement=money(p,"statementAmount")?;
            if statement!=money(&receipt,"receivedAmount")?{return Err("Statement amount differs from the receipt; resolve before reconciliation".into());}
            receipt["statementReference"]=json!(text(p,"statementReference")?); receipt["reviewNotes"]=json!(text(p,"notes")?);
            receipt["reviewedBy"]=json!(user.staff_id); receipt["reviewedAt"]=json!(now()); receipt["reconciliationStatus"]=json!("RECONCILED");
            put(&tx,"mpesaReceipts",receipt_id,receipt,&mut changes)?;
        },
        "till.close" => {
            let till_id=text(p,"tillId")?; let (_,mut till)=get(&tx,"tillSessions",till_id)?;
            if till["status"]!="OPEN"{return Err("Till is already closed".into());}
            let counted=money(p,"countedCash")?; let expected=money(&till,"expectedCashInDrawer")?;
            if counted!=expected && (user.role=="Server" || p["reason"].as_str().unwrap_or("").trim().is_empty()){return Err("Variance requires manager authorization and a reason".into());}
            till["countedCashAtClose"]=json!(counted as f64/100.0); till["cashVariance"]=json!((counted-expected) as f64/100.0); till["closedAt"]=json!(now()); till["status"]=json!("CLOSED"); till["reason"]=p["reason"].clone(); put(&tx,"tillSessions",till_id,till,&mut changes)?;
        },
        _=>return Err(format!("Workflow not implemented in the native backend: {}",cmd.operation)),
    }
    let result=finish(&tx,&cmd,&user.staff_id,changes)?; tx.commit().map_err(error)?; Ok(result)
}
fn payment(tx:&Transaction,user:&Session,p:&Value,changes:&mut Vec<Value>)->Result<()> {
    let order_id=text(p,"orderId")?; let (_,mut order)=get(tx,"orders",order_id)?;
    if ["COMPLETED","VOIDED"].contains(&order["state"].as_str().unwrap_or("")){return Err("Order already closed".into());}
    let total=money(&order,"grandTotal")?; let paid=money(&order,"amountPaid")?; let amount=money(p,"amount")?;
    if amount<=0 || amount>total-paid{return Err("Payment must be positive and not exceed the outstanding balance".into());}
    let method=text(p,"method")?; if !["CASH","MPESA","CARD"].contains(&method){return Err("This tender is not implemented".into());}
    let tills=list(tx,"tillSessions")?; let active=tills.iter().find(|v|v["data"]["status"]=="OPEN").ok_or("Open a till before accepting payment")?;
    let mut till=active["data"].clone(); let mut reference=id(); let mut receipt_id=None;
    if method=="MPESA" {
        let m=&p["mpesa"]; if m["confirmed"]!=true{return Err("Confirm the receipt on the business M-Pesa account first".into());}
        let code=text(m,"code")?.trim().to_ascii_uppercase();
        if code.len()<6||code.len()>20||!code.chars().all(|c|c.is_ascii_alphanumeric()){return Err("Enter a valid M-Pesa transaction code".into());}
        let account=text(m,"account")?.trim(); let received=money(m,"receivedAmount")?; let date=text(m,"receivedAt")?;
        chrono::DateTime::parse_from_rfc3339(date).map_err(|_|"Receipt time must include a timezone")?;
        let existing:Option<String>=tx.query_row("SELECT receipt_id FROM mpesa_codes WHERE account=? AND code=?",params![account,code],|r|r.get(0)).optional().map_err(error)?;
        let key=existing.clone().unwrap_or_else(id);
        let mut receipt=if existing.is_some(){get(tx,"mpesaReceipts",&key)?.1}else{json!({"id":key,"code":code,"account":account,"receivedAmount":received as f64/100.0,"receivedAt":date,"allocatedAmount":0,"reconciliationStatus":"AWAITING_RECONCILIATION","cashierId":user.staff_id})};
        if money(&receipt,"receivedAmount")?!=received {return Err("Transaction code already exists with a different received amount".into());}
        let allocated=money(&receipt,"allocatedAmount")?;
        if allocated+amount>received{return Err("Transaction code has insufficient unallocated funds".into());}
        receipt["allocatedAmount"]=json!((allocated+amount) as f64/100.0); receipt["unappliedAmount"]=json!((received-allocated-amount) as f64/100.0);
        if received>allocated+amount {receipt["customerId"]=json!(text(m,"customerId")?);}
        if existing.is_none(){tx.execute("INSERT INTO mpesa_codes VALUES(?,?,?)",params![account,code,key]).map_err(error)?;}
        put(tx,"mpesaReceipts",&key,receipt,changes)?; reference=code; receipt_id=Some(key);
    }
    if method=="CARD" {reference=text(p,"cardAuthCode")?.trim().into();}
    if method=="CASH" {
        if money(p,"cashTendered")?<amount{return Err("Cash tendered is below the payment amount".into());}
        till["cashSalesTotal"]=json!((money(&till,"cashSalesTotal")?+amount) as f64/100.0); till["expectedCashInDrawer"]=json!((money(&till,"expectedCashInDrawer")?+amount) as f64/100.0);
        let till_id=text(&till,"id")?.to_string(); put(tx,"tillSessions",&till_id,till,changes)?;
    }
    let payment_id=id(); let journal_id=id(); let stamp=now();
    put(tx,"payments",&payment_id,json!({"id":payment_id,"orderId":order_id,"propertyId":"property","tillSessionId":active["id"],"tenderType":method,"amount":amount as f64/100.0,"amountMinor":amount,"currency":"KES","status":"PAID","referenceNumber":reference,"mpesaReceiptId":receipt_id,"occurredAt":stamp,"cashierId":user.staff_id,"cashierName":user.name,"confirmation":"MANUAL"}),changes)?;
    // Each payment recognizes only its allocated amount. No journal is posted again during sync.
    put(tx,"journalEntries",&journal_id,json!({"id":journal_id,"entryNumber":format!("JE-{}",&journal_id[..8]),"propertyId":"property","occurredAt":stamp,"postedAt":stamp,"sourceType":"PAYMENT","sourceId":payment_id,"memo":format!("Manual {} receipt for {}",method,order["orderNumber"]),"lines":[{"id":id(),"accountId":method,"accountCode":method,"accountName":method,"debit":amount as f64/100.0,"credit":0,"debitMinor":amount,"creditMinor":0,"description":"Receipt"},{"id":id(),"accountId":"SALES","accountCode":"4000","accountName":"Sales pending tax configuration","debit":0,"credit":amount as f64/100.0,"debitMinor":0,"creditMinor":amount,"description":"Sale"}],"totalDebit":amount as f64/100.0,"totalCredit":amount as f64/100.0,"balanced":true}),changes)?;
    order["amountPaid"]=json!((paid+amount) as f64/100.0); order["paymentMethod"]=json!(method);
    if paid+amount==total {order["state"]=json!("COMPLETED"); order["completedAt"]=json!(stamp); if let Some(table_id)=order["tableId"].as_str(){let (_,mut table)=get(tx,"tables",table_id)?; table["currentOrderId"]=Value::Null; table["state"]=json!("CLEANING"); put(tx,"tables",table_id,table,changes)?;}}
    put(tx,"orders",order_id,order,changes)
}
fn stock_delta(tx:&Transaction,user:&Session,stock_id:&str,location:&str,delta:f64,kind:&str,source:&str,reason:&str,changes:&mut Vec<Value>)->Result<()> {
    let (_,mut stock)=get(tx,"stockItems",stock_id)?;let (_,location_record)=get(tx,"stockLocations",location)?;
    let current=stock["currentStock"][location].as_f64().unwrap_or(0.0);
    let next=((current+delta)*1_000_000.0).round()/1_000_000.0;
    if next<0.0{return Err("Insufficient stock; no movement was recorded".into());}
    stock["currentStock"][location]=json!(next);
    let movement=id();let cost=stock["averageUnitCost"].as_f64().unwrap_or(0.0);
    put(tx,"stockMovements",&movement,json!({"id":movement,"organizationId":"business","propertyId":"property","stockItemId":stock_id,"stockItemName":stock["name"],"locationId":location,"locationName":location_record["name"],"quantityDelta":delta,"baseUnit":stock["baseUnit"],"movementType":kind,"sourceId":source,"reasonCode":reason,"occurredAt":now(),"actorUserId":user.staff_id,"actorName":user.name,"unitCostSnapshot":cost,"totalCostValuation":((delta*cost*100.0).round())/100.0}),changes)?;
    put(tx,"stockItems",stock_id,stock,changes)
}
pub fn list(db:&Connection,collection:&str)->Result<Vec<Value>> {
    let mut stmt=db.prepare("SELECT id,version,data,archived FROM records WHERE collection=? AND archived=0 ORDER BY rowid").map_err(error)?;
    let rows=stmt.query_map([collection],|r|Ok((r.get::<_,String>(0)?,r.get::<_,i64>(1)?,r.get::<_,String>(2)?,r.get::<_,bool>(3)?))).map_err(error)?;
    rows.map(|r| {let (id,version,data,archived)=r.map_err(error)?; Ok(json!({"collection":collection,"id":id,"version":version,"data":serde_json::from_str::<Value>(&data).map_err(error)?,"archived":archived}))}).collect()
}
pub fn snapshot(db:&Connection,token:&str)->Result<Value> {
    let user=actor(db,token,false)?; let mut records=vec![];
    let mut stmt=db.prepare("SELECT DISTINCT collection FROM records").map_err(error)?;
    let collections=stmt.query_map([],|r|r.get::<_,String>(0)).map_err(error)?;
    for row in collections {let c=row.map_err(error)?; if user.role=="Server" && !["organization","property","outlets","products","tables","orders","tillSessions","customers","rooms"].contains(&c.as_str()){continue;} records.extend(list(db,&c)?);}
    let pending:i64=db.query_row("SELECT COUNT(*) FROM outbox WHERE acknowledged_at IS NULL",[],|r|r.get(0)).map_err(error)?;
    Ok(json!({"records":records,"pendingCount":pending,"lastSync":meta(db,"last_sync")?,"terminalId":meta(db,"terminal_id")?}))
}
