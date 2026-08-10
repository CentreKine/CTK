#!/usr/bin/env node
// tools/sync_test.js
// Node script to push local data.json entries to the running server API to verify synchronization for all tables.
// Usage: API_BASE=http://localhost:3000 node tools/sync_test.js

import fs from 'fs';
import path from 'path';

const API_BASE = (process.env.API_BASE || process.env.VITE_API_BASE || 'http://localhost:3000').replace(/\/$/, '');
const DATA_PATH = path.join(process.cwd(), 'data.json');

function now() { return new Date().toISOString(); }

async function fetchJson(url, opts) {
  try {
    const res = await fetch(url, opts);
    const text = await res.text();
    try { return { ok: res.ok, status: res.status, json: JSON.parse(text) }; } catch { return { ok: res.ok, status: res.status, json: text }; }
  } catch (e) {
    return { ok: false, status: 0, json: e.message };
  }
}

async function main() {
  if (!fs.existsSync(DATA_PATH)) {
    console.error('data.json not found in repo root');
    process.exit(2);
  }

  const raw = fs.readFileSync(DATA_PATH, 'utf8');
  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    console.error('data.json parse error:', e.message);
    process.exit(2);
  }

  const summary = {};

  for (const table of Object.keys(data)) {
    summary[table] = { pushed: 0, updated: 0, skipped: 0, errors: 0 };
    console.log(`\n== Table: ${table} ==`);
    const serverRes = await fetchJson(`${API_BASE}/api/${table}`);
    const serverArr = serverRes.ok ? (Array.isArray(serverRes.json) ? serverRes.json : []) : [];
    const serverMap = new Map((serverArr || []).map(s => [s.id, s]));

    const localArr = Array.isArray(data[table]) ? data[table] : [];
    for (const rec of localArr) {
      if (!rec || !rec.id) continue;
      try {
        const s = serverMap.get(rec.id);
        if (!s) {
          // create
          const r = await fetchJson(`${API_BASE}/api/${table}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(rec) });
          if (r.ok) { summary[table].pushed++; console.log(`POST ${table} ${rec.id} -> created`); } else { summary[table].errors++; console.log(`POST ${table} ${rec.id} -> error status ${r.status}`, r.json); }
          continue;
        }
        // compare updated_at if present
        const lu = rec.updated_at || rec.updatedAt || '';
        const su = s.updated_at || s.updatedAt || '';
        if (lu && (!su || lu > su)) {
          const r = await fetchJson(`${API_BASE}/api/${table}/${rec.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(rec) });
          if (r.ok) { summary[table].updated++; console.log(`PUT ${table} ${rec.id} -> updated`); } else { summary[table].errors++; console.log(`PUT ${table} ${rec.id} -> error status ${r.status}`, r.json); }
        } else {
          summary[table].skipped++;
        }
      } catch (e) {
        summary[table].errors++;
        console.log('error syncing', table, rec.id, e.message);
      }
    }
  }

  console.log('\nSummary:');
  console.log(JSON.stringify(summary, null, 2));
}

main().catch(e => { console.error(e); process.exit(1); });
