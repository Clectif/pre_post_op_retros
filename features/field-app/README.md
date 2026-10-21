# AHV · App de campo

Telegram Mini App con dos pestañas — **Inspección** (pre/post) y **Extracción** — portada desde `retro-extraccion/ahv_campo.html`.
El backend (`ahv_api.py` → Elasticsearch) no cambia.

## Configuración

Variables de entorno (`.env.local`):

| Variable | Qué hace |
|---|---|
| `NEXT_PUBLIC_API_BASE` | Base a la que llama la tablet. Use `/backend` (la pasarela de `app/backend/[...path]/route.ts`). Vacío = modo local: los registros quedan en la cola del dispositivo. |
| `API_URL` | URL de `ahv_api.py` vista desde el servidor de Next (ej. `http://localhost:8082`). Solo servidor. |
| `API_USER` / `API_PASSWORD` | HTTP Basic del backend. Solo servidor: la pasarela los agrega y nunca llegan al navegador. |
| `NEXT_PUBLIC_DEVICE_ID` | Identificador de la tablet que viaja en cada registro (por defecto `tablet-retro-01`). |

## Estructura

```
FieldAppLoader.tsx   carga FieldApp solo en cliente (IndexedDB, WebGL, GPS y Telegram no existen en el servidor)
FieldApp.tsx         composición: arranque, pestañas y modales; no tiene reglas de negocio
config.ts · types.ts constantes y tipos de dominio

data/                catálogos estáticos (secciones, ítems, lecturas, granulometría, semilla de arranque)
lib/                 lógica pura y sin React: reglas de inspección, geo, turnos, API, registros, storage/ (IndexedDB)
hooks/               estado y efectos: useInspection, useExtraction, useSession, useCatalog, useSyncQueue, …
three/               escenas 3D como clases (InspectionScene, ExtractionScene) + useScene (renderer y ciclo de vida)
components/          UI en Tailwind, por pantalla: layout/, inspection/, extraction/, modals/, ui/
```

Reglas de la arquitectura:

- **React es la fuente de verdad.** Las escenas 3D no guardan estado de negocio: reciben `setView(...)` y avisan con `onPick`.
- **`lib/` no importa React.** Lo que se puede probar sin montar nada, vive ahí.
- **Un solo renderer WebGL vivo**: al cambiar de pestaña se libera el anterior (`useScene` hace `forceContextLoss`).
- El estado de inspección y extracción vive en `FieldApp`, así que sobrevive al cambio de pestaña.
- Colores y sombras están en `@theme` de `app/globals.css` (`bg-panel`, `text-muted`, `shadow-card`…); `short:` es la variante para pantallas de menos de 700 px de alto.

## Dependencias

`three@0.128.0` (exacta, la misma `r128` del HTML original). Versiones posteriores cambian la iluminación y el manejo de color,
así que subirla es una tarea aparte con revisión visual.
