begin;
insert into servos_v2.members values('00000000-0000-4000-8000-000000000001',true,array['*']) on conflict(user_id) do update set active=true,permissions=array['*'];
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',true);
update servos_v2.control set enabled=true;
select servos_v2.put_record('customers','a','{"name":"First"}');
select servos_v2.put_record('customers','b','{"name":"Second"}');
select servos_v2.put_record('employees','private','{"name":"Private employee"}');
do $$declare session jsonb;page jsonb;failed boolean:=false;begin
 session:=public.servos_v2_session();page:=public.servos_v2_snapshot('','',null,session->>'policyVersion',1);
 if page->>'hasMore'<>'true' or page->'records'->0->>'id'<>'a' then raise exception 'Snapshot first page wrong';end if;
 page:=public.servos_v2_snapshot(page->>'afterCollection',page->>'afterId',(page->>'cursor')::bigint,session->>'policyVersion',1);
 if page->'records'->0->>'id'<>'b' then raise exception 'Snapshot keyset skipped record';end if;
 update servos_v2.control set cursor=cursor+1;
 begin perform public.servos_v2_snapshot('customers','b',0,session->>'policyVersion',1);exception when others then failed:=sqlerrm like '%SNAPSHOT_CHANGED%';end;
 if not failed then raise exception 'Snapshot mixed server cursors';end if;
 update servos_v2.members set permissions=array['records.view'] where user_id=auth.uid();failed:=false;
 begin perform public.servos_v2_snapshot('','',null,session->>'policyVersion',1);exception when others then failed:=sqlerrm like '%SNAPSHOT_CHANGED%';end;
 if not failed then raise exception 'Snapshot ignored permission change';end if;
end$$;
set local role authenticated;
do $$declare page jsonb;begin
 page:=public.servos_v2_snapshot();if jsonb_array_length(page->'records')<>2 then raise exception 'Snapshot leaked private employee';end if;
end$$;
reset role;
update servos_v2.members set active=false where user_id=auth.uid();
set local role authenticated;
do $$begin
 begin perform public.servos_v2_session();raise exception 'Revoked session allowed';exception when insufficient_privilege then null;end;
end$$;
reset role;
rollback;
