import React, { useMemo, useState } from 'react';
import { ArrowRight, BookOpen, Boxes, BedDouble, CircleHelp, ClipboardCheck, PackagePlus, Play, Search, Truck, X } from 'lucide-react';
import help from '../../generated/help-index.json';

type Article = { id: string; title: string; section: string; roles: string[]; permissions: string[]; screen: string; summary: string; body: string; keywords: string[] };
type OpenEditor = (editor: { title: string; operation: string; collection: string; id: string; fields: Array<{ key: string; label: string; type?: 'text' | 'number' | 'money' | 'datetime-local' | 'select'; options?: Array<{ value: string; label: string }>; value?: string; optional?: boolean }>; payload: (values: Record<string, string>) => Record<string, unknown> }) => void;

const articles = help.articles as Article[];
const button = 'inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-600 hover:bg-slate-800';
const primary = 'inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-amber-300';
const field = 'w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-400';

const quickActions = [
  { id: 'product', label: 'Item or menu product', description: 'Add something to sell or track.', permission: 'catalog.manage', icon: PackagePlus },
  { id: 'room', label: 'Room', description: 'Add a room to your property.', permission: 'rooms.manage', icon: BedDouble },
  { id: 'asset', label: 'Property item', description: 'Add equipment or another property item.', permission: 'assets.manage', icon: Boxes },
  { id: 'guest', label: 'Guest', description: 'Save a guest profile for bookings and folios.', permission: 'customers.manage', icon: ClipboardCheck },
  { id: 'supplier', label: 'Supplier', description: 'Save a supplier for purchasing.', permission: 'suppliers.manage', icon: Truck },
] as const;

const taskCards = [
  { id: 'POS', title: 'Make a sale', description: 'Open a tab, add items, and take payment.', permission: 'pos.sell', icon: ClipboardCheck },
  { id: 'Inventory', title: 'Count or move stock', description: 'Record a count, transfer, or waste movement.', permission: 'inventory.view', icon: Boxes },
  { id: 'Procurement', title: 'Receive a delivery', description: 'Check what arrived and save the delivery.', permission: 'procurement.receive', icon: Truck },
  { id: 'Rooms', title: 'Work with rooms', description: 'Open rooms and manage today’s guest work.', permission: 'rooms.view', icon: BedDouble },
] as const;

const guideCards = [
  { id: 'servos.core', title: 'Getting around ServOS', description: 'A short tour of work areas, status, help, and staff access.', permissions: ['help.view'] },
  { id: 'pos.first-sale', title: 'Make your first sale', description: 'Open a tab, add items, and record a real payment.', permissions: ['pos.sell', 'payment.record'] },
  { id: 'stock.count', title: 'Count stock', description: 'Choose a storage place, review the difference, and confirm.', permissions: ['inventory.view', 'inventory.count'] },
  { id: 'stock.receive', title: 'Receive a delivery', description: 'Check delivered and rejected quantities before saving.', permissions: ['procurement.view', 'procurement.receive'] },
] as const;

const canUse = (permissions: string[], required: readonly string[]) => required.every(permission => permissions.includes('*') || permissions.includes(permission));

export function WebStartHere({ permissions, onNavigate, onQuickAdd, onOpenHelp, onStartTour }: { permissions: string[]; onNavigate: (tab: string, action?: string) => void; onQuickAdd: (id: typeof quickActions[number]['id']) => void; onOpenHelp: (query?: string) => void; onStartTour: () => void }) {
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const visibleTasks = taskCards.filter(card => permissions.includes('*') || permissions.includes(card.permission));
  const visibleAdds = quickActions.filter(action => canUse(permissions, [action.permission]));
  const visibleGuides = guideCards.filter(guide => canUse(permissions, guide.permissions));
  return <div className="space-y-6" data-guide-anchor="web.start">
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-7">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-amber-300">START HERE</p><h2 className="mt-1 text-3xl font-bold">What are you working on?</h2><p className="mt-2 text-slate-400">Choose a task and ServOS will take you to the right place.</p></div><button className={primary} data-guide-anchor="web.quick-add" onClick={() => setQuickAddOpen(true)}><PackagePlus className="h-5 w-5"/>Quick Add</button></div>
      <div className="mt-7 grid gap-3 sm:grid-cols-2">{visibleTasks.map(card => { const Icon = card.icon; return <button key={card.id} className="group flex min-h-28 items-center gap-4 rounded-2xl border border-slate-800 bg-slate-950 p-5 text-left transition hover:border-amber-500/60" onClick={() => onNavigate(card.id)}><span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-slate-900 text-amber-300"><Icon className="h-6 w-6"/></span><span className="min-w-0 flex-1"><b className="text-lg">{card.title}</b><span className="mt-1 block text-sm text-slate-400">{card.description}</span></span><ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-amber-300"/></button>; })}{visibleTasks.length===0&&<p className="rounded-xl border border-slate-800 p-5 text-slate-300">Ask a manager to assign your work.</p>}</div>
    </section>
    <section className="grid gap-4 lg:grid-cols-[1.3fr_.7fr]">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-bold">Before you start</h3><p className="mt-1 text-sm text-slate-400">Use these checks when setting up a new business or workstation.</p></div><button className={button} onClick={() => onOpenHelp('Intake Wizard')}>Read setup guide</button></div><ol className="mt-4 grid gap-2 text-sm text-slate-300 sm:grid-cols-3"><li className="rounded-xl bg-slate-950 p-3"><b className="text-amber-300">1.</b> Confirm the business name, service areas, and storage places.</li><li className="rounded-xl bg-slate-950 p-3"><b className="text-amber-300">2.</b> Add items, rooms, guests, and suppliers you use every day.</li><li className="rounded-xl bg-slate-950 p-3"><b className="text-amber-300">3.</b> Try one sale, one stock count, and one delivery before go-live.</li></ol></div>
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5"><div className="flex items-start gap-3"><CircleHelp className="mt-1 h-5 w-5 text-amber-300"/><div><h3 className="font-bold">Need a hand?</h3><p className="mt-1 text-sm text-slate-400">Search the same step-by-step guides used on the terminal.</p><div className="mt-4 flex flex-wrap gap-2"><button className={button} onClick={() => onOpenHelp()}><Search className="h-4 w-4"/>Search Help</button><button className={button} onClick={onStartTour}><Play className="h-4 w-4"/>Take a quick tour</button></div></div></div></div>
    </section>
    {visibleGuides.length>0&&<section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5"><h3 className="font-bold">Short guides</h3><div className="mt-3 grid gap-3 md:grid-cols-2">{visibleGuides.map(guide=><button key={guide.id} className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-left hover:border-amber-500/50" onClick={() => onOpenHelp(guide.title)}><b>{guide.title}</b><span className="mt-1 block text-sm text-slate-400">{guide.description}</span></button>)}</div></section>}
    {quickAddOpen&&<div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" role="presentation" onMouseDown={event=>{if(event.target===event.currentTarget)setQuickAddOpen(false)}}><section role="dialog" aria-modal="true" aria-labelledby="web-quick-add-heading" className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl"><div className="flex items-center justify-between"><div><p className="text-xs font-semibold text-amber-300">QUICK ADD</p><h2 id="web-quick-add-heading" className="mt-1 text-xl font-bold">What do you need to add?</h2></div><button aria-label="Close Quick Add" className={button} onClick={()=>setQuickAddOpen(false)}><X className="h-4 w-4"/></button></div><div className="mt-4 space-y-2">{visibleAdds.map(action=>{const Icon=action.icon;return <button key={action.id} className="flex w-full items-center justify-between rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-left hover:border-amber-500/60" onClick={()=>{setQuickAddOpen(false);onQuickAdd(action.id)}}><span className="flex items-center gap-3"><Icon className="h-5 w-5 text-amber-300"/><span><b>{action.label}</b><span className="block text-xs text-slate-500">{action.description}</span></span></span><ArrowRight className="h-4 w-4 text-slate-500"/></button>})}{visibleAdds.length===0&&<p className="p-3 text-sm text-slate-400">Ask a manager for permission to add records.</p>}</div></section></div>}
  </div>;
}

export function WebHelpView({ initialQuery='', onStartTour }: { initialQuery?: string; onStartTour: () => void }) {
  const [query, setQuery] = useState(initialQuery);
  const [selected, setSelected] = useState<Article|undefined>(() => articles.find(article => article.title.toLowerCase().includes(initialQuery.toLowerCase())) || articles[0]);
  const results = useMemo(() => { const value=query.trim().toLowerCase(); return value ? articles.filter(article => [article.title,article.section,article.summary,article.body,...article.keywords].join(' ').toLowerCase().includes(value)) : articles; }, [query]);
  return <div className="grid min-h-[600px] grid-cols-1 bg-slate-950 text-white lg:grid-cols-[340px_1fr]" data-guide-anchor="web.help"><aside className="min-h-0 overflow-auto border-r border-slate-800 p-4"><div className="flex items-start justify-between gap-3"><div><h2 className="text-xl font-bold">Help</h2><p className="text-xs text-slate-400">Simple guides for everyday work.</p></div><button className={button} onClick={onStartTour}><Play className="h-4 w-4"/>Tour</button></div><label className="relative mt-4 block"><span className="sr-only">Search help articles</span><Search className="absolute left-3 top-3 h-4 w-4 text-slate-500"/><input className={`${field} pl-9`} value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search refunds, M-Pesa, stock…"/></label><div className="mt-4 space-y-2">{results.map(article=><button key={article.id} onClick={()=>setSelected(article)} className={`w-full rounded-xl border p-3 text-left ${selected?.id===article.id?'border-amber-500 bg-amber-500/10':'border-slate-800 bg-slate-900'}`}><div className="text-xs text-slate-500">{article.section}</div><b>{article.title}</b></button>)}{results.length===0&&<p className="rounded-lg p-3 text-sm text-slate-400">No matching guide. Try a shorter search.</p>}</div></aside><main className="min-h-0 overflow-auto p-6">{selected?<><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-300"><BookOpen className="h-4 w-4"/>{selected.section}</div><h2 className="mt-2 text-3xl font-bold">{selected.title}</h2><p className="mt-3 max-w-3xl text-slate-400">{selected.summary}</p><article className="mt-7 max-w-4xl whitespace-pre-wrap text-sm leading-7 text-slate-200">{selected.body}</article></>:<p className="text-slate-400">Choose a guide or search for a task.</p>}</main></div>;
}

export function WebGuidedTour({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const steps = [
    ['Start with a task', 'Home shows the work you can do. Choose a task card or use Quick Add when you need to create something.'],
    ['Check your status', 'The top bar shows whether this browser is online and whether a change is waiting to sync.'],
    ['Use Help any time', 'Help contains the same simple operating guides as the terminal. Search by the task you need to finish.'],
  ];
  const complete = step === steps.length;
  return <div className="fixed inset-0 z-[60] bg-black/60"><section role="dialog" aria-modal="true" aria-label={complete?'Tour complete':`Quick tour: ${steps[step][0]}`} className="fixed bottom-5 right-5 w-[min(26rem,calc(100vw-2rem))] rounded-2xl border border-amber-500/50 bg-slate-900 p-5 text-white shadow-2xl"><div className="flex items-center justify-between gap-3"><p className="text-xs font-bold uppercase tracking-wider text-amber-300">Quick tour</p><button className={button} onClick={onClose}>Close</button></div>{complete?<><h2 className="mt-4 text-lg font-bold">You’re ready to go</h2><p className="mt-2 text-sm text-slate-300">You can take this tour again from Help.</p><button className={`${primary} mt-5`} onClick={onClose}>Done</button></>:<><p className="mt-3 text-xs text-slate-500">{step+1} of {steps.length}</p><h2 className="mt-2 text-lg font-bold">{steps[step][0]}</h2><p className="mt-2 text-sm leading-6 text-slate-300">{steps[step][1]}</p><div className="mt-5 flex justify-between"><button className={button} disabled={step===0} onClick={()=>setStep(value=>value-1)}>Back</button><button className={primary} onClick={()=>setStep(value=>value+1)}>{step===steps.length-1?'Finish':'Next'}</button></div></>}</section></div>;
}

export type { OpenEditor };