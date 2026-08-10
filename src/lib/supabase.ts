// Shim to adapt frontend Supabase calls to the local/production API

// Prefer explicit VITE_API_BASE; fall back to same-origin /api to support running the frontend
// on the same host as the API in production.
const API_BASE = (import.meta.env.VITE_API_BASE || `${window.location.origin}/api`).replace(/\/$/, '');

export const supabaseUrl = API_BASE;
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'local-api-key';

// Minimal wrapper to emulate the subset of Supabase API used in the code
function makeResponse(data, error = null) {
  return { data, error };
}

async function apiGet(table, params = {}) {
  const url = new URL(`${API_BASE}/${table}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, String(v)));
  try {
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`api_error:${res.status}`);
    return await res.json();
  } catch (e) {
    console.error('[apiGet] Error fetching', url.toString(), e);
    throw e;
  }
}

async function apiPost(table, payload) {
  try {
    const res = await fetch(`${API_BASE}/${table}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return makeResponse(null, err);
    }
    return makeResponse(await res.json(), null);
  } catch (e) {
    console.error('[apiPost] Error posting to', `${API_BASE}/${table}`, e);
    return makeResponse(null, e);
  }
}

async function apiPut(table, id, payload) {
  try {
    const res = await fetch(`${API_BASE}/${table}/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!res.ok) return makeResponse(null, await res.json().catch(() => ({})));
    return makeResponse(await res.json(), null);
  } catch (e) {
    console.error('[apiPut] Error putting to', `${API_BASE}/${table}/${id}`, e);
    return makeResponse(null, e);
  }
}

async function apiDelete(table, id) {
  try {
    const res = await fetch(`${API_BASE}/${table}/${id}`, { method: 'DELETE' });
    if (!res.ok) return makeResponse(null, await res.json().catch(() => ({})));
    return makeResponse(await res.json(), null);
  } catch (e) {
    console.error('[apiDelete] Error deleting', `${API_BASE}/${table}/${id}`, e);
    return makeResponse(null, e);
  }
}

export const supabase = {
  from: (table) => {
    const state = { filters: {}, order: undefined, limit: undefined, pendingOp: null, payload: null };

    async function executeSelect() {
      const params = { ...state.filters };
      if (state.order) params.order = state.order;
      if (state.limit) params.limit = state.limit;
      try {
        const data = await apiGet(table, params);
        return { data, error: null };
      } catch (e) {
        return { data: null, error: e };
      }
    }

    return {
      select(cols) {
        // cols ignored for now
        return this;
      },
      order(field, opts = { ascending: false }) {
        state.order = `${field}:${opts.ascending ? 'asc' : 'desc'}`;
        return executeSelect();
      },
      limit(n) {
        state.limit = n;
        return executeSelect();
      },
      eq(field, value) {
        // If pending operation is update or delete, execute it
        if (state.pendingOp === 'update') {
          return apiPut(table, value, state.payload).then(r => ({ data: r.data ? [r.data] : null, error: r.error })).catch(e => ({ data: null, error: e }));
        }
        if (state.pendingOp === 'delete') {
          return apiDelete(table, value).then(r => ({ data: r.data, error: r.error })).catch(e => ({ data: null, error: e }));
        }
        // otherwise, add filter for subsequent select
        state.filters[field] = value;
        return this;
      },
      insert(payload) {
        return apiPost(table, payload).then(r => ({ data: r.data ? [r.data] : null, error: r.error })).catch(e => ({ data: null, error: e }));
      },
      update(payload) {
        state.pendingOp = 'update';
        state.payload = payload;
        return this;
      },
      delete() {
        state.pendingOp = 'delete';
        return this;
      }
    };
  },
  // low-level helpers
  post: apiPost,
  get: apiGet,
  put: apiPut,
  delete: apiDelete
};

// Database types
export interface DbClient {
  id: string;
  nom: string;
  prenom: string;
  date_naissance: string | null;
  sexe: 'M' | 'F';
  telephone: string;
  email: string | null;
  adresse: string | null;
  profession: string | null;
  groupe_sanguin: string | null;
  allergies: string | null;
  antecedents: string | null;
  date_inscription: string;
  notes: string | null;
  created_by: string | null;
  updated_by: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbPersonnel {
  id: string;
  nom: string;
  prenom: string;
  poste: string;
  specialite: string | null;
  telephone: string;
  email: string;
  adresse: string | null;
  date_embauche: string;
  salaire: number;
  statut: 'actif' | 'conge' | 'inactif';
  created_by: string | null;
  updated_by: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

// ... rest of types remain unchanged (truncated for brevity)
