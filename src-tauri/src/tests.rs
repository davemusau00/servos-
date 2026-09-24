use super::store::*;
use serde_json::{json, Value};
use uuid::Uuid;

fn setup() -> (tempfile::TempDir, rusqlite::Connection, Session) {
    let dir = tempfile::tempdir().unwrap();
    let mut db = open(&dir.path().join("test.sqlite")).unwrap();
    initialize(&mut db, "terminal-test", "Owner", "827193", "Test business").unwrap();
    let user: String = db
        .query_row("SELECT id FROM staff", [], |r| r.get(0))
        .unwrap();
    let session = login(&db, &user, "827193").unwrap();
    let (_, mut property) = get(&db, "property", "property").unwrap();
    property["taxConfigured"] = json!(true);
    property["pricesIncludeTax"] = json!(true);
    property["vatRatePct"] = json!(0);
    property["levyRatePct"] = json!(0);
    let mut configure = cmd(
        "record.save",
        json!({"collection":"property","id":"property","data":property}),
    );
    configure.target_version = Some(1);
    execute(&mut db, &session.token, configure).unwrap();
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
    let result = run(db, s, "order.create", json!({"name":"Walk-in"}));
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
fn version_conflicts_cannot_overwrite_records() {
    let (_, mut db, s) = setup();
    let mut update = cmd(
        "record.save",
        json!({"collection":"property","id":"property","data":{"name":"Changed"}}),
    );
    assert!(execute(&mut db, &s.token, update.clone()).is_err());
    update.target_version = Some(2);
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
    let result = run(&mut db, &s, "order.create", json!({"tableId":key}));
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
        cmd("order.create", json!({"tableId":key}))
    )
    .is_err());
    let mut ready = cmd("table.ready", json!({"tableId":key}));
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
    run(&mut db, &s, "order.create", json!({"tableId":key}));
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
    run(&mut db, &s, "order.create", json!({"tableId":b}));
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
    let order = run(&mut db, &s, "order.create", json!({"tableId":a}))["recordIds"][0].clone();
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
