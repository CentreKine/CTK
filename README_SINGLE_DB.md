Single-file DB server

Run the single-file API (file-based JSON storage):

1) Install dependencies in your Python venv:

```powershell
python -m pip install fastapi uvicorn
```

2) Start the server:

```powershell
python single_db_api.py
```

3) The server listens on `http://127.0.0.1:8000/` and exposes endpoints compatible with the frontend shim at `src/lib/supabase.ts`:
- `GET /api/<table>/` – list
- `POST /api/<table>/` – create
- `PUT /api/<table>/<id>/` – update
- `DELETE /api/<table>/<id>/` – soft delete (adds `deleted_at`)
- `GET /api/<table>/count` – count

Storage file: `data.json` created next to the script.

Note: This is intentionally minimal and designed for local development or demos. For production, use a proper DB (Postgres) and a hardened API server.
