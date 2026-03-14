# Rundurance — Arquitectura y Decisiones de Diseño

Este documento explica cómo está construida la aplicación, por qué se tomaron cada una de las decisiones tecnológicas y de arquitectura, y cómo encajan todas las piezas.

---

## 1. Qué es Rundurance

Rundurance es una plataforma web para entrenadores de running. Resuelve un problema concreto: un entrenador con 20–30 atletas pasa horas analizando archivos de GPS, escribiendo feedback manual y persiguiendo pagos. Rundurance automatiza ese flujo completo:

1. El atleta corre con su reloj Garmin o COROS
2. El entrenador sube el archivo `.FIT` a la plataforma
3. El sistema extrae todas las métricas automáticamente
4. Un agente de IA genera el feedback en segundos
5. El entrenador revisa, el atleta lo ve en su portal

---

## 2. Stack Tecnológico — Por Qué Cada Elección

### Node.js + Express (Backend)

**Decisión:** Un servidor HTTP minimalista con Express.

**Por qué:** Express no impone estructura — eso nos permite organizar el código exactamente como queremos (MVC por capas). Alternativas como NestJS o Fastify añaden complejidad o convenciones propias que para un equipo junior en 2 semanas son un obstáculo. Express tiene cero magia: lo que ves es lo que pasa.

**Por qué no NestJS:** NestJS tiene decoradores, módulos, inyección de dependencias — es potente pero la curva de aprendizaje para un equipo junior habría consumido la mitad del tiempo disponible.

### PostgreSQL (Base de Datos)

**Decisión:** Base de datos relacional con esquema tipado.

**Por qué:** Los datos de Rundurance son relacionales por naturaleza: un entrenador tiene muchos atletas, cada atleta tiene muchos entrenamientos, cada entrenamiento tiene muchas vueltas. Las relaciones entre tablas son la esencia del modelo. SQL con `JOIN` y llaves foráneas garantiza integridad — no puedes tener un entrenamiento sin un atleta, ni un pago sin un entrenador.

**Por qué no MongoDB:** MongoDB es flexible, pero esa flexibilidad se convierte en problema cuando necesitas garantías de consistencia (ej: si un atleta se borra, sus pagos y entrenamientos deben manejarse correctamente). Con PostgreSQL y llaves foráneas, eso está garantizado por la base de datos misma.

**Por qué no SQLite:** SQLite no soporta múltiples conexiones concurrentes bien. Con un pool de conexiones en un servidor web con varios usuarios simultáneos, PostgreSQL es la opción correcta.

### Vanilla JS + Tailwind CDN (Frontend)

**Decisión:** HTML puro + JavaScript sin bundler + Tailwind desde CDN.

**Por qué no React/Vue:** El equipo es junior y el plazo es 2 semanas. React tiene un costo de setup (Vite/CRA, JSX, state management, componentes) que no aporta valor real a esta escala. Cada página tiene una responsabilidad clara y no necesita estado compartido complejo entre componentes.

**Por qué Tailwind desde CDN:** Sin bundler no hay proceso de build. Tailwind CDN en v3 incluye el motor JIT completo — genera clases en el navegador. Para producción a escala real habría que considerar el build offline, pero para el MVP es perfecto: cero configuración, todo funciona.

**Por qué no Bootstrap:** Bootstrap impone un sistema de grid y componentes con estilos predefinidos difíciles de personalizar. Tailwind da control total con clases utilitarias.

### JWT (Autenticación)

**Decisión:** JSON Web Tokens sin estado (stateless).

**Por qué:** JWT permite autenticación sin guardar sesiones en la base de datos. El servidor solo necesita verificar la firma del token con `JWT_SECRET`. Esto escala bien — si mañana hay 10 instancias del servidor, todas pueden verificar el mismo token sin coordinación.

**Por qué no sesiones con cookies:** Las sesiones requieren almacenamiento del lado del servidor (base de datos o Redis). Para este MVP, JWT es más simple y suficiente.

**Dónde se guarda:** En `sessionStorage` (no `localStorage`). La diferencia: `sessionStorage` se limpia cuando el usuario cierra la pestaña, `localStorage` persiste indefinidamente. Para una plataforma con datos sensibles de atletas, `sessionStorage` es más seguro.

### AWS S3 (Almacenamiento de Archivos)

**Decisión:** Los archivos binarios (.FIT, .ZWO) se almacenan en S3, no en la base de datos.

**Por qué no guardar los archivos en PostgreSQL:** Los archivos binarios en una base de datos relacional (tipo BYTEA en PostgreSQL) degradan el rendimiento de las consultas, aumentan el tamaño de los backups y complican las migraciones. S3 está diseñado para almacenar blobs de cualquier tamaño con durabilidad del 99.999999999%.

**Por qué no el disco del servidor:** El servidor de Express puede reiniciarse, migrarse o escalarse horizontalmente. Los archivos en disco local se perderían. S3 es persistente, independiente del servidor.

**Qué se guarda en la BD:** Solo la `s3_key` (la ruta del archivo en S3). El archivo real vive en S3. Cuando se necesita, se genera una URL presignada temporal.

### n8n (Automatización e IA)

**Decisión:** El feedback de IA se genera a través de un workflow de n8n, no directamente desde el backend de Express.

**Por qué no llamar a la API de Claude directamente desde el controller:** El proceso de análisis de IA puede tardar 10–30 segundos. Si el controller esperara la respuesta, el usuario tendría que esperar bloqueado. Con n8n, el upload responde inmediatamente (201) y el feedback llega cuando está listo.

**Patrón fire-and-forget:** El controller dispara el webhook de n8n y no espera la respuesta. n8n procesa de forma asíncrona: recibe los datos → envía al agente de Claude → el agente analiza las métricas → hace POST a `/api/workouts/:id/feedback` con el resultado.

**Por qué n8n y no un worker propio:** n8n es una plataforma de automatización visual con conectores nativos para Claude AI, WhatsApp, email, etc. Construir un sistema de colas y workers propio (con Bull, Redis, etc.) tomaría semanas. n8n hace lo mismo en horas.

---

## 3. Arquitectura en Capas (MVC Extendido)

```
┌─────────────────────────────────────────────────┐
│              NAVEGADOR (public/)                 │
│  HTML + Tailwind + Vanilla JS                    │
│  fetch() → JWT en sessionStorage                 │
└─────────────────┬───────────────────────────────┘
                  │ HTTP (JSON / multipart)
┌─────────────────▼───────────────────────────────┐
│              server.js                           │
│  Express · helmet · cors · static files         │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│            src/routes/                           │
│  Mapeo URL → controller + middleware             │
└──────┬─────────────────────────┬────────────────┘
       │                         │
┌──────▼──────┐        ┌─────────▼──────────────┐
│ middleware/ │        │      controllers/       │
│ auth.js     │        │  Orquestación + HTTP    │
│ JWT verify  │        │  req/res handling       │
└─────────────┘        └──────┬──────────────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
      ┌───────▼──────┐ ┌──────▼─────┐ ┌──────▼─────┐
      │   models/    │ │  services/ │ │    db/     │
      │  SQL queries │ │ S3·n8n·FIT │ │  pg Pool   │
      └───────┬──────┘ └────────────┘ └──────┬─────┘
              │                              │
      ┌───────▼──────────────────────────────▼─────┐
      │              PostgreSQL                      │
      └─────────────────────────────────────────────┘
```

### Por Qué Esta Estructura

**Routes separadas de Controllers:** En MVC clásico, el controller también maneja el mapeo de URLs. Lo separamos porque las rutas son una descripción declarativa de la API ("qué existe") mientras que los controllers son lógica imperativa ("qué hacer"). Al leer `routes/workouts.js` en 20 líneas sabes toda la API de workouts.

**Services separados de Controllers:** El `workoutController.js` podría contener el código de parseo de .FIT, la lógica de S3 y el envío a n8n. Pero eso lo convertiría en un archivo de 500+ líneas imposible de mantener. Al extraer cada responsabilidad a un servicio (`fitParser.js`, `s3.js`, `n8n.js`), el controller queda en ~30 líneas de lógica de orquestación.

**db/ como singleton:** Todos los modelos importan el mismo pool de conexiones. Si se creara una nueva instancia de `Pool` en cada modelo, habría cientos de conexiones abiertas simultáneamente. Un singleton garantiza que todo el sistema comparte el mismo pool.

---

## 4. El Flujo de Subida de una Sesión .FIT

Este es el flujo más complejo de la aplicación:

```
POST /api/workouts/upload (multipart/form-data)
  │
  ├── 1. multer → lee el archivo a memoria (Buffer)
  │
  ├── 2. auth middleware → verifica JWT, asigna req.trainer
  │
  ├── 3. controller → valida athlete_id, verifica ownership
  │
  ├── 4. fitParser.parseFit(buffer)
  │       ├── Detecta gzip (magic bytes 0x1f 0x8b) → descomprime
  │       ├── Detecta tipo de archivo (activity vs workout plan)
  │       ├── Detecta modo: Garmin (enhanced_avg_speed) vs COROS (avg_speed)
  │       └── Devuelve { summary, laps }
  │
  ├── 5. S3 uploads (en paralelo con Promise.all)
  │       ├── uploadFitFile → guarda el .FIT crudo
  │       └── uploadParsedFit → guarda el JSON parseado
  │
  ├── 6. Busca planned_workout por fecha (matching automático)
  │
  ├── 7. INSERT completed_workout → guarda resumen
  │
  ├── 8. INSERT completed_workout_lap (por cada vuelta)
  │
  ├── 9. n8n.triggerFeedback() → fire-and-forget
  │       └── { athlete, summary, laps, s3_key, workout_id, trainer_id }
  │
  └── 10. Responde 201 { completed_workout_id, laps_saved, matched_plan }
```

**Decisión clave — por qué GPS se descarta:** Los tracks GPS (array de miles de puntos con lat/lon/altitud/tiempo) son los datos más voluminosos del archivo .FIT pero los menos útiles para el análisis de entrenamiento de running. Guardarlos en PostgreSQL haría las tablas enormes y las consultas lentas. Se guardan en S3 (el archivo .FIT crudo tiene el GPS) pero no se parsean a la BD.

**Decisión clave — matching por fecha:** Cuando el atleta sube una actividad del día 2026-02-27, el sistema busca si existe una `planned_workout` programada para ese día. Si encuentra una, la vincula automáticamente. Esto permite la comparación plan vs ejecución en el análisis de IA.

---

## 5. Autenticación y Seguridad

### Flujo JWT

```
POST /api/auth/login
  { email, password }
       │
       ▼
bcrypt.compare(password, hash_bd)
       │
       ▼
jwt.sign({ trainer_id, email, role }, JWT_SECRET, { expiresIn: '7d' })
       │
       ▼
{ token: "eyJ..." }  →  frontend: sessionStorage.setItem('token', ...)

Peticiones siguientes:
Authorization: Bearer eyJ...
       │
       ▼
middleware/auth.js → jwt.verify(token, JWT_SECRET)
       │
       ▼
req.trainer = { trainer_id, email, role }
```

### Isolación de Datos por Entrenador

Cada consulta filtra por `trainer_id`. Un entrenador nunca puede ver datos de otro:

```sql
-- Todos los atletas solo del entrenador logueado
SELECT * FROM athlete WHERE trainer_id = $1 AND is_active = TRUE
```

El `trainer_id` siempre viene de `req.trainer.trainer_id` (del JWT verificado), nunca del body del request. Un atacante no puede falsificar su `trainer_id` aunque controle el body.

### Contraseñas

Se hashean con bcrypt (factor de costo 10) antes de guardar. Nunca se almacena la contraseña en texto plano.

### Rate Limiting

`express-rate-limit` limita las peticiones al endpoint de login para prevenir ataques de fuerza bruta.

### Helmet

Añade headers HTTP de seguridad (Content-Security-Policy, X-Frame-Options, etc.) automáticamente.

---

## 6. Modelo de Datos — Decisiones de Diseño

### Por Qué 11 Tablas

El esquema tiene estas entidades principales:

```
trainer (1) ──── (N) athlete
athlete (1) ──── (N) workout_plan
workout_plan (1) ─── (N) planned_workout
athlete (1) ──── (N) completed_workout
completed_workout (1) ─── (N) completed_workout_lap
completed_workout (1) ─── (1) workout_feedback
athlete (1) ──── (N) payment
athlete (1) ──── (N) athlete_alert
```

### Borrado Lógico

Los atletas no se borran físicamente de la BD (`DELETE`). En cambio, tienen un campo `is_active = FALSE`. Esto preserva el historial de entrenamientos y pagos. Un atleta "eliminado" sigue existiendo en la BD con todos sus datos, simplemente no aparece en la interfaz.

### planned_workout vs completed_workout

Son dos tablas separadas intencionalmente:
- `planned_workout`: lo que el entrenador programó (duración, distancia planificadas, archivo .ZWO)
- `completed_workout`: lo que el atleta ejecutó (métricas reales del .FIT)

Se vinculan opcionalmente por `completed_workout.planned_workout_id`. Esta separación permite que existan entrenamientos completados sin plan (el atleta corrió sin plan formal) y planes sin completar (el atleta no corrió ese día).

### Por Qué No Guardar los Records GPS en la BD

El archivo .FIT de una hora de carrera tiene ~3,600 records GPS (uno por segundo). Guardar eso en PostgreSQL por cada entrenamiento haría la tabla inmanejable en semanas. Los records se descartan del parser intencionalmente — el archivo .FIT crudo en S3 los contiene si alguna vez se necesitan.

---

## 7. Parser de Archivos .FIT

El formato .FIT (Flexible and Interoperable Data Transfer) es un formato binario propietario de Garmin. El parser usa la librería `fit-file-parser` y añade lógica adicional:

### Detección de Gzip

```javascript
if (buffer[0] === 0x1f && buffer[1] === 0x8b) {
  buffer = await gunzip(buffer); // descomprime antes de parsear
}
```

COROS exporta archivos `.fit.gz` (comprimidos). Garmin exporta `.fit` (sin comprimir). La detección por magic bytes hace que el parser sea agnóstico al formato de compresión.

### Detección de Dispositivo

```javascript
// Garmin usa enhanced_avg_speed
// COROS usa avg_speed
const speed = session.enhanced_avg_speed ?? session.avg_speed;
```

Diferentes dispositivos usan diferentes nombres de campo para la misma métrica. El parser usa el operador `??` (nullish coalescing) para intentar el campo de Garmin primero, luego el de COROS.

### Rechazo de Archivos de Plan

```javascript
if (fileType === "workout") {
  throw new Error("Este archivo es un plan de entrenamiento, no una actividad completada.");
}
```

Los archivos `.FIT` de planes de entrenamiento (exportados desde Garmin Connect o un software de coaching) tienen `file_id.type = "workout"`. El parser los rechaza con un mensaje claro antes de intentar extraer métricas que no existen.

---

## 8. Frontend — Decisiones de Diseño

### Module Pattern con api.js

Todas las páginas importan un módulo compartido `assets/js/api.js` que centraliza:
- El token JWT
- Las funciones HTTP (`apiGet`, `apiPost`, `apiPut`, `apiDelete`)
- La protección de rutas (`checkAuth`)

Sin este módulo, cada página duplicaría la lógica de autenticación. Con él, agregar un nuevo header de seguridad o cambiar de `sessionStorage` a `localStorage` requiere cambiar UN archivo.

### sessionStorage vs localStorage

El token JWT se guarda en `sessionStorage`. La diferencia:
- `sessionStorage`: se limpia al cerrar la pestaña/navegador
- `localStorage`: persiste hasta que el código lo borra explícitamente

Para una plataforma con datos sensibles de rendimiento de atletas, preferimos que la sesión expire naturalmente al cerrar el navegador.

### Sin Bundler

No hay Webpack, Vite, ni proceso de build. Las páginas usan ES modules nativos del navegador:

```html
<script type="module" src="../assets/js/sesiones.js"></script>
```

Esto funciona en todos los navegadores modernos y elimina la complejidad de configuración de herramientas de build para un MVP de 2 semanas.

### Tailwind desde CDN

El CDN de Tailwind v3 con el motor JIT genera las clases en tiempo real en el navegador. Para producción a escala habría que compilar el CSS offline para reducir el payload, pero para el MVP es suficiente.

---

## 9. Integración con n8n — Flujo de IA

```
workoutController
    │  triggerFeedback(athlete, summary, laps, s3Key, workoutId, trainerId, plannedWorkout)
    │
    ▼
POST {N8N_WEBHOOK_URL}
{
  workout_id, trainer_id,
  athlete: { name, birth_date },
  session: { date, duration_min, distance_km, avg_hr, avg_pace, avg_cadence, ... },
  laps: [{ lap, distance_km, duration_s, avg_hr, avg_power, avg_speed }],
  fit_s3_key
}

    ▼ (n8n procesa de forma asíncrona)

n8n Workflow:
  Webhook trigger
    → Agente Claude (analiza métricas según criterios del entrenador)
    → POST /api/workouts/{workout_id}/feedback
       { feedback: "Excelente sesión...", source: "ai" }

    ▼

workoutController.saveFeedback()
  → INSERT workout_feedback
  → Visible en el portal del atleta y en la vista de sesiones del entrenador
```

**Por qué el payload es compacto:** Solo se envían las métricas agregadas (resumen + laps), no los 3,600 records GPS. Esto mantiene el payload pequeño (<5KB) y el agente de IA recibe exactamente lo que necesita para el análisis de entrenamiento.

---

## 10. Convenciones que Mantienen el Código Coherente

| Convención | Regla | Por qué |
|-----------|-------|---------|
| CommonJS | `require`/`module.exports` en todo | El proyecto es 100% Node.js puro; ESM añade complejidad innecesaria |
| `const`/`let` | Nunca `var` | `var` tiene scoping confuso (function scope vs block scope). `const` por defecto, `let` solo si se reasigna |
| `async/await` | Siempre con `try/catch` | Las promesas sin catch silencian errores. Un error no capturado en Express 4 mata el proceso |
| SQL parametrizado | Siempre `$1, $2` | Previene inyección SQL. Sin excepción |
| `req.trainer` | Nunca `req.user` | El middleware de auth asigna `req.trainer`. Usar `req.user` daría `undefined` |
| Commits convencionales | `feat:`, `fix:`, `style:`, `chore:` | Hace el historial de git legible y facilita changelogs automáticos |

---

## 11. Lo Que No Está Implementado (y Por Qué)

| Funcionalidad | Estado | Decisión |
|--------------|--------|---------|
| Importación directa desde Garmin Connect | No implementado | La API de Garmin requiere OAuth 2.0 y aprobación de partner. Fuera del alcance del MVP |
| Tiempo real (WebSockets) | No implementado | El feedback de IA llega via POST desde n8n. Polling cada vez que el usuario abre la vista es suficiente para el MVP |
| Sincronización automática de pagos | No implementado | La lógica de gracia (pendiente → vencido a los 5 días) está en el modelo SQL; se aplica en cada consulta |
| App móvil nativa | No implementado | La interfaz es responsiva. Una app nativa requeriría un equipo y tiempo fuera del alcance |
| Tests automatizados | No implementado | El equipo es junior y el plazo es 2 semanas. Las pruebas se hacen manualmente con Postman |
