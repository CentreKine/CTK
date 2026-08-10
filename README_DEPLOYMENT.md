# Déploiement gratuit sur Render

## 1. Connecter le dépôt GitHub

1. Ouvrez https://render.com
2. Créez un compte gratuitement
3. Cliquez sur New + puis Web Service
4. Choisissez votre dépôt GitHub : CentreKine/CTK

## 2. Configuration du service

- Name: clinic-finance
- Runtime: Node
- Build Command: npm install --include=dev && npm run build
- Start Command: npm start

## 3. Variables d'environnement

Ajoutez :
- NODE_ENV=production
- NPM_CONFIG_PRODUCTION=false
- PORT=10000

## 4. Déployer

Cliquez sur Create Web Service.

## 5. Résultat attendu

Votre application sera disponible à une URL du type :
https://clinic-finance.onrender.com
