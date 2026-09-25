mod store;
mod printer;
#[cfg(test)]
mod tests;
use rusqlite::{Connection, OptionalExtension};
use serde_json::{json, Value};
use std::{path::PathBuf, sync::Mutex};
use tauri::{Manager, State};

struct Runtime {
    db: Mutex<Connection>,
    path: PathBuf,
    syncing: Mutex<bool>,
}
#[tauri::command]
fn runtime_status(state: State<Runtime>) -> store::Result<Value> {
    let db=state.db.lock().map_err(|e|e.to_string())?;
    let mut stmt=db.prepare("SELECT id,name,role FROM staff WHERE active=1 ORDER BY name").map_err(|e|e.to_string())?;
    let staff=stmt.query_map([],|r|Ok(json!({"id":r.get::<_,String>(0)?,"name":r.get::<_,String>(1)?,"role":r.get::<_,String>(2)?}))).map_err(|e|e.to_string())?.collect::<Result<Vec<_>,_>>().map_err(|e|e.to_string())?;
    let intake=store::meta(&db,"intake_profile")?.and_then(|value|serde_json::from_str::<Value>(&value).ok());
    Ok(json!({"enrolled":store::meta(&db,"terminal_id")?.is_some(),"installationStage":store::installation_stage(&db)?,"staff":staff,"intakeProfile":intake}))
}
#[tauri::command]
fn runtime_intake_save(state: State<Runtime>, profile: Value) -> store::Result<Value> {
    let db=state.db.lock().map_err(|e|e.to_string())?;
    if store::meta(&db,"terminal_id")?.is_some(){return Err("Intake cannot be changed after enrollment".into());}
    if !profile.is_object(){return Err("Intake profile must be an object".into());}
    store::set_meta(&db,"intake_profile",&profile.to_string())?; store::set_meta(&db,"installation_stage","INTAKE_IN_PROGRESS")?; Ok(profile)
}
#[tauri::command]
fn runtime_intake_complete(state: State<Runtime>, profile: Value) -> store::Result<Value> {
    let db=state.db.lock().map_err(|e|e.to_string())?;
    if store::meta(&db,"terminal_id")?.is_some(){return Err("Intake cannot be changed after enrollment".into());}
    if !profile.is_object(){return Err("Intake profile must be an object".into());}
    store::set_meta(&db,"intake_profile",&profile.to_string())?; store::set_meta(&db,"installation_stage","READY_FOR_ENROLLMENT")?; Ok(profile)
}
#[tauri::command]
fn runtime_intake_clear(state: State<Runtime>) -> store::Result<()> {
    let db=state.db.lock().map_err(|e|e.to_string())?;
    if store::meta(&db,"terminal_id")?.is_some(){return Err("Intake cannot be cleared after enrollment".into());}
    db.execute("DELETE FROM metadata WHERE key IN ('intake_profile','installation_stage')",[]).map_err(|e|e.to_string())?; Ok(())
}
#[tauri::command]
fn runtime_login(
    state: State<Runtime>,
    staff_id: String,
    pin: String,
) -> store::Result<store::Session> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    store::login(&db, &staff_id, &pin)
}
#[tauri::command]
fn runtime_lock(state: State<Runtime>, token: String) -> store::Result<()> {
    state
        .db
        .lock()
        .map_err(|e| e.to_string())?
        .execute("DELETE FROM sessions WHERE token=?", [token])
        .map_err(|e| e.to_string())?;
    Ok(())
}
#[tauri::command]
fn runtime_snapshot(state: State<Runtime>, token: String) -> store::Result<Value> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    store::snapshot(&db, &token)
}
#[tauri::command]
fn runtime_command(
    state: State<Runtime>,
    token: String,
    command: store::BusinessCommand,
) -> store::Result<Value> {
    let mut db = state.db.lock().map_err(|e| e.to_string())?;
    store::execute(&mut db, &token, command)
}
#[tauri::command]
fn runtime_manager_approve(state: State<Runtime>, token: String, approver_id: String, pin: String, permission: String, target: Option<String>) -> store::Result<Value> {
    let db=state.db.lock().map_err(|e|e.to_string())?;
    store::create_approval(&db,&token,&approver_id,&pin,&permission,target.as_deref())
}

fn validate_url(url: &str) -> store::Result<String> {
    let parsed = reqwest::Url::parse(url).map_err(|_| "Invalid Supabase URL")?;
    if parsed.scheme() != "https"
        || !parsed.host_str().unwrap_or("").ends_with(".supabase.co")
        || parsed.path() != "/"
        || !parsed.username().is_empty()
        || parsed.password().is_some()
        || parsed.query().is_some()
        || parsed.fragment().is_some()
    {
        return Err("Use the HTTPS project URL ending in .supabase.co".into());
    }
    Ok(url.trim_end_matches('/').into())
}
async fn rpc(
    url: &str,
    key: &str,
    auth: Option<&str>,
    name: &str,
    body: Value,
) -> store::Result<Value> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(30))
        .build()
        .map_err(|e| e.to_string())?;
    let mut req = client
        .post(format!("{url}/rest/v1/rpc/{name}"))
        .header("apikey", key)
        .json(&body);
    if let Some(token) = auth {
        req = req.bearer_auth(token);
    }
    let res = req
        .send()
        .await
        .map_err(|_| "Server unreachable; all local operations remain queued")?;
    if !res.status().is_success() {
        return Err(format!(
            "Server rejected request ({}); local data retained",
            res.status()
        ));
    }
    res.json()
        .await
        .map_err(|_| "Invalid server response; local data retained".into())
}
#[tauri::command]
async fn runtime_enroll(
    state: State<'_, Runtime>,
    url: String,
    publishable_key: String,
    access_token: String,
    owner_name: String,
    pin: String,
    business_name: String,
) -> store::Result<()> {
    let url = validate_url(&url)?;
    store::hash_pin(&pin)?;
    {
        let db=state.db.lock().map_err(|e|e.to_string())?;
        let stage=store::installation_stage(&db)?;
        if !["READY_FOR_ENROLLMENT","ENROLLMENT_PENDING"].contains(&stage.as_str()){return Err("Complete and confirm the Intake Wizard before owner enrollment".into());}
        store::set_meta(&db,"installation_stage","ENROLLMENT_PENDING")?;
    }
    if owner_name.trim().is_empty() || business_name.trim().is_empty() {
        return Err("Owner and business names are required".into());
    }
    let (terminal, credential) = {
        let mut db = state.db.lock().map_err(|e| e.to_string())?;
        if store::meta(&db, "terminal_id")?.is_some() {
            return Err("Already enrolled".into());
        }
        let tx = db.transaction().map_err(|e| e.to_string())?;
        let terminal = store::meta(&tx, "pending_terminal")?
            .unwrap_or_else(|| uuid::Uuid::new_v4().to_string());
        let credential = store::meta(&tx, "device_token")?.unwrap_or_else(|| {
            format!(
                "{}{}",
                uuid::Uuid::new_v4().simple(),
                uuid::Uuid::new_v4().simple()
            )
        });
        store::set_meta(&tx, "pending_terminal", &terminal)?;
        store::set_meta(&tx, "device_token", &credential)?;
        store::set_meta(&tx, "cloud_url", &url)?;
        store::set_meta(&tx, "cloud_key", &publishable_key)?;
        tx.commit().map_err(|e| e.to_string())?;
        (terminal, credential)
    };
    let result=rpc(&url,&publishable_key,Some(&access_token),"servos_enroll",json!({"business_name":business_name,"installation_id":terminal,"device_secret":credential})).await?;
    if store::text(&result, "terminalId")? != terminal {
        return Err("Unexpected enrollment response".into());
    }
    let mut db = state.db.lock().map_err(|e| e.to_string())?;
    store::initialize(&mut db, &terminal, &owner_name, &pin, &business_name)?;
    Ok(())
}
#[tauri::command]
async fn runtime_sync(state: State<'_, Runtime>, token: String) -> store::Result<Value> {
    {
        let mut running = state.syncing.lock().map_err(|e| e.to_string())?;
        if *running {
            return Err("Synchronization already running".into());
        }
        *running = true;
    }
    let result = sync_inner(&state, &token).await;
    if let Ok(mut running) = state.syncing.lock() {
        *running = false;
    }
    result
}
async fn sync_inner(state: &Runtime, token: &str) -> store::Result<Value> {
    let (url, key, credential, terminal, operations) = {
        let db = state.db.lock().map_err(|e| e.to_string())?;
        store::actor(&db, token, false)?;
        let required =
            |k| store::meta(&db, k)?.ok_or_else(|| format!("Cloud configuration missing: {k}"));
        let mut stmt=db.prepare("SELECT envelope FROM outbox WHERE acknowledged_at IS NULL ORDER BY sequence LIMIT 100").map_err(|e|e.to_string())?;
        let strings = stmt
            .query_map([], |r| r.get::<_, String>(0))
            .map_err(|e| e.to_string())?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| e.to_string())?;
        let operations = strings
            .iter()
            .map(|s| serde_json::from_str::<Value>(s).map_err(|e| e.to_string()))
            .collect::<store::Result<Vec<_>>>()?;
        (
            required("cloud_url")?,
            required("cloud_key")?,
            required("device_token")?,
            required("terminal_id")?,
            operations,
        )
    };
    let result = rpc(
        &url,
        &key,
        None,
        "servos_upload",
        json!({"terminal_id":terminal,"device_token":credential,"operations":operations}),
    )
    .await?;
    let cursor = result["acknowledgedSequence"]
        .as_i64()
        .ok_or("Server acknowledgement missing")?;
    let maximum = operations
        .last()
        .and_then(|v| v["sequence"].as_i64())
        .unwrap_or(cursor);
    if cursor > maximum {
        return Err("Unexpected server acknowledgement; queue retained".into());
    }
    {
        let mut db = state.db.lock().map_err(|e| e.to_string())?;
        let tx = db.transaction().map_err(|e| e.to_string())?;
        // Acknowledgements apply only to operations actually included in this request.
        for op in &operations {
            let seq = op["sequence"].as_i64().ok_or("Invalid local sequence")?;
            if seq <= cursor {
                tx.execute(
                    "UPDATE outbox SET acknowledged_at=? WHERE sequence=?",
                    rusqlite::params![chrono::Utc::now().to_rfc3339(), seq],
                )
                .map_err(|e| e.to_string())?;
            }
        }
        store::set_meta(&tx, "last_sync", &chrono::Utc::now().to_rfc3339())?;
        tx.commit().map_err(|e| e.to_string())?;
    }
    // Apply requests only after the terminal has uploaded its entire current queue.
    let pending: i64 = {
        let db = state.db.lock().map_err(|e| e.to_string())?;
        db.query_row(
            "SELECT COUNT(*) FROM outbox WHERE acknowledged_at IS NULL",
            [],
            |r| r.get(0),
        )
        .map_err(|e| e.to_string())?
    };
    if pending == 0 {
        let requests = rpc(
            &url,
            &key,
            None,
            "servos_poll_requests",
            json!({"terminal_id":terminal,"device_token":credential}),
        )
        .await?;
        for request in requests
            .as_array()
            .ok_or("Invalid remote request response")?
        {
            let request_id = store::text(request, "id")?.to_string();
            let outcome = {
                let mut db = state.db.lock().map_err(|e| e.to_string())?;
                let cached: Option<String> = db
                    .query_row(
                        "SELECT result FROM remote_requests WHERE id=?",
                        [&request_id],
                        |r| r.get(0),
                    )
                    .optional()
                    .map_err(|e| e.to_string())?;
                if let Some(result) = cached {
                    serde_json::from_str::<Value>(&result).map_err(|e| e.to_string())?
                } else {
                    let operation = store::text(request, "operation")?;
                    let allowed = ["record.save", "record.archive"].contains(&operation)
                        && ["products", "tables", "customers", "suppliers", "priceRules"]
                            .contains(&request["payload"]["collection"].as_str().unwrap_or(""));
                    let result = if !allowed {
                        Err("Remote operation is not permitted".into())
                    } else {
                        let actor = store::Session {
                            token: String::new(),
                            staff_id: format!("remote:{}", store::text(request, "authorId")?),
                            name: "Remote manager".into(),
                            role: "Manager".into(),
                        };
                        store::execute_as(
                            &mut db,
                            &actor,
                            store::BusinessCommand {
                                id: request_id.clone(),
                                schema_version: 1,
                                operation: operation.into(),
                                target_version: request["expectedVersion"].as_i64(),
                                payload: request["payload"].clone(),
                            },
                        )
                    };
                    let outcome = match result {
                        Ok(result) => json!({"status":"applied","result":result}),
                        Err(message) => {
                            json!({"status":if message.starts_with("CONFLICT:"){"conflict"}else{"rejected"},"result":{"message":message}})
                        }
                    };
                    db.execute(
                        "INSERT INTO remote_requests VALUES(?,?,?)",
                        rusqlite::params![
                            request_id,
                            outcome["status"].as_str(),
                            outcome.to_string()
                        ],
                    )
                    .map_err(|e| e.to_string())?;
                    outcome
                }
            };
            // Successful effects must be replicated before the remote UI can say applied.
            let can_ack = if outcome["status"] == "applied" {
                let db = state.db.lock().map_err(|e| e.to_string())?;
                db.query_row("SELECT EXISTS(SELECT 1 FROM outbox WHERE command_id=? AND acknowledged_at IS NOT NULL)",[&request_id],|r|r.get::<_,bool>(0)).map_err(|e|e.to_string())?
            } else {
                true
            };
            if can_ack {
                rpc(&url,&key,None,"servos_ack_request",json!({"terminal_id":terminal,"device_token":credential,"request_id":request_id,"request_status":outcome["status"],"request_result":outcome["result"]})).await?;
            }
        }
    }
    Ok(result)
}
#[tauri::command]
fn runtime_backup(state: State<Runtime>, token: String) -> store::Result<String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let actor = store::actor(&db, &token, true)?;
    if !store::permissions(&actor.role).contains(&"backup.create") { return Err("Backup permission required".into()); }
    let folder = state
        .path
        .parent()
        .ok_or("Missing application folder")?
        .join("backups");
    std::fs::create_dir_all(&folder).map_err(|e| e.to_string())?;
    let path = folder.join(format!(
        "servos-{}.sqlite",
        chrono::Utc::now().format("%Y%m%dT%H%M%S%f")
    ));
    db.backup(rusqlite::DatabaseName::Main, &path, None).map_err(|e|e.to_string())?;
    store::set_meta(&db,"last_backup",&chrono::Utc::now().to_rfc3339())?;
    Ok(path.to_string_lossy().into())
}

fn printer_policy(db: &Connection) -> Value {
    store::get(db, "tillPolicy", "main")
        .map(|(_, policy)| policy)
        .unwrap_or_else(|_| json!({}))
}

fn require_printer_permission(db: &Connection, token: &str, permission: &str) -> store::Result<store::Session> {
    let actor = store::actor(db, token, true)?;
    if !store::permissions(&actor.role).contains(&permission) {
        return Err(format!("Permission required: {permission}"));
    }
    Ok(actor)
}

fn execute_printer_job(state: &Runtime, job_id: &str) -> store::Result<Value> {
    let (policy, payload, order_id) = {
        let db = state.db.lock().map_err(|e| e.to_string())?;
        let row: (String, String, String) = db.query_row(
            "SELECT profile,payload,order_id FROM receipt_print_jobs WHERE id=?",
            [job_id],
            |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?)),
        ).map_err(|e| e.to_string())?;
        db.execute("UPDATE receipt_print_jobs SET state='SENDING',message='Sending to printer',updated_at=? WHERE id=?", rusqlite::params![chrono::Utc::now().to_rfc3339(), job_id]).map_err(|e| e.to_string())?;
        (
            serde_json::from_str::<Value>(&row.0).map_err(|e| e.to_string())?,
            serde_json::from_str::<Value>(&row.1).map_err(|e| e.to_string())?,
            row.2,
        )
    };

    let result = match printer::PrinterProfile::from_policy(&policy) {
        Ok(profile) => {
            let customer = payload["customerLines"].as_array().map(|lines| lines.iter().filter_map(Value::as_str).map(str::to_string).collect::<Vec<_>>()).unwrap_or_default();
            let business = payload["businessLines"].as_array().map(|lines| lines.iter().filter_map(Value::as_str).map(str::to_string).collect::<Vec<_>>()).unwrap_or_default();
            let bytes = printer::encode_receipt(&customer, &business, &profile);
            match printer::send(&profile, &bytes) {
                Ok(message) => ("SENT", message.to_string()),
                Err(printer::SendFailure::Queued(message)) => ("QUEUED", message),
                Err(printer::SendFailure::Uncertain(message)) => ("DELIVERY_UNCERTAIN", message),
            }
        }
        Err(message) => ("QUEUED", message),
    };

    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.execute("UPDATE receipt_print_jobs SET state=?,message=?,updated_at=? WHERE id=?", rusqlite::params![result.0,result.1,chrono::Utc::now().to_rfc3339(),job_id]).map_err(|e| e.to_string())?;
    Ok(json!({"jobId":job_id,"orderId":order_id,"state":result.0,"message":result.1}))
}

fn queue_printer_job(state: &Runtime, job_id: String, order_id: String, policy: Value, customer_lines: Vec<String>, business_lines: Vec<String>) -> store::Result<Value> {
    let payload = json!({"customerLines":customer_lines,"businessLines":business_lines});
    {
        let db = state.db.lock().map_err(|e| e.to_string())?;
        let existing: Option<(String,String)> = db.query_row("SELECT state,message FROM receipt_print_jobs WHERE id=?", [&job_id], |r| Ok((r.get(0)?,r.get(1)?))).optional().map_err(|e| e.to_string())?;
        if let Some((state,message)) = existing {
            return Ok(json!({"jobId":job_id,"orderId":order_id,"state":state,"message":message}));
        }
        db.execute("INSERT INTO receipt_print_jobs(id,order_id,profile,payload,state,message,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)", rusqlite::params![job_id,order_id,policy.to_string(),payload.to_string(),"QUEUED","Waiting to send",chrono::Utc::now().to_rfc3339(),chrono::Utc::now().to_rfc3339()]).map_err(|e| e.to_string())?;
    }
    execute_printer_job(state, &job_id)
}

#[tauri::command]
fn runtime_print_receipt(state: State<Runtime>, token: String, job_id: String, order_id: String, customer_lines: Vec<String>, business_lines: Vec<String>) -> store::Result<Value> {
    let policy = {
        let db = state.db.lock().map_err(|e| e.to_string())?;
        require_printer_permission(&db, &token, "pos.sell")?;
        printer_policy(&db)
    };
    let profile = printer::PrinterProfile::from_policy(&policy)?;
    match profile.mode.as_str() {
        "OS_PRINT" => return Ok(json!({"state":"OS_DIALOG","mode":profile.mode})),
        "MANUAL" => return Ok(json!({"state":"MANUAL","mode":profile.mode})),
        _ => {}
    }
    queue_printer_job(&state, job_id, order_id, policy, customer_lines, business_lines)
}

#[tauri::command]
fn runtime_printer_test(state: State<Runtime>, token: String) -> store::Result<Value> {
    let policy = {
        let db = state.db.lock().map_err(|e| e.to_string())?;
        require_printer_permission(&db, &token, "business.configure")?;
        printer_policy(&db)
    };
    let profile = printer::PrinterProfile::from_policy(&policy)?;
    if !["XP80T_LAN_ESC_POS", "XP80T_USB_ESC_POS"].contains(&profile.mode.as_str()) {
        return Err("Select XP-80T LAN or Windows USB queue mode before sending a test slip".into());
    }
    let stamp = chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string();
    queue_printer_job(&state, uuid::Uuid::new_v4().to_string(), "PRINTER_TEST".into(), policy, vec!["SERVOS XP-80T PRINTER TEST".into(),format!("Sent at {stamp}"),"Paper output must be checked at the printer.".into()], vec![])
}

#[tauri::command]
fn runtime_printer_retry(state: State<Runtime>, token: String, job_id: String, confirm_duplicate: bool) -> store::Result<Value> {
    {
        let db = state.db.lock().map_err(|e| e.to_string())?;
        require_printer_permission(&db, &token, "pos.sell")?;
        let state: String = db.query_row("SELECT state FROM receipt_print_jobs WHERE id=?", [&job_id], |r| r.get(0)).map_err(|e| e.to_string())?;
        if state == "DELIVERY_UNCERTAIN" && !confirm_duplicate {
            return Err("The first send may already have printed. Confirm possible duplicate before retrying".into());
        }
        if state != "QUEUED" && state != "DELIVERY_UNCERTAIN" {
            return Err("This print job is already being sent or has been sent".into());
        }
        let claimed = db.execute("UPDATE receipt_print_jobs SET state='SENDING',updated_at=? WHERE id=? AND state=?", rusqlite::params![chrono::Utc::now().to_rfc3339(), job_id, state]).map_err(|e| e.to_string())?;
        if claimed != 1 { return Err("Another print attempt already claimed this job".into()); }
    }
    execute_printer_job(&state, &job_id)
}

#[tauri::command]
fn runtime_printer_jobs(state: State<Runtime>, token: String) -> store::Result<Value> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    require_printer_permission(&db, &token, "pos.sell")?;
    let mut stmt = db.prepare("SELECT id,order_id,state,message,created_at FROM receipt_print_jobs WHERE state!='SENT' ORDER BY created_at DESC LIMIT 50").map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |r| Ok(json!({"jobId":r.get::<_,String>(0)?,"orderId":r.get::<_,String>(1)?,"state":r.get::<_,String>(2)?,"message":r.get::<_,String>(3)?,"createdAt":r.get::<_,String>(4)?}))).map_err(|e| e.to_string())?;
    let mut jobs=Vec::new();
    for row in rows { jobs.push(row.map_err(|e| e.to_string())?); }
    Ok(json!(jobs))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let folder = app.path().app_data_dir()?;
            std::fs::create_dir_all(&folder)?;
            let path = folder.join("servos.sqlite");
            let db = store::open(&path).map_err(std::io::Error::other)?;
            // Sessions never survive process restart.
            db.execute("DELETE FROM sessions", [])?;
            db.execute_batch("CREATE TABLE IF NOT EXISTS receipt_print_jobs (id TEXT PRIMARY KEY,order_id TEXT NOT NULL,profile TEXT NOT NULL,payload TEXT NOT NULL,state TEXT NOT NULL,message TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL); UPDATE receipt_print_jobs SET state='DELIVERY_UNCERTAIN',message='App restarted while the printer send was in progress. Check paper before retrying.' WHERE state='SENDING';")?;
            app.manage(Runtime {
                db: Mutex::new(db),
                path,
                syncing: Mutex::new(false),
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            runtime_status,
            runtime_intake_save,
            runtime_intake_complete,
            runtime_intake_clear,
            runtime_login,
            runtime_lock,
            runtime_snapshot,
            runtime_command,
            runtime_manager_approve,
            runtime_enroll,
            runtime_sync,
            runtime_backup,
            runtime_print_receipt,
            runtime_printer_test,
            runtime_printer_retry,
            runtime_printer_jobs
        ])
        .run(tauri::generate_context!())
        .expect("Unable to start ServOS");
}
