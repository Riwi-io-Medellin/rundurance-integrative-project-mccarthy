# models/ — Consultas a la Base de Datos

Los modelos son la **única** capa que habla con PostgreSQL. Cada archivo de modelo contiene funciones que ejecutan consultas SQL y devuelven los resultados.

## Qué Hace un Modelo (Siempre el Mismo Patrón)

```javascript
async function findById(athleteId) {
  const { rows } = await db.query(
    'SELECT * FROM athlete WHERE athlete_id = $1',
    [athleteId]
  );
  return rows[0] ?? null;
}
```

Cada función de modelo sigue estos pasos:
1. Llama `db.query(sql, params)` — ejecuta la consulta SQL
2. Desestructura `{ rows }` — PostgreSQL siempre devuelve un objeto con un array `rows`
3. Devuelve los datos — ya sea `rows` (array), `rows[0]` (objeto único), o `rows[0] ?? null`

## Concepto Clave: Consultas Parametrizadas ($1, $2, ...)

**NUNCA** hagas esto (vulnerabilidad de inyección SQL):
```javascript
// MAL — un hacker podría enviar input malicioso
db.query(`SELECT * FROM athlete WHERE email = '${email}'`);
```

**SIEMPRE** haz esto:
```javascript
// BIEN — PostgreSQL escapa el valor de forma segura
db.query('SELECT * FROM athlete WHERE email = $1', [email]);
```

El `$1` es un placeholder. El valor real viene del array `[email]`. PostgreSQL maneja el escapado para que los hackers no puedan inyectar SQL.

## Operaciones SQL Comunes

| Operación | SQL | Devuelve |
|-----------|-----|---------|
| Obtener todos | `SELECT * FROM tabla WHERE condicion` | `rows` (array) |
| Obtener uno | `SELECT * FROM tabla WHERE id = $1` | `rows[0] ?? null` |
| Crear | `INSERT INTO tabla (...) VALUES ($1,$2) RETURNING *` | `rows[0]` (la fila nueva) |
| Actualizar | `UPDATE tabla SET col=$1 WHERE id=$2 RETURNING *` | `rows[0]` (la fila actualizada) |
| Borrado lógico | `UPDATE tabla SET is_active=FALSE WHERE id=$1` | `rows[0]` |

El `RETURNING *` al final hace que PostgreSQL devuelva la fila que acaba de crear/actualizar, para poder enviarla de vuelta al frontend.

## Conexión con Otras Carpetas

```
models/ usa:
  └── db/connection.js → el pool de conexión a la base de datos

models/ es usado por:
  └── controllers/     → los controladores llaman funciones del modelo para obtener/guardar datos
```

## Archivos en Esta Carpeta

| Archivo | Tabla(s) | Estado |
|---------|---------|--------|
| userModel.js | `trainer` | ✅ LISTO — findByEmail, createTrainer |
| workoutModel.js | `completed_workout`, `completed_workout_lap`, `workout_feedback`, `planned_workout` | ✅ LISTO |
| athleteModel.js | `athlete` | ✅ LISTO — CRUD completo |
| financeModel.js | `payment` | ✅ LISTO — operaciones de pago + lógica de período de gracia |
| planModel.js | `workout_plan`, `planned_workout` | ✅ LISTO — CRUD de planes y sesiones planificadas |

## Dónde Encontrar las Definiciones de Tablas

Todas las columnas y tipos están definidos en `docs/database/schema.sql`. Siempre consúltalo antes de escribir una consulta para conocer los nombres exactos de columnas y tipos.
