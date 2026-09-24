import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, Boxes, ClipboardCheck, CreditCard, HelpCircle, LayoutGrid, Lock, Martini, PackageSearch, RefreshCw, Settings, SlidersHorizontal, WalletCards } from 'lucide-react';
import { useRuntime } from '../runtime/RuntimeProvider';
import type { Permission } from '../types/runtime';
import { NativePOSView } from './NativePOSView';
import { NativeKDSView } from './NativeKDSView';
import { NativeInventoryView } from './NativeInventoryView';
import { NativeCatalogView } from './NativeCatalogView';
import { NativeReconciliationView, NativeCloseDayView, NativeReportsView, NativeAdminView, NativeRefundsView } from './NativeOperationsViews';
import { NativeFloorplanView } from './NativeFloorplanView';
import { HelpCenterView } from './HelpCenterView';

const routes:Array<{id:string;label:string;permission:Permission;icon:any;help:string}>=[
  {id:'pos',label:'Bar POS',permission:'pos.sell',icon:Martini,help:'pos-tabs'},
  {id:'kds',label:'Bar Pass',permission:'kds.view',icon:ClipboardCheck,help:'kds'},
  {id:'inventory',label:'Inventory',permission:'inventory.view',icon:Boxes,help:'inventory'},
  {id:'catalog',label:'Catalog',permission:'catalog.view',icon:PackageSearch,help:'portions'},
  {id:'tender',label:'M-Pesa',permission:'mpesa.reconcile',icon:WalletCards,help:'mpesa'},
  {id:'refunds',label:'Refunds',permission:'payment.record',icon:CreditCard,help:'refunds'},
  {id:'floorplan',label:'Floorplan',permission:'floorplan.view',icon:LayoutGrid,help:'floorplan'},
  {id:'close',label:'Close Day',permission:'till.close',icon:SlidersHorizontal,help:'close-day'},
  {id:'reports',label:'Reports',permission:'reports.view',icon:BookOpen,help:'reports'},
  {id:'admin',label:'Business Admin',permission:'backup.create',icon:Settings,help:'rbac'},
  {id:'help',label:'Help',permission:'help.view',icon:HelpCircle,help:'getting-started'},
];

export function NativeBarShell(){
  const runtime=useRuntime(); const snapshot=runtime.snapshot!; const allowed=useMemo(()=>routes.filter(r=>snapshot.actor.permissions.includes(r.permission)),[snapshot.actor.permissions]);
  const route=()=>window.location.hash.replace(/^#\/?/,'').split('/')[0]||allowed[0]?.id||'help';
  const [tab,setTab]=useState(route); const [helpQuery,setHelpQuery]=useState('');
  useEffect(()=>{if(!allowed.some(x=>x.id===tab))setTab(allowed[0]?.id||'help')},[allowed,tab]);
  const go=(id:string)=>{window.location.hash=`/${id}`;setTab(id)};
  const current=allowed.find(r=>r.id===tab);
  const content=tab==='pos'?<NativePOSView/>:tab==='kds'?<NativeKDSView/>:tab==='inventory'?<NativeInventoryView/>:tab==='catalog'?<NativeCatalogView/>:tab==='tender'?<NativeReconciliationView/>:tab==='refunds'?<NativeRefundsView/>:tab==='floorplan'?<NativeFloorplanView/>:tab==='close'?<NativeCloseDayView/>:tab==='reports'?<NativeReportsView/>:tab==='admin'?<NativeAdminView/>:<HelpCenterView key={helpQuery} initialQuery={helpQuery}/>;
  return <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-100">
    <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-900 md:flex"><div className="border-b border-slate-800 p-4"><div className="text-xs font-black tracking-[.25em] text-amber-400">SERVOS</div><div className="mt-1 font-bold">Bar Operations</div></div><nav className="flex-1 space-y-1 overflow-auto p-2">{allowed.map(r=>{const I=r.icon;return <button key={r.id} onClick={()=>go(r.id)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm ${tab===r.id?'bg-amber-400 font-bold text-slate-950':'text-slate-300 hover:bg-slate-800'}`}><I className="h-4 w-4"/>{r.label}</button>})}</nav><div className="border-t border-slate-800 p-3"><div className="text-sm font-semibold">{snapshot.actor.name}</div><div className="text-xs text-slate-500">{snapshot.actor.role} · authenticated PIN session</div></div></aside>
    <div className="flex min-w-0 flex-1 flex-col"><header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-800 bg-slate-900 px-4 py-3"><div className="min-w-0"><div className="truncate font-bold">{current?.label||'ServOS'}</div><div className="text-xs text-slate-500">{navigator.onLine?'Online':'Offline · local trading active'} · {snapshot.pendingCount} pending sync</div></div><div className="flex items-center gap-2"><button className="rounded-lg border border-slate-700 p-2" title="Context help" onClick={()=>{setHelpQuery(current?.help||'');go('help')}}><HelpCircle className="h-4 w-4"/></button>{snapshot.actor.permissions.includes('sync.manual')&&<button className="rounded-lg border border-slate-700 p-2" title="Sync" disabled={runtime.syncing} onClick={()=>void runtime.sync()}><RefreshCw className={`h-4 w-4 ${runtime.syncing?'animate-spin':''}`}/></button>}<button className="rounded-lg border border-slate-700 p-2" title="Change staff / lock" onClick={()=>void runtime.lock()}><Lock className="h-4 w-4"/></button></div></header>
      {runtime.error&&<div className="shrink-0 bg-rose-950 px-4 py-2 text-sm text-rose-200">{runtime.error}<button className="float-right underline" onClick={runtime.clearError}>Dismiss</button></div>}
      <main className="min-h-0 flex-1 overflow-hidden">{content}</main>
      <nav className="grid shrink-0 grid-cols-5 border-t border-slate-800 bg-slate-900 p-1 md:hidden">{allowed.slice(0,4).map(r=>{const I=r.icon;return <button key={r.id} onClick={()=>go(r.id)} className={`grid place-items-center rounded-lg p-2 text-[10px] ${tab===r.id?'bg-amber-400 text-slate-950':'text-slate-400'}`}><I className="h-4 w-4"/><span>{r.label}</span></button>})}<button onClick={()=>go('help')} className="grid place-items-center p-2 text-[10px] text-slate-400"><HelpCircle className="h-4 w-4"/><span>Help</span></button></nav>
    </div>
  </div>;
}
