Resumen del Proyecto: Rundurance

¿Qué es?

**Rundurance** es una plataforma web para entrenadores de running. Permite gestionar atletas, analizar sus entrenamientos, generar retroalimentación automática con inteligencia artificial y hacer seguimiento financiero de los pagos de cada atleta.

Problema que resuelve

Los entrenadores de running manejan múltiples atletas y necesitan centralizar:

- El historial de entrenamientos (archivos `.FIT` de Garmin, `.ZWO` de Zwift)
- Métricas de rendimiento (frecuencia cardíaca, cadencia, carga de entrenamiento)
- Alertas de sobreentrenamiento o sesiones incumplidas
- El cobro mensual por atleta

Rundurance automatiza todo ese flujo en una sola plataforma.

---

## Flujo principal

```
Entrenador sube archivo .FIT
        ↓
Backend lo parsea (binario → JSON)
        ↓
Se guarda en Amazon S3 + base de datos PostgreSQL
        ↓
Se dispara webhook en n8n
        ↓
n8n envía los datos a una IA (genera feedback)
        ↓
El feedback se guarda y el entrenador recibe una alerta
```

---

## Stack tecnológico

| Capa                | Tecnología                                 |
| ------------------- | ------------------------------------------ |
| Frontend            | HTML5 + CSS3 + JavaScript Vanilla          |
| Estilos             | Tailwind CSS (CDN) + Bootstrap Icons (CDN) |
| Backend             | Node.js + Express.js                       |
| Base de datos       | PostgreSQL 16                              |
| Almacenamiento      | Amazon S3                                  |
| Automatización / IA | n8n (webhooks)                             |
| Autenticación       | JWT + bcrypt                               |
| Subida de archivos  | multer + fit-file-parser                   |

---

## Arquitectura

El backend sigue el patrón **MVC + capa de servicios**:

- **`src/routes/`** — Define las URLs y aplica el middleware de autenticación
- **`src/controllers/`** — Maneja las peticiones HTTP y coordina la lógica
- **`src/models/`** — Ejecuta las consultas SQL con parámetros seguros
- **`src/services/`** — Integraciones externas: S3, n8n, parser de `.FIT`
- **`src/middleware/auth.js`** — Valida el token JWT en cada petición protegida
- **`src/db/connection.js`** — Pool de conexiones a PostgreSQL (singleton)

El frontend está en `public/`: una página HTML y un archivo JS por sección (dashboard, atletas, finanzas, progreso).

---

## Base de datos (tablas principales)

| Tabla                   | Descripción                                          |
| ----------------------- | ---------------------------------------------------- |
| `trainer`               | Entrenadores registrados                             |
| `athlete`               | Atletas vinculados a un entrenador                   |
| `workout_plan`          | Bloques de entrenamiento asignados                   |
| `planned_workout`       | Sesiones planificadas (puede tener archivo `.ZWO`)   |
| `completed_workout`     | Sesiones ejecutadas (métricas completas de `.FIT`)   |
| `completed_workout_lap` | Desglose por vuelta de cada sesión                   |
| `workout_feedback`      | Retroalimentación de la IA o del entrenador          |
| `athlete_alert`         | Alertas activas (sobreentrenamiento, pagos vencidos) |
| `payment`               | Seguimiento de pagos mensuales por atleta            |

---

## Endpoints de la API

| Método | Ruta                         | Auth | Descripción                   |
| ------ | ---------------------------- | ---- | ----------------------------- |
| POST   | `/api/auth/register`         | No   | Registrar entrenador          |
| POST   | `/api/auth/login`            | No   | Login → devuelve JWT          |
| GET    | `/api/athletes`              | JWT  | Listar atletas del entrenador |
| POST   | `/api/athletes`              | JWT  | Crear atleta                  |
| GET    | `/api/athletes/:id`          | JWT  | Perfil de atleta              |
| POST   | `/api/workouts/upload`       | JWT  | Subir archivo `.FIT`          |
| GET    | `/api/workouts/athlete/:id`  | JWT  | Entrenamientos de un atleta   |
| POST   | `/api/workouts/:id/feedback` | JWT  | Guardar feedback de n8n       |

---

## Cómo ejecutar el proyecto

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con los valores reales

# 3. Inicializar la base de datos
psql -U postgres -d runduranceDB -f docs/database/schema.sql

# 4. Iniciar en desarrollo
npm run dev

# 5. Iniciar en producción
npm start
```

El servidor corre en `http://localhost:3000`.

---

## Variables de entorno requeridas

| Variable                | Descripción                         |
| ----------------------- | ----------------------------------- |
| `PORT`                  | Puerto del servidor (defecto: 3000) |
| `DATABASE_URL`          | Cadena de conexión PostgreSQL       |
| `JWT_SECRET`            | Secreto para firmar tokens JWT      |
| `AWS_REGION`            | Región de S3 (ej. `us-east-2`)      |
| `AWS_ACCESS_KEY_ID`     | Credenciales AWS                    |
| `AWS_SECRET_ACCESS_KEY` | Credenciales AWS                    |
| `S3_BUCKET`             | Nombre del bucket en S3             |
| `N8N_WEBHOOK_URL`       | URL del webhook de n8n              |
