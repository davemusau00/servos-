import React,{useEffect,useMemo,useState} from 'react';
import {FileDown,FileSpreadsheet,ShieldCheck,Upload} from 'lucide-react';
import {useRuntime} from '../runtime/RuntimeProvider';
import type {ImportBatchDetail,ImportBatchSummary,ImportTemplateKey} from '../types/imports';
import {IMPORT_TEMPLATES,IMPORT_TEMPLATE_GROUPS} from './importTemplates';
import {ActionDialog} from './ActionDialog';
import {buttonClass,primaryButtonClass} from './records';

const statusClass=(status:string)=>status==='READY'?'text-emerald-300':status==='NEEDS_REVIEW'?'text-amber-300':status==='CANCELLED'?'text-slate-500':'text-sky-300';
const when=(value:string)=>new Date(value).toLocaleString();

function downloadTemplate(name:string,csv:string){
  const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;a.download=name;a.style.display='none';
  document.body.appendChild(a);a.click();a.remove();
  window.setTimeout(()=>URL.revokeObjectURL(url),1000);
}

export function NativeImportCenterView(){
  const runtime=useRuntime();
  const canStage=runtime.snapshot!.actor.permissions.includes('data.import.stage');
  const [templateKey,setTemplateKey]=useState<ImportTemplateKey>('products');
  const [batches,setBatches]=useState<ImportBatchSummary[]>([]);
  const [detail,setDetail]=useState<ImportBatchDetail|null>(null);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  const selected=useMemo(()=>IMPORT_TEMPLATES.find(t=>t.key===templateKey)!,[templateKey]);
  const load=async()=>setBatches(await runtime.importBatches());
  useEffect(()=>{void load().catch(e=>setMessage(String(e)))},[]);
  const stage=async(file:File)=>{
    if(file.size>5*1024*1024){setMessage('CSV exceeds the 5 MB staging limit.');return}
    setBusy(true);setMessage('');
    try{
      const result=await runtime.stageImport({templateKey,fileName:file.name,csvText:await file.text()});
      setDetail(result);await load();
      setMessage(result.invalidCount===0?`Staged ${result.rowCount} row(s). Ready for Patch 04 review/apply.`:`Staged with ${result.invalidCount} invalid row(s). Fix the CSV and stage a new batch.`);
    }catch(e){setMessage(String(e))}finally{setBusy(false)}
  };
  const openBatch=async(id:string)=>{setBusy(true);setMessage('');try{setDetail(await runtime.importBatch(id))}catch(e){setMessage(String(e))}finally{setBusy(false)}};
  const cancel=async(id:string)=>{setBusy(true);try{await runtime.cancelImport(id);setDetail(null);await load()}catch(e){setMessage(String(e))}finally{setBusy(false)}};

  return <div className="h-full overflow-auto bg-slate-950 p-5 text-white">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-2xl font-bold">Import Center</h1><p className="mt-1 max-w-3xl text-sm text-slate-400">Stage, validate and review structured business data before it is allowed anywhere near live records. Patch 03 does not apply imports to operations.</p></div><div className="flex items-center gap-2 rounded-xl border border-emerald-700/40 bg-emerald-950/20 px-3 py-2 text-xs text-emerald-200"><ShieldCheck className="h-4 w-4"/>Staging workspace isolated from business records</div></div>

    <section className="mt-5 rounded-2xl border border-slate-800 bg-slate-900 p-4"><div className="flex flex-wrap items-end gap-3"><label className="min-w-64 flex-1"><span className="mb-1 block text-xs font-bold text-slate-400">Template</span><select className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2" value={templateKey} onChange={e=>setTemplateKey(e.target.value as ImportTemplateKey)}>{IMPORT_TEMPLATES.map(t=><option key={t.key} value={t.key}>{t.group} · {t.label}</option>)}</select></label><button className={buttonClass} onClick={()=>downloadTemplate(selected.fileName,selected.csv)}><FileDown className="mr-2 inline h-4 w-4"/>Download {selected.fileName}</button>{canStage&&<label className={primaryButtonClass+' cursor-pointer'}><Upload className="mr-2 inline h-4 w-4"/>{busy?'Working…':'Stage CSV'}<input className="hidden" type="file" accept=".csv,text/csv" disabled={busy} onChange={e=>{const file=e.target.files?.[0];if(file)void stage(file);e.currentTarget.value=''}}/></label>}</div><p className="mt-3 text-xs text-slate-500">Canonical headers: {selected.headers.join(', ')}</p>{message&&<p role="status" className="mt-3 rounded-xl bg-slate-950 p-3 text-xs text-slate-300">{message}</p>}</section>

    <section className="mt-5"><div className="mb-3"><h2 className="font-bold">Template library</h2><p className="text-xs text-slate-500">External IDs are migration keys, not ServOS internal UUIDs. Keep them stable across related CSV files.</p></div>{IMPORT_TEMPLATE_GROUPS.map(group=><div key={group} className="mb-4"><div className="mb-2 text-xs font-black uppercase tracking-wider text-slate-500">{group}</div><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{IMPORT_TEMPLATES.filter(t=>t.group===group).map(t=><button key={t.key} onClick={()=>downloadTemplate(t.fileName,t.csv)} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 p-3 text-left hover:border-slate-600"><span><b className="text-sm">{t.label}</b><span className="mt-1 block font-mono text-[11px] text-slate-500">{t.fileName}</span></span><FileSpreadsheet className="h-4 w-4 text-slate-500"/></button>)}</div></div>)}</section>

    <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-4"><div className="flex items-center justify-between gap-3"><div><h2 className="font-bold">Staged batches</h2><p className="text-xs text-slate-500">Last 100 batches. Cancelling preserves the immutable import event trail.</p></div><button className={buttonClass} onClick={()=>void load()}>Refresh</button></div><div className="mt-3 overflow-auto"><table className="w-full min-w-[760px] text-left text-xs"><thead className="text-slate-500"><tr><th className="p-2">File</th><th className="p-2">Template</th><th className="p-2">Status</th><th className="p-2 text-right">Rows</th><th className="p-2 text-right">Invalid</th><th className="p-2">Created</th><th className="p-2"></th></tr></thead><tbody>{batches.map(b=><tr key={b.id} className="border-t border-slate-800"><td className="p-2 font-medium">{b.fileName}</td><td className="p-2 font-mono">{b.templateKey}</td><td className={'p-2 font-bold '+statusClass(b.status)}>{b.status}</td><td className="p-2 text-right">{b.rowCount}</td><td className="p-2 text-right">{b.invalidCount}</td><td className="p-2 text-slate-400">{when(b.createdAt)}</td><td className="p-2 text-right"><button className={buttonClass} onClick={()=>void openBatch(b.id)}>Review</button></td></tr>)}</tbody></table>{batches.length===0&&<div className="p-8 text-center text-sm text-slate-500">No CSV batches staged yet.</div>}</div></section>

    <section className="mt-5 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4"><h2 className="font-bold text-amber-200">Execution gate</h2><p className="mt-1 text-xs text-slate-400">Patch 03 intentionally has no Apply button and no backend apply command. Patch 04 will map reviewed rows into versioned ServOS commands, enforce LIVE-safe restrictions, resolve cross-file external IDs and produce business audit/outbox evidence.</p></section>

    {detail&&<ActionDialog title={`Import batch · ${detail.fileName}`} onClose={()=>setDetail(null)}><div className="space-y-4 text-sm"><div className="grid gap-2 sm:grid-cols-4"><Metric label="Status" value={detail.status}/><Metric label="Rows" value={String(detail.rowCount)}/><Metric label="Valid" value={String(detail.validCount)}/><Metric label="Invalid" value={String(detail.invalidCount)}/></div><div className="max-h-80 overflow-auto rounded-xl border border-slate-800"><table className="w-full text-left text-xs"><thead className="sticky top-0 bg-slate-950 text-slate-500"><tr><th className="p-2">Row</th><th className="p-2">External ID</th><th className="p-2">State</th><th className="p-2">Validation</th></tr></thead><tbody>{detail.rows.map(r=><tr key={r.rowNumber} className="border-t border-slate-800 align-top"><td className="p-2">{r.rowNumber}</td><td className="p-2 font-mono">{r.externalId||'—'}</td><td className={'p-2 font-bold '+(r.status==='VALID'?'text-emerald-300':'text-rose-300')}>{r.status}</td><td className="p-2"><div className="space-y-1 text-rose-300">{r.errors.map(x=><div key={x}>• {x}</div>)}</div><div className="space-y-1 text-amber-300">{r.warnings.map(x=><div key={x}>• {x}</div>)}</div>{r.errors.length===0&&r.warnings.length===0&&<span className="text-slate-500">No issues</span>}</td></tr>)}</tbody></table></div>{detail.rowsTruncated&&<p className="text-xs text-amber-300">Preview limited to the first 500 rows. Validation totals cover the complete batch.</p>}<div className="flex flex-wrap justify-between gap-2"><div className="text-xs text-slate-500">SHA-256 {detail.sourceHash.slice(0,16)}…</div>{canStage&&!['CANCELLED','APPLIED'].includes(detail.status)&&<button className={buttonClass} onClick={()=>void cancel(detail.id)}>Cancel staged batch</button>}</div></div></ActionDialog>}
  </div>;
}
const Metric=({label,value}:{label:string;value:string})=><div className="rounded-xl bg-slate-950 p-3"><div className="text-[11px] text-slate-500">{label}</div><div className="mt-1 break-all font-semibold">{value}</div></div>;
