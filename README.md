# LaGasolinera

Portal web para consultar precios de combustible en gasolineras de España en tiempo real.

## Stack tecnológico

### Frontend
- **Vite** - Build tool y dev server
- **React 18** - Librería UI
- **MapLibre GL JS** - Mapa interactivo
- **Zustand** - Gestión de estado
- **Supercluster** - Clustering de marcadores
- **Tailwind CSS** - Estilos

### Backend
- **Node.js + Express** - Servidor proxy
- **node-fetch** - Cliente HTTP para API MITECO

### Datos
- **API MITECO** - Precios de carburantes en España (actualización horaria)

## Requisitos

- Node.js 18+
- npm 9+

## Instalación

### Desarrollo local

```bash
# Instalar todas las dependencias
npm run install:all

# O manualmente:
cd backend && npm install
cd ../frontend && npm install
cd ..
```

## Ejecución

### Desarrollo local

```bash
# Ambos servicios (backend + frontend)
npm run dev

# O por separado:
npm run dev:backend   # Puerto 3001
npm run dev:frontend  # Puerto 5173
```

Abre tu navegador en `http://localhost:5173`

### Producción (Vercel)

```bash
# Instalar Vercel CLI
npm install -g vercel

# Deploy
vercel
```

## Uso

1. **Navegar el mapa**: Arrastra y haz zoom para explorar España
2. **Ver gasolineras**: Los marcadores azules representan gasolineras individuales
3. **Clusters**: Los círculos de colores muestran grupos de gasolineras
   - Verde: menos de 10 gasolineras
   - Amarillo: 10-50 gasolineras
   - Rojo: más de 50 gasolineras
4. **Filtrar combustible**: Usa el selector en la esquina superior derecha
5. **Ver detalles**: Haz clic en un marcador para ver información detallada
6. **Gasolineras cercanas**: Panel izquierdo muestra las 10 más cercanas a tu ubicación
7. **Favoritos**: Marca gasolineras como favoritas con el corazón en el popup
8. **Descuentos**: Configura descuentos por marca con el botón "Descuentos"
   - Descuentos en céntimos (ej: -5 céntimos)
   - Descuentos en porcentaje (ej: -3%)
   - Los precios con descuento aparecen en verde

## Estructura del proyecto

```
precio-gasolina/
├── api/                         # Serverless functions (Vercel)
│   └── stations/
│       └── province/[id].js     # Proxy API MITECO
├── backend/                     # Backend Express (desarrollo local)
│   ├── src/
│   │   ├── server.js
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── store/
│   │   ├── utils/
│   │   └── data/
│   └── package.json
├── vercel.json                  # Configuración Vercel
├── package.json                 # Scripts raíz
└── README.md
```

## Características implementadas

### Fase 1 - Mapa básico
- Mapa interactivo con MapLibre
- Carga de gasolineras por provincia (centro del viewport + adyacentes)
- Clustering de marcadores para mejor rendimiento
- Filtro por tipo de combustible
- Popup con información detallada (dirección, marca, precio)
- Cache de datos (1 hora en backend)
- Proxy backend para evitar problemas CORS

### Fase 2 - Geolocalización
- Geolocalización automática del usuario
- Mapa se centra en tu ubicación (zoom 12)
- Panel con las 10 gasolineras más cercanas
- Ordenadas por distancia (fórmula Haversine)

### Fase 3 - Favoritos
- Sistema de favoritos con localStorage
- Panel de gasolineras favoritas
- Botón corazón en popup para marcar/desmarcar

### Fase 4 - Descuentos
- Panel de configuración de descuentos por marca
- Descuentos en céntimos o porcentaje
- Precios con descuento mostrados en verde
- Precio original tachado para referencia
- Descuentos persistentes en localStorage

## Próximas fases

### Fase 5
- Cálculo de rutas con gasolineras
- Alertas de precio bajo

## Licencia

Proyecto de código abierto.

## Créditos

Datos proporcionados por el Ministerio para la Transición Ecológica y el Reto Demográfico (MITECO).
