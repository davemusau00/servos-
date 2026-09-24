import React, { useEffect, useRef, useState } from 'react';

interface Auth { access_token: string; refresh_token: string; expires_in: number }
interface RecordRow { collection: string; id: string; version: number; data: Record<string, any>; archived: boolean }
export const RemoteManagerApp = ({ onBack }: { onBack: () => void }) => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const [auth, setAuth] = useState<Auth | null>(null); const authRef = useRef<Auth | null>(null); const expires = useRef(0);
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const [collection, setCollection] = useState('orders'); const [offset, setOffset] = useState(0); const [rows, setRows] = useState<RecordRow[]>([]);
  const [requests, setRequests] = useState<any[]>([]); const [lastSeen, setLastSeen] = useState<string | null>(null);
  const [selected, setSelected] = useState<RecordRow | null>(null); const [name, setName] = useState(''); const [price, setPrice] = useState('');
  const saveAuth = (next: Auth) => { authRef.current = next; expires.current = Date.now() + next.expires_in * 1000; setAuth(next); };
  const request = async (path: string, body?: unknown) => {
    if (!authRef.current) throw new Error('Sign in first');
    if (Date.now() >= expires.current - 60_000) {
      const res = await fetch(`${url}/auth/v1/token?grant_type=refresh_token`, { method: 'POST', headers: { apikey: key, 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh_token: authRef.current.refresh_token }) });
      if (!res.ok) { authRef.current = null; setAuth(null); throw new Error('Session expired. Sign in again.'); }
      saveAuth(await res.json());
    }
    const res = await fetch(`${url}/rest/v1/${path}`, { method: body === undefined ? 'GET' : 'POST', headers: { apikey: key, Authorization: `Bearer ${authRef.current!.access_token}`, 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
    if (!res.ok) throw new Error(`Server rejected the request (${res.status}). No change was confirmed.`);
    const text = await res.text(); return text ? JSON.parse(text) : null;
  };
  const refresh = async () => {
    try {
      const [records, changes, health] = await Promise.all([request(`business_records?select=*&archived=eq.false&collection=eq.${encodeURIComponent(collection)}&order=id&limit=100&offset=${offset}`), request('remote_change_requests?select=*&order=created_at.desc&limit=100'), request('rpc/servos_health', {})]);
      setRows(records); setRequests(changes); setLastSeen(health?.lastSeen || null); setError('');
    } catch (e) { setError(String(e)); }
  };
  useEffect(() => { if (!auth) return; void refresh(); const timer = setInterval(() => void refresh(), 60_000); return () => clearInterval(timer); }, [auth?.access_token, collection, offset]);
  const field = 'bg-slate-950 text-white border border-slate-600 rounded p-2';
  if (!auth) return <div className="min-h-screen bg-slate-950 text-white grid place-items-center p-5"><form className="space-y-4 max-w-md w-full" onSubmit={async e => {
    e.preventDefault(); setBusy(true); setError('');
    try {
      if (!url || !key) throw new Error('The business server is not configured for this build.');
      const res = await fetch(`${url}/auth/v1/token?grant_type=password`, { method: 'POST', headers: { apikey: key, 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      if (!res.ok) throw new Error('Sign-in failed');
      const next: Auth = await res.json();
      const check = await fetch(`${url}/rest/v1/rpc/servos_is_manager`, { method: 'POST', headers: { apikey: key, Authorization: `Bearer ${next.access_token}`, 'Content-Type': 'application/json' }, body: '{}' });
      if (!check.ok || await check.json() !== true) throw new Error('Manager access has not been assigned to this account.');
      setPassword(''); saveAuth(next);
    } catch(e) {setError(String(e));} finally {setBusy(false);}
  }}><h1 className="text-2xl font-bold">Remote business management</h1><label className="block">Email<input required type="email" autoComplete="username" className={`${field} w-full`} value={email} onChange={e => setEmail(e.target.value)} /></label><label className="block">Password<input required type="password" autoComplete="current-password" className={`${field} w-full`} value={password} onChange={e => setPassword(e.target.value)} /></label>{error && <p role="alert" className="text-rose-300">{error}</p>}<button disabled={busy} className="bg-amber-400 text-black rounded p-3">Sign in</button><button type="button" className="p-3" onClick={onBack}>Back</button></form></div>;
  return <div className="min-h-screen bg-slate-950 text-white p-5 space-y-5"><header className="flex flex-wrap justify-between gap-3"><h1 className="text-2xl font-bold">Business records</h1><button className={field} onClick={() => { authRef.current = null; setAuth(null); setRows([]); setRequests([]); }}>Sign out</button></header><p>Terminal last synchronized: {lastSeen ? new Date(lastSeen).toLocaleString('en-KE') : 'No terminal data received'}</p><p className="text-sm text-slate-400">These are replicated records. Requested edits remain pending until the terminal applies and uploads them.</p><div className="flex gap-3 flex-wrap"><select aria-label="Record type" className={field} value={collection} onChange={e => { setCollection(e.target.value); setOffset(0); }}>{['orders', 'payments', 'products', 'stockItems', 'stockMovements', 'customers', 'suppliers', 'tables', 'journalEntries', 'mpesaReceipts', 'tillSessions'].map(c => <option key={c}>{c}</option>)}</select><button className={field} onClick={() => void refresh()}>Refresh</button></div>{error && <p role="alert" className="text-rose-300">{error}</p>}<div className="overflow-auto"><table className="w-full text-left text-sm"><thead><tr><th className="p-2">Record</th><th>State</th><th>Amount / price</th><th>Actions</th></tr></thead><tbody>{rows.map(r => <tr key={r.id} className="border-t border-slate-800"><td className="p-2">{r.data.name || r.data.label || r.data.orderNumber || r.data.referenceNumber || r.id}</td><td>{r.data.state || r.data.status || '—'}</td><td>{r.data.grandTotal ?? r.data.amount ?? r.data.price ?? '—'}</td><td><button className={field} onClick={() => { setSelected(r); setName(r.data.name || r.data.label || ''); setPrice(String(r.data.price ?? '')); }}>Details</button></td></tr>)}</tbody></table></div>{rows.length === 0 && <p>No records in this category.</p>}<div className="flex gap-3"><button disabled={offset === 0} className={field} onClick={() => setOffset(Math.max(0, offset - 100))}>Previous</button><span>Records {offset + 1}–{offset + rows.length}</span><button disabled={rows.length < 100} className={field} onClick={() => setOffset(offset + 100)}>Next</button></div>
  {selected && <section className="border border-slate-700 rounded p-4 space-y-3"><h2 className="font-bold">Record details</h2><pre className="overflow-auto text-xs max-h-64">{JSON.stringify(selected.data, null, 2)}</pre>{['products', 'tables', 'customers', 'suppliers'].includes(selected.collection) && <form className="space-y-3" onSubmit={async e => {e.preventDefault();setBusy(true);try {const data = {...selected.data, [selected.collection === 'tables' ? 'label' : 'name']:name, ...(selected.collection === 'products' ? {price:Number(price)} : {})};await request('rpc/servos_request_change',{operation:'record.save',payload:{collection:selected.collection,id:selected.id,data},expected_version:selected.version});setSelected(null);await refresh();}catch(e){setError(String(e));}finally{setBusy(false);}}}><label className="block">Name / label<input required className={field} value={name} onChange={e => setName(e.target.value)} /></label>{selected.collection === 'products' && <label className="block">Price<input type="number" min="0" step="0.01" required className={field} value={price} onChange={e => setPrice(e.target.value)} /></label>}<button disabled={busy} className={field}>Request change</button></form>}<button className={field} onClick={() => setSelected(null)}>Close details</button></section>}
  <section className="space-y-3"><h2 className="font-bold">Latest change requests</h2>{requests.map(r => <div key={r.id} className="border border-slate-700 rounded p-3 text-sm"><span>{r.operation} · {r.payload.collection} · {r.status}</span>{r.result?.message && <p>{r.result.message}</p>}</div>)}</section></div>;
};
