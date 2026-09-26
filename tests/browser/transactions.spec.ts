import {test,expect,type Page} from '@playwright/test';
import {spawnSync} from 'node:child_process';
import {readFileSync,readdirSync} from 'node:fs';
import {randomUUID} from 'node:crypto';

// Test-only authentication/HTTP bridge; all business RPCs run in real PostgreSQL.
// This does not claim hosted Supabase Auth/PostgREST or production deployment proof.
test.describe('transactional browser with PostgreSQL',()=>{
 test.skip(process.env.RUN_TRANSACTION_BROWSER_TESTS!=='1','Opt in to disposable Docker persistence tests');
 let container='';let running=false;let loseResponse=true;
 const docker=(args:string[],input?:string)=>{const result=spawnSync('docker',args,{input,encoding:'utf8',maxBuffer:8*1024*1024});if(result.status!==0)throw new Error(result.stderr||result.error?.message||'Docker command failed');return result.stdout};
 const sql=(source:string)=>docker(['exec','-i',container,'psql','-U','postgres','-At','-v','ON_ERROR_STOP=1'],source);
 test.beforeAll(async()=>{
  test.setTimeout(120000);container=`servos-browser-${randomUUID()}`;
  docker(['run','--rm','-d','--name',container,'-e','POSTGRES_HOST_AUTH_METHOD=trust','postgres:18.6-bookworm']);running=true;
  for(let i=0;i<30;i++){if(spawnSync('docker',['exec',container,'pg_isready','-U','postgres'],{stdio:'ignore'}).status===0)break;await new Promise(r=>setTimeout(r,1000))}
  const files=['tests/supabase/bootstrap.sql',...['supabase/migrations','supabase/expansion'].flatMap(dir=>readdirSync(dir).filter(f=>f.endsWith('.sql')).sort().map(f=>`${dir}/${f}`))];
  sql(files.map(f=>readFileSync(f,'utf8')).join('\n'));
  sql(`insert into servos_v2.members values('00000000-0000-4000-8000-000000000001',true,array['*']),('00000000-0000-4000-8000-000000000002',true,array['*']) on conflict(user_id) do update set active=true,permissions=array['*']; update servos_v2.control set enabled=true;`);
 });
 test.afterAll(()=>{if(running)docker(['stop',container])});
 const bridge=async(page:Page)=>{
  await page.route('https://servos-cloud.test/**',async route=>{
   const request=route.request();const path=new URL(request.url()).pathname;
   const payload=request.postDataJSON()||{};
   if(path==='/auth/v1/token')return route.fulfill({json:{access_token:payload.email?.startsWith('second')?'second-test-token':'first-test-token',refresh_token:'test-only',expires_in:3600}});
   const actor=request.headers().authorization?.includes('second-test-token')?'00000000-0000-4000-8000-000000000002':'00000000-0000-4000-8000-000000000001';
   const encoded=Buffer.from(JSON.stringify(payload)).toString('hex');const body=`convert_from(decode('${encoded}','hex'),'UTF8')::jsonb`;
   const calls:Record<string,string>={
    servos_v2_session:'public.servos_v2_session()',
    servos_v2_register_device:`public.servos_v2_register_device((p->>'device_id')::uuid,p->>'label',p->>'kind')`,
    servos_v2_snapshot:`public.servos_v2_snapshot(p->>'after_collection',p->>'after_id',(p->>'expected_cursor')::bigint,p->>'expected_policy',(p->>'page_size')::integer)`,
    servos_v2_execute:`public.servos_v2_execute(p->'command')`,
    servos_v2_pull:`public.servos_v2_pull((p->>'after_sequence')::bigint,(p->>'page_size')::integer)`,
   };
   const name=path.split('/').pop()||'';if(!calls[name])return route.fulfill({status:404,json:{message:'Unsupported test route'}});
   try{
    const output=sql(`begin;select set_config('request.jwt.claim.sub','${actor}',true);set local role authenticated;select ${calls[name]} from (select ${body} p) input;commit;`);
    const result=JSON.parse(output.split(/\r?\n/).find(line=>line.startsWith('{'))!);
    if(name==='servos_v2_execute'&&loseResponse){loseResponse=false;return route.abort('connectionreset')}
    return route.fulfill({json:result});
   }catch(error){return route.fulfill({status:String(error).includes('PERMISSION_DENIED')?403:400,json:{message:String(error)}})}
  });
 };
 const signIn=async(page:Page,email:string)=>{
  await bridge(page);await page.goto('/');await page.getByRole('button',{name:'Remote management',exact:true}).click();
  await page.getByLabel('Email',{exact:true}).fill(email);await page.getByLabel('Password',{exact:true}).fill('test-only');await page.getByRole('button',{name:'Sign in',exact:true}).click();
  await expect(page.getByText('Authorized business records',{exact:true})).toBeVisible();
 };
 test('two operators see committed room and asset records; response-loss retry preserves one command',async({page,browser},info)=>{
  test.setTimeout(120000);const context2=await browser.newContext({viewport:info.project.use.viewport});const other=await context2.newPage();
  await signIn(page,'first@example.test');await signIn(other,'second@example.test');
  await page.getByRole('button',{name:'Settings',exact:true}).click();await page.getByRole('button',{name:'Add room type',exact:true}).click();
  let dialog=page.getByRole('dialog');await dialog.getByLabel('Room type',{exact:true}).fill('Double');await dialog.getByLabel('Maximum guests').fill('2');await dialog.getByRole('button',{name:'Confirm',exact:true}).click();
  await expect(page.getByRole('alert')).toContainText('retained for retry');await page.getByRole('button',{name:'Synchronize',exact:true}).click();
  await expect(page.getByText('Double',{exact:true})).toBeVisible();
  expect(sql("select count(*) from servos_v2.commands where request->'payload'->>'collection'='roomTypes';").trim()).toBe('1');
  await page.getByRole('button',{name:'Rooms',exact:true}).click();await page.getByRole('button',{name:'Add room',exact:true}).click();dialog=page.getByRole('dialog');
  await dialog.getByLabel('Room number').fill('101');await dialog.getByLabel('Room type',{exact:true}).selectOption({label:'Double'});await dialog.getByLabel('Guest capacity').fill('2');await dialog.getByLabel('Turnaround minutes').fill('30');await dialog.getByRole('button',{name:'Confirm',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Room 101',exact:true})).toBeVisible();
  await other.getByRole('button',{name:'Synchronize',exact:true}).click();await expect(other.getByRole('heading',{name:'Room 101',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Settings',exact:true}).click();await page.getByRole('button',{name:'Add asset category',exact:true}).click();dialog=page.getByRole('dialog');await dialog.getByLabel('Category name').fill('Equipment');await dialog.getByRole('button',{name:'Confirm',exact:true}).click();await expect(page.getByText('Equipment',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Assets',exact:true}).click();await page.getByRole('button',{name:'Add asset',exact:true}).click();dialog=page.getByRole('dialog');await dialog.getByLabel('Asset name').fill('Guest television');await dialog.getByLabel('Unique asset tag').fill('TV-101');await dialog.getByLabel('Category',{exact:true}).selectOption({label:'Equipment'});await dialog.getByLabel('Room',{exact:true}).selectOption({label:'101'});await dialog.getByLabel('Acquisition cost (KES)').fill('25000');await dialog.getByRole('button',{name:'Confirm',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Guest television · TV-101'})).toBeVisible();await other.getByRole('button',{name:'Synchronize',exact:true}).click();await other.getByRole('button',{name:'Assets',exact:true}).click();await expect(other.getByRole('heading',{name:'Guest television · TV-101'})).toBeVisible();
  expect(sql("select data->>'purchaseCostMinor' from servos_v2.records where collection='assets';").trim()).toBe('2500000');
  await page.screenshot({path:info.outputPath('transactional-assets.png'),fullPage:true});
  await page.reload();await page.getByRole('button',{name:'Remote management',exact:true}).click();await page.getByLabel('Email',{exact:true}).fill('first@example.test');await page.getByLabel('Password',{exact:true}).fill('test-only');await page.getByRole('button',{name:'Sign in',exact:true}).click();await expect(page.getByRole('heading',{name:'Room 101',exact:true})).toBeVisible();
  await context2.close();
 });
});
