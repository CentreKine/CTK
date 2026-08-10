# Clinic Finance - Production Ready App

This project is a React + TypeScript + Vite application prepared for deployment with a single production server entry point.

## What is ready for deployment

- Frontend built with Vite and optimized for production
- Backend API served by a Node.js production server via `server.js`
- Data stored in `data.json` with automatic backups
- SPA routing handled correctly for hosting platforms
- Environment variables supported through `.env.local` or the deployment platform

## Prerequisites

- Node.js 18+ and npm

## Local development

1. Install dependencies:

```bash
npm install
```

2. Create environment variables:

```bash
copy .env.example .env.local
```

3. Start the development frontend:

```bash
npm run dev
```

4. Open the browser at:

```text
http://localhost:5173
```

## Production start

Build and start the production server:

```bash
npm run build
npm start
```

The app will be available on:

```text
http://localhost:3000
```

## Deployment platforms

This project is compatible with:

- Vercel
- Netlify
- Render
- Railway
- Any VPS or container host

For static hosting, upload the contents of the `dist` folder. For full-stack hosting, use the Node.js server entry point.

## Recommended commands

```bash
npm run dev        # start the Vite dev server
npm run build      # build the production bundle
npm start          # start the production server
npm run deploy:check  # validate the build
```

## Notes

- The frontend uses `/api` by default, which is handled by the production server.
- The backend persists data to `data.json` and creates backup files such as `data.json.<timestamp>.bak`.
- If you use an external API backend, update `VITE_API_BASE` in your environment file.
