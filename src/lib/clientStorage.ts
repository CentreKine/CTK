// Client-only persistence using IndexedDB (no external libs)
const DB_NAME = 'clinic_finance_client_db';
const DB_VERSION = 1;
const TABLES = [
  'utilisateurs','clients','personnel','soins','fiches_suivi','fiches_seances',
  'rendezvous','abonnements','paiements','transactions','stocks','mouvements_stock'
];

type AnyRecord = { id: string; created_at?: string; updated_at?: string; deleted_at?: string; [k: string]: any };

let _db: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => {
      _db = req.result;
      resolve(_db as IDBDatabase);
    };
    req.onupgradeneeded = (ev) => {
      const db = req.result;
      for (const t of TABLES) {
        if (!db.objectStoreNames.contains(t)) {
          db.createObjectStore(t, { keyPath: 'id' });
        }
      }
    };
  });
}

function txPromise<T>(storeName: string, mode: IDBTransactionMode, op: (store: IDBObjectStore) => IDBRequest): Promise<T> {
  return openDB().then(db => new Promise<T>((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    const req = op(store);
    req.onsuccess = () => resolve(req.result as T);
    req.onerror = () => reject(req.error);
  }));
}

function nowISO() {
  return new Date().toISOString();
}

export const clientStorage = {
  tables: TABLES,
  async getAll(table: string): Promise<AnyRecord[]> {
    if (!TABLES.includes(table)) throw new Error('invalid_table');
    return txPromise<AnyRecord[]>(table, 'readonly', store => store.getAll());
  },
  async get(table: string, id: string): Promise<AnyRecord | null> {
    if (!TABLES.includes(table)) throw new Error('invalid_table');
    return txPromise<AnyRecord | undefined>(table, 'readonly', store => store.get(id)).then(r => r ?? null);
  },
  async add(table: string, payload: Record<string, any>): Promise<AnyRecord> {
    if (!TABLES.includes(table)) throw new Error('invalid_table');
    const rec: AnyRecord = { ...payload } as AnyRecord;
    if (!rec.id) rec.id = crypto.randomUUID();
    const now = nowISO();
    rec.created_at = rec.created_at ?? now;
    rec.updated_at = now;
    await txPromise<IDBValidKey>(table, 'readwrite', store => store.add(rec));
    return rec;
  },
  async put(table: string, id: string, patch: Record<string, any>): Promise<AnyRecord> {
    if (!TABLES.includes(table)) throw new Error('invalid_table');
    const existing = await this.get(table, id);
    if (!existing) throw new Error('not_found');
    const updated = { ...existing, ...patch, updated_at: nowISO() };
    await txPromise<IDBValidKey>(table, 'readwrite', store => store.put(updated));
    return updated;
  },
  async softDelete(table: string, id: string): Promise<AnyRecord> {
    if (!TABLES.includes(table)) throw new Error('invalid_table');
    const existing = await this.get(table, id);
    if (!existing) throw new Error('not_found');
    existing.deleted_at = nowISO();
    existing.updated_at = existing.deleted_at;
    await txPromise<IDBValidKey>(table, 'readwrite', store => store.put(existing));
    return existing;
  },
  async clearTable(table: string) {
    if (!TABLES.includes(table)) throw new Error('invalid_table');
    await txPromise<void>(table, 'readwrite', store => store.clear());
  },
  async exportAll(): Promise<Record<string, AnyRecord[]>> {
    const out: Record<string, AnyRecord[]> = {};
    for (const t of TABLES) {
      out[t] = await this.getAll(t);
    }
    return out;
  },
  async importAll(data: Record<string, AnyRecord[]>, overwrite = false) {
    for (const t of Object.keys(data)) {
      if (!TABLES.includes(t)) continue;
      if (overwrite) await this.clearTable(t);
      const arr = data[t] || [];
      for (const rec of arr) {
        const r = { ...rec } as AnyRecord;
        if (!r.id) r.id = crypto.randomUUID();
        r.created_at = r.created_at ?? nowISO();
        r.updated_at = nowISO();
        try {
          await txPromise<IDBValidKey>(t, 'readwrite', store => store.put(r));
        } catch (e) {
          // ignore individual insert errors
          console.warn('import error', t, e);
        }
      }
    }
  }
};

export default clientStorage;
