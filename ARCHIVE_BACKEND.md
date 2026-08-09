Backend Node archivé

Décision:
- Le backend Node/Express a été archivé et ses scripts désactivés. Le backend principal est désormais `backend-django` (Django + SQLite) qui sert l'API sur `http://127.0.0.1:8000/api/`.

Actions réalisées:
- `docker-compose.yml` supprimé (provision Docker non utilisé localement ici).
- `backend/package.json` scripts remplacés par `archived` pour éviter de démarrer accidentellement le service Node.

Restauration (si vous voulez réactiver le backend Node):
1. Restaurer `docker-compose.yml` depuis le contrôle de version (git) si supprimé.
2. Remettre les scripts originaux dans `backend/package.json` (start/dev/migrate).
3. Démarrer Docker Desktop puis `docker compose up -d` pour lancer Postgres.
4. Dans `backend`: `npm install` puis `npm run migrate` et `npm run dev`.

Notes:
- Le frontend est configuré par défaut pour appeler `http://localhost:8000/api` via `src/lib/supabase.ts`, donc il fonctionne avec `backend-django`.
- Si vous préférez Postgres + Node, je peux automatiser la reconnection et migrer les données SQLite vers Postgres.
