#!/usr/bin/env python3
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uuid, json, os, threading, datetime, shutil, tempfile, glob

DATA_FILE = os.path.join(os.path.dirname(__file__), 'data.json')
LOCK = threading.Lock()
ALLOWED_TABLES = {
    'utilisateurs','clients','personnel','soins','fiches_suivi','fiches_seances',
    'rendezvous','abonnements','paiements','transactions','stocks','mouvements_stock'
}

app = FastAPI(title='Single-file DB API', version='1.0')

# Allow requests from localhost and typical dev hosts
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def _now():
    return datetime.datetime.utcnow().isoformat() + 'Z'


def read_data():
    if not os.path.exists(DATA_FILE):
        return {}
    with LOCK:
        try:
            with open(DATA_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            return {}


def _make_backup():
    if not os.path.exists(DATA_FILE):
        return None
    ts = datetime.datetime.utcnow().strftime('%Y%m%dT%H%M%SZ')
    bak = f"{DATA_FILE}.{ts}.bak"
    try:
        shutil.copy2(DATA_FILE, bak)
        return bak
    except Exception:
        return None


def write_data(d):
    # atomic write with backup
    with LOCK:
        # create backup of existing
        try:
            _make_backup()
        except Exception:
            pass
        dirn = os.path.dirname(DATA_FILE)
        fd, tmp = tempfile.mkstemp(dir=dirn, prefix='data.json.tmp')
        try:
            with os.fdopen(fd, 'w', encoding='utf-8') as f:
                json.dump(d, f, ensure_ascii=False, indent=2)
            try:
                os.replace(tmp, DATA_FILE)
            except PermissionError:
                # Fallback for Windows when replace is denied: write directly
                with open(DATA_FILE, 'w', encoding='utf-8') as f2:
                    json.dump(d, f2, ensure_ascii=False, indent=2)
        finally:
            if os.path.exists(tmp):
                try:
                    os.remove(tmp)
                except Exception:
                    pass


def list_backups():
    pattern = DATA_FILE + '.*.bak'
    return sorted(glob.glob(pattern))


@app.get('/health')
async def health():
    return {'ok': True, 'storage': DATA_FILE}


# Root-level admin endpoints to avoid dynamic-route conflicts
@app.get('/_export')
async def export_root_all():
    return read_data()


@app.post('/_import')
async def import_root_all(payload: dict):
    if not isinstance(payload, dict):
        raise HTTPException(400, 'invalid_payload')
    write_data(payload)
    return {'ok': True}


@app.get('/_backups')
async def list_root_backups():
    return {'backups': list_backups()}


# API-prefixed admin endpoints (duplicate to avoid dynamic route capture)
@app.get('/api/_export')
async def api_export_all():
    return read_data()


@app.post('/api/_import')
async def api_import_all(payload: dict):
    if not isinstance(payload, dict):
        raise HTTPException(400, 'invalid_payload')
    write_data(payload)
    return {'ok': True}


@app.get('/api/_backups')
async def api_list_backups():
    return {'backups': list_backups()}


@app.get('/api/{table}/count')
async def count(table: str):
    if table not in ALLOWED_TABLES:
        raise HTTPException(400, 'invalid_table')
    d = read_data()
    items = [r for r in d.get(table, []) if not r.get('deleted_at')]
    return {'count': len(items)}


@app.get('/api/{table}/')
async def list_table(table: str, request: Request, order: str = None, limit: int = 1000):
    if table not in ALLOWED_TABLES:
        raise HTTPException(400, 'invalid_table')
    params = dict(request.query_params)
    d = read_data()
    items = [r for r in d.get(table, []) if not r.get('deleted_at')]
    # filters
    for k, v in params.items():
        if k in ('order','limit'):
            continue
        items = [it for it in items if str(it.get(k)) == v]
    # order
    if order:
        field, _, dir = order.partition(':')
        reverse = (dir.lower() != 'asc')
        items.sort(key=lambda x: x.get(field) or '', reverse=reverse)
    if limit:
        items = items[:limit]
    return items


# also accept paths without trailing slash for compatibility with fetch URLs
@app.get('/api/{table}')
async def list_table_noslash(table: str, request: Request, order: str = None, limit: int = 1000):
    return await list_table(table, request, order=order, limit=limit)


@app.post('/api/{table}/')
async def create(table: str, payload: dict):
    if table not in ALLOWED_TABLES:
        raise HTTPException(400, 'invalid_table')
    d = read_data()
    items = d.setdefault(table, [])
    rec = dict(payload or {})
    if 'id' not in rec:
        rec['id'] = uuid.uuid4().hex
    now = _now()
    rec.setdefault('created_at', now)
    rec['updated_at'] = now
    items.insert(0, rec)
    write_data(d)
    return JSONResponse(status_code=201, content=rec)


@app.post('/api/{table}')
async def create_noslash(table: str, payload: dict):
    return await create(table, payload)


@app.get('/api/{table}/{record_id}/')
async def get_record(table: str, record_id: str):
    if table not in ALLOWED_TABLES:
        raise HTTPException(400, 'invalid_table')
    d = read_data()
    for r in d.get(table, []):
        if r.get('id') == record_id and not r.get('deleted_at'):
            return r
    raise HTTPException(404, 'not_found')


@app.get('/api/{table}/{record_id}')
async def get_record_noslash(table: str, record_id: str):
    return await get_record(table, record_id)


@app.put('/api/{table}/{record_id}/')
async def update_record(table: str, record_id: str, payload: dict):
    if table not in ALLOWED_TABLES:
        raise HTTPException(400, 'invalid_table')
    d = read_data()
    changed = False
    for i, r in enumerate(d.get(table, [])):
        if r.get('id') == record_id and not r.get('deleted_at'):
            new = dict(r)
            new.update(payload or {})
            new['updated_at'] = _now()
            d[table][i] = new
            changed = True
            break
    if not changed:
        raise HTTPException(404, 'not_found')
    write_data(d)
    return new


@app.put('/api/{table}/{record_id}')
async def update_record_noslash(table: str, record_id: str, payload: dict):
    return await update_record(table, record_id, payload)


@app.delete('/api/{table}/{record_id}/')
async def delete_record(table: str, record_id: str):
    if table not in ALLOWED_TABLES:
        raise HTTPException(400, 'invalid_table')
    d = read_data()
    for i, r in enumerate(d.get(table, [])):
        if r.get('id') == record_id and not r.get('deleted_at'):
            r['deleted_at'] = _now()
            r['updated_at'] = _now()
            d[table][i] = r
            write_data(d)
            return r
    raise HTTPException(404, 'not_found')


@app.delete('/api/{table}/{record_id}')
async def delete_record_noslash(table: str, record_id: str):
    return await delete_record(table, record_id)


# export full DB
@app.get('/api/_export')
async def export_all():
    d = read_data()
    return d


# import/replace full DB (creates backup)
@app.post('/api/_import')
async def import_all(payload: dict):
    if not isinstance(payload, dict):
        raise HTTPException(400, 'invalid_payload')
    write_data(payload)
    return {'ok': True}


@app.get('/api/_backups')
async def backups():
    return {'backups': list_backups()}


if __name__ == '__main__':
    import uvicorn
    uvicorn.run('single_db_api:app', host='0.0.0.0', port=8000, reload=True)
