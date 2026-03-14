# middleware/ — Interceptores de Peticiones

El middleware se ejecuta **entre** la ruta y el controlador. Puede inspeccionar, modificar o rechazar una petición antes de que llegue al controlador.

## Cómo Funciona

```
Petición → Ruta → [Middleware] → Controlador
                      ↑
              Si el token es inválido,
              la petición SE DETIENE aquí
              y devuelve error 401
```

## Archivo: auth.js

Es el único middleware del proyecto. Hace lo siguiente:

1. Lee el header `Authorization` de la petición
2. Espera el formato: `Bearer eyJhbGciOi...` (el token JWT)
3. Verifica el token usando `JWT_SECRET` del `.env`
4. Si es válido: agrega el objeto `req.trainer` con `{ trainer_id, email, role }` y llama `next()` para continuar
5. Si es inválido o falta: devuelve `401 Unauthorized` y la petición se detiene

## Por Qué Importa

Después de que `auth` se ejecuta, cada controlador puede acceder a `req.trainer.trainer_id` para saber **qué entrenador** está haciendo la petición. Así es como garantizamos que los entrenadores solo vean sus propios atletas y pagos — filtramos por `trainer_id` en cada consulta.

## Conexión con Otras Carpetas

```
middleware/auth.js es usado por:
  ├── routes/athletes.js  → protege todos los endpoints de atletas
  ├── routes/workouts.js  → protege la subida y listado (pero NO el callback de feedback de n8n)
  ├── routes/finances.js  → protege todos los endpoints de finanzas
  └── routes/plans.js     → protege todos los endpoints de planes
```

Nota: La ruta `POST /api/workouts/:id/feedback` NO usa auth — porque n8n (un servicio externo) la llama, y n8n no tiene un token JWT. En su lugar, usa un `x-webhook-secret` opcional.
