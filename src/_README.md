# src/ — Backend (Código del Servidor)

Todo lo que está dentro de `src/` se ejecuta en el **servidor** (Node.js). El usuario nunca ve este código directamente — procesa las peticiones y habla con la base de datos.

## Estructura de Carpetas

```
src/
├── routes/        → Paso 1: Recibe la petición HTTP (la URL)
├── middleware/    → Paso 1.5: Verifica si el usuario está autenticado (token JWT)
├── controllers/   → Paso 2: Procesa la petición (valida, decide qué hacer)
├── models/        → Paso 3: Habla con PostgreSQL (consultas SQL)
├── services/      → Herramientas especializadas (parseo de archivos, S3, webhooks)
└── db/            → Configuración de la conexión a la base de datos
```

## Cómo se Conectan (El Recorrido de una Petición)

Cuando alguien llama `GET /api/athletes`, esto es lo que ocurre paso a paso:

```
1. server.js                     → Express recibe la petición
2. routes/athletes.js            → Asocia "/api/athletes" a una función del controlador
3. middleware/auth.js             → Verifica el token JWT (¿está el usuario logueado?)
4. controllers/athleteController.js → Valida el input, llama al modelo
5. models/athleteModel.js         → Ejecuta la consulta SQL contra PostgreSQL
6. controllers/athleteController.js → Recibe los datos, envía la respuesta JSON
```

Los datos fluyen HACIA ABAJO (petición) y luego de VUELTA HACIA ARRIBA (respuesta). Cada capa tiene UN solo trabajo:
- **Routes** = "¿qué URL va a qué función?"
- **Middleware** = "¿está permitida esta petición?"
- **Controllers** = "¿qué hago con esta petición?"
- **Models** = "¿qué datos necesito de la base de datos?"
- **Services** = "necesito ayuda con algo específico (S3, archivos .FIT, n8n)"

## Concepto Clave: ¿Por Qué Capas Separadas?

Si se pusiera todo en un solo archivo, sería imposible de mantener. Al separar:
- Se puede cambiar cómo funciona la base de datos (modelo) sin tocar el manejo de peticiones (controlador)
- Se pueden agregar nuevas rutas sin reescribir la lógica de negocio
- Varias rutas pueden reutilizar la misma función del modelo
- Diferentes desarrolladores pueden trabajar en capas distintas sin conflictos
