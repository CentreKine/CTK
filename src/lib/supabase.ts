// Shim to adapt frontend Supabase calls to the local/production API

const API_BASE = (import.meta.env.VITE_API_BASE || '/api').replace(/\/$/, '');

export const supabaseUrl = API_BASE;
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'local-api-key';

// Minimal wrapper to emulate the subset of Supabase API used in the code
function makeResponse(data, error = null) {
  return { data, error };
}

async function apiGet(table, params = {}) {
  const url = new URL(`${API_BASE}/${table}`, window.location.origin);
  Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, String(v)));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('api_error');
  return await res.json();
}

async function apiPost(table, payload) {
  const res = await fetch(`${API_BASE}/${table}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return makeResponse(null, err);
  }
  return makeResponse(await res.json(), null);
}

async function apiPut(table, id, payload) {
  const res = await fetch(`${API_BASE}/${table}/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  if (!res.ok) return makeResponse(null, await res.json().catch(() => ({})));
  return makeResponse(await res.json(), null);
}

async function apiDelete(table, id) {
  const res = await fetch(`${API_BASE}/${table}/${id}`, { method: 'DELETE' });
  if (!res.ok) return makeResponse(null, await res.json().catch(() => ({})));
  return makeResponse(await res.json(), null);
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

export interface DbSoin {
  id: string;
  client_id: string;
  acte_code: string;
  acte_name: string;
  tarif: number;
  personnel_id: string;
  date: string;
  heure: string;
  notes: string | null;
  statut: 'en_attente' | 'en_cours' | 'termine' | 'annule';
  paye: boolean;
  created_by: string | null;
  assigned_to: string | null;
  updated_by: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbAbonnement {
  id: string;
  client_id: string;
  type: string;
  date_debut: string;
  date_fin: string;
  montant: number;
  paye: boolean;
  statut: 'actif' | 'expire' | 'suspendu';
  created_by: string | null;
  updated_by: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbPaiement {
  id: string;
  reference: string;
  type: 'soin' | 'abonnement' | 'autre';
  client_id: string | null;
  description: string;
  montant: number;
  date: string;
  mode_paiement: 'especes' | 'mobile_money' | 'carte' | 'virement';
  recu: boolean;
  created_by: string | null;
  deleted_at: string | null;
  created_at: string;
}

export interface DbTransaction {
  id: string;
  type: 'entree' | 'sortie';
  categorie: string;
  description: string;
  montant: number;
  date: string;
  reference: string;
  created_by: string | null;
  deleted_at: string | null;
  created_at: string;
}

export interface DbStock {
  id: string;
  nom: string;
  categorie: string;
  quantite: number;
  unite: string;
  prix_unitaire: number;
  seuil_alerte: number;
  fournisseur: string | null;
  date_ajout: string;
  created_by: string | null;
  updated_by: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbMouvementStock {
  id: string;
  stock_id: string;
  type: 'entree' | 'sortie';
  quantite: number;
  motif: string;
  date: string;
  utilisateur: string;
  created_by: string | null;
  deleted_at: string | null;
  created_at: string;
}

export interface DbRendezVous {
  id: string;
  client_id: string;
  personnel_id: string;
  date: string;
  heure: string;
  duree: number;
  motif: string;
  statut: 'planifie' | 'confirme' | 'en_cours' | 'termine' | 'annule';
  notes: string | null;
  created_by: string | null;
  assigned_to: string | null;
  updated_by: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbFicheSuivi {
  id: string;
  client_id: string;
  date_creation: string;
  motif: string | null;
  sexe: string | null;
  age: number | null;
  temperature: number | null;
  tension: string | null;
  poids: number | null;
  douleur: string | null;
  type_douleur: string | null;
  siege_douleur: string | null;
  diagnostic: string | null;
  examen_physique: string | null;
  bilan_vasculaire: string | null;
  bilan_neurologique: string | null;
  bilan_articulaire: string | null;
  bilan_musculaire: string | null;
  evaluation_fonctionnelle: string | null;
  facteurs_psychologiques: string | null;
  objectifs: string | null;
  plan_soins: string | null;
  note_complementaire: string | null;
  created_by: string | null;
  updated_by: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbFicheSeance {
  id: string;
  fiche_id: string;
  date: string;
  traitement: string | null;
  observation: string | null;
  visa_kine: string | null;
  visa_patient: string | null;
  created_by: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbUtilisateur {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role: 'admin' | 'agent';
  telephone: string;
  date_creation: string;
  actif: boolean;
  created_at: string;
  updated_at: string;
}
