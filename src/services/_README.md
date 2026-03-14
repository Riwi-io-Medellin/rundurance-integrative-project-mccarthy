# services/ — Herramientas Especializadas

Los servicios manejan **tareas técnicas específicas** que no encajan en modelos ni controladores. Son utilidades reutilizables que cualquier controlador puede llamar.

## Cómo Difieren los Servicios de los Modelos

- **Modelos** = hablan con la base de datos (consultas SQL)
- **Servicios** = hablan con sistemas externos (AWS S3, n8n, parseo de archivos)

## Archivos en Esta Carpeta

### fitParser.js — Parser de Archivos .FIT ✅

Convierte archivos binarios .FIT (de relojes Garmin/COROS) en objetos JavaScript.

- **Entrada:** Un Buffer binario crudo (el archivo subido)
- **Salida:** `{ summary, laps }` — datos estructurados con todas las métricas
- Detecta y descomprime automáticamente archivos gzip (.fit.gz) por magic bytes `1f 8b`
- Soporta tanto Garmin (campo `enhanced_avg_speed`) como COROS (campo `avg_speed`)
- Rechaza archivos de planes de entrenamiento (solo acepta actividades completadas)

```
Usado por: workoutController.js (durante la subida de .FIT)
```

### s3.js — Almacenamiento de Archivos AWS S3 ✅

Sube archivos a Amazon S3 (almacenamiento en la nube) y genera URLs de descarga.

- `uploadFitFile(buffer, athleteId, filename)` → sube .FIT, devuelve la clave S3
- `uploadParsedFit(parsed, athleteId, filename)` → sube el JSON parseado
- `uploadZwoForAthlete(buffer, athleteId, filename)` → sube archivos .ZWO de planes
- `getObjectBuffer(s3Key)` → descarga un objeto S3 como Buffer
- `getPresignedUrl(s3Key)` → genera una URL temporal para descargar un archivo privado

Rutas de archivos en S3:
- Archivos .FIT: `fit/{athleteId}/{YYYY-MM-DD}_{filename}`
- Archivos .ZWO: `zwo/{athleteId}/{YYYY-MM-DD}_{filename}`
- JSON parseado: `fit/{athleteId}/{YYYY-MM-DD}_{basename}.json`

```
Usado por: workoutController.js (subida), planController.js (futuro)
```

### n8n.js — Webhook de Feedback con IA ✅

Envía datos de la sesión a n8n (plataforma de automatización) que dispara el análisis con IA.

- **Fire-and-forget:** La subida no espera a que termine el feedback de la IA
- n8n recibe los datos, los envía a Claude AI, y la IA postea el feedback de vuelta a nuestra API en `POST /api/workouts/:id/feedback`
- Si `N8N_WEBHOOK_URL` no está configurado, omite silenciosamente (sin crash)

```
Usado por: workoutController.js (después de una subida exitosa)
```

### zwoParser.js — Parser de Archivos .ZWO ✅

Convierte archivos XML de planes de entrenamiento Zwift en objetos JavaScript.

- **Entrada:** Buffer de un archivo .ZWO
- **Salida:** `{ name, description, author, sport_type, total_duration_s, intervals[] }`
- Soporta bloques: Warmup, Cooldown, SteadyState, Ramp, IntervalsT, FreeRide

```
Usado por: workoutController.js (al subir .ZWO junto a la actividad, y al obtener análisis)
```

## Conexión con Otras Carpetas

```
services/ usa:
  └── Sistemas externos (AWS S3, webhooks n8n, zlib para descompresión)

services/ es usado por:
  └── controllers/ → los controladores llaman funciones de servicio cuando las necesitan
```

Los servicios NO usan modelos ni la base de datos directamente. Son utilidades puras.
