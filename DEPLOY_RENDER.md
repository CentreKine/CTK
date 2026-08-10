# Déploiement sur Render

## Étapes

1. Pousser ce dépôt sur GitHub.
2. Se connecter à Render.
3. Cliquer sur New > Web Service.
4. Connecter le dépôt GitHub.
5. Utiliser ces valeurs :
   - Build Command: `npm ci && npm run build`
   - Start Command: `npm start`
6. Ajouter les variables d’environnement :
   - `NODE_ENV=production`
   - `PORT=10000`

## Notes

- Le serveur de production est défini dans `server.js`.
- Le health check est disponible sur `/health`.
- Les données sont stockées localement dans `data.json`.

> Pour une vraie production, il est recommandé de remplacer le stockage local par une base de données externe.
