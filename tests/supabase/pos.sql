-- Disposable PostgreSQL acceptance only. Never run against a business project.
begin;
insert into servos_v2.members values('00000000-0000-4000-8000-000000000001',true,array['*'])
on conflict(user_id) do update set active=true,permissions=array['*'];
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',true);
set local role authenticated;
select public.servos_v2_register_device('10000000-0000-4000-8000-000000000051','POS desktop','DESKTOP');
select public.servos_v2_register_device('10000000-0000-4000-8000-000000000052','POS web','WEB');
reset role;
update servos_v2.control set enabled=true;

create function pg_temp.pos_command(
 op text,collection_name text,record_key text,p jsonb,
 expected_status text default 'SYNCHRONIZED',
 expected_code text default null,
 device_key uuid default '10000000-0000-4000-8000-000000000051'
) returns jsonb language plpgsql as $$
declare c jsonb;r jsonb;versions jsonb;
begin
 select coalesce(jsonb_agg(jsonb_build_object('collection',collection,'id',id,'version',version)),'[]')
 into versions from servos_v2.records;
 if not exists(select 1 from servos_v2.records where collection=collection_name and id=record_key) then
  versions:=versions||jsonb_build_array(jsonb_build_object('collection',collection_name,'id',record_key,'version',0));
 end if;
 c:=jsonb_build_object(
  'id',gen_random_uuid(),'schemaVersion',2,'deviceId',device_key,'actorId',auth.uid(),
  'clientSequence',(select last_sequence+1 from servos_v2.devices where id=device_key),
  'operation',op,'payload',p,'expectedVersions',versions
 );
 r:=public.servos_v2_execute(c);
 if r->>'status'<>expected_status or (expected_code is not null and r->'error'->>'code' is distinct from expected_code) then
  raise exception 'Unexpected % result: %',op,r;
 end if;
 if public.servos_v2_execute(c)<>r then raise exception 'POS response-loss replay changed result';end if;
 return r;
end$$;

select pg_temp.pos_command('posPolicy.save','posPolicy','policy','{"id":"policy","data":{"vatBasisPoints":0,"cateringLevyBasisPoints":0}}');
select pg_temp.pos_command('stockLocation.save','stockLocations','bar-stock','{"id":"bar-stock","data":{"name":"Bar Stock","code":"BAR","type":"BAR"}}');
select pg_temp.pos_command('outlet.save','outlets','bar','{"id":"bar","data":{"name":"Main Bar","code":"BAR","defaultStockLocationId":"bar-stock"}}');
select pg_temp.pos_command('table.save','tables','t1','{"id":"t1","data":{"label":"T1","outletId":"bar","capacity":4}}');
select pg_temp.pos_command('stockItem.save','stockItems','gin','{"id":"gin","data":{"name":"Gin 750ml","code":"GIN","baseUnit":"bottle","scanUnitQuantity":1,"reorderLevel":1,"averageUnitCostMinor":60000}}');
select pg_temp.pos_command('inventory.count','stockItems','gin','{"id":"gin","stockItemId":"gin","locationId":"bar-stock","countedQty":10,"reason":"Opening POS test stock"}');
select pg_temp.pos_command('product.save','products','gin-shot','{"id":"gin-shot","data":{"name":"Gin Shot","code":"GINSHOT","priceMinor":30000,"category":"SPIRITS","routeTo":"BAR","barcode":"616000099","stockItemId":"gin","portionVolume":0.05}}');
select pg_temp.pos_command('product.salesConfig','products','gin-shot','{"productId":"gin-shot","portions":[{"id":"single","name":"Single","priceMinor":30000,"volume":0.05},{"id":"double","name":"Double","priceMinor":55000,"volume":0.1}],"modifiers":[],"recipeIngredients":[]}');

-- Two devices race for one table using the same table baseline.
do $$declare versions jsonb;stale jsonb;r jsonb;begin
 select coalesce(jsonb_agg(jsonb_build_object('collection',collection,'id',id,'version',version)),'[]')
 into versions from servos_v2.records;
 versions:=versions||jsonb_build_array(jsonb_build_object('collection','orders','id','order-stale','version',0));
 stale:=jsonb_build_object(
  'id',gen_random_uuid(),'schemaVersion',2,'deviceId','10000000-0000-4000-8000-000000000052',
  'actorId',auth.uid(),'clientSequence',1,'operation','order.create',
  'payload',jsonb_build_object('id','order-stale','outletId','bar','tableId','t1','name','Other waiter'),
  'expectedVersions',versions
 );
 perform pg_temp.pos_command('order.create','orders','order-1','{"id":"order-1","outletId":"bar","tableId":"t1","name":"Table T1"}');
 r:=public.servos_v2_execute(stale);
 if r->>'status'<>'CONFLICT' or r->'error'->>'code'<>'VERSION_CONFLICT' then
  raise exception 'Second device table race did not conflict: %',r;
 end if;
end$$;

select pg_temp.pos_command('order.addItem','orders','order-1','{"orderId":"order-1","productId":"gin-shot","itemId":"line-1","quantity":2,"portionId":"single","modifierIds":[]}');

do $$declare o jsonb;begin
 o:=servos_v2.read_record('orders','order-1');
 if (o->>'grandTotalMinor')::bigint<>60000 then raise exception 'Order total wrong';end if;
 if o->'items'->0->>'productVersion' is null then raise exception 'Product snapshot/version missing';end if;
 if o->'items'->0->'taxPolicySnapshot' is null then raise exception 'Tax snapshot missing';end if;
end$$;

-- Catalog price changes must not rewrite an already-added item's price snapshot when quantity changes.
select servos_v2.put_record('products','gin-shot',servos_v2.read_record('products','gin-shot')||jsonb_build_object('priceMinor',40000));
select pg_temp.pos_command('order.updateItem','orders','order-1','{"orderId":"order-1","itemId":"line-1","quantity":3}');
do $$declare o jsonb;begin
 o:=servos_v2.read_record('orders','order-1');
 if (o->'items'->0->>'unitPriceMinor')::bigint<>30000 or (o->>'grandTotalMinor')::bigint<>90000 then
  raise exception 'Open-order price snapshot was rewritten by catalog change';
 end if;
end$$;

select pg_temp.pos_command('order.fire','orders','order-1','{"orderId":"order-1"}');

do $$declare s jsonb;o jsonb;begin
 s:=servos_v2.read_record('stockItems','gin');o:=servos_v2.read_record('orders','order-1');
 if abs((s->'currentStock'->>'bar-stock')::numeric-9.85)>0.000001 then raise exception 'POS fire consumed wrong stock: %',s->'currentStock'->>'bar-stock';end if;
 if o->'items'->0->>'courseStatus'<>'FIRED' then raise exception 'Fired KDS state missing';end if;
 if (select count(*) from servos_v2.records where collection='stockMovements' and data->>'movementType'='SALE_CONSUMPTION')<>1 then raise exception 'Sale stock movement missing';end if;
end$$;

select pg_temp.pos_command('order.kds','orders','order-1','{"orderId":"order-1","itemId":"line-1","status":"PREPARING"}');
select pg_temp.pos_command('order.kds','orders','order-1','{"orderId":"order-1","itemId":"line-1","status":"READY"}');

-- Fired items cannot be silently edited or removed.
select pg_temp.pos_command('order.updateItem','orders','order-1','{"orderId":"order-1","itemId":"line-1","quantity":3}','REJECTED','INVALID_STATE');
select pg_temp.pos_command('order.removeItem','orders','order-1','{"orderId":"order-1","itemId":"line-1"}','REJECTED','INVALID_STATE');

-- Void with RETURN_SEALED restores exactly the fired ingredient quantity and puts the table into CLEANING.
select pg_temp.pos_command('order.void','orders','order-1','{"orderId":"order-1","reason":"Customer changed mind before service","disposition":"RETURN_SEALED"}');

do $$declare s jsonb;t jsonb;o jsonb;begin
 s:=servos_v2.read_record('stockItems','gin');t:=servos_v2.read_record('tables','t1');o:=servos_v2.read_record('orders','order-1');
 if abs((s->'currentStock'->>'bar-stock')::numeric-10)>0.000001 then raise exception 'Void return did not restore stock';end if;
 if t->>'state'<>'CLEANING' or nullif(t->>'currentOrderId','') is not null then raise exception 'Voided table not released to cleaning';end if;
 if o->>'state'<>'VOIDED' then raise exception 'Order not voided';end if;
end$$;

select pg_temp.pos_command('table.ready','tables','t1','{"tableId":"t1"}');

-- Named tab without a table remains valid and firing is still replay-safe.
select pg_temp.pos_command('order.create','orders','tab-1','{"id":"tab-1","outletId":"bar","name":"Kamau"}');
select pg_temp.pos_command('order.addItem','orders','tab-1','{"orderId":"tab-1","productId":"gin-shot","itemId":"tab-line","quantity":1,"portionId":"double","modifierIds":[]}');
select pg_temp.pos_command('order.fire','orders','tab-1','{"orderId":"tab-1"}');

-- Permission rejection.
update servos_v2.members set permissions=array['records.view','catalog.view'] where user_id=auth.uid();
select pg_temp.pos_command('order.create','orders','blocked','{"id":"blocked","outletId":"bar","name":"Blocked"}','REJECTED','PERMISSION_DENIED');

rollback;
