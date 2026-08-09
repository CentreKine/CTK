import clientStorage from './clientStorage';
import { supabaseUrl } from './supabase';

const TABLES = clientStorage.tables;

async function fetchServerTable(table: string) {
  try {
    const res = await fetch(`${supabaseUrl}/${table}`);
    if (!res.ok) return [];
    return await res.json();
  } catch (e) {
    return [];
  }
}

async function postServer(table: string, rec: any) {
  try {
    const res = await fetch(`${supabaseUrl}/${table}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(rec)
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null;
  }
}

async function putServer(table: string, id: string, rec: any) {
  try {
    const res = await fetch(`${supabaseUrl}/${table}/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(rec)
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null;
  }
}

export async function syncNow(db?: any) {
  // Merge local IndexedDB with server data using updated_at as tiebreaker (last-write-wins)
  const summary: Record<string, { pushed: number; pulled: number }> = {};
  for (const table of TABLES) {
    summary[table] = { pushed: 0, pulled: 0 };
    const [local, server] = await Promise.all([clientStorage.getAll(table), fetchServerTable(table)]);
    const serverMap = new Map((server || []).map((s: any) => [s.id, s]));
    const localMap = new Map((local || []).map((l: any) => [l.id, l]));

    // Push local changes to server
    for (const l of local) {
      const s = serverMap.get(l.id);
      if (!s) {
        const created = await postServer(table, l);
        if (created) summary[table].pushed++;
        continue;
      }
      const lu = l.updated_at || l.updatedAt || '';
      const su = s.updated_at || s.updatedAt || '';
      if (lu && su) {
        if (lu > su) {
          const updated = await putServer(table, l.id, l);
          if (updated) summary[table].pushed++;
        } else if (su > lu) {
          // server newer -> update local
          try {
            await clientStorage.put(table, s.id, s);
            summary[table].pulled++;
          } catch (e) {
            // if put fails because missing, add
            await clientStorage.add(table, s);
            summary[table].pulled++;
          }
        }
      }
    }

    // Pull server-only
    for (const s of (server || [])) {
      if (!localMap.has(s.id)) {
        await clientStorage.add(table, s);
        summary[table].pulled++;
      }
    }
  }

  if (db && typeof db.reloadData === 'function') {
    try { await db.reloadData(); } catch (e) { /* ignore */ }
  }
  return { ok: true, summary, lastSync: new Date().toISOString() };
}

let _intervalId: any = null;
let _focusHandler: any = null;

export function startAutoSync(db: any, intervalMs = 60000) {
  if (_intervalId) clearInterval(_intervalId);
  _intervalId = setInterval(() => { syncNow(db); }, intervalMs);
  _focusHandler = () => { syncNow(db); };
  window.addEventListener('focus', _focusHandler);
}

export function stopAutoSync() {
  if (_intervalId) clearInterval(_intervalId);
  _intervalId = null;
  if (_focusHandler) {
    window.removeEventListener('focus', _focusHandler);
    _focusHandler = null;
  }
}

export default { syncNow, startAutoSync, stopAutoSync };
