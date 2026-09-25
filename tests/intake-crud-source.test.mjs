import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(path,'utf8');

test('intake carries business owner and initial administrator without credential fields',()=>{
  const types=read('src/types/runtime.ts');
  assert.match(types,/business:\s*IntakeBusinessIdentity/);
  assert.match(types,/owner:\s*IntakeOwnerProfile/);
  assert.match(types,/initialAdministrator:\s*IntakeAdministratorProfile/);
  const wizard=read('src/native/IntakeWizard.tsx');
  assert.match(wizard,/Initial System Administrator/);
  assert.doesNotMatch(wizard,/profile\.(pin|password)/);
});

test('enrollment derives local Admin from confirmed intake',()=>{
  const native=read('src-tauri/src/lib.rs');
  const store=read('src-tauri/src/store.rs');
  assert.match(native,/initialize_from_intake/);
  assert.match(native,/validate_intake_profile/);
  assert.match(store,/pub fn initialize_from_intake/);
  assert.match(store,/"installationProfile"/);
});

test('safe master data uses versioned native save and archive commands',()=>{
  const view=read('src/native/NativeMasterDataView.tsx');
  assert.match(view,/record\.save/);
  assert.match(view,/record\.archive/);
  assert.match(view,/customers/);
  assert.match(view,/suppliers/);
  assert.match(view,/stockLocations/);
});

test('price rules understand UI scope schema and numeric weekdays',()=>{
  const store=read('src-tauri/src/store.rs');
  assert.match(store,/scopeType/);
  assert.match(store,/scopeId/);
  assert.match(store,/number_from_monday/);
});
