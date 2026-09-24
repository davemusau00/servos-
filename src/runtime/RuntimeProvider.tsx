import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { BusinessCommand, CommandResult, IntakeProfile, ManagerApproval, Permission, RuntimeSession, RuntimeSnapshot, RuntimeStatus } from '../types/runtime';

export const isNative = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

interface RuntimeContextValue {
  status: RuntimeStatus | null;
  session: RuntimeSession | null;
  snapshot: RuntimeSnapshot | null;
  error: string;
  syncing: boolean;
  busy: boolean;
  reloadStatus: () => Promise<void>;
  saveIntake: (profile: IntakeProfile) => Promise<void>;
  completeIntake: (profile: IntakeProfile) => Promise<void>;
  enroll: (input: { businessName: string; ownerName: string; email: string; password: string; pin: string }) => Promise<void>;
  login: (staffId: string, pin: string) => Promise<void>;
  lock: () => Promise<void>;
  refresh: () => Promise<void>;
  command: (operation: string, payload?: Record<string, unknown>, targetVersion?: number) => Promise<CommandResult>;
  approve: (approverId: string, pin: string, permission: Permission, target?: string) => Promise<ManagerApproval>;
  sync: () => Promise<void>;
  backup: () => Promise<string>;
  clearError: () => void;
}

const RuntimeContext = createContext<RuntimeContextValue | null>(null);
export const useRuntime = () => {
  const value = useContext(RuntimeContext);
  if (!value) throw new Error('RuntimeProvider is required');
  return value;
};

export const RuntimeProvider = ({ children }: { children: React.ReactNode }) => {
  const [status, setStatus] = useState<RuntimeStatus | null>(null);
  const [session, setSession] = useState<RuntimeSession | null>(null);
  const [snapshot, setSnapshot] = useState<RuntimeSnapshot | null>(null);
  const [error, setError] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [busy, setBusy] = useState(false);
  const lastActivity = useRef(Date.now());
  const inFlight = useRef(false);
  const nextSync = useRef(0);
  const failures = useRef(0);

  const report = useCallback((e: unknown) => {
    const message = e instanceof Error ? e.message : String(e);
    setError(message);
    if (message.includes('SESSION_EXPIRED')) { setSession(null); setSnapshot(null); }
  }, []);

  const reloadStatus = useCallback(async () => {
    if (!isNative) return;
    const next = await invoke<RuntimeStatus>('runtime_status');
    setStatus(next);
  }, []);

  const refresh = useCallback(async () => {
    if (!session || !isNative) return;
    const next = await invoke<RuntimeSnapshot>('runtime_snapshot', { token: session.token });
    setSnapshot(next);
    setStatus(current => current ? { ...current, installationStage: next.installationStage } : current);
  }, [session]);

  useEffect(() => { if (isNative) void reloadStatus().catch(report); }, [reloadStatus, report]);

  const saveIntake = async (profile: IntakeProfile) => {
    setBusy(true); setError('');
    try { await invoke('runtime_intake_save', { profile }); await reloadStatus(); }
    catch (e) { report(e); throw e; } finally { setBusy(false); }
  };
  const completeIntake = async (profile: IntakeProfile) => {
    setBusy(true); setError('');
    try { await invoke('runtime_intake_complete', { profile }); await reloadStatus(); }
    catch (e) { report(e); throw e; } finally { setBusy(false); }
  };
  const enroll = async ({ businessName, ownerName, email, password, pin }: { businessName: string; ownerName: string; email: string; password: string; pin: string }) => {
    setBusy(true); setError('');
    try {
      const url = import.meta.env.VITE_SUPABASE_URL;
      const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      if (!url || !publishableKey) throw new Error('This installation has no business server configured. Configure .env.local before enrollment.');
      const response = await fetch(`${url}/auth/v1/token?grant_type=password`, { method: 'POST', headers: { apikey: publishableKey, 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      const auth = await response.json();
      if (!response.ok || !auth.access_token) throw new Error(auth?.msg || auth?.error_description || 'Owner sign-in failed');
      await invoke('runtime_enroll', { url, publishableKey, accessToken: auth.access_token, ownerName, pin, businessName });
      await reloadStatus();
    } catch (e) { report(e); throw e; } finally { setBusy(false); }
  };
  const login = async (staffId: string, pin: string) => {
    setBusy(true); setError('');
    try { const next = await invoke<RuntimeSession>('runtime_login', { staffId, pin }); setSession(next); setSnapshot(await invoke<RuntimeSnapshot>('runtime_snapshot', { token: next.token })); }
    catch (e) { report(e); throw e; } finally { setBusy(false); }
  };
  const lock = useCallback(async () => {
    try { if (session) await invoke('runtime_lock', { token: session.token }); }
    finally { setSession(null); setSnapshot(null); await reloadStatus(); }
  }, [session, reloadStatus]);
  const command = useCallback(async (operation: string, payload: Record<string, unknown> = {}, targetVersion?: number) => {
    if (!session) throw new Error('Unlock the terminal first');
    const request: BusinessCommand = { id: crypto.randomUUID(), schemaVersion: 1, operation, payload, targetVersion };
    try { const result = await invoke<CommandResult>('runtime_command', { token: session.token, command: request }); await refresh(); setError(''); return result; }
    catch (e) { report(e); throw e; }
  }, [session, refresh, report]);
  const approve = async (approverId: string, pin: string, permission: Permission, target?: string) => {
    if (!session) throw new Error('Unlock the terminal first');
    try { return await invoke<ManagerApproval>('runtime_manager_approve', { token: session.token, approverId, pin, permission, target: target || null }); }
    catch (e) { report(e); throw e; }
  };
  const sync = useCallback(async () => {
    if (!session || inFlight.current) return;
    inFlight.current = true; setSyncing(true);
    try { await invoke('runtime_sync', { token: session.token }); failures.current = 0; nextSync.current = Date.now() + 60_000; await refresh(); setError(''); }
    catch (e) { failures.current += 1; nextSync.current = Date.now() + Math.min(900_000, 30_000 * 2 ** Math.min(failures.current, 5)); report(e); throw e; }
    finally { inFlight.current = false; setSyncing(false); }
  }, [session, refresh, report]);
  const backup = async () => {
    if (!session) throw new Error('Unlock the terminal first');
    try { const path = await invoke<string>('runtime_backup', { token: session.token }); await refresh(); return path; }
    catch (e) { report(e); throw e; }
  };

  useEffect(() => {
    if (!session) return;
    lastActivity.current = Date.now();
    const active = () => { lastActivity.current = Date.now(); };
    const resume = () => { if (document.visibilityState === 'visible' && navigator.onLine) void sync().catch(() => undefined); };
    const timer = window.setInterval(() => {
      if (Date.now() - lastActivity.current >= 900_000) { void lock(); return; }
      if (Date.now() >= nextSync.current && navigator.onLine) void sync().catch(() => undefined);
    }, 15_000);
    window.addEventListener('pointerdown', active); window.addEventListener('keydown', active); window.addEventListener('online', resume); document.addEventListener('visibilitychange', resume);
    return () => { clearInterval(timer); window.removeEventListener('pointerdown', active); window.removeEventListener('keydown', active); window.removeEventListener('online', resume); document.removeEventListener('visibilitychange', resume); };
  }, [session, sync, lock]);

  return <RuntimeContext.Provider value={{ status, session, snapshot, error, syncing, busy, reloadStatus, saveIntake, completeIntake, enroll, login, lock, refresh, command, approve, sync, backup, clearError: () => setError('') }}>{children}</RuntimeContext.Provider>;
};
