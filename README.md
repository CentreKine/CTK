# Clinic Finance - Local Install

This project is a React + TypeScript + Vite frontend with a lightweight local JSON API backend.

## Local deployment overview

- Frontend: React app built with Vite
- Local backend: `single_db_api.py` using `data.json` as the storage file
- Environment variables: stored in `.env.local`

## Prerequisites

- Node.js 18+ and npm
- Python 3.11+ (or Python 3 installation with `python` or `py` command)

## Install on a new machine

1. Clone the repository:

```bash
git clone <repo-url>
cd clinic-finance-new
```

2. Install frontend dependencies:

```bash
npm install
```

3. Create or copy environment variables:

```bash
copy .env.example .env.local
```

4. Install Python dependencies:

```bash
python -m pip install -r requirements.txt
```

5. Start the local backend API:

```bash
python single_db_api.py
```

6. Start the frontend app:

```bash
npm run dev
```

7. Open the browser at:

```text
http://localhost:5173
```

## Notes

- The frontend is configured to use the local backend at `http://localhost:8000/api`.
- The backend stores all data in `data.json` and creates backups automatically as `data.json.<timestamp>.bak`.
- If you do not want to use the bundled local backend, you can still use your own API by updating `VITE_API_BASE` in `.env.local`.

## Recommended commands

```bash
npm run api      # start the local JSON API
npm run dev      # start the frontend
npm run build    # build the frontend for production
```

## Automated setup

You can also run the PowerShell helper script from the project root:

```powershell
./setup-local.ps1
```

## Legacy/optional files

- `docker-compose.yml` is a legacy PostgreSQL setup and is not required for the current single-file local deployment.
- `.env.local` is ignored by git, so each developer should create their own local copy.
