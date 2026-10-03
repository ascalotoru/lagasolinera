# LaGasolinera - Agent Instructions

App de precios de combustible (España). Monorepo ESM (`"type": "module"` en cada package). Node 24.x.

## Layout

- `api/` - Serverless functions Vercel (producción). Rutas dinámicas `[id].js`.
- `backend/` - Proxy Express dev local (puerto 3001). Reutiliza `shared/`.
- `frontend/` - Vite + React 18 + MapLibre + Tailwind (5173, HTTPS). Router: `/` mapa, `/history/:stationId` gráfico.
- `shared/` - `db.js` (Turso/local SQLite) + `priceCollector.js`. **Solo usado por `backend/` y `scripts/`.** Ver gotcha de Vercel abajo.
- `scripts/collect.js` - recolección manual.

## Commands

```bash
npm run install:all    # root + backend + frontend
npm run dev            # backend + frontend
npm run dev:backend    # 3001
npm run dev:frontend   # 5173 HTTPS
npm run collect        # recolección manual (requiere .env)
cd frontend && npm run build
pnpm exec vercel --prod --force  # deploy producción (vercel ^62.1.0 devDep root, CLI 62.x, Node 24)
```

No hay tests, lint ni typecheck. Verificación = `npm run build` + `curl` a endpoints.

## Node 24

- `engines.node: "24.x"` en los 3 `package.json` + `.nvmrc` (`24`). Vercel ya sirve `nodeVersion: "24.x"` (verificado vía API).
- No usar `node-fetch`: Node 24 trae `fetch` global. Importarlo es deuda.
- CLI Vercel local (56.x) corría en Node 22 y fallaba builds; usar `pnpm exec vercel` (62.1.0, Node 24).

## Gotchas Vercel (crítico)

- **Las serverless functions NO pueden importar de `shared/`.** Vercel solo empaqueta lo que está bajo `api/`; un import a `../../shared/db.js` falla en runtime con `ERR_MODULE_NOT_FOUND: /var/shared/...`. Duplica la lógica dentro del archivo de `api/` (ver `api/cron/collect.js` y `api/stations/[id]/history.js`, que inlinean DB/client en lugar de importar).
- **Editar `shared/` no afecta a producción.** Cualquier cambio de lógica compartida debe replicarse en la función `api/` correspondiente.
- **No añadir `functions.runtime` a `vercel.json`.** `@vercel/node@latest` es inválido y rompe el build con `Function Runtimes must have a valid version`. Deja que Vercel autodetecte (Node 24.x vía `engines`).
- **Vercel cachea el código de las functions.** Tras cambiar una función, desplegar con `vercel --prod --force` o seguirá sirviendo la versión antigua (síntoma: el error apunta a código ya borrado).
- `vercel.json` reescribe todo excepto `/api/*` a `/index.html` (SPA). No romper ese patrón.

## Base de datos / histórico de precios

- `shared/db.js` y las functions de `api/` eligen backend según env: si existe `TURSO_DATABASE_URL` → Turso (producción); si no → `local.db` (gitignored).
- Vars necesarias: `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` (en `.env` local y en env de Vercel).
- Tablas: `stations` (upsert por `station_id` = `IDEESS`), `price_history` y `collection_logs`.
- **Logs de recolección**: cada intento escribe en `collection_logs` (status `running`→`success`/`error`, fases `fetched`/`stations_upserted`, timings `fetch_ms`/`stations_ms`/`prices_ms`, `error`). Leer vía `GET /api/logs?limit=N` (prod) o `GET /api/cron/logs` (backend local).
- **Timeout conocido**: la function de Vercel muere a los 300s (Hobby) y devuelve 504; si un log queda en `running` con `phase` y sin `finished_at`, la recolección se colgó en esa fase. `markStaleCollectionLogs` lo marca `timeout` en el siguiente run.
- **Los datos viven en Turso (externo): NO se borran al desplegar.** Si falta histórico, revisar el cron, no el deploy.
- Recolección: cada 8h. Vercel Hobby solo permite crons diarios, por eso `.github/workflows/collect-prices.yml` hace `curl` a `GET /api/cron/collect` (`0 */8 * * *`). El handler acepta GET y POST; el backend local solo POST. El workflow imprime el body y `GET /api/logs` cuando falla.
- `api/cron/collect.js` no usa `node-fetch`; usa `fetch` global y `@libsql/client` directo. La instrumentación de logs está duplicada en `api/cron/collect.js` (Vercel) y `shared/priceCollector.js` (backend/scripts).

## Datos / API MITECO

- Proxy a `https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes`.
- Cache: memoria 1h en backend, `Cache-Control: s-maxage=3600` en `/api/stations/province/:id`; `s-maxage=300` en history.
- Frontend llama rutas relativas `/api/...`; Vite proxya a `localhost:3001` en dev; en prod Vercel enruta.
- Campos MITECO con acentos (`Rótulo`, `Dirección`) y decimales con coma (`.replace(',', '.')`).

## Frontend

- **HTTPS obligatorio** (`@vitejs/plugin-basic-ssl`, cert autofirmado): requerido para geolocalización en móvil (Firefox). Probar en misma red: `https://<ip>:5173/`.
- Estado en Zustand, persistido en localStorage: `useStore` (estaciones), `useFavoritesStore`, `useDiscountsStore`.
- `selectedFuel` recalcula precios con descuentos (por marca vía `brandExtractor.js`, no por gasolinera).
- Marcadores con `createRoot()` dinámico; clustering con Supercluster; carga por provincia según viewport.

## Deploy

- Push a `main` + `vercel --prod --force`. Producción: https://precio-gasolina.vercel.app
- `vercel.json`: `buildCommand` instala root + frontend y buildea; `outputDirectory` = `frontend/dist`.
