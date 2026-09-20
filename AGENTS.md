# LaGasolinera - Agent Instructions

## Architecture

Monorepo con frontend, backend local y serverless functions:
- `api/` - Serverless functions para Vercel (producción)
- `backend/` - Proxy Express para desarrollo local (puerto 3001)
- `frontend/` - Vite + React + MapLibre + Tailwind (puerto 5173, HTTPS)

Todos usan ESM (`"type": "module"`).

## Commands

```bash
# Desarrollo (ambos servicios)
npm run dev

# Por separado
npm run dev:backend    # Puerto 3001
npm run dev:frontend   # Puerto 5173 (HTTPS)

# Producción
cd frontend && npm run build
vercel                 # Deploy a Vercel
```

No hay tests, lint, ni CI configurados.

## Important Context

- **HTTPS obligatorio en frontend**: Requerido para geolocalización en móviles. Usa `@vitejs/plugin-basic-ssl` con certificado autofirmado.
- **API MITECO**: Backend/serverless hace proxy a `https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes`. Cache de 1 hora (memoria en backend, HTTP en Vercel).
- **CORS**: Backend usa `cors()` middleware. Frontend usa proxy de Vite en desarrollo (`/api` → `localhost:3001`). En producción, Vercel routing maneja `/api/*` → serverless functions.
- **Geolocalización**: Firefox móvil requiere HTTPS. Si deniega permiso, instrucciones en mensaje de error.
- **Mapa**: Carga gasolineras por provincia según viewport (centro + adyacentes). Clustering con Supercluster.
- **Estado**: Zustand stores separados para estaciones, favoritos y descuentos. Todos persistentes en localStorage.
- **Marcadores**: Se crean con `createRoot()` dinámicamente. El popup muestra todos los precios de todos los combustibles.
- **Descuentos**: Por marca (extraída de `Rótulo` con `brandExtractor.js`), no por gasolinera individual.

## Data Flow

1. Usuario mueve mapa → `getProvincesForViewport()` calcula provincias
2. Frontend pide provincias no cargadas → API `/api/stations/province/:id`
3. Desarrollo: Backend Express cachea 1h en memoria
4. Producción: Vercel serverless con cache HTTP (s-maxage=3600)
5. Frontend actualiza Zustand store
6. `updateMarkers()` re-renderiza clusters con Supercluster
7. Cambios en `selectedFuel` recalculan precios con descuentos aplicados

## Deployment (Vercel)

- `vercel.json` configura routing: `/api/*` → serverless, resto → frontend estático
- Serverless functions en `api/stations/province/[id].js`
- Frontend build: `frontend/dist/`
- Deploy automático desde GitHub

## Mobile Testing

Accede desde móvil en la misma red: `https://192.168.99.3:5173/`

Acepta certificado autofirmado en Firefox móvil.
