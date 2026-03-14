# routes/ — Mapeo de URLs

Las rutas son el **punto de entrada** de cada petición a la API. Responden una sola pregunta: **"Cuando alguien llama esta URL, ¿qué función debe ejecutarse?"**

## Cómo Funciona

```javascript
// Esto dice: cuando alguien llame GET /api/athletes, ejecuta controller.getAll
router.get('/', auth, controller.getAll);
```

Cada ruta tiene tres partes:
1. **Método HTTP** — `get`, `post`, `put`, `delete`
2. **Path** — la URL después de `/api/athletes` (ej: `/:id` significa `/api/athletes/5`)
3. **Handlers** — middleware y/o función del controlador a ejecutar

## Conexión con Otras Carpetas

```
routes/ usa:
  ├── middleware/auth.js  → para proteger rutas (solo usuarios logueados)
  └── controllers/        → para manejar la lógica real
```

## Archivos en Esta Carpeta

| Archivo | URL Base | Estado |
|---------|---------|--------|
| auth.js | `/api/auth` | ✅ LISTO — register, login |
| workouts.js | `/api/workouts` | ✅ LISTO — subir .FIT, guardar feedback, listar, análisis, stats |
| athletes.js | `/api/athletes` | ✅ LISTO — CRUD de atletas |
| finances.js | `/api/finances` | ✅ LISTO — gestión de pagos |
| plans.js | `/api/plans` | ✅ LISTO — planes de entrenamiento y sesiones planificadas |

## Cómo se Montan las Rutas

En `server.js`, cada router se "monta" en un path base:

```javascript
app.use('/api/auth',     authRouter);
app.use('/api/athletes', athletesRouter);
app.use('/api/workouts', workoutsRouter);
app.use('/api/finances', financesRouter);
app.use('/api/plans',    plansRouter);
```

Entonces si `athletes.js` define `router.get('/:id', ...)`, la URL completa es `/api/athletes/:id`.

## El Middleware `auth`

Cuando ves `auth` antes del controlador, significa que esa ruta está **protegida**:

```javascript
router.get('/', auth, controller.getAll);   // necesita token JWT
router.post('/login', controller.login);     // sin auth (el usuario está iniciando sesión)
```

El middleware `auth` verifica el token JWT. Si es válido, agrega `req.trainer` con la info del entrenador. Si no, devuelve 401 (no autorizado).
