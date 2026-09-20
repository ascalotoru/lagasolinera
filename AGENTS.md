# LaGasolinera - Agent Instructions

## Architecture

Monorepo con dos paquetes independientes:
- `backend/` - Proxy Express para API MITECO (puerto 3001)
- `frontend/` - Vite + React + MapLibre + Tailwind (puerto 5173, HTTPS)

Ambos usan ESM (`"type": "module"`).

## Commands

```bash
# Backend
cd backend && npm run dev          # Puerto 3001

# Frontend
cd frontend && npm run dev         # Puerto 5173 (HTTPS)
cd frontend && npm run build       # Build producción
```

No hay tests, lint, ni CI configurados.

## Important Context

- **HTTPS obligatorio en frontend**: Requerido para geolocalización en móviles. Usa `@vitejs/plugin-basic-ssl` con certificado autofirmado.
- **API MITECO**: Backend hace proxy a `https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes`. Cache de 1 hora en memoria.
- **CORS**: Backend usa `cors()` middleware. Frontend usa proxy de Vite en desarrollo (`/api` → `localhost:3001`).
- **Geolocalización**: Firefox móvil requiere HTTPS. Si deniega permiso, instrucciones en mensaje de error.
- **Mapa**: Carga gasolineras por provincia según viewport (centro + adyacentes). Clustering con Supercluster.
- **Estado**: Zustand stores separados para estaciones, favoritos y descuentos. Todos persistentes en localStorage.
- **Marcadores**: Se crean con `createRoot()` dinámicamente. El popup muestra todos los precios de todos los combustibles.
- **Descuentos**: Por marca (extraída de `Rótulo` con `brandExtractor.js`), no por gasolinera individual.

## Data Flow

1. Usuario mueve mapa → `getProvincesForViewport()` calcula provincias
2. Frontend pide provincias no cargadas → Backend proxy a MITECO
3. Backend cachea 1h → Frontend actualiza Zustand store
4. `updateMarkers()` re-renderiza clusters con Supercluster
5. Cambios en `selectedFuel` recalculan precios con descuentos aplicados

## Mobile Testing

Accede desde móvil en la misma red: `https://192.168.99.3:5173/`

Acepta certificado autofirmado en Firefox móvil.
