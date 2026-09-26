use super::store::*;
use serde_json::{json, Value};
use uuid::Uuid;

fn setup() -> (tempfile::TempDir, rusqlite::Connection, Session) {
    let dir = tempfile::tempdir().unwrap();
    let mut db = open(&dir.path().join("test.sqlite")).unwrap();
    initialize(&mut db, "terminal-test", "Owner", "827193", "Test business").unwrap();
    let user: String = db.query_row("SELECT id FROM staff", [], |r| r.get(0)).unwrap();
    let session = login(&db, &user, "827193").unwrap();

    let (property_version, mut property) = get(&db, "property", "property").unwrap();
    property["taxConfigured"] = json!(true); property["pricesIncludeTax"] = json!(true);
    property["vatRatePct"] = json!(0); property["levyRatePct"] = json!(0);
    let mut save_property = cmd("record.save", json!({"collection":"property","id":"property","data":property}));
    save_property.target_version = Some(property_version); execute(&mut db, &session.token, save_property).unwrap();
    run(&mut db,&session,"record.save",json!({"collection":"stockLocations","id":"main","data":{"name":"Main Store","code":"MAIN","baseUnit":"unit"}}));
    run(&mut db,&session,"record.save",json!({"collection":"outlets","id":"main","data":{"name":"Main Bar","propertyId":"property","type":"BAR","active":true,"defaultStockLocationId":"main"}}));
    run(&mut db,&session,"record.save",json!({"collection":"paymentConfig","id":"main","data":{"name":"Payments","methods":["CASH","MPESA","CARD"],"mpesaAccounts":[{"label":"Primary","number":"123456"}]}}));
    run(&mut db,&session,"record.save",json!({"collection":"tillPolicy","id":"main","data":{"name":"Till policy","defaultOpeningFloat":0,"varianceThreshold":50}}));
    set_meta(&db, "last_backup", "2026-09-26T00:00:00Z").unwrap();
    run(&mut db,&session,"record.save",json!({"collection":"products","id":"setup-product","data":{"name":"Setup Product","code":"SETUP","price":1,"routeTo":"SERVICE","category":"TEST","outletIds":["main"],"taxClassId":"A_STANDARD"}}));
    for step in ["BUSINESS_IDENTITY","TAX","PAYMENTS","SERVICE_AREAS","STOCK_LOCATIONS","CATALOG","OPENING_INVENTORY","STAFF_ACCESS","TILL","BACKUP_SYNC"] {
        run(&mut db,&session,"setup.completeStep",json!({"step":step}));
    }
    run(&mut db,&session,"setup.goLive",json!({}));
    (dir, db, session)
}
fn cmd(op: &str, payload: Value) -> BusinessCommand {
    BusinessCommand {
        id: Uuid::new_v4().to_string(),
        schema_version: 1,
        operation: op.into(),
        target_version: None,
        payload,
    }
}
fn run(db: &mut rusqlite::Connection, s: &Session, op: &str, p: Value) -> Value {
    execute(db, &s.token, cmd(op, p)).unwrap()
}
fn order(db: &mut rusqlite::Connection, s: &Session) -> String {
    let product = Uuid::new_v4().to_string();
    run(
        db,
        s,
        "record.save",
        json!({"collection":"products","id":product,"data":{"name":"Service","code":product,"price":100,"routeTo":"SERVICE","outletIds":["main"]}}),
    );
    let result = run(db, s, "order.create", json!({"name":"Walk-in","outletId":"main"}));
    let id = result["recordIds"][0].as_str().unwrap().to_string();
    run(
        db,
        s,
        "order.addItem",
        json!({"orderId":id,"productId":product}),
    );
    id
}
#[test]
fn duplicate_payment_is_idempotent_and_survives_restart() {
    let (dir, mut db, s) = setup();
    run(&mut db, &s, "till.open", json!({"floatAmount":200}));
    let id = order(&mut db, &s);
    let payment = cmd(
        "payment.record",
        json!({"orderId":id,"method":"CASH","amount":100,"cashTendered":100}),
    );
    let first = execute(&mut db, &s.token, payment.clone()).unwrap();
    assert_eq!(first, execute(&mut db, &s.token, payment).unwrap());
    assert_eq!(list(&db, "payments").unwrap().len(), 1);
    assert_eq!(list(&db, "journalEntries").unwrap().len(), 1);
    assert_eq!(get(&db, "orders", &id).unwrap().1["amountPaid"], 100.0);
    drop(db);
    let reopened = open(&dir.path().join("test.sqlite")).unwrap();
    assert_eq!(list(&reopened, "payments").unwrap().len(), 1);
}

#[test]
fn receipt_is_atomic_immutable_and_keeps_cash_header_and_partial_history() {
    let (dir,mut db,s)=setup();
    run(&mut db,&s,"till.open",json!({"floatAmount":200}));
    let oid=order(&mut db,&s);
    let first=cmd("payment.record",json!({"orderId":oid,"method":"CASH","amount":40,"cashTendered":50}));
    execute(&mut db,&s.token,first.clone()).unwrap();
    execute(&mut db,&s.token,first).unwrap();
    let original=receipts::load(&db,&s.token,&oid,None).unwrap();
    assert_eq!(original["balanceMinor"],6000);
    assert_eq!(original["payments"][0]["cashTenderedMinor"],5000);
    assert_eq!(original["payments"][0]["changeMinor"],1000);
    assert_eq!(list(&db,"receiptDocuments").unwrap().len(),1);
    let (version,mut business)=get(&db,"organization","business").unwrap();
    business["name"]=json!("Changed business");
    let mut update=cmd("record.save",json!({"collection":"organization","id":"business","data":business}));update.target_version=Some(version);
    execute(&mut db,&s.token,update).unwrap();
    run(&mut db,&s,"payment.split",json!({"orderId":oid,"payments":[{"method":"CASH","amount":20,"cashTendered":20},{"method":"CARD","amount":40,"cardAuthCode":"APPROVED-1"}]}));
    let latest=receipts::load(&db,&s.token,&oid,None).unwrap();
    assert_eq!(latest["balanceMinor"],0);
    assert_eq!(latest["payments"].as_array().unwrap().len(),3);
    assert_eq!(latest["business"]["name"],"Changed business");
    let original_id=original["id"].as_str().unwrap();
    assert_eq!(receipts::load(&db,&s.token,&oid,Some(original_id)).unwrap(),original);
    assert!(db.execute("UPDATE records SET data='{}' WHERE collection='receiptDocuments'",[]).is_err());
    assert!(db.execute("DELETE FROM records WHERE collection='receiptDocuments'",[]).is_err());
    assert!(receipts::load(&db,&s.token,"other-order",Some(original_id)).is_err());
    let lines=receipts::lines(&latest,false,48,true).join("\n");
    for footer in receipts::FOOTER{assert!(lines.contains(footer));}
    assert!(lines.contains("REPRINT"));assert!(!lines.contains("eTIMS"));
    drop(db);
    let reopened=open(&dir.path().join("test.sqlite")).unwrap();
    assert_eq!(get(&reopened,"receiptDocuments",original_id).unwrap().1,original);
}

#[test]
fn failed_split_captures_no_receipt_or_payment() {
    let (_dir,mut db,s)=setup();run(&mut db,&s,"till.open",json!({"floatAmount":0}));let oid=order(&mut db,&s);
    let result=execute(&mut db,&s.token,cmd("payment.split",json!({"orderId":oid,"payments":[{"method":"CASH","amount":50,"cashTendered":50},{"method":"CARD","amount":50,"cardAuthCode":""}]})));
    assert!(result.is_err());assert!(list(&db,"payments").unwrap().is_empty());assert!(list(&db,"receiptDocuments").unwrap().is_empty());
}
#[test]
fn invalid_split_rolls_back_every_effect() {
    let (_, mut db, s) = setup();
    run(&mut db, &s, "till.open", json!({"floatAmount":0}));
    let id = order(&mut db, &s);
    let before: i64 = db
        .query_row("SELECT COUNT(*) FROM outbox", [], |r| r.get(0))
        .unwrap();
    let result = execute(
        &mut db,
        &s.token,
        cmd(
            "payment.split",
            json!({"orderId":id,"payments":[{"method":"CASH","amount":40,"cashTendered":40},{"method":"CARD","amount":60,"cardAuthCode":""}]}),
        ),
    );
    assert!(result.is_err());
    assert!(list(&db, "payments").unwrap().is_empty());
    assert!(list(&db, "journalEntries").unwrap().is_empty());
    assert_eq!(get(&db, "orders", &id).unwrap().1["amountPaid"], 0);
    assert_eq!(
        list(&db, "tillSessions").unwrap()[0]["data"]["cashSalesTotal"],
        0
    );
    assert_eq!(
        before,
        db.query_row("SELECT COUNT(*) FROM outbox", [], |r| r.get::<_, i64>(0))
            .unwrap()
    );
}
#[test]
fn receipt_allocation_prevents_double_spending() {
    let (_, mut db, s) = setup();
    run(&mut db, &s, "till.open", json!({"floatAmount":0}));
    let first = order(&mut db, &s);
    let second = order(&mut db, &s);
    let receipt = json!({"code":"ABC123XYZ","account":"123456","receivedAmount":100,"receivedAt":"2026-09-24T08:00:00+03:00","confirmed":true});
    run(
        &mut db,
        &s,
        "payment.record",
        json!({"orderId":first,"method":"MPESA","amount":100,"mpesa":receipt}),
    );
    assert!(execute(
        &mut db,
        &s.token,
        cmd(
            "payment.record",
            json!({"orderId":second,"method":"MPESA","amount":100,"mpesa":receipt})
        )
    )
    .is_err());
    assert_eq!(list(&db, "payments").unwrap().len(), 1);
    assert_eq!(list(&db, "mpesaReceipts").unwrap().len(), 1);
}

#[test]
fn mpesa_statement_variance_requires_audited_resolution() {
    let (_, mut db, s) = setup();
    run(&mut db, &s, "till.open", json!({"floatAmount":0}));
    let order_id = order(&mut db, &s);
    let receipt = json!({"code":"VAR123XYZ","account":"123456","receivedAmount":100,"receivedAt":"2026-09-24T08:00:00+03:00","confirmed":true});
    run(&mut db, &s, "payment.record", json!({"orderId":order_id,"method":"MPESA","amount":100,"mpesa":receipt}));
    let receipt_id = list(&db, "mpesaReceipts").unwrap()[0]["id"].as_str().unwrap().to_string();
    let mismatch = execute(&mut db, &s.token, cmd("mpesa.reconcile", json!({"receiptId":receipt_id,"statementAmount":90,"statementReference":"STMT-1","notes":"Difference"}))).unwrap_err();
    assert!(mismatch.to_string().contains("record and resolve the discrepancy"));
    run(&mut db, &s, "mpesa.discrepancy", json!({"receiptId":receipt_id,"statementAmount":90,"statementReference":"STMT-1","reason":"Account statement shows a partial amount"}));
    let discrepancy_id = list(&db, "mpesaDiscrepancies").unwrap()[0]["id"].as_str().unwrap().to_string();
    run(&mut db, &s, "mpesa.discrepancy.resolve", json!({"discrepancyId":discrepancy_id,"outcome":"ACCEPTED_VARIANCE","resolution":"Verified this statement line is a partial settlement"}));
    let wrong_amount = execute(&mut db, &s.token, cmd("mpesa.reconcile", json!({"receiptId":receipt_id,"statementAmount":80,"statementReference":"STMT-1","notes":"Wrong line"}))).unwrap_err();
    assert!(wrong_amount.to_string().contains("record and resolve the discrepancy"));
    run(&mut db, &s, "mpesa.reconcile", json!({"receiptId":receipt_id,"statementAmount":90,"statementReference":"STMT-1","notes":"Resolved accepted variance"}));
    assert_eq!(get(&db, "mpesaReceipts", &receipt_id).unwrap().1["reconciliationStatus"], "RECONCILED_WITH_DISCREPANCY");
    assert_eq!(get(&db, "mpesaDiscrepancies", &discrepancy_id).unwrap().1["status"], "RESOLVED");
}
#[test]
fn version_conflicts_cannot_overwrite_records() {
    let (_, mut db, s) = setup();
    let version = get(&db, "property", "property").unwrap().0;
    let mut update = cmd(
        "record.save",
        json!({"collection":"property","id":"property","data":{"name":"Changed"}}),
    );
    assert!(execute(&mut db, &s.token, update.clone()).is_err());
    update.target_version = Some(version);
    execute(&mut db, &s.token, update.clone()).unwrap();
    update.id = Uuid::new_v4().to_string();
    assert!(execute(&mut db, &s.token, update).is_err());
}
#[test]
fn server_cannot_edit_catalog_or_create_staff() {
    let (_, mut db, s) = setup();
    run(
        &mut db,
        &s,
        "staff.create",
        json!({"name":"Cashier","pin":"982761","role":"Server"}),
    );
    let staff: String = db
        .query_row("SELECT id FROM staff WHERE role='Server'", [], |r| r.get(0))
        .unwrap();
    let cashier = login(&db, &staff, "982761").unwrap();
    assert!(execute(
        &mut db,
        &cashier.token,
        cmd(
            "record.save",
            json!({"collection":"products","id":"p","data":{"name":"X","code":"X","price":1}})
        )
    )
    .is_err());
    assert!(execute(
        &mut db,
        &cashier.token,
        cmd(
            "staff.create",
            json!({"name":"Escalation","pin":"111111","role":"Admin"})
        )
    )
    .is_err());
}
#[test]
fn pin_throttling_is_persistent() {
    let (dir, db, s) = setup();
    for _ in 0..5 {
        assert!(login(&db, &s.staff_id, "000000").is_err());
    }
    drop(db);
    let reopened = open(&dir.path().join("test.sqlite")).unwrap();
    assert!(login(&reopened, &s.staff_id, "827193").is_err());
}
#[test]
fn audit_cannot_be_modified() {
    let (_, db, _) = setup();
    assert!(db.execute("DELETE FROM audit", []).is_err());
    assert!(db.execute("UPDATE audit SET actor_id='x'", []).is_err());
}
#[test]
fn changed_payload_cannot_reuse_command_id() {
    let (_, mut db, s) = setup();
    let mut command = cmd("till.open", json!({"floatAmount":10}));
    execute(&mut db, &s.token, command.clone()).unwrap();
    command.payload = json!({"floatAmount":99});
    assert!(execute(&mut db, &s.token, command).is_err());
}
#[test]
fn transfer_and_waste_cannot_create_negative_stock() {
    let (_, mut db, s) = setup();
    run(
        &mut db,
        &s,
        "record.save",
        json!({"collection":"stockItems","id":"stock","data":{"name":"Flour","code":"FLOUR","baseUnit":"g","averageUnitCost":0.03,"currentStock":{"main":999}}}),
    );
    assert_eq!(
        get(&db, "stockItems", "stock").unwrap().1["currentStock"],
        json!({})
    );
    run(
        &mut db,
        &s,
        "inventory.adjust",
        json!({"stockItemId":"stock","locationId":"main","countedQty":10,"reason":"Opening stock count"}),
    );
    assert!(execute(
        &mut db,
        &s.token,
        cmd(
            "inventory.waste",
            json!({"stockItemId":"stock","locationId":"main","quantity":11,"reason":"Damaged"})
        )
    )
    .is_err());
    assert_eq!(
        get(&db, "stockItems", "stock").unwrap().1["currentStock"]["main"],
        10.0
    );
    assert_eq!(list(&db, "stockMovements").unwrap().len(), 1);
}
#[test]
fn tax_snapshots_and_partial_payment_rounding_preserve_totals() {
    let (_, mut db, s) = setup();
    let (version, mut property) = get(&db, "property", "property").unwrap();
    property["vatRatePct"] = json!(16);
    property["levyRatePct"] = json!(2);
    let mut policy = cmd(
        "record.save",
        json!({"collection":"property","id":"property","data":property}),
    );
    policy.target_version = Some(version);
    execute(&mut db, &s.token, policy).unwrap();
    run(&mut db, &s, "till.open", json!({"floatAmount":0}));
    let order_id = order(&mut db, &s);
    for amount in [33.33, 33.33, 33.34] {
        run(
            &mut db,
            &s,
            "payment.record",
            json!({"orderId":order_id,"method":"CASH","amount":amount,"cashTendered":amount}),
        );
    }
    let journals = list(&db, "journalEntries").unwrap();
    let mut credit = 0i64;
    let mut vat = 0i64;
    for entry in journals {
        for line in entry["data"]["lines"].as_array().unwrap() {
            credit += line["creditMinor"].as_i64().unwrap();
            if line["accountId"] == "VAT" {
                vat += line["creditMinor"].as_i64().unwrap();
            }
        }
    }
    assert_eq!(credit, 10000);
    assert_eq!(vat, 1356);
    assert_eq!(
        get(&db, "orders", &order_id).unwrap().1["state"],
        "COMPLETED"
    );
}

fn layout_table(key: &str, label: &str) -> Value {
    json!({"id":key,"label":label,"capacity":4,"section":"MAIN_DECK","shape":"SQUARE","posX":10,"posY":20,"minimumSpend":0,"isJoinable":true})
}
fn layout(db: &rusqlite::Connection, tables: Value) -> BusinessCommand {
    let baseline: Vec<Value> = list(db, "tables")
        .unwrap()
        .into_iter()
        .filter(|r| r["data"]["outletId"] == "main")
        .map(|r| json!({"id":r["id"],"version":r["version"]}))
        .collect();
    cmd(
        "floorplan.save",
        json!({"outletId":"main","baseline":baseline,"tables":tables}),
    )
}
#[test]
fn paid_table_requires_cleaning_and_readiness_survives_restart() {
    let (dir, mut db, s) = setup();
    let key = Uuid::new_v4().to_string();
    let create = layout(&db, json!([layout_table(&key, "1")]));
    execute(&mut db, &s.token, create).unwrap();
    let product = Uuid::new_v4().to_string();
    run(
        &mut db,
        &s,
        "record.save",
        json!({"collection":"products","id":product,"data":{"name":"Service","code":product,"price":100,"routeTo":"SERVICE","outletIds":["main"]}}),
    );
    run(&mut db, &s, "till.open", json!({"floatAmount":0}));
    let result = run(&mut db, &s, "order.create", json!({"tableId":key,"outletId":"main"}));
    let order_id = result["recordIds"][0].as_str().unwrap();
    run(
        &mut db,
        &s,
        "order.addItem",
        json!({"orderId":order_id,"productId":product}),
    );
    run(
        &mut db,
        &s,
        "payment.record",
        json!({"orderId":order_id,"method":"CASH","amount":100,"cashTendered":100}),
    );
    let (version, table) = get(&db, "tables", &key).unwrap();
    assert_eq!(table["state"], "CLEANING");
    assert!(execute(
        &mut db,
        &s.token,
        cmd("order.create", json!({"tableId":key,"outletId":"main"}))
    )
    .is_err());
    let mut ready = cmd("table.ready", json!({"tableId":key,"outletId":"main"}));
    ready.target_version = Some(version - 1);
    assert!(execute(&mut db, &s.token, ready.clone()).is_err());
    ready.target_version = Some(version);
    let result = execute(&mut db, &s.token, ready.clone()).unwrap();
    assert_eq!(execute(&mut db, &s.token, ready).unwrap(), result);
    drop(db);
    let mut db = open(&dir.path().join("test.sqlite")).unwrap();
    let table = get(&db, "tables", &key).unwrap().1;
    assert_eq!(table["state"], "AVAILABLE");
    assert_eq!(table["cleanedBy"], s.staff_id);
    run(&mut db, &s, "order.create", json!({"tableId":key,"outletId":"main"}));
    assert_eq!(list(&db, "orders").unwrap().len(), 2);
}
#[test]
fn floorplan_rejects_stale_saves_and_rolls_back_active_table_removal() {
    let (_, mut db, s) = setup();
    let a = Uuid::new_v4().to_string();
    let b = Uuid::new_v4().to_string();
    let create = layout(&db, json!([layout_table(&a, "1"), layout_table(&b, "2")]));
    execute(&mut db, &s.token, create).unwrap();
    let stale = layout(
        &db,
        json!([layout_table(&a, "Changed"), layout_table(&b, "2")]),
    );
    run(&mut db, &s, "order.create", json!({"tableId":b,"outletId":"main"}));
    assert!(execute(&mut db, &s.token, stale).is_err());
    let before = list(&db, "tables").unwrap();
    let audit_before: i64 = db
        .query_row("SELECT count(*) FROM audit", [], |r| r.get(0))
        .unwrap();
    let remove = layout(&db, json!([layout_table(&a, "Changed")]));
    assert!(execute(&mut db, &s.token, remove).is_err());
    assert_eq!(list(&db, "tables").unwrap(), before);
    assert_eq!(
        db.query_row("SELECT count(*) FROM audit", [], |r| r.get::<_, i64>(0))
            .unwrap(),
        audit_before
    );
}
#[test]
fn floorplan_changes_preserve_occupied_table_and_archive_removed_table() {
    let (dir, mut db, s) = setup();
    let a = Uuid::new_v4().to_string();
    let b = Uuid::new_v4().to_string();
    let create = layout(&db, json!([layout_table(&a, "1"), layout_table(&b, "2")]));
    execute(&mut db, &s.token, create).unwrap();
    let order = run(&mut db, &s, "order.create", json!({"tableId":a,"outletId":"main"}))["recordIds"][0].clone();
    let mut moved = layout_table(&a, "Patio 1");
    moved["posX"] = json!(80);
    moved["state"] = json!("AVAILABLE");
    moved["currentOrderId"] = Value::Null;
    let save = layout(&db, json!([moved]));
    execute(&mut db, &s.token, save).unwrap();
    drop(db);
    let db = open(&dir.path().join("test.sqlite")).unwrap();
    let table = get(&db, "tables", &a).unwrap().1;
    assert_eq!(table["currentOrderId"], order);
    assert_eq!(table["state"], "ORDERING");
    assert_eq!(table["posX"], 80);
    assert!(get(&db, "tables", &b).is_err());
}
#[test]
fn floorplan_requires_manager_and_prevents_duplicate_labels() {
    let (_, mut db, s) = setup();
    let a = Uuid::new_v4().to_string();
    let b = Uuid::new_v4().to_string();
    let duplicate = layout(
        &db,
        json!([layout_table(&a, "Table 1"), layout_table(&b, " table 1 ")]),
    );
    assert!(execute(&mut db, &s.token, duplicate).is_err());
    assert!(list(&db, "tables").unwrap().is_empty());
    run(
        &mut db,
        &s,
        "staff.create",
        json!({"name":"Server","pin":"123987","role":"Server"}),
    );
    let staff: String = db
        .query_row("SELECT id FROM staff WHERE role='Server'", [], |r| r.get(0))
        .unwrap();
    let server = login(&db, &staff, "123987").unwrap();
    let create = layout(&db, json!([layout_table(&a, "1")]));
    assert!(execute(&mut db, &server.token, create).is_err());
}

#[test]
fn trading_is_blocked_until_native_go_live() {
    let dir = tempfile::tempdir().unwrap();
    let mut db = open(&dir.path().join("prelive.sqlite")).unwrap();
    initialize(&mut db, "terminal-prelive", "Owner", "827193", "Prelive business").unwrap();
    let user: String = db.query_row("SELECT id FROM staff", [], |r| r.get(0)).unwrap();
    let session = login(&db, &user, "827193").unwrap();
    assert_eq!(installation_stage(&db).unwrap(), "SETUP_REQUIRED");
    assert!(execute(&mut db, &session.token, cmd("till.open", json!({"floatAmount":0}))).is_err());
    assert!(execute(&mut db, &session.token, cmd("order.create", json!({"outletId":"missing","name":"Nope"}))).is_err());
}

#[test]
fn payment_reverse_uses_its_declared_permission_and_requires_go_live() {
    let dir = tempfile::tempdir().unwrap();
    let mut prelive = open(&dir.path().join("reverse-prelive.sqlite")).unwrap();
    initialize(&mut prelive, "terminal-prelive", "Owner", "827193", "Prelive business").unwrap();
    let owner_id: String = prelive.query_row("SELECT id FROM staff", [], |r| r.get(0)).unwrap();
    let owner = login(&prelive, &owner_id, "827193").unwrap();
    let blocked = execute(&mut prelive, &owner.token, cmd("payment.reverse", json!({"paymentId":"missing","reason":"Test"}))).unwrap_err();
    assert!(blocked.to_string().contains("Complete business setup"));

    let (_, mut db, admin) = setup();
    run(&mut db, &admin, "staff.create", json!({"name":"Cashier","pin":"123987","role":"Server"}));
    run(&mut db, &admin, "till.open", json!({"floatAmount":100}));
    let admin_id: String = db.query_row("SELECT id FROM staff WHERE role='Admin'", [], |r| r.get(0)).unwrap();
    let cashier_id: String = db.query_row("SELECT id FROM staff WHERE role='Server'", [], |r| r.get(0)).unwrap();
    let cashier = login(&db, &cashier_id, "123987").unwrap();
    let order_id = run(&mut db, &cashier, "order.create", json!({"outletId":"main","name":"Reverse permission"}))["recordIds"][0].as_str().unwrap().to_string();
    run(&mut db, &cashier, "order.addItem", json!({"orderId":order_id,"productId":"setup-product"}));
    run(&mut db, &cashier, "order.fire", json!({"orderId":order_id}));
    run(&mut db, &cashier, "payment.record", json!({"orderId":order_id,"method":"CASH","amount":1,"cashTendered":1}));
    let payment_id = list(&db, "payments").unwrap().last().unwrap()["id"].as_str().unwrap().to_string();
    let approval = create_approval(&db, &cashier.token, &admin_id, "827193", "payment.reverse", Some(&payment_id)).unwrap();
    run(&mut db, &cashier, "payment.reverse", json!({"paymentId":payment_id,"reason":"Approved reversal","approvalToken":approval["token"]}));
    assert_eq!(list(&db, "refunds").unwrap().last().unwrap()["data"]["amount"], 1.0);
}

#[test]
fn manager_approval_is_targeted_and_single_use() {
    let (_, mut db, admin) = setup();
    run(&mut db,&admin,"staff.create",json!({"name":"Manager","pin":"654321","role":"Manager","jobTitle":"Supervisor"}));
    run(&mut db,&admin,"staff.create",json!({"name":"Bartender","pin":"123456","role":"Server","jobTitle":"Bartender"}));
    let manager_id:String=db.query_row("SELECT id FROM staff WHERE role='Manager'",[],|r|r.get(0)).unwrap();
    let server_id:String=db.query_row("SELECT id FROM staff WHERE role='Server'",[],|r|r.get(0)).unwrap();
    let server=login(&db,&server_id,"123456").unwrap();
    let order_id=run(&mut db,&server,"order.create",json!({"outletId":"main","name":"Approval test"}))["recordIds"][0].as_str().unwrap().to_string();
    run(&mut db,&server,"order.addItem",json!({"orderId":order_id,"productId":"setup-product"}));
    let approval=create_approval(&db,&server.token,&manager_id,"654321","order.discount",Some(&order_id)).unwrap();
    let token=approval["token"].as_str().unwrap();
    run(&mut db,&server,"order.discount",json!({"orderId":order_id,"percent":10,"reason":"Approved promotion","approvalToken":token}));
    assert!(execute(&mut db,&server.token,cmd("order.discount",json!({"orderId":order_id,"percent":5,"reason":"Second use","approvalToken":token}))).is_err());
    let other=run(&mut db,&server,"order.create",json!({"outletId":"main","name":"Other tab"}))["recordIds"][0].as_str().unwrap().to_string();
    run(&mut db,&server,"order.addItem",json!({"orderId":other,"productId":"setup-product"}));
    let approval=create_approval(&db,&server.token,&manager_id,"654321","order.discount",Some(&order_id)).unwrap();
    assert!(execute(&mut db,&server.token,cmd("order.discount",json!({"orderId":other,"percent":5,"reason":"Wrong target","approvalToken":approval["token"]}))).is_err());
}

#[test]
fn portion_modifier_recipe_snapshot_depletes_stock_once() {
    let (_, mut db, s)=setup();
    run(&mut db,&s,"record.save",json!({"collection":"stockItems","id":"spirit","data":{"name":"Spirit","code":"SPIRIT","baseUnit":"ml","averageUnitCost":1,"currentStock":{}}}));
    run(&mut db,&s,"record.save",json!({"collection":"stockItems","id":"mixer","data":{"name":"Mixer","code":"MIX","baseUnit":"ml","averageUnitCost":0.2,"currentStock":{}}}));
    run(&mut db,&s,"inventory.adjust",json!({"stockItemId":"spirit","locationId":"main","countedQty":750,"reason":"Test opening"}));
    run(&mut db,&s,"inventory.adjust",json!({"stockItemId":"mixer","locationId":"main","countedQty":1000,"reason":"Test opening"}));
    run(&mut db,&s,"record.save",json!({"collection":"products","id":"whisky","data":{"name":"Whisky","code":"WHISKY","price":250,"routeTo":"BAR","category":"SPIRITS","outletIds":["main"],"stockItemId":"spirit","taxClassId":"A_STANDARD","portions":[{"id":"double","name":"Double","volume":60,"price":450}],"modifiers":[{"id":"mixer","name":"Mixer","priceDelta":50,"ingredientAdjustments":[{"stockItemId":"mixer","quantityDelta":100}]}]}}));
    let result=run(&mut db,&s,"order.create",json!({"outletId":"main","name":"Portion test"}));
    let order_id=result["recordIds"][0].as_str().unwrap().to_string();
    run(&mut db,&s,"order.addItem",json!({"orderId":order_id,"productId":"whisky","quantity":2,"portionId":"double","modifierIds":["mixer"]}));
    let before=get(&db,"orders",&order_id).unwrap().1["items"][0].clone();
    assert_eq!(before["portionSnapshot"]["volume"],60);
    assert_eq!(before["ingredientSnapshot"].as_array().unwrap().len(),2);
    run(&mut db,&s,"order.fire",json!({"orderId":order_id}));
    assert_eq!(get(&db,"stockItems","spirit").unwrap().1["currentStock"]["main"],630.0);
    assert_eq!(get(&db,"stockItems","mixer").unwrap().1["currentStock"]["main"],800.0);
    run(&mut db,&s,"order.fire",json!({"orderId":order_id}));
    assert_eq!(get(&db,"stockItems","spirit").unwrap().1["currentStock"]["main"],630.0);
}

#[test]
fn refund_reverses_money_without_automatic_stock_return() {
    let (_, mut db, s)=setup();
    run(&mut db,&s,"record.save",json!({"collection":"stockItems","id":"beer-stock","data":{"name":"Beer","code":"BEER-STOCK","baseUnit":"bottle","averageUnitCost":100,"currentStock":{}}}));
    run(&mut db,&s,"inventory.adjust",json!({"stockItemId":"beer-stock","locationId":"main","countedQty":5,"reason":"Opening"}));
    run(&mut db,&s,"record.save",json!({"collection":"products","id":"beer","data":{"name":"Beer","code":"BEER","price":300,"routeTo":"BAR","category":"BEER","outletIds":["main"],"stockItemId":"beer-stock","portionVolume":1,"taxClassId":"A_STANDARD"}}));
    run(&mut db,&s,"till.open",json!({"floatAmount":1000}));
    let order_id=run(&mut db,&s,"order.create",json!({"outletId":"main","name":"Refund test"}))["recordIds"][0].as_str().unwrap().to_string();
    run(&mut db,&s,"order.addItem",json!({"orderId":order_id,"productId":"beer"}));
    run(&mut db,&s,"order.fire",json!({"orderId":order_id}));
    run(&mut db,&s,"payment.record",json!({"orderId":order_id,"method":"CASH","amount":300,"cashTendered":300}));
    let payment_id=list(&db,"payments").unwrap().last().unwrap()["id"].as_str().unwrap().to_string();
    assert_eq!(get(&db,"stockItems","beer-stock").unwrap().1["currentStock"]["main"],4.0);
    run(&mut db,&s,"payment.refund",json!({"paymentId":payment_id,"amount":300,"reason":"Guest refund"}));
    assert_eq!(get(&db,"stockItems","beer-stock").unwrap().1["currentStock"]["main"],4.0);
    assert_eq!(list(&db,"refunds").unwrap().len(),1);
    assert!(list(&db,"journalEntries").unwrap().iter().any(|r|r["data"]["sourceType"]=="REFUND"));
}

#[test]
fn close_day_refuses_open_tabs_then_persists_report() {
    let (_, mut db, s)=setup();
    run(&mut db,&s,"till.open",json!({"floatAmount":500}));
    let id=order(&mut db,&s);
    let till_id=list(&db,"tillSessions").unwrap()[0]["id"].as_str().unwrap().to_string();
    assert!(execute(&mut db,&s.token,cmd("till.close",json!({"tillId":till_id,"countedCash":500,"reason":""}))).is_err());
    run(&mut db,&s,"payment.record",json!({"orderId":id,"method":"CASH","amount":100,"cashTendered":100}));
    run(&mut db,&s,"till.close",json!({"tillId":till_id,"countedCash":600,"reason":""}));
    run(&mut db,&s,"closeDay.generate",json!({"tillId":till_id}));
    let reports=list(&db,"closeDayReports").unwrap();
    assert_eq!(reports.len(),1);
    assert_eq!(reports[0]["data"]["sales"]["gross"],100.0);
    assert_eq!(reports[0]["data"]["tenders"]["cash"],100.0);
}


#[test]
fn repeat_round_rebuilds_the_last_fired_round() {
    let (_, mut db, s) = setup();
    run(&mut db, &s, "till.open", json!({"floatAmount":0}));
    let order_id = run(
        &mut db,
        &s,
        "order.create",
        json!({"outletId":"main","name":"Round test"}),
    )["recordIds"][0].as_str().unwrap().to_string();

    run(
        &mut db,
        &s,
        "order.addItem",
        json!({"orderId":order_id,"productId":"setup-product"}),
    );
    run(&mut db, &s, "order.fire", json!({"orderId":order_id}));

    let first = get(&db, "orders", &order_id).unwrap().1;
    let first_id = first["items"][0]["id"].as_str().unwrap().to_string();
    assert_eq!(first["items"][0]["roundNo"], 1);
    assert_eq!(first["currentRoundNo"], 2);

    run(&mut db, &s, "order.repeatRound", json!({"orderId":order_id}));
    let repeated = get(&db, "orders", &order_id).unwrap().1;
    assert_eq!(repeated["items"].as_array().unwrap().len(), 2);
    assert_ne!(repeated["items"][1]["id"].as_str().unwrap(), first_id);
    assert_eq!(repeated["items"][1]["roundNo"], 2);
    assert_eq!(repeated["items"][1]["stockFired"], false);
}

#[test]
fn named_customer_tab_persists_customer_identity() {
    let (_, mut db, s) = setup();
    run(
        &mut db,
        &s,
        "record.save",
        json!({"collection":"customers","id":"customer-1","data":{"name":"Kamau","phone":"0712345678","email":"","notes":""}}),
    );
    let result = run(
        &mut db,
        &s,
        "order.create",
        json!({"outletId":"main","customerId":"customer-1","name":"Kamau tab"}),
    );
    let order_id = result["recordIds"][0].as_str().unwrap();
    let order = get(&db, "orders", order_id).unwrap().1;
    assert_eq!(order["customerId"], "customer-1");
    assert_eq!(order["customerName"], "Kamau");
    assert_eq!(order["tabName"], "Kamau tab");
}

#[test]
fn backup_sync_step_requires_backup_evidence() {
    let dir = tempfile::tempdir().unwrap();
    let mut db = open(&dir.path().join("backup-gate.sqlite")).unwrap();
    initialize(&mut db, "terminal-backup-gate", "Owner", "827193", "Backup gate").unwrap();
    let user: String = db.query_row("SELECT id FROM staff", [], |r| r.get(0)).unwrap();
    let session = login(&db, &user, "827193").unwrap();

    let err = execute(
        &mut db,
        &session.token,
        cmd("setup.completeStep", json!({"step":"BACKUP_SYNC"})),
    ).unwrap_err();
    assert!(err.contains("Create a successful local backup"));

    set_meta(&db, "last_backup", "2026-09-26T00:00:00Z").unwrap();
    execute(
        &mut db,
        &session.token,
        cmd("setup.completeStep", json!({"step":"BACKUP_SYNC"})),
    ).unwrap();
}
