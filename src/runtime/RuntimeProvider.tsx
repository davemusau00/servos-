import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { BusinessCommand, CommandResult, RuntimeSession, RuntimeSnapshot } from '../types/runtime';

export const isNative = '__TAURI_INTERNALS__' in window;
interface RuntimeContextValue {
  session: RuntimeSession | null;
  snapshot: RuntimeSnapshot | null;
  command: (operation: string, payload: Record<string, unknown>, targetVersion?: number) => Promise<CommandResult>;
  refresh: () => Promise<void>;
  sync: () => Promise<void>;
  lock: () => Promise<void>;
  error: string;
  syncing: boolean;
}
const RuntimeContext = createContext<RuntimeContextValue | null>(null);
export const useRuntime = () => useContext(RuntimeContext);
export const RuntimeProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<RuntimeSession | null>(null);
  const [snapshot, setSnapshot] = useState<RuntimeSnapshot | null>(null);
  const [status, setStatus] = useState<{ enrolled: boolean; staff: { id: string; name: string }[] } | null>(null);
  const [error, setError] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(false);
  const [staffId, setStaffId] = useState('');
  const [pin, setPin] = useState('');
  const [business, setBusiness] = useState('');
  const [owner, setOwner] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const lastActivity = useRef(Date.now());
  const inFlight = useRef(false);
  const nextSync = useRef(0);
  const failures = useRef(0);
  const report = useCallback((e: unknown) => {
    const message = String(e);
    setError(message);
    if (message.includes('SESSION_EXPIRED')) { setSession(null); setSnapshot(null); }
  }, []);
  const loadStatus = useCallback(async () => {
    const next = await invoke<NonNullable<typeof status>>('runtime_status');
    setStatus(next); setStaffId(current => current || next.staff[0]?.id || '');
  }, []);
  useEffect(() => { if (isNative) void loadStatus().catch(report); }, [loadStatus, report]);
  const refresh = useCallback(async () => {
    if (session) setSnapshot(await invoke<RuntimeSnapshot>('runtime_snapshot', { token: session.token }));
  }, [session]);
  const command = useCallback(async (operation: string, payload: Record<string, unknown>, targetVersion?: number) => {
    if (!session) throw new Error('Unlock the terminal first');
    const command: BusinessCommand = { id: crypto.randomUUID(), schemaVersion: 1, operation, payload, targetVersion };
    try {
      const result = await invoke<CommandResult>('runtime_command', { token: session.token, command });
      await refresh(); setError(''); return result;
    } catch (e) { report(e); throw e; }
  }, [session, refresh, report]);
  const sync = useCallback(async () => {
    if (!session || inFlight.current) return;
    inFlight.current = true; setSyncing(true);
    try {
      await invoke('runtime_sync', { token: session.token });
      failures.current = 0; nextSync.current = Date.now() + 60_000;
      await refresh(); setError('');
    } catch (e) {
      failures.current++; nextSync.current = Date.now() + Math.min(900_000, 30_000 * 2 ** Math.min(failures.current, 5)); report(e);
    } finally { inFlight.current = false; setSyncing(false); }
  }, [session, refresh, report]);
  const lock = useCallback(async () => {
    if (session) await invoke('runtime_lock', { token: session.token });
    setSession(null); setSnapshot(null); setPin(''); await loadStatus();
  }, [session, loadStatus]);
  useEffect(() => {
    if (!session) return;
    void refresh().catch(report); void sync(); lastActivity.current = Date.now();
    const active = () => { lastActivity.current = Date.now(); };
    const resume = () => { if (document.visibilityState === 'visible') void sync(); };
    const timer = window.setInterval(() => {
      if (Date.now() - lastActivity.current >= 900_000) { void lock().catch(report); return; }
      if (Date.now() >= nextSync.current && navigator.onLine) void sync();
    }, 15_000);
    window.addEventListener('pointerdown', active); window.addEventListener('keydown', active);
    window.addEventListener('online', sync); document.addEventListener('visibilitychange', resume);
    return () => { clearInterval(timer); window.removeEventListener('pointerdown', active); window.removeEventListener('keydown', active); window.removeEventListener('online', sync); document.removeEventListener('visibilitychange', resume); };
  }, [session, refresh, sync, lock, report]);
  const login = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setError('');
    try { setSession(await invoke<RuntimeSession>('runtime_login', { staffId, pin })); setPin(''); }
    catch (e) { report(e); } finally { setBusy(false); }
  };
  const enroll = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setError('');
    try {
      const url = import.meta.env.VITE_SUPABASE_URL;
      const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      if (!url || !publishableKey) throw new Error('This installation has no business server configured. Configure the deployment before enrollment.');
      const response = await fetch(`${url}/auth/v1/token?grant_type=password`, { method: 'POST', headers: { apikey: publishableKey, 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      const auth = await response.json();
      if (!response.ok || !auth.access_token) throw new Error('Owner sign-in failed');
      await invoke('runtime_enroll', { url, publishableKey, accessToken: auth.access_token, ownerName: owner, pin, businessName: business });
      setPassword(''); setPin(''); await loadStatus();
    } catch (e) { report(e); } finally { setBusy(false); }
  };
  const inputClass = 'w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white';
  if (!isNative) {
    if (preview) return <><div className="fixed top-0 left-0 right-0 z-[100] bg-amber-300 text-slate-950 text-xs text-center p-1">UI preview — sample data; no durable business operations or provider integrations</div><div className="pt-6">{children}</div></>;
    return <div className="min-h-screen bg-slate-950 text-white grid place-items-center p-6"><div className="max-w-md space-y-5"><h1 className="text-3xl font-bold">ServOS</h1><p>Business operations run in the installed POS application. This browser build can display the existing UI with sample data for review.</p><button className="bg-amber-400 text-slate-950 p-3 rounded-lg" onClick={() => setPreview(true)}>Open UI preview</button></div></div>;
  }
  if (!session) return <div className="min-h-screen bg-slate-950 text-white grid place-items-center p-6"><form onSubmit={status?.enrolled ? login : enroll} className="w-full max-w-md space-y-4"><h1 className="text-2xl font-bold">{status?.enrolled ? 'Unlock ServOS' : 'Set up your business terminal'}</h1>{!status ? <p>Opening local database…</p> : status.enrolled ? <label className="block">Staff<select className={inputClass} value={staffId} onChange={e => setStaffId(e.target.value)}>{status.staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label> : <><label className="block">Business name<input required className={inputClass} value={business} onChange={e => setBusiness(e.target.value)} /></label><label className="block">Owner name<input required className={inputClass} value={owner} onChange={e => setOwner(e.target.value)} /></label><label className="block">Owner email<input required type="email" autoComplete="username" className={inputClass} value={email} onChange={e => setEmail(e.target.value)} /></label><label className="block">Online password<input required type="password" autoComplete="current-password" className={inputClass} value={password} onChange={e => setPassword(e.target.value)} /></label><p className="text-sm text-slate-400">Initial setup requires the business owner’s online account. Your local staff PIN works offline afterward.</p></> }<label className="block">Staff PIN<input required type="password" inputMode="numeric" minLength={6} maxLength={12} autoComplete="off" className={inputClass} value={pin} onChange={e => setPin(e.target.value)} /></label>{error && <p role="alert" className="text-rose-300">{error}</p>}<button disabled={busy || !status} className="w-full p-3 rounded-lg bg-amber-400 text-slate-950 disabled:opacity-50">{busy ? 'Please wait…' : status?.enrolled ? 'Unlock' : 'Enroll terminal'}</button></form></div>;
  if (!snapshot) return <div className="p-8 bg-slate-950 text-white">Loading local records…{error && <p role="alert">{error}</p>}<button onClick={() => void refresh().catch(report)}>Retry</button></div>;
  return <RuntimeContext.Provider value={{ session, snapshot, command, refresh, sync, lock, error, syncing }}>{error && <div role="alert" className="fixed bottom-0 left-0 right-0 z-[100] bg-rose-950 text-rose-100 p-3 text-sm">{error}<button className="float-right underline" onClick={() => setError('')}>Dismiss</button></div>}{children}</RuntimeContext.Provider>;
};
