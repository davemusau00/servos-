import React, { useState } from 'react';
import { useRuntime } from '../runtime/RuntimeProvider';
import { fieldClass, primaryButtonClass } from './records';

export const EnrollmentView = () => {
  const runtime = useRuntime();
  const [businessName, setBusinessName] = useState(''); const [ownerName, setOwnerName] = useState(''); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [pin, setPin] = useState('');
  return <div className="min-h-screen bg-slate-950 p-6 text-white grid place-items-center"><form className="w-full max-w-lg space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-6" onSubmit={e => { e.preventDefault(); void runtime.enroll({ businessName, ownerName, email, password, pin }); }}>
    <div><div className="text-xs font-bold tracking-[.2em] text-amber-400">OWNER ENROLLMENT</div><h1 className="mt-2 text-2xl font-black">Claim this ServOS terminal</h1><p className="mt-2 text-sm text-slate-400">Owner authentication is online once. Local staff PINs work offline after enrollment.</p></div>
    <label className="block text-sm">Business name<input required className={fieldClass} value={businessName} onChange={e => setBusinessName(e.target.value)} /></label>
    <label className="block text-sm">Owner name<input required className={fieldClass} value={ownerName} onChange={e => setOwnerName(e.target.value)} /></label>
    <label className="block text-sm">Owner email<input required type="email" autoComplete="username" className={fieldClass} value={email} onChange={e => setEmail(e.target.value)} /></label>
    <label className="block text-sm">Online password<input required type="password" autoComplete="current-password" className={fieldClass} value={password} onChange={e => setPassword(e.target.value)} /></label>
    <label className="block text-sm">New local PIN<input required type="password" inputMode="numeric" minLength={6} maxLength={12} className={fieldClass} value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 12))} /><span className="text-xs text-slate-500">6–12 digits. This becomes your offline Admin PIN.</span></label>
    {runtime.error && <p className="rounded-xl bg-rose-950 p-3 text-sm text-rose-200">{runtime.error}</p>}
    <button disabled={runtime.busy} className={`${primaryButtonClass} w-full`}>{runtime.busy ? 'Enrolling…' : 'Enroll terminal'}</button>
  </form></div>;
};
