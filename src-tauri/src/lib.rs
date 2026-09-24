mod store;
#[cfg(test)] mod tests;
use rusqlite::{Connection, OptionalExtension};
use serde_json::{json,Value};
use std::{path::PathBuf,sync::Mutex};
use tauri::{Manager,State};

struct Runtime { db:Mutex<Connection>, path:PathBuf, syncing:Mutex<bool> }
#[tauri::command]
fn runtime_status(state:State<Runtime>)->store::Result<Value>{
    let db=state.db.lock().map_err(|e|e.to_string())?;
    let mut stmt=db.prepare("SELECT id,name FROM staff WHERE active=1 ORDER BY name").map_err(|e|e.to_string())?;
    let staff=stmt.query_map([],|r|Ok(json!({"id":r.get::<_,String>(0)?,"name":r.get::<_,String>(1)?}))).map_err(|e|e.to_string())?.collect::<Result<Vec<_>,_>>().map_err(|e|e.to_string())?;
    Ok(json!({"enrolled":store::meta(&db,"terminal_id")?.is_some(),"staff":staff}))
}
#[tauri::command]
fn runtime_login(state:State<Runtime>,staff_id:String,pin:String)->store::Result<store::Session>{let db=state.db.lock().map_err(|e|e.to_string())?;store::login(&db,&staff_id,&pin)}
#[tauri::command]
fn runtime_lock(state:State<Runtime>,token:String)->store::Result<()>{state.db.lock().map_err(|e|e.to_string())?.execute("DELETE FROM sessions WHERE token=?",[token]).map_err(|e|e.to_string())?;Ok(())}
#[tauri::command]
fn runtime_snapshot(state:State<Runtime>,token:String)->store::Result<Value>{let db=state.db.lock().map_err(|e|e.to_string())?;store::snapshot(&db,&token)}
#[tauri::command]
fn runtime_command(state:State<Runtime>,token:String,command:store::BusinessCommand)->store::Result<Value>{let mut db=state.db.lock().map_err(|e|e.to_string())?;store::execute(&mut db,&token,command)}

fn validate_url(url:&str)->store::Result<String>{
    let parsed=reqwest::Url::parse(url).map_err(|_|"Invalid Supabase URL")?;
    if parsed.scheme()!="https"||!parsed.host_str().unwrap_or("").ends_with(".supabase.co")||parsed.path()!="/"||!parsed.username().is_empty()||parsed.password().is_some()||parsed.query().is_some()||parsed.fragment().is_some(){return Err("Use the HTTPS project URL ending in .supabase.co".into());}
    Ok(url.trim_end_matches('/').into())
}
async fn rpc(url:&str,key:&str,auth:Option<&str>,name:&str,body:Value)->store::Result<Value>{
    let client=reqwest::Client::builder().timeout(std::time::Duration::from_secs(30)).build().map_err(|e|e.to_string())?;
    let mut req=client.post(format!("{url}/rest/v1/rpc/{name}")).header("apikey",key).json(&body);
    if let Some(token)=auth{req=req.bearer_auth(token);}
    let res=req.send().await.map_err(|_|"Server unreachable; all local operations remain queued")?;
    if !res.status().is_success(){return Err(format!("Server rejected request ({}); local data retained",res.status()));}
    res.json().await.map_err(|_|"Invalid server response; local data retained".into())
}
#[tauri::command]
async fn runtime_enroll(state:State<'_,Runtime>,url:String,publishable_key:String,access_token:String,owner_name:String,pin:String,business_name:String)->store::Result<()> {
    let url=validate_url(&url)?; store::hash_pin(&pin)?;
    if owner_name.trim().is_empty()||business_name.trim().is_empty(){return Err("Owner and business names are required".into());}
    let (terminal,credential)={
        let mut db=state.db.lock().map_err(|e|e.to_string())?;
        if store::meta(&db,"terminal_id")?.is_some(){return Err("Already enrolled".into());}
        let tx=db.transaction().map_err(|e|e.to_string())?;
        let terminal=store::meta(&tx,"pending_terminal")?.unwrap_or_else(||uuid::Uuid::new_v4().to_string());
        let credential=store::meta(&tx,"device_token")?.unwrap_or_else(||format!("{}{}",uuid::Uuid::new_v4().simple(),uuid::Uuid::new_v4().simple()));
        store::set_meta(&tx,"pending_terminal",&terminal)?;store::set_meta(&tx,"device_token",&credential)?;
        store::set_meta(&tx,"cloud_url",&url)?;store::set_meta(&tx,"cloud_key",&publishable_key)?;
        tx.commit().map_err(|e|e.to_string())?;(terminal,credential)
    };
    let result=rpc(&url,&publishable_key,Some(&access_token),"servos_enroll",json!({"business_name":business_name,"installation_id":terminal,"device_secret":credential})).await?;
    if store::text(&result,"terminalId")?!=terminal{return Err("Unexpected enrollment response".into());}
    let mut db=state.db.lock().map_err(|e|e.to_string())?;
    store::initialize(&mut db,&terminal,&owner_name,&pin,&business_name)?;
    Ok(())
}
#[tauri::command]
async fn runtime_sync(state:State<'_,Runtime>,token:String)->store::Result<Value>{
    {let mut running=state.syncing.lock().map_err(|e|e.to_string())?;if *running{return Err("Synchronization already running".into());}*running=true;}
    let result=sync_inner(&state,&token).await;
    if let Ok(mut running)=state.syncing.lock(){*running=false;}
    result
}
async fn sync_inner(state:&Runtime,token:&str)->store::Result<Value>{
    let (url,key,credential,terminal,operations)={
        let db=state.db.lock().map_err(|e|e.to_string())?;store::actor(&db,token,false)?;
        let required=|k|store::meta(&db,k)?.ok_or_else(||format!("Cloud configuration missing: {k}"));
        let mut stmt=db.prepare("SELECT envelope FROM outbox WHERE acknowledged_at IS NULL ORDER BY sequence LIMIT 100").map_err(|e|e.to_string())?;
        let strings=stmt.query_map([],|r|r.get::<_,String>(0)).map_err(|e|e.to_string())?.collect::<Result<Vec<_>,_>>().map_err(|e|e.to_string())?;
        let operations=strings.iter().map(|s|serde_json::from_str::<Value>(s).map_err(|e|e.to_string())).collect::<store::Result<Vec<_>>>()?;
        (required("cloud_url")?,required("cloud_key")?,required("device_token")?,required("terminal_id")?,operations)
    };
    let result=rpc(&url,&key,None,"servos_upload",json!({"terminal_id":terminal,"device_token":credential,"operations":operations})).await?;
    let cursor=result["acknowledgedSequence"].as_i64().ok_or("Server acknowledgement missing")?;
    let maximum=operations.last().and_then(|v|v["sequence"].as_i64()).unwrap_or(cursor);
    if cursor>maximum{return Err("Unexpected server acknowledgement; queue retained".into());}
    {let mut db=state.db.lock().map_err(|e|e.to_string())?; let tx=db.transaction().map_err(|e|e.to_string())?;
    // Acknowledgements apply only to operations actually included in this request.
    for op in &operations {let seq=op["sequence"].as_i64().ok_or("Invalid local sequence")?;if seq<=cursor{tx.execute("UPDATE outbox SET acknowledged_at=? WHERE sequence=?",rusqlite::params![chrono::Utc::now().to_rfc3339(),seq]).map_err(|e|e.to_string())?;}}
    store::set_meta(&tx,"last_sync",&chrono::Utc::now().to_rfc3339())?;tx.commit().map_err(|e|e.to_string())?;}
    // Apply requests only after the terminal has uploaded its entire current queue.
    let pending:i64={let db=state.db.lock().map_err(|e|e.to_string())?;db.query_row("SELECT COUNT(*) FROM outbox WHERE acknowledged_at IS NULL",[],|r|r.get(0)).map_err(|e|e.to_string())?};
    if pending==0 {
        let requests=rpc(&url,&key,None,"servos_poll_requests",json!({"terminal_id":terminal,"device_token":credential})).await?;
        for request in requests.as_array().ok_or("Invalid remote request response")? {
            let request_id=store::text(request,"id")?.to_string();
            let outcome={
                let mut db=state.db.lock().map_err(|e|e.to_string())?;
                let cached:Option<String>=db.query_row("SELECT result FROM remote_requests WHERE id=?",[&request_id],|r|r.get(0)).optional().map_err(|e|e.to_string())?;
                if let Some(result)=cached {serde_json::from_str::<Value>(&result).map_err(|e|e.to_string())?} else {
                    let operation=store::text(request,"operation")?;
                    let allowed=["record.save","record.archive"].contains(&operation)&&["products","tables","customers","suppliers","priceRules"].contains(&request["payload"]["collection"].as_str().unwrap_or(""));
                    let result=if !allowed {Err("Remote operation is not permitted".into())} else {
                        let actor=store::Session{token:String::new(),staff_id:format!("remote:{}",store::text(request,"authorId")?),name:"Remote manager".into(),role:"Manager".into()};
                        store::execute_as(&mut db,&actor,store::BusinessCommand{id:request_id.clone(),schema_version:1,operation:operation.into(),target_version:request["expectedVersion"].as_i64(),payload:request["payload"].clone()})
                    };
                    let outcome=match result {Ok(result)=>json!({"status":"applied","result":result}),Err(message)=>json!({"status":if message.starts_with("CONFLICT:"){"conflict"}else{"rejected"},"result":{"message":message}})};
                    db.execute("INSERT INTO remote_requests VALUES(?,?,?)",rusqlite::params![request_id,outcome["status"].as_str(),outcome.to_string()]).map_err(|e|e.to_string())?;outcome
                }
            };
            // Successful effects must be replicated before the remote UI can say applied.
            let can_ack=if outcome["status"]=="applied" {let db=state.db.lock().map_err(|e|e.to_string())?;db.query_row("SELECT EXISTS(SELECT 1 FROM outbox WHERE command_id=? AND acknowledged_at IS NOT NULL)",[&request_id],|r|r.get::<_,bool>(0)).map_err(|e|e.to_string())?}else{true};
            if can_ack {rpc(&url,&key,None,"servos_ack_request",json!({"terminal_id":terminal,"device_token":credential,"request_id":request_id,"request_status":outcome["status"],"request_result":outcome["result"]})).await?;}
        }
    }
    Ok(result)
}
#[tauri::command]
fn runtime_backup(state:State<Runtime>,token:String)->store::Result<String>{
    let db=state.db.lock().map_err(|e|e.to_string())?;let actor=store::actor(&db,&token,true)?;
    if actor.role=="Server"{return Err("Manager permission required".into());}
    let folder=state.path.parent().ok_or("Missing application folder")?.join("backups");std::fs::create_dir_all(&folder).map_err(|e|e.to_string())?;
    let path=folder.join(format!("servos-{}.sqlite",chrono::Utc::now().format("%Y%m%dT%H%M%S%f")));
    db.backup(rusqlite::DatabaseName::Main,&path,None).map_err(|e|e.to_string())?;
    Ok(path.to_string_lossy().into())
}
#[cfg_attr(mobile,tauri::mobile_entry_point)]
pub fn run(){
    tauri::Builder::default().setup(|app|{
        let folder=app.path().app_data_dir()?;std::fs::create_dir_all(&folder)?;let path=folder.join("servos.sqlite");
        let db=store::open(&path).map_err(std::io::Error::other)?;
        // Sessions never survive process restart.
        db.execute("DELETE FROM sessions",[])?;
        app.manage(Runtime{db:Mutex::new(db),path,syncing:Mutex::new(false)});Ok(())
    }).invoke_handler(tauri::generate_handler![runtime_status,runtime_login,runtime_lock,runtime_snapshot,runtime_command,runtime_enroll,runtime_sync,runtime_backup]).run(tauri::generate_context!()).expect("Unable to start ServOS");
}
