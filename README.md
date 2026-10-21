# AHV · App de campo (ops-retro)

Telegram Mini App para la operación de la arenera (Clectif). El operario de la retroexcavadora o excavadora la usa desde una tablet para:

- **Inspección**: preoperacional y postoperacional de la máquina (lecturas, lista de ítems por sistema, fallas con foto, firma y veredicto APTA / APTA con observaciones / NO APTA).
- **Extracción**: conteo de baldes por material (de bloque a arena muy fina) y registro del volumen en m³ por título minero y frente.

La máquina y los materiales se muestran en 3D (Three.js). La identidad del operario es su cuenta de Telegram.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Three.js 0.128.

## Puesta en marcha

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # compilación de producción
npm run lint
```

Next.js 16 tiene cambios respecto a versiones anteriores; la documentación de la versión instalada está en `node_modules/next/dist/docs/`.

### Variables de entorno (`.env.local`)

| Variable | Qué hace |
|---|---|
| `NEXT_PUBLIC_API_BASE` | URL del backend (ej. `https://api.clectif.co`). Vacío = modo local: los registros no se envían y quedan en la cola de la tablet. |
| `NEXT_PUBLIC_DEVICE_ID` | Identificador de la tablet que viaja en cada registro. Por defecto `tablet-retro-01`. |

## Cómo funciona

**Funcionamiento sin red (local-first).** En la zona de explotación la señal es mala, así que la app nunca espera a la red. Cada registro se guarda primero en la tablet (IndexedDB, con localStorage de respaldo) y se envía después en segundo plano:

- Timeout por intento: 15 s, o 60 s si el registro lleva fotos.
- Reintentos con espera creciente (5 s, 10 s… hasta 2 min).
- Un registro sale de la cola solo cuando el servidor confirma. Reintentar es seguro porque el backend ignora duplicados por `client_uuid`.
- El indicador de la esquina superior muestra el estado ("En nube", "Guardando…", "Pendientes: N", "Sin conexión") y, al tocarlo, abre el diagnóstico de la tablet.
- Mientras la app está abierta sube la cola sola; cerrada, no puede. Conviene abrirla una vez con buena señal al final del turno.

También se guardan en la tablet el borrador de la inspección en curso y el catálogo (máquinas, títulos, frentes, turnos), para que la app arranque sin red con la última lista conocida.

**Backend.** La app solo habla con la API FastAPI (`ahv_api.py`, en la carpeta hermana `retro-extraccion`), que guarda en **Elasticsearch**. Rutas usadas:

| Ruta | Uso |
|---|---|
| `GET /api/contexto` | Catálogo de máquinas, títulos, frentes y turnos |
| `POST /api/inspecciones` | Inspección pre/post |
| `POST /api/extraccion/evento` | Evento de extracción |

Las credenciales de Elasticsearch viven solo en el servidor. El servidor verifica la identidad con el `initData` firmado de Telegram y calcula el veredicto de la inspección.

## Estructura

```
app/                      layout (SDK de Telegram, viewport), página y estilos globales (tema Tailwind)
features/field-app/       toda la app, ver su README
  FieldApp.tsx            composición: arranque, pestañas y modales
  data/                   catálogos estáticos (secciones, ítems, lecturas, granulometría, semilla)
  lib/                    lógica pura sin React: reglas de inspección, geo, turnos, API, almacenamiento
  hooks/                  estado y efectos: inspección, extracción, sesión, catálogo, cola de sincronización
  three/                  escenas 3D (InspectionScene, ExtractionScene) y useScene
  components/             interfaz por pantalla: layout, inspection, extraction, modals, ui
```

Detalles de arquitectura y decisiones en [features/field-app/README.md](features/field-app/README.md).

## Notas de uso

- Fuera de Telegram la app abre, pero el operario aparece como "Sin identificar" y no envía al servidor (requiere `initData`); los registros quedan en la cola.
- `three` está fijada en `0.128.0` a propósito: versiones posteriores cambian la iluminación y el color, así que subirla requiere revisión visual.
