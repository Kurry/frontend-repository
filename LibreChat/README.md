# LibreChat (client-only mock)

Frontend-only LibreChat workspace. No real backend, database, or authentication.

## Layout

```
LibreChat/
  app/          # Application root (workspace contract `/app`)
    client/     # React SPA
    packages/   # Shared frontend packages (data-provider, client UI)
    ...
  README.md
```

Work under `LibreChat/app`. That directory is the self-contained app.

## What this is

- Opens directly into the chat UI (no login)
- API calls are mocked (same-origin stubs; nothing fetched from another origin)
- Chat/session state persists in `localStorage` when available
- No MongoDB, Docker, or Express backend required

## Commands

From `LibreChat/app`:

```bash
npm run build
npm start
```

`npm start` serves the app on port **3000**.

For local HMR during development:

```bash
npm run frontend:dev
```

(Dev server defaults to port 3090.)

## Notes

- Do not edit `package.json` or reinstall dependencies in contract/eval runs.
- Dependencies are already under `app/node_modules`.
- Mock auth presents a demo user so protected chat routes render immediately.
