# controllers/ — Manejadores de Peticiones (El Cerebro)

Los controladores son el **cerebro** de cada petición. Reciben la petición HTTP, deciden qué hacer, llaman al modelo y envían la respuesta.

## Qué Hace un Controlador (Siempre el Mismo Patrón)

```javascript
async function create(req, res) {
  try {
    // 1. Extraer datos de la petición
    const { first_name, last_name } = req.body;

    // 2. Validar (devolver 400 si algo está mal)
    if (!first_name) return res.status(400).json({ error: 'Nombre requerido' });

    // 3. Llamar al modelo (operación en la base de datos)
    const athlete = await athleteModel.create({ first_name, last_name });

    // 4. Devolver el resultado como JSON
    return res.status(201).json(athlete);
  } catch (err) {
    // 5. Si algo falla, devolver 500
    console.error('Error:', err);
    return res.status(500).json({ error: 'Error interno' });
  }
}
```

## De Dónde Vienen los Datos en `req`

| Propiedad | Qué contiene | Ejemplo |
|-----------|-------------|---------|
| `req.body` | Datos JSON enviados por el frontend (POST/PUT) | `{ "first_name": "Juan", "email": "juan@mail.com" }` |
| `req.params` | Valores del path de la URL | `/api/athletes/:id` → `req.params.id = "5"` |
| `req.query` | Valores del query string | `?limit=10` → `req.query.limit = "10"` |
| `req.trainer` | Info del entrenador logueado (asignado por el middleware de auth) | `{ trainer_id: 1, email: "coach@mail.com" }` |
| `req.files` | Archivos subidos (asignado por multer) | El buffer del archivo .FIT |

## Códigos HTTP Usados

| Código | Significado | Cuándo usarlo |
|--------|------------|---------------|
| 200 | OK | GET, PUT exitosos |
| 201 | Creado | POST exitoso (algo fue creado) |
| 400 | Petición incorrecta | Input faltante o inválido |
| 401 | No autorizado | Sin token o token inválido |
| 403 | Prohibido | Token válido pero sin permiso |
| 404 | No encontrado | El ID no existe en la base de datos |
| 409 | Conflicto | Email/documento duplicado |
| 500 | Error del servidor | Algo falló (bloque catch) |

## Conexión con Otras Carpetas

```
controllers/ usa:
  ├── models/     → para leer/escribir datos de la base de datos
  └── services/   → para tareas especializadas (S3, parseo .FIT, n8n)

controllers/ es usado por:
  └── routes/     → las rutas llaman a las funciones del controlador
```

## Archivos en Esta Carpeta

| Archivo | Estado | Qué maneja |
|---------|--------|-----------|
| authController.js | ✅ LISTO | Registro y login (crea tokens JWT) |
| workoutController.js | ✅ LISTO | Subir .FIT, guardar feedback, listar sesiones, análisis |
| athleteController.js | ✅ LISTO | Crear, leer, actualizar, desactivar atletas |
| financeController.js | ✅ LISTO | Crear pagos, listar pagos, marcar como pagado |
| planController.js | ✅ LISTO | CRUD de planes y sesiones planificadas |
