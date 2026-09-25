import React, { useMemo, useState } from 'react';
import type { IntakeProfile } from '../types/runtime';
import { useRuntime } from '../runtime/RuntimeProvider';
import { buttonClass, fieldClass, primaryButtonClass } from './records';

const defaults: IntakeProfile = {
  venueType: 'BAR', serviceModes: ['COUNTER', 'TABS'], operatingHours: '10:00–02:00', lateNight: true,
  paymentMethods: ['CASH', 'MPESA', 'CARD'], mpesaAccount: '', salesStructure: ['DRINKS', 'COCKTAILS'],
  tracksSpiritsByMl: true, usesCocktailRecipes: true, serviceAreas: ['Main Bar'], stockAreas: ['Main Store', 'Bar Store'],
  hasTables: false, estimatedTables: 0, estimatedManagers: 1, estimatedOperators: 3,
  printerExpected: true, drawerExpected: false, barcodeScannerExpected: true, importMode: 'MANUAL'
};
const split = (value: string) => value.split(',').map(v => v.trim()).filter(Boolean);

export const IntakeWizard = () => {
  const runtime = useRuntime();
  const [profile, setProfile] = useState<IntakeProfile>({ ...defaults, ...(runtime.status?.intakeProfile || {}) });
  const set = <K extends keyof IntakeProfile>(key: K, value: IntakeProfile[K]) => setProfile(p => ({ ...p, [key]: value }));
  const toggle = <T extends string>(key: 'serviceModes' | 'paymentMethods', value: T) => setProfile(p => ({ ...p, [key]: (p[key] as string[]).includes(value) ? (p[key] as string[]).filter(x => x !== value) : [...(p[key] as string[]), value] }));
  const summary = useMemo(() => [
    profile.venueType.replace('_', ' '), `${profile.serviceModes.join(' + ')} service`, profile.paymentMethods.join(' / '),
    profile.tracksSpiritsByMl ? 'ml-based spirit control' : 'unit-based stock', profile.usesCocktailRecipes ? 'cocktail recipes' : 'no recipes',
    `${profile.serviceAreas.length} service area(s)`, `${profile.stockAreas.length} stock area(s)`, profile.hasTables ? `${profile.estimatedTables} tables` : 'counter/tab operation'
  ], [profile]);
  return <div className="min-h-screen bg-slate-950 p-4 text-slate-100 md:p-8">
    <div className="mx-auto max-w-5xl space-y-6">
      <header><div className="text-xs font-bold tracking-[.2em] text-amber-400">SERVOS INTAKE</div><h1 className="mt-2 text-3xl font-black">What kind of business are we configuring?</h1><p className="mt-2 max-w-2xl text-slate-400">This creates configuration intent only. No demo products, transactions or opening balances are created.</p></header>
      <div className="grid gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-5 md:grid-cols-2">
        <label className="space-y-1">Venue profile<select className={fieldClass} value={profile.venueType} onChange={e => set('venueType', e.target.value as IntakeProfile['venueType'])}><option value="BAR">Bar</option><option value="PUB">Pub</option><option value="LOUNGE">Lounge</option><option value="CLUB">Club</option><option value="RESTAURANT_BAR">Restaurant + bar</option><option value="OTHER">Other</option></select></label>
        <label className="space-y-1">Operating hours<input className={fieldClass} value={profile.operatingHours} onChange={e => set('operatingHours', e.target.value)} /></label>
        <div><div className="mb-2 text-sm font-semibold">Service model</div><div className="flex flex-wrap gap-2">{(['COUNTER','TABS','TABLES'] as const).map(x => <button type="button" key={x} onClick={() => toggle('serviceModes', x)} className={profile.serviceModes.includes(x) ? primaryButtonClass : buttonClass}>{x}</button>)}</div></div>
        <div><div className="mb-2 text-sm font-semibold">Payment methods</div><div className="flex flex-wrap gap-2">{(['CASH','MPESA','CARD'] as const).map(x => <button type="button" key={x} onClick={() => toggle('paymentMethods', x)} className={profile.paymentMethods.includes(x) ? primaryButtonClass : buttonClass}>{x}</button>)}</div></div>
        {profile.paymentMethods.includes('MPESA') && <label className="space-y-1">M-Pesa Till / Paybill number<input className={fieldClass} value={profile.mpesaAccount || ''} onChange={e => set('mpesaAccount', e.target.value)} placeholder="e.g. 123456" /></label>}
        <label className="space-y-1">Sales structure<input className={fieldClass} value={profile.salesStructure.join(', ')} onChange={e => set('salesStructure', split(e.target.value))} placeholder="Drinks, cocktails, bottle service" /></label>
        <label className="space-y-1">Service areas<input className={fieldClass} value={profile.serviceAreas.join(', ')} onChange={e => set('serviceAreas', split(e.target.value))} /></label>
        <label className="space-y-1">Stock areas<input className={fieldClass} value={profile.stockAreas.join(', ')} onChange={e => set('stockAreas', split(e.target.value))} /></label>
        <label className="space-y-1">Existing data<select className={fieldClass} value={profile.importMode} onChange={e => set('importMode', e.target.value as IntakeProfile['importMode'])}><option value="MANUAL">Manual entry</option><option value="CSV">CSV import</option><option value="EMPTY">Start empty</option></select></label>
        <label className="space-y-1">Intended go-live date<input type="date" className={fieldClass} value={profile.intendedGoLiveDate || ''} onChange={e => set('intendedGoLiveDate', e.target.value)} /></label>
        <div className="grid grid-cols-2 gap-3"><label>Managers<input type="number" min="1" className={fieldClass} value={profile.estimatedManagers} onChange={e => set('estimatedManagers', Number(e.target.value))} /></label><label>Operators<input type="number" min="1" className={fieldClass} value={profile.estimatedOperators} onChange={e => set('estimatedOperators', Number(e.target.value))} /></label></div>
        <div className="grid grid-cols-2 gap-3"><label className="flex items-center gap-2"><input type="checkbox" checked={profile.tracksSpiritsByMl} onChange={e => set('tracksSpiritsByMl', e.target.checked)} /> Spirit ml control</label><label className="flex items-center gap-2"><input type="checkbox" checked={profile.usesCocktailRecipes} onChange={e => set('usesCocktailRecipes', e.target.checked)} /> Cocktail recipes</label><label className="flex items-center gap-2"><input type="checkbox" checked={profile.hasTables} onChange={e => set('hasTables', e.target.checked)} /> Tables / seating</label><label className="flex items-center gap-2"><input type="checkbox" checked={profile.lateNight} onChange={e => set('lateNight', e.target.checked)} /> Late-night operation</label></div>
        {profile.hasTables && <label className="space-y-1">Estimated tables<input type="number" min="1" className={fieldClass} value={profile.estimatedTables} onChange={e => set('estimatedTables', Number(e.target.value))} /></label>}
        <div className="grid grid-cols-3 gap-2 text-xs"><label className="flex items-center gap-2"><input type="checkbox" checked={profile.printerExpected} onChange={e => set('printerExpected', e.target.checked)} /> Printer</label><label className="flex items-center gap-2"><input type="checkbox" checked={profile.drawerExpected} onChange={e => set('drawerExpected', e.target.checked)} /> Cash drawer</label><label className="flex items-center gap-2"><input type="checkbox" checked={profile.barcodeScannerExpected} onChange={e => set('barcodeScannerExpected', e.target.checked)} /> Scanner</label></div>
      </div>
      <section className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5"><h2 className="font-bold">ServOS will configure</h2><ul className="mt-2 grid gap-1 text-sm text-slate-300 md:grid-cols-2">{summary.map(x => <li key={x}>• {x}</li>)}</ul></section>
      {runtime.error && <p className="rounded-xl bg-rose-950 p-3 text-rose-200">{runtime.error}</p>}
      <div className="flex justify-end gap-3"><button disabled={runtime.busy} className={buttonClass} onClick={() => void runtime.saveIntake(profile)}>Save progress</button><button disabled={runtime.busy || !profile.serviceAreas.length || !profile.stockAreas.length || !profile.paymentMethods.length} className={primaryButtonClass} onClick={() => void runtime.completeIntake(profile)}>Confirm intake & continue</button></div>
    </div>
  </div>;
};
