import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('11D staged POS domain never self-activates v2 and owns the expected order commands',()=>{
  const sql=readFileSync('supabase/expansion/013_pos.sql','utf8');
  assert.match(sql,/STAGED V2 ONLY/);
  assert.doesNotMatch(sql,/update\s+servos_v2\.control\s+set\s+enabled\s*=\s*true/i);
  for(const op of [
    'posPolicy.save','outlet.save','table.save','table.ready','product.salesConfig',
    'order.create','order.addItem','order.updateItem','order.removeItem','order.fire',
    'order.kds','order.repeatRound','order.void'
  ]) assert.match(sql,new RegExp(op.replace('.','\\.')));
  assert.match(sql,/SALE_CONSUMPTION/);
  assert.match(sql,/VOID_RETURN/);
  assert.match(sql,/taxPolicySnapshot/);
  assert.match(sql,/productVersion/);
  assert.doesNotMatch(sql,/\|\|\s*[A-Za-z_]+\s*->>/,'JSON extraction concatenation must be parenthesized');
});

test('web POS uses queued BusinessCommandV2 actions and keeps payments deferred to 11E',()=>{
  const ui=readFileSync('src/runtime/web/WebPosView.tsx','utf8');
  assert.match(ui,/order\.create/);
  assert.match(ui,/order\.addItem/);
  assert.match(ui,/order\.fire/);
  assert.match(ui,/order\.repeatRound/);
  assert.match(ui,/order\.void/);
  assert.match(ui,/useBarcodeScanner/);
  assert.match(ui,/Payments · 11E/);
  assert.doesNotMatch(ui,/payment\.record/);
  assert.doesNotMatch(ui,/business_records/);
  assert.doesNotMatch(ui,/supabase\.from/);
});

test('web business workspace exposes the staged POS tab',()=>{
  const app=readFileSync('src/runtime/web/WebBusinessApp.tsx','utf8');
  assert.match(app,/WebPosView/);
  assert.match(app,/'POS'/);
});

test('disposable PostgreSQL harness runs POS acceptance after procurement acceptance',()=>{
  const harness=readFileSync('scripts/test-supabase.mjs','utf8');
  assert.match(harness,/tests\/supabase\/pos\.sql/);
  const acceptance=readFileSync('tests/supabase/pos.sql','utf8');
  assert.match(acceptance,/Second device table race did not conflict/);
  assert.match(acceptance,/POS response-loss replay changed result/);
  assert.match(acceptance,/Void return did not restore stock/);
  assert.match(acceptance,/Sale stock movement missing/);
  assert.match(acceptance,/Open-order price snapshot was rewritten/);
});


test('11D POS stock aggregation explicitly aliases jsonb_each_text key/value columns',()=>{
  const sql=readFileSync('supabase/expansion/013_pos.sql','utf8');
  assert.doesNotMatch(
    sql,
    /select\s+key\s*,\s*value::numeric\s+from\s+jsonb_each_text\(needs\)/i,
    'ambiguous jsonb_each_text key must be explicitly aliased'
  );
  assert.match(sql,/jsonb_each_text\(needs\)\s+as\s+e\(key,value\)/i);
});
